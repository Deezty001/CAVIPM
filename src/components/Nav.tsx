import Link from "next/link";
import { Building2 } from "lucide-react";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-[#ebebeb] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Cavi Property home">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#111111] text-white">
            <Building2 size={17} strokeWidth={1.5} />
          </span>
          <span className="text-sm font-semibold tracking-[-0.2px]">Cavi Property</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-[13px] font-medium text-[#6b6b6b] transition-colors hover:bg-[#f0f0ee] hover:text-[#111111]"
          >
            Projects
          </Link>
        </nav>
      </div>
    </header>
  );
}
