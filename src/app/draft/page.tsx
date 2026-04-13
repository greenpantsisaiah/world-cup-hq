"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useLeague } from "@/components/league-provider";
import { CountryCard } from "@/components/country-card";
import { FutCard } from "@/components/player-fut-card";
import {
  setAllegiance,
  getAllegiances,
  makeDraftPick,
  getDraftPicks,
  updateDraftStatus,
  setDraftOrder,
  revealAllegiances,
} from "@/lib/supabase-actions";
import { WORLD_CUP_COUNTRIES } from "@/data/countries";
import { PLAYER_POOL } from "@/data/players";
import {
  getCurrentDrafter,
  isMyTurn,
  getCurrentRound,
  getPickInRound,
  isDraftPhaseComplete,
  generateRandomDraftOrder,
} from "@/lib/draft-utils";
import Link from "next/link";

interface DraftPickRow {
  id: string;
  user_id: string;
  pick_type: string;
  country_code: string | null;
  player_id: string | null;
  round: number;
  pick_number: number;
}

interface AllegianceRow {
  user_id: string;
  country_code: string;
}

type DraftTab = "live" | "my-team" | "board";

export default function DraftPage() {
  const { user } = useAuth();
  const { league, leagueId, members, isAdmin, refreshLeague } = useLeague();

  const [tab, setTab] = useState<DraftTab>("live");
  const [picks, setPicks] = useState<DraftPickRow[]>([]);
  const [allegiances, setAllegiances] = useState<AllegianceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingPick, setPendingPick] = useState<{ type: "country" | "player"; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const draftStatus = league?.draft_status || "pre_draft";
  const leagueAny = league as unknown as Record<string, unknown> | null;
  const draftOrder = (leagueAny?.draft_order as string[]) || [];
  const currentPickNumber = (leagueAny?.current_pick_number as number) || 0;
  const countriesPerPerson = league?.countries_per_person || 3;
  const playersPerPerson = league?.players_per_person || 5;

  const loadDraftData = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true);
    try {
      const [picksData, allegianceData] = await Promise.all([
        getDraftPicks(leagueId),
        getAllegiances(leagueId),
      ]);
      setPicks(picksData as DraftPickRow[]);
      setAllegiances(allegianceData as AllegianceRow[]);
    } catch {
      setError("Failed to load draft data");
    }
    setLoading(false);
  }, [leagueId]);

  useEffect(() => { loadDraftData(); }, [loadDraftData]);

  // Poll during active draft
  useEffect(() => {
    if (!["country_draft", "player_draft"].includes(draftStatus)) return;
    const interval = setInterval(() => { loadDraftData(); refreshLeague(); }, 3000);
    return () => clearInterval(interval);
  }, [draftStatus, loadDraftData, refreshLeague]);

  // Derived data
  const myAllegiance = allegiances.find((a) => a.user_id === user?.id);
  const allAllegiancesSubmitted = allegiances.length >= members.length && members.length > 0;
  const countryPicks = picks.filter((p) => p.pick_type === "country");
  const playerPicks = picks.filter((p) => p.pick_type === "player");
  const draftedCountryCodes = new Set(countryPicks.map((p) => p.country_code));
  const draftedPlayerIds = new Set(playerPicks.map((p) => p.player_id));
  const myCountries = countryPicks.filter((p) => p.user_id === user?.id).map((p) => WORLD_CUP_COUNTRIES.find((c) => c.code === p.country_code)).filter(Boolean);
  const myPlayers = playerPicks.filter((p) => p.user_id === user?.id).map((p) => PLAYER_POOL.find((pl) => pl.id === p.player_id)).filter(Boolean);

  const currentDrafterId = getCurrentDrafter(draftOrder, currentPickNumber);
  const currentDrafter = members.find((m) => m.id === currentDrafterId);
  const myTurn = user ? isMyTurn(user.id, draftOrder, currentPickNumber) : false;
  const currentRound = getCurrentRound(currentPickNumber, draftOrder.length);
  const pickInRound = getPickInRound(currentPickNumber, draftOrder.length);
  const activeRounds = draftStatus === "country_draft" ? countriesPerPerson : playersPerPerson;
  const phaseComplete = isDraftPhaseComplete(currentPickNumber, draftOrder.length, activeRounds);

  const availableCountries = useMemo(() =>
    WORLD_CUP_COUNTRIES
      .filter((c) => !c.code.startsWith("TBD") && !draftedCountryCodes.has(c.code))
      .filter((c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.fifaRanking - b.fifaRanking),
    [draftedCountryCodes, searchQuery]
  );

  const availablePlayers = useMemo(() =>
    PLAYER_POOL
      .filter((p) => !draftedPlayerIds.has(p.id))
      .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.country.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.rating - a.rating),
    [draftedPlayerIds, searchQuery]
  );

  const getMemberName = (userId: string) => members.find((m) => m.id === userId)?.name || "Unknown";

  // Handlers
  const handleAllegiance = async (code: string) => {
    if (!leagueId) return;
    setSubmitting(true); setError(null);
    try { await setAllegiance(leagueId, { country_code: code }); await loadDraftData(); }
    catch { setError("Failed to set allegiance"); }
    setSubmitting(false);
  };

  const handlePick = async (type: "country" | "player", id: string) => {
    if (!leagueId || !myTurn) return;
    setSubmitting(true); setError(null);
    try {
      await makeDraftPick(leagueId, {
        pick_type: type,
        ...(type === "country" ? { country_code: id } : { player_id: id }),
        round: currentRound,
        pick_number: currentPickNumber,
      });
      await loadDraftData();
      await refreshLeague();
    } catch { setError("Failed to make pick"); }
    setSubmitting(false);
  };

  const handleRandomizeOrder = async () => {
    if (!leagueId || !isAdmin) return;
    try { await setDraftOrder(leagueId, generateRandomDraftOrder(members.map((m) => m.id))); await refreshLeague(); }
    catch { setError("Failed to set draft order"); }
  };

  const handleAdvance = async (status: string) => {
    if (!leagueId || !isAdmin) return;
    try {
      if (status === "country_draft") await revealAllegiances(leagueId);
      else await updateDraftStatus(leagueId, status);
      await refreshLeague();
    } catch { setError("Failed to advance draft"); }
  };

  if (!leagueId) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-6xl">📋</div>
        <h1 className="text-3xl font-black">The Draft Room</h1>
        <p className="text-[var(--muted)]">Join a league to start drafting.</p>
        <Link href="/admin" className="inline-block px-6 py-3 bg-[var(--gold)] text-[var(--background)] font-bold rounded-xl">Join a League →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black"><span className="text-shimmer">The Draft Room</span></h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            {draftStatus === "pre_draft" && "Waiting for draft night"}
            {draftStatus === "allegiance" && "Pick your heart team — blind picks!"}
            {draftStatus === "country_draft" && "Snake draft — pick your countries"}
            {draftStatus === "player_draft" && "Snake draft — build your squad"}
            {draftStatus === "complete" && "Draft complete!"}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          draftStatus === "complete" ? "bg-[var(--emerald)]/10 text-[var(--emerald)]"
          : ["country_draft", "player_draft"].includes(draftStatus) ? "bg-[var(--gold)]/10 text-[var(--gold)]"
          : "bg-[var(--surface-light)] text-[var(--muted)]"
        }`}>{draftStatus.replace("_", " ")}</span>
      </div>

      {error && <div className="p-3 rounded-xl bg-[var(--crimson)]/10 text-[var(--crimson)] text-sm">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface)] rounded-lg p-1">
        {([
          { id: "live" as DraftTab, label: "Draft", icon: "📋" },
          { id: "my-team" as DraftTab, label: "My Team", icon: "⚽" },
          { id: "board" as DraftTab, label: "History", icon: "📊" },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-all ${
            tab === t.id ? "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20" : "text-[var(--muted)]"
          }`}><span>{t.icon}</span> {t.label}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-8"><div className="text-2xl animate-spin">⚽</div></div> : (
        <AnimatePresence mode="wait">
          {tab === "live" && (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* PRE-DRAFT */}
              {draftStatus === "pre_draft" && (
                <div className="rounded-2xl bg-[var(--surface)] p-8 text-center space-y-4">
                  <div className="text-5xl">🌙</div>
                  <h2 className="text-2xl font-black">Draft Night is Coming</h2>
                  <p className="text-[var(--muted)]">{members.length} players in the league</p>
                  {isAdmin ? (
                    <div className="space-y-3 pt-4">
                      <button onClick={handleRandomizeOrder} className="w-full py-3 bg-[var(--surface-light)] rounded-xl font-bold hover:bg-[var(--surface-border)]">🎲 Randomize Draft Order</button>
                      {draftOrder.length > 0 && (
                        <>
                          <div className="text-xs text-[var(--muted)]">Order: {draftOrder.map((id, i) => `${i + 1}. ${getMemberName(id)}`).join(", ")}</div>
                          <button onClick={() => handleAdvance("allegiance")} className="w-full py-3 bg-[var(--gold)] text-[var(--background)] rounded-xl font-black hover:bg-[var(--gold-dim)]">Start Allegiance Picks →</button>
                        </>
                      )}
                    </div>
                  ) : <p className="text-sm text-[var(--muted)]">Waiting for admin to start the draft...</p>}
                </div>
              )}

              {/* ALLEGIANCE */}
              {draftStatus === "allegiance" && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[var(--surface)] p-6 text-center space-y-3">
                    <div className="text-4xl">❤️</div>
                    <h2 className="text-xl font-black">Allegiance Pick</h2>
                    <p className="text-sm text-[var(--muted)]">Pick your heart team. Blind picks — revealed all at once.</p>
                    <div className="text-xs text-[var(--muted)]">{allegiances.length} of {members.length} submitted</div>
                  </div>
                  {myAllegiance ? (
                    <div className="rounded-2xl bg-[var(--gold)]/5 border border-[var(--gold)]/20 p-6 text-center space-y-2">
                      <div className="text-4xl">{WORLD_CUP_COUNTRIES.find((c) => c.code === myAllegiance.country_code)?.flag}</div>
                      <div className="font-black">{WORLD_CUP_COUNTRIES.find((c) => c.code === myAllegiance.country_code)?.name}</div>
                      <p className="text-xs text-[var(--muted)]">Locked in. Waiting for others...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {WORLD_CUP_COUNTRIES.filter((c) => !c.code.startsWith("TBD")).map((c) => (
                        <motion.button key={c.code} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleAllegiance(c.code)} disabled={submitting}
                          className="rounded-2xl p-3 text-center bg-[var(--surface)] hover:bg-[var(--surface-light)] disabled:opacity-50">
                          <div className="text-3xl mb-1">{c.flag}</div>
                          <div className="text-[10px] font-bold">{c.name}</div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  {isAdmin && allAllegiancesSubmitted && (
                    <button onClick={() => handleAdvance("country_draft")} className="w-full py-3 bg-[var(--gold)] text-[var(--background)] rounded-xl font-black">Reveal & Start Country Draft →</button>
                  )}
                </div>
              )}

              {/* COUNTRY / PLAYER DRAFT */}
              {["country_draft", "player_draft"].includes(draftStatus) && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[var(--surface)] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${myTurn ? "bg-[var(--emerald)] pulse-live" : "bg-[var(--muted)]"}`} />
                      <span className="font-bold">{myTurn ? <span className="text-[var(--emerald)]">Your pick!</span> : <>Waiting for <span className="text-[var(--gold)]">{currentDrafter?.name}</span></>}</span>
                    </div>
                    <div className="text-xs text-[var(--muted)]">R{currentRound}/{activeRounds} · Pick {pickInRound}/{draftOrder.length}</div>
                  </div>

                  {phaseComplete && isAdmin && (
                    <button onClick={() => handleAdvance(draftStatus === "country_draft" ? "player_draft" : "complete")}
                      className="w-full py-3 bg-[var(--gold)] text-[var(--background)] rounded-xl font-black">
                      {draftStatus === "country_draft" ? "Start Player Draft →" : "Complete Draft 🎉"}
                    </button>
                  )}

                  {!phaseComplete && (
                    <>
                      {/* Confirm pick bar */}
                      {pendingPick && myTurn && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30">
                          <span className="text-2xl">
                            {pendingPick.type === "country"
                              ? WORLD_CUP_COUNTRIES.find((c) => c.code === pendingPick.id)?.flag
                              : PLAYER_POOL.find((p) => p.id === pendingPick.id)?.name}
                          </span>
                          <div className="flex-1 font-bold text-sm">
                            {pendingPick.type === "country"
                              ? WORLD_CUP_COUNTRIES.find((c) => c.code === pendingPick.id)?.name
                              : `${PLAYER_POOL.find((p) => p.id === pendingPick.id)?.name} (${PLAYER_POOL.find((p) => p.id === pendingPick.id)?.rating})`}
                          </div>
                          <button onClick={() => setPendingPick(null)}
                            className="px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)]">Cancel</button>
                          <button
                            onClick={async () => { await handlePick(pendingPick.type, pendingPick.id); setPendingPick(null); }}
                            disabled={submitting}
                            className="px-4 py-2 bg-[var(--gold)] text-[var(--background)] font-black rounded-xl hover:bg-[var(--gold-dim)] disabled:opacity-50 text-sm">
                            {submitting ? "Picking..." : "Confirm Pick ✓"}
                          </button>
                        </motion.div>
                      )}

                      <input type="text" placeholder={draftStatus === "country_draft" ? "Search countries..." : "Search players..."}
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--gold)]/50" />
                      {draftStatus === "country_draft" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
                          {availableCountries.map((c) => <CountryCard key={c.code} country={c} disabled={!myTurn || submitting} selected={pendingPick?.id === c.code} onClick={() => setPendingPick({ type: "country", id: c.code })} />)}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
                          {availablePlayers.map((p) => <FutCard key={p.id} player={p} compact selected={pendingPick?.id === p.id} onClick={myTurn && !submitting ? () => setPendingPick({ type: "player", id: p.id }) : undefined} />)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* COMPLETE */}
              {draftStatus === "complete" && (
                <div className="text-center space-y-6 py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-7xl">🏆</motion.div>
                  <h2 className="text-3xl font-black"><span className="text-shimmer">Draft Complete!</span></h2>
                  <p className="text-[var(--muted)]">Check the My Team tab to see your portfolio!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* MY TEAM */}
          {tab === "my-team" && (
            <motion.div key="team" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {myAllegiance && (
                <div className="rounded-2xl bg-gradient-to-r from-[var(--gold)]/10 via-transparent to-[var(--gold)]/10 p-6">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">❤️ Allegiance</div>
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">{WORLD_CUP_COUNTRIES.find((c) => c.code === myAllegiance.country_code)?.flag}</span>
                    <div className="text-2xl font-black">{WORLD_CUP_COUNTRIES.find((c) => c.code === myAllegiance.country_code)?.name}</div>
                  </div>
                </div>
              )}
              {myCountries.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Countries ({myCountries.length})</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{myCountries.map((c) => c && <CountryCard key={c.code} country={c} selected />)}</div>
                </div>
              )}
              {myPlayers.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Players ({myPlayers.length})</div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{myPlayers.map((p) => p && <FutCard key={p.id} player={p} />)}</div>
                </div>
              )}
              {!myAllegiance && myCountries.length === 0 && myPlayers.length === 0 && (
                <div className="text-center py-12 text-[var(--muted)]"><div className="text-4xl mb-3">📋</div><p>No picks yet.</p></div>
              )}
            </motion.div>
          )}

          {/* HISTORY */}
          {tab === "board" && (
            <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {draftStatus !== "pre_draft" && draftStatus !== "allegiance" && allegiances.length > 0 && (
                <div className="rounded-2xl bg-[var(--surface)] p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Allegiances</div>
                  <div className="flex flex-wrap gap-2">
                    {allegiances.map((a) => (
                      <div key={a.user_id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-light)] text-xs">
                        <span>{WORLD_CUP_COUNTRIES.find((c) => c.code === a.country_code)?.flag}</span>
                        <span className="font-bold">{getMemberName(a.user_id)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {[{ label: "Country Draft", items: countryPicks, type: "country" as const }, { label: "Player Draft", items: playerPicks, type: "player" as const }]
                .filter((s) => s.items.length > 0)
                .map((section) => (
                <div key={section.label} className="rounded-2xl bg-[var(--surface)] overflow-hidden">
                  <div className="px-4 py-2 bg-[var(--surface-light)] border-b border-[var(--surface-border)]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{section.label} ({section.items.length})</span>
                  </div>
                  <div className="divide-y divide-[var(--surface-border)]/50">
                    {section.items.map((pick, i) => {
                      const isMe = pick.user_id === user?.id;
                      const display = section.type === "country"
                        ? WORLD_CUP_COUNTRIES.find((c) => c.code === pick.country_code)
                        : PLAYER_POOL.find((p) => p.id === pick.player_id);
                      return (
                        <div key={pick.id} className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? "bg-[var(--gold)]/5" : ""}`}>
                          <span className="text-xs text-[var(--muted)] w-6 text-right font-mono">{i + 1}</span>
                          <span className={`font-bold text-sm w-24 ${isMe ? "text-[var(--gold)]" : ""}`}>{getMemberName(pick.user_id)}</span>
                          {section.type === "country" && display && "flag" in display && <><span className="text-xl">{display.flag}</span><span className="text-sm">{display.name}</span></>}
                          {section.type === "player" && display && "rating" in display && <><span className="text-sm font-mono text-[var(--gold)]">{display.rating}</span><span className="text-sm">{display.name}</span></>}
                          <span className="text-[10px] text-[var(--muted)] ml-auto">R{pick.round}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {countryPicks.length === 0 && playerPicks.length === 0 && (
                <div className="text-center py-12 text-[var(--muted)]"><div className="text-4xl mb-3">📋</div><p>No picks yet.</p></div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
