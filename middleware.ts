import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookieName, verifySessionToken } from "@/lib/auth"

function isAlwaysPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true
  if (pathname.startsWith("/api/auth")) return true
  if (pathname === "/favicon.ico") return true
  if (pathname.startsWith("/icon") || pathname.startsWith("/apple-icon")) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isAlwaysPublicPath(pathname)) {
    return NextResponse.next()
  }

  const sessionSecret = process.env.SESSION_SECRET
  if (!sessionSecret) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const token = request.cookies.get(getSessionCookieName())?.value
  const isValid = await verifySessionToken(token, sessionSecret)

  if (pathname === "/login") {
    return isValid ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next()
  }

  if (!isValid) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/api/:path*"],
}
