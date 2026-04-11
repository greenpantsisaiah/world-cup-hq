"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MilestoneToastProps {
  icon: string;
  title: string;
  subtitle?: string;
  isVisible: boolean;
  onDismiss: () => void;
  durationMs?: number;
}

const AUTO_DISMISS_MS = 4000;

export function MilestoneToast({
  icon,
  title,
  subtitle,
  isVisible,
  onDismiss,
  durationMs = AUTO_DISMISS_MS,
}: MilestoneToastProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [isVisible, onDismiss, durationMs]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[var(--surface)] shadow-2xl border border-[var(--gold)]/30"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(212,168,67,0.08) 0%, transparent 50%, rgba(212,168,67,0.08) 100%)",
              boxShadow: "0 0 20px rgba(212,168,67,0.15), 0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <span className="text-3xl shrink-0">{icon}</span>
            <div className="min-w-0">
              <div className="font-black text-sm whitespace-nowrap">{title}</div>
              {subtitle && (
                <div className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
