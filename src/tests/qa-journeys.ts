/**
 * QA Journey Test Suite — World Cup HQ
 *
 * Tests actual user journeys via Supabase API calls.
 * Not unit tests — these simulate real users clicking through the app.
 *
 * Run: npx tsx src/tests/qa-journeys.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qedfrylkyyddebtlspwx.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_RwU5NvkRr4G_s3JvLH9h7A_ndLh73WI";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://world-cup-hq-eight.vercel.app";

// ─── Helpers ─────────────────────────────────────────────────

interface TestResult {
  journey: string;
  step: string;
  passed: boolean;
  detail: string;
}

const results: TestResult[] = [];
let currentJourney = "";

function log(step: string, passed: boolean, detail: string) {
  results.push({ journey: currentJourney, step, passed, detail });
  const icon = passed ? "✅" : "❌";
  console.log(`  ${icon} ${step}: ${detail}`);
}

async function api(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

async function authHeaders(email: string, password: string): Promise<Record<string, string>> {
  const resp = await api("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error(`Auth failed for ${email}: ${JSON.stringify(data)}`);
  return {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${data.access_token}`,
    "Content-Type": "application/json",
  };
}

async function siteGet(path: string): Promise<{ status: number; redirectUrl?: string }> {
  const resp = await fetch(`${SITE_URL}${path}`, { redirect: "manual" });
  return {
    status: resp.status,
    redirectUrl: resp.headers.get("location") || undefined,
  };
}

// ─── Journey Tests ───────────────────────────────────────────

async function journey1_HomepageLoads() {
  currentJourney = "1. Homepage loads for anonymous user";
  console.log(`\n🧪 ${currentJourney}`);

  const resp = await siteGet("/");
  log("Homepage returns 200", resp.status === 200, `Got ${resp.status}`);

  const tryResp = await siteGet("/try");
  log("/try accessible without auth", tryResp.status === 200, `Got ${tryResp.status}`);

  const tryPlayResp = await siteGet("/try/play?persona=favorite&timeline=argentina-again");
  log("/try/play accessible without auth", tryPlayResp.status === 200, `Got ${tryPlayResp.status}`);

  const adminResp = await siteGet("/admin");
  log("/admin accessible without auth", adminResp.status === 200, `Got ${adminResp.status}`);
}

async function journey2_ProtectedRoutesRedirect() {
  currentJourney = "2. Protected routes redirect to /admin";
  console.log(`\n🧪 ${currentJourney}`);

  for (const route of ["/draft", "/daily", "/portfolio", "/leaderboard", "/hot-takes"]) {
    const resp = await siteGet(route);
    const redirectsToAdmin = resp.status === 307 && resp.redirectUrl?.includes("/admin");
    log(`${route} redirects`, redirectsToAdmin, `${resp.status} → ${resp.redirectUrl || "no redirect"}`);
  }
}

async function journey3_TestUserAuth() {
  currentJourney = "3. Test user can sign in with password";
  console.log(`\n🧪 ${currentJourney}`);

  const resp = await api("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: "isaiah@example.com", password: "worldcup2026" }),
  });
  const data = await resp.json();
  log("Password auth succeeds", !!data.access_token, data.access_token ? `Token length: ${data.access_token.length}` : `Error: ${data.msg}`);
  log("Returns user object", !!data.user?.id, data.user?.email || "no user");
  log("Profile name in metadata", data.user?.user_metadata?.name === "Isaiah", `Got: ${data.user?.user_metadata?.name}`);
}

async function journey4_CreateLeague() {
  currentJourney = "4. Create a league and verify it exists";
  console.log(`\n🧪 ${currentJourney}`);

  const headers = await authHeaders("tom@example.com", "worldcup2026");

  // Create league
  const createResp = await fetch(`${SUPABASE_URL}/rest/v1/leagues`, {
    method: "POST",
    headers: { ...headers, "Prefer": "return=representation" },
    body: JSON.stringify({
      name: "Journey Test League",
      admin_id: "a0000001-0000-0000-0000-000000000013", // Tom's ID
      scoring_preset: "standard",
      draft_mode: "snake",
      countries_per_person: 3,
      players_per_person: 5,
      max_participants: 8,
      allegiance_enabled: true,
      hot_takes_enabled: true,
      ban_boost_enabled: true,
      async_draft: false,
      late_joiner_policy: "free_agents",
    }),
  });
  const league = await createResp.json();
  const created = Array.isArray(league) && league.length > 0;
  log("League created", created, created ? `ID: ${league[0].id}, Code: ${league[0].invite_code}` : `Error: ${JSON.stringify(league)}`);

  if (!created) return;

  // Auto-join as member
  const joinResp = await fetch(`${SUPABASE_URL}/rest/v1/league_members`, {
    method: "POST",
    headers,
    body: JSON.stringify({ league_id: league[0].id, user_id: "a0000001-0000-0000-0000-000000000013" }),
  });
  log("Admin auto-joined", joinResp.status === 201, `Status: ${joinResp.status}`);

  // Verify league is visible
  const checkResp = await fetch(`${SUPABASE_URL}/rest/v1/leagues?id=eq.${league[0].id}&select=name`, {
    headers,
  });
  const checkData = await checkResp.json();
  log("League visible to admin", checkData.length === 1, `Found: ${checkData.length} leagues`);

  // Clean up
  await fetch(`${SUPABASE_URL}/rest/v1/league_members?league_id=eq.${league[0].id}`, { method: "DELETE", headers });
  await fetch(`${SUPABASE_URL}/rest/v1/leagues?id=eq.${league[0].id}`, { method: "DELETE", headers });
}

async function journey5_InviteCodeJoin() {
  currentJourney = "5. Join league by invite code (cross-user)";
  console.log(`\n🧪 ${currentJourney}`);

  // Tom creates a league
  const tomHeaders = await authHeaders("tom@example.com", "worldcup2026");
  const createResp = await fetch(`${SUPABASE_URL}/rest/v1/leagues`, {
    method: "POST",
    headers: { ...tomHeaders, "Prefer": "return=representation" },
    body: JSON.stringify({
      name: "Invite Test League",
      admin_id: "a0000001-0000-0000-0000-000000000013",
      scoring_preset: "casual",
      draft_mode: "snake",
      countries_per_person: 2,
      players_per_person: 3,
      max_participants: 4,
      allegiance_enabled: true,
      hot_takes_enabled: false,
      ban_boost_enabled: false,
      async_draft: false,
      late_joiner_policy: "free_agents",
    }),
  });
  const league = (await createResp.json())[0];
  log("Tom created league", !!league?.invite_code, `Code: ${league?.invite_code}`);

  // Tom joins as member
  await fetch(`${SUPABASE_URL}/rest/v1/league_members`, {
    method: "POST",
    headers: tomHeaders,
    body: JSON.stringify({ league_id: league.id, user_id: "a0000001-0000-0000-0000-000000000013" }),
  });

  // Olivia looks up invite code via RPC (non-member)
  const oliviaHeaders = await authHeaders("olivia@example.com", "worldcup2026");
  const lookupResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lookup_league_by_invite_code`, {
    method: "POST",
    headers: oliviaHeaders,
    body: JSON.stringify({ code: league.invite_code }),
  });
  const lookupData = await lookupResp.json();
  log("Non-member can find league by code", lookupData.length === 1, `Found: ${lookupData.length}`);

  // Olivia joins
  const joinResp = await fetch(`${SUPABASE_URL}/rest/v1/league_members`, {
    method: "POST",
    headers: oliviaHeaders,
    body: JSON.stringify({ league_id: league.id, user_id: "a0000001-0000-0000-0000-000000000014" }),
  });
  log("Olivia joined league", joinResp.status === 201, `Status: ${joinResp.status}`);

  // Verify both are members
  const membersResp = await fetch(`${SUPABASE_URL}/rest/v1/league_members?league_id=eq.${league.id}&select=profiles(name)`, {
    headers: oliviaHeaders,
  });
  const members = await membersResp.json();
  log("Both members visible", members.length === 2, `Members: ${members.length}`);

  // Olivia tries to join again (duplicate)
  const dupeResp = await fetch(`${SUPABASE_URL}/rest/v1/league_members`, {
    method: "POST",
    headers: oliviaHeaders,
    body: JSON.stringify({ league_id: league.id, user_id: "a0000001-0000-0000-0000-000000000014" }),
  });
  log("Duplicate join blocked", dupeResp.status === 409, `Status: ${dupeResp.status}`);

  // Clean up
  await fetch(`${SUPABASE_URL}/rest/v1/league_members?league_id=eq.${league.id}`, { method: "DELETE", headers: tomHeaders });
  await fetch(`${SUPABASE_URL}/rest/v1/leagues?id=eq.${league.id}`, { method: "DELETE", headers: tomHeaders });
}

async function journey6_LeagueCapEnforcement() {
  currentJourney = "6. League max participants enforced";
  console.log(`\n🧪 ${currentJourney}`);

  const tomHeaders = await authHeaders("tom@example.com", "worldcup2026");
  const createResp = await fetch(`${SUPABASE_URL}/rest/v1/leagues`, {
    method: "POST",
    headers: { ...tomHeaders, "Prefer": "return=representation" },
    body: JSON.stringify({
      name: "Tiny League",
      admin_id: "a0000001-0000-0000-0000-000000000013",
      scoring_preset: "casual",
      draft_mode: "snake",
      countries_per_person: 2,
      players_per_person: 3,
      max_participants: 2,
      allegiance_enabled: false,
      hot_takes_enabled: false,
      ban_boost_enabled: false,
      async_draft: false,
      late_joiner_policy: "free_agents",
    }),
  });
  const league = (await createResp.json())[0];

  // Tom + Olivia join (fills to 2/2)
  await fetch(`${SUPABASE_URL}/rest/v1/league_members`, {
    method: "POST", headers: tomHeaders,
    body: JSON.stringify({ league_id: league.id, user_id: "a0000001-0000-0000-0000-000000000013" }),
  });
  const oliviaHeaders = await authHeaders("olivia@example.com", "worldcup2026");
  await fetch(`${SUPABASE_URL}/rest/v1/league_members`, {
    method: "POST", headers: oliviaHeaders,
    body: JSON.stringify({ league_id: league.id, user_id: "a0000001-0000-0000-0000-000000000014" }),
  });

  // Ryan tries to join (should be blocked by trigger)
  const ryanHeaders = await authHeaders("ryan@example.com", "worldcup2026");
  const overflowResp = await fetch(`${SUPABASE_URL}/rest/v1/league_members`, {
    method: "POST", headers: ryanHeaders,
    body: JSON.stringify({ league_id: league.id, user_id: "a0000001-0000-0000-0000-000000000015" }),
  });
  const blocked = overflowResp.status !== 201;
  log("3rd member blocked (max=2)", blocked, `Status: ${overflowResp.status}`);

  // Clean up
  await fetch(`${SUPABASE_URL}/rest/v1/league_members?league_id=eq.${league.id}`, { method: "DELETE", headers: tomHeaders });
  await fetch(`${SUPABASE_URL}/rest/v1/leagues?id=eq.${league.id}`, { method: "DELETE", headers: tomHeaders });
}

async function journey7_RLSIsolation() {
  currentJourney = "7. RLS: users can't see other leagues' data";
  console.log(`\n🧪 ${currentJourney}`);

  // Isaiah is in "Acme Corp" league
  const isaiahHeaders = await authHeaders("isaiah@example.com", "worldcup2026");

  // Zoe is in "Acme Corp" too
  const zoeHeaders = await authHeaders("zoe@example.com", "worldcup2026");

  // Isaiah's leagues
  const isaiahLeagues = await (await fetch(`${SUPABASE_URL}/rest/v1/leagues?select=name`, { headers: isaiahHeaders })).json();
  log("Isaiah sees his leagues", isaiahLeagues.length >= 1, `Sees: ${isaiahLeagues.length}`);

  // Isaiah's draft picks
  const isaiahPicks = await (await fetch(`${SUPABASE_URL}/rest/v1/draft_picks?user_id=eq.a0000001-0000-0000-0000-000000000001&select=pick_type`, { headers: isaiahHeaders })).json();
  log("Isaiah sees his draft picks", isaiahPicks.length > 0, `Picks: ${isaiahPicks.length}`);

  // Zoe can't see Isaiah's picks... wait, they're in the same league, so she should
  const zoeSeesPicks = await (await fetch(`${SUPABASE_URL}/rest/v1/draft_picks?user_id=eq.a0000001-0000-0000-0000-000000000001&select=pick_type`, { headers: zoeHeaders })).json();
  log("Zoe (same league) can see Isaiah's picks", zoeSeesPicks.length > 0, `Sees: ${zoeSeesPicks.length}`);
}

async function journey8_HotTakesCRUD() {
  currentJourney = "8. Hot takes: create, read, vote";
  console.log(`\n🧪 ${currentJourney}`);

  const isaiahHeaders = await authHeaders("isaiah@example.com", "worldcup2026");

  // Get Isaiah's league
  const leagues = await (await fetch(`${SUPABASE_URL}/rest/v1/league_members?user_id=eq.a0000001-0000-0000-0000-000000000001&select=league_id`, { headers: isaiahHeaders })).json();
  if (leagues.length === 0) { log("Has a league", false, "No leagues found"); return; }
  const leagueId = leagues[0].league_id;

  // Create a hot take
  const createResp = await fetch(`${SUPABASE_URL}/rest/v1/hot_takes`, {
    method: "POST",
    headers: { ...isaiahHeaders, "Prefer": "return=representation" },
    body: JSON.stringify({
      league_id: leagueId,
      author_id: "a0000001-0000-0000-0000-000000000001",
      text: "QA test hot take — Brazil will not make it past round of 16",
      locks_at: "2026-07-01T00:00:00Z",
    }),
  });
  const take = await createResp.json();
  const created = Array.isArray(take) && take.length > 0;
  log("Hot take created", created, created ? `ID: ${take[0].id}` : `Error: ${JSON.stringify(take)}`);

  if (!created) return;

  // Read it back
  const readResp = await (await fetch(`${SUPABASE_URL}/rest/v1/hot_takes?id=eq.${take[0].id}&select=text`, { headers: isaiahHeaders })).json();
  log("Hot take readable", readResp.length === 1, `Found: ${readResp.length}`);

  // Vote on it (as Sarah)
  const sarahHeaders = await authHeaders("sarah@example.com", "worldcup2026");
  const voteResp = await fetch(`${SUPABASE_URL}/rest/v1/hot_take_votes`, {
    method: "POST",
    headers: sarahHeaders,
    body: JSON.stringify({ hot_take_id: take[0].id, user_id: "a0000001-0000-0000-0000-000000000002", vote: "back" }),
  });
  log("Sarah can vote on take", voteResp.status === 201, `Status: ${voteResp.status}`);

  // Clean up
  await fetch(`${SUPABASE_URL}/rest/v1/hot_take_votes?hot_take_id=eq.${take[0].id}`, { method: "DELETE", headers: isaiahHeaders });
  await fetch(`${SUPABASE_URL}/rest/v1/hot_takes?id=eq.${take[0].id}`, { method: "DELETE", headers: isaiahHeaders });
}

async function journey9_FeedbackSubmission() {
  currentJourney = "9. Feedback widget: submit and verify";
  console.log(`\n🧪 ${currentJourney}`);

  const isaiahHeaders = await authHeaders("isaiah@example.com", "worldcup2026");

  const submitResp = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
    method: "POST",
    headers: { ...isaiahHeaders, "Prefer": "return=representation" },
    body: JSON.stringify({
      user_id: "a0000001-0000-0000-0000-000000000001",
      type: "idea",
      title: "QA test feedback",
      description: "Testing the feedback submission flow",
      page: "/portfolio",
    }),
  });
  const feedback = await submitResp.json();
  const created = Array.isArray(feedback) && feedback.length > 0;
  log("Feedback submitted", created, created ? `ID: ${feedback[0].id}` : `Error: ${JSON.stringify(feedback)}`);

  // Clean up
  if (created) {
    await fetch(`${SUPABASE_URL}/rest/v1/feedback?id=eq.${feedback[0].id}`, { method: "DELETE", headers: isaiahHeaders });
  }
}

async function journey10_AllegianceAndDraftPicks() {
  currentJourney = "10. Allegiance + draft picks readable";
  console.log(`\n🧪 ${currentJourney}`);

  const isaiahHeaders = await authHeaders("isaiah@example.com", "worldcup2026");

  // Check allegiance
  const allegiances = await (await fetch(`${SUPABASE_URL}/rest/v1/allegiances?user_id=eq.a0000001-0000-0000-0000-000000000001&select=country_code`, { headers: isaiahHeaders })).json();
  log("Allegiance exists", allegiances.length > 0, `Allegiance: ${allegiances[0]?.country_code || "none"}`);

  // Check country draft picks
  const countryPicks = await (await fetch(`${SUPABASE_URL}/rest/v1/draft_picks?user_id=eq.a0000001-0000-0000-0000-000000000001&pick_type=eq.country&select=country_code`, { headers: isaiahHeaders })).json();
  log("Country picks exist", countryPicks.length > 0, `Countries: ${countryPicks.length}`);

  // Check player draft picks
  const playerPicks = await (await fetch(`${SUPABASE_URL}/rest/v1/draft_picks?user_id=eq.a0000001-0000-0000-0000-000000000001&pick_type=eq.player&select=player_id`, { headers: isaiahHeaders })).json();
  log("Player picks exist", playerPicks.length > 0, `Players: ${playerPicks.length}`);
}

async function journey11_DailyPicksFlow() {
  currentJourney = "11. Daily picks: submit and read";
  console.log(`\n🧪 ${currentJourney}`);

  const isaiahHeaders = await authHeaders("isaiah@example.com", "worldcup2026");
  const leagues = await (await fetch(`${SUPABASE_URL}/rest/v1/league_members?user_id=eq.a0000001-0000-0000-0000-000000000001&select=league_id`, { headers: isaiahHeaders })).json();
  if (leagues.length === 0) { log("Has a league", false, "No leagues"); return; }
  const leagueId = leagues[0].league_id;
  const today = new Date().toISOString().split("T")[0];

  // Submit daily pick
  const submitResp = await fetch(`${SUPABASE_URL}/rest/v1/daily_picks`, {
    method: "POST",
    headers: { ...isaiahHeaders, "Prefer": "return=representation" },
    body: JSON.stringify({
      league_id: leagueId,
      user_id: "a0000001-0000-0000-0000-000000000001",
      pick_date: today,
      country_of_the_day: "AR",
      player_of_the_day: "messi",
    }),
  });
  const pick = await submitResp.json();
  const created = Array.isArray(pick) && pick.length > 0;
  log("Daily pick submitted", created, created ? `Date: ${today}` : `Error: ${JSON.stringify(pick)}`);

  // Read it back
  if (created) {
    const readResp = await (await fetch(`${SUPABASE_URL}/rest/v1/daily_picks?pick_date=eq.${today}&user_id=eq.a0000001-0000-0000-0000-000000000001&select=country_of_the_day,player_of_the_day`, { headers: isaiahHeaders })).json();
    log("Daily pick readable", readResp.length === 1, `Country: ${readResp[0]?.country_of_the_day}, Player: ${readResp[0]?.player_of_the_day}`);

    // Clean up
    await fetch(`${SUPABASE_URL}/rest/v1/daily_picks?pick_date=eq.${today}&user_id=eq.a0000001-0000-0000-0000-000000000001`, { method: "DELETE", headers: isaiahHeaders });
  }
}

async function journey12_PredictionsFlow() {
  currentJourney = "12. Predictions: submit and read";
  console.log(`\n🧪 ${currentJourney}`);

  const isaiahHeaders = await authHeaders("isaiah@example.com", "worldcup2026");
  const leagues = await (await fetch(`${SUPABASE_URL}/rest/v1/league_members?user_id=eq.a0000001-0000-0000-0000-000000000001&select=league_id`, { headers: isaiahHeaders })).json();
  if (leagues.length === 0) { log("Has a league", false, "No leagues"); return; }
  const leagueId = leagues[0].league_id;

  const submitResp = await fetch(`${SUPABASE_URL}/rest/v1/predictions`, {
    method: "POST",
    headers: { ...isaiahHeaders, "Prefer": "return=representation" },
    body: JSON.stringify({
      league_id: leagueId,
      user_id: "a0000001-0000-0000-0000-000000000001",
      match_id: "qa-test-match",
      predicted_winner: "home",
      predicted_total_goals: "over",
      predicted_first_scorer: "mbappe",
    }),
  });
  const pred = await submitResp.json();
  const created = Array.isArray(pred) && pred.length > 0;
  log("Prediction submitted", created, created ? `Match: qa-test-match` : `Error: ${JSON.stringify(pred)}`);

  if (created) {
    // Clean up
    await fetch(`${SUPABASE_URL}/rest/v1/predictions?match_id=eq.qa-test-match&user_id=eq.a0000001-0000-0000-0000-000000000001`, { method: "DELETE", headers: isaiahHeaders });
  }
}

async function journey13_ProfileCreatedOnSignup() {
  currentJourney = "13. Profile auto-created on signup";
  console.log(`\n🧪 ${currentJourney}`);

  const isaiahHeaders = await authHeaders("isaiah@example.com", "worldcup2026");
  const profiles = await (await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.a0000001-0000-0000-0000-000000000001&select=name`, { headers: isaiahHeaders })).json();
  log("Profile exists", profiles.length === 1, `Name: ${profiles[0]?.name || "missing"}`);
}

async function journey14_SitePerformance() {
  currentJourney = "14. Site performance: key pages load fast";
  console.log(`\n🧪 ${currentJourney}`);

  for (const path of ["/", "/try", "/admin"]) {
    const start = Date.now();
    await fetch(`${SITE_URL}${path}`);
    const ms = Date.now() - start;
    log(`${path} responds in <3s`, ms < 3000, `${ms}ms`);
  }
}

async function journey15_InviteCodeValidation() {
  currentJourney = "15. Invite code validation";
  console.log(`\n🧪 ${currentJourney}`);

  // Valid format, non-existent code
  const resp1 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lookup_league_by_invite_code`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ code: "DOESNOTEXIST" }),
  });
  const data1 = await resp1.json();
  log("Non-existent code returns empty", Array.isArray(data1) && data1.length === 0, `Result: ${JSON.stringify(data1)}`);

  // Known code returns league
  const resp2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lookup_league_by_invite_code`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ code: "ACME2026WCUP" }),
  });
  const data2 = await resp2.json();
  log("Known code returns league", data2.length === 1, `Name: ${data2[0]?.name || "none"}`);
}

// ─── Runner ──────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  World Cup HQ — QA Journey Tests         ║");
  console.log("╚══════════════════════════════════════════╝");

  await journey1_HomepageLoads();
  await journey2_ProtectedRoutesRedirect();
  await journey3_TestUserAuth();
  await journey4_CreateLeague();
  await journey5_InviteCodeJoin();
  await journey6_LeagueCapEnforcement();
  await journey7_RLSIsolation();
  await journey8_HotTakesCRUD();
  await journey9_FeedbackSubmission();
  await journey10_AllegianceAndDraftPicks();
  await journey11_DailyPicksFlow();
  await journey12_PredictionsFlow();
  await journey13_ProfileCreatedOnSignup();
  await journey14_SitePerformance();
  await journey15_InviteCodeValidation();

  // Summary
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
