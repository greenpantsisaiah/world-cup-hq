"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useLeague } from "@/components/league-provider";
import { AnimatedNumber } from "@/components/animated-number";
import { getLeaderboard } from "@/lib/supabase-actions";
import Link from "next/link";

interface LeaderboardRow {
  user_id: string;
  total: number;
  allegiance: number;
  country_draft: number;
  player_draft: number;
  predictions: number;
  daily_picks: number;
  head_to_head: number;
  hot_takes: number;
  h2h_wins: number;
  h2h_losses: number;
  h2h_draws: number;
  prediction_streak: number;
  profiles: { name: string } | null;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { leagueId } = useLeague();
  const [entries, setEntries] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true);
    try {
      const data = await getLeaderboard(leagueId);
      setEntries(data as LeaderboardRow[]);
    } catch { /* empty */ }
    setLoading(false);
  }, [leagueId]);

  useEffect(() => { loadData(); }, [loadData]);

  const maxScore = entries[0]?.total || 1;

  if (!leagueId) return (
    <div className="text-center py-20 space-y-4">
      <div className="text-6xl">🏆</div><h1 className="text-3xl font-black">Leaderboard</h1>
      <p className="text-[var(--muted)]">Join a league to see rankings.</p>
      <Link href="/admin" className="inline-block px-6 py-3 bg-[var(--gold)] text-[var(--background)] font-bold rounded-xl">Join a League →</Link>
    </div>
  );

  if (loading) return <div className="text-center py-20"><div className="text-4xl animate-spin">⚽</div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black"><span className="text-shimmer">Leaderboard</span></h1>
        <p className="text-[var(--muted)] text-sm mt-1">{entries.length} players · Updated live</p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          <div className="text-5xl mb-4">🏆</div>
          <p className="font-bold">No scores yet</p>
          <p className="text-sm mt-1">Scores will appear once matches are played and scored.</p>
        </div>
      ) : (
        <>
          {/* Race Visualization — Top 5 */}
          <div className="card-glow rounded-2xl bg-[var(--surface)] p-6 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">The Race — Top {Math.min(5, entries.length)}</div>
            <div className="space-y-3">
              {entries.slice(0, 5).map((entry, i) => {
                const widthPct = maxScore > 0 ? (entry.total / maxScore) * 100 : 0;
                const isMe = entry.user_id === user?.id;
                const colors = ["from-yellow-500 to-yellow-600", "from-gray-300 to-gray-400", "from-orange-600 to-orange-700", "from-[var(--electric)] to-indigo-600", "from-[var(--emerald)] to-green-600"];
                return (
                  <div key={entry.user_id} className="flex items-center gap-3">
                    <div className="w-8 text-center text-lg font-black">{["🥇", "🥈", "🥉", "4", "5"][i]}</div>
                    <div className={`w-20 font-bold text-sm truncate ${isMe ? "text-[var(--gold)]" : ""}`}>
                      {entry.profiles?.name || "?"}{isMe ? " (You)" : ""}
                    </div>
                    <div className="flex-1 h-8 bg-[var(--surface-light)] rounded-full overflow-hidden relative">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${colors[i] || colors[4]}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-3">
                        <AnimatedNumber value={entry.total} className="text-xs font-black text-white drop-shadow-md" duration={1} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Standings */}
          <div className="card-glow rounded-2xl bg-[var(--surface)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--surface-border)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Full Standings</span>
            </div>
            <div className="divide-y divide-[var(--surface-border)]/50">
              {entries.map((entry, i) => {
                const isMe = entry.user_id === user?.id;
                const isTop3 = i < 3;
                return (
                  <motion.div key={entry.user_id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-5 py-3 ${isMe ? "bg-[var(--gold)]/5" : ""} ${!isTop3 && !isMe ? "opacity-70" : ""}`}>
                    <div className="w-8 text-center font-black">
                      {isTop3 ? ["🥇", "🥈", "🥉"][i] : <span className="text-[var(--muted)]">{i + 1}</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`font-bold text-sm truncate ${isMe ? "text-[var(--gold)]" : ""}`}>
                        {entry.profiles?.name || "?"}{isMe ? <span className="text-[10px] ml-1 text-[var(--electric)]">(YOU)</span> : ""}
                      </span>
                    </div>
                    <div className="hidden md:block text-xs text-[var(--muted)] w-16 text-center">
                      {entry.h2h_wins}W-{entry.h2h_losses}L-{entry.h2h_draws}D
                    </div>
                    <div className="hidden md:block w-12 text-center">
                      {entry.prediction_streak > 0 ? <span className="text-xs font-bold text-[var(--gold)]">🔥{entry.prediction_streak}</span> : <span className="text-xs text-[var(--muted)]">—</span>}
                    </div>
                    <div className="w-14 text-right">
                      <AnimatedNumber value={entry.total} className="font-black" duration={0.8} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
