import { createSessionToken, getSessionCookieName } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const username = typeof body?.username === "string" ? body.username : ""
  const password = typeof body?.password === "string" ? body.password : ""

  const appUsername = process.env.APP_USERNAME
  const appPassword = process.env.APP_PASSWORD
  const sessionSecret = process.env.SESSION_SECRET

  if (!appUsername || !appPassword || !sessionSecret) {
    return NextResponse.json({ error: "Missing auth environment variables" }, { status: 500 })
  }

  if (username !== appUsername || password !== appPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const token = await createSessionToken(username, sessionSecret)
  const isProduction = process.env.NODE_ENV === "production"

  const response = NextResponse.json({ success: true })
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  return response
}
