import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

export default function InsectDetectorPage() {
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: 'Bearer ' + token }), [token]);

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState(() => {
    // restore from localStorage (optional)
    try {
      const saved = localStorage.getItem('insect_gemini_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const endRef = useRef(null);

  // persist to localStorage (optional)
  useEffect(() => {
    try { localStorage.setItem('insect_gemini_history', JSON.stringify(messages)); } catch {}
  }, [messages]);

  // auto-scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function askGemini(e) {
    e.preventDefault();
    const q = prompt.trim();
    if (!q) return;

    setErr('');
    setLoading(true);

    // push user message immediately
    const userMsg = { id: crypto.randomUUID(), role: 'user', text: q, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');

    try {
      const { ok, status, retryAfter, data } = await apiFetch('/ai/gemini/chat', {
        method: 'POST',
        headers,
        body: { prompt: q },
      });

      if (!ok) {
        const msg = status === 429
          ? `Rate limit hit. Try again in ${retryAfter || data?.retryAfter || 60}s.`
          : (data?.message || 'Request failed');
        setErr(msg);
        // optionally also append an assistant error bubble
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: `❗ ${msg}`, ts: Date.now() }]);
      } else {
        const botText = data?.text || '(No response)';
        const botMsg = { id: crypto.randomUUID(), role: 'assistant', text: botText, ts: Date.now() };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (error) {
      const msg = error?.message || 'Something went wrong.';
      setErr(msg);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: `❗ ${msg}`, ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setPrompt('');
    setErr('');
    setMessages([]);
    try { localStorage.removeItem('insect_gemini_history'); } catch {}
  }

  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl border border-emerald-100/70 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-glow p-6 md:p-8 backdrop-blur">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 dark:text-white">
                Insect Advisor (Gemini)
              </h2>
              <p className="mt-2 text-emerald-800/90 dark:text-emerald-200 max-w-2xl">
                Ask anything about crop pests/diseases and get guidance.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-5">
            {/* Left: input */}
            <div className="md:col-span-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 dark:bg-white/5 dark:border-white/10 p-4">
                <div className="text-sm text-emerald-900 dark:text-emerald-200">Ask a question</div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Example: “How to control aphids on chili plants safely?”
                </p>

                <form onSubmit={askGemini} className="mt-4 grid gap-3">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-white/5 px-3 py-2 outline-none"
                    placeholder="Type your question…"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={loading || !prompt.trim()}
                      className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"></path>
                          </svg>
                          Thinking…
                        </>
                      ) : (
                        'Ask Gemini'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="px-4 py-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      Clear
                    </button>
                  </div>
                </form>

                {err && <div className="mt-3 text-sm text-red-600 font-medium">{err}</div>}
              </div>
            </div>

            {/* Right: chat history */}
            <div className="md:col-span-3">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 min-h-[260px] bg-white/70 dark:bg-white/5 backdrop-blur">
                {messages.length === 0 && !loading && !err && (
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Type a question on the left and press <span className="font-medium">Ask Gemini</span>.
                  </div>
                )}

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {messages.map(m => (
                    <div
                      key={m.id}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        m.role === 'user'
                          ? 'bg-emerald-100/70 dark:bg-emerald-900/30 border border-emerald-200/70 dark:border-emerald-800/50'
                          : 'bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10'
                      }`}
                    >
                      <div className="text-[11px] uppercase tracking-wide opacity-70 mb-1">
                        {m.role === 'user' ? 'You' : 'Gemini'}
                      </div>
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    </div>
                  ))}

                  {loading && (
                    <div className="rounded-xl px-3 py-2 text-sm bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10">
                      <div className="text-[11px] uppercase tracking-wide opacity-70 mb-1">Gemini</div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a 8 8 0 018-8v3a5 5 0 00-5 5H4z"></path>
                        </svg>
                        Generating…
                      </div>
                    </div>
                  )}

                  <div />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
