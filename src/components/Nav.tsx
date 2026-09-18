"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/topics", label: "Study Tree" },
  { href: "/capture", label: "Capture" },
];

// Top bar on desktop, bottom tab bar on phones (thumb reach; mirrors the eventual iOS app).
export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:sticky sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
      <div className="mx-auto flex max-w-3xl items-center gap-1 px-2 sm:px-4">
        <span className="mr-4 hidden py-3 font-semibold sm:block">Doc Notes</span>
        {LINKS.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 rounded-lg px-3 py-3 text-center text-sm sm:flex-none ${
                active ? "font-semibold text-accent" : "text-ink-2"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
