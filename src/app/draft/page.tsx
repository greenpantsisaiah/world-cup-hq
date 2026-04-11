"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { CountryCard } from "@/components/country-card";
import { FutCard } from "@/components/player-fut-card";
import { AnimatedNumber } from "@/components/animated-number";
import { Sparkline } from "@/components/sparkline";
import { WORLD_CUP_COUNTRIES } from "@/data/countries";
import { PLAYER_POOL } from "@/data/players";

// ─── Demo Config ─────────────────────────────────────────────
const DRAFT_DATE = new Date("2026-06-08T19:00:00");
const DRAFT_POSITION_REVEAL = new Date(DRAFT_DATE.getTime() - 3 * 86400000);
const LEAGUE_STATUS: "pre_draft" | "draft_live" | "complete" = "complete";

// Isaiah's portfolio (post-draft)
const MY_COUNTRIES = ["AR", "SA", "QA"];
const MY_PLAYERS = ["mbappe", "r-dias", "mitoma", "alaba", "hakimi"];
const MY_ALLEGIANCE = "AR";
const MY_DRAFT_POSITION = 1;

// All participants
const PARTICIPANTS = [
  "Isaiah", "Sarah", "Marcus", "Lisa", "Phil", "Dave", "Emma", "Jake",
  "Alex", "Mia", "Chris", "Nina", "Tom", "Olivia", "Ryan", "Zoe",
];

// Draft board
const DRAFT_BOARD = [
  { round: 1, picks: [
    { user: "Isaiah", pick: "AR" }, { user: "Sarah", pick: "FR" }, { user: "Marcus", pick: "BR" },
    { user: "Lisa", pick: "ES" }, { user: "Phil", pick: "GB-ENG" }, { user: "Dave", pick: "DE" },
    { user: "Emma", pick: "PT" }, { user: "Jake", pick: "NL" }, { user: "Alex", pick: "BE" },
    { user: "Mia", pick: "IT" }, { user: "Chris", pick: "HR" }, { user: "Nina", pick: "UY" },
    { user: "Tom", pick: "US" }, { user: "Olivia", pick: "CO" }, { user: "Ryan", pick: "JP" },
    { user: "Zoe", pick: "DK" },
  ]},
  { round: 2, picks: [
    { user: "Zoe", pick: "MA" }, { user: "Ryan", pick: "MX" }, { user: "Olivia", pick: "KR" },
    { user: "Tom", pick: "SN" }, { user: "Nina", pick: "AU" }, { user: "Chris", pick: "IR" },
    { user: "Mia", pick: "EG" }, { user: "Alex", pick: "RS" }, { user: "Jake", pick: "EC" },
    { user: "Emma", pick: "CA" }, { user: "Dave", pick: "AT" }, { user: "Phil", pick: "NG" },
    { user: "Lisa", pick: "CL" }, { user: "Marcus", pick: "PE" }, { user: "Sarah", pick: "CR" },
    { user: "Isaiah", pick: "SA" },
  ]},
];

