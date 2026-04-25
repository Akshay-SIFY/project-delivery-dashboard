import { ensureSchema, pool } from "@/lib/db"

function parseAssignees(value: unknown): string[] {
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
    await ensureSchema()
    const { id } = await params
    const body = await req.json()

    const name = typeof body.name === "string" ? body.name.trim() : ""
    const role = typeof body.role === "string" ? body.role.trim() : ""
    const avatar = typeof body.avatar === "string" ? body.avatar.trim() : ""

    if (!name || !role) {
      return Response.json({ error: "name and role are required" }, { status: 400 })
    }

    const currentResult = await pool.query(`SELECT name FROM team_members WHERE id = $1`, [id])

    if (currentResult.rowCount === 0) {
      return Response.json({ error: "Team member not found" }, { status: 404 })
    }

    const previousName = currentResult.rows[0].name as string

    const result = await pool.query(
      `
      UPDATE team_members
      SET name = $1, avatar = $2, role = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING
        id::text,
        name,
        avatar,
        role
      `,
      [name, avatar, role, id]
    )

    if (previousName !== name) {
      const tasksResult = await pool.query(`SELECT id::text, assignees FROM tasks WHERE assignees IS NOT NULL`)

      for (const task of tasksResult.rows) {
        const assignees = parseAssignees(task.assignees)
        if (!assignees.includes(previousName)) continue

        const updatedAssignees = assignees.map((assignee) => (assignee === previousName ? name : assignee))

        await pool.query(`UPDATE tasks SET assignees = $1, updated_at = NOW() WHERE id = $2`, [
          JSON.stringify(updatedAssignees),
          task.id,
        ])
      }
    }

    return Response.json(result.rows[0])
  } catch (error) {
    console.error("PUT /api/team/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update team member" },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSchema()
    const { id } = await params

    const currentResult = await pool.query(`SELECT id::text, name, avatar, role FROM team_members WHERE id = $1`, [id])

    if (currentResult.rowCount === 0) {
      return Response.json({ error: "Team member not found" }, { status: 404 })
    }

    const deletedMember = currentResult.rows[0]
    const memberName = deletedMember.name as string

    await pool.query(`DELETE FROM team_members WHERE id = $1`, [id])

    const tasksResult = await pool.query(`SELECT id::text, assignees FROM tasks WHERE assignees IS NOT NULL`)
    const affectedTasks: Array<{ id: string; assignees: string[] }> = []

    for (const task of tasksResult.rows) {
      const assignees = parseAssignees(task.assignees)
      if (!assignees.includes(memberName)) continue

      const updatedAssignees = assignees.filter((assignee) => assignee !== memberName)
      await pool.query(`UPDATE tasks SET assignees = $1, updated_at = NOW() WHERE id = $2`, [
        JSON.stringify(updatedAssignees),
        task.id,
      ])

      affectedTasks.push({ id: task.id, assignees: updatedAssignees })
    }

    return Response.json({ success: true, deletedMember, affectedTasks })
  } catch (error) {
    console.error("DELETE /api/team/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to delete team member" },
      { status: 500 }
    )
  }
}
