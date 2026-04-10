"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { createLeague, getMyLeagues, getLeagueMembers, joinLeagueByCode } from "@/lib/supabase-actions";
import type { ScoringPreset } from "@/lib/types";

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

  const [leagueName, setLeagueName] = useState("Office World Cup 2026");
  const [preset, setPreset] = useState<ScoringPreset>("standard");
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [countriesPerPerson, setCountriesPerPerson] = useState(2);
  const [playersPerPerson, setPlayersPerPerson] = useState(5);
  const [allegianceEnabled, setAllegianceEnabled] = useState(true);
  const [hotTakesEnabled, setHotTakesEnabled] = useState(true);
  const [banBoostEnabled, setBanBoostEnabled] = useState(true);
  const [asyncDraft, setAsyncDraft] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  // Load existing league
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
      setAuthError("Unable to send magic link. Please check your email and try again.");
    } else {
      setMagicLinkSent(true);
    }
  };

  const handleCreateLeague = async () => {
    if (!user) return;
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
    } catch {
      // Error handled by server action
    }
  };

  const handleJoinByCode = async () => {
    if (!user || !inviteCode.trim()) return;
    setJoinError(null);
    try {
      await joinLeagueByCode(inviteCode.trim());
      // Reload full league data
      const leagues = await getMyLeagues();
      if (leagues.length > 0) {
        const fullLeague = leagues[0] as LeagueRow;
        setLeague(fullLeague);
        const m = await getLeagueMembers(fullLeague.id);
        setMembers(m as MemberRow[]);
      }
    } catch {
      setJoinError("Invalid invite code or league not found");
    }
  };

  const presetDescriptions = {
    casual: "More countries each, simple predictions, hot takes off. Best for small groups or non-fans.",
    standard: "Full experience: allegiance + draft + predictions + H2H + hot takes.",
    competitive: "Detailed scoring, ban/boost, async drafts. For the hardcore.",
  };

  const autoCountries = Math.floor(48 / maxParticipants);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl animate-spin">⚽</div>
        <p className="text-[var(--muted)] mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-black">
          <span className="text-shimmer">League Setup</span>
        </h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Configure your World Cup HQ league
        </p>
      </div>

      {/* Auth */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glow rounded-xl p-6 bg-[var(--surface)]"
        >
          {magicLinkSent ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📬</div>
              <h2 className="text-xl font-bold">Check Your Email!</h2>
              <p className="text-[var(--muted)]">
                We sent a magic link to <strong className="text-[var(--gold)]">{email}</strong>.
                Click the link to sign in — no password needed.
              </p>
              <button
                onClick={() => setMagicLinkSent(false)}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2">Sign In to Play</h2>

              {/* Google OAuth — primary */}
              <button
                onClick={async () => {
                  setAuthError(null);
                  const { error } = await signInWithGoogle();
                  if (error) setAuthError("Unable to sign in with Google. Please try again.");
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-colors mb-4"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[var(--surface-border)]" />
                <span className="text-xs text-[var(--muted)]">or use email</span>
                <div className="flex-1 h-px bg-[var(--surface-border)]" />
              </div>

              {/* Magic link fallback */}
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-lg focus:outline-none focus:border-[var(--gold)]/50"
                  onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
                />
                <button
                  onClick={handleMagicLink}
                  disabled={!email.includes("@")}
                  className="px-6 py-3 bg-[var(--surface-light)] text-[var(--foreground)] font-bold rounded-lg hover:bg-[var(--surface-border)] transition-colors disabled:opacity-50 border border-[var(--surface-border)]"
                >
                  Send Link
                </button>
              </div>
              {authError && (
                <p className="text-sm text-[var(--crimson)] mt-2">{authError}</p>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Dev Login — quick sign in as test user */}
      {!user && process.env.NODE_ENV === "development" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-glow rounded-xl p-6 bg-[var(--surface)] border border-[var(--electric)]/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🧪</span>
            <h2 className="text-lg font-bold text-[var(--electric)]">Dev Login</h2>
          </div>
          <p className="text-xs text-[var(--muted)] mb-4">
            Quick sign-in as a test user (simulation data required)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {["Isaiah", "Sarah", "Marcus", "Lisa", "Phil", "Dave", "Emma", "Jake",
              "Alex", "Mia", "Chris", "Nina", "Tom", "Olivia", "Ryan", "Zoe"].map((name) => (
              <button
                key={name}
                onClick={async () => {
                  setAuthError(null);
                  const { error } = await signInWithPassword(
                    `${name.toLowerCase()}@example.com`,
                    "worldcup2026"
                  );
                  if (error) setAuthError(`Failed to sign in as ${name}`);
                }}
                className="px-3 py-2 rounded-lg bg-[var(--surface-light)] border border-[var(--surface-border)] text-sm font-semibold hover:border-[var(--electric)]/50 hover:bg-[var(--electric)]/5 transition-all"
              >
                {name}
              </button>
            ))}
          </div>
          {authError && (
            <p className="text-sm text-[var(--crimson)] mt-3">{authError}</p>
          )}
        </motion.div>
      )}

      {/* Signed in, no league yet */}
      {user && !league && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* User info */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)] card-glow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center font-bold text-[var(--gold)]">
                {profile?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div className="font-bold">{profile?.name || "Player"}</div>
                <div className="text-xs text-[var(--muted)]">{user.email}</div>
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Sign out
            </button>
          </div>

          {/* Join existing league */}
          <div className="card-glow rounded-xl p-6 bg-[var(--surface)]">
            <h2 className="text-lg font-bold mb-3">Join a League</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="flex-1 px-4 py-3 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-lg focus:outline-none focus:border-[var(--gold)]/50 font-mono tracking-widest"
                onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
              />
              <button
                onClick={handleJoinByCode}
                disabled={!inviteCode.trim()}
                className="px-6 py-3 bg-[var(--electric)] text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Join
              </button>
            </div>
            {joinError && (
              <p className="text-sm text-[var(--crimson)] mt-2">{joinError}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--surface-border)]" />
            <span className="text-xs text-[var(--muted)]">OR CREATE A NEW LEAGUE</span>
            <div className="flex-1 h-px bg-[var(--surface-border)]" />
          </div>

          {/* Create league form */}
          <div className="card-glow rounded-xl p-6 bg-[var(--surface)] space-y-4">
            <h2 className="text-xl font-bold">Create Your League</h2>

            <div>
              <label className="text-xs font-bold text-[var(--muted)] block mb-1">
                LEAGUE NAME
              </label>
              <input
                type="text"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-lg focus:outline-none focus:border-[var(--gold)]/50"
              />
            </div>

            {/* Preset */}
            <div>
              <label className="text-xs font-bold text-[var(--muted)] block mb-2">
                SCORING PRESET
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["casual", "standard", "competitive"] as ScoringPreset[]).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPreset(p)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        preset === p
                          ? "bg-[var(--gold)]/10 border-2 border-[var(--gold)]"
                          : "bg-[var(--surface-light)] border border-[var(--surface-border)] hover:border-[var(--gold)]/30"
                      }`}
                    >
                      <div className="text-2xl mb-1">
                        {p === "casual" ? "🎉" : p === "standard" ? "⚽" : "🔥"}
                      </div>
                      <div className="font-bold text-sm capitalize">{p}</div>
                    </button>
                  )
                )}
              </div>
              <p className="text-xs text-[var(--muted)] mt-2">
                {presetDescriptions[preset]}
              </p>
            </div>

            {/* Participants */}
            <div>
              <label className="text-xs font-bold text-[var(--muted)] block mb-1">
                MAX PARTICIPANTS
              </label>
              <input
                type="number"
                min={2}
                max={50}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-lg focus:outline-none focus:border-[var(--gold)]/50"
              />
              <p className="text-xs text-[var(--muted)] mt-1">
                Auto-calculated: {autoCountries} countries per person (
                {48 - autoCountries * maxParticipants} undrafted go to free agent
                pool)
              </p>
            </div>
          </div>

          {/* Advanced settings */}
          <div className="card-glow rounded-xl bg-[var(--surface)]">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-4 flex items-center justify-between font-bold"
            >
              <span>Advanced Settings</span>
              <span className="text-[var(--muted)]">
                {showAdvanced ? "▲" : "▼"}
              </span>
            </button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 pb-6 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--muted)] block mb-1">
                      COUNTRIES PER PERSON
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={countriesPerPerson}
                      onChange={(e) =>
                        setCountriesPerPerson(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-lg focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--muted)] block mb-1">
                      PLAYERS PER PERSON
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={8}
                      value={playersPerPerson}
                      onChange={(e) =>
                        setPlayersPerPerson(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-lg focus:outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Toggles */}
                {[
                  {
                    label: "Allegiance Pick",
                    desc: "Everyone picks a heart team before the draft",
                    value: allegianceEnabled,
                    onChange: setAllegianceEnabled,
                  },
                  {
                    label: "Hot Takes Market",
                    desc: "Submit and trade on bold predictions",
                    value: hotTakesEnabled,
                    onChange: setHotTakesEnabled,
                  },
                  {
                    label: "Ban / Boost",
                    desc: "Ban and boost players in daily predictions",
                    value: banBoostEnabled,
                    onChange: setBanBoostEnabled,
                  },
                  {
                    label: "Async Draft",
                    desc: "Draft over hours instead of live (good for remote)",
                    value: asyncDraft,
                    onChange: setAsyncDraft,
                  },
                ].map((toggle) => (
                  <div
                    key={toggle.label}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-light)]"
                  >
                    <div>
                      <div className="font-bold text-sm">{toggle.label}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {toggle.desc}
                      </div>
                    </div>
                    <button
                      onClick={() => toggle.onChange(!toggle.value)}
                      className={`w-12 h-7 rounded-full transition-colors relative ${
                        toggle.value
                          ? "bg-[var(--gold)]"
                          : "bg-[var(--surface-border)]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${
                          toggle.value ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Create button */}
          <button
            onClick={handleCreateLeague}
            className="w-full py-4 bg-[var(--gold)] text-[var(--background)] font-bold rounded-xl hover:bg-[var(--gold-dim)] transition-colors text-lg"
          >
            Create League ⚽
          </button>
        </motion.div>
      )}

      {/* League created - show members and invite code */}
      {user && league && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* User info bar */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)] card-glow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center font-bold text-[var(--gold)]">
                {profile?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div className="font-bold">{profile?.name}</div>
                <div className="text-xs text-[var(--muted)]">{user.email}</div>
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Sign out
            </button>
          </div>

          <div className="card-glow rounded-xl p-6 bg-[var(--surface)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{league.name}</h2>
                <p className="text-sm text-[var(--muted)]">
                  {league.scoring_preset} mode ·{" "}
                  {league.countries_per_person} countries ·{" "}
                  {league.players_per_person} players each
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[var(--emerald)]/10 text-[var(--emerald)] text-xs font-bold border border-[var(--emerald)]/20">
                {league.draft_status === "pre_draft"
                  ? "WAITING FOR PLAYERS"
                  : league.draft_status.toUpperCase().replace("_", " ")}
              </span>
            </div>

            {/* Invite code */}
            <div className="mb-6 p-4 rounded-lg bg-[var(--gold)]/5 border border-[var(--gold)]/20">
              <div className="text-xs font-bold text-[var(--muted)] mb-1">
                INVITE CODE — Share this with your office
              </div>
              <div className="flex items-center gap-3">
                <code className="text-2xl font-mono font-bold text-[var(--gold)] tracking-[0.3em]">
                  {league.invite_code}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(league.invite_code)}
                  className="px-3 py-1 text-xs bg-[var(--surface-light)] rounded-lg hover:bg-[var(--surface-border)] transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Players list */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[var(--muted)]">
                PLAYERS ({members.length}/{league.max_participants})
              </div>
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-light)]"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--gold)]/10 flex items-center justify-center font-bold text-sm text-[var(--gold)]">
                    {member.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="font-bold text-sm">{member.name}</span>
                  {member.id === league.admin_id && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--gold)]/10 text-[var(--gold)]">
                      ADMIN
                    </span>
                  )}
                  {member.id === user.id && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--electric)]/10 text-[var(--electric)]">
                      YOU
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* League config summary */}
          <div className="card-glow rounded-xl p-5 bg-[var(--surface)]">
            <div className="text-xs font-bold text-[var(--muted)] mb-3">
              LEAGUE SETTINGS
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Scoring", league.scoring_preset],
                ["Draft", league.draft_mode],
                ["Countries/person", String(league.countries_per_person)],
                ["Players/person", String(league.players_per_person)],
                ["Allegiance", league.allegiance_enabled ? "On" : "Off"],
                ["Hot Takes", league.hot_takes_enabled ? "On" : "Off"],
                ["Ban/Boost", league.ban_boost_enabled ? "On" : "Off"],
                ["Async Draft", league.async_draft ? "On" : "Off"],
                ["Late Joiners", league.late_joiner_policy.replace("_", " ")],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between p-2 rounded bg-[var(--surface-light)]">
                  <span className="text-[var(--muted)]">{label}</span>
                  <span className="font-bold capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
