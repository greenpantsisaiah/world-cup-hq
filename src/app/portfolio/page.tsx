"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { RadialScore } from "@/components/radial-score";
import { DashboardTile } from "@/components/dashboard-tile";
import { FutCard } from "@/components/player-fut-card";
import { Sparkline } from "@/components/sparkline";
import { MorningWhistleBanner } from "@/components/morning-whistle-banner";
import { AnimatedNumber } from "@/components/animated-number";
import { AchievementBadges } from "@/components/achievement-badge";
import { WORLD_CUP_COUNTRIES } from "@/data/countries";
import { PLAYER_POOL } from "@/data/players";

// Simulation data for Isaiah
const MY_ALLEGIANCE = "AR";
const MY_COUNTRIES = ["AR", "SA", "QA"];
const MY_PLAYERS = ["mbappe", "r-dias", "mitoma", "alaba", "hakimi"];

const SCORES = {
  allegiance: 42,
  countries: 87,
  players: 134,
  predictions: 96,
  dailyPicks: 38,
  h2h: 55,
  hotTakes: 15,
};

const PLAYER_STATS: Record<string, { goals: number; assists: number; motm: number; pts: number; trend: number[] }> = {
  mbappe: { goals: 4, assists: 1, motm: 2, pts: 58, trend: [0, 8, 8, 21, 33, 45, 58] },
  "r-dias": { goals: 0, assists: 0, motm: 1, pts: 19, trend: [0, 4, 7, 10, 14, 16, 19] },
  mitoma: { goals: 2, assists: 2, motm: 1, pts: 31, trend: [0, 0, 5, 12, 18, 25, 31] },
  alaba: { goals: 0, assists: 1, motm: 0, pts: 12, trend: [0, 2, 4, 6, 8, 10, 12] },
  hakimi: { goals: 1, assists: 2, motm: 0, pts: 14, trend: [0, 3, 3, 8, 11, 11, 14] },
};

const COUNTRY_STATS: Record<string, { scored: number; conceded: number; w: number; d: number; l: number; pts: number; trend: number[] }> = {
  AR: { scored: 5, conceded: 2, w: 2, d: 1, l: 0, pts: 42, trend: [0, 12, 20, 28, 35, 42] },
  SA: { scored: 1, conceded: 4, w: 0, d: 1, l: 2, pts: 8, trend: [0, -2, 1, 3, 5, 8] },
  QA: { scored: 0, conceded: 5, w: 0, d: 0, l: 2, pts: -7, trend: [0, -3, -3, -5, -7, -7] },
};

const SCORE_HISTORY = [0, 32, 78, 145, 210, 298, 355, 402, 430, 452, 467];
const RANK_HISTORY = [8, 6, 5, 3, 4, 3, 3, 2, 3, 3, 3];

const DAY_ZERO_CHECKLIST = [
  { id: "draft", label: "Draft complete", done: true },
  { id: "allegiance", label: "Allegiance set", done: true },
  { id: "bigboard", label: "Rank your Big Board", done: false, href: "/draft" },
  { id: "hottake", label: "Submit a hot take", done: false, href: "/hot-takes" },
  { id: "simulation", label: "Try a simulation", done: false, href: "/daily" },
] as const;

const DAY_ZERO_COMPLETED = DAY_ZERO_CHECKLIST.filter((item) => item.done).length;
const DAY_ZERO_TOTAL = DAY_ZERO_CHECKLIST.length;

