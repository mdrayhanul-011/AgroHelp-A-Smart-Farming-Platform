import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function ProfileDrawer({ open, onClose, user }) {
  // close on ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // optional: lock body scroll
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const initials = (user?.name || '?')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '?'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-[61] h-full w-full max-w-sm bg-white dark:bg-gray-900 border-l border-black/10 dark:border-white/10
        transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog" aria-modal="true" aria-label="Profile"
      >
        <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
          <h3 className="text-lg font-semibold">Profile</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none"
            aria-label="Close profile panel"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            {/* Avatar (image if you have user.photoUrl, else initials) */}
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user?.name || 'User'}
                className="w-14 h-14 rounded-2xl object-cover border border-black/10"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white grid place-items-center text-xl font-bold">
                {initials}
              </div>
            )}

            <div>
              <div className="text-base font-semibold">{user?.name || 'User'}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {user?.email || 'email not set'}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/dashboard"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700"
            >
              Go to Dashboard
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 12h11.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a 1 1 0 0 1 0 1.414l-5 5a1 1 0 1 1-1.414-1.414L16.586 14H5a1 1 0 1 1 0-2z"/>
              </svg>
            </Link>
          </div>

          {/* Extra: you can drop more profile actions here later */}
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-4">
            Press <kbd className="px-1 py-0.5 border rounded">Esc</kbd> to close
          </div>
        </div>
      </aside>
    </>
  )
}
