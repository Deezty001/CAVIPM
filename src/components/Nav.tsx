import Link from "next/link";
import { Building2 } from "lucide-react";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-slate-850 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Cavi Property home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
            <Building2 size={18} strokeWidth={1.5} />
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-50 font-display transition-colors group-hover:text-slate-300">
            Cavi Property
          </span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-[13px] font-semibold text-slate-300 transition-all hover:bg-slate-850 hover:text-slate-50"
          >
            Projects
          </Link>
        </nav>
      </div>
    </header>
  );
}
