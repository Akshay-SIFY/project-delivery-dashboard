import { ensureSchema, pool } from "@/lib/db"

const VALID_STATUSES = new Set(["todo", "in-progress", "completed"])
const VALID_PRIORITIES = new Set(["low", "medium", "high"])

interface ImportInputRow {
  rowNumber?: number
  projectName?: unknown
  projectId?: unknown
  taskName?: unknown
  title?: unknown
  description?: unknown
  assignedTo?: unknown
  assignee?: unknown
  assignees?: unknown
  dependencies?: unknown
  startDate?: unknown
  endDate?: unknown
  dueDate?: unknown
  status?: unknown
  priority?: unknown
  remarks?: unknown
  notes?: unknown
  links?: unknown
}

interface FailedImportRow {
  rowNumber: number
  reason: string
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeStatus(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "-")
  const aliases: Record<string, string> = {
    "to-do": "todo",
    "in progress": "in-progress",
    done: "completed",
  }

  return aliases[normalized] ?? normalized
}

function normalizePriority(value: string): string {
  return value.trim().toLowerCase()
}

function toStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((entry) => asTrimmedString(entry))
      .filter((entry) => entry.length > 0)
  }

  const str = asTrimmedString(input)
  if (!str) return []

  return str
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function parseDateToISO(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    const ms = value * 24 * 60 * 60 * 1000
    const asDate = new Date(excelEpoch.getTime() + ms)
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toISOString().slice(0, 10)
    }
  }

  const str = asTrimmedString(value)
  if (!str) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str
  }

  const dayMonthYearMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (dayMonthYearMatch) {
    const first = Number(dayMonthYearMatch[1])
    const second = Number(dayMonthYearMatch[2])
    const year = Number(dayMonthYearMatch[3])

    let day = first
    let month = second

    if (first > 12 && second <= 12) {
      day = first
      month = second
    } else if (second > 12 && first <= 12) {
      month = first
      day = second
    } else if (str.includes("-")) {
      // Prefer DD-MM-YYYY for dash-separated dates.
      day = first
      month = second
    } else {
      // Ambiguous slash-separated format defaults to MM/DD/YYYY.
      month = first
      day = second
    }

    const parsed = new Date(Date.UTC(year, month - 1, day))
    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return parsed.toISOString().slice(0, 10)
    }
    return null
  }

  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const numeric = Number(str)
    if (!Number.isNaN(numeric)) {
      return parseDateToISO(numeric)
    }
  }

  const parsed = new Date(str)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString().slice(0, 10)
}

export async function POST(req: Request) {
  try {
    await ensureSchema()

    const body = await req.json().catch(() => ({})) as { tasks?: unknown }
    const tasks = Array.isArray(body.tasks) ? (body.tasks as ImportInputRow[]) : []

    if (tasks.length === 0) {
      return Response.json(
        {
          totalRows: 0,
          importedCount: 0,
          failedCount: 0,
          imported: [],
          failedRows: [],
          error: "No rows provided",
        },
        { status: 400 },
      )
    }

    const projectMap = new Map<string, string>()
    const projectRows = await pool.query("SELECT id::text AS id, name FROM projects")
    projectRows.rows.forEach((row) => {
      if (typeof row.name === "string") {
        projectMap.set(row.name.trim().toLowerCase(), String(row.id))
      }
    })

    const teamNames = new Set<string>()
    const teamRows = await pool.query("SELECT name FROM team_members")
    teamRows.rows.forEach((row) => {
      if (typeof row.name === "string") {
        teamNames.add(row.name.trim().toLowerCase())
      }
    })

    const imported: Array<Record<string, unknown>> = []
    const failedRows: FailedImportRow[] = []

    for (let index = 0; index < tasks.length; index++) {
      const row = tasks[index] ?? {}
      const rowNumber = typeof row.rowNumber === "number" && row.rowNumber > 0 ? row.rowNumber : index + 2

      try {
        const title = asTrimmedString(row.taskName ?? row.title)
        if (!title) {
          failedRows.push({ rowNumber, reason: "Missing task title" })
          continue
        }

        const description = asTrimmedString(row.description)
        const statusInput = asTrimmedString(row.status)
        const priorityInput = asTrimmedString(row.priority)
        const status = statusInput ? normalizeStatus(statusInput) : "todo"
        const priority = priorityInput ? normalizePriority(priorityInput) : "medium"

        if (!VALID_STATUSES.has(status)) {
          failedRows.push({ rowNumber, reason: `Invalid status value: ${statusInput}` })
          continue
        }

        if (!VALID_PRIORITIES.has(priority)) {
          failedRows.push({ rowNumber, reason: `Invalid priority value: ${priorityInput}` })
          continue
        }

        const startDateSource = row.startDate
        const dueDateSource = row.endDate ?? row.dueDate
        const startDate = parseDateToISO(startDateSource)
        const dueDate = parseDateToISO(dueDateSource)

        if (asTrimmedString(startDateSource) && !startDate) {
          failedRows.push({ rowNumber, reason: "Invalid start date format" })
          continue
        }

        if (asTrimmedString(dueDateSource) && !dueDate) {
          failedRows.push({ rowNumber, reason: "Invalid date format" })
          continue
        }

        if (startDate && dueDate && dueDate < startDate) {
          failedRows.push({ rowNumber, reason: "End date cannot be before start date" })
          continue
        }

        const assigneeSource = row.assignedTo ?? row.assignee ?? row.assignees
        const assignees = toStringArray(assigneeSource)
        const invalidAssignees = assignees.filter((name) => !teamNames.has(name.toLowerCase()))

        if (invalidAssignees.length > 0) {
          failedRows.push({ rowNumber, reason: `Assignee not found: ${invalidAssignees.join(", ")}` })
          continue
        }

        const dependencies = toStringArray(row.dependencies)
        const links = toStringArray(row.links)

        const projectIdFromName = projectMap.get(asTrimmedString(row.projectName).toLowerCase())
        const projectId = asTrimmedString(row.projectId) || projectIdFromName || null

        if (asTrimmedString(row.projectName) && !projectIdFromName && !asTrimmedString(row.projectId)) {
          failedRows.push({ rowNumber, reason: `Project not found: ${asTrimmedString(row.projectName)}` })
          continue
        }

        const result = await pool.query(
          `
          INSERT INTO tasks
          (title, description, priority, status, assignees, dependencies, remarks, notes, links, start_date, due_date, project_id)
          VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9::jsonb, $10, $11, $12)
          RETURNING id::text AS id, title, status, priority, start_date AS "startDate", due_date AS "dueDate", project_id::text AS "projectId"
          `,
          [
            title,
            description,
            priority,
            status,
            JSON.stringify(assignees),
            JSON.stringify(dependencies),
            asTrimmedString(row.remarks) || null,
            asTrimmedString(row.notes) || null,
            JSON.stringify(links),
            startDate,
            dueDate,
            projectId,
          ],
        )

        imported.push(result.rows[0])
      } catch (error) {
        failedRows.push({
          rowNumber,
          reason: error instanceof Error ? error.message : "Unexpected import error",
        })
      }
    }

    return Response.json({
      totalRows: tasks.length,
      importedCount: imported.length,
      failedCount: failedRows.length,
      imported,
      failedRows,
    })
  } catch (error) {
    console.error("POST /api/tasks/import error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to import tasks" },
      { status: 500 },
    )
  }
}
