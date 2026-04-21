import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const title = body.title
    const description = body.description ?? ""
    const priority = body.priority ?? "medium"
    const status = body.status ?? "todo"
    const assignees = JSON.stringify(Array.isArray(body.assignees) ? body.assignees : [])
    const dependencies = JSON.stringify(Array.isArray(body.dependencies) ? body.dependencies : [])
    const startDate = body.startDate
    const dueDate = body.dueDate
    const projectId = body.projectId

    const result = await pool.query(
      `
      UPDATE tasks
      SET
        title = $1,
        description = $2,
        priority = $3,
        status = $4,
        assignees = $5,
        dependencies = $6,
        start_date = $7,
        due_date = $8,
        project_id = $9
      WHERE id = $10
      RETURNING
        id::text,
        title,
        description,
        priority,
        status,
        assignees,
        dependencies,
        start_date AS "startDate",
        due_date AS "dueDate",
        project_id::text AS "projectId",
        created_at AS "createdAt"
      `,
      [title, description, priority, status, assignees, dependencies, startDate, dueDate, projectId, id]
    )

    if (result.rowCount === 0) {
      return Response.json({ error: "Task not found" }, { status: 404 })
    }

    const row = result.rows[0]
    return Response.json({
      ...row,
      assignees: parseList(row.assignees),
      dependencies: parseList(row.dependencies),
    })
  } catch (error) {
    console.error("PUT /api/tasks/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id])

    if (result.rowCount === 0) {
      return Response.json({ error: "Task not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
