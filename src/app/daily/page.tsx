"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { Confetti } from "@/components/confetti";
import { MilestoneToast } from "@/components/milestone-toast";
import { MorningWhistleBanner } from "@/components/morning-whistle-banner";
import { WORLD_CUP_COUNTRIES } from "@/data/countries";
import { PLAYER_POOL } from "@/data/players";

type DailyTab = "picks" | "predictions" | "h2h";

const SAMPLE_MATCHES = [
  {
    id: "m1",
    home: "US",
    away: "MA",
    time: "12:00 PM",
    stage: "Group A",
    likelyScorers: ["pulisic", "weah", "hakimi", "en-nesyri"],
  },
  {
    id: "m2",
    home: "FR",
    away: "DK",
    time: "3:00 PM",
    stage: "Group B",
    likelyScorers: ["mbappe", "griezmann", "hojlund", "eriksen"],
  },
  {
    id: "m3",
    home: "BR",
    away: "SN",
    time: "6:00 PM",
    stage: "Group E",
    likelyScorers: ["vinicius", "rodrygo", "mane"],
  },
];

export default function DailyPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<DailyTab>("picks");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<
    Record<string, { winner: string; goals: string; scorer: string; ban: string; boost: string }>
  >({});
  const [picksSubmitted, setPicksSubmitted] = useState(false);

  const playingCountries = SAMPLE_MATCHES.flatMap((m) => [m.home, m.away]);
  const todaysCountries = WORLD_CUP_COUNTRIES.filter((c) =>
    playingCountries.includes(c.code)
  );
  const todaysPlayers = PLAYER_POOL.filter((p) =>
    playingCountries.includes(p.countryCode)
  );

  const completedPredictions = SAMPLE_MATCHES.filter((m) => {
    const p = predictions[m.id];
    return p?.winner && p?.goals && p?.scorer;
  }).length;

  const [showConfetti, setShowConfetti] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [h2hLineup, setH2hLineup] = useState<Set<string>>(new Set(["Mbappé", "Rúben Dias", "Hakimi"]));

  const toggleH2hPlayer = (name: string) => {
    setH2hLineup((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else if (next.size < 3) {
        next.add(name);
      }
      return next;
    });
  };

  const tabs: { id: DailyTab; label: string; mobileLabel: string; icon: string; badge?: string }[] = [
    { id: "picks", label: "Daily Picks", mobileLabel: "Picks", icon: "🎲" },
    {
      id: "predictions",
      label: "Speed Round",
      mobileLabel: "Speed",
      icon: "⚡",
      badge: completedPredictions > 0 ? `${completedPredictions}/${SAMPLE_MATCHES.length}` : undefined,
    },
    { id: "h2h", label: "Head-to-Head", mobileLabel: "H2H", icon: "⚔️" },
  ];

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti />}
      <MilestoneToast
        icon="🔥"
        title="4-day prediction streak!"
        subtitle="Keep it going tomorrow."
        isVisible={showMilestone}
        onDismiss={() => setShowMilestone(false)}
      />
      <MorningWhistleBanner />

      {/* Header with countdown feel */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black">
            <span className="text-shimmer">Daily Game</span>
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-[var(--gold)]">{SAMPLE_MATCHES.length}</div>
          <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Matches Today</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface)] rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-all relative ${
              activeTab === tab.id
                ? "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="md:hidden">{tab.mobileLabel}</span>
            <span className="hidden md:inline">{tab.label}</span>
            {tab.badge && (
              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 bg-[var(--gold)] text-[var(--background)] text-[10px] font-bold rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════ */}
        {/* DAILY PICKS TAB                                */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === "picks" && (
          <motion.div
            key="picks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {picksSubmitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="card-glow rounded-2xl p-8 bg-[var(--surface)] text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="text-6xl"
                >
                  🔒
                </motion.div>
                <h2 className="text-2xl font-black">Picks Locked In!</h2>
                <div className="flex justify-center gap-12">
                  <div>
                    <div className="text-5xl mb-2">
                      {WORLD_CUP_COUNTRIES.find((c) => c.code === selectedCountry)?.flag}
                    </div>
                    <div className="font-bold">
                      {WORLD_CUP_COUNTRIES.find((c) => c.code === selectedCountry)?.name}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1">
                      Country of the Day
                    </div>
                  </div>
                  <div className="w-px bg-[var(--surface-border)]" />
                  <div>
                    <div className="text-5xl mb-2">⭐</div>
                    <div className="font-bold">
                      {PLAYER_POOL.find((p) => p.id === selectedPlayer)?.name}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1">
                      Player of the Day
                    </div>
                  </div>
                </div>
                {/* Social proof */}
                <div className="rounded-xl bg-[var(--gold)]/5 border border-[var(--gold)]/20 p-3">
                  <p className="text-sm text-[var(--gold)]">
                    You&apos;re the 4th person to submit today
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Sarah, Marcus, and Lisa already locked in. Picks are blind until everyone submits.
                  </p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Country of the Day — flag-forward grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black">Country of the Day</h2>
                    <span className="text-xs text-[var(--muted)]">Contrarian picks pay more</span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {todaysCountries.map((country) => (
                      <motion.button
                        key={country.code}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCountry(country.code)}
                        className={`relative rounded-2xl p-4 text-center transition-all ${
                          selectedCountry === country.code
                            ? "bg-[var(--gold)]/15 ring-2 ring-[var(--gold)] shadow-lg shadow-[var(--gold)]/10"
                            : "bg-[var(--surface)] hover:bg-[var(--surface-light)]"
                        }`}
                      >
                        <div className="text-4xl mb-2">{country.flag}</div>
                        <div className="font-bold text-xs">{country.name}</div>
                        {selectedCountry === country.code && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[var(--gold)] rounded-full flex items-center justify-center text-[var(--background)] text-xs font-bold"
                          >
                            ✓
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Player of the Day — card-style selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black">Player of the Day</h2>
                    <span className="text-xs text-[var(--muted)]">Any player, any team</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {todaysPlayers.map((player) => {
                      const country = WORLD_CUP_COUNTRIES.find((c) => c.code === player.countryCode);
                      const isSelected = selectedPlayer === player.id;
                      return (
                        <motion.button
                          key={player.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedPlayer(player.id)}
                          className={`relative flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                            isSelected
                              ? "bg-[var(--gold)]/15 ring-2 ring-[var(--gold)]"
                              : "bg-[var(--surface)] hover:bg-[var(--surface-light)]"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                            isSelected ? "bg-[var(--gold)]/20" : "bg-[var(--surface-light)]"
                          }`}>
                            {country?.flag}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">{player.name}</div>
                            <div className="text-[10px] text-[var(--muted)]">
                              {player.position} · {player.rating}
                            </div>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--gold)] rounded-full flex items-center justify-center text-[var(--background)] text-[10px] font-bold"
                            >
                              ✓
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit — sticky bottom bar */}
                <AnimatePresence>
                  {selectedCountry && selectedPlayer && (
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 40 }}
                      className="fixed bottom-20 md:bottom-8 left-0 right-0 z-40 px-4"
                    >
                      <div className="max-w-5xl mx-auto">
                        <button
                          onClick={() => { setPicksSubmitted(true); setShowConfetti(true); setTimeout(() => setShowMilestone(true), 1200); }}
                          className="w-full py-4 bg-[var(--gold)] text-[var(--background)] font-black rounded-2xl hover:bg-[var(--gold-dim)] transition-colors text-lg shadow-xl shadow-[var(--gold)]/20"
                        >
                          Lock in Daily Picks 🔒
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* SPEED ROUND TAB                                */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === "predictions" && (
          <motion.div
            key="predictions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--gold)] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedPredictions / SAMPLE_MATCHES.length) * 100}%` }}
                  transition={{ type: "spring" }}
                />
              </div>
              <span className="text-xs font-bold text-[var(--gold)]">
                {completedPredictions}/{SAMPLE_MATCHES.length}
              </span>
            </div>

            {SAMPLE_MATCHES.map((match, matchIdx) => {
              const home = WORLD_CUP_COUNTRIES.find((c) => c.code === match.home);
              const away = WORLD_CUP_COUNTRIES.find((c) => c.code === match.away);
              const pred = predictions[match.id] || { winner: "", goals: "", scorer: "", ban: "", boost: "" };
              const scorerPlayers = PLAYER_POOL.filter((p) => match.likelyScorers.includes(p.id));
              const isComplete = pred.winner && pred.goals && pred.scorer;

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: matchIdx * 0.1 }}
                  className={`rounded-2xl overflow-hidden transition-all ${
                    isComplete ? "ring-2 ring-[var(--emerald)]/30" : ""
                  }`}
                >
                  {/* Match Header — dramatic scoreboard style */}
                  <div className="bg-gradient-to-r from-[var(--surface)] via-[var(--surface-light)] to-[var(--surface)] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-4xl">{home?.flag}</span>
                        <div>
                          <div className="font-black text-lg">{home?.name}</div>
                          <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
                            FIFA #{home?.fifaRanking}
                          </div>
                        </div>
                      </div>

                      <div className="text-center px-6">
                        <div className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-1">{match.stage}</div>
                        <div className="text-2xl font-black text-[var(--gold)]">{match.time}</div>
                        {isComplete && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.4, 1] }}
                            transition={{ type: "spring", stiffness: 300, damping: 12 }}
                            className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full bg-[var(--emerald)]/15 text-[var(--emerald)] border border-[var(--emerald)]/20"
                          >
                            ✓ Locked
                          </motion.div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <div className="text-right">
                          <div className="font-black text-lg">{away?.name}</div>
                          <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
                            FIFA #{away?.fifaRanking}
                          </div>
                        </div>
                        <span className="text-4xl">{away?.flag}</span>
                      </div>
                    </div>
                  </div>

                  {/* Predictions — stacked with visual variety */}
                  <div className="bg-[var(--surface)] p-5 space-y-5">
                    {/* Speed Round urgency cue */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--gold)]/5 border border-[var(--gold)]/10">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gold)] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--gold)]" />
                      </span>
                      <span className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider">Speed Round</span>
                    </div>

                    {/* Q1: Winner — big flag buttons */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Who wins?</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] font-bold">+3 pts</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: "home", label: home?.name || "", flag: home?.flag },
                          { val: "draw", label: "Draw", flag: "🤝" },
                          { val: "away", label: away?.name || "", flag: away?.flag },
                        ].map((opt) => (
                          <motion.button
                            key={opt.val}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              setPredictions((prev) => ({
                                ...prev,
                                [match.id]: { ...pred, winner: opt.val },
                              }))
                            }
                            className={`py-3 rounded-xl text-center transition-all ${
                              pred.winner === opt.val
                                ? "bg-[var(--gold)] text-[var(--background)] font-black shadow-lg shadow-[var(--gold)]/20"
                                : "bg-[var(--surface-light)] hover:bg-[var(--surface-border)] font-semibold"
                            }`}
                          >
                            <div className="text-xl mb-0.5">{opt.flag}</div>
                            <div className="text-xs">{opt.label}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Q2: Over/Under — toggle style */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Total Goals</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--electric)]/10 text-[var(--electric)] font-bold">+2 pts</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() =>
                            setPredictions((prev) => ({
                              ...prev,
                              [match.id]: { ...pred, goals: "over" },
                            }))
                          }
                          className={`py-4 rounded-xl text-center transition-all ${
                            pred.goals === "over"
                              ? "bg-[var(--emerald)] text-white font-black shadow-lg shadow-[var(--emerald)]/20"
                              : "bg-[var(--surface-light)] hover:bg-[var(--surface-border)]"
                          }`}
                        >
                          <div className="text-2xl mb-1">🔥</div>
                          <div className="font-bold text-sm">Over 2.5</div>
                          <div className="text-[10px] opacity-70">3+ goals</div>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() =>
                            setPredictions((prev) => ({
                              ...prev,
                              [match.id]: { ...pred, goals: "under" },
                            }))
                          }
                          className={`py-4 rounded-xl text-center transition-all ${
                            pred.goals === "under"
                              ? "bg-[var(--electric)] text-white font-black shadow-lg shadow-[var(--electric)]/20"
                              : "bg-[var(--surface-light)] hover:bg-[var(--surface-border)]"
                          }`}
                        >
                          <div className="text-2xl mb-1">🧊</div>
                          <div className="font-bold text-sm">Under 2.5</div>
                          <div className="text-[10px] opacity-70">0-2 goals</div>
                        </motion.button>
                      </div>
                    </div>

                    {/* Q3: First Scorer — player card grid */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">First Goal Scorer</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--crimson)]/10 text-[var(--crimson)] font-bold">+5 pts</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {scorerPlayers.map((player) => {
                          const pCountry = WORLD_CUP_COUNTRIES.find((c) => c.code === player.countryCode);
                          const isSelected = pred.scorer === player.id;
                          return (
                            <motion.button
                              key={player.id}
                              whileTap={{ scale: 0.97 }}
                              onClick={() =>
                                setPredictions((prev) => ({
                                  ...prev,
                                  [match.id]: { ...pred, scorer: player.id },
                                }))
                              }
                              className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all ${
                                isSelected
                                  ? "bg-[var(--crimson)]/15 ring-2 ring-[var(--crimson)] text-[var(--crimson)]"
                                  : "bg-[var(--surface-light)] hover:bg-[var(--surface-border)]"
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                                isSelected ? "bg-[var(--crimson)]/20" : "bg-[var(--surface)]"
                              }`}>
                                {player.rating}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-sm truncate">{player.name}</div>
                                <div className="text-[10px] opacity-60">{pCountry?.flag} {pCountry?.name}</div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ban/Boost — power-up style chips */}
                    <div className="flex gap-3 pt-3 border-t border-[var(--surface-border)]/50">
                      <div className="flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">🚫 Ban</div>
                        <div className="flex flex-wrap gap-1.5">
                          {scorerPlayers.map((p) => (
                            <button
                              key={p.id}
                              onClick={() =>
                                setPredictions((prev) => ({
                                  ...prev,
                                  [match.id]: { ...pred, ban: pred.ban === p.id ? "" : p.id },
                                }))
                              }
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                                pred.ban === p.id
                                  ? "bg-[var(--crimson)] text-white"
                                  : "bg-[var(--surface-light)] text-[var(--muted)] hover:text-[var(--foreground)]"
                              }`}
                            >
                              {p.name.split(" ").pop()}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="w-px bg-[var(--surface-border)]/50" />
                      <div className="flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">🚀 Boost</div>
                        <div className="flex flex-wrap gap-1.5">
                          {scorerPlayers.map((p) => (
                            <button
                              key={p.id}
                              onClick={() =>
                                setPredictions((prev) => ({
                                  ...prev,
                                  [match.id]: { ...pred, boost: pred.boost === p.id ? "" : p.id },
                                }))
                              }
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                                pred.boost === p.id
                                  ? "bg-[var(--emerald)] text-white"
                                  : "bg-[var(--surface-light)] text-[var(--muted)] hover:text-[var(--foreground)]"
                              }`}
                            >
                              {p.name.split(" ").pop()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Submit — sticky bottom */}
            <AnimatePresence>
              {completedPredictions > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  className="fixed bottom-20 md:bottom-8 left-0 right-0 z-40 px-4"
                >
                  <div className="max-w-5xl mx-auto">
                    <button
                      onClick={() => {
                        setPredictions({});
                        setShowConfetti(true);
                      }}
                      className="w-full py-4 bg-[var(--gold)] text-[var(--background)] font-black rounded-2xl hover:bg-[var(--gold-dim)] transition-colors text-lg shadow-xl shadow-[var(--gold)]/20 flex items-center justify-center gap-3"
                    >
                      <span>Submit {completedPredictions} Prediction{completedPredictions > 1 ? "s" : ""}</span>
                      <span className="text-sm opacity-70">⚡</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* HEAD-TO-HEAD TAB                               */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === "h2h" && (
          <motion.div
            key="h2h"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Matchup card — VS screen feel */}
            <div className="rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-b from-[var(--gold)]/10 to-transparent p-8 text-center">
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-4">Today&apos;s Matchup</div>

                <div className="flex items-center justify-center gap-6 md:gap-12">
                  {/* Player 1 */}
                  <motion.div
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-[var(--gold)]/10 flex items-center justify-center text-3xl font-black text-[var(--gold)] mx-auto mb-3 ring-2 ring-[var(--gold)]/20">
                      {profile?.name?.[0] || "?"}
                    </div>
                    <div className="font-black text-lg">{profile?.name || "You"}</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className="text-xs text-[var(--emerald)] font-bold">3W</span>
                      <span className="text-xs text-[var(--muted)]">·</span>
                      <span className="text-xs text-[var(--crimson)] font-bold">1L</span>
                      <span className="text-xs text-[var(--muted)]">·</span>
                      <span className="text-xs text-[var(--muted)] font-bold">0D</span>
                    </div>
                  </motion.div>

                  {/* VS badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-14 h-14 rounded-full bg-[var(--gold)] flex items-center justify-center text-[var(--background)] font-black text-lg shadow-xl shadow-[var(--gold)]/30"
                  >
                    VS
                  </motion.div>

                  {/* Player 2 */}
                  <motion.div
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-[var(--electric)]/10 flex items-center justify-center text-3xl font-black text-[var(--electric)] mx-auto mb-3 ring-2 ring-[var(--electric)]/20">
                      C
                    </div>
                    <div className="font-black text-lg">Chris</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className="text-xs text-[var(--emerald)] font-bold">2W</span>
                      <span className="text-xs text-[var(--muted)]">·</span>
                      <span className="text-xs text-[var(--crimson)] font-bold">1L</span>
                      <span className="text-xs text-[var(--muted)]">·</span>
                      <span className="text-xs text-[var(--muted)] font-bold">1D</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Lineup selector */}
              <div className="bg-[var(--surface)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Your Lineup — pick 3</span>
                  <span className="text-xs text-[var(--muted)]">🔒 Locks in 2h 14m</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Mbappé", rating: 93, country: "🇫🇷", playing: true },
                    { name: "Rúben Dias", rating: 87, country: "🇵🇹", playing: true },
                    { name: "Mitoma", rating: 82, country: "🇯🇵", playing: false },
                    { name: "Hakimi", rating: 86, country: "🇲🇦", playing: true },
                    { name: "Alaba", rating: 82, country: "🇦🇹", playing: false },
                  ].map((player) => {
                    const inLineup = h2hLineup.has(player.name);
                    const lineupIndex = [...h2hLineup].indexOf(player.name);
                    const canAdd = !inLineup && h2hLineup.size < 3;
                    return (
                      <motion.button
                        key={player.name}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleH2hPlayer(player.name)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                          inLineup
                            ? "bg-[var(--gold)]/10 ring-1 ring-[var(--gold)]/30"
                            : canAdd
                              ? "bg-[var(--surface-light)] hover:bg-[var(--surface-border)] cursor-pointer"
                              : "bg-[var(--surface-light)] opacity-40"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                          inLineup
                            ? "bg-[var(--gold)] text-[var(--background)]"
                            : "bg-[var(--surface-border)] text-[var(--muted)]"
                        }`}>
                          {inLineup ? lineupIndex + 1 : "—"}
                        </div>
                        <span className="text-lg">{player.country}</span>
                        <div className="flex-1">
                          <span className="font-bold text-sm">{player.name}</span>
                          <span className="text-xs text-[var(--muted)] ml-2">{player.rating}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          player.playing
                            ? "bg-[var(--emerald)]/10 text-[var(--emerald)]"
                            : "bg-[var(--surface-border)] text-[var(--muted)]"
                        }`}>
                          {player.playing ? "PLAYING" : "REST DAY"}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
