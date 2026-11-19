"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { authApi, saveSession } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("admin@stockapp.com")
  const [password, setPassword] = useState("admin123")
  const [code, setCode] = useState("")
  const [needs2FA, setNeeds2FA] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (mode === "register") {
        const data = await authApi.register(email, name, password)
        saveSession(data.access_token, data.user)
        router.push("/dashboard")
      } else {
        const data = await login(email, password, needs2FA ? code : undefined)
        if (data.requires_2fa) { setNeeds2FA(true); return }
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <span className="text-white text-xl font-bold tracking-tight">StockApp</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">Your trading,<br /><span className="text-indigo-400">beautifully simple.</span></h1>
          <p className="text-slate-300 text-lg leading-relaxed">Real Indian market data, powerful analytics, and a dashboard built to help you make smarter decisions — all in one place.</p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            <div className="border-l-2 border-indigo-500 pl-3"><div className="text-sm font-semibold text-white">Real-time</div><div className="text-slate-400 text-xs mt-1">NSE &amp; BSE data</div></div>
            <div className="border-l-2 border-indigo-500 pl-3"><div className="text-sm font-semibold text-white">Analytics</div><div className="text-slate-400 text-xs mt-1">Powerful insights</div></div>
            <div className="border-l-2 border-indigo-500 pl-3"><div className="text-sm font-semibold text-white">Secure</div><div className="text-slate-400 text-xs mt-1">2FA protected</div></div>
          </div>
        </div>
        <div className="relative text-slate-500 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>© 2026 Cyber Sentinel Technology. All rights reserved.</span>
          <a href="https://www.cybersentineltech.online/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">cybersentineltech.online</a>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
            <span className="text-slate-900 text-xl font-bold">StockApp</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">{needs2FA ? "Two-factor authentication" : mode === "login" ? "Welcome back" : "Create account"}</h2>
            <p className="text-slate-500 mt-2">
              {needs2FA ? "Enter the 6-digit code from your authenticator app." : mode === "login" ? "Sign in to your StockApp account." : "Start your journey with StockApp."}
            </p>
          </div>

          <div className="mb-6 flex gap-1 bg-slate-100 rounded-lg p-1">
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setNeeds2FA(false); setError("") }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === m && !needs2FA ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {error && <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <form onSubmit={submit} className="space-y-5">
            {!needs2FA && mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required
                  className="w-full px-3 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}

            {!needs2FA && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full px-3 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}

            {!needs2FA && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required
                    className="w-full px-3 py-3 pr-12 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            )}

            {needs2FA && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Authentication code</label>
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="000000" inputMode="numeric" maxLength={6} required autoFocus
                  className="w-full px-3 py-3 text-center text-2xl tracking-[0.5em] border border-slate-300 rounded-lg text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
              {loading ? "Please wait…" : needs2FA ? "Verify & Sign In" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {needs2FA && <button onClick={() => { setNeeds2FA(false); setCode(""); setError("") }} className="mt-5 w-full text-sm text-slate-500 hover:text-slate-900">← Back to sign in</button>}
        </div>
      </div>
    </div>
  )
}