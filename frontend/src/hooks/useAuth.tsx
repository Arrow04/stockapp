"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { AuthUser, getToken, getStoredUser, clearSession, authApi } from "@/lib/auth"

type Ctx = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string, code?: string) => Promise<any>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    if (!getToken()) { setUser(null); setLoading(false); return }
    try {
      const u = await authApi.me()
      setUser(u)
    } catch {
      clearSession()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setUser(getStoredUser()); refresh() }, [])

  const login = async (email: string, password: string, code?: string) => {
    const data = await authApi.login(email, password, code)
    if (data.access_token) {
      const { saveSession } = await import("@/lib/auth")
      saveSession(data.access_token, data.user)
      setUser(data.user)
    }
    return data
  }

  const logout = () => { clearSession(); setUser(null); window.location.href = "/" }

  return <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}

/** Redirect to login if not authenticated. Call at the top of protected pages. */
import { useEffect as _useEffect } from "react"
import { useRouter as _useRouter } from "next/navigation"
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = _useRouter()
  _useEffect(() => {
    if (!loading && !user) router.push("/")
  }, [user, loading, router])
  return { user, loading }
}
