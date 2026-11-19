'use client'

import { useState } from 'react'
import { useMarketData, formatMoney } from '@/hooks/useMarketData'

export default function Topbar({ user, onMenuClick }: { user: string; onMenuClick: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const { data, connected } = useMarketData()
  const currency = data?.currency
  const tickers = data?.quotes?.slice(0, 3) || []

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-6 overflow-x-auto scrollbar-hide">
        {/* Live ticker — driven by whatever symbols the feed provides */}
        {tickers.map(q => (
          <div key={q.symbol} className="flex items-center gap-2 whitespace-nowrap text-xs">
            <span className="font-semibold text-slate-600">{q.symbol}</span>
            <span className="font-bold text-slate-900 tabular-nums">{formatMoney(q.ltp, currency)}</span>
            <span className={q.change_pct >= 0 ? 'text-green-600' : 'text-red-600'}>
              {q.change_pct >= 0 ? '▲' : '▼'} {Math.abs(q.change_pct).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 border-t border-slate-100">
        <div className="flex items-center gap-3 flex-1">
          <button className="lg:hidden text-slate-600" onClick={onMenuClick}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="relative max-w-md w-full hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search markets..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${connected ? 'bg-green-50' : 'bg-amber-50'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className={`text-xs font-medium hidden sm:inline ${connected ? 'text-green-700' : 'text-amber-700'}`}>
              {connected ? 'Live' : 'Connecting'}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900 text-sm">Notifications</p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50">
                  <p className="text-sm text-slate-900 font-medium">Live feed connected</p>
                  <p className="text-xs text-slate-500 mt-1">{data?.provider || 'Market'} · streaming now</p>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50">
                  <p className="text-sm text-slate-900 font-medium">Prices updating in real time</p>
                  <p className="text-xs text-slate-500 mt-1">{data?.quotes?.length || 0} instruments tracked</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
              {(user || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-900">{user || 'Admin'}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}