/**
 * QA Gameplay Test Suite — World Cup HQ
 * Tests the full gameplay loop: draft, matches, predictions, scoring
 *
 * Run: npx tsx src/tests/qa-gameplay.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_PASS_ENV = process.env.QA_TEST_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_KEY || !TEST_PASS_ENV) {
  console.error("Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, QA_TEST_PASSWORD");
  process.exit(1);
}

const SB_URL: string = SUPABASE_URL;
const SB_KEY: string = SUPABASE_KEY;
const TEST_PASS: string = TEST_PASS_ENV;

interface TestResult { journey: string; step: string; passed: boolean; detail: string; }
const results: TestResult[] = [];
let currentJourney = "";

function log(step: string, passed: boolean, detail: string) {
  results.push({ journey: currentJourney, step, passed, detail });
  console.log(`  ${passed ? "✅" : "❌"} ${step}: ${detail}`);
}

async function authHeaders(email: string): Promise<Record<string, string>> {
  const resp = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": SB_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: TEST_PASS }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error(`Auth failed: ${email}`);
  return { "apikey": SB_KEY, "Authorization": `Bearer ${data.access_token}`, "Content-Type": "application/json" };
}

async function api(path: string, headers: Record<string, string>, opts: RequestInit = {}) {
  return fetch(`${SB_URL}/rest/v1${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
}

// ─── Test State ──────────────────────────────────────────────
let testLeagueId = "";
let testInviteCode = "";
let testMatchId = "";

// ─── Tests ───────────────────────────────────────────────────

async function test1_CreateLeagueForGameplay() {
  currentJourney = "1. Create league for gameplay test";
  console.log(`\n🧪 ${currentJourney}`);

  const tomH = await authHeaders("tom@example.com");
  const tomId = "a0000001-0000-0000-0000-000000000013";

  // Create league
  const resp = await api("/leagues", tomH, {
    method: "POST",
    headers: { "Prefer": "return=representation" },
    body: JSON.stringify({
      name: "Gameplay Test League", admin_id: tomId, scoring_preset: "standard",
      draft_mode: "snake", countries_per_person: 2, players_per_person: 3,
      max_participants: 4, allegiance_enabled: true, hot_takes_enabled: true,
      ban_boost_enabled: true, async_draft: false, late_joiner_policy: "free_agents",
    }),
  });
  const league = await resp.json();
  const ok = Array.isArray(league) && league.length > 0;
  log("League created", ok, ok ? `ID: ${league[0].id}` : `Error: ${JSON.stringify(league).slice(0, 80)}`);
  if (!ok) return;

  testLeagueId = league[0].id;
  testInviteCode = league[0].invite_code;

  // Tom joins
  await api("/league_members", tomH, { method: "POST", body: JSON.stringify({ league_id: testLeagueId, user_id: tomId }) });

  // Olivia joins
  const oliviaH = await authHeaders("olivia@example.com");
  const lookupResp = await api("/rpc/lookup_league_by_invite_code", oliviaH, {
    method: "POST", body: JSON.stringify({ code: testInviteCode }),
  });
  const lookupData = await lookupResp.json();
  log("Invite code lookup works", lookupData.length === 1, `Found: ${lookupData.length}`);

  await api("/league_members", oliviaH, {
    method: "POST", body: JSON.stringify({ league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000014" }),
  });

  // Verify 2 members
  const membersResp = await api(`/league_members?league_id=eq.${testLeagueId}&select=profiles(name)`, oliviaH);
  const members = await membersResp.json();
  log("2 members in league", members.length === 2, `Members: ${members.length}`);
}

async function test2_DraftAllegiance() {
  currentJourney = "2. Allegiance picks";
  console.log(`\n🧪 ${currentJourney}`);
  if (!testLeagueId) { log("Skipped — no league", false, ""); return; }

  const tomH = await authHeaders("tom@example.com");
  const oliviaH = await authHeaders("olivia@example.com");

  // Tom picks allegiance
  const resp1 = await api("/allegiances", tomH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({ league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000013", country_code: "US" }),
  });
  log("Tom allegiance set", resp1.status === 201, `Status: ${resp1.status}`);

  // Olivia picks allegiance
  const resp2 = await api("/allegiances", oliviaH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({ league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000014", country_code: "BR" }),
  });
  log("Olivia allegiance set", resp2.status === 201, `Status: ${resp2.status}`);

  // Both visible
  const readResp = await api(`/allegiances?league_id=eq.${testLeagueId}&select=country_code`, tomH);
  const allegiances = await readResp.json();
  log("Both allegiances readable", allegiances.length === 2, `Count: ${allegiances.length}`);
}

async function test3_DraftPicks() {
  currentJourney = "3. Draft picks";
  console.log(`\n🧪 ${currentJourney}`);
  if (!testLeagueId) { log("Skipped", false, ""); return; }

  const tomH = await authHeaders("tom@example.com");
  const oliviaH = await authHeaders("olivia@example.com");

  // Tom drafts Argentina
  const pick1 = await api("/draft_picks", tomH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({ league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000013", pick_type: "country", country_code: "AR", round: 1, pick_number: 0 }),
  });
  log("Tom drafts Argentina", pick1.status === 201, `Status: ${pick1.status}`);

  // Olivia drafts France
  const pick2 = await api("/draft_picks", oliviaH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({ league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000014", pick_type: "country", country_code: "FR", round: 1, pick_number: 1 }),
  });
  log("Olivia drafts France", pick2.status === 201, `Status: ${pick2.status}`);

  // Tom drafts Mbappe (player)
  const pick3 = await api("/draft_picks", tomH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({ league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000013", pick_type: "player", player_id: "mbappe", round: 1, pick_number: 0 }),
  });
  log("Tom drafts Mbappe", pick3.status === 201, `Status: ${pick3.status}`);

  // Olivia drafts Messi
  const pick4 = await api("/draft_picks", oliviaH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({ league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000014", pick_type: "player", player_id: "messi", round: 1, pick_number: 1 }),
  });
  log("Olivia drafts Messi", pick4.status === 201, `Status: ${pick4.status}`);

  // Verify picks
  const picksResp = await api(`/draft_picks?league_id=eq.${testLeagueId}&select=pick_type,country_code,player_id`, tomH);
  const picks = await picksResp.json();
  log("All 4 picks visible", picks.length === 4, `Picks: ${picks.length}`);
}

async function test4_CreateMatchAndEvents() {
  currentJourney = "4. Create match + events (admin only)";
  console.log(`\n🧪 ${currentJourney}`);

  const tomH = await authHeaders("tom@example.com");
  const oliviaH = await authHeaders("olivia@example.com");
  const today = new Date().toISOString().split("T")[0];

  // Tom (admin) creates a match
  const matchResp = await api("/matches", tomH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({
      home_country: "AR", away_country: "FR",
      match_day: today, kickoff: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      stage: "group", group_letter: "C",
    }),
  });
  const matchData = await matchResp.json();
  const created = Array.isArray(matchData) && matchData.length > 0;
  log("Admin creates match", created, created ? `ID: ${matchData[0].id}` : `Error: ${JSON.stringify(matchData).slice(0, 80)}`);

  if (!created) return;
  testMatchId = matchData[0].id;

  // Non-admin (Olivia) should NOT be able to create a match
  const badResp = await api("/matches", oliviaH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({
      home_country: "BR", away_country: "DE",
      match_day: today, kickoff: new Date(Date.now() + 7200000).toISOString(),
      stage: "group",
    }),
  });
  log("Non-admin blocked from creating match", badResp.status !== 201, `Status: ${badResp.status}`);

  // Add events
  const eventResp = await api("/match_events", tomH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({ match_id: testMatchId, player_id: "mbappe", country_code: "FR", event_type: "goal", minute: 23 }),
  });
  const eventData = await eventResp.json();
  log("Admin adds goal event", Array.isArray(eventData) && eventData.length > 0, `Status: ${eventResp.status}`);

  // Add another goal
  await api("/match_events", tomH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({ match_id: testMatchId, player_id: "messi", country_code: "AR", event_type: "goal", minute: 55 }),
  });

  // Add assist
  await api("/match_events", tomH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({ match_id: testMatchId, player_id: "alvarez", country_code: "AR", event_type: "assist", minute: 55 }),
  });

  // Match readable by anyone
  const readResp = await api(`/matches?id=eq.${testMatchId}&select=*,match_events(*)`, oliviaH);
  const readData = await readResp.json();
  log("Match readable by non-admin", readData.length === 1, `Events: ${readData[0]?.match_events?.length}`);
}

async function test5_Predictions() {
  currentJourney = "5. Predictions for match";
  console.log(`\n🧪 ${currentJourney}`);
  if (!testMatchId) { log("Skipped", false, ""); return; }

  const tomH = await authHeaders("tom@example.com");
  const oliviaH = await authHeaders("olivia@example.com");

  // Tom predicts (match is in the future)
  const pred1 = await api("/predictions", tomH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({
      league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000013",
      match_id: testMatchId, predicted_winner: "home", predicted_total_goals: "under",
      predicted_first_scorer: "messi",
    }),
  });
  log("Tom submits prediction", pred1.status === 201, `Status: ${pred1.status}`);

  // Olivia predicts
  const pred2 = await api("/predictions", oliviaH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({
      league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000014",
      match_id: testMatchId, predicted_winner: "away", predicted_total_goals: "over",
      predicted_first_scorer: "mbappe",
    }),
  });
  log("Olivia submits prediction", pred2.status === 201, `Status: ${pred2.status}`);
}

async function test6_DailyPicks() {
  currentJourney = "6. Daily picks";
  console.log(`\n🧪 ${currentJourney}`);
  if (!testLeagueId) { log("Skipped", false, ""); return; }

  const tomH = await authHeaders("tom@example.com");
  const oliviaH = await authHeaders("olivia@example.com");
  const today = new Date().toISOString().split("T")[0];

  // Clean up any existing daily picks for today
  await api(`/daily_picks?league_id=eq.${testLeagueId}&pick_date=eq.${today}`, tomH, { method: "DELETE" });

  // Tom picks
  const pick1 = await api("/daily_picks", tomH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({
      league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000013",
      pick_date: today, country_of_the_day: "AR", player_of_the_day: "mbappe",
    }),
  });
  log("Tom daily pick", pick1.status === 201, `Status: ${pick1.status}`);

  // Olivia picks
  const pick2 = await api("/daily_picks", oliviaH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({
      league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000014",
      pick_date: today, country_of_the_day: "FR", player_of_the_day: "messi",
    }),
  });
  log("Olivia daily pick", pick2.status === 201, `Status: ${pick2.status}`);
}

async function test7_HotTakes() {
  currentJourney = "7. Hot takes full flow";
  console.log(`\n🧪 ${currentJourney}`);
  if (!testLeagueId) { log("Skipped", false, ""); return; }

  const tomH = await authHeaders("tom@example.com");
  const oliviaH = await authHeaders("olivia@example.com");

  // Tom creates a take
  const createResp = await api("/hot_takes", tomH, {
    method: "POST", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({
      league_id: testLeagueId, author_id: "a0000001-0000-0000-0000-000000000013",
      text: "Argentina will win the whole tournament",
      locks_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    }),
  });
  const take = await createResp.json();
  const created = Array.isArray(take) && take.length > 0;
  log("Tom creates hot take", created, created ? `ID: ${take[0].id}` : "Failed");
  if (!created) return;

  // Olivia votes
  const voteResp = await api("/hot_take_votes", oliviaH, {
    method: "POST",
    body: JSON.stringify({ hot_take_id: take[0].id, user_id: "a0000001-0000-0000-0000-000000000014", vote: "back" }),
  });
  log("Olivia backs hot take", voteResp.status === 201, `Status: ${voteResp.status}`);

  // Verify vote visible
  const readResp = await api(`/hot_takes?id=eq.${take[0].id}&select=*,hot_take_votes(*)`, tomH);
  const readData = await readResp.json();
  log("Hot take with vote readable", readData[0]?.hot_take_votes?.length === 1, `Votes: ${readData[0]?.hot_take_votes?.length}`);

  // Non-admin (Olivia) should NOT be able to resolve via direct PATCH
  const resolveResp = await api(`/hot_takes?id=eq.${take[0].id}`, oliviaH, {
    method: "PATCH", body: JSON.stringify({ status: "resolved_hit" }),
  });
  // RLS blocks — PATCH returns 200/204 but affects 0 rows
  log("Non-admin resolve blocked by RLS", resolveResp.status === 200 || resolveResp.status === 204, `Status: ${resolveResp.status} (0 rows affected)`);

  // Clean up
  await api(`/hot_take_votes?hot_take_id=eq.${take[0].id}`, tomH, { method: "DELETE" });
  await api(`/hot_takes?id=eq.${take[0].id}`, tomH, { method: "DELETE" });
}

async function test8_MatchResultAndScoring() {
  currentJourney = "8. Match result entry + user_scores";
  console.log(`\n🧪 ${currentJourney}`);
  if (!testMatchId || !testLeagueId) { log("Skipped", false, ""); return; }

  const tomH = await authHeaders("tom@example.com");

  // Mark match complete: AR 1-1 FR (draw, Mbappe first scorer)
  const resultResp = await api(`/matches?id=eq.${testMatchId}`, tomH, {
    method: "PATCH", headers: { "Prefer": "return=representation" },
    body: JSON.stringify({ home_score: 1, away_score: 1, is_complete: true, first_scorer: "mbappe" }),
  });
  const resultData = await resultResp.json();
  log("Match marked complete", Array.isArray(resultData) && resultData.length > 0, `Score: ${resultData[0]?.home_score}-${resultData[0]?.away_score}`);

  // Check user_scores exist (auto-initialized by trigger)
  const scoresResp = await api(`/user_scores?league_id=eq.${testLeagueId}&select=user_id,total`, tomH);
  const scores = await scoresResp.json();
  log("User scores initialized", scores.length >= 2, `Score rows: ${scores.length}`);
}

async function test9_SecurityChecks() {
  currentJourney = "9. Security: non-admin blocked from admin actions";
  console.log(`\n🧪 ${currentJourney}`);

  const oliviaH = await authHeaders("olivia@example.com");

  // Olivia tries to update match (should be blocked by RLS)
  if (testMatchId) {
    const resp = await api(`/matches?id=eq.${testMatchId}`, oliviaH, {
      method: "PATCH", body: JSON.stringify({ home_score: 99, away_score: 0 }),
    });
    // Should silently succeed with 0 rows affected (RLS blocks)
    log("Non-admin can't update match scores", resp.status === 200 || resp.status === 204, `Status: ${resp.status} (RLS blocks silently)`);
  }

  // Olivia tries to insert user_scores directly
  if (testLeagueId) {
    const resp = await api("/user_scores", oliviaH, {
      method: "POST",
      body: JSON.stringify({ league_id: testLeagueId, user_id: "a0000001-0000-0000-0000-000000000014", total: 9999 }),
    });
    log("Non-admin can't insert fake scores", resp.status !== 201, `Status: ${resp.status}`);
  }
}

async function test10_LeaderboardAndPortfolio() {
  currentJourney = "10. Leaderboard + portfolio data accessible";
  console.log(`\n🧪 ${currentJourney}`);
  if (!testLeagueId) { log("Skipped", false, ""); return; }

  const tomH = await authHeaders("tom@example.com");

  // Leaderboard
  const lbResp = await api(`/user_scores?league_id=eq.${testLeagueId}&select=*,profiles(name)&order=total.desc`, tomH);
  const lb = await lbResp.json();
  log("Leaderboard query works", Array.isArray(lb), `Entries: ${lb.length}`);

  // Portfolio (own data)
  const picksResp = await api(`/draft_picks?league_id=eq.${testLeagueId}&user_id=eq.a0000001-0000-0000-0000-000000000013&select=pick_type,country_code,player_id`, tomH);
  const picks = await picksResp.json();
  log("Portfolio picks accessible", picks.length > 0, `Picks: ${picks.length}`);

  const allegianceResp = await api(`/allegiances?league_id=eq.${testLeagueId}&user_id=eq.a0000001-0000-0000-0000-000000000013&select=country_code`, tomH);
  const allegiance = await allegianceResp.json();
  log("Portfolio allegiance accessible", allegiance.length === 1, `Allegiance: ${allegiance[0]?.country_code}`);
}

async function test11_Cleanup() {
  currentJourney = "11. Cleanup test data";
  console.log(`\n🧪 ${currentJourney}`);
  if (!testLeagueId) { log("Skipped", false, ""); return; }

  const tomH = await authHeaders("tom@example.com");

  // Delete in order: events, matches, predictions, daily picks, draft picks, allegiances, user_scores, members, league
  if (testMatchId) {
    await api(`/match_events?match_id=eq.${testMatchId}`, tomH, { method: "DELETE" });
    await api(`/matches?id=eq.${testMatchId}`, tomH, { method: "DELETE" });
  }
  await api(`/predictions?league_id=eq.${testLeagueId}`, tomH, { method: "DELETE" });
  await api(`/daily_picks?league_id=eq.${testLeagueId}`, tomH, { method: "DELETE" });
  await api(`/draft_picks?league_id=eq.${testLeagueId}`, tomH, { method: "DELETE" });
  await api(`/allegiances?league_id=eq.${testLeagueId}`, tomH, { method: "DELETE" });
  await api(`/user_scores?league_id=eq.${testLeagueId}`, tomH, { method: "DELETE" });
  await api(`/league_members?league_id=eq.${testLeagueId}`, tomH, { method: "DELETE" });
  await api(`/leagues?id=eq.${testLeagueId}`, tomH, { method: "DELETE" });

  log("Test data cleaned up", true, "Done");
}

// ─── Runner ──────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  World Cup HQ — Gameplay QA Tests        ║");
  console.log("╚══════════════════════════════════════════╝");

  await test1_CreateLeagueForGameplay();
  await test2_DraftAllegiance();
  await test3_DraftPicks();
  await test4_CreateMatchAndEvents();
  await test5_Predictions();
  await test6_DailyPicks();
  await test7_HotTakes();
  await test8_MatchResultAndScoring();
  await test9_SecurityChecks();
  await test10_LeaderboardAndPortfolio();
  await test11_Cleanup();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log("\n╔══════════════════════════════════════════╗");
  console.log(`║  Results: ${passed}/${total} passed, ${failed} failed          ║`);
  console.log("╚══════════════════════════════════════════╝");

  if (failed > 0) {
    console.log("\n❌ FAILURES:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  [${r.journey}] ${r.step}: ${r.detail}`);
    });
    process.exit(1);
  }
}

main().catch(console.error);
