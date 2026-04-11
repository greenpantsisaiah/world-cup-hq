"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AnimatedNumber } from "@/components/animated-number";
import { Sparkline } from "@/components/sparkline";

const FEATURES = [
  {
    icon: "📋",
    title: "Snake Draft",
    description: "Draft countries and players in a live snake draft. Your allegiance pick is your heart team. AI advisor whispers suggestions.",
    visual: "draft",
  },
  {
    icon: "🎯",
    title: "Daily Predictions",
    description: "30-second speed rounds. Pick winners, over/unders, and first scorers. Ban and boost players for extra stakes.",
    visual: "predictions",
  },
  {
    icon: "⚔️",
    title: "Head-to-Head",
    description: "Paired against a rival each day. Field 3 of your players. Their real match performance decides who wins.",
    visual: "h2h",
  },
  {
    icon: "🔥",
    title: "Hot Takes Market",
    description: "Submit bold predictions. Everyone backs or fades. Contrarian picks that hit pay 5x+. The bolder, the better.",
    visual: "hottakes",
  },
  {
    icon: "📊",
    title: "Live Portfolio",
    description: "Track your score across 6 streams. Animated charts, radial breakdowns, and sparklines that update with every goal.",
    visual: "portfolio",
  },
  {
    icon: "🤖",
    title: "AI Morning Whistle",
    description: "Daily AI-generated digest with leaderboard drama, prediction roasts, hot take tracking, and personalized commentary.",
    visual: "ai",
  },
];

const STATS = [
  { label: "Scoring Streams", value: 6 },
  { label: "Daily Actions", value: 60, suffix: "s" },
  { label: "Countries", value: 48 },
  { label: "Players", value: 65, suffix: "+" },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Create a League", description: "Set up in 30 seconds. Pick your scoring preset. Share the invite code with your office.", icon: "🏟️" },
  { step: 2, title: "Draft Night", description: "Pick your allegiance, draft countries, draft players. Snake draft keeps it fair. AI advisor helps newcomers.", icon: "📋" },
  { step: 3, title: "Play Daily", description: "60 seconds a day: pick your Country & Player of the Day, make predictions, set your H2H lineup.", icon: "⚡" },
  { step: 4, title: "Win Glory", description: "Leaderboard updates with every goal. Awards, roasts, and bragging rights for the whole tournament.", icon: "🏆" },
];

