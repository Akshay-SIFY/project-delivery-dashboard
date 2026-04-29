import { ensureSchema, pool } from "@/lib/db"

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function rowXml(values: unknown[]): string {
  const cells = values
    .map((value) => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`)
    .join("")

  return `<Row>${cells}</Row>`
}

function worksheetXml(name: string, headers: string[], rows: unknown[][]): string {
  const allRows = [rowXml(headers), ...rows.map((row) => rowXml(row))].join("")
  return `<Worksheet ss:Name="${escapeXml(name)}"><Table>${allRows}</Table></Worksheet>`
}

export async function GET() {
  try {
    await ensureSchema()

    const [projectsResult, tasksResult, teamResult] = await Promise.all([
      pool.query(`
        SELECT id::text, name, description, status, progress, tasks_count, completed_tasks, due_date, created_at, color
        FROM projects
        ORDER BY id DESC
      `),
      pool.query(`
        SELECT id::text, title, description, priority, status, assignees, dependencies, remarks, notes, links, start_date, due_date, project_id::text, created_at
        FROM tasks
        ORDER BY id DESC
      `),
      pool.query(`
        SELECT id::text, name, avatar, role
        FROM team_members
        ORDER BY id DESC
      `),
    ])

    const projectsSheet = worksheetXml(
      "Projects",
      ["ID", "Name", "Description", "Status", "Progress", "Tasks Count", "Completed Tasks", "Due Date", "Created At", "Color"],
      projectsResult.rows.map((row) => [
        row.id,
        row.name,
        row.description,
        row.status,
        row.progress,
        row.tasks_count,
        row.completed_tasks,
        row.due_date,
        row.created_at,
        row.color,
      ]),
    )

    const tasksSheet = worksheetXml(
      "Tasks",
      [
        "ID",
        "Title",
        "Description",
        "Priority",
        "Status",
        "Assignees",
        "Dependencies",
        "Remarks",
        "Notes",
        "Links",
        "Start Date",
        "Due Date",
        "Project ID",
        "Created At",
      ],
      tasksResult.rows.map((row) => [
        row.id,
        row.title,
        row.description,
        row.priority,
        row.status,
        JSON.stringify(row.assignees ?? []),
        JSON.stringify(row.dependencies ?? []),
        row.remarks,
        row.notes,
        JSON.stringify(row.links ?? []),
        row.start_date,
        row.due_date,
        row.project_id,
        row.created_at,
      ]),
    )

    const teamSheet = worksheetXml(
      "Team Members",
      ["ID", "Name", "Avatar", "Role"],
      teamResult.rows.map((row) => [row.id, row.name, row.avatar, row.role]),
    )

    const workbook = `<?xml version="1.0" encoding="UTF-8"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:html="http://www.w3.org/TR/REC-html40">
      ${projectsSheet}
      ${tasksSheet}
      ${teamSheet}
      </Workbook>`

    return new Response(workbook, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="project-dashboard-export-${new Date().toISOString().slice(0, 10)}.xls"`,
      },
    })
  } catch (error) {
    console.error("GET /api/export error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to export data" },
      { status: 500 },
    )
  }
}
