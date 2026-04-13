"use server";

import { createServerSupabase } from "./supabase-server";
import {
  createLeagueSchema,
  inviteCodeSchema,
  hotTakeSchema,
  draftPickSchema,
  predictionSchema,
  dailyPickSchema,
  allegianceSchema,
  h2hLineupSchema,
  hotTakeVoteSchema,
  leagueIdSchema,
  dateSchema,
} from "./validations";

async function getAuthenticatedUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

// ─── League Actions ──────────────────────────────────────────

export async function createLeague(config: {
  name: string;
  scoring_preset: string;
  draft_mode: string;
  countries_per_person: number;
  players_per_person: number;
  max_participants: number;
  allegiance_enabled: boolean;
  hot_takes_enabled: boolean;
  ban_boost_enabled: boolean;
  async_draft: boolean;
}) {
  const { supabase, user } = await getAuthenticatedUser();
  const validated = createLeagueSchema.parse(config);

  const { data: league, error } = await supabase
    .from("leagues")
    .insert({ ...validated, admin_id: user.id })
    .select()
    .single();

  if (error) throw new Error("Failed to create league");

  await supabase
    .from("league_members")
    .insert({ league_id: league.id, user_id: user.id });

  return league;
}

export async function joinLeagueByCode(inviteCode: string) {
  const { supabase, user } = await getAuthenticatedUser();
  const validated = inviteCodeSchema.parse(inviteCode.trim());

  // Use security definer function to bypass RLS for invite code lookup
  // (non-members can't SELECT from leagues directly)
  const { data: lookupResult } = await supabase
    .rpc("lookup_league_by_invite_code", { code: validated });

  const league = lookupResult?.[0];
  if (!league) throw new Error("League not found");

  // Enforce max_participants
  const { count } = await supabase
    .from("league_members")
    .select("*", { count: "exact", head: true })
    .eq("league_id", league.id);

  if (count !== null && count >= league.max_participants) {
    throw new Error("League is full");
  }

  const { error } = await supabase
    .from("league_members")
    .insert({ league_id: league.id, user_id: user.id });

  if (error) {
    if (error.code === "23505") throw new Error("Already a member of this league");
    throw new Error("Failed to join league");
  }

  return league;
}

export async function getMyLeagues() {
  const { supabase, user } = await getAuthenticatedUser();
  const { data } = await supabase
    .from("league_members")
    .select("league_id, leagues(*)")
    .eq("user_id", user.id);
  return data?.map((m) => (m as Record<string, unknown>).leagues) ?? [];
}

export async function getLeague(leagueId: string) {
  const lid = leagueIdSchema.parse(leagueId);
  const { supabase } = await getAuthenticatedUser();
  const { data } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", lid)
    .single();
  return data;
}

export async function getLeagueMembers(leagueId: string) {
  const lid = leagueIdSchema.parse(leagueId);
  const { supabase } = await getAuthenticatedUser();
  const { data } = await supabase
    .from("league_members")
    .select("user_id, profiles(id, name, avatar_url)")
    .eq("league_id", lid);
  return data?.map((m) => (m as Record<string, unknown>).profiles) ?? [];
}

export async function updateDraftStatus(leagueId: string, status: string) {
  const lid = leagueIdSchema.parse(leagueId);
  const { supabase, user } = await getAuthenticatedUser();

  // Verify caller is league admin
  const { data: league } = await supabase
    .from("leagues")
    .select("admin_id")
    .eq("id", lid)
    .single();

  if (!league || league.admin_id !== user.id) {
    throw new Error("Only the league admin can update draft status");
  }

  const validStatuses = ["pre_draft", "allegiance", "country_draft", "player_draft", "complete"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid draft status");
  }

  const { error } = await supabase
    .from("leagues")
    .update({ draft_status: status })
    .eq("id", lid);
  if (error) throw new Error("Failed to update draft status");
}

// ─── Draft Actions ───────────────────────────────────────────

export async function setAllegiance(leagueId: string, input: { country_code: string }) {
  const lid = leagueIdSchema.parse(leagueId);
  const { supabase, user } = await getAuthenticatedUser();
  const validated = allegianceSchema.parse(input);

  const { error } = await supabase
    .from("allegiances")
    .upsert(
      { league_id: lid, user_id: user.id, country_code: validated.country_code },
      { onConflict: "league_id,user_id" }
    );
  if (error) throw new Error("Failed to set allegiance");
}

export async function getAllegiances(leagueId: string) {
  const lid = leagueIdSchema.parse(leagueId);
  const { supabase } = await getAuthenticatedUser();
  const { data } = await supabase
    .from("allegiances")
    .select("user_id, country_code")
    .eq("league_id", lid);
  return data ?? [];
}

