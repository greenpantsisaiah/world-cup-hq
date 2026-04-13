"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useLeague } from "@/components/league-provider";
import {
  getHotTakes,
  submitHotTake,
  voteHotTake,
  resolveHotTake,
} from "@/lib/supabase-actions";
import { calcHotTakePoints } from "@/lib/scoring";

interface HotTakeRow {
  id: string;
  author_id: string;
  text: string;
  locks_at: string;
  status: string;
  created_at: string;
  profiles: { name: string } | null;
  hot_take_votes: { user_id: string; vote: string }[];
}

type Filter = "all" | "open" | "resolved" | "mine";

export default function HotTakesPage() {
  const { user, profile } = useAuth();
  const { leagueId, isAdmin, members } = useLeague();

  const [takes, setTakes] = useState<HotTakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTake, setNewTake] = useState("");
  const [newLocksAt, setNewLocksAt] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [submitting, setSubmitting] = useState(false);
  const [justVoted, setJustVoted] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const loadTakes = useCallback(async () => {
    if (!leagueId) return;
    try {
      const data = await getHotTakes(leagueId);
      setTakes(data as HotTakeRow[]);
    } catch {
      setError("Failed to load hot takes");
    }
    setLoading(false);
  }, [leagueId]);

  useEffect(() => {
    loadTakes();
  }, [loadTakes]);

  const handleSubmitTake = async () => {
    if (!leagueId || !newTake.trim() || newTake.trim().length < 5) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitHotTake(leagueId, {
        text: newTake.trim(),
        locks_at: newLocksAt || new Date(Date.now() + 14 * 86400000).toISOString(),
      });
      setNewTake("");
      setNewLocksAt("");
      setShowForm(false);
      await loadTakes();
    } catch {
      setError("Failed to submit hot take");
    }
    setSubmitting(false);
  };

  const handleVote = async (takeId: string, vote: "back" | "fade") => {
    setError(null);
    try {
      await voteHotTake({ hot_take_id: takeId, vote });
      setJustVoted((v) => ({ ...v, [takeId]: true }));
      setTimeout(() => setJustVoted((v) => ({ ...v, [takeId]: false })), 3000);
      await loadTakes();
    } catch {
      setError("Failed to vote");
    }
  };

  const handleResolve = async (takeId: string, status: "resolved_hit" | "resolved_miss") => {
    try {
      await resolveHotTake(takeId, status);
      await loadTakes();
    } catch {
      setError("Failed to resolve take");
    }
  };

  const filteredTakes = takes.filter((take) => {
    if (filter === "mine") return take.author_id === user?.id;
    if (filter === "open") return take.status === "open";
    if (filter === "resolved") return take.status.startsWith("resolved");
    return true;
  });

  const totalMembers = members.length || 1;

  if (!leagueId) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-6xl">🔥</div>
        <h1 className="text-3xl font-black">Hot Takes Market</h1>
        <p className="text-[var(--muted)]">Join a league to submit and vote on hot takes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">
            <span className="text-shimmer">Hot Takes Market</span>
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Bold predictions. Contrarian picks pay big.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[var(--gold)] text-[var(--background)] font-bold rounded-lg hover:bg-[var(--gold-dim)] transition-colors text-sm"
        >
          + New Take
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[var(--crimson)]/10 text-[var(--crimson)] text-sm">{error}</div>
      )}

      {/* New take form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card-glow rounded-2xl p-5 bg-[var(--surface)] overflow-hidden"
          >
            <h3 className="font-bold mb-3">Drop Your Hot Take</h3>
            <textarea
              value={newTake}
              onChange={(e) => setNewTake(e.target.value)}
              placeholder={`e.g., "Messi won't score in the knockout rounds"`}
              maxLength={500}
              className="w-full p-3 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm resize-none h-24 focus:outline-none focus:border-[var(--gold)]/50"
            />
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1">
                <label className="text-[10px] text-[var(--muted)] block mb-1">LOCKS AT (optional)</label>
                <input
                  type="datetime-local"
                  value={newLocksAt ? newLocksAt.slice(0, 16) : ""}
                  onChange={(e) => setNewLocksAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
                  className="w-full px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-lg text-xs focus:outline-none"
                />
              </div>
              <span className="text-xs text-[var(--muted)]">{newTake.length}/500</span>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-[var(--muted)]">Cancel</button>
              <button
                onClick={handleSubmitTake}
                disabled={submitting || newTake.trim().length < 5}
                className="px-4 py-2 bg-[var(--gold)] text-[var(--background)] font-bold rounded-lg text-sm disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Take 🔥"}
              </button>
            </div>

            <details className="mt-3">
              <summary className="text-xs text-[var(--muted)] cursor-pointer">💡 Tips for great hot takes</summary>
              <div className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                <p>• Be specific: &quot;France won&apos;t make the QF&quot; beats &quot;France bad&quot;</p>
                <p>• Be bold: the more people disagree, the bigger your payout</p>
                <p>• Think ahead: takes lock when the relevant stage begins</p>
              </div>
            </details>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "open", "resolved", "mine"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f
                ? "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20"
                : "text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent"
            }`}
          >
            {f === "all" ? "All" : f === "open" ? "🟢 Open" : f === "resolved" ? "✅ Resolved" : "My Takes"}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-2xl animate-spin">⚽</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredTakes.length === 0 && (
        <div className="text-center py-12 text-[var(--muted)]">
          <div className="text-4xl mb-3">🔥</div>
          <p className="font-bold">No hot takes yet</p>
          <p className="text-sm mt-1">Be the first to drop a bold prediction!</p>
        </div>
      )}

      {/* Takes list */}
      <div className="space-y-4">
        {filteredTakes.map((take, i) => {
          const backers = take.hot_take_votes.filter((v) => v.vote === "back").length;
          const faders = take.hot_take_votes.filter((v) => v.vote === "fade").length;
          const totalVoters = backers + faders || 1;
          const backerPct = Math.round((backers / totalVoters) * 100);
          const faderPct = 100 - backerPct;
          const isResolved = take.status.startsWith("resolved");
          const isHit = take.status === "resolved_hit";
          const myVote = take.hot_take_votes.find((v) => v.user_id === user?.id)?.vote;
          const wasJustVoted = justVoted[take.id];
          const potentialPoints = calcHotTakePoints(totalMembers, backers || 1, true);
          const authorName = take.profiles?.name || "Unknown";
          const isMyTake = take.author_id === user?.id;

          return (
            <motion.div
              key={take.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl overflow-hidden ${
                isResolved
                  ? isHit
                    ? "ring-2 ring-[var(--emerald)]/30"
                    : "ring-2 ring-[var(--crimson)]/30 opacity-70"
                  : ""
              }`}
            >
              {/* Status banner for resolved takes */}
              {isResolved && (
                <div className={`px-4 py-1.5 text-xs font-bold text-center ${
                  isHit ? "bg-[var(--emerald)]/10 text-[var(--emerald)]" : "bg-[var(--crimson)]/10 text-[var(--crimson)]"
                }`}>
                  {isHit ? "✅ HIT — Backers win!" : "❌ MISS — Faders win!"}
                </div>
              )}

              <div className="bg-[var(--surface)] p-5">
                {/* Author + payout */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-light)] flex items-center justify-center text-sm font-bold">
                      {authorName[0]}
                    </div>
                    <span className="font-bold text-sm">{authorName}</span>
                    {isMyTake && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--electric)]/10 text-[var(--electric)] font-bold">YOU</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[var(--gold)]">+{potentialPoints}</div>
                    <div className="text-[10px] text-[var(--muted)]">IF HIT</div>
                  </div>
                </div>

                {/* Take text */}
                <p className="text-lg font-bold mb-4">&ldquo;{take.text}&rdquo;</p>

                {/* Sentiment bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-[var(--muted)] mb-1">
                    <span>👍 {backers} ({backerPct}%)</span>
                    <span>👎 {faders} ({faderPct}%)</span>
                  </div>
                  <motion.div
                    className="h-2.5 rounded-full overflow-hidden flex bg-[var(--surface-light)]"
                    animate={wasJustVoted ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div
                      className="bg-[var(--emerald)] rounded-l-full"
                      animate={{ width: `${backerPct}%` }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    />
                    <motion.div
                      className="bg-[var(--crimson)] rounded-r-full"
                      animate={{ width: `${faderPct}%` }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    />
                  </motion.div>
                  <AnimatePresence>
                    {myVote && wasJustVoted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 text-[11px] text-[var(--muted)] italic"
                      >
                        {myVote === "back"
                          ? `If this hits, backers earn +${potentialPoints}. If it misses, faders win.`
                          : `If this misses, faders win. If it hits, backers earn +${potentialPoints}.`}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[var(--muted)]">
                    {isResolved
                      ? (isHit ? "Resolved: HIT" : "Resolved: MISS")
                      : `Locks: ${new Date(take.locks_at).toLocaleDateString()}`}
                  </div>
                  <div className="flex gap-2">
                    {!isResolved && (
                      <>
                        <button
                          onClick={() => handleVote(take.id, "back")}
                          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            myVote === "back"
                              ? "bg-[var(--emerald)] text-white shadow-lg shadow-[var(--emerald)]/20"
                              : "bg-[var(--emerald)]/10 text-[var(--emerald)] border border-[var(--emerald)]/20 hover:bg-[var(--emerald)]/20"
                          }`}
                        >
                          👍 Back
                        </button>
                        <button
                          onClick={() => handleVote(take.id, "fade")}
                          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            myVote === "fade"
                              ? "bg-[var(--crimson)] text-white shadow-lg shadow-[var(--crimson)]/20"
                              : "bg-[var(--crimson)]/10 text-[var(--crimson)] border border-[var(--crimson)]/20 hover:bg-[var(--crimson)]/20"
                          }`}
                        >
                          👎 Fade
                        </button>
                      </>
                    )}
                    {/* Admin resolve buttons */}
                    {!isResolved && isAdmin && (
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleResolve(take.id, "resolved_hit")}
                          className="px-2 py-1 rounded-lg bg-[var(--emerald)]/10 text-[var(--emerald)] text-[10px] font-bold hover:bg-[var(--emerald)]/20"
                          title="Resolve as HIT"
                        >
                          ✅
                        </button>
                        <button
                          onClick={() => handleResolve(take.id, "resolved_miss")}
                          className="px-2 py-1 rounded-lg bg-[var(--crimson)]/10 text-[var(--crimson)] text-[10px] font-bold hover:bg-[var(--crimson)]/20"
                          title="Resolve as MISS"
                        >
                          ❌
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