// Draft grades
const DRAFT_GRADES: Record<string, { grade: string; color: string; summary: string }> = {
  Isaiah: { grade: "A-", color: "var(--emerald)", summary: "Elite allegiance-draft alignment. Mbappé at #1 overall is chef's kiss. Saudi Arabia and Qatar in rounds 2-3 will need miracles, but Mbappé could carry this entire portfolio on his back." },
  Sarah: { grade: "A", color: "var(--emerald)", summary: "France + Costa Rica + Cameroon is a masterclass. Vinícius Jr. and Luis Díaz give her firepower. The only question is whether Costa Rica scores enough to matter." },
  Marcus: { grade: "B+", color: "var(--gold)", summary: "Brazil is a premium pick. Peru and Bolivia are the dead weight. Bellingham at 3rd overall is a steal though — could be tournament MVP." },
  Lisa: { grade: "A-", color: "var(--emerald)", summary: "Spain is a contender. Chile is solid depth. Bahrain is... there. But Messi falling to her at pick 4? That's a heist." },
  Phil: { grade: "B", color: "var(--gold)", summary: "England + Nigeria + Paraguay. Middle of the road. Rodri anchoring the midfield is smart, but he needs his countries to stay alive." },
  Dave: { grade: "C+", color: "var(--crimson)", summary: "Germany, Austria, and China. Two of those teams share a language. None of them share a path to the final. Salah at 6th overall saves this from a D." },
  Emma: { grade: "B+", color: "var(--gold)", summary: "Portugal + Canada + Indonesia. Ronaldo's farewell tour could be magic. Kane and Núñez give her two proven finishers." },
  Jake: { grade: "B-", color: "var(--gold)", summary: "Netherlands + Ecuador + Bolivia. De Bruyne is class, but he's drafting from the \"countries that almost qualified\" section." },
  Alex: { grade: "B", color: "var(--gold)", summary: "Belgium + Serbia — aging squad meets dark horse. Saka and Modrić are great individual picks though." },
  Mia: { grade: "B", color: "var(--gold)", summary: "Italy + Egypt — Salah-Yamal combo could be electric. Italy's defense might surprise people." },
  Chris: { grade: "B-", color: "var(--gold)", summary: "Croatia + Iran — living and dying by Modrić and Son. If South Korea makes a run, Chris looks like a genius." },
  Nina: { grade: "C+", color: "var(--crimson)", summary: "Uruguay + Australia — solid but unspectacular. Pedri and Álvarez are nice, but the ceiling is limited." },
  Tom: { grade: "B", color: "var(--gold)", summary: "USA + Senegal — the contrarian king. If the US makes a run as hosts, Tom's portfolio could explode. Pulisic is his horse." },
  Olivia: { grade: "B-", color: "var(--gold)", summary: "Colombia + South Korea — fun but risky. Bernardo Silva and Hakimi are gems, but she needs upsets." },
  Ryan: { grade: "C", color: "var(--crimson)", summary: "Japan + Mexico + Cameroon — three teams that could all go out in the group stage. Or all three could pull an upset. Chaos portfolio." },
  Zoe: { grade: "C+", color: "var(--crimson)", summary: "Denmark + Morocco + Costa Rica — the dark horse trifecta. If even one of these teams goes on a run, Zoe's laughing. If not, she's in the cellar." },
};

// AI commentary for tier list
const AI_TIER_QUIPS: Record<string, string[]> = {
  must_have: [
    "You and 12 other people want Argentina. Good luck.",
    "France? Bold. Their talent pool is deeper than your league's knowledge of soccer.",
    "Brazil's vibes are immaculate. Their defense less so.",
  ],
  want: [
    "Smart. Not flashy, but smart. Like a Volvo.",
    "This is where the real value lives. The boring middle.",
  ],
  fine: [
    "Embrace the chaos. These teams are unpredictable in the best way.",
    "Not your first choice but you won't cry about it either.",
  ],
  please_no: [
    "We don't judge. But the algorithm does.",
    "Someone has to draft these teams. Just not you, apparently.",
  ],
};

type DraftTab = "war-room" | "grades" | "compare" | "my-team" | "draft-board";

