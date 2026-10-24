import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from './api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading, null = signed out

  useEffect(() => {
    api('/auth/me').then(setUser).catch(() => setUser(null))
  }, [])

  const value = {
    user,
    login: async (body) => setUser(await api('/auth/login', { method: 'POST', body })),
    register: async (body) => setUser(await api('/auth/register', { method: 'POST', body })),
    logout: async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null) },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function RequireAuth({ children }) {
  const { user } = useAuth()
  const loc = useLocation()
  if (user === undefined) return <div className="p-10 text-sm text-ink-muted">Loading…</div>
  if (!user) return <Navigate to="/signin" state={{ from: loc.pathname }} replace />
  return children
}
