# Simulation Data

Three progressive simulations that build on each other. Run them in order in the **Supabase SQL Editor**.

## How to Run

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/qedfrylkyyddebtlspwx/sql/new)
2. Paste and run each file in order

## Simulations

### 00-reset.sql — Clean Slate
Clears all data. Run before starting a fresh simulation sequence.

### 01-draft-day.sql — Draft Complete
- 16 test users (Isaiah, Sarah, Marcus, Lisa, Phil, Dave, Emma, Jake, Alex, Mia, Chris, Nina, Tom, Olivia, Ryan, Zoe)
- 1 league: "Acme Corp World Cup 2026" (invite code: `ACME2026WCUP`)
- All allegiance picks (with realistic duplicates — 3 people picked Argentina)
- Full country draft (snake, 3 rounds, 48 picks)
- Full player draft (5 rounds, 80 picks)

**What to test:** Portfolio page, draft recap, leaderboard (all tied at 0)

### 02-group-stage.sql — Tournament Underway (Day 5)
- 6 hot takes with votes (1 already resolved as HIT)
- 48 match predictions (3 matches x 16 users)
- 32 daily picks (2 match days x 16 users)
- 8 H2H matchups with results (2 match days x 4 pairings)

**What to test:** Leaderboard with H2H records, Hot Takes market with sentiment bars, predictions page, daily picks reveal, Morning Whistle content

### 03-knockout-stage.sql — Knockout Drama (Day 15)
- 2 hot takes resolved (1 hit, 1 miss), 3 new ones
- More predictions (R16 matches) with contrarian picks
- More daily picks with emerging patterns (Dave the contrarian king)
- More H2H results + today's pending matchups (for lineup testing)

**What to test:** Resolved hot takes scoring, H2H lineup selector (today's matchups), leaderboard drama, awards race

### verify.sql — Check State
Shows counts of all data and a player standings summary. Run anytime to see what's loaded.

## Logging In as a Test User

All test users have email `{name}@example.com`. To log in as one:

1. In Supabase Dashboard → Authentication → Users
2. Find the user (e.g., `isaiah@example.com`)
3. Click the three dots → "Generate Magic Link"  
4. Copy the link and open it in your browser

This lets you experience the app from any player's perspective.

## Narrative Highlights

- **Isaiah** drafted Argentina (allegiance + draft) and Mbappé — scoring machine
- **Sarah** has the contrarian France pick via draft but also snagged Vinícius Jr.
- **Dave** is the office contrarian — picks underdogs in daily picks, often wrong but sometimes spectacularly right
- **Tom** called Japan beating a European team (hot take HIT) — huge contrarian payout
- **Jake** keeps backing USA but his predictions keep missing
- **Chris** drafted Son and keeps picking South Korea — ride or die loyalty
- **Zoe** is the dark horse with Denmark + Morocco + South Korea — unconventional portfolio