export default function DraftPage() {
  const { user, profile } = useAuth();

  // War Room state
  const [tierList, setTierList] = useState<Record<string, string[]>>({
    must_have: ["AR", "FR", "BR"],
    want: ["ES", "DE", "GB-ENG", "PT"],
    fine: ["NL", "BE", "IT", "HR", "UY", "US"],
    please_no: [],
  });
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [aiQuip, setAiQuip] = useState<string | null>(null);

  // Compare state
  const [compareA, setCompareA] = useState("Isaiah");
  const [compareB, setCompareB] = useState("Sarah");

  // Tab
  const [viewTab, setViewTab] = useState<DraftTab>(
    LEAGUE_STATUS === "complete" ? "grades" : "war-room"
  );

  const myCountries = useMemo(
    () => MY_COUNTRIES.map((code) => WORLD_CUP_COUNTRIES.find((c) => c.code === code)).filter(Boolean),
    []
  );
  const myPlayers = useMemo(
    () => MY_PLAYERS.map((id) => PLAYER_POOL.find((p) => p.id === id)).filter(Boolean),
    []
  );
  const allegianceCountry = WORLD_CUP_COUNTRIES.find((c) => c.code === MY_ALLEGIANCE);

  const allTiered = useMemo(() => {
    const used = new Set(Object.values(tierList).flat());
    return used;
  }, [tierList]);

  const untieredCountries = useMemo(
    () => WORLD_CUP_COUNTRIES.filter((c) => !allTiered.has(c.code) && !c.code.startsWith("TBD")),
    [allTiered]
  );

  const addToTier = useCallback((tier: string, code: string) => {
    // Remove from all tiers first
    const newTiers = { ...tierList };
    for (const key of Object.keys(newTiers)) {
      newTiers[key] = newTiers[key].filter((c) => c !== code);
    }
    newTiers[tier] = [...newTiers[tier], code];
    setTierList(newTiers);

    // Show AI quip
    const quips = AI_TIER_QUIPS[tier];
    if (quips) {
      setAiQuip(quips[Math.floor(Math.random() * quips.length)]);
      setTimeout(() => setAiQuip(null), 4000);
    }
  }, [tierList]);

  const getPlayerCountries = (name: string) => {
    return DRAFT_BOARD.flatMap((r) => r.picks)
      .filter((p) => p.user === name)
      .map((p) => WORLD_CUP_COUNTRIES.find((c) => c.code === p.pick))
      .filter(Boolean);
  };

  if (!user) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-6xl">📋</div>
        <h1 className="text-3xl font-black">The Draft Room</h1>
        <p className="text-[var(--muted)]">Sign in to view your draft.</p>
      </div>
    );
  }

  const tabs: { id: DraftTab; label: string; mobileLabel: string; icon: string }[] = LEAGUE_STATUS === "complete"
    ? [
        { id: "grades", label: "Draft Grades", mobileLabel: "Grades", icon: "📊" },
        { id: "compare", label: "Compare", mobileLabel: "VS", icon: "⚔️" },
        { id: "war-room", label: "Big Board", mobileLabel: "Board", icon: "🗺️" },
        { id: "my-team", label: "My Team", mobileLabel: "Team", icon: "⚽" },
        { id: "draft-board", label: "Draft Board", mobileLabel: "Draft", icon: "📋" },
      ]
    : [
        { id: "war-room", label: "War Room", mobileLabel: "Plan", icon: "🗺️" },
        { id: "my-team", label: "My Team", mobileLabel: "Team", icon: "⚽" },
      ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black">
            <span className="text-shimmer">The Draft Room</span>
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            {LEAGUE_STATUS === "complete"
              ? "Draft complete — review grades and compare portfolios"
              : "Plan your strategy for draft night"}
          </p>
        </div>
        {LEAGUE_STATUS === "complete" && (
          <div className="text-right">
            <div className="text-2xl font-black" style={{ color: DRAFT_GRADES.Isaiah?.color }}>
              {DRAFT_GRADES.Isaiah?.grade}
            </div>
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Your Grade</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface)] rounded-lg p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewTab(tab.id)}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${
              viewTab === tab.id
                ? "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="md:hidden text-[10px]">{tab.mobileLabel}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════ */}
        {/* DRAFT GRADES                               */}
        {/* ═══════════════════════════════════════════ */}
        {viewTab === "grades" && (
          <motion.div
            key="grades"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {PARTICIPANTS.map((name, i) => {
              const grade = DRAFT_GRADES[name];
              const countries = getPlayerCountries(name);
              const isMe = name === "Isaiah";

              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-2xl overflow-hidden ${isMe ? "ring-2 ring-[var(--gold)]/30" : ""}`}
                >
                  <div className={`bg-[var(--surface)] p-4 ${isMe ? "bg-[var(--gold)]/5" : ""}`}>
                    <div className="flex items-start gap-4">
                      {/* Grade badge */}
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shrink-0"
                        style={{
                          backgroundColor: `${grade.color}15`,
                          color: grade.color,
                          border: `2px solid ${grade.color}30`,
                        }}
                      >
                        {grade.grade}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black">{name}</span>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] font-bold">
                              YOU
                            </span>
                          )}
                        </div>

                        {/* Country flags */}
                        <div className="flex gap-1.5 mb-2">
                          {countries.map((c) => (
                            <span key={c?.code} className="text-lg" title={c?.name}>
                              {c?.flag}
                            </span>
                          ))}
                        </div>

                        {/* AI commentary */}
                        <p className="text-sm text-[var(--muted)] leading-relaxed">
                          {grade.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* HEAD-TO-HEAD COMPARE                       */}
        {/* ═══════════════════════════════════════════ */}
        {viewTab === "compare" && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Selector */}
            <div className="flex items-center gap-4 justify-center">
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="px-4 py-3 bg-[var(--surface)] border border-[var(--gold)]/30 rounded-xl font-bold text-center focus:outline-none"
              >
                {PARTICIPANTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="w-12 h-12 rounded-full bg-[var(--gold)] flex items-center justify-center text-[var(--background)] font-black shadow-lg shadow-[var(--gold)]/30">
                VS
              </div>
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className="px-4 py-3 bg-[var(--surface)] border border-[var(--electric)]/30 rounded-xl font-bold text-center focus:outline-none"
              >
                {PARTICIPANTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Comparison cards */}
            <div className="grid grid-cols-2 gap-4">
              {[compareA, compareB].map((name, idx) => {
                const grade = DRAFT_GRADES[name];
                const countries = getPlayerCountries(name);
                const color = idx === 0 ? "var(--gold)" : "var(--electric)";

                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-2xl bg-[var(--surface)] p-5 space-y-4"
                    style={{ borderTop: `3px solid ${color}` }}
                  >
                    {/* Name + Grade */}
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black mb-2"
                        style={{ backgroundColor: `${grade.color}15`, color: grade.color }}>
                        {grade.grade}
                      </div>
                      <div className="font-black text-lg">{name}</div>
                    </div>

                    {/* Countries */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">Countries</div>
                      <div className="space-y-1.5">
                        {countries.map((c) => (
                          <div key={c?.code} className="flex items-center gap-2 text-sm">
                            <span className="text-lg">{c?.flag}</span>
                            <span className="font-semibold">{c?.name}</span>
                            <span className="text-[10px] text-[var(--muted)] ml-auto">
                              #{c?.fifaRanking}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI take */}
                    <div className="p-3 rounded-xl bg-[var(--surface-light)] text-xs text-[var(--muted)] leading-relaxed">
                      🤖 {grade.summary.split(".")[0]}.
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Stat comparison bars */}
            <div className="card-glow rounded-2xl bg-[var(--surface)] p-5 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Portfolio Comparison
              </div>
              {[
                { label: "Avg FIFA Ranking", a: 52, b: 35, lower_is_better: true },
                { label: "Elite Tier Teams", a: 1, b: 1, lower_is_better: false },
                { label: "Player Avg Rating", a: 86, b: 87, lower_is_better: false },
                { label: "Upside Potential", a: 8.5, b: 7.2, lower_is_better: false },
              ].map((stat) => {
                const aCountries = getPlayerCountries(compareA);
                const bCountries = getPlayerCountries(compareB);
                const maxVal = Math.max(stat.a, stat.b) || 1;
                const aWins = stat.lower_is_better ? stat.a < stat.b : stat.a > stat.b;
                const bWins = !aWins && stat.a !== stat.b;

                return (
                  <div key={stat.label} className="space-y-1.5">
                    <div className="text-xs text-[var(--muted)] text-center">{stat.label}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black w-10 text-right ${aWins ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>
                        {stat.a}
                      </span>
                      <div className="flex-1 flex h-4 gap-1">
                        <motion.div
                          className="h-full rounded-l-full bg-[var(--gold)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${(stat.a / maxVal) * 100}%` }}
                          transition={{ duration: 0.8 }}
                          style={{ marginLeft: "auto" }}
                        />
                        <motion.div
                          className="h-full rounded-r-full bg-[var(--electric)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${(stat.b / maxVal) * 100}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <span className={`text-sm font-black w-10 ${bWins ? "text-[var(--electric)]" : "text-[var(--muted)]"}`}>
                        {stat.b}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* WAR ROOM / BIG BOARD                       */}
        {/* ═══════════════════════════════════════════ */}
        {viewTab === "war-room" && (
          <motion.div
            key="war-room"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* AI Commentary */}
            <AnimatePresence>
              {aiQuip && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--electric)]/10 border border-[var(--electric)]/20"
                >
                  <span className="text-xl">🤖</span>
                  <p className="text-sm">{aiQuip}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tier lists */}
            {[
              { key: "must_have", label: "Must Have", emoji: "🔥", color: "var(--gold)", borderColor: "border-[var(--gold)]/30" },
              { key: "want", label: "Want", emoji: "👍", color: "var(--emerald)", borderColor: "border-[var(--emerald)]/30" },
              { key: "fine", label: "Fine With", emoji: "🤷", color: "var(--electric)", borderColor: "border-[var(--electric)]/30" },
              { key: "please_no", label: "Please No", emoji: "💀", color: "var(--crimson)", borderColor: "border-[var(--crimson)]/30" },
            ].map((tier) => (
              <div key={tier.key} className={`rounded-2xl bg-[var(--surface)] overflow-hidden border ${tier.borderColor}`}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `2px solid ${tier.color}30` }}>
                  <span className="text-lg">{tier.emoji}</span>
                  <span className="font-black text-sm" style={{ color: tier.color }}>{tier.label}</span>
                  <span className="text-[10px] text-[var(--muted)] ml-auto">
                    {tierList[tier.key]?.length || 0} teams
                  </span>
                </div>
                <div className="p-3">
                  {(tierList[tier.key]?.length || 0) > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tierList[tier.key].map((code) => {
                        const country = WORLD_CUP_COUNTRIES.find((c) => c.code === code);
                        if (!country) return null;
                        return (
                          <motion.button
                            key={code}
                            layout
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              // Remove from this tier
                              setTierList((prev) => ({
                                ...prev,
                                [tier.key]: prev[tier.key].filter((c) => c !== code),
                              }));
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-light)] hover:bg-[var(--surface-border)] transition-colors group"
                          >
                            <span className="text-xl">{country.flag}</span>
                            <span className="text-xs font-bold">{country.name}</span>
                            <span className="text-[10px] text-[var(--muted)] group-hover:text-[var(--crimson)] transition-colors">✕</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--muted)] py-2 text-center">
                      Tap a country below to add it here
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Untiered countries pool */}
            {untieredCountries.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Available — tap to rank ({untieredCountries.length} remaining)
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {untieredCountries.map((country) => (
                    <div key={country.code} className="relative group">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToTier("want", country.code)}
                        className="w-full rounded-xl p-3 bg-[var(--surface)] hover:bg-[var(--surface-light)] transition-colors text-center"
                      >
                        <div className="text-2xl mb-1">{country.flag}</div>
                        <div className="text-[10px] font-bold truncate">{country.name}</div>
                        <div className="text-[9px] text-[var(--muted)]">#{country.fifaRanking}</div>
                      </motion.button>
                      {/* Quick-add buttons on hover */}
                      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                        <button onClick={() => addToTier("must_have", country.code)} className="w-5 h-5 rounded-full bg-[var(--gold)] text-[8px] font-bold text-[var(--background)]" title="Must Have">🔥</button>
                        <button onClick={() => addToTier("please_no", country.code)} className="w-5 h-5 rounded-full bg-[var(--crimson)] text-[8px] font-bold text-white" title="Please No">💀</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* MY TEAM                                    */}
        {/* ═══════════════════════════════════════════ */}
        {viewTab === "my-team" && (
          <motion.div
            key="my-team"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {allegianceCountry && (
              <div className="rounded-2xl overflow-hidden">
                <div className="relative bg-gradient-to-r from-[var(--gold)]/10 via-transparent to-[var(--gold)]/10 p-6">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 text-[100px] leading-none pointer-events-none">
                    {allegianceCountry.flag}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-3">❤️ Allegiance</div>
                  <div className="flex items-center gap-4 relative z-10">
                    <span className="text-5xl">{allegianceCountry.flag}</span>
                    <div>
                      <div className="text-2xl font-black">{allegianceCountry.name}</div>
                      <div className="text-sm text-[var(--muted)]">
                        Group {allegianceCountry.group} · FIFA #{allegianceCountry.fifaRanking} · 50% rate
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Drafted Countries
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {myCountries.map((country) =>
                  country ? <CountryCard key={country.code} country={country} selected /> : null
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Drafted Players
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {myPlayers.map((player) =>
                  player ? <FutCard key={player.id} player={player} goals={0} assists={0} points={0} /> : null
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* DRAFT BOARD                                */}
        {/* ═══════════════════════════════════════════ */}
        {viewTab === "draft-board" && (
          <motion.div
            key="draft-board"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {DRAFT_BOARD.map((round) => (
              <div key={round.round} className="card-glow rounded-2xl bg-[var(--surface)] overflow-hidden">
                <div className="px-4 py-2 bg-[var(--surface-light)] border-b border-[var(--surface-border)]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    Round {round.round} {round.round === 2 ? "(Snake — Reverse)" : ""}
                  </span>
                </div>
                <div className="divide-y divide-[var(--surface-border)]/50">
                  {round.picks.map((pick, i) => {
                    const country = WORLD_CUP_COUNTRIES.find((c) => c.code === pick.pick);
                    const isMe = pick.user === "Isaiah";
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? "bg-[var(--gold)]/5" : ""}`}
                      >
                        <span className="text-xs text-[var(--muted)] w-6 text-right font-mono">
                          {(round.round - 1) * 16 + i + 1}
                        </span>
                        <span className={`font-bold text-sm w-20 ${isMe ? "text-[var(--gold)]" : ""}`}>
                          {pick.user}
                        </span>
                        <span className="text-xl">{country?.flag}</span>
                        <span className="text-sm">{country?.name}</span>
                        <span className="text-[10px] text-[var(--muted)] ml-auto">
                          FIFA #{country?.fifaRanking}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