export async function makeDraftPick(leagueId: string, input: {
  pick_type: "country" | "player";
  country_code?: string;
  player_id?: string;
  round: number;
  pick_number: number;
}) {
  const lid = leagueIdSchema.parse(leagueId);
  const { supabase, user } = await getAuthenticatedUser();
  const validated = draftPickSchema.parse(input);

  const { error } = await supabase
    .from("draft_picks")
    .insert({ league_id: lid, user_id: user.id, ...validated });
  if (error) throw new Error("Failed to make draft pick");
}

export async function getDraftPicks(leagueId: string) {
  const lid = leagueIdSchema.parse(leagueId);
  const { supabase } = await getAuthenticatedUser();
  const { data } = await supabase
    .from("draft_picks")
    .select("*")
    .eq("league_id", lid)
    .order("pick_number");
  return data ?? [];
}

// ─── Prediction Actions ──────────────────────────────────────

export async function submitPrediction(leagueId: string, input: {
  match_id: string;
  predicted_winner: string;
  predicted_total_goals: string;
  predicted_first_scorer?: string;
  banned_player_id?: string;
  boosted_player_id?: string;
}) {
  const lid = leagueIdSchema.parse(leagueId);
  const { supabase, user } = await getAuthenticatedUser();
  const validated = predictionSchema.parse(input);

  const { error } = await supabase
    .from("predictions")
    .upsert(
      { league_id: lid, user_id: user.id, ...validated },
      { onConflict: "league_id,user_id,match_id" }
    );
  if (error) throw new Error("Failed to submit prediction");
}

// ─── Daily Picks ─────────────────────────────────────────────

export async function submitDailyPick(leagueId: string, input: {
  pick_date: string;
  country_of_the_day: string;
  player_of_the_day: string;
}) {
  const lid = leagueIdSchema.parse(leagueId);
  const { supabase, user } = await getAuthenticatedUser();
  const validated = dailyPickSchema.parse(input);

  const { error } = await supabase
    .from("daily_picks")
    .upsert(
      { league_id: lid, user_id: user.id, ...validated },
      { onConflict: "league_id,user_id,pick_date" }
    );
  if (error) throw new Error("Failed to submit daily pick");
}

export async function getDailyPicks(leagueId: string, date: string) {
  const lid = leagueIdSchema.parse(leagueId);
  const validDate = dateSchema.parse(date);
  const { supabase } = await getAuthenticatedUser();
  const { data } = await supabase
    .from("daily_picks")
    .select("*, profiles(name)")
    .eq("league_id", lid)
    .eq("pick_date", validDate);
  return data ?? [];
}

// ─── Hot Takes ───────────────────────────────────────────────

export async function submitHotTake(leagueId: string, input: { text: string; locks_at: string }) {
  const lid = leagueIdSchema.parse(leagueId);
  const { supabase, user } = await getAuthenticatedUser();
  const validated = hotTakeSchema.parse(input);

  const { data, error } = await supabase
    .from("hot_takes")
    .insert({
      league_id: lid,
      author_id: user.id,
      text: validated.text,
      locks_at: validated.locks_at,
    })
    .select()
    .single();
  if (error) throw new Error("Failed to submit hot take");
  return data;
}

export async function voteHotTake(input: { hot_take_id: string; vote: "back" | "fade" }) {
  const { supabase, user } = await getAuthenticatedUser();
  const validated = hotTakeVoteSchema.parse(input);

  const { error } = await supabase
    .from("hot_take_votes")
    .upsert(
      { hot_take_id: validated.hot_take_id, user_id: user.id, vote: validated.vote },
      { onConflict: "hot_take_id,user_id" }
    );
  if (error) throw new Error("Failed to vote on hot take");
}

export async function getHotTakes(leagueId: string) {
  const lid = leagueIdSchema.parse(leagueId);
  const { supabase } = await getAuthenticatedUser();
  const { data } = await supabase
    .from("hot_takes")
    .select("*, hot_take_votes(*), profiles!hot_takes_author_id_fkey(name)")
    .eq("league_id", lid)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ─── H2H ─────────────────────────────────────────────────────

export async function setH2HLineup(input: { matchup_id: string; lineup: string[] }) {
  const { supabase, user } = await getAuthenticatedUser();
  const validated = h2hLineupSchema.parse(input);

  const { data: matchup } = await supabase
    .from("h2h_matchups")
    .select("user1_id, user2_id")
    .eq("id", validated.matchup_id)
    .single();

  if (!matchup) throw new Error("Matchup not found");
  if (matchup.user1_id !== user.id && matchup.user2_id !== user.id) {
    throw new Error("You are not a participant in this matchup");
  }

  const field = matchup.user1_id === user.id ? "user1_lineup" : "user2_lineup";
  const { error } = await supabase
    .from("h2h_matchups")
    .update({ [field]: validated.lineup })
    .eq("id", validated.matchup_id);
  if (error) throw new Error("Failed to set lineup");
}
