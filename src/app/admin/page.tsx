"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { createLeague, getMyLeagues, getLeagueMembers, joinLeagueByCode } from "@/lib/supabase-actions";
import type { ScoringPreset } from "@/lib/types";
import Link from "next/link";

interface LeagueRow {
  id: string;
  name: string;
  admin_id: string;
  scoring_preset: string;
  draft_mode: string;
  countries_per_person: number;
  players_per_person: number;
  max_participants: number;
  allegiance_enabled: boolean;
  hot_takes_enabled: boolean;
  ban_boost_enabled: boolean;
  async_draft: boolean;
  late_joiner_policy: string;
  draft_status: string;
  invite_code: string;
}

interface MemberRow {
  id: string;
  name: string;
  avatar_url: string | null;
}

export default function AdminPage() {
  const { user, profile, loading, signInWithMagicLink, signInWithPassword, signInWithGoogle, signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [step, setStep] = useState<"name" | "preset" | "size">("name");
  const [leagueName, setLeagueName] = useState("Office World Cup 2026");
  const [preset, setPreset] = useState<ScoringPreset>("standard");
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [countriesPerPerson, setCountriesPerPerson] = useState(3);
  const [playersPerPerson, setPlayersPerPerson] = useState(5);
  const [allegianceEnabled, setAllegianceEnabled] = useState(true);
  const [hotTakesEnabled, setHotTakesEnabled] = useState(true);
  const [banBoostEnabled, setBanBoostEnabled] = useState(true);
  const [asyncDraft, setAsyncDraft] = useState(false);

  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      getMyLeagues().then((leagues) => {
        if (leagues.length > 0) {
          const l = leagues[0] as LeagueRow;
          setLeague(l);
          getLeagueMembers(l.id).then((m) => setMembers(m as MemberRow[]));
        }
      });
    }
  }, [user]);

  const handleMagicLink = async () => {
    setAuthError(null);
    const { error } = await signInWithMagicLink(email);
    if (error) {
      setAuthError("Unable to send magic link. Please try again.");
    } else {
      setMagicLinkSent(true);
    }
  };

  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreateLeague = async () => {
    if (!user) return;
    setCreateError(null);
    setCreating(true);
    try {
      const newLeague = await createLeague({
        name: leagueName,
        scoring_preset: preset,
        draft_mode: "snake",
        countries_per_person: countriesPerPerson,
        players_per_person: playersPerPerson,
        max_participants: maxParticipants,
        allegiance_enabled: allegianceEnabled,
        hot_takes_enabled: hotTakesEnabled,
        ban_boost_enabled: banBoostEnabled,
        async_draft: asyncDraft,
      });
      setLeague(newLeague as LeagueRow);
      const m = await getLeagueMembers(newLeague.id);
      setMembers(m as MemberRow[]);
    } catch (err) {
      setCreateError("Failed to create league. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!user || !inviteCode.trim()) return;
    setJoinError(null);
    try {
      await joinLeagueByCode(inviteCode.trim());
      const leagues = await getMyLeagues();
      if (leagues.length > 0) {
        const fullLeague = leagues[0] as LeagueRow;
        setLeague(fullLeague);
        const m = await getLeagueMembers(fullLeague.id);
        setMembers(m as MemberRow[]);
      }
    } catch {
      setJoinError("Invalid code or league is full");
    }
  };

  const handleCopy = () => {
    if (league) {
      navigator.clipboard.writeText(league.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const presets: { id: ScoringPreset; icon: string; name: string; desc: string; best: string }[] = [
    { id: "casual", icon: "🎉", name: "Casual", desc: "Simple predictions, fewer mechanics", best: "Non-soccer fans" },
    { id: "standard", icon: "⚽", name: "Standard", desc: "Full experience with all features", best: "Most groups" },
    { id: "competitive", icon: "🔥", name: "Competitive", desc: "Deep scoring, async drafts", best: "Hardcore fans" },
  ];

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl animate-spin">⚽</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════ */}
        {/* NOT SIGNED IN                              */}
        {/* ═══════════════════════════════════════════ */}
        {!user && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8 pt-8"
          >
            {/* Welcome header */}
            <div className="text-center space-y-3">
              <div className="text-6xl">⚽</div>
              <h1 className="text-3xl font-black">
                <span className="text-shimmer">Get Started</span>
              </h1>
              <p className="text-[var(--muted)] max-w-sm mx-auto">
                Sign in to create a league or join one with an invite code
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--surface)] p-6 space-y-4">
              {magicLinkSent ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center space-y-4 py-4"
                >
                  <div className="text-5xl">📬</div>
                  <h2 className="text-xl font-black">Check Your Email!</h2>
                  <p className="text-sm text-[var(--muted)]">
                    We sent a magic link to <strong className="text-[var(--gold)]">{email}</strong>
                  </p>
                  <button onClick={() => setMagicLinkSent(false)} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
                    Try a different email
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Google — primary */}
                  <button
                    onClick={async () => {
                      setAuthError(null);
                      const { error } = await signInWithGoogle();
                      if (error) setAuthError("Unable to sign in with Google.");
                    }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white text-gray-800 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[var(--surface-border)]" />
                    <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">or use email</span>
                    <div className="flex-1 h-px bg-[var(--surface-border)]" />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-4 py-3 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--gold)]/50"
                      onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
                    />
                    <button
                      onClick={handleMagicLink}
                      disabled={!email.includes("@")}
                      className="px-5 py-3 bg-[var(--surface-light)] font-semibold rounded-xl hover:bg-[var(--surface-border)] transition-colors disabled:opacity-40 text-sm border border-[var(--surface-border)]"
                    >
                      Send Link
                    </button>
                  </div>
                  {authError && <p className="text-sm text-[var(--crimson)]">{authError}</p>}
                </>
              )}
            </div>

            {/* Dev Login */}
            {process.env.NODE_ENV === "development" && (
              <div className="rounded-2xl bg-[var(--surface)] p-5 border border-[var(--electric)]/20">
                <div className="flex items-center gap-2 mb-3">
                  <span>🧪</span>
                  <span className="text-sm font-bold text-[var(--electric)]">Dev Login</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {["Isaiah", "Sarah", "Marcus", "Lisa", "Phil", "Dave", "Emma", "Jake",
                    "Alex", "Mia", "Chris", "Nina", "Tom", "Olivia", "Ryan", "Zoe"].map((name) => (
                    <button
                      key={name}
                      onClick={async () => {
                        setAuthError(null);
                        const { error } = await signInWithPassword(`${name.toLowerCase()}@example.com`, "worldcup2026");
                        if (error) setAuthError(`Failed: ${name}`);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-[var(--surface-light)] text-xs font-semibold hover:bg-[var(--electric)]/10 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SIGNED IN — HAS A LEAGUE                   */}
        {/* ═══════════════════════════════════════════ */}
        {user && league && (
          <motion.div
            key="league"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 pt-4"
          >
            {/* User bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center font-black text-[var(--gold)]">
                  {profile?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="font-bold">{profile?.name}</div>
                  <div className="text-xs text-[var(--muted)]">{user.email}</div>
                </div>
              </div>
              <button onClick={signOut} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
                Sign out
              </button>
            </div>

            {/* League card */}
            <div className="rounded-2xl bg-[var(--surface)] overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-[var(--gold)]/10 via-transparent to-[var(--gold)]/10">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Your League</div>
                    <h2 className="text-2xl font-black">{league.name}</h2>
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {league.scoring_preset} · {league.countries_per_person} countries · {league.players_per_person} players
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[var(--emerald)]/10 text-[var(--emerald)] text-[10px] font-bold border border-[var(--emerald)]/20 uppercase tracking-wider">
                    {league.draft_status === "pre_draft" ? "Waiting" : league.draft_status === "complete" ? "Complete" : "Active"}
                  </span>
                </div>
              </div>

              {/* Invite code — big and prominent */}
              <div className="p-6 border-t border-[var(--surface-border)]/50">
                <div className="text-xs font-bold text-[var(--muted)] mb-2">Share this code to invite players</div>
                <div className="flex items-center gap-3">
                  <code className="text-3xl font-mono font-black text-[var(--gold)] tracking-[0.25em] flex-1">
                    {league.invite_code}
                  </code>
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      copied
                        ? "bg-[var(--emerald)] text-white"
                        : "bg-[var(--gold)] text-[var(--background)] hover:bg-[var(--gold-dim)]"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Members */}
              <div className="p-6 border-t border-[var(--surface-border)]/50">
                <div className="text-xs font-bold text-[var(--muted)] mb-3">
                  Players · {members.length}/{league.max_participants}
                </div>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                        member.id === user.id
                          ? "bg-[var(--gold)]/10 border border-[var(--gold)]/20"
                          : "bg-[var(--surface-light)]"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-[var(--surface-border)] flex items-center justify-center text-[10px] font-bold">
                        {member.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold">{member.name}</span>
                      {member.id === league.admin_id && <span className="text-[8px] text-[var(--gold)]">★</span>}
                    </div>
                  ))}
                  {members.length < league.max_participants && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--surface-light)] text-sm text-[var(--muted)]">
                      + {league.max_participants - members.length} spots open
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/draft" className="rounded-2xl bg-[var(--surface)] p-5 text-center hover:bg-[var(--surface-light)] transition-colors group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📋</div>
                <div className="font-black text-sm">Draft Room</div>
                <div className="text-[10px] text-[var(--muted)] mt-1">View your team</div>
              </Link>
              <Link href="/try" className="rounded-2xl bg-[var(--surface)] p-5 text-center hover:bg-[var(--surface-light)] transition-colors group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⚡</div>
                <div className="font-black text-sm">Simulate</div>
                <div className="text-[10px] text-[var(--muted)] mt-1">See how your league plays out</div>
              </Link>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SIGNED IN — NO LEAGUE YET                  */}
        {/* ═══════════════════════════════════════════ */}
        {user && !league && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 pt-4"
          >
            {/* Welcome */}
            <div className="text-center space-y-2">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-5xl">
                👋
              </motion.div>
              <h1 className="text-2xl font-black">Welcome, {profile?.name || "Player"}!</h1>
              <p className="text-sm text-[var(--muted)]">
                Create a new league or join an existing one
              </p>
              <button onClick={signOut} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
                Not you? Sign out
              </button>
            </div>

            {/* Two options side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Join */}
              <div className="rounded-2xl bg-[var(--surface)] p-5 space-y-3">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎫</div>
                  <h2 className="font-black">Join a League</h2>
                  <p className="text-xs text-[var(--muted)] mt-1">Got an invite code from a friend?</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2.5 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm font-mono tracking-widest text-center focus:outline-none focus:border-[var(--gold)]/50"
                    onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
                  />
                </div>
                <button
                  onClick={handleJoinByCode}
                  disabled={!inviteCode.trim()}
                  className="w-full py-2.5 bg-[var(--electric)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 text-sm"
                >
                  Join League
                </button>
                {joinError && <p className="text-xs text-[var(--crimson)] text-center">{joinError}</p>}
              </div>

              {/* Create */}
              <div className="rounded-2xl bg-[var(--surface)] p-5 space-y-3">
                <div className="text-center">
                  <div className="text-3xl mb-2">🏟️</div>
                  <h2 className="font-black">Create a League</h2>
                  <p className="text-xs text-[var(--muted)] mt-1">Start one and invite your office</p>
                </div>
                <input
                  type="text"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm text-center focus:outline-none focus:border-[var(--gold)]/50"
                />

                {/* Preset selector */}
                <div className="grid grid-cols-3 gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPreset(p.id)}
                      className={`py-2 rounded-xl text-center transition-all ${
                        preset === p.id
                          ? "bg-[var(--gold)]/15 ring-1 ring-[var(--gold)] text-[var(--gold)]"
                          : "bg-[var(--surface-light)] text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <div className="text-lg">{p.icon}</div>
                      <div className="text-[10px] font-bold">{p.name}</div>
                    </button>
                  ))}
                </div>

                {/* Size */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted)]">Size:</span>
                  {[8, 16, 24, 32].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxParticipants(n)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        maxParticipants === n
                          ? "bg-[var(--gold)]/15 text-[var(--gold)] ring-1 ring-[var(--gold)]"
                          : "bg-[var(--surface-light)] text-[var(--muted)]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCreateLeague}
                  disabled={creating}
                  className="w-full py-2.5 bg-[var(--gold)] text-[var(--background)] font-black rounded-xl hover:bg-[var(--gold-dim)] transition-colors text-sm disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create League ⚽"}
                </button>
                {createError && (
                  <p className="text-xs text-[var(--crimson)] text-center mt-2">{createError}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
