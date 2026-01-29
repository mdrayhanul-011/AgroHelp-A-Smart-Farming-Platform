import { useState, useEffect, useMemo } from "react";

export default function Market() {
  const [markets, setMarkets] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarkets();
  }, []);

  async function fetchMarkets() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/markets`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch market data");
      setMarkets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    if (!debounced) return markets;
    return markets.filter((m) => (m.product || "").toLowerCase().includes(debounced));
  }, [markets, debounced]);

  return (
    <section className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 dark:text-white">Market Insights</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Spot prices and trends at a glance.</p>
          </div>
          <button
            onClick={fetchMarkets}
            className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {/* Search box */}
        <div className="mt-5 relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product…"
            className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-2.5 pl-10 outline-none"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔎</span>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              aria-label="Clear"
            >
              ✕
            </button>
          )}
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {/* Market list */}
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-slate-500">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-slate-500">
              {query ? "No matches found." : "No market data available."}
            </div>
          ) : (
            filtered.map((m) => (
              <div
                key={m._id}
                className="rounded-2xl p-5 bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:shadow-sm transition"
              >
                <h3 className="font-semibold">{m.product}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Avg ৳ {m.price}/ton • 7-day trend: {m.trend} {m.trendChange}
                </p>
                {m.updatedAt && (
                  <p className="mt-2 text-xs text-slate-500">Updated {new Date(m.updatedAt).toLocaleString()}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
