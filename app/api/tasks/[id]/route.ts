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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSchema()
    const { id } = await params
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
      UPDATE tasks
      SET
        title = $1,
        description = $2,
        priority = $3,
        status = $4,
        assignees = $5::jsonb,
        dependencies = $6::jsonb,
        remarks = $7,
        notes = $8,
        links = $9::jsonb,
        start_date = $10,
        due_date = $11,
        project_id = $12,
        updated_at = NOW()
      WHERE id = $13
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
      [title, description, priority, status, assignees, dependencies, remarks, notes, links, startDate, dueDate, projectId, id]
    )

    if (result.rowCount === 0) {
      return Response.json({ error: "Task not found" }, { status: 404 })
    }

    return Response.json(mapTaskRow(result.rows[0]))
  } catch (error) {
    console.error("PUT /api/tasks/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update task" },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSchema()
    const { id } = await params

    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id])

    if (result.rowCount === 0) {
      return Response.json({ error: "Task not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to delete task" },
      { status: 500 }
    )
  }
}
