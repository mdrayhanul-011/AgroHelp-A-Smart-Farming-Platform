import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

const CATS = [
  { value:'seed', label:'Seed (বীজ)' },
  { value:'fertilizer', label:'Fertilizer (সার)' },
  { value:'pesticide', label:'Pesticide ( কীটনাশক )' },
  { value:'equipment', label:'Equipment (সরঞ্জাম)' },
  { value:'irrigation', label:'Irrigation (সেচ)' },
  { value:'other', label:'Other' },
];

export default function AdminInputsPage() {
  const { token } = useAuth();
  const headers = useMemo(()=>({ Authorization: 'Bearer ' + token, 'Content-Type':'application/json' }),[token]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [region, setRegion] = useState('');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ product:'', category:'seed', unit:'kg', price:'', region:'', source:'', notes:'' });

  async function load() {
    setLoading(true); setErr('');
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = new URL(base + '/inputs');
      if (q) url.searchParams.set('q', q);
      if (cat) url.searchParams.set('category', cat);
      if (region) url.searchParams.set('region', region);
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load');
      setItems(data);
    } catch(e) {
      setErr(e.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [q, cat, region]); // eslint-disable-line

  function startEdit(row) {
    setEditing(row._id);
    setForm({
      product: row.product || '',
      category: row.category || 'seed',
      unit: row.unit || 'unit',
      price: row.price ?? '',
      region: row.region || '',
      source: row.source || '',
      notes: row.notes || '',
    });
  }

  function resetForm() {
    setEditing(null);
    setForm({ product:'', category:'seed', unit:'kg', price:'', region:'', source:'', notes:'' });
  }

  async function save(e) {
    e.preventDefault();
    try {
      const path = editing ? `/inputs/${editing}` : '/inputs';
      const method = editing ? 'PUT' : 'POST';
      const payload = { ...form, price: Number(form.price) };
      const { ok, data } = await apiFetch(path, { method, headers, body: payload });
      if (!ok) return alert(data?.message || 'Save failed');
      resetForm();
      load();
    } catch(e) {
      alert(e.message || 'Save failed');
    }
  }

  async function remove(id) {
    if (!confirm('Delete this item?')) return;
    const { ok, data } = await apiFetch(`/inputs/${id}`, { method:'DELETE', headers });
    if (!ok) return alert(data?.message || 'Delete failed');
    setItems(prev => prev.filter(x => x._id !== id));
  }

  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="text-2xl font-bold">Admin • Farm Inputs</h1>
        <p className="text-sm text-slate-600">Manage prices for বীজ/সার/কীটনাশক/সরঞ্জাম…</p>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <input className="border rounded-xl px-3 py-2" placeholder="Search product"
                 value={q} onChange={e=>setQ(e.target.value)} />
          <select className="border rounded-xl px-3 py-2" value={cat} onChange={e=>setCat(e.target.value)}>
            <option value="">All categories</option>
            {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input className="border rounded-xl px-3 py-2" placeholder="Region (optional)"
                 value={region} onChange={e=>setRegion(e.target.value)} />
          <button onClick={load} className="px-3 py-2 rounded-xl border">Refresh</button>
        </div>

        {err && <div className="mt-3 text-red-600">{err}</div>}

        {/* Form */}
        <div className="mt-6 rounded-2xl border p-4 bg-white/70 dark:bg-white/5">
          <h3 className="font-semibold">{editing ? 'Edit item' : 'Add new item'}</h3>
          <form onSubmit={save} className="grid md:grid-cols-3 gap-3 mt-3">
            <input className="border rounded-xl px-3 py-2" placeholder="Product name"
                   value={form.product} onChange={e=>setForm(f=>({...f, product:e.target.value}))} required />
            <select className="border rounded-xl px-3 py-2" value={form.category}
                    onChange={e=>setForm(f=>({...f, category:e.target.value}))}>
              {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input className="border rounded-xl px-3 py-2" placeholder="Unit (kg/litre/piece)"
                   value={form.unit} onChange={e=>setForm(f=>({...f, unit:e.target.value}))} />

            <input type="number" min="0" step="0.01" className="border rounded-xl px-3 py-2" placeholder="Price"
                   value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))} required />
            <input className="border rounded-xl px-3 py-2" placeholder="Region"
                   value={form.region} onChange={e=>setForm(f=>({...f, region:e.target.value}))} />
            <input className="border rounded-xl px-3 py-2" placeholder="Source"
                   value={form.source} onChange={e=>setForm(f=>({...f, source:e.target.value}))} />

            <textarea className="md:col-span-3 border rounded-xl px-3 py-2" placeholder="Notes"
                      value={form.notes} onChange={e=>setForm(f=>({...f, notes:e.target.value}))} />
            <div className="md:col-span-3 flex gap-2">
              <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white">{editing ? 'Update' : 'Add'}</button>
              {editing && <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl border">Cancel</button>}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="mt-6 grid lg:grid-cols-2 gap-3">
          {loading ? <div>Loading…</div> : items.map(it => (
            <div key={it._id} className="rounded-xl border p-3 bg-white/70 dark:bg-white/5">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{it.product}</div>
                  <div className="text-xs text-slate-500">
                    {it.category} • ৳ {Number(it.price).toLocaleString()} / {it.unit || 'unit'} {it.region ? `• ${it.region}` : ''}
                  </div>
                  {it.notes && <div className="text-xs mt-1">{it.notes}</div>}
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-xl border" onClick={()=>startEdit(it)}>Edit</button>
                  <button className="px-3 py-1 rounded-xl border text-red-600" onClick={()=>remove(it._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {!loading && !items.length && <div className="text-slate-500">No items</div>}
        </div>
      </div>
    </section>
  );
}
