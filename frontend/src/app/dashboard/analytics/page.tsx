'use client'

import { useRequireAuth } from '@/hooks/useAuth'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { useMarketData, formatMoney } from '@/hooks/useMarketData'

const MONTHLY = [
  { m: 'Jan', v: 3.2 }, { m: 'Feb', v: -1.4 }, { m: 'Mar', v: 4.8 },
  { m: 'Apr', v: 2.1 }, { m: 'May', v: -0.8 }, { m: 'Jun', v: 5.6 },
  { m: 'Jul', v: 1.9 }, { m: 'Aug', v: 3.4 }, { m: 'Sep', v: -2.2 },
  { m: 'Oct', v: 4.1 }, { m: 'Nov', v: 2.7 }, { m: 'Dec', v: 3.9 },
]

const TRADE_MIX = [
  { label: 'Intraday', value: 42, color: '#6366f1' },
  { label: 'Delivery', value: 33, color: '#22c55e' },
  { label: 'Swing', value: 25, color: '#f59e0b' },
]

export default function AnalyticsPage() {
  useRequireAuth()
  const { data } = useMarketData()
  const [userEmail, setUserEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useEffect(() => { setUserEmail(localStorage.getItem('user') || '') }, [])

  const currency = data?.currency
  const main = data?.quotes?.[0]
  const max = Math.max(...MONTHLY.map(m => Math.abs(m.v)))
  const chartW = 600, chartH = 200, pad = 24
  const line = MONTHLY.map((m, i) => {
    const x = pad + i * (chartW - pad * 2) / (MONTHLY.length - 1)
    const y = chartH / 2 - (m.v / max) * (chartH / 2 - pad)
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const bestTrade = currency === 'USDT' ? 320 : 8420

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Topbar user={userEmail} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-500 text-sm mt-1">Performance insights and trading statistics.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat label="Total Trades" value="148" sub="Last 12 months" />
            <Stat label="Win Rate" value="62.4%" sub="Profitable trades" positive />
            <Stat label="Avg Return" value="2.18%" sub="Per trade" positive />
            <Stat label="Best Trade" value={formatMoney(bestTrade, currency)} sub="Highest profit" positive />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Monthly Returns</h2>
                  <p className="text-sm text-slate-500">Percentage return per month</p>
                </div>
                {main && (
                  <span className="text-xs text-slate-500">{main.symbol} <span className={main.change_pct >= 0 ? 'text-green-600' : 'text-red-600'}>{main.change_pct >= 0 ? '+' : ''}{main.change_pct.toFixed(2)}%</span></span>
                )}
              </div>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
                <line x1={pad} y1={chartH / 2} x2={chartW - pad} y2={chartH / 2} stroke="#e2e8f0" strokeDasharray="4 4" />
                <path d={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {MONTHLY.map((m, i) => {
                  const x = pad + i * (chartW - pad * 2) / (MONTHLY.length - 1)
                  const y = chartH / 2 - (m.v / max) * (chartH / 2 - pad)
                  return <circle key={m.m} cx={x} cy={y} r="3" fill={m.v >= 0 ? '#22c55e' : '#ef4444'} />
                })}
              </svg>
              <div className="flex justify-between text-xs text-slate-400 mt-2 px-2">
                {MONTHLY.map(m => <span key={m.m}>{m.m}</span>)}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Trade Mix</h2>
              <p className="text-sm text-slate-500 mb-6">By strategy type</p>
              <div className="space-y-5">
                {TRADE_MIX.map(t => (
                  <div key={t.label}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-700">{t.label}</span>
                      <span className="font-semibold text-slate-900">{t.value}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full" style={{ width: `${t.value}%`, background: t.color }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-5 border-t border-slate-100">
                <p className="text-sm text-slate-500">Best month</p>
                <p className="text-xl font-bold text-green-600 mt-1">June · +5.6%</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200"><h2 className="text-lg font-bold text-slate-900">Monthly Breakdown</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Month</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Return</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trades</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MONTHLY.map((m, i) => (
                    <tr key={m.m} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-900">2026 · {m.m}</td>
                      <td className={`px-6 py-3 text-right font-medium tabular-nums ${m.v >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.v >= 0 ? '+' : ''}{m.v.toFixed(2)}%
                      </td>
                      <td className="px-6 py-3 text-right text-slate-600">{8 + (i * 3) % 12}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${m.v >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {m.v >= 0 ? 'Profit' : 'Loss'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Stat({ label, value, sub, positive }: { label: string; value: string; sub: string; positive?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${positive ? 'text-green-600' : 'text-slate-900'}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}