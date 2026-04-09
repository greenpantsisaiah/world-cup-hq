"use client";

import { motion } from "framer-motion";
import { Player } from "@/lib/types";
import { getCountryByCode } from "@/data/countries";

interface FutCardProps {
  player: Player;
  points?: number;
  goals?: number;
  assists?: number;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

function getTier(rating: number): { bg: string; border: string; glow: string; label: string } {
  if (rating >= 90) return {
    bg: "from-yellow-600/30 via-yellow-500/10 to-yellow-700/30",
    border: "border-yellow-500/50",
    glow: "shadow-yellow-500/20",
    label: "GOLD",
  };
  if (rating >= 85) return {
    bg: "from-emerald-600/20 via-emerald-500/5 to-emerald-700/20",
    border: "border-emerald-500/40",
    glow: "shadow-emerald-500/15",
    label: "SILVER",
  };
  return {
    bg: "from-orange-700/20 via-orange-600/5 to-orange-800/20",
    border: "border-orange-600/30",
    glow: "shadow-orange-600/10",
    label: "BRONZE",
  };
}

const POS_COLORS: Record<string, string> = {
  GK: "text-amber-400",
  DEF: "text-blue-400",
  MID: "text-green-400",
  FWD: "text-red-400",
};

export function FutCard({
  player,
  points,
  goals,
  assists,
  onClick,
  selected = false,
  compact = false,
}: FutCardProps) {
  const country = getCountryByCode(player.countryCode);
  const tier = getTier(player.rating);

  if (compact) {
    return (
      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`relative rounded-xl p-3 text-left transition-all bg-gradient-to-br ${tier.bg} border ${
          selected ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30" : tier.border
        } ${onClick ? "cursor-pointer" : ""}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="text-2xl font-black">{player.rating}</div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm truncate">{player.name}</div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>{country?.flag}</span>
              <span className={`font-bold ${POS_COLORS[player.position]}`}>{player.position}</span>
            </div>
          </div>
          {points !== undefined && (
            <div className="text-right">
              <div className="text-sm font-black text-[var(--gold)]">+{points}</div>
            </div>
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -4, rotateY: 3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative rounded-2xl overflow-hidden text-left transition-all shadow-xl ${tier.glow} ${
        selected ? "ring-2 ring-[var(--gold)]" : ""
      } ${onClick ? "cursor-pointer" : ""}`}
      style={{ perspective: "800px" }}
    >
      {/* Card background with gradient */}
      <div className={`bg-gradient-to-br ${tier.bg} border ${tier.border} rounded-2xl p-4`}>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl pointer-events-none" />

        {/* Top: Rating + Position */}
        <div className="flex items-start justify-between mb-3 relative z-10">
          <div>
            <div className="text-4xl font-black leading-none">{player.rating}</div>
            <div className={`text-sm font-black ${POS_COLORS[player.position]}`}>{player.position}</div>
          </div>
          <div className="text-3xl">{country?.flag}</div>
        </div>

        {/* Player name */}
        <div className="relative z-10 mb-3">
          <div className="text-lg font-black truncate">{player.name}</div>
          <div className="text-xs text-[var(--muted)]">{country?.name}</div>
        </div>

        {/* Stats bar */}
        {(goals !== undefined || assists !== undefined || points !== undefined) && (
          <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            {goals !== undefined && (
              <div className="text-center">
                <div className="font-black text-lg">{goals}</div>
                <div className="text-[var(--muted)]">⚽</div>
              </div>
            )}
            {assists !== undefined && (
              <div className="text-center">
                <div className="font-black text-lg">{assists}</div>
                <div className="text-[var(--muted)]">🎯</div>
              </div>
            )}
            {points !== undefined && (
              <div className="text-center">
                <div className="font-black text-lg text-[var(--gold)]">+{points}</div>
                <div className="text-[var(--muted)]">PTS</div>
              </div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-[var(--gold)] rounded-full flex items-center justify-center text-[var(--background)] text-sm font-bold shadow-lg"
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
}
