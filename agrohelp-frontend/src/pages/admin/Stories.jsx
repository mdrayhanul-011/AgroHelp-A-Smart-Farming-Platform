import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

function Avatar({ url, name }) {
  const fallback = "https://ui-avatars.com/api/?background=random&name=" + encodeURIComponent(name || "User");
  return (
    <img
      src={url || fallback}
      alt={name || "User"}
      className="w-10 h-10 rounded-full object-cover border border-black/10 dark:border-white/10"
    />
  );
}

function snip(text = '', n = 90) {
  const t = String(text || '');
  return t.length > n ? t.slice(0, n).trimEnd() + '…' : t;
}

function Modal({ open, title, onClose, onSubmit, initial = { title: '', body: '', photoUrl: '' }, submitting }) {
  const [formTitle, setFormTitle] = useState(initial.title || '');
  const [formBody, setFormBody] = useState(initial.body || '');
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl || '');

  useEffect(() => {
    if (open) {
      setFormTitle(initial?.title || '');
      setFormBody(initial?.body || '');
      setPhotoUrl(initial?.photoUrl || initial?.ownerPhotoUrl || '');
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl">
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">✕</button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ title: formTitle.trim(), body: formBody.trim(), photoUrl: photoUrl.trim() });
          }}
          className="p-5 space-y-4"
        >
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-white/5 px-3 py-2 outline-none"
              placeholder="Story title"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Body</label>
            <textarea
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              required
              rows={6}
              className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-white/5 px-3 py-2 outline-none"
              placeholder="Write the story…"
            />
            <p className="mt-1 text-xs text-slate-500">This will appear truncated in the table.</p>
          </div>

          <div>
            <label className="text-sm font-medium">Photo URL (optional)</label>
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-white/5 px-3 py-2 outline-none"
              placeholder="https://…"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black disabled:opacity-60">
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Stories() {
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: 'Bearer ' + token }), [token]);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const { ok, data } = await apiFetch('/admin/stories', { headers });
      if (!ok) setErr(data?.message || 'Failed to load');
      else setList(data.stories || []);
    } catch {
      setErr('Error fetching data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateSubmit(values) {
    if (!values.title || !values.body) return;
    setSubmitting(true);
    try {
      const { ok, data } = await apiFetch('/admin/stories', {
        method: 'POST',
        body: { title: values.title, body: values.body, photoUrl: values.photoUrl || undefined },
        headers,
      });
      if (ok) {
        setCreateOpen(false);
        setList((prev) => [
          {
            _id: data?.story?._id || Math.random().toString(36),
            title: values.title,
            body: values.body,
            ownerName: data?.story?.ownerName || '—',
            ownerPhotoUrl: data?.story?.ownerPhotoUrl || values.photoUrl || null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        Swal.fire('Error', data?.message || 'Create failed', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(values) {
    if (!editing?._id) return;
    setSubmitting(true);
    try {
      const { ok, data } = await apiFetch(`/admin/stories/${editing._id}`, {
        method: 'PATCH',
        body: { title: values.title, body: values.body, photoUrl: values.photoUrl || undefined },
        headers,
      });
      if (ok) {
        setEditOpen(false);
        setList((prev) =>
          prev.map((s) =>
            String(s._id) === String(editing._id)
              ? {
                ...s,
                title: values.title,
                body: values.body,
                ownerPhotoUrl: values.photoUrl || s.ownerPhotoUrl || null,
                updatedAt: new Date().toISOString(),
              }
              : s
          )
        );
      } else {
        Swal.fire('Error', data?.message || 'Update failed', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    const res = await Swal.fire({
      title: 'Delete this story?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });
    if (!res.isConfirmed) return;
    setDeletingId(id);
    try {
      const { ok, data } = await apiFetch(`/admin/stories/${id}`, { method: 'DELETE', headers });
      if (ok) {
        setList((prev) => prev.filter((s) => String(s._id) !== String(id)));
        Swal.fire('Deleted', 'Story removed.', 'success');
      } else {
        Swal.fire('Error', data?.message || 'Delete failed', 'error');
      }
    } catch {
      Swal.fire('Error', 'Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const createInitial = useMemo(() => ({ title: '', body: '', photoUrl: '' }), []);
  const editInitial = useMemo(
    () =>
      editing
        ? { title: editing.title || '', body: editing.body || '', photoUrl: editing.ownerPhotoUrl || '' }
        : { title: '', body: '', photoUrl: '' },
    [editing]
  );

  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Stories</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Latest 50 stories from all users.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="px-3 py-1.5 rounded-xl border hover:bg-white/60">Refresh</button>
          <button onClick={() => setCreateOpen(true)} className="px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black">Add Story</button>
        </div>
      </div>

      {err && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{err}</div>}

      <div className="mt-4 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/70 dark:bg-white/5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-black/5 dark:bg-white/10 sticky top-0 z-10 backdrop-blur">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Photo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Body</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-slate-500">Loading…</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-slate-500">No stories</td></tr>
              ) : (
                list.map((s) => (
                  <tr key={s._id} className="hover:bg-black/5 dark:hover:bg-white/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar url={s.ownerPhotoUrl} name={s.ownerName} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{s.ownerName || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium">{s.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" title={s.body || ''}>
                      <div className="max-w-xl truncate">{snip(s.body, 90)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => { setEditing(s); setEditOpen(true); }}
                          className="px-2 py-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          disabled={deletingId === s._id}
                          className="px-2 py-1 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60"
                        >
                          {deletingId === s._id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={createOpen}
        title="Add Story"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        submitting={submitting}
        initial={createInitial}
      />

      <Modal
        open={editOpen}
        title="Edit Story"
        onClose={() => { setEditOpen(false); setEditing(null); }}
        onSubmit={handleEditSubmit}
        submitting={submitting}
        initial={editInitial}
      />
    </div>
  );
}
