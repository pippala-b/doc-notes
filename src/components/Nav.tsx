"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PlusIcon, ReviewIcon, SearchIcon, TreeIcon } from "./icons";

const LINKS = [
  { href: "/", label: "Today", Icon: HomeIcon },
  { href: "/topics", label: "Tree", Icon: TreeIcon },
  { href: "/review", label: "Review", Icon: ReviewIcon },
  { href: "/search", label: "Search", Icon: SearchIcon },
];

// Sidebar on desktop, bottom tab bar on phones (thumb reach; mirrors the eventual iOS app).
// Reading a note and a review session are focused screens: they drop the tab bar
// on phones and bring their own way back.
export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const focused = pathname.startsWith("/review") || pathname.startsWith("/notes/");
  if (pathname === "/login") return null;

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-y-0 left-0 z-20 hidden w-58 flex-col gap-7 border-r border-line bg-surface px-5 py-8 md:flex"
      >
        <div className="px-3">
          <div className="font-serif text-[1.6rem] leading-tight font-semibold tracking-tight">Doc Notes</div>
          <div className="font-mono text-xs text-ink-2">ABSITE study notes</div>
        </div>
        <Link href="/capture" className="btn btn-primary min-h-12 rounded-xl text-[0.95rem]">
          <PlusIcon size={18} strokeWidth={2.5} />
          Capture
        </Link>
        <div className="flex flex-col gap-0.5">
          {LINKS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[0.95rem] ${
                isActive(href) ? "bg-track font-semibold" : "font-medium hover:bg-track/60"
              }`}
            >
              <Icon size={20} />
              {label === "Tree" ? "Study tree" : label}
            </Link>
          ))}
        </div>
      </nav>

      <nav
        aria-label="Primary"
        className={`fixed inset-x-0 bottom-0 z-20 items-center gap-1 border-t border-line bg-surface px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden ${
          focused ? "hidden" : "flex"
        }`}
      >
        {LINKS.slice(0, 2).map((l) => (
          <Tab key={l.href} {...l} active={isActive(l.href)} />
        ))}
        <Link href="/capture" aria-label="Capture" className="flex flex-1 items-center justify-center">
          <span
            className={`flex h-13 w-13 items-center justify-center rounded-full ${
              isActive("/capture") ? "bg-ink text-background" : "bg-accent text-on-accent"
            }`}
          >
            <PlusIcon size={24} strokeWidth={2.25} />
          </span>
        </Link>
        {LINKS.slice(2).map((l) => (
          <Tab key={l.href} {...l} active={isActive(l.href)} />
        ))}
      </nav>
    </>
  );
}

function Tab({ href, label, Icon, active }: (typeof LINKS)[number] & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[0.7rem] ${
        active ? "font-semibold text-ink" : "font-medium text-ink-2"
      }`}
    >
      <Icon strokeWidth={active ? 2 : 1.75} />
      {label}
    </Link>
  );
}
