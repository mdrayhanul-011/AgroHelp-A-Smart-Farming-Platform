import { createContext, useContext, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('ag_user')
    return s ? JSON.parse(s) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('ag_token') || '')

  function setAuth(u, t) {
    setUser(u || null)
    setToken(t || '')
    if (u) localStorage.setItem('ag_user', JSON.stringify(u)); else localStorage.removeItem('ag_user')
    if (t) localStorage.setItem('ag_token', t); else localStorage.removeItem('ag_token')
  }

  // ⬇⬇⬇ change starts here
  async function login(username, password) {
    if (!username?.trim() || !password) throw new Error('Username and password are required')
    const { ok, data } = await apiFetch('/auth/login', {
      method: 'POST',
      body: { username: username.trim(), password }   // send username, not email
    })
    if (!ok) throw new Error(data?.message || 'Login failed')
    setAuth(data.user, data.token)
  }
  // ⬆⬆⬆ change ends here

 // Replace your signup with this:
async function signup(name, username, email, password, designation = 'user') {
  const body = { name, username, password, designation }
  if (email) body.email = email // optional

  const { ok, data } = await apiFetch('/auth/register', {
    method: 'POST',
    body
  })
  if (!ok) throw new Error(data?.message || 'Signup failed')
  setAuth(data.user, data.token)
  return data.user
}


  function logout() { setAuth(null, '') }

  async function updateProfile(patch) {
    if (!token) throw new Error('Not authenticated')
    const headers = { Authorization: 'Bearer ' + token }
    const tries = [
      ['PATCH', '/auth/profile'],
      ['PATCH', '/users/me'],
      ['PUT',   '/auth/me']
    ]
    let lastErr = 'Update failed'
    for (const [method, path] of tries) {
      const { ok, data } = await apiFetch(path, { method, body: patch, headers })
      if (ok) {
        const u = data?.user ? data.user : { ...(user || {}), ...patch }
        setUser(u); localStorage.setItem('ag_user', JSON.stringify(u))
        return u
      }
      lastErr = data?.message || lastErr
    }
    throw new Error(lastErr)
  }

  const value = useMemo(() => ({ user, token, login, signup, logout, updateProfile }), [user, token])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }
