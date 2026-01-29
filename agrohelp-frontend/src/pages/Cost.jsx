import { useEffect, useMemo, useState } from 'react';

const money = (n) => `৳ ${Number(n || 0).toLocaleString()}`;
const TABS = [
  { key: 'seed', label: 'বীজ' },
  { key: 'fertilizer', label: 'সার' },
  { key: 'pesticide', label: 'কীটনাশক' },
  { key: 'equipment', label: 'সরঞ্জাম' },
  { key: 'irrigation', label: 'সেচ' },
  { key: 'other', label: 'অন্যান্য' },
];

const toNum = (s) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

export default function Cost() {
  // keep manual inputs as strings
  const [seedIn, setSeedIn] = useState('');
  const [fertIn, setFertIn] = useState('');
  const [laborIn, setLaborIn] = useState('');
  const [miscIn, setMiscIn] = useState('');

  // derive numbers only for math
  const seed = useMemo(() => toNum(seedIn), [seedIn]);
  const fert = useMemo(() => toNum(fertIn), [fertIn]);
  const labor = useMemo(() => toNum(laborIn), [laborIn]);
  const misc = useMemo(() => toNum(miscIn), [miscIn]);

  const [active, setActive] = useState('seed');
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('');
  // rows: store unitPrice/qty as strings to allow clearing
  const [rows, setRows] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cost_rows2') || '[]'); }
    catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => localStorage.setItem('cost_rows2', JSON.stringify(rows)), [rows]);

  const manualTotal = useMemo(() => seed + fert + labor + misc, [seed, fert, labor, misc]);
  const marketTotal = useMemo(
    () => rows.reduce((sum, r) => sum + toNum(r.unitPrice) * toNum(r.qty), 0),
    [rows]
  );
  const grand = manualTotal + marketTotal;

  function Input({ label, value, onChange }) {
    return (
      <label className="block">
        <span className="text-sm">{label}</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border p-2 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10"
        />
      </label>
    );
  }

  async function load() {
    setLoading(true); setErr('');
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = new URL(base + '/inputs');
      url.searchParams.set('category', active);
      if (q) url.searchParams.set('q', q);
      if (region) url.searchParams.set('region', region);
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load inputs');
      setList(data || []);
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load(); }, [active, q, region]); // eslint-disable-line

  function addRow(m) {
    setRows(prev => [...prev, {
      id: crypto.randomUUID(),
      product: m.product,
      unit: m.unit || 'unit',
      unitPrice: m.price !== undefined && m.price !== null ? String(m.price) : '',
      qty: '1',
      category: m.category,
    }]);
  }
  function updateRow(id, patch) { setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r)); }
  function removeRow(id) { setRows(prev => prev.filter(r => r.id !== id)); }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="text-3xl font-bold text-emerald-900 dark:text-white">Cost Estimation</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">বীজ/সার/ইনপুট থেকে আইটেম বাছাই করুন এবং নিজের খরচ যোগ করুন।</p>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl p-5 bg-white/80 dark:bg-white/5 border">
            <h3 className="font-semibold">নিজের খরচ</h3>
            <div className="space-y-3 mt-2">
              <Input label="Seed (৳)" value={seedIn} onChange={setSeedIn} />
              <Input label="Fertilizer (৳)" value={fertIn} onChange={setFertIn} />
              <Input label="Labor (৳)" value={laborIn} onChange={setLaborIn} />
              <Input label="Misc (৳)" value={miscIn} onChange={setMiscIn} />
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span>Manual total</span><span className="font-semibold">{money(manualTotal)}</span>
            </div>
          </div>

          <div className="md:col-span-2 rounded-2xl p-5 bg-white/80 dark:bg-white/5 border">
            <div className="flex gap-2 flex-wrap">
              {TABS.map(t => (
                <button key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`px-3 py-1.5 rounded-xl border ${active === t.key ? 'bg-emerald-600 text-white' : 'hover:bg-white/60'}`}>
                  {t.label}
                </button>
              ))}
              <input className="ml-auto border rounded-xl px-3 py-1.5" placeholder="Search"
                value={q} onChange={e => setQ(e.target.value)} />
              <input className="border rounded-xl px-3 py-1.5" placeholder="Region"
                value={region} onChange={e => setRegion(e.target.value)} />
            </div>

            {err && <div className="mt-3 text-red-600">{err}</div>}
            {loading ? <div className="mt-3 text-slate-500">Loading…</div> : (
              <div className="mt-3 grid lg:grid-cols-2 gap-3">
                <div className="rounded-xl border p-3 bg-white/70">
                  <div className="text-sm font-medium mb-2">Market {TABS.find(t => t.key === active)?.label}</div>
                  <div className="max-h-64 overflow-auto space-y-2">
                    {list.length ? list.map(m => (
                      <div key={m._id} className="flex items-center justify-between gap-3 border rounded-lg p-2">
                        <div>
                          <div className="font-medium">{m.product}</div>
                          <div className="text-xs text-slate-500">৳ {Number(m.price).toLocaleString()} / {m.unit || 'unit'} {m.region ? `• ${m.region}` : ''}</div>
                        </div>
                        <button className="px-2 py-1 text-sm rounded-lg border" onClick={() => addRow(m)}>Add</button>
                      </div>
                    )) : <div className="text-sm text-slate-500">No items</div>}
                  </div>
                </div>

                <div className="rounded-xl border p-3 bg-white/70">
                  <div className="text-sm font-medium mb-2">Selected Items</div>
                  <div className="space-y-2">
                    {!rows.length ? <div className="text-sm text-slate-500">No items selected.</div> :
                      rows.map(r => {
                        const line = toNum(r.unitPrice) * toNum(r.qty);
                        return (
                          <div key={r.id} className="border rounded-lg p-2">
                            <div className="flex justify-between">
                              <div className="font-medium">{r.product}</div>
                              <button className="text-red-600 text-sm" onClick={() => removeRow(r.id)}>Remove</button>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              <label className="text-xs">
                                <div>Unit Price</div>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={r.unitPrice}
                                  onChange={e => updateRow(r.id, { unitPrice: e.target.value })}
                                  className="mt-1 w-full border rounded px-2 py-1"
                                />
                              </label>
                              <label className="text-xs">
                                <div>Qty ({r.unit})</div>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={r.qty}
                                  onChange={e => updateRow(r.id, { qty: e.target.value })}
                                  className="mt-1 w-full border rounded px-2 py-1"
                                />
                              </label>
                              <div className="text-right self-end font-semibold">{money(line)}</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span>Market items total</span><span className="font-semibold">{money(marketTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl p-5 bg-emerald-50/60 border">
          <div className="flex justify-between text-xl">
            <span className="font-medium">Grand Total</span>
            <span className="font-bold">{money(grand)}</span>
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Manual {grand ? ((manualTotal / grand) * 100).toFixed(0) : 0}% • Market {grand ? ((marketTotal / grand) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>
    </section>
  );
}
