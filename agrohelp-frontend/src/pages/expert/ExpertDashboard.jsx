import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";

function Avatar({ url, name }) {
    const fallback =
        "https://ui-avatars.com/api/?background=random&name=" +
        encodeURIComponent(name || "User");
    return (
        <img
            src={url || fallback}
            alt={name || "User"}
            className="w-10 h-10 rounded-full object-cover border border-black/10 dark:border-white/10"
        />
    );
}

function firstWords(text = "", n = 4) {
    const parts = String(text || "").trim().split(/\s+/);
    return parts.length <= n ? String(text || "") : parts.slice(0, n).join(" ") + "…";
}

function ModalReply({ open, question, onClose, onSubmit, submitting }) {
    const [answer, setAnswer] = useState(question?.answer || "");
    useEffect(() => { if (open) setAnswer(question?.answer || ""); }, [open, question]);
    if (!open || !question) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl">
                <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold">Reply to {question.askerName || "User"}</h3>
                    <button onClick={onClose} className="text-sm px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-white/5">
                        <div className="text-xs uppercase text-slate-500 mb-1">Question</div>
                        <div className="text-sm whitespace-pre-wrap break-words">{question.message}</div>
                    </div>
                    <form
                        onSubmit={(e) => { e.preventDefault(); onSubmit({ id: question._id, answer: answer.trim() }); }}
                        className="space-y-3"
                    >
                        <div>
                            <label className="text-sm font-medium">Your Answer</label>
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                required
                                rows={6}
                                className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-white/5 px-3 py-2 outline-none"
                                placeholder="Provide clear, actionable guidance…"
                            />
                        </div>
                        <div className="pt-1 flex justify-end gap-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10">Cancel</button>
                            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60">
                                {submitting ? "Saving…" : question.answer ? "Update Reply" : "Send Reply"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function ModalDetails({ open, item, onClose }) {
    if (!open || !item) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl">
                <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold">Question Details</h3>
                    <button onClick={onClose} className="text-sm px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">✕</button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <Avatar url={item.askerPhotoUrl} name={item.askerName} />
                        <div>
                            <div className="text-xs text-slate-500">Asker</div>
                            <div className="font-medium">{item.askerName || "—"}</div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-white/5">
                        <div className="text-xs uppercase text-slate-500 mb-1">Question</div>
                        <div className="text-sm whitespace-pre-wrap break-words">{item.message}</div>
                    </div>
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-white/5">
                        <div className="text-xs uppercase text-slate-500 mb-1">Answer</div>
                        {item.answer ? (
                            <div className="text-sm whitespace-pre-wrap break-words">{item.answer}</div>
                        ) : (
                            <div className="text-sm text-slate-500">No reply yet.</div>
                        )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600">
                        <div><span className="text-slate-500">Status:</span> {item.answer ? "answered" : (item.status || "pending")}</div>
                        <div><span className="text-slate-500">Asked:</span> {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</div>
                    </div>
                    <div className="pt-1 flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ExpertDashboard() {
    const { token } = useAuth();
    const headers = useMemo(() => ({ Authorization: "Bearer " + token }), [token]);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");

    const [replyOpen, setReplyOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [viewOpen, setViewOpen] = useState(false);
    const [viewItem, setViewItem] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 250);
        return () => clearTimeout(t);
    }, [query]);

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const { ok, data } = await apiFetch("/expert/questions", { headers });
            if (!ok) setErr(data?.message || "Failed to load questions");
            else setRows(Array.isArray(data?.questions) ? data.questions : []);
        } catch {
            setErr("Failed to load questions");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { if (token) load(); }, [token]);

    const filtered = rows.filter((r) => {
        if (!debounced) return true;
        const hay = `${r.askerName || ""} ${r.message || ""} ${r.answer || ""}`.toLowerCase();
        return hay.includes(debounced.toLowerCase());
    });

    async function submitReply({ id, answer }) {
        if (!id || !answer) return;
        setSubmitting(true);
        try {
            const { ok, data } = await apiFetch(`/questions/${id}/reply`, {
                method: "PATCH",
                headers,
                body: { answer },
            });
            if (!ok) { alert(data?.message || "Failed to save reply"); return; }
            setRows((prev) =>
                prev.map((q) =>
                    String(q._id) === String(id)
                        ? { ...q, answer: data?.question?.answer || answer, status: "answered", updatedAt: new Date().toISOString() }
                        : q
                )
            );
            setReplyOpen(false);
            setSelected(null);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="py-12">
            <div className="mx-auto max-w-6xl px-6">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-emerald-900 dark:text-white">Expert Dashboard</h1>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">Answer questions routed to you.</p>
                    </div>
                    <button onClick={load} className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">
                        Refresh
                    </button>
                </div>

                <div className="mt-5">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by asker name, question, or answer…"
                        className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-2.5 outline-none"
                    />
                </div>

                {err && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{err}</div>}

                <div className="mt-4 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/70 dark:bg-white/5 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-fixed">
                            <colgroup>
                                <col style={{ width: "22%" }} />
                                <col style={{ width: "16ch" }} /> {/* ~3–4 words */}
                                <col style={{ width: "16ch" }} /> {/* ~3–4 words */}
                                <col style={{ width: "10%" }} />
                                <col style={{ width: "18%" }} />
                                <col style={{ width: "10%" }} />
                            </colgroup>
                            <thead className="bg-black/5 dark:bg-white/10 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Asker</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Question</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Answer</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Asked</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/10 dark:divide-white/10">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-slate-500">Loading…</td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-slate-500">{debounced ? "No matches found." : "No questions yet."}</td>
                                    </tr>
                                ) : (
                                    filtered.map((q) => (
                                        <tr key={q._id} className="hover:bg-black/5 dark:hover:bg-white/10">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar url={q.askerPhotoUrl} name={q.askerName} />
                                                    <div className="text-sm font-medium truncate">{q.askerName || "—"}</div>
                                                </div>
                                            </td>

                                            {/* 3–4 words only; fixed width via colgroup; click to view */}
                                            <td
                                                className="px-4 py-3 text-sm cursor-pointer"
                                                title={q.message}
                                                onClick={() => { setViewItem(q); setViewOpen(true); }}
                                            >
                                                <div className="truncate whitespace-nowrap overflow-hidden w-[16ch]">
                                                    {firstWords(q.message, 4)}
                                                </div>
                                            </td>

                                            {/* 3–4 words only; fixed width via colgroup; click to view */}
                                            <td
                                                className="px-4 py-3 text-sm cursor-pointer"
                                                title={q.answer || ""}
                                                onClick={() => { setViewItem(q); setViewOpen(true); }}
                                            >
                                                {q.answer ? (
                                                    <div className="truncate whitespace-nowrap overflow-hidden w-[16ch]">
                                                        {firstWords(q.answer, 4)}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500">—</span>
                                                )}
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
                                                    {q.answer ? "answered" : q.status || "pending"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-sm truncate">
                                                {q.createdAt ? new Date(q.createdAt).toLocaleString() : "—"}
                                            </td>

                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => { setSelected(q); setReplyOpen(true); }}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                                                >
                                                    {q.answer ? "Edit" : "Reply"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ModalReply
                open={replyOpen}
                question={selected}
                onClose={() => { setReplyOpen(false); setSelected(null); }}
                onSubmit={submitReply}
                submitting={submitting}
            />

            <ModalDetails
                open={viewOpen}
                item={viewItem}
                onClose={() => { setViewOpen(false); setViewItem(null); }}
            />
        </section>
    );
}
