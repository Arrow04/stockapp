"use client"

const API = "http://localhost:8000/api/auth"
const TOKEN_KEY = "stockapp_token"
const USER_KEY = "stockapp_user"

import type { AuthUser } from "@/models"
export type { AuthUser } from "@/models"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_KEY)
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.setItem("user", user.email) // legacy
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem("user")
}

async function req(path: string, body?: any, token?: string, method?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const m = method || (body ? "POST" : "GET")
  const res = await fetch(API + path, {
    method: m,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || "Request failed")
  return data
}

export const authApi = {
  register: (email: string, name: string, password: string) => req("/register", { email, name, password }),
  login: (email: string, password: string, code?: string) => req("/login", { email, password, code }),
  me: () => req("/me", undefined, getToken() || undefined),
  setup2FA: () => req("/2fa/setup", undefined, getToken() || undefined, "POST"),
  enable2FA: (secret: string, code: string) => req("/2fa/enable", { secret, code }, getToken() || undefined),
  disable2FA: (password: string) => req("/2fa/disable", { password }, getToken() || undefined),
  listUsers: () => req("/users", undefined, getToken() || undefined),
}
