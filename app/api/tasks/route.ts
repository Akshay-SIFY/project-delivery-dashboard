import { ensureSchema, pool } from "@/lib/db"

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string")
      }
    } catch {
      return []
    }
  }

  return []
}

function mapTaskRow(row: Record<string, unknown>) {
  return {
    ...row,
    assignees: parseList(row.assignees),
    dependencies: parseList(row.dependencies),
    links: parseList(row.links),
  }
}

export async function GET() {
  try {
    await ensureSchema()

    const result = await pool.query(`
      SELECT
        id::text,
        title,
        description,
        priority,
        status,
        assignees,
        dependencies,
        remarks,
        notes,
        links,
        start_date AS "startDate",
        due_date AS "dueDate",
        project_id::text AS "projectId",
        created_at AS "createdAt"
      FROM tasks
      ORDER BY id DESC
    `)

    return Response.json(result.rows.map(mapTaskRow))
  } catch (error) {
    console.error("GET /api/tasks error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    await ensureSchema()
    const body = await req.json()

    const title = typeof body.title === "string" ? body.title.trim() : ""
    const description = typeof body.description === "string" ? body.description.trim() : ""
    const priority = typeof body.priority === "string" ? body.priority : "medium"
    const status = typeof body.status === "string" ? body.status : "todo"
    const assignees = JSON.stringify(Array.isArray(body.assignees) ? body.assignees : [])
    const dependencies = JSON.stringify(Array.isArray(body.dependencies) ? body.dependencies : [])
    const remarks = typeof body.remarks === "string" ? body.remarks : null
    const notes = typeof body.notes === "string" ? body.notes : null
    const links = JSON.stringify(Array.isArray(body.links) ? body.links : [])
    const startDate = typeof body.startDate === "string" && body.startDate ? body.startDate : null
    const dueDate = typeof body.dueDate === "string" && body.dueDate ? body.dueDate : null
    const projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null

    if (!title) {
      return Response.json({ error: "title is required" }, { status: 400 })
    }

    const result = await pool.query(
      `
      INSERT INTO tasks
      (title, description, priority, status, assignees, dependencies, remarks, notes, links, start_date, due_date, project_id)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9::jsonb, $10, $11, $12)
      RETURNING
        id::text,
        title,
        description,
        priority,
        status,
        assignees,
        dependencies,
        remarks,
        notes,
        links,
        start_date AS "startDate",
        due_date AS "dueDate",
        project_id::text AS "projectId",
        created_at AS "createdAt"
      `,
      [title, description, priority, status, assignees, dependencies, remarks, notes, links, startDate, dueDate, projectId]
    )

    return Response.json(mapTaskRow(result.rows[0]), { status: 201 })
  } catch (error) {
    console.error("POST /api/tasks error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to create task" },
      { status: 500 }
    )
  }
}
