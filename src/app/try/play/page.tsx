"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { PERSONAS } from "@/data/simulations/personas";
import { ARGENTINA_TIMELINE } from "@/data/simulations/argentina-timeline";
import { AnimatedNumber } from "@/components/animated-number";
import { WORLD_CUP_COUNTRIES } from "@/data/countries";
import Link from "next/link";

function PlayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const personaId = searchParams.get("persona") || "favorite";
  const persona = PERSONAS.find((p) => p.id === personaId) || PERSONAS[0];
  const timeline = ARGENTINA_TIMELINE;

  const [currentDay, setCurrentDay] = useState(-1); // -1 = intro
  const [totalScore, setTotalScore] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const day = currentDay >= 0 ? timeline.days[currentDay] : null;

  const advance = useCallback(() => {
    if (currentDay < timeline.days.length - 1) {
      const nextDay = currentDay + 1;
      setCurrentDay(nextDay);
      const delta = timeline.days[nextDay].scoreDeltas[personaId] || 0;
      setTotalScore((prev) => prev + delta);
    } else {
      setShowResults(true);
      setAutoPlay(false);
    }
  }, [currentDay, timeline.days, personaId]);

  // Auto-advance
  useEffect(() => {
    if (!autoPlay || showResults) return;
    const timer = setTimeout(advance, 4000);
    return () => clearTimeout(timer);
  }, [autoPlay, currentDay, advance, showResults]);

  // Start auto-play after intro
  useEffect(() => {
    if (currentDay === -1) {
      const timer = setTimeout(() => {
        setCurrentDay(0);
        setTotalScore(timeline.days[0].scoreDeltas[personaId] || 0);
        setAutoPlay(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finalRank = day?.leaderboard.find((e) => e.isYou)?.rank || 1;
  const finalAwards = day?.awards || [];

  // ─── RESULTS SCREEN ─────────────────────────────
  if (showResults) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-8 py-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-8xl">
          🏆
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-4xl font-black mb-2">
            <span className="text-shimmer">Tournament Complete!</span>
          </h1>
          <p className="text-[var(--muted)]">{timeline.finalMessage}</p>
        </motion.div>

        {/* Your result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-[var(--surface)] p-8 max-w-md w-full space-y-4"
        >
          <div className="text-6xl mb-2">{persona.icon}</div>
          <div className="text-sm text-[var(--muted)]">Playing as {persona.name}</div>
          <div className="text-5xl font-black text-[var(--gold)]">
            <AnimatedNumber value={totalScore} duration={1.5} />
          </div>
          <div className="text-[var(--muted)]">points</div>
          <div className="text-3xl font-black">
            Finished #{finalRank} of 8
          </div>

          {/* Awards */}
          {finalAwards.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-[var(--surface-border)]">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Awards Earned</div>
              {finalAwards.filter((a) => a.winner === "You").map((award) => (
                <motion.div
                  key={award.name}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 1 }}
                  className="flex items-center gap-2 justify-center text-lg"
                >
                  <span className="text-2xl">{award.icon}</span>
                  <span className="font-bold">{award.name}</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="space-y-4"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[var(--gold)] text-[var(--background)] font-black rounded-2xl hover:bg-[var(--gold-dim)] transition-colors text-xl shadow-xl shadow-[var(--gold)]/30"
          >
            Create Your League →
          </Link>
          <div className="flex gap-4 justify-center text-sm">
            <button
              onClick={() => {
                setCurrentDay(-1);
                setTotalScore(0);
                setShowResults(false);
                setTimeout(() => {
                  setCurrentDay(0);
                  setTotalScore(timeline.days[0].scoreDeltas[personaId] || 0);
                  setAutoPlay(true);
                }, 2000);
              }}
              className="text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Play again
            </button>
            <Link href="/try" className="text-[var(--muted)] hover:text-[var(--foreground)]">
              Try a different persona
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── INTRO SCREEN ───────────────────────────────
  if (currentDay === -1) {
    const countries = persona.countries.map((c) => WORLD_CUP_COUNTRIES.find((cc) => cc.code === c)).filter(Boolean);
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="text-7xl"
        >
          {persona.icon}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-3xl font-black">{persona.name}</h2>
          <p className="text-[var(--muted)] mt-1">{persona.tagline}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex gap-3"
        >
          {countries.map((c) => (
            <div key={c?.code} className="text-4xl">{c?.flag}</div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-sm text-[var(--muted)]"
        >
          {timeline.icon} {timeline.name} timeline loading...
        </motion.div>
      </div>
    );
  }

  // ─── DAY VIEW ───────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Top bar: score + progress */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[var(--muted)] uppercase tracking-wider">Your Score</div>
          <AnimatedNumber value={totalScore} className="text-3xl font-black text-[var(--gold)]" />
        </div>
        <div className="flex items-center gap-3">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {timeline.days.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === currentDay
                    ? "bg-[var(--gold)] scale-125"
                    : i < currentDay
                      ? "bg-[var(--emerald)]"
                      : "bg-[var(--surface-light)]"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              autoPlay ? "bg-[var(--gold)]/10 text-[var(--gold)]" : "bg-[var(--surface-light)] text-[var(--muted)]"
            }`}
          >
            {autoPlay ? "⏸ Pause" : "▶ Auto"}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {day && (
          <motion.div
            key={currentDay}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="space-y-4"
          >
            {/* Day header */}
            <div className="rounded-2xl bg-gradient-to-r from-[var(--gold)]/10 via-transparent to-[var(--gold)]/10 p-5 text-center">
              <div className="text-xs uppercase tracking-widest text-[var(--muted)] mb-1">Day {day.day}</div>
              <h2 className="text-2xl font-black">{day.title}</h2>
            </div>

            {/* Match results */}
            <div className="space-y-2">
              {day.matches.map((match, i) => {
                const home = WORLD_CUP_COUNTRIES.find((c) => c.code === match.home);
                const away = WORLD_CUP_COUNTRIES.find((c) => c.code === match.away);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="rounded-xl bg-[var(--surface)] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-2xl">{home?.flag}</span>
                        <span className="font-bold text-sm">{home?.name}</span>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-2xl font-black">
                          {match.homeScore} — {match.awayScore}
                        </div>
                        <div className="text-[10px] text-[var(--muted)] uppercase">{match.stage}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-bold text-sm">{away?.name}</span>
                        <span className="text-2xl">{away?.flag}</span>
                      </div>
                    </div>
                    {match.motm && (
                      <div className="text-center mt-2 text-xs text-[var(--gold)]">
                        ⭐ MOTM: {match.motm}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Score delta */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-3"
            >
              <span className={`text-3xl font-black ${
                (day.scoreDeltas[personaId] || 0) > 0 ? "text-[var(--emerald)]" : "text-[var(--crimson)]"
              }`}>
                {(day.scoreDeltas[personaId] || 0) > 0 ? "+" : ""}{day.scoreDeltas[personaId] || 0} pts
              </span>
            </motion.div>

            {/* AI Commentary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl bg-[var(--electric)]/10 border border-[var(--electric)]/20 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">🤖</span>
                <p className="text-sm leading-relaxed">
                  {day.commentary[PERSONAS.findIndex((p) => p.id === personaId)] || day.commentary[0]}
                </p>
              </div>
            </motion.div>

            {/* Hot take update */}
            {day.hotTakeUpdate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className={`rounded-xl p-4 ${
                  day.hotTakeUpdate.status === "hit"
                    ? "bg-[var(--emerald)]/10 border border-[var(--emerald)]/20"
                    : day.hotTakeUpdate.status === "miss"
                      ? "bg-[var(--crimson)]/10 border border-[var(--crimson)]/20"
                      : "bg-[var(--gold)]/10 border border-[var(--gold)]/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    {day.hotTakeUpdate.status === "hit" ? "✅" : day.hotTakeUpdate.status === "miss" ? "❌" : "🔥"}
                  </span>
                  <p className="text-sm">{day.hotTakeUpdate.text}</p>
                </div>
              </motion.div>
            )}

            {/* H2H result */}
            {day.h2hResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="rounded-xl bg-[var(--surface)] p-4 text-center"
              >
                <div className="text-xs text-[var(--muted)] mb-2">⚔️ Head-to-Head</div>
                <div className="text-2xl font-black">
                  <span className={day.h2hResult.yourScore > day.h2hResult.theirScore ? "text-[var(--emerald)]" : "text-[var(--crimson)]"}>
                    {day.h2hResult.yourScore}
                  </span>
                  <span className="text-[var(--muted)] mx-2">—</span>
                  <span className="text-[var(--muted)]">{day.h2hResult.theirScore}</span>
                </div>
                <div className="text-xs text-[var(--muted)] mt-1">vs {day.h2hResult.opponent}</div>
              </motion.div>
            )}

            {/* Mini leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="rounded-xl bg-[var(--surface)] overflow-hidden"
            >
              <div className="px-4 py-2 bg-[var(--surface-light)] text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                Standings
              </div>
              {day.leaderboard.slice(0, 5).map((entry, i) => (
                <div
                  key={entry.name}
                  className={`flex items-center gap-3 px-4 py-2 ${entry.isYou ? "bg-[var(--gold)]/5" : ""}`}
                >
                  <span className="w-5 text-center text-xs font-black">
                    {["🥇", "🥈", "🥉", "4", "5"][i]}
                  </span>
                  <span className={`font-bold text-sm flex-1 ${entry.isYou ? "text-[var(--gold)]" : ""}`}>
                    {entry.name} {entry.isYou ? "(You)" : ""}
                  </span>
                  <span className="font-black text-sm">{entry.score}</span>
                </div>
              ))}
            </motion.div>

            {/* Awards on final day */}
            {day.awards && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 }}
                className="rounded-xl bg-[var(--gold)]/5 border border-[var(--gold)]/20 p-4"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-3">🏆 Awards</div>
                <div className="grid grid-cols-2 gap-2">
                  {day.awards.map((award) => (
                    <div key={award.name} className="flex items-center gap-2 text-sm">
                      <span>{award.icon}</span>
                      <span className="font-bold">{award.name}</span>
                      <span className="text-[var(--muted)] ml-auto">{award.winner}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Next button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={advance}
                className="px-6 py-3 bg-[var(--gold)] text-[var(--background)] font-black rounded-2xl hover:bg-[var(--gold-dim)] transition-colors shadow-lg shadow-[var(--gold)]/20"
              >
                {currentDay < timeline.days.length - 1 ? "Next Day →" : "See Results 🏆"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-4xl animate-spin">⚽</div>
      </div>
    }>
      <PlayContent />
    </Suspense>
  );
}
