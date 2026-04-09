"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { AnimatedNumber } from "./animated-number";

interface Ring {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: string;
}

interface RadialScoreProps {
  total: number;
  rings: Ring[];
  size?: number;
}

export function RadialScore({ total, rings, size = 220 }: RadialScoreProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [hoveredRing, setHoveredRing] = useState<number | null>(null);
  const center = size / 2;
  const strokeWidth = 10;
  const gap = 4;

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {rings.map((ring, i) => {
            const radius = center - strokeWidth / 2 - (strokeWidth + gap) * i - 12;
            const circumference = 2 * Math.PI * radius;
            const progress = Math.min(ring.value / ring.max, 1);
            const isHovered = hoveredRing === i;

            return (
              <g
                key={ring.label}
                onMouseEnter={() => setHoveredRing(i)}
                onMouseLeave={() => setHoveredRing(null)}
                className="cursor-pointer"
              >
                {/* Hit area (invisible wider stroke for easier hovering) */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={strokeWidth + 8}
                />
                {/* Background track */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="var(--surface-light)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                {/* Animated progress */}
                <motion.circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={
                    isInView
                      ? { strokeDashoffset: circumference * (1 - progress) }
                      : {}
                  }
                  transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
                  style={{ filter: `drop-shadow(0 0 ${isHovered ? 10 : 6}px ${ring.color}${isHovered ? "80" : "40"})` }}
                />
              </g>
            );
          })}
        </svg>

        {/* Center — total or hovered ring detail */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hoveredRing !== null ? (
            <motion.div
              key={hoveredRing}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="text-3xl font-black" style={{ color: rings[hoveredRing].color }}>
                +{rings[hoveredRing].value}
              </div>
              <div className="text-[10px] text-[var(--muted)] uppercase tracking-widest">
                {rings[hoveredRing].label}
              </div>
            </motion.div>
          ) : (
            <>
              <AnimatedNumber
                value={total}
                className="text-4xl font-black text-[var(--gold)]"
                duration={1.5}
              />
              <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest">
                Total Pts
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend — clean vertical list, no emojis cluttering */}
      <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-xs w-full max-w-[240px]">
        {rings.map((ring, i) => (
          <div
            key={ring.label}
            className={`flex items-center gap-2 cursor-pointer transition-opacity ${
              hoveredRing !== null && hoveredRing !== i ? "opacity-30" : ""
            }`}
            onMouseEnter={() => setHoveredRing(i)}
            onMouseLeave={() => setHoveredRing(null)}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: ring.color }}
            />
            <span className="text-[var(--muted)] truncate">{ring.label}</span>
            <span className="font-bold ml-auto">+{ring.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
