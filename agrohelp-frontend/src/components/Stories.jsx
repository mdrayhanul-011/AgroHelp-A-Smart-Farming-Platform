import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function Avatar({ url, name, size = 64 }) {
    const fallback =
        "https://ui-avatars.com/api/?background=random&name=" +
        encodeURIComponent(name || "User");
    return (
        <img
            src={url || fallback}
            alt={name || "User"}
            className="rounded-full object-cover border border-black/10 dark:border-white/10"
            style={{ width: size, height: size }}
        />
    );
}

function snip(text = "", chars = 120) {
    const s = String(text || "");
    return s.length > chars ? s.slice(0, chars).trimEnd() + "…" : s;
}

export default function Stories() {
    const { token } = useAuth();
    const headers = useMemo(() => (token ? { Authorization: "Bearer " + token } : {}), [token]);

    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    async function load() {
        setLoading(true);
        setErr("");
        try {
            let res = await apiFetch("/stories/public");
            if (!res.ok || !Array.isArray(res.data?.stories)) {
                res = await apiFetch("/admin/stories", { headers });
            }
            if (!res.ok) throw new Error(res.data?.message || "Failed to load stories");
            const arr = Array.isArray(res.data?.stories) ? res.data.stories : [];
            setStories(arr.slice(0, 12));
        } catch (e) {
            setErr(e.message || "Failed to load stories");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    console.log(stories);
    return (
        <section className="py-14 bg-emerald-50/70 dark:bg-white/5">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                    <h3 className="text-2xl font-bold text-emerald-900 dark:text-white">Success Stories</h3>
                    
                </div>

                {err && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
                        {err}
                    </div>
                )}

                <div className="mt-5 overflow-x-auto">
                    <div className="flex gap-4 snap-x snap-mandatory">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="min-w-[320px] max-w-sm snap-start rounded-3xl border border-emerald-100/70 dark:border-white/10 bg-white/80 dark:bg-white/5 p-6 shadow-md text-center"
                                >
                                    <div className="mx-auto rounded-full bg-black/10 dark:bg-white/10 animate-pulse"
                                        style={{ width: 64, height: 64 }} />
                                    <div className="mt-4 mx-auto h-4 bg-black/10 dark:bg-white/10 rounded w-3/4 animate-pulse" />
                                    <div className="mt-2 mx-auto h-3 bg-black/10 dark:bg-white/10 rounded w-5/6 animate-pulse" />
                                    <div className="mt-2 mx-auto h-3 bg-black/10 dark:bg-white/10 rounded w-2/3 animate-pulse" />
                                    <div className="mt-4 mx-auto h-3 bg-black/10 dark:bg-white/10 rounded w-24 animate-pulse" />
                                </div>
                            ))
                        ) : stories.length === 0 ? (
                            <div className="text-slate-600 dark:text-slate-300">No stories yet.</div>
                        ) : (
                            stories.map((s, i) => {
                                const photo =
                                    s.photoUrl || s.ownerPhotoUrl || s.userPhotoUrl || s.authorPhotoUrl || null;
                                const name = s.ownerName || s.authorName || s.userName || "User";
                                return (
                                    <article
                                        key={s._id || i}
                                        className="min-w-[320px] max-w-sm snap-start rounded-3xl border border-emerald-100/70 dark:border-white/10 bg-white/80 dark:bg-white/5 p-6 shadow-md hover:shadow-xl transition backdrop-blur text-center"
                                    >
                                        <div className="flex justify-center">
                                            <Avatar url={photo} name={name} size={72} />
                                        </div>

                                        <h4 className="mt-4 font-semibold text-emerald-900 dark:text-white">
                                            {s.title || "Untitled story"}
                                        </h4>

                                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                            {snip(s.body || "", 150)}
                                        </p>

                                        <div className="mt-4 text-xs text-emerald-800/90 dark:text-emerald-200">
                                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""}
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
