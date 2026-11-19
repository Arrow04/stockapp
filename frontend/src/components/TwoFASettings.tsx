"use client"

import { useState } from "react"
import { authApi, getStoredUser, saveSession } from "@/lib/auth"
import { useAuth } from "@/hooks/useAuth"

export default function TwoFASettings() {
  const { user, refresh } = useAuth()
  const [step, setStep] = useState<"view" | "setup" | "disable">("view")
  const [qr, setQr] = useState("")
  const [secret, setSecret] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const startSetup = async () => {
    setError(""); setLoading(true)
    try { const d = await authApi.setup2FA(); setQr(d.qr); setSecret(d.secret); setStep("setup") }
    catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const confirmEnable = async () => {
    setError(""); setLoading(true)
    try {
      const d = await authApi.enable2FA(secret, code)
      setMsg("2FA enabled! Save your backup codes: " + d.backup_codes.join(", "))
      await refresh(); setStep("view")
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const confirmDisable = async () => {
    setError(""); setLoading(true)
    try {
      const d = await authApi.disable2FA(password)
      setMsg(d.message); await refresh(); setStep("view"); setPassword("")
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  if (user?.is_2fa_enabled && step === "view") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
            <div><p className="text-sm font-semibold text-emerald-800">Two-Factor Authentication is ON</p><p className="text-xs text-emerald-600">Your account is protected with TOTP</p></div>
          </div>
          <button onClick={() => setStep("disable")} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">Disable</button>
        </div>
        {msg && <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{msg}</p>}
      </div>
    )
  }

  if (step === "setup") {
    return (
      <div className="space-y-4 p-4 rounded-xl border border-slate-200">
        <h3 className="font-semibold text-slate-900">Set up Two-Factor Authentication</h3>
        <p className="text-sm text-slate-500">1. Scan this QR code with Google Authenticator or any TOTP app.</p>
        <div className="flex justify-center bg-white p-4 rounded-lg border border-slate-100">
          <img src={qr} alt="2FA QR code" className="w-40 h-40" />
        </div>
        <p className="text-xs text-slate-400 break-all">Manual key: <b className="text-slate-700">{secret}</b></p>
        <p className="text-sm text-slate-500">2. Enter the 6-digit code from the app to confirm.</p>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="000000" inputMode="numeric" maxLength={6}
          className="w-full px-3 py-3 text-center text-xl tracking-[0.4em] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button onClick={confirmEnable} disabled={loading || code.length < 6} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">Enable 2FA</button>
          <button onClick={() => setStep("view")} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
        </div>
      </div>
    )
  }

  if (step === "disable") {
    return (
      <div className="space-y-4 p-4 rounded-xl border border-red-200 bg-red-50">
        <h3 className="font-semibold text-red-800">Disable Two-Factor Authentication</h3>
        <p className="text-sm text-red-600">Enter your password to confirm.</p>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"
          className="w-full px-3 py-2.5 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400" />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button onClick={confirmDisable} disabled={loading || !password} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">Disable 2FA</button>
          <button onClick={() => setStep("view")} className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          <div><p className="text-sm font-semibold text-amber-800">Two-Factor Authentication is OFF</p><p className="text-xs text-amber-600">Add an extra layer of security to your login</p></div>
        </div>
        <button onClick={startSetup} disabled={loading} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700">Enable</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}