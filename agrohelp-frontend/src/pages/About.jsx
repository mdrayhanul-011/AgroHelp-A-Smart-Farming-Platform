import { FaSeedling, FaChartLine, FaCalculator, FaBug, FaUsers, FaBoxOpen } from "react-icons/fa";

export default function About() {
  return (
    <section className="py-16 bg-white dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-emerald-900 dark:text-emerald-100">
          About AgroHelp
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Empowering farmers with modern, accessible tools for smarter decisions, healthier crops, and stronger incomes.
        </p>

        {/* Mission */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">Our Mission</h2>
          <p className="mt-3 text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
            AgroHelp combines crop advisory, market insights, cost estimation, pest detection, and community updates into a single,
            easy-to-use platform. Our mission is to reduce guesswork, increase transparency, and improve resilience for every grower.
          </p>
        </div>

        {/* Features grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
          <div className="rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/10">
            <FaSeedling className="text-3xl text-emerald-700 dark:text-emerald-300" />
            <h3 className="mt-3 font-semibold text-emerald-900 dark:text-emerald-100">Advisory</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              Localized crop, weather, and soil recommendations that are always accessible.
            </p>
          </div>
          <div className="rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/10">
            <FaChartLine className="text-3xl text-emerald-700 dark:text-emerald-300" />
            <h3 className="mt-3 font-semibold text-emerald-900 dark:text-emerald-100">Market Insights</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              Transparent spot prices, recent changes, and short-term trends to plan smarter.
            </p>
          </div>
          <div className="rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/10">
            <FaCalculator className="text-3xl text-emerald-700 dark:text-emerald-300" />
            <h3 className="mt-3 font-semibold text-emerald-900 dark:text-emerald-100">Cost Estimation</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              Plan your input costs and budgets with confidence before each season.
            </p>
          </div>
          <div className="rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/10">
            <FaBug className="text-3xl text-emerald-700 dark:text-emerald-300" />
            <h3 className="mt-3 font-semibold text-emerald-900 dark:text-emerald-100">Pest Detection</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              AI-powered image analysis to detect pests early and prevent losses.
            </p>
          </div>
          <div className="rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/10">
            <FaUsers className="text-3xl text-emerald-700 dark:text-emerald-300" />
            <h3 className="mt-3 font-semibold text-emerald-900 dark:text-emerald-100">Stories</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              Share experiences and learn from the farming community across regions.
            </p>
          </div>
          <div className="rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/10">
            <FaBoxOpen className="text-3xl text-emerald-700 dark:text-emerald-300" />
            <h3 className="mt-3 font-semibold text-emerald-900 dark:text-emerald-100">Inputs Directory</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              Access a catalog of seeds, fertilizers, and equipment to find the right inputs.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl p-6 bg-emerald-600 text-white shadow">
            <div className="text-3xl font-extrabold">24/7</div>
            <p className="mt-1 text-sm">Access anywhere</p>
          </div>
          <div className="rounded-2xl p-6 bg-emerald-600 text-white shadow">
            <div className="text-3xl font-extrabold">1 App</div>
            <p className="mt-1 text-sm">Advisory • Markets • Pests</p>
          </div>
          <div className="rounded-2xl p-6 bg-emerald-600 text-white shadow">
            <div className="text-3xl font-extrabold">Zero Cost</div>
            <p className="mt-1 text-sm">Core features are free</p>
          </div>
        </div>


      </div>
    </section>
  );
}
