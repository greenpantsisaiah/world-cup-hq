"use server";

import { createServerSupabase } from "./supabase-server";
import {
  COUNTRY_SCORING,
  PLAYER_SCORING,
  PREDICTION_SCORING,
  DAILY_PICK_SCORING,
  calcCountryMatchPoints,
} from "./scoring";

/**
 * Score a completed match for all users in a league.
 * Called when admin marks a match as complete.
 *
 * Calculates:
 * 1. Country draft points (for users who drafted the playing countries)
 * 2. Allegiance points (same as country but 50% rate)
 * 3. Player draft points (from match events)
 * 4. Prediction points (correct winner, over/under, first scorer)
 * 5. Daily pick points (country of the day, player of the day)
 */
export async function scoreCompletedMatch(matchId: string, leagueId: string) {
  const supabase = await createServerSupabase();

  // 1. Fetch match + events
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (!match || !match.is_complete) return;

  const { data: events } = await supabase
    .from("match_events")
    .select("*")
    .eq("match_id", matchId);

  const matchEvents = events || [];

  // 2. Fetch all league members
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId);

  if (!members) return;

  // 3. Fetch draft picks and allegiances for this league
  const { data: draftPicks } = await supabase
    .from("draft_picks")
    .select("user_id, pick_type, country_code, player_id")
    .eq("league_id", leagueId);

  const { data: allegiances } = await supabase
    .from("allegiances")
    .select("user_id, country_code")
    .eq("league_id", leagueId);

  // 4. Fetch predictions for this match
  const { data: predictions } = await supabase
    .from("predictions")
    .select("user_id, predicted_winner, predicted_total_goals, predicted_first_scorer")
    .eq("league_id", leagueId)
    .eq("match_id", matchId);

  // 5. Fetch daily picks for this match day
  const { data: dailyPicks } = await supabase
    .from("daily_picks")
    .select("user_id, country_of_the_day, player_of_the_day")
    .eq("league_id", leagueId)
    .eq("pick_date", match.match_day);

  // Determine match result
  const homeScore = match.home_score || 0;
  const awayScore = match.away_score || 0;
  const isHomeWin = homeScore > awayScore;
  const isAwayWin = awayScore > homeScore;
  const isDraw = homeScore === awayScore;
  const totalGoals = homeScore + awayScore;
  const actualWinner = isHomeWin ? "home" : isAwayWin ? "away" : "draw";

  // Player events lookup
  const playerGoals: Record<string, number> = {};
  const playerAssists: Record<string, number> = {};
  const playerCards: Record<string, string[]> = {};
  const playerMotm: Record<string, boolean> = {};

  for (const event of matchEvents) {
    if (event.event_type === "goal") {
      playerGoals[event.player_id] = (playerGoals[event.player_id] || 0) + 1;
    } else if (event.event_type === "assist") {
      playerAssists[event.player_id] = (playerAssists[event.player_id] || 0) + 1;
    } else if (event.event_type === "yellow_card" || event.event_type === "red_card") {
      if (!playerCards[event.player_id]) playerCards[event.player_id] = [];
      playerCards[event.player_id].push(event.event_type);
    } else if (event.event_type === "motm") {
      playerMotm[event.player_id] = true;
    }
  }

  // Score each member
  const scoreDeltas: Record<string, {
    country_draft: number;
    allegiance: number;
    player_draft: number;
    predictions: number;
    daily_picks: number;
  }> = {};

  for (const member of members) {
    const uid = member.user_id;
    scoreDeltas[uid] = { country_draft: 0, allegiance: 0, player_draft: 0, predictions: 0, daily_picks: 0 };

    // ── Country Draft Scoring ──
    const userCountryPicks = (draftPicks || []).filter(
      (p) => p.user_id === uid && p.pick_type === "country"
    );

    for (const pick of userCountryPicks) {
      if (pick.country_code === match.home_country) {
        scoreDeltas[uid].country_draft += calcCountryMatchPoints(
          homeScore, awayScore, isHomeWin, isDraw, false
        );
      } else if (pick.country_code === match.away_country) {
        scoreDeltas[uid].country_draft += calcCountryMatchPoints(
          awayScore, homeScore, isAwayWin, isDraw, false
        );
      }
    }

    // ── Allegiance Scoring ──
    const userAllegiance = (allegiances || []).find((a) => a.user_id === uid);
    if (userAllegiance) {
      if (userAllegiance.country_code === match.home_country) {
        scoreDeltas[uid].allegiance += calcCountryMatchPoints(
          homeScore, awayScore, isHomeWin, isDraw, true
        );
      } else if (userAllegiance.country_code === match.away_country) {
        scoreDeltas[uid].allegiance += calcCountryMatchPoints(
          awayScore, homeScore, isAwayWin, isDraw, true
        );
      }
    }

    // ── Player Draft Scoring ──
    const userPlayerPicks = (draftPicks || []).filter(
      (p) => p.user_id === uid && p.pick_type === "player"
    );

    for (const pick of userPlayerPicks) {
      const pid = pick.player_id;
      if (!pid) continue;

      const goals = playerGoals[pid] || 0;
      const assists = playerAssists[pid] || 0;
      const cards = playerCards[pid] || [];
      const isMotm = playerMotm[pid] || false;

      let playerPts = 0;
      playerPts += goals * PLAYER_SCORING.GOAL;
      playerPts += assists * PLAYER_SCORING.ASSIST;
      if (isMotm) playerPts += PLAYER_SCORING.MAN_OF_THE_MATCH;
      for (const card of cards) {
        if (card === "yellow_card") playerPts += PLAYER_SCORING.YELLOW_CARD;
        if (card === "red_card") playerPts += PLAYER_SCORING.RED_CARD;
      }
      if (goals >= 3) playerPts += PLAYER_SCORING.HAT_TRICK_BONUS;

      scoreDeltas[uid].player_draft += playerPts;
    }

    // ── Prediction Scoring ──
    const userPred = (predictions || []).find((p) => p.user_id === uid);
    if (userPred) {
      if (userPred.predicted_winner === actualWinner) {
        scoreDeltas[uid].predictions += PREDICTION_SCORING.CORRECT_WINNER;
      }
      const predictedOver = userPred.predicted_total_goals === "over";
      const actualOver = totalGoals > 2;
      if ((predictedOver && actualOver) || (!predictedOver && !actualOver)) {
        scoreDeltas[uid].predictions += PREDICTION_SCORING.CORRECT_OVER_UNDER;
      }
      if (userPred.predicted_first_scorer && userPred.predicted_first_scorer === match.first_scorer) {
        scoreDeltas[uid].predictions += PREDICTION_SCORING.CORRECT_FIRST_SCORER;
      }
    }

    // ── Daily Pick Scoring ──
    const userDailyPick = (dailyPicks || []).find((p) => p.user_id === uid);
    if (userDailyPick) {
      // Country of the day: did the picked country win?
      if (
        (userDailyPick.country_of_the_day === match.home_country && isHomeWin) ||
        (userDailyPick.country_of_the_day === match.away_country && isAwayWin)
      ) {
        scoreDeltas[uid].daily_picks += DAILY_PICK_SCORING.COUNTRY_WIN;
      }
      // Player of the day: did they score?
      if (playerGoals[userDailyPick.player_of_the_day]) {
        scoreDeltas[uid].daily_picks += DAILY_PICK_SCORING.PLAYER_SCORES;
      }
      if (playerMotm[userDailyPick.player_of_the_day]) {
        scoreDeltas[uid].daily_picks += DAILY_PICK_SCORING.PLAYER_MOTM;
      }
    }
  }

  // ── Upsert score deltas into user_scores ──
  for (const uid of Object.keys(scoreDeltas)) {
    const delta = scoreDeltas[uid];
    const totalDelta = delta.country_draft + delta.allegiance + delta.player_draft + delta.predictions + delta.daily_picks;

    if (totalDelta === 0) continue;

    // Fetch current scores
    const { data: current } = await supabase
      .from("user_scores")
      .select("*")
      .eq("league_id", leagueId)
      .eq("user_id", uid)
      .single();

    const newScores = {
      allegiance: (current?.allegiance || 0) + delta.allegiance,
      country_draft: (current?.country_draft || 0) + delta.country_draft,
      player_draft: (current?.player_draft || 0) + delta.player_draft,
      predictions: (current?.predictions || 0) + delta.predictions,
      daily_picks: (current?.daily_picks || 0) + delta.daily_picks,
      total: (current?.total || 0) + totalDelta,
      last_updated: new Date().toISOString(),
    };

    await supabase
      .from("user_scores")
      .upsert(
        { league_id: leagueId, user_id: uid, ...newScores },
        { onConflict: "league_id,user_id" }
      );
  }

  return scoreDeltas;
}
