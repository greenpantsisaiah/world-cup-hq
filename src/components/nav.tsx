"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/", label: "Home", mobileLabel: "HQ", icon: "⚽" },
  { href: "/draft", label: "Draft", mobileLabel: "Draft", icon: "📋" },
  { href: "/daily", label: "Daily", mobileLabel: "Daily", icon: "🎯" },
  { href: "/portfolio", label: "Portfolio", mobileLabel: "Stats", icon: "📊" },
  { href: "/leaderboard", label: "Rankings", mobileLabel: "Rank", icon: "🏆" },
  { href: "/hot-takes", label: "Hot Takes", mobileLabel: "Takes", icon: "🔥" },
  { href: "/admin", label: "League", mobileLabel: "League", icon: "⚙️" },
];

export function Nav() {
  const pathname = usePathname();

  // Hide nav on try/simulation pages
  if (pathname.startsWith("/try")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--surface-border)] md:top-0 md:bottom-auto md:border-b md:border-t-0 safe-area-bottom">
      <div className="max-w-5xl mx-auto px-2 md:px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo - desktop only */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-2 font-bold text-lg"
          >
            <span className="text-2xl">⚽</span>
            <span className="text-shimmer">World Cup HQ</span>
          </Link>

          {/* Nav items */}
          <div className="flex items-center justify-around w-full md:w-auto md:gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col md:flex-row items-center gap-0 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm transition-colors min-w-0"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-[var(--gold)]/10 rounded-lg border border-[var(--gold)]/20"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="text-base md:text-base relative z-10">
                    {item.icon}
                  </span>
                  <span
                    className={`relative z-10 truncate ${
                      isActive ? "text-[var(--gold)] font-semibold" : "text-[var(--muted)]"
                    }`}
                  >
                    <span className="md:hidden">{item.mobileLabel}</span>
                    <span className="hidden md:inline">{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Spacer for desktop layout */}
          <div className="hidden md:block w-16" />
        </div>
      </div>
    </nav>
  );
}
