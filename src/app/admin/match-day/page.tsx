"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useLeague } from "@/components/league-provider";
import {
  createMatch,
  getMatchesByDate,
  updateMatchResult,
  addMatchEvent,
  deleteMatchEvent,
  deleteMatch,
  scoreMatch,
} from "@/lib/supabase-actions";
import { WORLD_CUP_COUNTRIES } from "@/data/countries";
import { PLAYER_POOL } from "@/data/players";

interface MatchRow {
  id: string;
  home_country: string;
  away_country: string;
  match_day: string;
  kickoff: string;
  stage: string;
  group_letter: string | null;
  home_score: number | null;
  away_score: number | null;
  is_complete: boolean;
  first_scorer: string | null;
  man_of_the_match: string | null;
  match_events: EventRow[];
}

interface EventRow {
  id: string;
  match_id: string;
  player_id: string;
  country_code: string;
  event_type: string;
  minute: number | null;
}

export default function MatchDayPage() {
  const { user } = useAuth();
  const { isAdmin, leagueId } = useLeague();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New match form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newHome, setNewHome] = useState("");
  const [newAway, setNewAway] = useState("");
  const [newStage, setNewStage] = useState("group");
  const [newGroup, setNewGroup] = useState("");
  const [newTime, setNewTime] = useState("15:00");
  const [creating, setCreating] = useState(false);

  // Result entry
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [saving, setSaving] = useState(false);

  // Event entry
  const [addingEventTo, setAddingEventTo] = useState<string | null>(null);
  const [eventPlayer, setEventPlayer] = useState("");
  const [eventType, setEventType] = useState("goal");
  const [eventMinute, setEventMinute] = useState(0);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMatchesByDate(selectedDate);
      setMatches(data as MatchRow[]);
    } catch {
      setError("Failed to load matches");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadMatches();
  }, [selectedDate, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateMatch = async () => {
    if (!newHome || !newAway || newHome === newAway) return;
    setCreating(true);
    setError(null);
    try {
      await createMatch({
        home_country: newHome,
        away_country: newAway,
        match_day: selectedDate,
        kickoff: `${selectedDate}T${newTime}:00Z`,
        stage: newStage,
        group_letter: newGroup || undefined,
      });
      setShowCreateForm(false);
      setNewHome("");
      setNewAway("");
      await loadMatches();
    } catch {
      setError("Failed to create match");
    }
    setCreating(false);
  };

  const handleSaveResult = async (matchId: string) => {
    setSaving(true);
    setError(null);
    try {
      await updateMatchResult(matchId, {
        home_score: homeScore,
        away_score: awayScore,
      });

      // Trigger scoring for this match across the league
      if (leagueId) {
        try {
          await scoreMatch(matchId, leagueId);
        } catch {
          // Scoring failed but match result is saved — not blocking
          setError("Match saved but scoring failed. Try rescoring later.");
        }
      }

      setEditingMatch(null);
      await loadMatches();
    } catch {
      setError("Failed to save result");
    }
    setSaving(false);
  };

  const handleAddEvent = async (matchId: string) => {
    if (!eventPlayer) return;
    setError(null);
    const player = PLAYER_POOL.find((p) => p.id === eventPlayer);
    try {
      await addMatchEvent({
        match_id: matchId,
        player_id: eventPlayer,
        country_code: player?.countryCode || "",
        event_type: eventType,
        minute: eventMinute || undefined,
      });
      setEventPlayer("");
      setEventMinute(0);
      await loadMatches();
    } catch {
      setError("Failed to add event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteMatchEvent(eventId);
      await loadMatches();
    } catch {
      setError("Failed to delete event");
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
      await deleteMatch(matchId);
      await loadMatches();
    } catch {
      setError("Failed to delete match");
    }
  };

  const getCountry = (code: string) => WORLD_CUP_COUNTRIES.find((c) => c.code === code);
  const getPlayer = (id: string) => PLAYER_POOL.find((p) => p.id === id);

  const eventIcons: Record<string, string> = {
    goal: "⚽", assist: "🎯", yellow_card: "🟨", red_card: "🟥",
    penalty_miss: "❌", clean_sheet: "🧤", motm: "⭐",
  };

  // Get players from both teams for a match
  const getMatchPlayers = (match: MatchRow) => {
    return PLAYER_POOL.filter(
      (p) => p.countryCode === match.home_country || p.countryCode === match.away_country
    );
  };

  if (!user) return <div className="text-center py-20 text-[var(--muted)]">Sign in to access.</div>;
  if (!isAdmin) return <div className="text-center py-20 text-[var(--muted)]"><div className="text-4xl mb-3">🔒</div><p className="font-bold">Admin Only</p><p className="text-sm mt-1">Only league admins can manage matches.</p></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black">
            <span className="text-shimmer">Match Day Control</span>
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Create matches, enter results, manage events
          </p>
        </div>
        {isAdmin && (
          <span className="px-3 py-1 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] text-[10px] font-bold">ADMIN</span>
        )}
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 1);
            setSelectedDate(d.toISOString().split("T")[0]);
          }}
          className="px-3 py-2 bg-[var(--surface)] rounded-xl hover:bg-[var(--surface-light)]"
        >
          ←
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex-1 px-4 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl text-center font-bold focus:outline-none focus:border-[var(--gold)]/50"
        />
        <button
          onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + 1);
            setSelectedDate(d.toISOString().split("T")[0]);
          }}
          className="px-3 py-2 bg-[var(--surface)] rounded-xl hover:bg-[var(--surface-light)]"
        >
          →
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[var(--crimson)]/10 text-[var(--crimson)] text-sm">{error}</div>
      )}

      {/* Matches for this date */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-2xl animate-spin">⚽</div>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.length === 0 && (
            <div className="text-center py-12 text-[var(--muted)]">
              <div className="text-4xl mb-3">📅</div>
              <p>No matches on this date</p>
            </div>
          )}

          {matches.map((match) => {
            const home = getCountry(match.home_country);
            const away = getCountry(match.away_country);
            const isEditing = editingMatch === match.id;
            const isAddingEvent = addingEventTo === match.id;
            const matchPlayers = getMatchPlayers(match);

            return (
              <div key={match.id} className={`rounded-2xl bg-[var(--surface)] overflow-hidden ${match.is_complete ? "ring-1 ring-[var(--emerald)]/30" : ""}`}>
                {/* Match header */}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{home?.flag}</span>
                      <span className="font-black">{home?.name}</span>
                    </div>
                    <div className="text-center">
                      {match.is_complete ? (
                        <div className="text-2xl font-black">
                          {match.home_score} — {match.away_score}
                        </div>
                      ) : (
                        <div className="text-lg font-bold text-[var(--gold)]">VS</div>
                      )}
                      <div className="text-[10px] text-[var(--muted)]">
                        {match.stage.toUpperCase()} {match.group_letter ? `· Group ${match.group_letter}` : ""}
                      </div>
                      {match.is_complete && (
                        <span className="text-[10px] text-[var(--emerald)] font-bold">✓ COMPLETE</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black">{away?.name}</span>
                      <span className="text-3xl">{away?.flag}</span>
                    </div>
                  </div>
                </div>

                {/* Events */}
                {match.match_events.length > 0 && (
                  <div className="px-5 pb-3 space-y-1">
                    {match.match_events.map((event) => {
                      const player = getPlayer(event.player_id);
                      return (
                        <div key={event.id} className="flex items-center gap-2 text-xs">
                          <span>{eventIcons[event.event_type] || "•"}</span>
                          <span className="font-bold">{player?.name || event.player_id}</span>
                          {event.minute && <span className="text-[var(--muted)]">{event.minute}&apos;</span>}
                          <span className="text-[var(--muted)]">{getCountry(event.country_code)?.flag}</span>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="ml-auto text-[var(--muted)] hover:text-[var(--crimson)] text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action buttons */}
                {!match.is_complete && (
                  <div className="px-5 pb-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setEditingMatch(isEditing ? null : match.id);
                        setHomeScore(match.home_score || 0);
                        setAwayScore(match.away_score || 0);
                      }}
                      className="px-3 py-1.5 bg-[var(--gold)]/10 text-[var(--gold)] rounded-lg text-xs font-bold hover:bg-[var(--gold)]/20"
                    >
                      {isEditing ? "Cancel" : "Enter Result"}
                    </button>
                    <button
                      onClick={() => setAddingEventTo(isAddingEvent ? null : match.id)}
                      className="px-3 py-1.5 bg-[var(--electric)]/10 text-[var(--electric)] rounded-lg text-xs font-bold hover:bg-[var(--electric)]/20"
                    >
                      {isAddingEvent ? "Cancel" : "+ Event"}
                    </button>
                    <button
                      onClick={() => handleDeleteMatch(match.id)}
                      className="px-3 py-1.5 bg-[var(--crimson)]/10 text-[var(--crimson)] rounded-lg text-xs font-bold hover:bg-[var(--crimson)]/20 ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                )}

                {/* Score entry form */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-3 border-t border-[var(--surface-border)]">
                        <div className="flex items-center gap-4 pt-3">
                          <div className="flex-1 text-center">
                            <label className="text-[10px] text-[var(--muted)]">{home?.name}</label>
                            <input
                              type="number"
                              min={0}
                              value={homeScore}
                              onChange={(e) => setHomeScore(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-center text-2xl font-black focus:outline-none"
                            />
                          </div>
                          <span className="text-[var(--muted)] font-bold">—</span>
                          <div className="flex-1 text-center">
                            <label className="text-[10px] text-[var(--muted)]">{away?.name}</label>
                            <input
                              type="number"
                              min={0}
                              value={awayScore}
                              onChange={(e) => setAwayScore(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-center text-2xl font-black focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleSaveResult(match.id)}
                          disabled={saving}
                          className="w-full py-2.5 bg-[var(--emerald)] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Mark Complete ✓"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add event form */}
                <AnimatePresence>
                  {isAddingEvent && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-3 border-t border-[var(--surface-border)]">
                        <div className="grid grid-cols-3 gap-2 pt-3">
                          <select
                            value={eventPlayer}
                            onChange={(e) => setEventPlayer(e.target.value)}
                            className="col-span-2 px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none"
                          >
                            <option value="">Select player</option>
                            {matchPlayers.map((p) => (
                              <option key={p.id} value={p.id}>
                                {getCountry(p.countryCode)?.flag} {p.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={0}
                            max={150}
                            placeholder="Min"
                            value={eventMinute || ""}
                            onChange={(e) => setEventMinute(Number(e.target.value))}
                            className="px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm text-center focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(eventIcons).map(([type, icon]) => (
                            <button
                              key={type}
                              onClick={() => setEventType(type)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                eventType === type
                                  ? "bg-[var(--gold)]/15 text-[var(--gold)] ring-1 ring-[var(--gold)]"
                                  : "bg-[var(--surface-light)] text-[var(--muted)]"
                              }`}
                            >
                              {icon} {type.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleAddEvent(match.id)}
                          disabled={!eventPlayer}
                          className="w-full py-2 bg-[var(--electric)] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm"
                        >
                          Add Event
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Create match form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="rounded-2xl bg-[var(--surface)] p-5 space-y-4 overflow-hidden"
          >
            <h3 className="font-black">New Match</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[var(--muted)] block mb-1">HOME</label>
                <select
                  value={newHome}
                  onChange={(e) => setNewHome(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Select</option>
                  {WORLD_CUP_COUNTRIES.filter((c) => !c.code.startsWith("TBD")).map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted)] block mb-1">AWAY</label>
                <select
                  value={newAway}
                  onChange={(e) => setNewAway(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Select</option>
                  {WORLD_CUP_COUNTRIES.filter((c) => !c.code.startsWith("TBD")).map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[var(--muted)] block mb-1">STAGE</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm focus:outline-none"
                >
                  {["group", "r16", "qf", "sf", "third_place", "final"].map((s) => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted)] block mb-1">GROUP</label>
                <input
                  type="text"
                  maxLength={2}
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value.toUpperCase())}
                  placeholder="A-L"
                  className="w-full px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm text-center focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted)] block mb-1">KICKOFF</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-light)] border border-[var(--surface-border)] rounded-xl text-sm text-center focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 py-2 text-[var(--muted)] text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMatch}
                disabled={creating || !newHome || !newAway || newHome === newAway}
                className="flex-1 py-2 bg-[var(--gold)] text-[var(--background)] font-bold rounded-xl hover:bg-[var(--gold-dim)] disabled:opacity-50 text-sm"
              >
                {creating ? "Creating..." : "Create Match"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create match button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full py-3 bg-[var(--surface)] rounded-2xl text-[var(--muted)] font-bold hover:bg-[var(--surface-light)] transition-colors"
        >
          + Create Match
        </button>
      )}
    </div>
  );
}
