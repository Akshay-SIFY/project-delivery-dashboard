import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

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
    const { id } = await params
    const body = await req.json()

    const name = body.name
    const avatar = body.avatar
    const role = body.role

    const currentResult = await pool.query(
      `SELECT name FROM team_members WHERE id = $1`,
      [id]
    )

    if (currentResult.rowCount === 0) {
      return Response.json({ error: "Team member not found" }, { status: 404 })
    }

    const previousName = currentResult.rows[0].name as string

    const result = await pool.query(
      `
      UPDATE team_members
      SET name = $1, avatar = $2, role = $3
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
      const tasksResult = await pool.query(
        `SELECT id::text, assignees FROM tasks WHERE assignees IS NOT NULL`
      )

      for (const task of tasksResult.rows) {
        const assignees = parseAssignees(task.assignees)
        if (!assignees.includes(previousName)) continue

        const updatedAssignees = assignees.map((assignee) =>
          assignee === previousName ? name : assignee
        )

        await pool.query(`UPDATE tasks SET assignees = $1 WHERE id = $2`, [
          JSON.stringify(updatedAssignees),
          task.id,
        ])
      }
    }

    return Response.json(result.rows[0])
  } catch (error) {
    console.error("PUT /api/team/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const currentResult = await pool.query(
      `SELECT name FROM team_members WHERE id = $1`,
      [id]
    )

    if (currentResult.rowCount === 0) {
      return Response.json({ error: "Team member not found" }, { status: 404 })
    }

    const memberName = currentResult.rows[0].name as string

    const deleteResult = await pool.query(`DELETE FROM team_members WHERE id = $1`, [id])

    if (deleteResult.rowCount === 0) {
      return Response.json({ error: "Team member not found" }, { status: 404 })
    }

    const tasksResult = await pool.query(`SELECT id::text, assignees FROM tasks WHERE assignees IS NOT NULL`)

    for (const task of tasksResult.rows) {
      const assignees = parseAssignees(task.assignees)
      if (!assignees.includes(memberName)) continue

      const updatedAssignees = assignees.filter((assignee) => assignee !== memberName)
      await pool.query(`UPDATE tasks SET assignees = $1 WHERE id = $2`, [
        JSON.stringify(updatedAssignees),
        task.id,
      ])
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/team/[id] error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