export default function PortfolioPage() {
  const { profile } = useAuth();
  const [showDayZero, setShowDayZero] = useState(true);

  const total = Object.values(SCORES).reduce((a, b) => a + b, 0);
  const myCountries = MY_COUNTRIES.map((code) => WORLD_CUP_COUNTRIES.find((c) => c.code === code)).filter(Boolean);
  const myPlayers = MY_PLAYERS.map((id) => PLAYER_POOL.find((p) => p.id === id)).filter(Boolean);
  const allegianceCountry = WORLD_CUP_COUNTRIES.find((c) => c.code === MY_ALLEGIANCE);

  return (
    <div className="space-y-8">
      <MorningWhistleBanner />

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">
            <span className="text-shimmer">My Portfolio</span>
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            {profile?.name || "Guest"}&apos;s World Cup dashboard
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <Sparkline data={SCORE_HISTORY} color="var(--gold)" width={80} height={28} />
            <AnimatedNumber value={total} className="text-3xl font-black text-[var(--gold)]" />
          </div>
          <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Total Points</div>
        </div>
      </div>

      {/* ── Day Zero — Anticipation State ────────────── */}
      <AnimatePresence>
        {showDayZero && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl overflow-hidden border border-[var(--gold)]/20 bg-gradient-to-br from-[var(--gold)]/5 via-[var(--surface)] to-[var(--electric)]/5"
          >
            <div className="p-5 space-y-5">
              {/* Title */}
              <div>
                <h2 className="text-xl font-black flex items-center gap-2">
                  <span>🏟️</span>
                  <span>Your Team is Ready</span>
                </h2>
                <p className="text-sm text-[var(--muted)] mt-1 italic">
                  First match kicks off soon — your portfolio is loaded and waiting
                </p>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[var(--surface)] p-3 text-center">
                  <div className="text-2xl mb-1">
                    {myCountries[0] && "flag" in myCountries[0] ? myCountries[0].flag : "🏳️"}
                  </div>
                  <div className="text-lg font-black">{MY_COUNTRIES.length}</div>
                  <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Countries</div>
                </div>
                <div className="rounded-xl bg-[var(--surface)] p-3 text-center">
                  <div className="text-2xl mb-1">⚽</div>
                  <div className="text-lg font-black">{MY_PLAYERS.length}</div>
                  <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Players</div>
                </div>
                <div className="rounded-xl bg-[var(--surface)] p-3 text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-lg font-black text-[var(--emerald)]">Ready</div>
                  <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">to Play</div>
                </div>
              </div>

              {/* Pre-match checklist */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Pre-match checklist
                </div>
                {DAY_ZERO_CHECKLIST.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 text-sm">
                    {item.done ? (
                      <span className="text-[var(--emerald)] font-bold">✅</span>
                    ) : (
                      <span className="text-[var(--muted)]">☐</span>
                    )}
                    {item.done ? (
                      <span className="text-[var(--foreground)]">{item.label}</span>
                    ) : (
                      <a
                        href={"href" in item ? item.href : "#"}
                        className="text-[var(--gold)] hover:underline font-semibold"
                      >
                        {item.label} →
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Badge teaser + progress */}
              <div className="flex items-center gap-3 rounded-xl bg-[var(--gold)]/5 border border-[var(--gold)]/15 p-3">
                <div className="text-2xl">🏅</div>
                <div className="flex-1">
                  <p className="text-xs text-[var(--muted)]">
                    Complete all {DAY_ZERO_TOTAL} to earn the <span className="font-bold text-[var(--gold)]">Prepared</span> badge
                  </p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-[var(--surface-light)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--gold)] transition-all"
                      style={{ width: `${(DAY_ZERO_COMPLETED / DAY_ZERO_TOTAL) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-[var(--gold)]">
                  {DAY_ZERO_COMPLETED}/{DAY_ZERO_TOTAL}
                </span>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => setShowDayZero(false)}
                className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Got it, show me my stats →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Row: Radial + Key Tiles ────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Radial Score */}
        <RadialScore
          total={total}
          rings={[
            { label: "Players", value: SCORES.players, max: 250, color: "#10b981", icon: "⚽" },
            { label: "Predictions", value: SCORES.predictions, max: 200, color: "#6366f1", icon: "🎯" },
            { label: "Countries", value: SCORES.countries, max: 150, color: "#d4a843", icon: "🏳️" },
            { label: "H2H", value: SCORES.h2h, max: 100, color: "#f97316", icon: "⚔️" },
            { label: "Allegiance", value: SCORES.allegiance, max: 80, color: "#ef4444", icon: "❤️" },
          ]}
        />

        {/* Dashboard tiles — 3 big ones with comparison dots */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DashboardTile
            icon="📈"
            label="Rank"
            value={3}
            prefix="#"
            sublabel="Up from #8 on Day 1"
            trend={RANK_HISTORY.map((r) => 17 - r)}
            trendColor="var(--emerald)"
            delta={2}
            size="large"
            comparison={[
              { label: "Sarah (#1)", value: 923 },
              { label: "Marcus (#2)", value: 891 },
              { label: "You (#3)", value: 847, isYou: true },
              { label: "Lisa (#4)", value: 812 },
              { label: "Phil (#5)", value: 789 },
              { label: "Dave (#6)", value: 743 },
              { label: "Emma (#7)", value: 721 },
              { label: "Jake (#8)", value: 698 },
              { label: "Alex (#9)", value: 672 },
              { label: "Mia (#10)", value: 651 },
              { label: "Chris (#11)", value: 634 },
              { label: "Nina (#12)", value: 612 },
              { label: "Tom (#13)", value: 589 },
              { label: "Olivia (#14)", value: 561 },
              { label: "Ryan (#15)", value: 534 },
              { label: "Zoe (#16)", value: 498 },
            ]}
          />
          <DashboardTile
            icon="🎯"
            label="Predictions"
            value={56}
            suffix="%"
            sublabel="23 of 41 correct"
            trend={[40, 45, 50, 48, 52, 55, 56]}
            trendColor="var(--electric)"
            delta={4}
            size="large"
            comparison={[
              { label: "Sarah (best)", value: 68 },
              { label: "Tom", value: 63 },
              { label: "You", value: 56, isYou: true },
              { label: "Marcus", value: 54 },
              { label: "Lisa", value: 51 },
              { label: "Dave", value: 49 },
              { label: "Phil", value: 46 },
              { label: "Emma", value: 44 },
              { label: "Jake (worst)", value: 29 },
            ]}
          />
          <DashboardTile
            icon="⚔️"
            label="H2H"
            value={4}
            suffix="W"
            sublabel="4W · 1D · 1L"
            trend={[0, 1, 1, 2, 3, 3, 4]}
            trendColor="var(--emerald)"
            comparison={[
              { label: "Phil (5W)", value: 5 },
              { label: "Sarah (5W)", value: 5 },
              { label: "You (4W)", value: 4, isYou: true },
              { label: "Marcus (4W)", value: 4 },
              { label: "Chris (3W)", value: 3 },
              { label: "Alex (3W)", value: 3 },
              { label: "Jake (1W)", value: 1 },
              { label: "Zoe (1W)", value: 1 },
            ]}
            size="large"
          />
        </div>
      </div>

      {/* Rank threat — loss aversion */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 rounded-xl bg-[var(--crimson)]/5 border border-[var(--crimson)]/15 p-3"
      >
        <span className="text-lg">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[var(--crimson)]">Lisa is 35 pts behind you and gaining fast</p>
          <p className="text-[10px] text-[var(--muted)]">She&apos;s had 3 correct predictions in a row. Submit your daily picks to stay ahead.</p>
        </div>
        <a href="/daily" className="shrink-0 px-3 py-1.5 bg-[var(--crimson)]/10 text-[var(--crimson)] text-xs font-bold rounded-lg hover:bg-[var(--crimson)]/20 transition-colors">
          Play Now →
        </a>
      </motion.div>

      {/* ── Allegiance Banner ──────────────────────── */}
      {allegianceCountry && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
        >
          <div className="relative bg-gradient-to-r from-[var(--gold)]/10 via-transparent to-[var(--gold)]/10 p-5">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 text-[120px] leading-none pointer-events-none">
              {allegianceCountry.flag}
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <span className="text-5xl">{allegianceCountry.flag}</span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">❤️ Allegiance</div>
                <div className="text-2xl font-black">{allegianceCountry.name}</div>
                <div className="text-sm text-[var(--muted)]">
                  Group {allegianceCountry.group} · FIFA #{allegianceCountry.fifaRanking} · 50% earnings rate
                </div>
              </div>
              <div className="text-right">
                <AnimatedNumber value={SCORES.allegiance} prefix="+" className="text-2xl font-black text-[var(--gold)]" />
                <div className="text-[10px] text-[var(--muted)]">PTS</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Countries ──────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Drafted Countries</h2>
          <AnimatedNumber value={SCORES.countries} prefix="+" suffix=" pts" className="text-sm font-bold text-[var(--gold)]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {myCountries.map((country) => {
            if (!country) return null;
            const stats = COUNTRY_STATS[country.code];
            if (!stats) return null;
            return (
              <motion.div
                key={country.code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl bg-[var(--surface)] p-4 overflow-hidden group"
              >
                {/* Background sparkline */}
                <div className="absolute bottom-0 right-0 opacity-30">
                  <Sparkline
                    data={stats.trend}
                    color={stats.pts >= 0 ? "var(--emerald)" : "var(--crimson)"}
                    width={120}
                    height={50}
                  />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{country.flag}</span>
                    <div>
                      <div className="font-black">{country.name}</div>
                      <div className="text-[10px] text-[var(--muted)]">
                        Group {country.group} · FIFA #{country.fifaRanking}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs">
                      <span className="text-[var(--emerald)] font-bold">{stats.w}W</span>
                      <span className="text-[var(--muted)]">{stats.d}D</span>
                      <span className="text-[var(--crimson)] font-bold">{stats.l}L</span>
                      <span className="text-[var(--muted)]">·</span>
                      <span>⚽{stats.scored}</span>
                      <span>🛡️{stats.conceded}</span>
                    </div>
                    <span className={`text-lg font-black ${stats.pts >= 0 ? "text-[var(--gold)]" : "text-[var(--crimson)]"}`}>
                      {stats.pts >= 0 ? "+" : ""}{stats.pts}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Players — FUT Cards ────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Drafted Players</h2>
          <AnimatedNumber value={SCORES.players} prefix="+" suffix=" pts" className="text-sm font-bold text-[var(--gold)]" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {myPlayers.map((player) => {
            if (!player) return null;
            const stats = PLAYER_STATS[player.id];
            return (
              <FutCard
                key={player.id}
                player={player}
                points={stats?.pts}
                goals={stats?.goals}
                assists={stats?.assists}
              />
            );
          })}
        </div>
      </div>

      {/* ── Bottom tiles: Predictions + Daily + Hot Takes ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <DashboardTile
          icon="🎲"
          label="Daily Picks"
          value={SCORES.dailyPicks}
          prefix="+"
          sublabel="8 contrarian hits"
          trend={[0, 4, 8, 12, 18, 28, 32, 38]}
          trendColor="#a855f7"
        />
        <DashboardTile
          icon="🔥"
          label="Hot Takes"
          value={SCORES.hotTakes}
          prefix="+"
          sublabel="1 hit, 2 open"
          trend={[0, 0, 0, 5, 5, 10, 15]}
          trendColor="var(--crimson)"
        />
        <DashboardTile
          icon="🔥"
          label="Streak"
          value={4}
          sublabel="Correct predictions in a row"
          trend={[0, 1, 0, 1, 2, 3, 4]}
          trendColor="var(--gold)"
        />
      </div>

      <AchievementBadges />
    </div>
  );
}
