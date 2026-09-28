import { ensureSchema, pool } from "@/lib/db"

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string")
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string")
    } catch {}
  }
  return []
}

function mapRow(row: Record<string, unknown>) {
  return { ...row, assignees: parseList(row.assignees) }
}

export async function GET() {
  try {
    await ensureSchema()
    const result = await pool.query(`
      SELECT id::text, title, description, status, assignees,
             task_id::text AS "taskId", start_date AS "startDate",
             due_date AS "dueDate", remarks, notes, created_at AS "createdAt"
      FROM subtasks ORDER BY id DESC
    `)
    return Response.json(result.rows.map(mapRow))
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Failed to fetch subtasks" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureSchema()
    const body = await req.json()
    const title = typeof body.title === "string" ? body.title.trim() : ""
    const taskId = typeof body.taskId === "string" ? body.taskId : ""
    if (!title || !taskId) return Response.json({ error: "title and taskId are required" }, { status: 400 })
    const result = await pool.query(`
      INSERT INTO subtasks (title, description, status, task_id, assignees, start_date, due_date, remarks, notes)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
      RETURNING id::text, title, description, status, assignees, task_id::text AS "taskId",
                start_date AS "startDate", due_date AS "dueDate", remarks, notes, created_at AS "createdAt"
    `, [title, typeof body.description === "string" ? body.description.trim() : "", typeof body.status === "string" ? body.status : "todo", taskId, JSON.stringify(Array.isArray(body.assignees) ? body.assignees : []), body.startDate || null, body.dueDate || null, body.remarks || null, body.notes || null])
    return Response.json(mapRow(result.rows[0]), { status: 201 })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Failed to create subtask" }, { status: 500 })
  }
}
