"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CheckSquare2, LayoutGrid } from "lucide-react";

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-[72px] border-b border-slate-200/90 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1360px] items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3" aria-label="Cavi Projects home">
            <span className="grid h-8 w-8 place-items-center bg-slate-950 text-[11px] font-bold tracking-[-.04em] text-white transition-colors group-hover:bg-blue-700">CP</span>
            <span>
              <span className="block text-[13px] font-semibold tracking-[-.02em] text-slate-900">Cavi Projects</span>
              <span className="block text-[9px] font-semibold uppercase tracking-[.18em] text-slate-400">Development intelligence</span>
            </span>
          </Link>
          <div className="hidden h-5 w-px bg-slate-200 sm:block" />
          <nav aria-label="Primary navigation" className="hidden items-center gap-5 sm:flex">
            <Link href="/" className={`inline-flex h-9 items-center gap-2 border-b-2 px-1 text-xs font-semibold transition-colors ${pathname === "/" ? "border-blue-600 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
              <LayoutGrid className="h-3.5 w-3.5" /> Portfolio
            </Link>
            <Link href="/my-work" className={`inline-flex h-9 items-center gap-2 border-b-2 px-1 text-xs font-semibold transition-colors ${pathname.startsWith("/my-work") ? "border-blue-600 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
              <CheckSquare2 className="h-3.5 w-3.5" /> My Work
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400 md:block">Private workspace</span>
          <span className="h-2 w-2 bg-emerald-600" aria-label="System online" />
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
