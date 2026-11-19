'use client'

import { useEffect, useRef, useState } from 'react'
import { useKlines, Candle, formatMoney, formatCompact } from '@/hooks/useMarketData'

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d']
const W = 920, H = 460
const PAD_L = 8, PAD_R = 78, PAD_T = 16
const PRICE_H = 330, GAP = 14, VOL_H = 72

export default function CandlestickChart({ symbol, currency, livePrice }: { symbol: string; currency?: string; livePrice?: number }) {
  const [tf, setTf] = useState('1m')
  const [hover, setHover] = useState<number | null>(null)
  const { candles, loading, error, reload } = useKlines(symbol, tf, 60)
  const [liveCandles, setLiveCandles] = useState<Candle[]>([])
  const prevRef = useRef<number | null>(null)

  // Build real candles from live ticks if the historical feed is unavailable.
  useEffect(() => {
    if (livePrice === undefined) return
    const prev = prevRef.current
    if (prev !== null && prev !== livePrice) {
      setLiveCandles(list => [...list, {
        openTime: Date.now(),
        open: prev,
        high: Math.max(prev, livePrice),
        low: Math.min(prev, livePrice),
        close: livePrice,
        volume: 1,
      }].slice(-40))
    }
    prevRef.current = livePrice
  }, [livePrice])

  useEffect(() => { setLiveCandles([]); prevRef.current = null; setHover(null) }, [symbol, tf])

  const usingLive = candles.length === 0 && liveCandles.length > 1
  const clean = (arr: Candle[]) => arr.filter(c =>
    [c.open, c.high, c.low, c.close, c.volume].every(v => Number.isFinite(v)))
  const data = clean(candles.length ? candles : liveCandles)
  const chartW = W - PAD_L - PAD_R
  const n = data.length || 1
  const step = chartW / n
  const bw = Math.max(2, Math.min(12, step * 0.62))

  const hi = data.length ? Math.max(...data.map(c => c.high)) : 1
  const lo = data.length ? Math.min(...data.map(c => c.low)) : 0
  const range = hi - lo || 1
  const volMax = data.length ? (Math.max(...data.map(c => c.volume)) || 1) : 1

  const priceY = (p: number) => {
    const v = Number.isFinite(p) ? p : lo
    return PAD_T + (1 - (v - lo) / range) * (PRICE_H - PAD_T)
  }
  const volY = (v: number) => {
    const vv = Number.isFinite(v) ? v : 0
    return PAD_T + PRICE_H + GAP + VOL_H - (vv / volMax) * VOL_H
  }
  const cx = (i: number) => PAD_L + i * step + step / 2

  const last = data[data.length - 1]
  const first = data[0]
  const diff = last && first ? last.close - first.open : 0
  const diffPct = first ? (diff / first.open) * 100 : 0
  const up = diff >= 0

  const active = hover !== null && data[hover] ? data[hover] : null
  const activeX = hover !== null ? cx(hover) : 0

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.floor((x - PAD_L) / step)
    setHover(idx >= 0 && idx < data.length ? idx : null)
  }

  const gridPrices = Array.from({ length: 5 }, (_, i) => lo + (range * i) / 4)
  const showSkeleton = data.length === 0 && (loading || error)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{symbol}</h3>
              {data.length > 0 && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {up ? '▲' : '▼'} {Math.abs(diffPct).toFixed(2)}%
                </span>
              )}
              {usingLive && <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700">LIVE TICKS</span>}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">OHLC · Binance · {tf}</p>
          </div>
          {livePrice !== undefined && (
            <div className="pl-3 border-l border-slate-200">
              <p className="text-lg font-bold text-slate-900 tabular-nums">{formatMoney(livePrice, currency)}</p>
              <p className="text-xs text-slate-400">Live price</p>
            </div>
          )}
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {TIMEFRAMES.map(t => (
            <button key={t} onClick={() => setTf(t)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${tf === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Current OHLC stats */}
      {active && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 px-5 py-2 bg-slate-50 border-b border-slate-100 text-xs">
          <span className="text-slate-500">O <b className="text-slate-800 tabular-nums">{formatMoney(active.open, currency)}</b></span>
          <span className="text-slate-500">H <b className="text-slate-800 tabular-nums">{formatMoney(active.high, currency)}</b></span>
          <span className="text-slate-500">L <b className="text-slate-800 tabular-nums">{formatMoney(active.low, currency)}</b></span>
          <span className="text-slate-500">C <b className="text-slate-800 tabular-nums">{formatMoney(active.close, currency)}</b></span>
          <span className="text-slate-500">Vol <b className="text-slate-800 tabular-nums">{formatCompact(active.volume)}</b></span>
        </div>
      )}

      {/* Chart / fallback — always fills height so the layout never collapses */}
      <div className="relative px-2 py-2 flex-1 min-h-[460px]">
        {showSkeleton ? (
          <div className="h-[460px] flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${error ? 'bg-amber-50' : 'bg-indigo-50'}`}>
              {error ? (
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              ) : (
                <svg className="w-6 h-6 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{error ? 'Historical chart temporarily unavailable' : 'Loading chart data…'}</p>
              <p className="text-xs text-slate-400 mt-1">Live ticks are still being collected from the market feed.</p>
            </div>
            {error && (
              <button onClick={reload} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                Retry
              </button>
            )}
          </div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
            {gridPrices.map((p, i) => (
              <g key={i}>
                <line x1={PAD_L} y1={priceY(p)} x2={W - PAD_R} y2={priceY(p)} stroke="#eef2f7" strokeWidth="1" />
                <text x={W - PAD_R + 6} y={priceY(p) + 4} fontSize="11" fill="#94a3b8" className="tabular-nums">{formatMoney(p, currency)}</text>
              </g>
            ))}
            <line x1={PAD_L} y1={PAD_T + PRICE_H + GAP} x2={W - PAD_R} y2={PAD_T + PRICE_H + GAP} stroke="#e2e8f0" strokeWidth="1" />
            <text x={W - PAD_R + 6} y={PAD_T + PRICE_H + GAP + 14} fontSize="10" fill="#94a3b8">VOL</text>

            {data.map((c, i) => {
              const green = c.close >= c.open
              const color = green ? '#10b981' : '#f43f5e'
              const x = cx(i)
              const yBody = priceY(Math.max(c.open, c.close))
              const hBody = Math.max(1.5, Math.abs(priceY(c.open) - priceY(c.close)))
              return (
                <g key={i}>
                  <line x1={x} x2={x} y1={priceY(c.high)} y2={priceY(c.low)} stroke={color} strokeWidth="1.3" />
                  <rect x={x - bw / 2} y={yBody} width={bw} height={hBody} fill={color} rx="0.6" opacity={hover === i ? 1 : 0.9} />
                  <rect x={x - bw / 2} y={volY(c.volume)} width={bw} height={PAD_T + PRICE_H + GAP + VOL_H - volY(c.volume)} fill={color} opacity="0.25" />
                </g>
              )
            })}

            {last && (
              <g>
                <line x1={PAD_L} x2={W - PAD_R} y1={priceY(last.close)} y2={priceY(last.close)} stroke={up ? '#10b981' : '#f43f5e'} strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
                <rect x={W - PAD_R + 2} y={priceY(last.close) - 10} width={PAD_R - 4} height="20" rx="4" fill={up ? '#10b981' : '#f43f5e'} />
                <text x={W - PAD_R + 6} y={priceY(last.close) + 4} fontSize="10" fill="white" className="tabular-nums">{formatMoney(last.close, currency)}</text>
              </g>
            )}

            {active && (
              <g>
                <line x1={activeX} x2={activeX} y1={PAD_T} y2={PAD_T + PRICE_H + GAP + VOL_H} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                <rect x={Math.min(activeX + 8, W - PAD_R - 120)} y={PAD_T + 4} width="116" height="18" rx="4" fill="#1e293b" />
                <text x={Math.min(activeX + 14, W - PAD_R - 114)} y={PAD_T + 17} fontSize="10" fill="white">
                  {new Date(active.openTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  )
}