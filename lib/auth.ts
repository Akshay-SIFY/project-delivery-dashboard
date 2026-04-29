const COOKIE_NAME = "app_session"
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 // 24 hours

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)

  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))

  return toBase64Url(new Uint8Array(signature))
}

export async function createSessionToken(username: string, secret: string): Promise<string> {
  const payload = JSON.stringify({
    username,
    exp: Date.now() + SESSION_DURATION_MS,
  })

  const encodedPayload = toBase64Url(new TextEncoder().encode(payload))
  const signature = await signPayload(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export async function verifySessionToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false

  const [payloadPart, signaturePart] = token.split(".")
  if (!payloadPart || !signaturePart) return false

  const expectedSignature = await signPayload(payloadPart, secret)
  if (expectedSignature !== signaturePart) return false

  try {
    const payloadBytes = fromBase64Url(payloadPart)
    const payloadString = new TextDecoder().decode(payloadBytes)
    const payload = JSON.parse(payloadString) as { username?: string; exp?: number }

    return typeof payload.username === "string" && typeof payload.exp === "number" && payload.exp > Date.now()
  } catch {
    return false
  }
}

export function getSessionCookieName(): string {
  return COOKIE_NAME
}
