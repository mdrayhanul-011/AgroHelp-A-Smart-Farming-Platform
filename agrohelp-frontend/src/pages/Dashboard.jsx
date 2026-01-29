import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import Swal from 'sweetalert2';

function Avatar({ url, name }) {
  const fallback =
    'https://ui-avatars.com/api/?background=random&name=' +
    encodeURIComponent(name || 'User');
  return (
    <img
      src={url || fallback}
      alt={name || 'User'}
      className="w-10 h-10 rounded-full object-cover border border-black/10 dark:border-white/10"
    />
  );
}

function snip(text = '', n = 90) {
  const t = String(text || '');
  return t.length > n ? t.slice(0, n).trimEnd() + '…' : t;
}

function Modal({
  open,
  title,
  onClose,
  onSubmit,
  initial = { title: '', body: '' },
  submitting,
}) {
  const [formTitle, setFormTitle] = useState(initial.title || '');
  const [formBody, setFormBody] = useState(initial.body || '');

  useEffect(() => {
    if (open) {
      setFormTitle(initial?.title || '');
      setFormBody(initial?.body || '');
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl">
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ title: formTitle.trim(), body: formBody.trim() });
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
              placeholder="Write your story…"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white dark:text-black disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const headers = useMemo(
    () => ({ Authorization: 'Bearer ' + token }),
    [token]
  );

  console.log(user);
  const [stories, setStories] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const { ok, data } = await apiFetch('/stories/me', { headers });
      if (!ok) setErr(data?.message || 'Failed to load stories');
      else setStories(data.stories || []);
    } catch {
      setErr('An error occurred while loading stories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load();
  }, [token]);

 // CREATE
async function handleCreateSubmit(values) {
  if (!values.title || !values.body) return;
  setSubmitting(true);
  try {
    const { ok, data } = await apiFetch('/stories', {
      method: 'POST',
      headers,
      body: {
        title: values.title,
        body: values.body,
        ownerId: user?._id || user?.id, // 👈 এখানেই ইউজারের id পাঠালাম
        ownerPhotoUrl: user?.photoUrl || null,
        ownerName: user?.name || user?.username || '—'
      },
    });

    if (ok) {
      setCreateOpen(false);
      setStories((prev) => [
        { ...data.story },
        ...prev,
      ]);
    } else {
      Swal.fire('Error', data?.message || 'Create failed', 'error');
    }
  } catch (e) {
    console.error('Create error:', e);
    Swal.fire('Error', 'Create failed', 'error');
  } finally {
    setSubmitting(false);
  }
}


// EDIT
async function handleEditSubmit(values) {
  const id = String(editing?._id || '');
  if (!id) {
    Swal.fire('Error', 'No story ID to update', 'error');
    return;
  }

  setSubmitting(true);
  try {
    const { ok, data } = await apiFetch(`/admin/stories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: {
        title: values.title,
        body: values.body,
        // ❌ don't send ownerId; server checks req.user._id
      },
    });

    if (ok) {
      const updated = data?.story || {
        ...editing,
        title: values.title,
        body: values.body,
        updatedAt: new Date().toISOString(),
      };

      setEditOpen(false);
      setEditing(null);

      setStories((prev) =>
        prev.map((s) => (String(s._id) === id ? { ...s, ...updated } : s))
      );
    } else {
      Swal.fire('Error', data?.message || 'Update failed', 'error');
    }
  } catch (e) {
    console.error('Update error:', e);
    Swal.fire('Error', 'Update failed', 'error');
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
      // NOTE: Your backend currently exposes DELETE only for /api/admin/stories/:id.
      const { ok, data } = await apiFetch(`/admin/stories/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (ok) {
        setStories((prev) => prev.filter((s) => String(s._id) !== String(id)));
        Swal.fire('Deleted', 'Story removed.', 'success');
      } else {
        Swal.fire('Error', data?.message || 'Delete failed (requires admin route)', 'error');
      }
    } catch {
      Swal.fire('Error', 'Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const meName = user?.name || '—';
  const mePhoto = user?.photoUrl || null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 dark:text-white">
              Your Stories
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Create and manage your updates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Add Story
            </button>
            <button
              onClick={load}
              className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
            {err}
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/70 dark:bg-white/5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-black/5 dark:bg-white/10 sticky top-0 z-10 backdrop-blur">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Photo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Body
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : stories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-slate-500">
                      No stories yet.
                    </td>
                  </tr>
                ) : (
                  stories.map((s) => (
                    <tr
                      key={s._id}
                      className="hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <td className="px-4 py-3">
                        <Avatar url={mePhoto} name={meName} />
                      </td>
                      <td className="px-4 py-3 text-sm">{meName}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {s.title}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300"
                        title={s.body || ''}
                      >
                        <div className="max-w-xl truncate">{snip(s.body, 90)}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setEditing(s);
                              setEditOpen(true);
                            }}
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
      </div>

      {/* Add */}
      <Modal
        open={createOpen}
        title="Add Story"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        submitting={submitting}
        initial={{ title: '', body: '' }}
      />

      {/* Edit (NOTE: requires admin PATCH endpoint in your backend) */}
      <Modal
        open={editOpen}
        title="Edit Story"
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onSubmit={handleEditSubmit}
        submitting={submitting}
        initial={
          editing ? { title: editing.title || '', body: editing.body || '' } : { title: '', body: '' }
        }
      />
    </section>
  );
}
