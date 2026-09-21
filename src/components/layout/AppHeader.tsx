"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserDropdown from "@/components/auth/UserDropdown";

export default function AppHeader() {
  const pathname = usePathname();
  return <header className="sticky top-0 z-30 border-b border-[#262a34] bg-[#121316]/95 backdrop-blur-md"><div className="mx-auto flex h-15 max-w-6xl items-center gap-5 px-5"><Link href="/" className="flex items-center gap-2 font-mono text-sm font-bold tracking-[0.14em] text-white"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />TOMBSTONE</Link><nav className="hidden items-center gap-1 md:flex"><Link href="/" className={`rounded px-3 py-2 text-sm ${pathname === "/" ? "bg-white/[0.07] text-white" : "text-zinc-500 hover:text-zinc-200"}`}>Problems</Link><Link href="/profile" className={`rounded px-3 py-2 text-sm ${pathname === "/profile" ? "bg-white/[0.07] text-white" : "text-zinc-500 hover:text-zinc-200"}`}>Activity</Link><Link href="/history" className={`rounded px-3 py-2 text-sm ${pathname === "/history" ? "bg-white/[0.07] text-white" : "text-zinc-500 hover:text-zinc-200"}`}>History</Link></nav><div className="ml-auto"><UserDropdown /></div></div></header>;
}
