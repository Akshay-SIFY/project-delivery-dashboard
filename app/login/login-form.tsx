"use client"

import { FormEvent, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const nextPath = searchParams.get("next") || "/"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const payload = await response.json().catch(() => ({ error: "Login failed" }))

      if (!response.ok) {
        setError(payload.error || "Invalid username or password")
        return
      }

      router.replace(nextPath)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-6 text-4xl font-bold text-lime-500">
          sify
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Project Management
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Sign in to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Username */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Username
          </label>
          <Input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="h-11 rounded-lg border-slate-300 bg-blue-50 px-4 text-slate-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Password
          </label>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="h-11 rounded-lg border-slate-300 bg-blue-50 px-4 text-slate-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Error */}
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}

        {/* Button */}
        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-lg bg-slate-950 text-base font-semibold text-white hover:bg-slate-800"
        >
          {loading ? "Signing in..." : "Login"}
        </Button>

      </form>
    </div>
  )
}
