import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/", label: "Setup" },
  { href: "/workspace", label: "Single Run" },
  { href: "/batch", label: "Batch Run" },
  { href: "/saved", label: "Saved Runs" },
  { href: "/ratings", label: "Ratings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[color:var(--border)] bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
              Model Lab
            </p>
            <h1 className="text-xl font-semibold">LLM Qualitative Comparator</h1>
          </div>
          <nav className="flex gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] p-1">
            {links.map((link) => (
              <Link
                key={link.href}
                className="rounded-full px-4 py-2 text-sm text-stone-700 transition hover:bg-[color:var(--muted)]"
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
