"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  Search,
  Settings,
} from "lucide-react";

const navigation = [
  { href: "/", label: "Portfolio", icon: LayoutDashboard },
  { href: "/", label: "Projects", icon: FolderKanban },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden w-[60px] flex-col items-center border-r bg-white py-4 md:flex"
        style={{ borderColor: "var(--divider)" }}
        aria-label="Primary navigation"
      >
        <Link
          href="/"
          className="mb-6 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#111111] text-white"
          aria-label="Cavi Property home"
        >
          <Building2 size={19} strokeWidth={1.5} />
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-2">
          {navigation.map(({ href, label, icon: Icon }, index) => {
            const active = index === 0 ? pathname === "/" : pathname.startsWith("/projects/");
            return (
              <Link
                key={label}
                href={href}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  active
                    ? "bg-[#111111] text-white"
                    : "text-[#6b6b6b] hover:bg-[#f0f0ee] hover:text-[#111111]"
                }`}
                aria-label={label}
                title={label}
              >
                <Icon size={19} strokeWidth={1.5} />
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b6b6b] transition-colors hover:bg-[#f0f0ee] hover:text-[#111111]" aria-label="Help">
            <HelpCircle size={19} strokeWidth={1.5} />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b6b6b] transition-colors hover:bg-[#f0f0ee] hover:text-[#111111]" aria-label="Settings">
            <Settings size={19} strokeWidth={1.5} />
          </button>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 h-16 bg-[#f5f5f3] md:left-[60px]">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#111111] text-white md:hidden">
              <Building2 size={17} strokeWidth={1.5} />
            </span>
            <span className="text-sm font-semibold tracking-[-0.2px]">Cavi Property</span>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/"
              className="rounded-full bg-[#111111] px-[18px] py-2 text-[13px] font-medium leading-none text-white"
            >
              Projects
            </Link>
          </div>
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#a0a0a0]" strokeWidth={1.5} />
            <input
              type="search"
              aria-label="Search projects"
              placeholder="Search projects"
              className="h-[38px] w-[220px] rounded-full border border-transparent bg-white pl-10 pr-4 text-[13px] outline-none transition-colors placeholder:text-[#a0a0a0] hover:border-[#e0e0de] focus:border-[#111111]"
            />
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-white px-8 md:hidden" style={{ borderColor: "var(--divider)" }} aria-label="Mobile navigation">
        <Link href="/" className="flex flex-col items-center gap-1 text-[#111111]" aria-label="Portfolio">
          <LayoutDashboard size={20} strokeWidth={1.5} />
          <span className="text-[11px] font-medium">Portfolio</span>
        </Link>
        <Link href="/" className="flex flex-col items-center gap-1 text-[#6b6b6b]" aria-label="Projects">
          <FolderKanban size={20} strokeWidth={1.5} />
          <span className="text-[11px] font-medium">Projects</span>
        </Link>
      </nav>
    </>
  );
}
