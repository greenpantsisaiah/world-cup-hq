"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { getMyLeagues, getLeague, getLeagueMembers } from "@/lib/supabase-actions";

interface LeagueData {
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
  draft_order?: string[];
  current_pick_number?: number;
}

interface MemberData {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface LeagueContextType {
  league: LeagueData | null;
  leagueId: string | null;
  members: MemberData[];
  isAdmin: boolean;
  loading: boolean;
  allLeagues: LeagueData[];
  switchLeague: (leagueId: string) => void;
  refreshLeague: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

const LeagueContext = createContext<LeagueContextType | null>(null);

const STORAGE_KEY = "wchq_active_league";

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [league, setLeague] = useState<LeagueData | null>(null);
  const [allLeagues, setAllLeagues] = useState<LeagueData[]>([]);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = !!(user && league && league.admin_id === user.id);
  const leagueId = league?.id || null;

  // Load leagues when user signs in
  useEffect(() => {
    if (!user) {
      setLeague(null);
      setAllLeagues([]);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getMyLeagues()
      .then((leagues) => {
        const typed = leagues as LeagueData[];
        setAllLeagues(typed);

        if (typed.length === 0) {
          setLeague(null);
          setLoading(false);
          return;
        }

        // Restore last active league from localStorage
        const savedId = localStorage.getItem(STORAGE_KEY);
        const saved = typed.find((l) => l.id === savedId);
        const active = saved || typed[0];

        setLeague(active);
        localStorage.setItem(STORAGE_KEY, active.id);

        // Load members
        getLeagueMembers(active.id).then((m) => {
          setMembers(m as MemberData[]);
          setLoading(false);
        });
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user]);

  async function switchLeague(newLeagueId: string) {
    const target = allLeagues.find((l) => l.id === newLeagueId);
    if (!target) return;

    setLeague(target);
    localStorage.setItem(STORAGE_KEY, newLeagueId);

    const m = await getLeagueMembers(newLeagueId);
    setMembers(m as MemberData[]);
  }

  async function refreshLeague() {
    if (!leagueId) return;
    try {
      const updated = await getLeague(leagueId);
      if (updated) {
        setLeague(updated as LeagueData);
        // Also refresh allLeagues
        setAllLeagues((prev) =>
          prev.map((l) => (l.id === leagueId ? (updated as LeagueData) : l))
        );
      }
    } catch {
      // League may have been deleted
    }
  }

  async function refreshMembers() {
    if (!leagueId) return;
    const m = await getLeagueMembers(leagueId);
    setMembers(m as MemberData[]);
  }

  return (
    <LeagueContext.Provider
      value={{
        league,
        leagueId,
        members,
        isAdmin,
        loading,
        allLeagues,
        switchLeague,
        refreshLeague,
        refreshMembers,
      }}
    >
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error("useLeague must be used within a LeagueProvider");
  }
  return context;
}
