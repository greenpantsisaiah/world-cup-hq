"use client";

import { motion } from "framer-motion";

export interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

const ALL_BADGES: Badge[] = [
  { id: "prepared", icon: "🏅", name: "Prepared", description: "Complete all pre-match tasks", earned: true, earnedDate: "Day 0" },
  { id: "first-blood", icon: "⚡", name: "First Blood", description: "Submit your first daily pick", earned: true, earnedDate: "Day 1" },
  { id: "streak-3", icon: "🔥", name: "On Fire", description: "3 correct predictions in a row", earned: true, earnedDate: "Day 4" },
  { id: "streak-5", icon: "🔮", name: "Crystal Ball", description: "5 correct predictions in a row", earned: false },
  { id: "contrarian", icon: "🐺", name: "Lone Wolf", description: "Win a contrarian daily pick (5x+ multiplier)", earned: true, earnedDate: "Day 3" },
  { id: "h2h-3", icon: "⚔️", name: "Warrior", description: "Win 3 H2H matchups", earned: true, earnedDate: "Day 5" },
  { id: "h2h-undefeated", icon: "🛡️", name: "Unbreakable", description: "Win 5 H2H matchups in a row", earned: false },
  { id: "hot-take-hit", icon: "📢", name: "Prophet", description: "Have a hot take resolve as HIT", earned: false },
  { id: "top-3", icon: "🏆", name: "Podium", description: "Reach top 3 on the leaderboard", earned: true, earnedDate: "Day 8" },
  { id: "comeback", icon: "📈", name: "Comeback Kid", description: "Climb 5+ ranks in a single day", earned: false },
  { id: "ban-backfire", icon: "😅", name: "Friendly Fire", description: "Ban a player who scores in the first minute", earned: false },
  { id: "perfect-day", icon: "💎", name: "Perfect Day", description: "Get every prediction right on a match day", earned: false },
];

export function AchievementBadges() {
  const earned = ALL_BADGES.filter((b) => b.earned);
  const locked = ALL_BADGES.filter((b) => !b.earned);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">🏅 Achievements</h2>
        <span className="text-xs font-bold text-[var(--gold)]">{earned.length}/{ALL_BADGES.length}</span>
      </div>

      {/* Earned badges */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {earned.map((badge, i) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-[var(--gold)]/5 border border-[var(--gold)]/20 p-3 text-center group hover:bg-[var(--gold)]/10 transition-colors"
            title={`${badge.name}: ${badge.description}`}
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{badge.icon}</div>
            <div className="text-[10px] font-bold truncate">{badge.name}</div>
            {badge.earnedDate && (
              <div className="text-[8px] text-[var(--muted)]">{badge.earnedDate}</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Locked badges — dimmed, mysterious */}
      {locked.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {locked.map((badge) => (
            <div
              key={badge.id}
              className="rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] p-3 text-center opacity-40 hover:opacity-60 transition-opacity"
              title={badge.description}
            >
              <div className="text-2xl mb-1 grayscale">🔒</div>
              <div className="text-[10px] font-bold truncate text-[var(--muted)]">{badge.name}</div>
              <div className="text-[8px] text-[var(--muted)]">{badge.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
