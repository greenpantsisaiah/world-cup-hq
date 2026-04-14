"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "./auth-provider";

const NAV_ITEMS = [
  { href: "/draft", label: "Draft", icon: "📋" },
  { href: "/daily", label: "Daily", icon: "🎯" },
  { href: "/portfolio", label: "My Team", icon: "📊" },
  { href: "/leaderboard", label: "Rankings", icon: "🏆" },
  { href: "/hot-takes", label: "Takes", icon: "🔥" },
];

export function Nav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  // Hide nav on try/simulation pages
  if (pathname.startsWith("/try")) return null;

  const initial = profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--surface-border)] md:top-0 md:bottom-auto md:border-b md:border-t-0 safe-area-bottom">
      <div className="max-w-5xl mx-auto px-2 md:px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo — links to home */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-2 font-bold text-lg shrink-0"
          >
            <span className="text-2xl">⚽</span>
            <span className="text-shimmer">World Cup HQ</span>
          </Link>

          {/* Game nav items — 5 items, centered */}
          <div className="flex items-center justify-around w-full md:w-auto md:gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col md:flex-row items-center gap-0 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-[var(--gold)]/10 rounded-lg border border-[var(--gold)]/20"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="text-base relative z-10">{item.icon}</span>
                  <span
                    className={`relative z-10 ${
                      isActive ? "text-[var(--gold)] font-semibold" : "text-[var(--muted)]"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* User avatar — links to league/admin */}
          {user ? (
            <Link
              href="/admin"
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                pathname === "/admin"
                  ? "bg-[var(--gold)] text-[var(--background)] ring-2 ring-[var(--gold)]/30"
                  : "bg-[var(--surface-light)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-border)]"
              }`}
            >
              {initial}
            </Link>
          ) : (
            <Link
              href="/admin"
              className="shrink-0 hidden md:flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
