import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET() {
  try {
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
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const name = body.name
    const avatar = body.avatar
    const role = body.role

    const result = await pool.query(
      `
      INSERT INTO team_members (name, avatar, role)
      VALUES ($1,$2,$3)
      RETURNING
        id::text,
        name,
        avatar,
        role
      `,
      [name, avatar, role]
    )

    return Response.json(result.rows[0])
  } catch (error) {
    console.error("POST /api/team error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
