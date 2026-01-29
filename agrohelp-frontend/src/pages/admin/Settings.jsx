import { useState } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function ChangePasswordPage() {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const MIN_LEN = 6;

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!newPassword || newPassword.length < MIN_LEN) {
      setMsg({ type: "err", text: `Password must be at least ${MIN_LEN} characters.` });
      return;
    }
    if (newPassword !== confirm) {
      setMsg({ type: "err", text: "New password and confirmation do not match." });
      return;
    }

    try {
      setLoading(true);
      const { ok, data } = await apiFetch("/auth/change-password", {
        method: "POST",
        // backend only needs newPassword; keeping currentPassword is harmless if you still want it
        body: { newPassword },
        headers: { Authorization: "Bearer " + token },
      });

      if (!ok) {
        setMsg({ type: "err", text: data?.message || "Failed to change password." });
        return;
      }

      if (data?.token) {
        localStorage.setItem("ag_token", data.token);
        if (data.user) localStorage.setItem("ag_user", JSON.stringify(data.user));
      }

      setMsg({ type: "ok", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setMsg({ type: "err", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
      <h1 className="text-xl font-bold mb-4">Change Password</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Keep current password if you want UI consistency; it's not required by the API now */}
        <div>
          <label className="text-sm font-medium">Current password</label>
          <input
            type="password"
            className="w-full mt-1 rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 bg-white/90 dark:bg-white/5 outline-none"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div>
          <label className="text-sm font-medium">New password</label>
          <input
            type="password"
            className="w-full mt-1 rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 bg-white/90 dark:bg-white/5 outline-none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={MIN_LEN}
            autoComplete="new-password"
          />
          <p className="text-xs text-slate-500">At least {MIN_LEN} characters.</p>
        </div>

        <div>
          <label className="text-sm font-medium">Confirm new password</label>
          <input
            type="password"
            className="w-full mt-1 rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 bg-white/90 dark:bg-white/5 outline-none"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={MIN_LEN}
            autoComplete="new-password"
          />
        </div>

        {msg && (
          <div className={msg.type === "ok" ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-4 py-2 font-semibold bg-black/90 text-white dark:bg-white/90 dark:text-black disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
