import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { uploadToCloudinary } from '../lib/cloudinary'
import { apiFetch } from '../lib/api'

export default function Profile() {
  const { user, token, updateProfile } = useAuth()

  // base fields
  const [name, setName] = useState(user?.name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [email] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '')

  // expert-only fields
  const [specialty, setSpecialty] = useState(user?.specialty || '')
  const [region, setRegion] = useState(user?.region || '')

  // ui state
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const fileRef = useRef(null)

  // refresh latest user (optional)
  useEffect(() => {
    const headers = { Authorization: 'Bearer ' + token }
    apiFetch('/auth/me', { headers })
      .then(({ ok, data }) => {
        if (ok && data?.user) {
          const u = data.user
          setName(u.name || '')
          setUsername(u.username || '')
          setPhone(u.phone || '')
          setAddress(u.address || '')
          setPhotoUrl(u.photoUrl || '')
          setSpecialty(u.specialty || '')
          setRegion(u.region || '')
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initials = useMemo(() =>
    (name || user?.name || '?')
      .split(' ')
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase())
      .join('') || '?',
  [name, user])

  async function onChoose(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(''); setMsg('')
    try {
      setSaving(true)
      const url = await uploadToCloudinary(file)
      setPhotoUrl(url)
      setMsg('Photo uploaded')
    } catch (e) {
      setErr(e.message || 'Upload failed')
    } finally {
      setSaving(false)
      e.target.value = ''
    }
  }

  async function onSave(e) {
    e.preventDefault()
    setErr(''); setMsg('')

    try {
      setSaving(true)
      await updateProfile({
        name,
        username,
        phone,
        address,
        photoUrl,
        // send expert-only fields too (backend ignore/accept safe)
        specialty,
        region,
      })
      setMsg('Profile saved')
    } catch (e) {
      setErr(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <aside className="md:col-span-1 space-y-4">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-5">
            <div className="flex items-center gap-3">
              {photoUrl
                ? <img src={photoUrl} alt="avatar" className="w-14 h-14 rounded-2xl object-cover border border-black/10" />
                : <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white grid place-items-center text-xl font-bold">{initials}</div>
              }
              <div>
                <div className="font-semibold">{name || user?.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{email || user?.email}</div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10"
                disabled={saving}
              >
                {saving ? 'Uploading…' : 'Upload new photo'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onChoose} />
            </div>

            <Link
              to="/dashboard"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700"
            >
              Go to Dashboard
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 12h11.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a 1 1 0 0 1 0 1.414l-5 5a1 1 0 1 1-1.414-1.414L16.586 14H5a1 1 0 1 1 0-2z"/>
              </svg>
            </Link>
          </div>

          <nav className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-3">
            <ul className="space-y-1 text-sm">
              <li><span className="block px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">Profile</span></li>
              <li><span className="block px-3 py-2 rounded-xl text-gray-500">Security (coming soon)</span></li>
              <li><span className="block px-3 py-2 rounded-xl text-gray-500">Preferences (coming soon)</span></li>
            </ul>
          </nav>
        </aside>

        {/* Right content */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-6">
            <h1 className="text-2xl font-bold text-emerald-900 dark:text-white">Edit Profile</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Update your information and avatar.</p>

            <form onSubmit={onSave} className="mt-6 grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm">Full name</span>
                <input
                  className="mt-1 w-full rounded-xl border p-2 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-sm">Username</span>
                <input
                  className="mt-1 w-full rounded-xl border p-2 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm">Email</span>
                <input
                  className="mt-1 w-full rounded-xl border p-2 bg-gray-100 dark:bg-white/10 border-black/10 dark:border-white/10"
                  value={email}
                  readOnly
                />
              </label>

              <label className="block">
                <span className="text-sm">Phone</span>
                <input
                  className="mt-1 w-full rounded-xl border p-2 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm">Address</span>
                <input
                  className="mt-1 w-full rounded-xl border p-2 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </label>

              {/* Expert-only fields */}
              {(user?.designation === 'expert') && (
                <>
                  <label className="block sm:col-span-2">
                    <span className="text-sm">Specialty (বিশেষ দক্ষতা)</span>
                    <input
                      className="mt-1 w-full rounded-xl border p-2 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10"
                      value={specialty}
                      onChange={e => setSpecialty(e.target.value)}
                      placeholder="যেমন: ধান জাত/রোগব্যবস্থাপনা, সবজি পোকা ব্যবস্থাপনা"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-sm">Region (অঞ্চল)</span>
                    <input
                      className="mt-1 w-full rounded-xl border p-2 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10"
                      value={region}
                      onChange={e => setRegion(e.target.value)}
                      placeholder="যেমন: খুলনা উপকূল / সিলেট হাওর / রাজশাহী বরেন্দ্র"
                    />
                  </label>
                </>
              )}

              {msg && <div className="sm:col-span-2 text-sm text-emerald-700">{msg}</div>}
              {err && <div className="sm:col-span-2 text-sm text-red-600">{err}</div>}

              <div className="sm:col-span-2">
                <button
                  disabled={saving}
                  className="px-5 py-3 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Optional: change password */}
          <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Change Password</h2>
            <PasswordForm />
          </div>
        </div>
      </div>
    </section>
  )
}

function PasswordForm() {
  const { token } = useAuth()
  const [curr, setCurr] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setMsg(''); setErr('')

    try {
      setSaving(true)
      const { ok, data } = await apiFetch('/auth/change-password', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        // backend আসলে শুধু newPassword নেয়; currentPassword পাঠালেও সমস্যা নেই
        body: { currentPassword: curr, newPassword: next }
      })
      if (!ok) throw new Error(data?.message || 'Failed')
      setMsg('Password updated'); setCurr(''); setNext('')
    } catch (e) {
      setErr(e.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 grid sm:grid-cols-2 gap-3">
      <input
        type="password"
        placeholder="Current password"
        className="rounded-xl border p-2 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10"
        value={curr}
        onChange={e => setCurr(e.target.value)}
      />
      <input
        type="password"
        placeholder="New password"
        className="rounded-xl border p-2 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10"
        value={next}
        onChange={e => setNext(e.target.value)}
      />
      {msg && <div className="sm:col-span-2 text-sm text-emerald-700">{msg}</div>}
      {err && <div className="sm:col-span-2 text-sm text-red-600">{err}</div>}
      <div className="sm:col-span-2">
        <button disabled={saving} className="px-4 py-2 rounded-xl bg-emerald-600 text-white">
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  )
}
