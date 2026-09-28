import { ensureSchema, pool } from "@/lib/db"

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string")
  return []
}

function mapRow(row: Record<string, unknown>) {
  return { ...row, assignees: parseList(row.assignees) }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSchema()
    const { id } = await params
    const body = await req.json()
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title) return Response.json({ error: "title is required" }, { status: 400 })
    const result = await pool.query(`
      UPDATE subtasks SET title=$1, description=$2, status=$3, assignees=$4::jsonb,
      start_date=$5, due_date=$6, remarks=$7, notes=$8, updated_at=NOW() WHERE id=$9
      RETURNING id::text, title, description, status, assignees, task_id::text AS "taskId",
      start_date AS "startDate", due_date AS "dueDate", remarks, notes, created_at AS "createdAt"
    `, [title, body.description || "", body.status || "todo", JSON.stringify(Array.isArray(body.assignees) ? body.assignees : []), body.startDate || null, body.dueDate || null, body.remarks || null, body.notes || null, id])
    if (!result.rowCount) return Response.json({ error: "Subtask not found" }, { status: 404 })
    return Response.json(mapRow(result.rows[0]))
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Failed to update subtask" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSchema()
    const { id } = await params
    const result = await pool.query("DELETE FROM subtasks WHERE id=$1", [id])
    if (!result.rowCount) return Response.json({ error: "Subtask not found" }, { status: 404 })
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Failed to delete subtask" }, { status: 500 })
  }
}
