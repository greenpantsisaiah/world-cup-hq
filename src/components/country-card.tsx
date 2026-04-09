"use client";

import { motion } from "framer-motion";
import { Country } from "@/lib/types";

interface CountryCardProps {
  country: Country;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  showTier?: boolean;
  size?: "sm" | "md" | "lg";
}

const TIER_COLORS = {
  elite: "border-gold text-gold",
  contender: "border-electric text-electric",
  dark_horse: "border-emerald text-emerald",
  underdog: "border-muted text-muted",
};

const TIER_LABELS = {
  elite: "ELITE",
  contender: "CONTENDER",
  dark_horse: "DARK HORSE",
  underdog: "UNDERDOG",
};

export function CountryCard({
  country,
  selected = false,
  disabled = false,
  onClick,
  showTier = true,
  size = "md",
}: CountryCardProps) {
  const sizeClasses = {
    sm: "p-2 text-sm",
    md: "p-4",
    lg: "p-6 text-lg",
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        relative rounded-xl ${sizeClasses[size]} w-full text-left transition-all
        ${
          selected
            ? "bg-gold/10 border-2 border-gold ring-2 ring-gold/20"
            : "bg-surface border border-surface-border hover:border-gold/30"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <div className="flex items-center gap-3">
        <span className={size === "lg" ? "text-4xl" : size === "md" ? "text-3xl" : "text-xl"}>
          {country.flag}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{country.name}</div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Group {country.group}</span>
            <span>·</span>
            <span>FIFA #{country.fifaRanking}</span>
          </div>
        </div>
        {showTier && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_COLORS[country.tier]}`}
          >
            {TIER_LABELS[country.tier]}
          </span>
        )}
      </div>
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
