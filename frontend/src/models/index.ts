/**
 * Domain Models — the "M" in MVVM.
 * Pure type definitions shared across services (lib), viewmodels (hooks)
 * and views (components/app). No runtime logic lives here.
 */

// ---- Market domain -------------------------------------------------------
export type MarketKind = 'CRYPTO' | 'US' | 'INDIA'

export interface Quote {
  symbol: string
  name: string
  ltp: number
  open: number
  high: number
  low: number
  close: number
  change: number
  change_pct: number
  volume: number
  ts: number
  market?: MarketKind
  currency?: string
}

export interface MarketSnapshot {
  provider: string
  currency: string
  live: boolean
  quotes: Quote[]
  ts: number
}

export interface Candle {
  openTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type DepthLevel = [number, number]

export interface Trade {
  price: number
  qty: number
  time: number
  isBuyerMaker: boolean
}

// ---- Auth domain ---------------------------------------------------------
export interface AuthUser {
  id: number
  email: string
  name: string
  role: 'admin' | 'user'
  is_2fa_enabled: boolean
  created_at: string
}

// ---- User-management domain ---------------------------------------------
export type UserRole = 'Admin' | 'Trader' | 'Viewer'
export type UserStatus = 'Active' | 'Inactive'

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  lastActive: string
}

// ---- Portfolio domain ----------------------------------------------------
export interface Holding {
  id: string
  symbol: string
  qty: number
  avgPrice: number
}
