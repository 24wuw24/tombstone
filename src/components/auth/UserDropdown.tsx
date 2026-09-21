"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AuthModal from "./AuthModal";
import { createClient } from "@/lib/supabase/client";

export default function UserDropdown() {
  const router = useRouter(); const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null); const [open, setOpen] = useState(false); const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => { const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null)); return () => subscription.unsubscribe(); }, [supabase]);
  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setOpen(false); router.push("/"); router.refresh(); };
  if (!user) return <><button onClick={() => setAuthOpen(true)} className="rounded-md border border-emerald-300/20 bg-emerald-400 px-3 py-2 text-sm font-semibold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:bg-emerald-300 active:translate-y-0.5">Sign In</button><AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} message="Sign in to save your progress across every drill." onAuthenticated={() => router.refresh()} /></>;
  return <div className="relative"><button onClick={() => setOpen((value) => !value)} className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-bold text-zinc-950" aria-label="Open account menu">{user.email?.[0]?.toUpperCase() ?? "U"}</button>{open && <div className="absolute right-0 top-10 z-40 w-64 rounded-lg border border-[#262a34] bg-[#121316] p-2 shadow-2xl shadow-black/50"><div className="border-b border-[#262a34] px-3 py-2"><p className="truncate text-sm text-[#e5e7eb]">{user.email}</p><p className="mt-1 inline-flex rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300">Free Analyst Tier</p></div>{[["Profile & Activity", "/profile", false], ["Saved Questions", "/saved", false], ["Evaluation History", "/history", false], ["Upgrade Plan", "/pricing", true], ["Settings", "/settings", false]].map(([label, href, accent]) => <Link key={href as string} href={href as string} onClick={() => setOpen(false)} className={`mt-1 block rounded px-3 py-2 text-sm transition ${accent ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>{label as string}</Link>)}<div className="my-1 border-t border-[#262a34]" /><button onClick={signOut} className="w-full rounded px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10">Sign Out</button></div>}</div>;
}
