import Link from "next/link";
import { Building2 } from "lucide-react";

export function Nav() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(248,247,245,0.92)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105"
            style={{ background: "var(--accent)" }}
          >
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-semibold tracking-tight text-base"
            style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}
          >
            Cavi Property
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm rounded-md transition-colors hover:bg-black/5"
            style={{ color: "var(--text-secondary)" }}
          >
            Projects
          </Link>
        </nav>
      </div>
    </header>
  );
}
