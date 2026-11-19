'use client'

import { useEffect, useState } from 'react'
import { useMarketData, formatMoney, Quote } from '@/hooks/useMarketData'

const periods = ['LIVE', '1D', '1W', '1M', 'ALL']

function buildPath(data: number[], w: number, h: number, pad: number) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = (w - pad * 2) / Math.max(data.length - 1, 1)
  return data.map((v, i) => {
    const x = pad + i * step
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

export default function PriceChart() {
  const { data, connected } = useMarketData()
  const [period, setPeriod] = useState('LIVE')
  const [history, setHistory] = useState<number[]>([])

  const main: Quote | undefined = data?.quotes?.[0]
  const currency = data?.currency

  // Append each new live LTP to a rolling window to build a real chart.
  useEffect(() => {
    if (!main) return
    setHistory(prev => [...prev, main.ltp].slice(-30))
  }, [main?.ts])

  const points = history.length > 1 ? history : (main ? [main.close, main.ltp] : [0, 1])
  const w = 700, h = 260, pad = 20
  const linePath = buildPath(points, w, h, pad)
  const areaPath = `${linePath} L ${w - pad},${h - pad} L ${pad},${h - pad} Z`
  const min = Math.min(...points), max = Math.max(...points)
  const last = points[points.length - 1]
  const lastY = h - pad - ((last - min) / (max - min || 1)) * (h - pad * 2)

  return (
    <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">{main?.symbol || 'Market'}</h3>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${(main?.change_pct ?? 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {(main?.change_pct ?? 0) >= 0 ? '+' : ''}{(main?.change_pct ?? 0).toFixed(2)}%
            </span>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {main ? formatMoney(main.ltp, currency) : '—'}
          </p>
          <p className={`text-sm font-medium mt-0.5 tabular-nums ${(main?.change ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {main ? `${main.change >= 0 ? '+' : ''}${formatMoney(main.change, currency)} (24h)` : 'connecting...'}
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={pad} y1={pad + i * (h - pad * 2) / 4} x2={w - pad} y2={pad + i * (h - pad * 2) / 4} stroke="#f1f5f9" strokeWidth="1" />
          ))}
          <path d={areaPath} fill="url(#areaGrad)" />
          <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={w - pad} cy={lastY} r="5" fill="#6366f1" stroke="white" strokeWidth="2" />
        </svg>
        <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
          <span>{min.toFixed(2)}</span>
          <span>LIVE · {points.length} ticks · {data?.provider?.toUpperCase()}</span>
          <span>{max.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}