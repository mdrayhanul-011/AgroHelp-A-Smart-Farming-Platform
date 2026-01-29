import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function Overview() {
  const { token } = useAuth()
  const [stats, setStats] = useState({ users: 0, stories: 0, admins: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    async function run() {
      setLoading(true)
      try {
        // Try dedicated stats endpoint; if 404, compute from lists
        const headers = { Authorization: 'Bearer ' + token }
        let { ok, data } = await apiFetch('/admin/stats', { headers })
        if (!ok) {
          const [u, s] = await Promise.all([
            apiFetch('/admin/users', { headers }),
            apiFetch('/admin/stories', { headers }),
          ])
          if (u.ok && s.ok) {
            const admins = (u.data.users || []).filter(x => x.designation === 'admin').length
            data = { users: u.data.users.length, stories: s.data.stories.length, admins }
            ok = true
          }
        }
        if (!ignore && data) {
          setStats({
            users: data.users || 0,
            stories: data.stories || 0,
            admins: data.admins || 0
          })
        }
      } catch { /* ignore */ } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => (ignore = true)
  }, [token])

  return (
    <div>
      <h1 className="text-xl font-bold">Overview</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">Key metrics at a glance.</p>

      <div className="grid sm:grid-cols-3 gap-4 mt-5">
        <StatCard title="Total users" value={stats.users} loading={loading} />
        <StatCard title="Stories" value={stats.stories} loading={loading} />
        <StatCard title="Admins" value={stats.admins} loading={loading} />
      </div>
    </div>
  )
}

function StatCard({ title, value, loading }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
      <div className="text-sm text-slate-600 dark:text-slate-400">{title}</div>
      <div className="text-3xl font-extrabold mt-1">{loading ? '—' : value}</div>
    </div>
  )
}
