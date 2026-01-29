import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const base = "flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
const link = ({ isActive }) =>
  `${base} ${isActive ? 'bg-emerald-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`

export default function AdminLayout() {
  const { user } = useAuth()

  return (
    <section className="min-h-[calc(100vh-80px)] py-6">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4 h-full">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-grid place-items-center w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 7 4 11 4 14a8 8 0 1 0 16 0c0-3-3-7-8-12z"/></svg>
            </span>
            <div>
              <div className="text-sm font-semibold">Admin</div>
              <div className="text-xs text-slate-500">{user?.name || '—'}</div>
            </div>
          </div>

          <nav className="space-y-1">
            <NavLink to="/admin" end className={link}>
              <span>Overview</span>
            </NavLink>
            <NavLink to="/admin/users" className={link}>
              <span>Users</span>
            </NavLink>
            <NavLink to="/admin/stories" className={link}>
              <span>Stories</span>
            </NavLink>
            <NavLink to="/admin/settings" className={link}>
              <span>Settings</span>
            </NavLink>
            <NavLink to="/admin/advisory" className={link}>
              <span>Advisory</span>
            </NavLink>
            <NavLink to="/admin/market" className={link}>
              <span>Market</span>
            </NavLink>
            <NavLink to="/admin/input" className={link}>
              <span>Input</span>
            </NavLink>
          </nav>
        </aside>

        {/* Content */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-5">
          <Outlet />
        </div>
      </div>
    </section>
  )
}
