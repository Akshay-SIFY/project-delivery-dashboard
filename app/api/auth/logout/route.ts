import { getSessionCookieName } from "@/lib/auth"

export async function POST() {
  const response = Response.json({ success: true })
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  })

  return response
}
