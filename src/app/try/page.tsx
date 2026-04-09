"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { PERSONAS } from "@/data/simulations/personas";
import { WORLD_CUP_COUNTRIES } from "@/data/countries";
import { PLAYER_POOL } from "@/data/players";
import { FutCard } from "@/components/player-fut-card";

const TIMELINES = [
  {
    id: "argentina-again",
    name: "Argentina Again",
    icon: "🇦🇷",
    description: "Messi's farewell miracle. African teams surge. Europe crumbles.",
    tone: "Dramatic",
    toneColor: "var(--gold)",
  },
  {
    id: "french-dynasty",
    name: "French Dynasty",
    icon: "🇫🇷",
    description: "France three-peats. Mbappé goes god-mode. Group of death chaos.",
    tone: "Dominant",
    toneColor: "var(--electric)",
    comingSoon: true,
  },
  {
    id: "brazil-redemption",
    name: "Brazil's Redemption",
    icon: "🇧🇷",
    description: "Brazil returns to glory. Vinícius Jr. carries a nation. Underdogs fall.",
    tone: "Classic",
    toneColor: "var(--emerald)",
    comingSoon: true,
  },
];

export default function TryPage() {
  const router = useRouter();
  const [step, setStep] = useState<"persona" | "timeline">("persona");
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);

  const handleStart = () => {
    if (selectedPersona && selectedTimeline) {
      router.push(`/try/play?persona=${selectedPersona}&timeline=${selectedTimeline}`);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="text-center pt-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-3xl md:text-4xl font-black">
            <span className="text-shimmer">Try a Tournament</span>
          </h1>
          <p className="text-[var(--muted)] mt-2 max-w-md mx-auto">
            Experience a full World Cup in 60 seconds. Make picks. Watch your score rise. Feel the drama.
          </p>
        </motion.div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step === "persona" ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
            step === "persona" ? "bg-[var(--gold)] text-[var(--background)]" : selectedPersona ? "bg-[var(--emerald)] text-white" : "bg-[var(--surface-light)]"
          }`}>
            {selectedPersona ? "✓" : "1"}
          </div>
          <span className="text-sm font-semibold hidden md:inline">Pick Your Style</span>
        </div>
        <div className="w-8 h-0.5 bg-[var(--surface-border)]" />
        <div className={`flex items-center gap-2 ${step === "timeline" ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
            step === "timeline" ? "bg-[var(--gold)] text-[var(--background)]" : "bg-[var(--surface-light)]"
          }`}>
            2
          </div>
          <span className="text-sm font-semibold hidden md:inline">Choose a Timeline</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ═══ STEP 1: PERSONA ═══ */}
        {step === "persona" && (
          <motion.div
            key="persona"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PERSONAS.map((persona, i) => {
                const isSelected = selectedPersona === persona.id;
                const countries = persona.countries.map((c) => WORLD_CUP_COUNTRIES.find((cc) => cc.code === c)).filter(Boolean);
                const topPlayer = PLAYER_POOL.find((p) => p.id === persona.players[0]);

                return (
                  <motion.button
                    key={persona.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPersona(persona.id)}
                    className={`relative rounded-2xl p-5 text-left transition-all ${
                      isSelected
                        ? "ring-2 shadow-xl"
                        : "bg-[var(--surface)] hover:bg-[var(--surface-light)]"
                    }`}
                    style={isSelected ? {
                      backgroundColor: `${persona.color}10`,
                      boxShadow: `0 0 0 2px ${persona.color}, 0 8px 32px ${persona.color}20`,
                    } : undefined}
                  >
                    {/* Icon + Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">{persona.icon}</div>
                      <div>
                        <div className="font-black text-lg">{persona.name}</div>
                        <div className="text-xs" style={{ color: persona.color }}>{persona.tagline}</div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[var(--muted)] mb-4">{persona.description}</p>

                    {/* Country flags + top player */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {countries.map((c) => (
                          <div key={c?.code} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--surface-light)] text-xs">
                            <span className="text-lg">{c?.flag}</span>
                            <span className="font-semibold hidden md:inline">{c?.name}</span>
                          </div>
                        ))}
                      </div>
                      {topPlayer && (
                        <div className="text-right text-xs text-[var(--muted)]">
                          <span className="font-bold text-[var(--foreground)]">{topPlayer.rating}</span> {topPlayer.name}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                        style={{ backgroundColor: persona.color, color: "var(--background)" }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Continue button */}
            <AnimatePresence>
              {selectedPersona && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex justify-center pt-4"
                >
                  <button
                    onClick={() => setStep("timeline")}
                    className="px-8 py-3 bg-[var(--gold)] text-[var(--background)] font-black rounded-2xl hover:bg-[var(--gold-dim)] transition-colors text-lg shadow-xl shadow-[var(--gold)]/20"
                  >
                    Choose Your Timeline →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══ STEP 2: TIMELINE ═══ */}
        {step === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <button
              onClick={() => setStep("persona")}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-2"
            >
              ← Back to personas
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TIMELINES.map((timeline, i) => {
                const isSelected = selectedTimeline === timeline.id;
                const isDisabled = !!timeline.comingSoon;

                return (
                  <motion.button
                    key={timeline.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={isDisabled ? {} : { scale: 1.03, y: -4 }}
                    whileTap={isDisabled ? {} : { scale: 0.97 }}
                    onClick={() => !isDisabled && setSelectedTimeline(timeline.id)}
                    disabled={isDisabled}
                    className={`relative rounded-2xl p-6 text-left transition-all ${
                      isDisabled ? "opacity-50 cursor-not-allowed" : ""
                    } ${
                      isSelected
                        ? "ring-2 shadow-xl bg-[var(--gold)]/10"
                        : "bg-[var(--surface)] hover:bg-[var(--surface-light)]"
                    }`}
                    style={isSelected ? {
                      boxShadow: `0 8px 32px ${timeline.toneColor}20`,
                    } : undefined}
                  >
                    <div className="text-5xl mb-4">{timeline.icon}</div>
                    <div className="font-black text-lg mb-1">{timeline.name}</div>
                    <p className="text-sm text-[var(--muted)] mb-3">{timeline.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{
                        backgroundColor: `${timeline.toneColor}15`,
                        color: timeline.toneColor,
                      }}>
                        {timeline.tone}
                      </span>
                      {isDisabled && (
                        <span className="text-[10px] font-bold text-[var(--muted)]">Coming Soon</span>
                      )}
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-[var(--gold)] rounded-full flex items-center justify-center text-[var(--background)] text-sm font-bold shadow-lg"
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Start button */}
            <AnimatePresence>
              {selectedTimeline && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex justify-center pt-4"
                >
                  <button
                    onClick={handleStart}
                    className="px-10 py-4 bg-[var(--gold)] text-[var(--background)] font-black rounded-2xl hover:bg-[var(--gold-dim)] transition-colors text-xl shadow-xl shadow-[var(--gold)]/30"
                  >
                    Start the Simulation ⚡
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
