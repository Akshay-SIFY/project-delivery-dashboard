import { ensureSchema, pool } from "@/lib/db"

export async function GET() {
  try {
    await ensureSchema()

    const result = await pool.query(`
      SELECT
        id::text,
        name,
        avatar,
        role
      FROM team_members
      ORDER BY id DESC
    `)

    return Response.json(result.rows)
  } catch (error) {
    console.error("GET /api/team error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch team members" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    await ensureSchema()

    const body = await req.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const role = typeof body.role === "string" ? body.role.trim() : ""
    const avatar = typeof body.avatar === "string" ? body.avatar.trim() : ""

    if (!name || !role) {
      return Response.json(
        { error: "name and role are required" },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `
      INSERT INTO team_members (name, avatar, role)
      VALUES ($1, $2, $3)
      RETURNING
        id::text,
        name,
        avatar,
        role
      `,
      [name, avatar, role]
    )

    return Response.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("POST /api/team error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to create team member" },
      { status: 500 }
    )
  }
}