function HeroCTA({ user, profile }: { user: unknown; profile: { name: string } | null }) {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [code, setCode] = useState("");
  const router = useRouter();

  if (user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3 pt-4"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/portfolio"
            className="px-8 py-4 bg-[var(--gold)] text-[var(--background)] font-black rounded-2xl hover:bg-[var(--gold-dim)] transition-colors text-lg shadow-xl shadow-[var(--gold)]/30"
          >
            Go to Dashboard →
          </Link>
        </div>
        <div className="text-sm text-[var(--muted)] text-center">
          Playing as <strong className="text-[var(--foreground)]">{profile?.name}</strong>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-4 pt-4 max-w-lg mx-auto"
    >
      {/* Primary actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/admin"
          className="w-full sm:w-auto px-8 py-4 bg-[var(--gold)] text-[var(--background)] font-black rounded-2xl hover:bg-[var(--gold-dim)] transition-colors text-lg shadow-xl shadow-[var(--gold)]/30 text-center"
        >
          Create a League
        </Link>
        <button
          onClick={() => setShowJoinInput(!showJoinInput)}
          className="w-full sm:w-auto px-8 py-4 bg-[var(--surface)] text-[var(--foreground)] font-bold rounded-2xl hover:bg-[var(--surface-light)] transition-colors text-lg border border-[var(--surface-border)] text-center"
        >
          Join with Code
        </button>
      </div>

      {/* Invite code input — expands when clicked */}
      <AnimatePresence>
        {showJoinInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Enter invite code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl text-sm font-mono tracking-widest text-center focus:outline-none focus:border-[var(--gold)]/50"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.trim()) {
                    router.push(`/admin?code=${code.trim()}`);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (code.trim()) router.push(`/admin?code=${code.trim()}`);
                }}
                disabled={!code.trim()}
                className={`px-6 py-3 font-bold rounded-xl transition-colors ${
                  code.trim()
                    ? "bg-[var(--gold)] text-[var(--background)] hover:bg-[var(--gold-dim)]"
                    : "bg-[var(--surface-light)] text-[var(--muted)] opacity-40"
                }`}
              >
                Join
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] text-center mt-2">
              You&apos;ll sign in first, then automatically join the league
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Try simulation link */}
      <div className="text-center">
        <Link href="/try" className="text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
          or try a simulation first →
        </Link>
      </div>
    </motion.div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-20 pb-12">
      {/* ═══════════════════════════════════════════════ */}
      {/* HERO                                           */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="text-center pt-8 md:pt-16 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-7xl md:text-9xl"
        >
          ⚽
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
            <span className="text-shimmer">World Cup HQ</span>
          </h1>
          <p className="text-xl md:text-2xl text-[var(--muted)] mt-4 max-w-2xl mx-auto leading-relaxed">
            The ultimate office World Cup game. Draft teams. Make predictions.
            Talk trash. Beat your coworkers.
          </p>
        </motion.div>

        <HeroCTA user={user} profile={profile} />
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* STATS BAR                                      */}
      {/* ═══════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-[var(--surface)] p-5 text-center">
            <AnimatedNumber
              value={stat.value}
              suffix={stat.suffix || ""}
              className="text-3xl md:text-4xl font-black text-[var(--gold)]"
            />
            <div className="text-xs text-[var(--muted)] mt-1 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </motion.section>

      {/* ═══════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                   */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-black">How It Works</h2>
          <p className="text-[var(--muted)] mt-2">From setup to glory in 4 steps</p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {HOW_IT_WORKS.map((step) => (
            <motion.div
              key={step.step}
              variants={item}
              className="relative rounded-2xl bg-[var(--surface)] p-6 text-center group hover:bg-[var(--surface-light)] transition-colors"
            >
              {/* Step number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[var(--gold)] text-[var(--background)] text-xs font-black flex items-center justify-center">
                {step.step}
              </div>
              <div className="text-4xl mb-4 mt-2 group-hover:scale-110 transition-transform">{step.icon}</div>
              <h3 className="font-black mb-2">{step.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* FEATURES                                       */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-black">Everything You Need</h2>
          <p className="text-[var(--muted)] mt-2">Six ways to earn points. One way to win: be the best.</p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group rounded-2xl bg-[var(--surface)] p-6 hover:bg-[var(--surface-light)] transition-all hover:shadow-xl hover:shadow-[var(--gold)]/5"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-lg font-black mb-2 group-hover:text-[var(--gold)] transition-colors">{feature.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* LIVE PREVIEW — Simulated Dashboard             */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-black">See It In Action</h2>
          <p className="text-[var(--muted)] mt-2">Your portfolio dashboard during the tournament</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-[var(--surface)] p-6 md:p-8 space-y-6 ring-1 ring-[var(--surface-border)]"
        >
          {/* Mock header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[var(--muted)] uppercase tracking-wider">Your Score</div>
              <div className="text-4xl font-black text-[var(--gold)] flex items-center gap-3">
                <AnimatedNumber value={847} />
                <Sparkline data={[150, 280, 400, 550, 680, 780, 847]} color="var(--gold)" width={80} height={28} />
              </div>
              <div className="text-xs text-[var(--emerald)] font-bold mt-1">▲ Rank #3 of 16</div>
            </div>
            <div className="hidden md:flex gap-3">
              {["🇦🇷", "🇸🇦", "🇶🇦"].map((flag, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                  className="text-4xl"
                >
                  {flag}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mock score bars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Players", value: 134, max: 250, color: "#10b981" },
              { label: "Predictions", value: 96, max: 200, color: "#6366f1" },
              { label: "Countries", value: 87, max: 150, color: "#d4a843" },
              { label: "H2H", value: 55, max: 100, color: "#f97316" },
            ].map((s) => (
              <div key={s.label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">{s.label}</span>
                  <span className="font-bold">+{s.value}</span>
                </div>
                <div className="h-2 bg-[var(--surface-light)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: s.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(s.value / s.max) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mock player cards */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { name: "Mbappé", rating: 93, flag: "🇫🇷", pts: 58 },
              { name: "Mitoma", rating: 82, flag: "🇯🇵", pts: 31 },
              { name: "Rúben Dias", rating: 87, flag: "🇵🇹", pts: 19 },
              { name: "Hakimi", rating: 86, flag: "🇲🇦", pts: 14 },
              { name: "Alaba", rating: 82, flag: "🇦🇹", pts: 12 },
            ].map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className={`rounded-xl p-3 text-center ${
                  p.rating >= 90
                    ? "bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border border-yellow-500/30"
                    : "bg-[var(--surface-light)]"
                }`}
              >
                <div className="text-lg">{p.flag}</div>
                <div className={`text-xl font-black ${p.rating >= 90 ? "text-[var(--gold)]" : ""}`}>{p.rating}</div>
                <div className="text-[10px] font-bold truncate">{p.name}</div>
                <div className="text-[10px] text-[var(--gold)]">+{p.pts}</div>
              </motion.div>
            ))}
          </div>

          {/* Mock AI digest */}
          <div className="rounded-xl bg-[var(--surface-light)] p-4 flex items-start gap-3">
            <span className="text-xl">🤖</span>
            <div className="text-sm">
              <span className="font-bold text-[var(--gold)]">Morning Whistle:</span>{" "}
              <span className="text-[var(--muted)]">
                Sarah rocketed to #1 after Mitoma&apos;s hat trick. Jake is now 2-for-14 on predictions.
                Phil banned Mbappé yesterday — Mbappé scored in minute 2. The ban button is not reverse psychology, Phil.
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* SOCIAL PROOF / USE CASES                       */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-black">Built For Any Group</h2>
          <p className="text-[var(--muted)] mt-2">From 4 friends to 50-person companies</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "🏢",
              title: "Office League",
              desc: "16 coworkers, some remote. Standard mode. Slack channel for trash talk. The intern drafted Qatar.",
              preset: "Standard · 16 players",
            },
            {
              icon: "🍻",
              title: "Friends Group",
              desc: "8 friends, half don't watch soccer. Casual mode with simple predictions. Everyone picks a country and vibes.",
              preset: "Casual · 8 players",
            },
            {
              icon: "🏟️",
              title: "Company-Wide",
              desc: "40 people across 3 offices. Salary cap mode so everyone builds independently. Async drafts across time zones.",
              preset: "Competitive · 40 players",
            },
          ].map((useCase, i) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-[var(--surface)] p-6 space-y-3"
            >
              <div className="text-4xl">{useCase.icon}</div>
              <h3 className="font-black text-lg">{useCase.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{useCase.desc}</p>
              <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] inline-block">
                {useCase.preset}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* HISTORICAL WORLD CUPS TEASE                    */}
      {/* ═══════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl bg-gradient-to-r from-[var(--electric)]/10 via-transparent to-[var(--electric)]/10 p-8 md:p-12 text-center space-y-4 border border-[var(--electric)]/20"
      >
        <div className="text-4xl">🕰️</div>
        <h2 className="text-2xl md:text-3xl font-black">Play Any World Cup. Ever.</h2>
        <p className="text-[var(--muted)] max-w-lg mx-auto">
          Coming soon: play historical World Cups with real results. Draft real teams from 1930 to 2022.
          See who would have won your league if you&apos;d played during Pelé&apos;s era, Zidane&apos;s headbutt, or Messi&apos;s 2022 triumph.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          {["🇧🇷 1970", "🇦🇷 1986", "🇫🇷 1998", "🇪🇸 2010", "🇩🇪 2014", "🇦🇷 2022"].map((wc) => (
            <span key={wc} className="px-3 py-1.5 rounded-full bg-[var(--surface)] text-xs font-bold">
              {wc}
            </span>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════ */}
      {/* FINAL CTA                                      */}
      {/* ═══════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center space-y-6 py-8"
      >
        <h2 className="text-3xl md:text-4xl font-black">
          Ready to Start?
        </h2>
        <p className="text-[var(--muted)] text-lg max-w-md mx-auto">
          Create your league in 30 seconds. Share the invite code. Draft night is whenever you want.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/admin"
            className="px-10 py-4 bg-[var(--gold)] text-[var(--background)] font-black rounded-2xl hover:bg-[var(--gold-dim)] transition-colors text-xl shadow-xl shadow-[var(--gold)]/30"
          >
            Create Your League ⚽
          </Link>
          <Link
            href="/try"
            className="px-8 py-4 text-[var(--muted)] hover:text-[var(--foreground)] font-semibold transition-colors"
          >
            or try a simulation first →
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
