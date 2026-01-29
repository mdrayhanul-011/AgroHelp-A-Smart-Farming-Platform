import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function Users() {
  const { token, user: me } = useAuth()
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const headers = useMemo(() => ({ Authorization: 'Bearer ' + token }), [token])

  async function load() {
    setLoading(true); setErr(''); setMsg('')
    const { ok, data } = await apiFetch('/admin/users', { headers })
    if (!ok) setErr(data?.message || 'Failed to load users')
    else setList(data.users || [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const filtered = list.filter(u =>
    [u.name, u.username, u.email].filter(Boolean).some(val =>
      val.toLowerCase().includes(q.toLowerCase())
    )
  )

  async function promote(id, to) {
    setErr(''); setMsg('')
    const { ok, data } = await apiFetch(`/admin/users/${id}`, {
      method: 'PATCH',
      headers,
      body: { designation: to }
    })
    if (!ok) { setErr(data?.message || 'Update failed'); return }
    setMsg('Updated')
    setList(prev => prev.map(x => x.id === id ? { ...x, designation: to } : x))
  }

  async function remove(id) {
    if (!confirm('Delete this user?')) return
    setErr(''); setMsg('')
    const { ok, data } = await apiFetch(`/admin/users/${id}`, {
      method: 'DELETE',
      headers
    })
    if (!ok) { setErr(data?.message || 'Delete failed'); return }
    setMsg('Deleted')
    setList(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Users</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search name, username, email"
          className="rounded-xl border p-2 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10"
        />
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/10">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Username</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="py-4 text-slate-500" colSpan={5}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="py-4 text-slate-500" colSpan={5}>No users</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">{u.name || '—'}</td>
                <td className="py-2 pr-4">{u.username}</td>
                <td className="py-2 pr-4">{u.email || '—'}</td>
                <td className="py-2 pr-4">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.designation === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                    {u.designation || 'user'}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <div className="flex gap-2">
                    {u.id !== me?.id && (
                      u.designation === 'admin' ? (
                        <button onClick={()=>promote(u.id, 'user')} className="px-3 py-1 rounded-xl border hover:bg-white/60">Make user</button>
                      ) : (
                        <button onClick={()=>promote(u.id, 'admin')} className="px-3 py-1 rounded-xl border hover:bg-white/60">Make admin</button>
                      )
                    )}
                    {u.id !== me?.id && (
                      <button onClick={()=>remove(u.id)} className="px-3 py-1 rounded-xl border hover:bg-white/60 text-red-600">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
