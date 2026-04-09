"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/animated-number";
import { Sparkline } from "@/components/sparkline";

const DEMO_LEADERBOARD = [
  { rank: 1, name: "Sarah", score: 923, change: 2, h2h: "5-1-0", streak: 7, allegiance: "🇦🇷", trend: [200, 350, 480, 600, 720, 830, 923] },
  { rank: 2, name: "Marcus", score: 891, change: -1, h2h: "4-1-1", streak: 3, allegiance: "🇧🇷", trend: [250, 400, 520, 650, 750, 860, 891] },
  { rank: 3, name: "Isaiah", score: 847, change: 3, h2h: "4-1-1", streak: 4, allegiance: "🇦🇷", trend: [150, 280, 400, 550, 680, 780, 847] },
  { rank: 4, name: "Lisa", score: 812, change: 0, h2h: "3-2-1", streak: 2, allegiance: "🇫🇷", trend: [220, 380, 500, 620, 700, 770, 812] },
  { rank: 5, name: "Phil", score: 789, change: -2, h2h: "3-3-0", streak: 0, allegiance: "🇪🇸", trend: [300, 450, 550, 680, 750, 800, 789] },
  { rank: 6, name: "Dave", score: 743, change: 1, h2h: "2-3-1", streak: 1, allegiance: "🇩🇪", trend: [180, 300, 420, 520, 600, 680, 743] },
  { rank: 7, name: "Emma", score: 721, change: -1, h2h: "2-4-0", streak: 0, allegiance: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", trend: [200, 340, 450, 560, 630, 700, 721] },
  { rank: 8, name: "Jake", score: 698, change: -3, h2h: "1-4-1", streak: 0, allegiance: "🇺🇸", trend: [280, 420, 510, 600, 660, 710, 698] },
  { rank: 9, name: "Alex", score: 672, change: 0, h2h: "3-2-1", streak: 1, allegiance: "🇫🇷", trend: [150, 280, 380, 480, 560, 630, 672] },
  { rank: 10, name: "Mia", score: 651, change: 2, h2h: "2-3-1", streak: 2, allegiance: "🇧🇷", trend: [100, 200, 320, 430, 520, 600, 651] },
  { rank: 11, name: "Chris", score: 634, change: -1, h2h: "3-3-0", streak: 0, allegiance: "🇵🇹", trend: [190, 310, 410, 500, 580, 620, 634] },
  { rank: 12, name: "Nina", score: 612, change: 1, h2h: "2-3-1", streak: 1, allegiance: "🇦🇷", trend: [120, 230, 340, 440, 530, 580, 612] },
  { rank: 13, name: "Tom", score: 589, change: 3, h2h: "2-4-0", streak: 3, allegiance: "🇯🇵", trend: [80, 150, 250, 350, 420, 510, 589] },
  { rank: 14, name: "Olivia", score: 561, change: -2, h2h: "1-4-1", streak: 0, allegiance: "🇳🇱", trend: [160, 280, 370, 450, 510, 550, 561] },
  { rank: 15, name: "Ryan", score: 534, change: 0, h2h: "2-4-0", streak: 0, allegiance: "🇺🇸", trend: [140, 250, 340, 420, 480, 520, 534] },
  { rank: 16, name: "Zoe", score: 498, change: -1, h2h: "1-5-0", streak: 0, allegiance: "🇰🇷", trend: [100, 180, 260, 340, 400, 460, 498] },
];

const AWARDS = [
  { icon: "🏆", name: "Golden Portfolio", desc: "Most combined country goals", leader: "Sarah", value: 14 },
  { icon: "💥", name: "Glass Cannon", desc: "Most goals scored + conceded", leader: "Marcus", value: 22 },
  { icon: "🧱", name: "The Wall", desc: "Fewest goals conceded", leader: "Lisa", value: 2 },
  { icon: "🔮", name: "Crystal Ball", desc: "Best prediction accuracy", leader: "Isaiah", value: "56%" },
  { icon: "😈", name: "Chaos Agent", desc: "Most contrarian hits", leader: "Tom", value: 5 },
  { icon: "🧊", name: "The Jinx", desc: "Worst prediction streak", leader: "Jake", value: "0-9" },
];

const maxScore = DEMO_LEADERBOARD[0].score;

export default function LeaderboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">
          <span className="text-shimmer">Leaderboard</span>
        </h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Office rankings updated live
        </p>
      </div>

      {/* ── Race Visualization (Top 5) ─────────────── */}
      <div className="card-glow rounded-2xl bg-[var(--surface)] p-6 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          The Race — Top 5
        </div>
        <div className="space-y-3">
          {DEMO_LEADERBOARD.slice(0, 5).map((player, i) => {
            const widthPct = (player.score / maxScore) * 100;
            const colors = [
              "from-yellow-500 to-yellow-600",
              "from-gray-300 to-gray-400",
              "from-orange-600 to-orange-700",
              "from-[var(--electric)] to-indigo-600",
              "from-[var(--emerald)] to-green-600",
            ];
            return (
              <div key={player.name} className="flex items-center gap-3">
                <div className="w-8 text-center text-lg font-black">
                  {["🥇", "🥈", "🥉", "4", "5"][i]}
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-light)] flex items-center justify-center text-sm font-black">
                  {player.allegiance}
                </div>
                <div className="w-16 font-bold text-sm truncate">{player.name}</div>
                <div className="flex-1 h-8 bg-[var(--surface-light)] rounded-full overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${colors[i]} relative`}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                  >
                    {/* Animated leading edge pulse */}
                    <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/20 rounded-full animate-pulse" />
                  </motion.div>
                  {/* Score label inside bar */}
                  <div className="absolute inset-0 flex items-center justify-end pr-3">
                    <AnimatedNumber
                      value={player.score}
                      className="text-xs font-black text-white drop-shadow-md"
                      duration={1 + i * 0.15}
                    />
                  </div>
                </div>
                <div className="w-12">
                  <Sparkline data={player.trend} color={i === 0 ? "#eab308" : "var(--muted)"} width={48} height={20} filled={false} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Full Rankings ──────────────────────────── */}
      <div className="card-glow rounded-2xl bg-[var(--surface)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--surface-border)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Full Standings
          </span>
        </div>
        <div className="divide-y divide-[var(--surface-border)]/50">
          {DEMO_LEADERBOARD.map((player, i) => {
            const isTop3 = i < 3;
            const isMe = player.name === "Isaiah";
            return (
              <motion.div
                key={player.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 px-5 py-3 ${
                  isMe ? "bg-[var(--gold)]/5" : ""
                } ${!isTop3 && !isMe ? "opacity-70" : ""}`}
              >
                {/* Rank */}
                <div className="w-8 text-center font-black">
                  {isTop3 ? ["🥇", "🥈", "🥉"][i] : (
                    <span className="text-[var(--muted)]">{player.rank}</span>
                  )}
                </div>

                {/* Avatar + Name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg">{player.allegiance}</span>
                  <span className={`font-bold text-sm truncate ${isMe ? "text-[var(--gold)]" : ""}`}>
                    {player.name}
                    {isMe && <span className="text-[10px] ml-1 text-[var(--electric)]">(YOU)</span>}
                  </span>
                </div>

                {/* Sparkline */}
                <div className="hidden md:block">
                  <Sparkline
                    data={player.trend}
                    color={player.change > 0 ? "var(--emerald)" : player.change < 0 ? "var(--crimson)" : "var(--muted)"}
                    width={60}
                    height={18}
                    filled={false}
                  />
                </div>

                {/* H2H */}
                <div className="hidden md:block text-xs text-[var(--muted)] w-16 text-center">
                  {player.h2h}
                </div>

                {/* Streak */}
                <div className="hidden md:block w-12 text-center">
                  {player.streak > 0 ? (
                    <span className="text-xs font-bold text-[var(--gold)]">🔥{player.streak}</span>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">—</span>
                  )}
                </div>

                {/* Delta */}
                <div className="w-8 text-center">
                  {player.change > 0 && <span className="text-xs font-bold text-[var(--emerald)]">▲{player.change}</span>}
                  {player.change < 0 && <span className="text-xs font-bold text-[var(--crimson)]">▼{Math.abs(player.change)}</span>}
                  {player.change === 0 && <span className="text-xs text-[var(--muted)]">—</span>}
                </div>

                {/* Score */}
                <div className="w-14 text-right">
                  <AnimatedNumber value={player.score} className="font-black" duration={0.8 + i * 0.05} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Awards Race ────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-lg font-black">🏅 Awards Race</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {AWARDS.map((award, i) => (
            <motion.div
              key={award.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="rounded-2xl bg-[var(--surface)] p-4 flex items-center gap-4 group hover:bg-[var(--surface-light)] transition-colors"
            >
              <div className="text-3xl group-hover:scale-110 transition-transform">{award.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{award.name}</div>
                <div className="text-[10px] text-[var(--muted)] truncate">{award.desc}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black text-[var(--gold)]">{award.leader}</div>
                <div className="text-[10px] text-[var(--muted)]">{award.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Morning Whistle ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl bg-[var(--surface)] overflow-hidden"
      >
        <div className="px-5 py-3 bg-gradient-to-r from-[var(--gold)]/10 to-transparent border-b border-[var(--surface-border)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📯</span>
            <h2 className="text-lg font-black">The Morning Whistle</h2>
          </div>
        </div>
        <div className="p-5 space-y-3 text-sm">
          {[
            { icon: "📈", text: <><strong className="text-[var(--emerald)]">Sarah</strong> rocketed from 4th to 1st — her sleeper pick Mitoma scored a hat trick and she was the only one who picked Japan as Country of the Day.</> },
            { icon: "🙈", text: <>Every team <strong className="text-[var(--crimson)]">Jake</strong> has backed in predictions has lost. He is now 2-for-14. At this point it&apos;s a talent.</> },
            { icon: "🔥", text: <>Remember when <strong>Marcus</strong> said &quot;Germany won&apos;t score a single goal&quot;? Two matches in, Germany has scored 5. That hot take is looking <span className="text-[var(--crimson)]">ice cold</span>.</> },
            { icon: "🤖", text: <><strong>AI Roast of the Day:</strong> Phil banned Mbappé yesterday. Mbappé scored in the 2nd minute. The ban button is not a reverse psychology button, Phil.</> },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-light)]"
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              <p>{item.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
