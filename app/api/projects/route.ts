import { Pool } from "pg";



const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});



export async function GET() {
  const result = await pool.query("SELECT * FROM projects");
  return Response.json(result.rows);
}



export async function POST(req: Request) {
  const body = await req.json();



  const { name, status } = body;



  const result = await pool.query(
    "INSERT INTO projects (name, status) VALUES ($1, $2) RETURNING *",
    [name, status]
  );



  return Response.json(result. Rows[0]);
}
