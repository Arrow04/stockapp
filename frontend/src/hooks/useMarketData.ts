'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import type { Quote, MarketSnapshot, Candle, DepthLevel, Trade } from '@/models'

// Re-export domain types so existing imports keep working (backward compatible).
export type { Quote, MarketSnapshot, Candle, DepthLevel, Trade } from '@/models'

/** Currency for a quote: Indian stocks use INR, everything else USD/USDT. */
export function currencyFor(quote?: Quote | null, fallback?: string) {
  if (quote?.market === 'INDIA' || quote?.currency === 'INR') return 'INR'
  return quote?.currency || fallback || 'USDT'
}

const WS_URL = 'ws://localhost:8000/ws/market-data'
const API = 'http://localhost:8000'

/** Normalise a symbol for the API. Indian symbols like "RELIANCE (NSE)"
 * are kept intact; crypto "BTC/USDT" becomes "BTCUSDT". */
export function toBinanceSymbol(symbol: string) {
  if (symbol.includes('(') || !symbol.includes('/')) return symbol
  return symbol.replace(/\//g, '')
}

export function useMarketData() {
  const [data, setData] = useState<MarketSnapshot | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const startPolling = () => {
      if (pollTimer) return
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`${API}/api/quotes`)
          if (res.ok) setData(await res.json())
        } catch { /* ignore */ }
      }, 2000)
    }

    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws
        ws.onopen = () => setConnected(true)
        ws.onmessage = (e) => {
          try { setData(JSON.parse(e.data)) } catch { /* ignore */ }
        }
        ws.onclose = () => {
          setConnected(false)
          startPolling()
          if (!retryTimer) retryTimer = setTimeout(() => { retryTimer = null; connect() }, 5000)
        }
        ws.onerror = () => { setConnected(false); startPolling() }
      } catch {
        startPolling()
      }
    }

    connect()
    return () => {
      if (pollTimer) clearInterval(pollTimer)
      if (retryTimer) clearTimeout(retryTimer)
      wsRef.current?.close()
    }
  }, [])

  return { data, connected }
}

/** OHLC candlestick data from Binance klines, with retry. */
export function useKlines(symbol: string, interval = '1m', limit = 60) {
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [nonce, setNonce] = useState(0)
  const binance = toBinanceSymbol(symbol)

  const reload = useCallback(() => setNonce(n => n + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/klines?symbol=${binance}&interval=${interval}&limit=${limit}`)
        if (!res.ok) throw new Error('bad status')
        const json = await res.json()
        if (active) {
          setCandles(Array.isArray(json) ? json : [])
          setError(false)
        }
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 15000)
    return () => { active = false; clearInterval(timer) }
  }, [binance, interval, limit, nonce])

  return { candles, loading, error, reload }
}

/** Order book depth from Binance. */
export function useDepth(symbol: string, limit = 10) {
  const [depth, setDepth] = useState<{ bids: DepthLevel[]; asks: DepthLevel[] }>({ bids: [], asks: [] })
  const binance = toBinanceSymbol(symbol)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/depth?symbol=${binance}&limit=${limit}`)
        if (res.ok && active) setDepth(await res.json())
      } catch { /* ignore */ }
    }
    load()
    const timer = setInterval(load, 3000)
    return () => { active = false; clearInterval(timer) }
  }, [binance, limit])

  return depth
}

/** Recent trades from Binance. */
export function useTrades(symbol: string, limit = 15) {
  const [trades, setTrades] = useState<Trade[]>([])
  const binance = toBinanceSymbol(symbol)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/trades?symbol=${binance}&limit=${limit}`)
        if (res.ok && active) setTrades(await res.json())
      } catch { /* ignore */ }
    }
    load()
    const timer = setInterval(load, 3000)
    return () => { active = false; clearInterval(timer) }
  }, [binance, limit])

  return trades
}

/** Currency-aware money formatter. USDT -> $, brokers -> ₹ */
export function formatMoney(n: number, currency?: string) {
  const symbol = currency === 'USDT' ? '$' : '₹'
  const abs = Math.abs(n)
  const decimals = abs < 1 ? 4 : abs < 100 ? 3 : 2
  return symbol + n.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
}

export function formatINR(n: number) { return formatMoney(n, 'INR') }

export function formatCompact(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K'
  return n.toFixed(2)
}