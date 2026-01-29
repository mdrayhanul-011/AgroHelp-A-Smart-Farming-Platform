import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMemo, useState, useEffect } from 'react'

const linkBase =
  "relative text-gray-800 dark:text-gray-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-emerald-600 after:transition-all hover:after:w-full"

const linkActive = ({ isActive }) =>
  linkBase + (isActive ? ' text-emerald-700 dark:text-emerald-300' : '')

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)

  // close mobile panel on route change
  useEffect(() => { setOpen(false) }, [loc.pathname])

  const initials = useMemo(() => {
    return (user?.name || '?')
      .split(' ')
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase())
      .join('') || '?'
  }, [user])

  // role-based dashboard target
  const dashPath = useMemo(() => {
    const role = (user?.designation || '').toLowerCase()
    if (role === 'admin') return '/admin'
    if (role === 'expert') return '/expert'
    return '/dashboard'
  }, [user])

  const links = [
    { to: '/', label: 'Home' },
    { to: '/advisory', label: 'Advisory' },
    { to: '/insects', label: 'Insect Detector' },
    { to: '/market', label: 'Market' },
    { to: '/cost', label: 'Cost' },
    ...(user?.designation?.toLowerCase() === 'user'
      ? [{ to: '/ask', label: 'Expert' }]
      : []),
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <nav className="sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 pt-4">
        <div className="glass dark:glass-dark rounded-2xl border border-white/40 dark:border-white/10 shadow-glow">
          <div className="px-5 py-3 flex items-center justify-between">
            {/* brand */}
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-grid place-items-center w-9 h-9 rounded-xl bg-emerald-500/10">
                <img src="/plant.png" alt="AgroHelp Logo" className="w-6 h-6 object-contain" />
              </span>
              <span className="text-2xl font-bold tracking-tight">AgroHelp</span>
            </Link>

            {/* desktop nav */}
            <ul className="hidden md:flex items-center gap-6 text-sm">
              {links.map(l => (
                <li key={l.to}><NavLink to={l.to} className={linkActive}>{l.label}</NavLink></li>
              ))}
              {/* intentionally NO Admin link here */}
            </ul>

            {/* right actions */}
            <div className="flex items-center gap-2">
              {/* desktop auth/user */}
              <div className="hidden md:flex items-center gap-3">
                {!user ? (
                  <>
                    <NavLink to="/login" className="px-3 py-2 rounded-2xl shadow">Log in</NavLink>
                    <NavLink to="/signup" className="px-3 py-2 rounded-2xl shadow bg-emerald-600 text-white">Sign up</NavLink>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => nav(dashPath)}
                      className="px-3 py-2 rounded-2xl shadow bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => nav('/profile')}
                      className="w-9 h-9 rounded-xl bg-emerald-600 text-white grid place-items-center font-semibold hover:opacity-90 focus:outline-none overflow-hidden"
                      title={user?.name || 'Profile'}
                    >
                      {user?.photoUrl
                        ? <img src={user.photoUrl} alt="avatar" className="w-9 h-9 rounded-xl object-cover" />
                        : initials}
                    </button>
                    <button className="px-3 py-2 rounded-2xl shadow" onClick={logout}>Logout</button>
                  </>
                )}
              </div>

              {/* mobile menu toggle */}
              <button
                className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Open menu"
                onClick={() => setOpen(true)}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* mobile slide-over */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* backdrop */}
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white/90 dark:bg-gray-900/95 backdrop-blur border-l border-black/10 dark:border-white/10 p-5 flex flex-col">
            {/* header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-grid place-items-center w-9 h-9 rounded-xl bg-emerald-500/10">
                  <img src="/plant.png" alt="AgroHelp Logo" className="w-6 h-6 object-contain" />
                </span>
                <span className="text-lg font-semibold">AgroHelp</span>
              </div>
              <button
                className="w-9 h-9 inline-grid place-items-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.18 12 2.89 5.71 4.3 4.29 10.59 10.6l6.3-6.3z" /></svg>
              </button>
            </div>

            {/* user summary */}
            <div className="mt-4 rounded-2xl border border-black/10 dark:border-white/10 p-3">
              {!user ? (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  You’re not logged in.
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => nav('/profile')}
                    className="w-10 h-10 rounded-xl bg-emerald-600 text-white grid place-items-center font-semibold overflow-hidden"
                    title={user?.name || 'Profile'}
                  >
                    {user?.photoUrl
                      ? <img src={user.photoUrl} alt="avatar" className="w-10 h-10 object-cover" />
                      : initials}
                  </button>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{user?.name || '—'}</div>
                    <div className="text-xs text-slate-500 truncate">@{user?.username}</div>
                  </div>
                  {/* no Admin badge shown here anymore */}
                </div>
              )}
            </div>

            {/* nav links */}
            <nav className="mt-4 flex-1 overflow-y-auto">
              <ul className="space-y-1">
                {links.map(l => (
                  <li key={l.to}>
                    <NavLink to={l.to} className={({ isActive }) =>
                      `block px-3 py-2 rounded-xl ${isActive ? 'bg-emerald-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`
                    }>
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* actions */}
            <div className="pt-3 border-t border-black/10 dark:border-white/10 grid gap-2">
              {!user ? (
                <>
                  <NavLink to="/login" className="px-3 py-2 rounded-xl border text-center hover:bg-white/60">Log in</NavLink>
                  <NavLink to="/signup" className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-center hover:bg-emerald-700">Sign up</NavLink>
                </>
              ) : (
                <>
                  <button
                    onClick={() => nav(dashPath)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={logout}
                    className="px-3 py-2 rounded-xl border hover:bg-white/60"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
