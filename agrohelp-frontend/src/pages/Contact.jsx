import { useState } from "react";
import { FaEnvelope, FaMapMarkerAlt, FaPhone, FaHeadset } from "react-icons/fa";

export default function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000); // hide after 4s
    e.target.reset();
  }

  return (
    <section className="py-16 bg-white dark:bg-neutral-900">
      <div className="mx-auto max-w-6xl px-6 grid gap-10 md:grid-cols-2 items-start">
        {/* Left: Contact Form */}
        <div>
          <h1 className="text-3xl font-bold text-emerald-900 dark:text-white">Get in Touch</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Have questions, suggestions, or feedback? Drop us a message below.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              className="w-full rounded-xl border p-3 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10 outline-none"
              placeholder="Your Name"
              required
            />
            <input
              type="email"
              className="w-full rounded-xl border p-3 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10 outline-none"
              placeholder="Email"
              required
            />
            <textarea
              className="w-full rounded-xl border p-3 bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10 h-36 outline-none"
              placeholder="Message..."
              required
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700"
            >
              Send Message
            </button>
            {sent && (
              <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                ✅ Your message has been sent successfully.
              </p>
            )}
          </form>
        </div>

        {/* Right: Contact Info */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-emerald-50/70 dark:bg-emerald-900/10 p-8">
          <h2 className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
            Contact Information
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Reach us directly through the following channels:
          </p>

          <div className="mt-6 space-y-5">
            <div className="flex items-start gap-3">
              <FaEnvelope className="text-emerald-600 dark:text-emerald-300 text-xl mt-1" />
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Email</p>
                <p className="text-slate-700 dark:text-slate-300">info@agrohelp.app</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FaPhone className="text-emerald-600 dark:text-emerald-300 text-xl mt-1" />
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Phone</p>
                <p className="text-slate-700 dark:text-slate-300">+880 1234 567 890</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FaHeadset className="text-emerald-600 dark:text-emerald-300 text-xl mt-1" />
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Hotline</p>
                <p className="text-slate-700 dark:text-slate-300">16234 (Available 24/7)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-emerald-600 dark:text-emerald-300 text-xl mt-1" />
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Address</p>
                <p className="text-slate-700 dark:text-slate-300">
                  AgroHelp HQ, Dhaka, Bangladesh
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
