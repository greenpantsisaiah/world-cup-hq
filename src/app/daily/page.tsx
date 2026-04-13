"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useLeague } from "@/components/league-provider";
import { Confetti } from "@/components/confetti";
import { MorningWhistleBanner } from "@/components/morning-whistle-banner";
import { MilestoneToast } from "@/components/milestone-toast";
import { WORLD_CUP_COUNTRIES } from "@/data/countries";
import { PLAYER_POOL } from "@/data/players";
import {
  getMatchesByDate,
  submitDailyPick,
  getMyDailyPick,
  submitPrediction,
  getMyPredictions,
} from "@/lib/supabase-actions";
import Link from "next/link";

type DailyTab = "picks" | "predictions" | "h2h";

interface MatchRow {
  id: string;
  home_country: string;
  away_country: string;
  match_day: string;
  kickoff: string;
  stage: string;
  group_letter: string | null;
  home_score: number | null;
  away_score: number | null;
  is_complete: boolean;
}

interface PredictionRow {
  match_id: string;
  predicted_winner: string;
  predicted_total_goals: string;
  predicted_first_scorer: string | null;
}

export default function DailyPage() {
  const { user } = useAuth();
  const { leagueId } = useLeague();
  const [activeTab, setActiveTab] = useState<DailyTab>("picks");
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Daily picks state
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [picksSubmitted, setPicksSubmitted] = useState(false);
  const [submittingPicks, setSubmittingPicks] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);

  // Predictions state
  const [predictions, setPredictions] = useState<Record<string, { winner: string; goals: string; scorer: string }>>({});
  const [existingPredictions, setExistingPredictions] = useState<PredictionRow[]>([]);
  const [submittingPredictions, setSubmittingPredictions] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true);
    try {
      const [matchData, dailyPick] = await Promise.all([
        getMatchesByDate(todayStr),
        getMyDailyPick(leagueId, todayStr),
      ]);
      setMatches(matchData as MatchRow[]);
      if (dailyPick) {
        setPicksSubmitted(true);
        setSelectedCountry(dailyPick.country_of_the_day);
        setSelectedPlayer(dailyPick.player_of_the_day);
      }

      // Load predictions for today's matches
      if (matchData.length > 0) {
        const matchIds = (matchData as MatchRow[]).map((m) => m.id);
        const preds = await getMyPredictions(leagueId, matchIds);
        setExistingPredictions(preds as PredictionRow[]);
        // Pre-fill predictions state
        const predMap: Record<string, { winner: string; goals: string; scorer: string }> = {};
        for (const p of preds as PredictionRow[]) {
          predMap[p.match_id] = {
            winner: p.predicted_winner || "",
            goals: p.predicted_total_goals || "",
            scorer: p.predicted_first_scorer || "",
          };
        }
        setPredictions(predMap);
      }
    } catch {
      setError("Failed to load daily data");
    }
    setLoading(false);
  }, [leagueId, todayStr]);

  useEffect(() => { loadData(); }, [loadData]);

  // Playing countries/players
  const playingCountryCodes = [...new Set(matches.flatMap((m) => [m.home_country, m.away_country]))];
  const todaysCountries = WORLD_CUP_COUNTRIES.filter((c) => playingCountryCodes.includes(c.code));
  const todaysPlayers = PLAYER_POOL.filter((p) => playingCountryCodes.includes(p.countryCode));

  const completedPredictions = matches.filter((m) => {
    const p = predictions[m.id];
    return p?.winner && p?.goals && p?.scorer;
  }).length;

  // Handlers
  const handleSubmitPicks = async () => {
    if (!leagueId || !selectedCountry || !selectedPlayer) return;
    setSubmittingPicks(true);
    setError(null);
    try {
      await submitDailyPick(leagueId, {
        pick_date: todayStr,
        country_of_the_day: selectedCountry,
        player_of_the_day: selectedPlayer,
      });
      setPicksSubmitted(true);
      setShowConfetti(true);
      setTimeout(() => setShowMilestone(true), 1200);
    } catch {
      setError("Failed to submit picks");
    }
    setSubmittingPicks(false);
  };

  const handleSubmitPredictions = async () => {
    if (!leagueId) return;
    setSubmittingPredictions(true);
    setError(null);
    try {
      for (const match of matches) {
        const pred = predictions[match.id];
        if (pred?.winner && pred?.goals) {
          await submitPrediction(leagueId, {
            match_id: match.id,
            predicted_winner: pred.winner,
            predicted_total_goals: pred.goals,
            predicted_first_scorer: pred.scorer || undefined,
          });
        }
      }
      setShowConfetti(true);
      await loadData();
    } catch {
      setError("Failed to submit predictions");
    }
    setSubmittingPredictions(false);
  };

  const tabs = [
    { id: "picks" as DailyTab, label: "Daily Picks", mobileLabel: "Picks", icon: "🎲" },
    { id: "predictions" as DailyTab, label: "Speed Round", mobileLabel: "Speed", icon: "⚡",
      badge: completedPredictions > 0 ? `${completedPredictions}/${matches.length}` : undefined },
    { id: "h2h" as DailyTab, label: "Head-to-Head", mobileLabel: "H2H", icon: "⚔️" },
  ];

  if (!leagueId) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-6xl">🎯</div>
        <h1 className="text-3xl font-black">Daily Game</h1>
        <p className="text-[var(--muted)]">Join a league to play daily.</p>
        <Link href="/admin" className="inline-block px-6 py-3 bg-[var(--gold)] text-[var(--background)] font-bold rounded-xl">Join a League →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti />}
      {<MilestoneToast icon="🔥" title="Picks Locked!" subtitle="You're in the game today" isVisible={showMilestone} onDismiss={() => setShowMilestone(false)} />}
      <MorningWhistleBanner />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black"><span className="text-shimmer">Daily Game</span></h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {" — "}{matches.length} match{matches.length !== 1 ? "es" : ""} today
          </p>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-[var(--crimson)]/10 text-[var(--crimson)] text-sm">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface)] rounded-lg p-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-all relative ${
              activeTab === tab.id ? "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20" : "text-[var(--muted)]"
            }`}>
            <span>{tab.icon}</span>
            <span className="md:hidden">{tab.mobileLabel}</span>
            <span className="hidden md:inline">{tab.label}</span>
            {tab.badge && (
              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 bg-[var(--gold)] text-[var(--background)] text-[10px] font-bold rounded-full">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-8"><div className="text-2xl animate-spin">⚽</div></div> : (
        <AnimatePresence mode="wait">
          {/* ═══ DAILY PICKS ═══ */}
          {activeTab === "picks" && (
            <motion.div key="picks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {matches.length === 0 ? (
                <div className="text-center py-12 text-[var(--muted)]">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="font-bold">No matches today</p>
                  <p className="text-sm mt-1">Check back on a match day!</p>
                </div>
              ) : picksSubmitted ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="card-glow rounded-2xl p-8 bg-[var(--surface)] text-center space-y-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="text-6xl">🔒</motion.div>
                  <h2 className="text-2xl font-black">Picks Locked In!</h2>
                  <div className="flex justify-center gap-12">
                    <div>
                      <div className="text-5xl mb-2">{WORLD_CUP_COUNTRIES.find((c) => c.code === selectedCountry)?.flag}</div>
                      <div className="font-bold">{WORLD_CUP_COUNTRIES.find((c) => c.code === selectedCountry)?.name}</div>
                      <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1">Country of the Day</div>
                    </div>
                    <div className="w-px bg-[var(--surface-border)]" />
                    <div>
                      <div className="text-5xl mb-2">⭐</div>
                      <div className="font-bold">{PLAYER_POOL.find((p) => p.id === selectedPlayer)?.name}</div>
                      <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1">Player of the Day</div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Country of the Day */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-black">Country of the Day</h2>
                      <span className="text-xs text-[var(--muted)]">Contrarian picks pay more</span>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {todaysCountries.map((c) => (
                        <motion.button key={c.code} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedCountry(c.code)}
                          className={`relative rounded-2xl p-4 text-center transition-all ${
                            selectedCountry === c.code ? "bg-[var(--gold)]/15 ring-2 ring-[var(--gold)]" : "bg-[var(--surface)] hover:bg-[var(--surface-light)]"
                          }`}>
                          <div className="text-4xl mb-2">{c.flag}</div>
                          <div className="font-bold text-xs">{c.name}</div>
                          {selectedCountry === c.code && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[var(--gold)] rounded-full flex items-center justify-center text-[var(--background)] text-xs font-bold">✓</motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Player of the Day */}
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
                          <motion.button key={player.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedPlayer(player.id)}
                            className={`relative flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                              isSelected ? "bg-[var(--gold)]/15 ring-2 ring-[var(--gold)]" : "bg-[var(--surface)] hover:bg-[var(--surface-light)]"
                            }`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${isSelected ? "bg-[var(--gold)]/20" : "bg-[var(--surface-light)]"}`}>
                              {country?.flag}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm truncate">{player.name}</div>
                              <div className="text-[10px] text-[var(--muted)]">{player.position} · {player.rating}</div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit */}
                  <AnimatePresence>
                    {selectedCountry && selectedPlayer && (
                      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                        className="fixed bottom-20 md:bottom-8 left-0 right-0 z-40 px-4">
                        <div className="max-w-5xl mx-auto">
                          <button onClick={handleSubmitPicks} disabled={submittingPicks}
                            className="w-full py-4 bg-[var(--gold)] text-[var(--background)] font-black rounded-2xl hover:bg-[var(--gold-dim)] text-lg shadow-xl shadow-[var(--gold)]/20 disabled:opacity-60">
                            {submittingPicks ? "Submitting..." : "Lock in Daily Picks 🔒"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}

          {/* ═══ SPEED ROUND ═══ */}
          {activeTab === "predictions" && (
            <motion.div key="predictions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {matches.length === 0 ? (
                <div className="text-center py-12 text-[var(--muted)]">
                  <div className="text-4xl mb-3">📅</div>
                  <p>No matches to predict today</p>
                </div>
              ) : (
                <>
                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                      <motion.div className="h-full bg-[var(--gold)] rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${(completedPredictions / matches.length) * 100}%` }}
                        transition={{ type: "spring" }} />
                    </div>
                    <span className="text-xs font-bold text-[var(--gold)]">{completedPredictions}/{matches.length}</span>
                  </div>

                  {matches.map((match) => {
                    const home = WORLD_CUP_COUNTRIES.find((c) => c.code === match.home_country);
                    const away = WORLD_CUP_COUNTRIES.find((c) => c.code === match.away_country);
                    const pred = predictions[match.id] || { winner: "", goals: "", scorer: "" };
                    const isComplete = pred.winner && pred.goals && pred.scorer;
                    const matchPlayers = PLAYER_POOL.filter((p) => p.countryCode === match.home_country || p.countryCode === match.away_country);

                    return (
                      <div key={match.id} className={`rounded-2xl overflow-hidden ${isComplete ? "ring-2 ring-[var(--emerald)]/30" : ""}`}>
                        {/* Match header */}
                        <div className="bg-gradient-to-r from-[var(--surface)] via-[var(--surface-light)] to-[var(--surface)] p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-4xl">{home?.flag}</span>
                              <div>
                                <div className="font-black text-lg">{home?.name}</div>
                                <div className="text-[10px] text-[var(--muted)]">#{home?.fifaRanking}</div>
                              </div>
                            </div>
                            <div className="text-center px-6">
                              <div className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-1">{match.stage}</div>
                              {match.is_complete ? (
                                <div className="text-2xl font-black">{match.home_score} — {match.away_score}</div>
                              ) : (
                                <div className="text-2xl font-black text-[var(--gold)]">
                                  {new Date(match.kickoff).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              )}
                              {isComplete && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }}
                                  className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full bg-[var(--emerald)]/15 text-[var(--emerald)]">✓ Locked</motion.div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <div className="text-right">
                                <div className="font-black text-lg">{away?.name}</div>
                                <div className="text-[10px] text-[var(--muted)]">#{away?.fifaRanking}</div>
                              </div>
                              <span className="text-4xl">{away?.flag}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[var(--surface)] p-5 space-y-5">
                          {/* Winner */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Who wins?</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] font-bold">+3 pts</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { val: "home", label: home?.name, flag: home?.flag },
                                { val: "draw", label: "Draw", flag: "🤝" },
                                { val: "away", label: away?.name, flag: away?.flag },
                              ].map((opt) => (
                                <motion.button key={opt.val} whileTap={{ scale: 0.95 }}
                                  onClick={() => setPredictions((prev) => ({ ...prev, [match.id]: { ...pred, winner: opt.val } }))}
                                  className={`py-3 rounded-xl text-center transition-all ${
                                    pred.winner === opt.val ? "bg-[var(--gold)] text-[var(--background)] font-black" : "bg-[var(--surface-light)] font-semibold"
                                  }`}>
                                  <div className="text-xl mb-0.5">{opt.flag}</div>
                                  <div className="text-xs">{opt.label}</div>
                                </motion.button>
                              ))}
                            </div>
                          </div>

                          {/* Over/Under */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Total Goals</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--electric)]/10 text-[var(--electric)] font-bold">+2 pts</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { val: "over", label: "Over 2.5", icon: "🔥", color: "var(--emerald)" },
                                { val: "under", label: "Under 2.5", icon: "🧊", color: "var(--electric)" },
                              ].map((opt) => (
                                <motion.button key={opt.val} whileTap={{ scale: 0.97 }}
                                  onClick={() => setPredictions((prev) => ({ ...prev, [match.id]: { ...pred, goals: opt.val } }))}
                                  className={`py-4 rounded-xl text-center transition-all ${
                                    pred.goals === opt.val ? `text-white font-black shadow-lg` : "bg-[var(--surface-light)]"
                                  }`}
                                  style={pred.goals === opt.val ? { backgroundColor: opt.color } : undefined}>
                                  <div className="text-2xl mb-1">{opt.icon}</div>
                                  <div className="font-bold text-sm">{opt.label}</div>
                                </motion.button>
                              ))}
                            </div>
                          </div>

                          {/* First Scorer */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">First Scorer</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--crimson)]/10 text-[var(--crimson)] font-bold">+5 pts</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {matchPlayers.slice(0, 6).map((player) => (
                                <motion.button key={player.id} whileTap={{ scale: 0.97 }}
                                  onClick={() => setPredictions((prev) => ({ ...prev, [match.id]: { ...pred, scorer: player.id } }))}
                                  className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all ${
                                    pred.scorer === player.id ? "bg-[var(--crimson)]/15 ring-2 ring-[var(--crimson)]" : "bg-[var(--surface-light)]"
                                  }`}>
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                                    pred.scorer === player.id ? "bg-[var(--crimson)]/20" : "bg-[var(--surface)]"
                                  }`}>{player.rating}</div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-sm truncate">{player.name}</div>
                                    <div className="text-[10px] opacity-60">{WORLD_CUP_COUNTRIES.find((c) => c.code === player.countryCode)?.flag} {player.country}</div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Submit predictions */}
                  <AnimatePresence>
                    {completedPredictions > 0 && (
                      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                        className="fixed bottom-20 md:bottom-8 left-0 right-0 z-40 px-4">
                        <div className="max-w-5xl mx-auto">
                          <button onClick={handleSubmitPredictions} disabled={submittingPredictions}
                            className="w-full py-4 bg-[var(--gold)] text-[var(--background)] font-black rounded-2xl hover:bg-[var(--gold-dim)] text-lg shadow-xl shadow-[var(--gold)]/20 disabled:opacity-60 flex items-center justify-center gap-3">
                            <span>{submittingPredictions ? "Submitting..." : `Submit ${completedPredictions} Prediction${completedPredictions > 1 ? "s" : ""}`}</span>
                            <span className="text-sm opacity-70">⚡</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}

          {/* ═══ H2H (placeholder — wired in Phase 5) ═══ */}
          {activeTab === "h2h" && (
            <motion.div key="h2h" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center py-12 space-y-4">
              <div className="text-5xl">⚔️</div>
              <h2 className="text-xl font-black">Head-to-Head</h2>
              <p className="text-[var(--muted)]">H2H matchups will be generated once the tournament begins.</p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
