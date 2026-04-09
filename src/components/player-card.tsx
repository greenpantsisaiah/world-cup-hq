"use client";

import { motion } from "framer-motion";
import { Player } from "@/lib/types";
import { getCountryByCode } from "@/data/countries";

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  points?: number;
  showStats?: boolean;
}

const POSITION_COLORS = {
  GK: "bg-amber-500/20 text-amber-400",
  DEF: "bg-blue-500/20 text-blue-400",
  MID: "bg-green-500/20 text-green-400",
  FWD: "bg-red-500/20 text-red-400",
};

export function PlayerCard({
  player,
  selected = false,
  disabled = false,
  onClick,
  points,
  showStats = false,
}: PlayerCardProps) {
  const country = getCountryByCode(player.countryCode);

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        relative rounded-xl p-4 w-full text-left transition-all
        ${
          selected
            ? "bg-gold/10 border-2 border-gold ring-2 ring-gold/20"
            : "bg-surface border border-surface-border hover:border-gold/30"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Rating badge */}
        <div className="w-12 h-12 rounded-lg bg-surface-light flex items-center justify-center font-black text-lg">
          <span
            className={
              player.rating >= 90
                ? "text-gold"
                : player.rating >= 85
                  ? "text-emerald"
                  : "text-foreground"
            }
          >
            {player.rating}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{player.name}</div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{country?.flag}</span>
            <span>{player.country}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${POSITION_COLORS[player.position]}`}
            >
              {player.position}
            </span>
          </div>
        </div>

        {points !== undefined && (
          <div className="text-right">
            <div className="text-lg font-bold text-gold">+{points}</div>
            <div className="text-[10px] text-muted">PTS</div>
          </div>
        )}
      </div>

      {showStats && (
        <div className="mt-3 pt-3 border-t border-surface-border grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <div className="font-bold">0</div>
            <div className="text-muted">⚽ Goals</div>
          </div>
          <div>
            <div className="font-bold">0</div>
            <div className="text-muted">🎯 Assists</div>
          </div>
          <div>
            <div className="font-bold">0</div>
            <div className="text-muted">⭐ MOTM</div>
          </div>
          <div>
            <div className="font-bold">0</div>
            <div className="text-muted">🟨 Cards</div>
          </div>
        </div>
      )}

      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center text-background text-xs font-bold"
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
}
