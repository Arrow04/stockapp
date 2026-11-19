import type { Holding } from '@/models'
export type { Holding } from '@/models'

const KEY_PREFIX = 'stockapp_portfolio_in_'

function keyFor(user: string) {
  return KEY_PREFIX + user.toLowerCase()
}

const SEED: Record<string, Holding[]> = {
  'admin@stockapp.com': [
    { id: 'h1', symbol: 'RELIANCE (NSE)', qty: 10, avgPrice: 1320 },
    { id: 'h2', symbol: 'TCS (NSE)', qty: 5, avgPrice: 2320 },
    { id: 'h3', symbol: 'HDFCBANK (NSE)', qty: 20, avgPrice: 790 },
    { id: 'h4', symbol: 'INFY (NSE)', qty: 15, avgPrice: 1150 },
  ],
}

export const PORTFOLIO_CHANGED = 'stockapp:portfolio-changed'

export function getHoldings(user: string): Holding[] {
  if (typeof window === 'undefined') return SEED[user.toLowerCase()] || []
  const raw = localStorage.getItem(keyFor(user))
  if (!raw) {
    const seed = SEED[user.toLowerCase()] || []
    localStorage.setItem(keyFor(user), JSON.stringify(seed))
    return seed
  }
  try { return JSON.parse(raw) } catch { return [] }
}

function save(user: string, holdings: Holding[]) {
  localStorage.setItem(keyFor(user), JSON.stringify(holdings))
  window.dispatchEvent(new Event(PORTFOLIO_CHANGED))
}

export function addHolding(user: string, data: Omit<Holding, 'id'>): Holding {
  const holdings = getHoldings(user)
  const item = { ...data, id: 'h-' + Date.now() }
  save(user, [item, ...holdings])
  return item
}

export function updateHolding(user: string, id: string, data: Partial<Omit<Holding, 'id'>>) {
  const next = getHoldings(user).map(h => h.id === id ? { ...h, ...data } : h)
  save(user, next)
}

export function deleteHolding(user: string, id: string) {
  save(user, getHoldings(user).filter(h => h.id !== id))
}
