import { Link } from 'react-router-dom'
import Stories from '../components/Stories'

function Ticker() {
  const Item = ({ dot, text }) => (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full ${dot}`}></span>{text}
    </span>
  )
  return (
    <section className="border-y border-white/30 bg-white/40 dark:bg-white/5">
      <div className="overflow-hidden">
        <div className="marquee py-3 text-emerald-900 dark:text-emerald-100">
          <div className="marquee__group">
            <Item dot="bg-emerald-500" text="Crop & Soil Advisory" />
            <Item dot="bg-sky-500" text="Cost Estimation" />
            <Item dot="bg-lime-500" text="Market Insights" />
            <Item dot="bg-teal-500" text="Expert Connect" />
            <Item dot="bg-indigo-500" text="Insect and Leaf Disease Detector" />
          </div>
          <div className="marquee__group" aria-hidden="true">
            <Item dot="bg-emerald-500" text="Crop & Soil Advisory" />
            <Item dot="bg-sky-500" text="Cost Estimation" />
            <Item dot="bg-lime-500" text="Market Insights" />
            <Item dot="bg-teal-500" text="Expert Connect" />
            <Item dot="bg-indigo-500" text="Insect and Leaf Disease Detector" />
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const Card = ({ children, tone = 'white' }) => (
    <article className={`group rounded-3xl border p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition backdrop-blur
      ${tone === 'white' ? 'border-black/5 bg-white/80 dark:bg-white/5 dark:border-white/10' : 'bg-indigo-100/60 dark:bg-white/5 border-black/5 dark:border-white/10'}`}>
      {children}
    </article>
  )
  return (
    <div className="py-14">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 dark:text-white">Our Key Features</h2>
        <p className="mt-3 text-emerald-800/90 dark:text-emerald-200 max-w-2xl mx-auto">Everything you planned—clean and accessible.</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          <Card>
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-emerald-100 text-emerald-700 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 7 4 11 4 14a8 8 0 1 0 16 0c0-3-3-7-8-12z" /></svg>
            </div>
            <h3 className="font-semibold text-lg">Crop & Soil Advisory</h3>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Soil, season, and climate-aware suggestions with actionable steps.</p>
          </Card>

          <Card>
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-sky-100 text-sky-700 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v2H3zM3 11h12v2H3zM3 17h6v2H3z" /></svg>
            </div>
            <h3 className="font-semibold text-lg">Cost Estimation</h3>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Simple inputs, clear totals—no spreadsheets required.</p>
          </Card>

          <Card>
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-lime-100 text-lime-700 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3zm0 6h18v2H3zm0 6h18v2H3z" /></svg>
            </div>
            <h3 className="font-semibold text-lg">Market Insights</h3>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Spot prices and trends at a glance.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CTA() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl overflow-hidden border border-emerald-100/70 dark:border-white/10 shadow-glow backdrop-blur">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 bg-emerald-800 text-emerald-50">
              <h3 className="text-3xl font-bold">Bring modern agri tools to every field</h3>
              <p className="mt-2 text-emerald-100/90">Progressive enhancement—plug in data anytime.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/ask" className="px-5 py-3 rounded-xl bg-white text-emerald-800 font-medium hover:bg-emerald-50 transition">Ask Expert</a>
                <a href="/about" className="px-5 py-3 rounded-xl bg-white/10 border border-white/30 hover:bg-white/20">About Us</a>
              </div>
            </div>
            <div className="p-8 md:p-12 bg-emerald-900/10">
              <dl className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-2xl bg-white/40 md:bg-white/20 p-4">
                  <dt className="text-sm text-emerald-900/90">Advisories</dt><dd className="text-2xl font-extrabold">1.2k+</dd>
                </div>
                <div className="rounded-2xl bg-white/40 md:bg-white/20 p-4">
                  <dt className="text-sm text-emerald-900/90">Markets</dt><dd className="text-2xl font-extrabold">85+</dd>
                </div>
                <div className="rounded-2xl bg-white/40 md:bg-white/20 p-4">
                  <dt className="text-sm text-emerald-900/90">Experts</dt><dd className="text-2xl font-extrabold">120+</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-emerald-900">Demo metrics • Replace with real values when backend is ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <header className="relative">
      <section className="relative min-h-[62vh] grid place-items-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(to right bottom, rgba(6,95,70,.65), rgba(22,163,74,.55)), url('/expert.jpg')"
          }}>
        </div>
        <div className="absolute inset-0 -z-10 bg-grain opacity-20"></div>

        <div className="text-center text-white px-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Empowering Farmers with <span className="text-leaf-200 drop-shadow">AgroHelp</span>
          </h1>
          <p className="mt-4 text-lg max-w-2xl mx-auto text-white/90">
            Smart, actionable guidance—crop advice, market awareness, and our new <span className="font-semibold">Insect Detector</span>.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/insects" className="inline-flex items-center gap-2 rounded-xl bg-white text-emerald-800 px-5 py-3 font-semibold shadow-md hover:shadow-lg hover:-translate-y-[1px] transition">
              Try Insect Detector
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M5 12h11.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 1 1-1.414-1.414L16.586 14H5a1 1 0 1 1 0-2z" /></svg>
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl border border-white/70 px-5 py-3 font-medium text-white hover:bg-white/80 hover:text-emerald-800 transition">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </header>
  )
}

<Stories />

export default function Home() {
  return (
    <>
      <Hero />
      <Ticker />
      <section id="features"><Features /></section>
      <section id="cta"><CTA /></section>
      <section id="stories"><Stories /></section>
      {/* simple FAQ inline */}
      <section id="faq" className="py-16 bg-emerald-50/70 dark:bg-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold text-emerald-900 dark:text-white">Frequently asked questions</h3>
            <p className="text-emerald-800/90 dark:text-emerald-200 mt-2">Plain details—upgrade to interactive later.</p>
          </div>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {[
              ['How will data work?', 'Start static; add APIs for soil/weather/market.'],
              ['Is Bangla supported?', 'Yes—typography and spacing tuned.'],
              ['Can it work offline?', 'Use a Service Worker to cache key pages.'],
              ['How accessible is it?', 'High contrast, large targets, semantic HTML.'],
            ].map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-5 open:shadow-md transition backdrop-blur">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-emerald-900 dark:text-white">
                  {q}<span className="ml-3 group-open:rotate-45 transition">+</span>
                </summary>
                <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
