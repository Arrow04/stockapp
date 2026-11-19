'use client'

import { useRequireAuth } from '@/hooks/useAuth'
import TwoFASettings from '@/components/TwoFASettings'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

type Section = 'profile' | 'notifications' | 'security' | 'appearance'

const MENU: { key: Section; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Profile', desc: 'Personal information', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
  { key: 'notifications', label: 'Notifications', desc: 'Alerts & reports', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> },
  { key: 'security', label: 'Security', desc: 'Password & access', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
  { key: 'appearance', label: 'Appearance', desc: 'Theme & layout', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /> },
]

export default function SettingsPage() {
  useRequireAuth()
  const [userEmail, setUserEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [section, setSection] = useState<Section>('profile')
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('Admin User')
  const [email, setEmail] = useState('')
  const [twoFA, setTwoFA] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('user') || 'admin@stockapp.com'
    setUserEmail(stored)
    setEmail(stored)
  }, [])

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const active = MENU.find(m => m.key === section)!

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Topbar user={userEmail} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {/* Page heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your account, preferences, and security.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            {/* Settings navigation */}
            <aside className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 h-fit lg:sticky lg:top-24">
              <div className="lg:hidden flex gap-2 overflow-x-auto">
                {MENU.map(m => (
                  <button key={m.key} onClick={() => setSection(m.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${section === m.key ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{m.icon}</svg>
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="hidden lg:block space-y-1">
                {MENU.map(m => (
                  <button key={m.key} onClick={() => setSection(m.key)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${section === m.key ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${section === m.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{m.icon}</svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{m.label}</span>
                      <span className="block text-xs text-slate-400 truncate">{m.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            {/* Content */}
            <div className="space-y-5">
              {saved && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Settings saved successfully.
                </div>
              )}

              {/* Section header card */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{active.icon}</svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold">{active.label}</h2>
                  <p className="text-slate-300 text-sm">{active.desc}</p>
                </div>
              </div>

              {section === 'profile' && (
                <>
                  {/* Avatar card */}
                  <Card>
                    <div className="flex flex-wrap items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-indigo-100">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-semibold text-slate-900">{name}</p>
                        <p className="text-sm text-slate-500">{email}</p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          Administrator
                        </div>
                      </div>
                      <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                        Change photo
                      </button>
                    </div>
                  </Card>

                  {/* Personal info card */}
                  <Card title="Personal Information" subtitle="Update your account details.">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="Full name" value={name} onChange={setName} />
                      <Field label="Email address" value={email} onChange={setEmail} type="email" />
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                        <input value="Administrator" readOnly className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Member since</label>
                        <input value="January 2026" readOnly className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" />
                      </div>
                    </div>
                    <SaveBar onSave={save} label="Save Changes" />
                  </Card>
                </>
              )}

              {section === 'notifications' && (
                <Card title="Notification Preferences" subtitle="Choose which alerts you want to receive.">
                  <Toggle title="Email alerts" desc="Receive important account updates via email" checked={emailAlerts} onChange={setEmailAlerts} />
                  <Toggle title="Price alerts" desc="Get notified when a watched asset hits your target price" checked={priceAlerts} onChange={setPriceAlerts} />
                  <Toggle title="Weekly report" desc="A performance summary delivered every Monday" checked={weeklyReport} onChange={setWeeklyReport} />
                  <SaveBar onSave={save} label="Save Preferences" />
                </Card>
              )}

              {section === 'security' && (
                <>
                  <Card title="Password" subtitle="Keep your account secure with a strong password.">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Password</p>
                          <p className="text-xs text-slate-500">•••••••••• • Last changed 3 months ago</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors">Change password</button>
                    </div>
                  </Card>

                  <Card title="Two-Factor Authentication" subtitle="Add an extra layer of protection to your login.">
                    <TwoFASettings />
                  </Card>

                  <Card title="Active Sessions" subtitle="Devices currently signed in to your account.">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Current browser • This device</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Active now</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">Sign out</button>
                    </div>
                  </Card>
                </>
              )}

              {section === 'appearance' && (
                <Card title="Appearance" subtitle="Customize how StockApp looks for you.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ThemeCard label="Light" active={!darkMode} onClick={() => setDarkMode(false)} preview="bg-white" />
                    <ThemeCard label="Dark" active={darkMode} onClick={() => setDarkMode(true)} preview="bg-slate-900" />
                  </div>
                  <div className="mt-6">
                    <Toggle title="Compact layout" desc="Show more data with tighter spacing" checked={compact} onChange={setCompact} />
                  </div>
                  <SaveBar onSave={save} label="Save Appearance" />
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Card({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {title && (
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
    </div>
  )
}

function Toggle({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)} className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`}></span>
      </button>
    </div>
  )
}

function SaveBar({ onSave, label }: { onSave: () => void; label: string }) {
  return (
    <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
      <button className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
      <button onClick={onSave} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        {label}
      </button>
    </div>
  )
}

function ThemeCard({ label, active, onClick, preview }: { label: string; active: boolean; onClick: () => void; preview: string }) {
  return (
    <button onClick={onClick} className={`relative p-4 rounded-xl border-2 text-left transition-all ${active ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className={`h-24 rounded-lg mb-3 ${preview} border border-slate-200 p-2`}>
        <div className="h-2 w-1/3 bg-indigo-400 rounded mb-2"></div>
        <div className="h-2 w-2/3 bg-slate-300 rounded mb-2"></div>
        <div className="h-2 w-1/2 bg-slate-300 rounded"></div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">{label}</span>
        {active && <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>}
      </div>
    </button>
  )
}