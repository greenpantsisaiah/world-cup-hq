"use server";

import { createServerSupabase } from "./supabase-server";
import { WORLD_CUP_COUNTRIES } from "@/data/countries";
import { PLAYER_POOL } from "@/data/players";

/**
 * Populate a league with a full mock tournament — draft, matches, predictions, scores.
 * Uses the league's REAL members but simulated game data.
 */
export async function runMockTournament(leagueId: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify admin
  const { data: league } = await supabase.from("leagues").select("*").eq("id", leagueId).single();
  if (!league || league.admin_id !== user.id) throw new Error("Only admin can run mock");

  // Get members
  const { data: members } = await supabase.from("league_members").select("user_id").eq("league_id", leagueId);
  if (!members || members.length < 2) throw new Error("Need at least 2 members");

  const memberIds = members.map((m) => m.user_id);
  const countries = WORLD_CUP_COUNTRIES.filter((c) => !c.code.startsWith("TBD"));
  const players = PLAYER_POOL;
  const countriesPerPerson = league.countries_per_person || 3;
  const playersPerPerson = league.players_per_person || 5;

  // ── 1. Set draft order + allegiances ──
  const shuffledMembers = [...memberIds].sort(() => Math.random() - 0.5);

  await supabase.from("leagues").update({
    draft_order: shuffledMembers,
    draft_status: "complete",
    current_pick_number: shuffledMembers.length * countriesPerPerson,
  }).eq("id", leagueId);

  // Allegiances — each member picks a random top-tier country
  const eliteCountries = countries.filter((c) => c.tier === "elite" || c.tier === "contender");
  for (const uid of memberIds) {
    const pick = eliteCountries[Math.floor(Math.random() * eliteCountries.length)];
    await supabase.from("allegiances").upsert(
      { league_id: leagueId, user_id: uid, country_code: pick.code },
      { onConflict: "league_id,user_id" }
    );
  }

  // ── 2. Country draft (snake) ──
  const availableCountries = [...countries];
  let pickNum = 0;
  for (let round = 1; round <= countriesPerPerson; round++) {
    const order = round % 2 === 1 ? shuffledMembers : [...shuffledMembers].reverse();
    for (const uid of order) {
      if (availableCountries.length === 0) break;
      const idx = Math.floor(Math.random() * Math.min(5, availableCountries.length)); // bias toward top
      const country = availableCountries.splice(idx, 1)[0];
      await supabase.from("draft_picks").insert({
        league_id: leagueId, user_id: uid, pick_type: "country",
        country_code: country.code, round, pick_number: pickNum++,
      });
    }
  }

  // ── 3. Player draft (snake) ──
  const availablePlayers = [...players].sort((a, b) => b.rating - a.rating);
  pickNum = 0;
  for (let round = 1; round <= playersPerPerson; round++) {
    const order = round % 2 === 1 ? shuffledMembers : [...shuffledMembers].reverse();
    for (const uid of order) {
      if (availablePlayers.length === 0) break;
      const idx = Math.floor(Math.random() * Math.min(4, availablePlayers.length));
      const player = availablePlayers.splice(idx, 1)[0];
      await supabase.from("draft_picks").insert({
        league_id: leagueId, user_id: uid, pick_type: "player",
        player_id: player.id, round, pick_number: pickNum++,
      });
    }
  }

  // ── 4. Create 6 matches over 3 days ──
  const matchups = [
    { home: "US", away: "MA", day: 0, stage: "group", group: "A" },
    { home: "FR", away: "DK", day: 0, stage: "group", group: "B" },
    { home: "AR", away: "EG", day: 1, stage: "group", group: "C" },
    { home: "BR", away: "SN", day: 1, stage: "group", group: "E" },
    { home: "DE", away: "KR", day: 2, stage: "group", group: "F" },
    { home: "ES", away: "NG", day: 2, stage: "group", group: "G" },
  ];

  const results = [
    { home: 2, away: 1, scorer: "pulisic", motm: "pulisic" },
    { home: 3, away: 0, scorer: "mbappe", motm: "mbappe" },
    { home: 1, away: 1, scorer: "salah", motm: "salah" },
    { home: 2, away: 0, scorer: "vinicius", motm: "vinicius" },
    { home: 1, away: 2, scorer: "son", motm: "son" },
    { home: 2, away: 1, scorer: "yamal", motm: "yamal" },
  ];

  const goalEvents = [
    [{ pid: "pulisic", cc: "US", min: 23 }, { pid: "weah", cc: "US", min: 67 }, { pid: "hakimi", cc: "MA", min: 45 }],
    [{ pid: "mbappe", cc: "FR", min: 12 }, { pid: "mbappe", cc: "FR", min: 55 }, { pid: "griezmann", cc: "FR", min: 78 }],
    [{ pid: "messi", cc: "AR", min: 34 }, { pid: "salah", cc: "EG", min: 61 }],
    [{ pid: "vinicius", cc: "BR", min: 28 }, { pid: "rodrygo", cc: "BR", min: 72 }],
    [{ pid: "musiala", cc: "DE", min: 15 }, { pid: "son", cc: "KR", min: 38 }, { pid: "son", cc: "KR", min: 81 }],
    [{ pid: "yamal", cc: "ES", min: 44 }, { pid: "pedri", cc: "ES", min: 69 }],
  ];

  const baseDate = new Date();
  const matchIds: string[] = [];

  for (let i = 0; i < matchups.length; i++) {
    const m = matchups[i];
    const r = results[i];
    const matchDay = new Date(baseDate);
    matchDay.setDate(matchDay.getDate() - (2 - m.day)); // spread over last 3 days

    const { data: match } = await supabase.from("matches").insert({
      home_country: m.home, away_country: m.away,
      match_day: matchDay.toISOString().split("T")[0],
      kickoff: new Date(matchDay.getTime() + 15 * 3600000).toISOString(), // 3pm
      stage: m.stage, group_letter: m.group,
      home_score: r.home, away_score: r.away,
      is_complete: true, first_scorer: r.scorer, man_of_the_match: r.motm,
    }).select("id").single();

    if (match) {
      matchIds.push(match.id);
      // Add goal events
      for (const g of goalEvents[i]) {
        await supabase.from("match_events").insert({
          match_id: match.id, player_id: g.pid, country_code: g.cc,
          event_type: "goal", minute: g.min,
        });
      }
      // Add MOTM event
      await supabase.from("match_events").insert({
        match_id: match.id, player_id: r.motm,
        country_code: goalEvents[i][0].cc, event_type: "motm",
      });
    }
  }

  // ── 5. Generate predictions for each member ──
  for (const uid of memberIds) {
    for (let i = 0; i < matchIds.length; i++) {
      const m = matchups[i];
      const winners = ["home", "away", "draw"];
      const goals = ["over", "under"];
      const scorers = goalEvents[i].map((g) => g.pid);

      await supabase.from("predictions").upsert({
        league_id: leagueId, user_id: uid, match_id: matchIds[i],
        predicted_winner: winners[Math.floor(Math.random() * 3)],
        predicted_total_goals: goals[Math.floor(Math.random() * 2)],
        predicted_first_scorer: scorers[Math.floor(Math.random() * scorers.length)],
      }, { onConflict: "league_id,user_id,match_id" });
    }
  }

  // ── 6. Generate daily picks ──
  for (const uid of memberIds) {
    for (let day = 0; day < 3; day++) {
      const matchDay = new Date(baseDate);
      matchDay.setDate(matchDay.getDate() - (2 - day));
      const dayMatches = matchups.filter((m) => m.day === day);
      const dayCountries = dayMatches.flatMap((m) => [m.home, m.away]);
      const dayPlayers = players.filter((p) => dayCountries.includes(p.countryCode));

      if (dayCountries.length > 0 && dayPlayers.length > 0) {
        await supabase.from("daily_picks").upsert({
          league_id: leagueId, user_id: uid,
          pick_date: matchDay.toISOString().split("T")[0],
          country_of_the_day: dayCountries[Math.floor(Math.random() * dayCountries.length)],
          player_of_the_day: dayPlayers[Math.floor(Math.random() * dayPlayers.length)].id,
        }, { onConflict: "league_id,user_id,pick_date" });
      }
    }
  }

  // ── 7. Score all matches ──
  const { scoreCompletedMatch } = await import("./scoring-engine");
  for (const matchId of matchIds) {
    await scoreCompletedMatch(matchId, leagueId);
  }

  // ── 8. Create a hot take ──
  await supabase.from("hot_takes").insert({
    league_id: leagueId, author_id: memberIds[0],
    text: "Argentina will win the whole tournament",
    locks_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: "open",
  });

  return { matches: matchIds.length, members: memberIds.length };
}

