import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, token } = useAuth();
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) nav("/", { replace: true });
  }, [token, nav]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      setLoading(true);
      await login(username.trim(), password);
      nav("/", { replace: true });
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || !username || !password;

  return (
    <section className="relative py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <div className="hidden lg:flex relative rounded-3xl overflow-hidden border border-emerald-200/60 dark:border-white/10 shadow-glow">
            <div
              className="absolute inset-0 -z-10 bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(to right bottom, rgba(6,95,70,.85), rgba(22,163,74,.6)), url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1600&auto=format&fit=crop')",
              }}
            />
            <div className="p-10 text-emerald-50 flex flex-col justify-start">
              <div className="flex items-center gap-3">
                <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-white/10">
                  <img
                    src="/plant.png"
                    alt="AgroHelp Logo"
                    className="w-6 h-6 object-contain"
                  />
                </span>
                <h2 className="text-2xl font-bold">AgroHelp</h2>
              </div>
            </div>
          </div>
          <div className="glass dark:glass-dark rounded-3xl border border-white/40 dark:border-white/10 p-6 sm:p-8 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C7 7 4 11 4 14a8 8 0 1 0 16 0c0-3-3-7-8-12z" />
                </svg>
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-white">
                Log in
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Use your <b>username</b> and password to continue.
            </p>

            {err && (
              <div
                className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700"
                role="alert"
                aria-live="polite"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 mt-0.5"
                  fill="currentColor"
                >
                  <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
                  <path d="M1 21h22L12 2 1 21z" />
                </svg>
                <div className="text-sm">{err}</div>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm">Username</span>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-emerald-700/80">
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14z" />
                    </svg>
                  </span>
                  <input
                    className="w-full rounded-xl border p-3 pl-10 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    placeholder="e.g. farmer_rasel"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm">Password</span>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-emerald-700/80">
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17 8V7a5 5 0 0 0-10 0v1H5v12h14V8h-2zm-8 0V7a3 3 0 0 1 6 0v1H9z" />
                    </svg>
                  </span>
                  <input
                    type={showPw ? "text" : "password"}
                    className="w-full rounded-xl border p-3 pl-10 pr-10 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1.5 px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 5-5 5 5 0 0 1-5 5z" />
                        <path d="M2 2l20 20-1.5 1.5L.5 3.5z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 5-5 5 5 0 0 1-5 5z" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Remember me</span>
                </label>
                <span className="text-emerald-700 hover:underline cursor-default opacity-70">
                  Forgot password?
                </span>
              </div>

              <button
                disabled={disabled}
                className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white shadow
                  ${
                    disabled
                      ? "bg-emerald-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
              >
                {loading && (
                  <svg
                    className="w-5 h-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    ></circle>
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                      fill="currentColor"
                    ></path>
                  </svg>
                )}
                Log in
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
              No account?{" "}
              <Link
                to="/signup"
                className="text-emerald-700 font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
