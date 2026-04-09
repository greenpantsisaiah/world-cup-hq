"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { AnimatedNumber } from "./animated-number";
import { Sparkline } from "./sparkline";

interface ComparisonDot {
  label: string;
  value: number;
  isYou?: boolean;
}

interface DashboardTileProps {
  icon: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  sublabel?: string;
  trend?: number[];
  trendColor?: string;
  delta?: number;
  className?: string;
  size?: "default" | "large";
  comparison?: ComparisonDot[];
}

export function DashboardTile({
  icon,
  label,
  value,
  prefix = "",
  suffix = "",
  sublabel,
  trend,
  trendColor = "var(--gold)",
  delta,
  className = "",
  size = "default",
  comparison,
}: DashboardTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [hoveredDot, setHoveredDot] = useState<ComparisonDot | null>(null);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      className={`relative rounded-2xl bg-[var(--surface)] p-4 overflow-hidden group hover:bg-[var(--surface-light)] transition-colors ${className}`}
    >
      {/* Background sparkline */}
      {trend && (
        <div className="absolute bottom-0 right-0 opacity-40 group-hover:opacity-60 transition-opacity">
          <Sparkline
            data={trend}
            color={trendColor}
            width={size === "large" ? 160 : 120}
            height={size === "large" ? 60 : 44}
          />
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={size === "large" ? "text-xl" : "text-base"}>{icon}</span>
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              {label}
            </span>
          </div>
          {delta !== undefined && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                delta > 0
                  ? "bg-[var(--emerald)]/10 text-[var(--emerald)]"
                  : delta < 0
                    ? "bg-[var(--crimson)]/10 text-[var(--crimson)]"
                    : "bg-[var(--surface-light)] text-[var(--muted)]"
              }`}
            >
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {Math.abs(delta)}
            </span>
          )}
        </div>

        {/* Value */}
        <AnimatedNumber
          value={value}
          prefix={prefix}
          suffix={suffix}
          className={`font-black ${size === "large" ? "text-4xl" : "text-2xl"}`}
        />

        {/* Sublabel or hovered comparison */}
        {hoveredDot ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs mt-1"
          >
            <span className={hoveredDot.isYou ? "text-[var(--gold)] font-bold" : "text-[var(--muted)]"}>
              {hoveredDot.label}
            </span>
            <span className="text-[var(--muted)]"> — </span>
            <span className="font-bold">{prefix}{hoveredDot.value}{suffix}</span>
          </motion.div>
        ) : sublabel ? (
          <div className="text-xs text-[var(--muted)] mt-1">{sublabel}</div>
        ) : null}

        {/* Comparison strip — dots showing where everyone sits */}
        {comparison && comparison.length > 0 && (
          <div className="mt-3 relative h-4">
            {/* Track */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] bg-[var(--surface-border)] rounded-full" />

            {/* Dots */}
            {(() => {
              const vals = comparison.map((c) => c.value);
              const min = Math.min(...vals);
              const max = Math.max(...vals);
              const range = max - min || 1;

              return comparison.map((dot, i) => {
                const pct = ((dot.value - min) / range) * 100;
                return (
                  <motion.div
                    key={dot.label}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${Math.max(4, Math.min(96, pct))}%` }}
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ delay: 0.5 + i * 0.05, type: "spring" }}
                    onMouseEnter={() => setHoveredDot(dot)}
                    onMouseLeave={() => setHoveredDot(null)}
                  >
                    <div
                      className={`rounded-full cursor-pointer transition-all ${
                        dot.isYou
                          ? "w-3.5 h-3.5 bg-[var(--gold)] ring-2 ring-[var(--gold)]/30 z-10"
                          : "w-2 h-2 bg-[var(--muted)]/40 hover:bg-[var(--muted)] z-0"
                      } ${hoveredDot?.label === dot.label ? "scale-150" : ""}`}
                    />
                  </motion.div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </motion.div>
  );
}
