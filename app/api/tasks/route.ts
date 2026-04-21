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

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
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
      FROM tasks
      ORDER BY id DESC
    `)

    const rows = result.rows.map((row) => ({
      ...row,
      assignees: parseList(row.assignees),
      dependencies: parseList(row.dependencies),
    }))

    return Response.json(rows)
  } catch (error) {
    console.error("GET /api/tasks error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
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
    const createdAt = new Date().toISOString().split("T")[0]

    const result = await pool.query(
      `
      INSERT INTO tasks
      (title, description, priority, status, assignees, dependencies, start_date, due_date, project_id, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
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
      [title, description, priority, status, assignees, dependencies, startDate, dueDate, projectId, createdAt]
    )

    const row = result.rows[0]
    return Response.json({
      ...row,
      assignees: parseList(row.assignees),
      dependencies: parseList(row.dependencies),
    })
  } catch (error) {
    console.error("POST /api/tasks error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
