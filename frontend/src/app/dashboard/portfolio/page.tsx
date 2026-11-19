'use client'

import { useRequireAuth } from '@/hooks/useAuth'

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { useMarketData, formatMoney, formatCompact } from '@/hooks/useMarketData'
import { usePortfolio } from '@/hooks/usePortfolio'
import { Holding, addHolding, updateHolding, deleteHolding } from '@/lib/portfolio'

const COLORS = ['#6366f1', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']
type Modal = { type: 'closed' } | { type: 'add' } | { type: 'edit'; holding: Holding } | { type: 'delete'; holding: Holding }

export default function PortfolioPage() {
  useRequireAuth()
  const { data } = useMarketData()
  const [user, setUser] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modal, setModal] = useState<Modal>({ type: 'closed' })
  useEffect(() => { setUser(localStorage.getItem('user') || 'admin@stockapp.com') }, [])

  const holdings = usePortfolio(user)
  const currency = data?.currency
  const quotes = data?.quotes || []

  const rows = useMemo(() => holdings.map(h => {
    const q = quotes.find(x => x.symbol === h.symbol)
    const ltp = q?.ltp ?? h.avgPrice ?? 0
    const value = ltp * h.qty
    const invested = h.avgPrice * h.qty
    const pnl = value - invested
    return { ...h, name: q?.name || h.symbol, ltp, value, invested, pnl, pnlPct: invested ? (pnl / invested) * 100 : 0 }
  }), [holdings, quotes])

  const totalValue = rows.reduce((s, r) => s + r.value, 0)
  const totalInvested = rows.reduce((s, r) => s + r.invested, 0)
  const totalPnl = totalValue - totalInvested
  const totalPnlPct = totalInvested ? (totalPnl / totalInvested) * 100 : 0

  let offset = 0
  const segments = rows.map((r, i) => {
    const pct = Number.isFinite(totalValue) && totalValue > 0 ? (r.value / totalValue) * 100 : 0
    const seg = { ...r, pct: Number.isFinite(pct) ? pct : 0, color: COLORS[i % COLORS.length], offset }
    offset += seg.pct
    return seg
  })

  const availableSymbols = quotes.map(q => ({ symbol: q.symbol, name: q.name }))

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Topbar user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Portfolio</h1>
              <p className="text-slate-500 text-sm mt-1">Your personal holdings — saved to <b className="text-slate-700">{user}</b>.</p>
            </div>
            <button onClick={() => setModal({ type: 'add' })} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Holding
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card label="Total Value" value={formatMoney(totalValue, currency)} sub={`${holdings.length} holdings`} />
            <Card label="Invested" value={formatMoney(totalInvested, currency)} sub="Cost basis" />
            <Card label="Total P&L" value={`${totalPnl >= 0 ? '+' : ''}${formatMoney(totalPnl, currency)}`} sub={`${totalPnlPct.toFixed(2)}% return`} positive={totalPnl >= 0} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200"><h2 className="text-lg font-bold text-slate-900">Holdings</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Asset</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Avg</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">LTP</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Value</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">P&L</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.length === 0 && <tr><td colSpan={7} className="px-5 py-14 text-center text-slate-400">No holdings yet. Add one to get started.</td></tr>}
                    {rows.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3"><p className="font-semibold text-slate-900">{r.symbol}</p><p className="text-xs text-slate-500">{r.name}</p></td>
                        <td className="px-5 py-3 text-right text-slate-700">{r.qty}</td>
                        <td className="px-5 py-3 text-right text-slate-500 tabular-nums">{formatMoney(r.avgPrice, currency)}</td>
                        <td className="px-5 py-3 text-right text-slate-900 tabular-nums">{formatMoney(r.ltp, currency)}</td>
                        <td className="px-5 py-3 text-right text-slate-900 tabular-nums">{formatMoney(r.value, currency)}</td>
                        <td className={`px-5 py-3 text-right font-medium tabular-nums ${r.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{r.pnl >= 0 ? '+' : ''}{formatMoney(r.pnl, currency)}</td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setModal({ type: 'edit', holding: r })} title="Edit" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                            <button onClick={() => setModal({ type: 'delete', holding: r })} title="Delete" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-fit">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Allocation</h2>
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 42 42" className="w-48 h-48 -rotate-90">
                  <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                  {segments.map(s => (
                    <circle key={s.id} cx="21" cy="21" r="15.9155" fill="none" stroke={s.color} strokeWidth="5" strokeDasharray={`${s.pct} ${100 - s.pct}`} strokeDashoffset={-s.offset} />
                  ))}
                </svg>
              </div>
              <div className="mt-5 space-y-2">
                {segments.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: s.color }}></span><span className="text-slate-700">{s.symbol}</span></div>
                    <span className="font-medium text-slate-900 tabular-nums">{s.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {(modal.type === 'add' || modal.type === 'edit') && (
        <HoldingModal mode={modal.type} holding={modal.type === 'edit' ? modal.holding : undefined} symbols={availableSymbols}
          onClose={() => setModal({ type: 'closed' })}
          onSave={d => { if (modal.type === 'edit') updateHolding(user, modal.holding.id, d); else addHolding(user, d); setModal({ type: 'closed' }) }} />
      )}
      {modal.type === 'delete' && (
        <DeleteModal holding={modal.holding} onClose={() => setModal({ type: 'closed' })} onConfirm={() => { deleteHolding(user, modal.holding.id); setModal({ type: 'closed' }) }} />
      )}
    </div>
  )
}

function Card({ label, value, sub, positive }: { label: string; value: string; sub: string; positive?: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${positive === undefined ? 'text-slate-900' : positive ? 'text-emerald-600' : 'text-rose-600'}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}

function HoldingModal({ mode, holding, symbols, onClose, onSave }: { mode: 'add' | 'edit'; holding?: Holding; symbols: { symbol: string; name: string }[]; onClose: () => void; onSave: (d: { symbol: string; qty: number; avgPrice: number }) => void }) {
  const [symbol, setSymbol] = useState(holding?.symbol || symbols[0]?.symbol || '')
  const [qty, setQty] = useState(String(holding?.qty ?? ''))
  const [avg, setAvg] = useState(String(holding?.avgPrice ?? ''))
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = Number(qty), a = Number(avg)
    if (!symbol) return setError('Choose an asset.')
    if (!(q > 0)) return setError('Quantity must be positive.')
    if (!(a > 0)) return setError('Average price must be positive.')
    onSave({ symbol, qty: q, avgPrice: a })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900">{mode === 'add' ? 'Add Holding' : 'Edit Holding'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        {error && <p className="mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Asset</label>
            <select value={symbol} onChange={e => setSymbol(e.target.value)} disabled={mode === 'edit'}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50">
              {symbols.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} · {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
            <input type="number" step="any" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 0.05"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Average price</label>
            <input type="number" step="any" value={avg} onChange={e => setAvg(e.target.value)} placeholder="e.g. 59300"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">{mode === 'add' ? 'Add Holding' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteModal({ holding, onClose, onConfirm }: { holding: Holding; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Remove holding?</h2>
        <p className="text-sm text-slate-500 mb-6">Remove <b className="text-slate-700">{holding.symbol}</b> from your portfolio?</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium">Remove</button>
        </div>
      </div>
    </div>
  )
}