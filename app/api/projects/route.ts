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

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
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
      FROM projects
      ORDER BY id DESC
    `)

    return Response.json(result.rows)
  } catch (error) {
    console.error("GET /api/projects error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const name = body.name
    const status = body.status ?? "active"
    const slug = generateSlug(name)
    const description = body.description ?? ""
    const dueDate = body.dueDate ?? ""
    const createdAt = new Date().toISOString().split("T")[0]
    const color = body.color ?? "oklch(0.55 0.15 195)"
    const tasksCount = 0
    const completedTasks = 0
    const progress = 0

    const result = await pool.query(
      `
      INSERT INTO projects
      (name, slug, description, status, progress, tasks_count, completed_tasks, due_date, created_at, color)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
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
      [name, slug, description, status, progress, tasksCount, completedTasks, dueDate, createdAt, color]
    )

    return Response.json(result.rows[0])
  } catch (error) {
    console.error("POST /api/projects error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()

    const id = body.id
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

    return Response.json(result.rows[0])
  } catch (error) {
    console.error("PUT /api/projects error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    await pool.query("DELETE FROM tasks WHERE project_id = $1", [id])
    await pool.query("DELETE FROM projects WHERE id = $1", [id])

    return Response.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/projects error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
