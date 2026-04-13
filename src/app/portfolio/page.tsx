"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useLeague } from "@/components/league-provider";
import { RadialScore } from "@/components/radial-score";
import { DashboardTile } from "@/components/dashboard-tile";
import { FutCard } from "@/components/player-fut-card";
import { AnimatedNumber } from "@/components/animated-number";
import { MorningWhistleBanner } from "@/components/morning-whistle-banner";
import { AchievementBadges } from "@/components/achievement-badge";
import { getUserPortfolio, getLeaderboard } from "@/lib/supabase-actions";
import { WORLD_CUP_COUNTRIES } from "@/data/countries";
import { PLAYER_POOL } from "@/data/players";
import Link from "next/link";

interface ScoreRow {
  allegiance: number; country_draft: number; player_draft: number;
  predictions: number; daily_picks: number; head_to_head: number;
  hot_takes: number; total: number; h2h_wins: number; h2h_losses: number;
  h2h_draws: number; prediction_streak: number;
}

interface PickRow { pick_type: string; country_code: string | null; player_id: string | null; }

export default function PortfolioPage() {
  const { profile } = useAuth();
  const { leagueId } = useLeague();
  const [scores, setScores] = useState<ScoreRow | null>(null);
  const [picks, setPicks] = useState<PickRow[]>([]);
  const [allegianceCode, setAllegianceCode] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ total: number; profiles: { name: string } | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDayZero, setShowDayZero] = useState(true);

  const loadData = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true);
    try {
      const [portfolio, lb] = await Promise.all([getUserPortfolio(leagueId), getLeaderboard(leagueId)]);
      setScores(portfolio.scores as ScoreRow);
      setPicks(portfolio.picks as PickRow[]);
      setAllegianceCode(portfolio.allegiance?.country_code || null);
      setLeaderboard(lb as { total: number; profiles: { name: string } | null }[]);
    } catch { /* empty state */ }
    setLoading(false);
  }, [leagueId]);

  useEffect(() => { loadData(); }, [loadData]);

  const allegianceCountry = allegianceCode ? WORLD_CUP_COUNTRIES.find((c) => c.code === allegianceCode) : null;
  const myCountries = picks.filter((p) => p.pick_type === "country").map((p) => WORLD_CUP_COUNTRIES.find((c) => c.code === p.country_code)).filter(Boolean);
  const myPlayers = picks.filter((p) => p.pick_type === "player").map((p) => PLAYER_POOL.find((pl) => pl.id === p.player_id)).filter(Boolean);
  const s = scores || { allegiance: 0, country_draft: 0, player_draft: 0, predictions: 0, daily_picks: 0, head_to_head: 0, hot_takes: 0, total: 0, h2h_wins: 0, h2h_losses: 0, h2h_draws: 0, prediction_streak: 0 };
  const total = s.total;
  const hasDrafted = myCountries.length > 0 || myPlayers.length > 0;
  const myRank = leaderboard.findIndex((r) => r.profiles?.name === profile?.name) + 1;

  if (!leagueId) return (
    <div className="text-center py-20 space-y-4">
      <div className="text-6xl">📊</div><h1 className="text-3xl font-black">My Portfolio</h1>
      <p className="text-[var(--muted)]">Join a league to track your scores.</p>
      <Link href="/admin" className="inline-block px-6 py-3 bg-[var(--gold)] text-[var(--background)] font-bold rounded-xl">Join a League →</Link>
    </div>
  );

  if (loading) return <div className="text-center py-20"><div className="text-4xl animate-spin">⚽</div></div>;

  return (
    <div className="space-y-8">
      <MorningWhistleBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black"><span className="text-shimmer">My Portfolio</span></h1>
          <p className="text-[var(--muted)] text-sm mt-1">{profile?.name}&apos;s World Cup dashboard</p>
        </div>
        <div className="text-right">
          <AnimatedNumber value={total} className="text-3xl font-black text-[var(--gold)]" />
          <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Total Points</div>
        </div>
      </div>

      {hasDrafted && total === 0 && (
        <AnimatePresence>
          {showDayZero && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl overflow-hidden border border-[var(--gold)]/20 bg-gradient-to-br from-[var(--gold)]/5 via-[var(--surface)] to-[var(--electric)]/5">
              <div className="p-5 space-y-5">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2"><span>🏟️</span>Your Team is Ready</h2>
                  <p className="text-sm text-[var(--muted)] mt-1 italic">First match kicks off soon — your portfolio is loaded and waiting</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[var(--surface)] p-3 text-center">
                    <div className="text-2xl mb-1">{myCountries[0]?.flag || "🏳️"}</div>
                    <div className="text-lg font-black">{myCountries.length}</div>
                    <div className="text-[10px] text-[var(--muted)] uppercase">Countries</div>
                  </div>
                  <div className="rounded-xl bg-[var(--surface)] p-3 text-center">
                    <div className="text-2xl mb-1">⚽</div>
                    <div className="text-lg font-black">{myPlayers.length}</div>
                    <div className="text-[10px] text-[var(--muted)] uppercase">Players</div>
                  </div>
                  <div className="rounded-xl bg-[var(--surface)] p-3 text-center">
                    <div className="text-2xl mb-1">🎯</div>
                    <div className="text-lg font-black text-[var(--emerald)]">Ready</div>
                    <div className="text-[10px] text-[var(--muted)] uppercase">to Play</div>
                  </div>
                </div>
                <button onClick={() => setShowDayZero(false)} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">Got it, show me my stats →</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <RadialScore total={total} rings={[
          { label: "Players", value: s.player_draft, max: 250, color: "#10b981", icon: "⚽" },
          { label: "Predictions", value: s.predictions, max: 200, color: "#6366f1", icon: "🎯" },
          { label: "Countries", value: s.country_draft, max: 150, color: "#d4a843", icon: "🏳️" },
          { label: "H2H", value: s.head_to_head, max: 100, color: "#f97316", icon: "⚔️" },
          { label: "Allegiance", value: s.allegiance, max: 80, color: "#ef4444", icon: "❤️" },
        ]} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DashboardTile icon="📈" label="Rank" value={myRank || leaderboard.length} prefix="#" sublabel={`of ${leaderboard.length}`} size="large" />
          <DashboardTile icon="🎯" label="Predictions" value={s.predictions} prefix="+" sublabel="points" size="large" />
          <DashboardTile icon="⚔️" label="H2H" value={s.h2h_wins} suffix="W" sublabel={`${s.h2h_wins}W·${s.h2h_draws}D·${s.h2h_losses}L`} size="large" />
        </div>
      </div>

      {allegianceCountry && (
        <div className="rounded-2xl bg-gradient-to-r from-[var(--gold)]/10 via-transparent to-[var(--gold)]/10 p-5">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{allegianceCountry.flag}</span>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">❤️ Allegiance</div>
              <div className="text-2xl font-black">{allegianceCountry.name}</div>
            </div>
            <AnimatedNumber value={s.allegiance} prefix="+" className="text-2xl font-black text-[var(--gold)]" />
          </div>
        </div>
      )}

      {myCountries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Drafted Countries</h2>
            <AnimatedNumber value={s.country_draft} prefix="+" suffix=" pts" className="text-sm font-bold text-[var(--gold)]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {myCountries.map((c) => c && (
              <div key={c.code} className="rounded-2xl bg-[var(--surface)] p-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{c.flag}</span>
                  <div><div className="font-black">{c.name}</div><div className="text-[10px] text-[var(--muted)]">Group {c.group} · #{c.fifaRanking}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myPlayers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Drafted Players</h2>
            <AnimatedNumber value={s.player_draft} prefix="+" suffix=" pts" className="text-sm font-bold text-[var(--gold)]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {myPlayers.map((p) => p && <FutCard key={p.id} player={p} />)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <DashboardTile icon="🎲" label="Daily Picks" value={s.daily_picks} prefix="+" />
        <DashboardTile icon="🔥" label="Hot Takes" value={s.hot_takes} prefix="+" />
        <DashboardTile icon="🔥" label="Streak" value={s.prediction_streak} sublabel="Correct in a row" />
      </div>

      <AchievementBadges />

      {!hasDrafted && !allegianceCountry && (
        <div className="text-center py-12 text-[var(--muted)]">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-black mb-2">No portfolio yet</h2>
          <p className="text-sm">Complete the draft to build your portfolio!</p>
          <Link href="/draft" className="inline-block mt-4 px-6 py-3 bg-[var(--gold)] text-[var(--background)] font-bold rounded-xl">Go to Draft →</Link>
        </div>
      )}
    </div>
  );
}
