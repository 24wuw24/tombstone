"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AuthModal from "@/components/auth/AuthModal";
import UserDropdown from "@/components/auth/UserDropdown";
import { createClient } from "@/lib/supabase/client";

type AppHeaderProps = { children?: ReactNode; wide?: boolean };
const navItems = [{ label: "Problems", href: "/" }, { label: "Activity", href: "/profile" }, { label: "History", href: "/history" }];

export default function AppHeader({ children, wide = false }: AppHeaderProps) {
  const pathname = usePathname(); const router = useRouter(); const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null); const [streak, setStreak] = useState(0); const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(sessionUser);
      if (!sessionUser) { setStreak(0); return; }
      const response = await fetch("/api/progress", { cache: "no-store" });
      if (!cancelled && response.ok) { const progress = await response.json() as { authenticated?: boolean; streak?: number }; setStreak(progress.authenticated ? progress.streak ?? 0 : 0); }
    };
    const timer = window.setTimeout(() => { void sync(); }, 0);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void sync(); });
    return () => { cancelled = true; window.clearTimeout(timer); subscription.unsubscribe(); };
  }, [supabase]);
  const active = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return <header className="sticky top-0 z-30 border-b border-[#262a34] bg-[#121316]/95 backdrop-blur-md"><div className={`mx-auto flex h-15 items-center gap-4 px-5 lg:gap-6 ${wide ? "max-w-[1600px] lg:px-7" : "max-w-6xl"}`}><Link href="/" className="flex shrink-0 items-center gap-2 font-mono text-sm font-bold tracking-[0.14em] text-white"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />TOMBSTONE</Link><nav className="hidden items-center gap-1 md:flex">{navItems.map(({ label, href }) => <Link key={href} href={href} className={`rounded-md px-3 py-2 text-sm transition ${active(href) ? "bg-white/[0.07] text-white" : "text-zinc-500 hover:text-zinc-200"}`}>{label}</Link>)}</nav>{children ? <div className="hidden min-w-0 max-w-md flex-1 md:block">{children}</div> : <div className="ml-auto" />}<div className="ml-auto flex shrink-0 items-center gap-3"><button onClick={() => { if (!user) setAuthOpen(true); }} className="hidden items-center gap-2 rounded-md border border-orange-400/15 bg-orange-400/[0.06] px-2.5 py-1.5 text-xs text-orange-300 transition hover:bg-orange-400/10 lg:flex"><span>♨</span> {streak}-Day Streak</button><UserDropdown /></div></div><AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} message="Sign in to keep track of your daily streak and progress." onAuthenticated={() => { void supabase.auth.getUser().then(({ data }) => setUser(data.user)); router.refresh(); }} /></header>;
}
