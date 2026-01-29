import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

function Avatar({ url, name }) {
  const fallback =
    "https://ui-avatars.com/api/?background=random&name=" +
    encodeURIComponent(name || "Expert");
  return (
    <img
      src={url || fallback}
      alt={name || "Expert"}
      className="w-10 h-10 rounded-full object-cover border border-black/10 dark:border-white/10"
    />
  );
}

function ModalAsk({ open, expert, onClose, onSubmit, submitting }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  if (!open || !expert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl">
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h3 className="font-semibold">Ask {expert.name || "Expert"}</h3>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">✕</button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ expertId: expert._id, message: message.trim() });
          }}
          className="p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Avatar url={expert.photoUrl} name={expert.name} />
            <div>
              <div className="font-medium">{expert.name}</div>
              <div className="text-xs text-slate-500">
                {expert.specialty || "Agronomy"}{expert.region ? ` • ${expert.region}` : ""}
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Your question</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-white/5 px-3 py-2 outline-none"
              placeholder="Describe your issue. Include crop, field condition, and what you’ve tried."
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60">
              {submitting ? "Sending…" : "Send Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalQuestionDetails({ open, item, onClose }) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl">
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h3 className="font-semibold">Question Details</h3>
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600/10 grid place-items-center text-emerald-700">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-slate-500">Expert</div>
              <div className="font-medium">{item.expertName || "—"}</div>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-white/5">
            <div className="text-xs uppercase text-slate-500 mb-1">Question</div>
            {/* Force wrapping for long words/URLs */}
            <div className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {item.message}
            </div>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-white/5">
            <div className="text-xs uppercase text-slate-500 mb-1">Reply</div>
            {item.answer ? (
              <div className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {item.answer}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No reply yet.</div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600">
            <div>
              <span className="text-slate-500">Status:</span>{" "}
              {item.answer ? "answered" : item.status || "pending"}
            </div>
            <div>
              <span className="text-slate-500">Asked:</span>{" "}
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function wordsnip(text = "", maxWords = 15) {
  const words = String(text || "").trim().split(/\s+/);
  return words.length > maxWords ? words.slice(0, maxWords).join(" ") + "…" : words.join(" ");
}

function snip(t = "", n = 90) {
  const s = String(t || "");
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

export default function AskExpert() {
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: "Bearer " + token }), [token]);

  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  const [askOpen, setAskOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [myQs, setMyQs] = useState([]);
  const [loadingQs, setLoadingQs] = useState(true);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  async function loadExperts() {
    setLoading(true);
    setErr("");
    try {
      const path = debounced ? `/experts?search=${encodeURIComponent(debounced)}` : "/experts";
      const { ok, data } = await apiFetch(path, { headers });
      if (!ok) setErr(data?.message || "Failed to load experts");
      else setExperts(Array.isArray(data?.experts) ? data.experts : Array.isArray(data) ? data : []);
    } catch {
      setErr("Failed to load experts");
    } finally {
      setLoading(false);
    }
  }

  async function loadMyQuestions() {
    setLoadingQs(true);
    try {
      const { ok, data } = await apiFetch("/questions/me", { headers });
      if (ok) setMyQs(Array.isArray(data?.questions) ? data.questions : []);
    } finally {
      setLoadingQs(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadExperts();
    loadMyQuestions();
  }, [token, debounced]);

  async function handleAskSubmit({ expertId, message }) {
    if (!expertId || !message) return;
    setSubmitting(true);
    try {
      const { ok, data } = await apiFetch("/questions", {
        method: "POST",
        headers,
        body: { expertId, message },
      });
      if (!ok) {
        alert(data?.message || "Failed to send question");
        return;
      }
      setAskOpen(false);
      setSelected(null);
      setMyQs((prev) => [
        {
          _id: data?.question?._id || Math.random().toString(36),
          expertId,
          expertName: data?.question?.expertName || selected?.name || "Expert",
          message,
          answer: null,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 dark:text-white">Ask an Expert</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Find a specialist and send your question.
            </p>
          </div>
          <button
            onClick={() => {
              setQuery("");
              loadExperts();
              loadMyQuestions();
            }}
            className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search experts by name, specialty, or region…"
            className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-2.5 outline-none"
          />
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

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
            {err}
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/70 dark:bg-white/5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-black/5 dark:bg-white/10 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Photo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Specialty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Region</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-slate-500">Loading…</td>
                  </tr>
                ) : experts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-slate-500">
                      {debounced ? "No experts match your search." : "No experts available."}
                    </td>
                  </tr>
                ) : (
                  experts.map((ex) => (
                    <tr key={ex._id} className="hover:bg-black/5 dark:hover:bg-white/10">
                      <td className="px-4 py-3"><Avatar url={ex.photoUrl} name={ex.name} /></td>
                      <td className="px-4 py-3 text-sm font-medium">{ex.name || "—"}</td>
                      <td className="px-4 py-3 text-sm">{ex.specialty || "—"}</td>
                      <td className="px-4 py-3 text-sm">{ex.region || "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => { setSelected(ex); setAskOpen(true); }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Ask
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <h2 className="mt-10 text-xl font-bold text-emerald-900 dark:text-white">My Questions</h2>
        <div className="mt-3 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/70 dark:bg-white/5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-black/5 dark:bg-white/10 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Expert</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Question</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Reply</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Asked At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {loadingQs ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-slate-500">Loading…</td></tr>
                ) : myQs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-slate-500">No questions yet.</td></tr>
                ) : (
                  myQs.map((q) => (
                    <tr
                      key={q._id}
                      className="hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                      onClick={() => { setDetailsItem(q); setDetailsOpen(true); }}
                    >
                      <td className="px-4 py-3 text-sm">{q.expertName || q.expert?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm" title={q.message}>
                        <div className="max-w-xl truncate">{wordsnip(q.message, 15)}</div>
                      </td>
                      <td className="px-4 py-3 text-sm" title={q.answer || ""}>
                        {q.answer ? <div className="max-w-xl truncate">{wordsnip(q.answer, 20)}</div> : <span className="text-slate-500">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={
                            "px-2 py-0.5 rounded-full text-xs " +
                            (q.answer
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")
                          }
                        >
                          {q.answer ? "answered" : (q.status || "pending")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{q.createdAt ? new Date(q.createdAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ModalAsk
        open={askOpen}
        expert={selected}
        onClose={() => { setAskOpen(false); setSelected(null); }}
        onSubmit={handleAskSubmit}
        submitting={submitting}
      />

      <ModalQuestionDetails
        open={detailsOpen}
        item={detailsItem}
        onClose={() => { setDetailsOpen(false); setDetailsItem(null); }}
      />
    </section>
  );
}