/**
 * Reset a league back to pre-tournament state.
 * Keeps league config + members. Wipes all game data.
 */
export async function resetLeague(leagueId: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: league } = await supabase.from("leagues").select("admin_id").eq("id", leagueId).single();
  if (!league || league.admin_id !== user.id) throw new Error("Only admin can reset");

  // Delete all game data in order (foreign keys)
  await supabase.from("hot_take_votes").delete().in("hot_take_id",
    (await supabase.from("hot_takes").select("id").eq("league_id", leagueId)).data?.map((t) => t.id) || []
  );
  await supabase.from("hot_takes").delete().eq("league_id", leagueId);
  await supabase.from("h2h_matchups").delete().eq("league_id", leagueId);
  await supabase.from("predictions").delete().eq("league_id", leagueId);
  await supabase.from("daily_picks").delete().eq("league_id", leagueId);
  await supabase.from("draft_picks").delete().eq("league_id", leagueId);
  await supabase.from("allegiances").delete().eq("league_id", leagueId);

  // Reset scores to zero
  await supabase.from("user_scores").update({
    allegiance: 0, country_draft: 0, player_draft: 0,
    predictions: 0, daily_picks: 0, head_to_head: 0, hot_takes: 0,
    total: 0, h2h_wins: 0, h2h_losses: 0, h2h_draws: 0,
    prediction_streak: 0,
  }).eq("league_id", leagueId);

  // Reset league draft state
  await supabase.from("leagues").update({
    draft_status: "pre_draft",
    draft_order: [],
    current_pick_number: 0,
  }).eq("id", leagueId);

  // Note: matches/match_events are global (not league-scoped), so we don't delete them
  // They're shared across all leagues

  return { success: true };
}
