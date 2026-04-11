"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WHISTLE_MESSAGES = [
  { icon: "📈", text: <>Sarah rocketed to #1 after Mitoma&apos;s hat trick. Her sleeper pick is paying off big.</> },
  { icon: "🙈", text: <>Jake is now 2-for-14 on predictions. At this point it&apos;s statistically impressive how wrong he is.</> },
  { icon: "🔥", text: <>Marcus&apos;s hot take &quot;Germany won&apos;t score&quot; just got crushed. Germany scored 5. Ice cold.</> },
];

export function MorningWhistleBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Show banner if not dismissed today
    const lastDismissed = localStorage.getItem("wchq_whistle_dismissed");
    const today = new Date().toDateString();
    if (lastDismissed !== today) {
      setDismissed(false);
      setMessageIndex(Math.floor(Math.random() * WHISTLE_MESSAGES.length));
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("wchq_whistle_dismissed", new Date().toDateString());
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="mb-6 overflow-hidden"
        >
          <div className="rounded-2xl bg-gradient-to-r from-[var(--gold)]/10 via-[var(--surface)] to-[var(--gold)]/10 border border-[var(--gold)]/20 p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0">📯</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--gold)]">Morning Whistle</span>
                  <span className="text-[10px] text-[var(--muted)]">Today</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-base shrink-0">{WHISTLE_MESSAGES[messageIndex].icon}</span>
                  <p className="text-[var(--muted)] leading-relaxed">
                    {WHISTLE_MESSAGES[messageIndex].text}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm shrink-0 mt-1"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
