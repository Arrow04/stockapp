import type { AppUser, UserRole, UserStatus } from '@/models'
export type { AppUser, UserRole, UserStatus } from '@/models'

const STORAGE_KEY = 'stockapp_users'
export const USERS_CHANGED_EVENT = 'stockapp:users-changed'

const SEED_USERS: AppUser[] = [
  { id: 'u-1', name: 'Admin User', email: 'admin@stockapp.com', role: 'Admin', status: 'Active', createdAt: '2026-01-15', lastActive: 'Just now' },
  { id: 'u-2', name: 'Rahul Sharma', email: 'rahul.sharma@stockapp.com', role: 'Trader', status: 'Active', createdAt: '2026-02-03', lastActive: '2 min ago' },
  { id: 'u-3', name: 'Priya Mehta', email: 'priya.mehta@stockapp.com', role: 'Trader', status: 'Active', createdAt: '2026-02-11', lastActive: '1 hour ago' },
  { id: 'u-4', name: 'Amit Verma', email: 'amit.verma@stockapp.com', role: 'Viewer', status: 'Inactive', createdAt: '2026-03-01', lastActive: '3 days ago' },
  { id: 'u-5', name: 'Sneha Iyer', email: 'sneha.iyer@stockapp.com', role: 'Trader', status: 'Active', createdAt: '2026-03-19', lastActive: '5 hours ago' },
]

function notify() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(USERS_CHANGED_EVENT))
}

export function getUsers(): AppUser[] {
  if (typeof window === 'undefined') return SEED_USERS
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS))
    return SEED_USERS
  }
  try {
    return JSON.parse(raw)
  } catch {
    return SEED_USERS
  }
}

function saveUsers(users: AppUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  notify()
}

export function addUser(data: Omit<AppUser, 'id' | 'createdAt' | 'lastActive'>): AppUser {
  const users = getUsers()
  const user: AppUser = {
    ...data,
    id: 'u-' + Date.now(),
    createdAt: new Date().toISOString().slice(0, 10),
    lastActive: 'Just now',
  }
  saveUsers([user, ...users])
  return user
}

export function updateUser(id: string, data: Partial<Omit<AppUser, 'id'>>): AppUser | null {
  const users = getUsers()
  let updated: AppUser | null = null
  const next = users.map(u => {
    if (u.id === id) {
      updated = { ...u, ...data }
      return updated
    }
    return u
  })
  if (updated) saveUsers(next)
  return updated
}

export function deleteUser(id: string) {
  saveUsers(getUsers().filter(u => u.id !== id))
}

export function emailExists(email: string, excludeId?: string): boolean {
  return getUsers().some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeId)
}
