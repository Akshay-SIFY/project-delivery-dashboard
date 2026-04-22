import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const name = body.name
    const status = body.status ?? "active"
    const description = body.description ?? ""
    const dueDate = body.dueDate ?? ""
    const color = body.color ?? "oklch(0.55 0.15 195)"
    const slug = generateSlug(name)

    const result = await pool.query(
      `
      UPDATE projects
      SET
        name = $1,
        slug = $2,
        description = $3,
        status = $4,
        due_date = $5,
        color = $6
      WHERE id = $7
      RETURNING
        id::text,
        name,
        slug,
        description,
        status,
        progress,
        tasks_count AS "tasksCount",
        completed_tasks AS "completedTasks",
        due_date AS "dueDate",
        created_at AS "createdAt",
        color
      `,
      [name, slug, description, status, dueDate, color, id]
    )

    if (result.rowCount === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 })
    }

    return Response.json(result.rows[0])
  } catch (error) {
    console.error("PUT /api/projects/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await pool.query("DELETE FROM tasks WHERE project_id = $1", [id])
    const result = await pool.query("DELETE FROM projects WHERE id = $1", [id])

    if (result.rowCount === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
