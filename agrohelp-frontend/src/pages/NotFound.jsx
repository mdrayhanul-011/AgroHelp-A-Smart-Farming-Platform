import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="py-20 text-center">
      <h1 className="text-5xl font-bold text-emerald-800">404</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
      <Link to="/" className="inline-block mt-6 px-5 py-3 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700">Go Home</Link>
    </section>
  )
}
