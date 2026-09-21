"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";
type AuthModalProps = { isOpen: boolean; onClose: () => void; initialMode?: Mode; message?: string; onAuthenticated?: () => void };

export default function AuthModal({ isOpen, onClose, initialMode = "signin", message, onAuthenticated }: AuthModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>(initialMode); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [isSubmitting, setIsSubmitting] = useState(false);
  if (!isOpen) return null;
  const selectMode = (nextMode: Mode) => { setMode(nextMode); setError(""); setNotice(""); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError("Enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setIsSubmitting(true);
    const result = mode === "signin" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    setIsSubmitting(false);
    if (result.error) { setError(result.error.message); return; }
    if (mode === "signup" && !result.data.session) { setNotice("Check your email to confirm your account, then sign in."); return; }
    onAuthenticated?.(); onClose();
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="w-full max-w-md rounded-xl border border-[#23272f] bg-[#121316] p-6 shadow-2xl shadow-black/50"><div className="flex items-start justify-between"><div><p className="font-mono text-xs tracking-[0.16em] text-emerald-400">TOMBSTONE</p><h2 id="auth-title" className="mt-2 text-xl font-semibold text-[#e5e7eb]">Keep your progress</h2></div><button onClick={onClose} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white" aria-label="Close authentication dialog">×</button></div>{message && <p className="mt-4 rounded-md border border-emerald-500/20 bg-emerald-500/[0.07] p-3 text-sm text-emerald-200">{message}</p>}<div className="mt-6 grid grid-cols-2 rounded-lg border border-[#23272f] bg-zinc-950 p-1">{(["signin", "signup"] as Mode[]).map((item) => <button key={item} onClick={() => selectMode(item)} className={`rounded-md py-2 text-sm font-medium transition ${mode === item ? "bg-zinc-800 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "text-zinc-500 hover:text-zinc-300"}`}>{item === "signin" ? "Sign In" : "Sign Up"}</button>)}</div><form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-sm text-zinc-300">Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#23272f] bg-zinc-950 px-3 py-2.5 text-[#e5e7eb] outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20" placeholder="analyst@example.com" /></label><label className="block text-sm text-zinc-300">Password<input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#23272f] bg-zinc-950 px-3 py-2.5 text-[#e5e7eb] outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20" placeholder="At least 6 characters" /></label>{error && <p className="text-sm text-rose-300">{error}</p>}{notice && <p className="text-sm text-emerald-300">{notice}</p>}<button disabled={isSubmitting} className="w-full rounded-lg bg-emerald-400 py-2.5 text-sm font-bold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:bg-emerald-300 active:translate-y-0.5 active:shadow-inner disabled:opacity-60">{isSubmitting ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}</button></form></div></div>;
}
