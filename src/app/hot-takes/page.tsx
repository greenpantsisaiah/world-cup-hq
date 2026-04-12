"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";

const DEMO_TAKES = [
  {
    id: "1", author: "Marcus",
    text: "Germany won't score a single goal in the group stage",
    backers: 2, faders: 9, total: 16, status: "resolved_miss" as const,
    locksAt: "Group Stage", potential: "5.5x",
  },
  {
    id: "6", author: "Tom",
    text: "Japan will beat a European team in the group stage",
    backers: 3, faders: 7, total: 16, status: "resolved_hit" as const,
    locksAt: "Group Stage", potential: "3.3x",
  },
  {
    id: "3", author: "Dave",
    text: "USA will top their group",
    backers: 5, faders: 2, total: 16, status: "resolved_hit" as const,
    locksAt: "Group Stage", potential: "1.4x",
  },
  {
    id: "7", author: "Isaiah",
    text: "Argentina will win the whole tournament",
    backers: 8, faders: 3, total: 16, status: "open" as const,
    locksAt: "Final", potential: "1.5x",
  },
  {
    id: "2", author: "Sarah",
    text: "An African team will make the semifinals",
    backers: 6, faders: 5, total: 16, status: "open" as const,
    locksAt: "Quarterfinals", potential: "1.8x",
  },
  {
    id: "4", author: "Lisa",
    text: "France will be eliminated before the quarterfinals",
    backers: 2, faders: 10, total: 16, status: "open" as const,
    locksAt: "Round of 16", potential: "6x",
  },
  {
    id: "5", author: "Jake",
    text: "A goalkeeper will score a goal this tournament",
    backers: 3, faders: 8, total: 16, status: "open" as const,
    locksAt: "Final", potential: "3.7x",
  },
  {
    id: "9", author: "Chris",
    text: "Son Heung-min will be the top scorer of the knockout stage",
    backers: 2, faders: 9, total: 16, status: "open" as const,
    locksAt: "Final", potential: "5.5x",
  },
  {
    id: "8", author: "Phil",
    text: "There will be a red card in a quarterfinal match",
    backers: 6, faders: 4, total: 16, status: "open" as const,
    locksAt: "Quarterfinals", potential: "1.6x",
  },
];

type Filter = "all" | "open" | "resolved" | "mine";

export default function HotTakesPage() {
  const { profile } = useAuth();
  const [newTake, setNewTake] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [myVotes, setMyVotes] = useState<Record<string, "back" | "fade">>({});
  const [justVoted, setJustVoted] = useState<Record<string, boolean>>({});

  const filteredTakes = DEMO_TAKES.filter((take) => {
    if (filter === "mine") return take.author === profile?.name;
    if (filter === "open") return take.status === "open";
    if (filter === "resolved") return take.status.startsWith("resolved");
    return true;
  });

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
            {/* First-timer guidance */}
            <details className="mt-3 group">
              <summary className="flex items-center gap-1.5 text-xs text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors select-none">
                <span>💡</span>
                <span>Tips for great hot takes</span>
              </summary>
              <div className="mt-2 space-y-1.5 p-3 rounded-xl bg-[var(--surface-light)] border border-[var(--surface-border)]">
                <p className="text-xs text-[var(--muted)]">
                  <span className="font-bold text-[var(--foreground)]">Be specific:</span>{" "}
                  &ldquo;France won&apos;t make the QF&rdquo; beats &ldquo;France bad&rdquo;
                </p>
                <p className="text-xs text-[var(--muted)]">
                  <span className="font-bold text-[var(--foreground)]">Be bold:</span>{" "}
                  the more people disagree, the bigger your payout
                </p>
                <p className="text-xs text-[var(--muted)]">
                  <span className="font-bold text-[var(--foreground)]">Think ahead:</span>{" "}
                  takes lock when the relevant stage begins
                </p>
              </div>
            </details>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-[var(--muted)]">{newTake.length}/500</span>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-[var(--muted)]">Cancel</button>
                <button
                  onClick={() => {
                    if (newTake.trim().length >= 5) {
                      setShowForm(false);
                      setNewTake("");
                    }
                  }}
                  disabled={newTake.trim().length < 5}
                  className="px-4 py-2 bg-[var(--gold)] text-[var(--background)] font-bold rounded-lg text-sm disabled:opacity-50"
                >
                  Submit Take 🔥
                </button>
              </div>
            </div>
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

      {/* Takes list */}
      <div className="space-y-4">
        {filteredTakes.map((take, i) => {
          const displayBackers = take.backers + (myVotes[take.id] === "back" ? 1 : 0);
          const displayFaders = take.faders + (myVotes[take.id] === "fade" ? 1 : 0);
          const backerPct = Math.round((displayBackers / (displayBackers + displayFaders)) * 100);
          const faderPct = 100 - backerPct;
          const isResolved = take.status.startsWith("resolved");
          const isHit = take.status === "resolved_hit";
          const myVote = myVotes[take.id];
          const backerPoints = Math.round(10 * (1 / (backerPct / 100 || 0.05)));
          const wasJustVoted = justVoted[take.id];

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
                      {take.author[0]}
                    </div>
                    <span className="font-bold text-sm">{take.author}</span>
                    {take.author === profile?.name && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--electric)]/10 text-[var(--electric)] font-bold">YOU</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[var(--gold)]">{take.potential}</div>
                    <div className="text-[10px] text-[var(--muted)]">PAYOUT</div>
                  </div>
                </div>

                {/* Take text */}
                <p className="text-lg font-bold mb-4">&ldquo;{take.text}&rdquo;</p>

                {/* Sentiment bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-[var(--muted)] mb-1">
                    <span>👍 {displayBackers} ({backerPct}%)</span>
                    <span>👎 {displayFaders} ({faderPct}%)</span>
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
                          ? `If this hits, backers earn +${backerPoints}. If it misses, faders win.`
                          : `If this misses, faders win. If it hits, backers earn +${backerPoints}.`}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[var(--muted)]">
                    {isResolved ? (isHit ? "Resolved: HIT" : "Resolved: MISS") : `Locks: ${take.locksAt}`}
                  </div>
                  {!isResolved && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setMyVotes((v) => ({ ...v, [take.id]: "back" }));
                          setJustVoted((v) => ({ ...v, [take.id]: true }));
                          setTimeout(() => setJustVoted((v) => ({ ...v, [take.id]: false })), 3000);
                        }}
                        className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          myVote === "back"
                            ? "bg-[var(--emerald)] text-white shadow-lg shadow-[var(--emerald)]/20"
                            : "bg-[var(--emerald)]/10 text-[var(--emerald)] border border-[var(--emerald)]/20 hover:bg-[var(--emerald)]/20"
                        }`}
                      >
                        👍 Back
                      </button>
                      <button
                        onClick={() => {
                          setMyVotes((v) => ({ ...v, [take.id]: "fade" }));
                          setJustVoted((v) => ({ ...v, [take.id]: true }));
                          setTimeout(() => setJustVoted((v) => ({ ...v, [take.id]: false })), 3000);
                        }}
                        className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          myVote === "fade"
                            ? "bg-[var(--crimson)] text-white shadow-lg shadow-[var(--crimson)]/20"
                            : "bg-[var(--crimson)]/10 text-[var(--crimson)] border border-[var(--crimson)]/20 hover:bg-[var(--crimson)]/20"
                        }`}
                      >
                        👎 Fade
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
