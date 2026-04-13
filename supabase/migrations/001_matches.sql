-- ============================================================
-- Migration 001: Matches + Match Events
-- The data foundation for all gameplay
-- ============================================================

-- Matches table — one row per real World Cup match
create table matches (
  id uuid primary key default gen_random_uuid(),
  home_country text not null,
  away_country text not null,
  match_day date not null,
  kickoff timestamptz not null,
  stage text not null default 'group'
    check (stage in ('group', 'r16', 'qf', 'sf', 'third_place', 'final')),
  group_letter text,
  home_score int,
  away_score int,
  is_complete boolean default false,
  first_scorer text,
  man_of_the_match text,
  created_at timestamptz default now()
);

-- Match events — individual player performances in a match
create table match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  player_id text not null,
  country_code text not null,
  event_type text not null
    check (event_type in ('goal', 'assist', 'yellow_card', 'red_card', 'penalty_miss', 'clean_sheet', 'motm')),
  minute int,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index idx_matches_match_day on matches(match_day);
create index idx_matches_is_complete on matches(is_complete);
create index idx_match_events_match_id on match_events(match_id);
create index idx_match_events_player_id on match_events(player_id);

-- RLS — matches are global (same across all leagues), publicly readable
alter table matches enable row level security;
alter table match_events enable row level security;

create policy "Anyone can read matches" on matches for select using (true);
create policy "Anyone can read match events" on match_events for select using (true);

-- Write access via server actions only (authenticated admin check in code)
create policy "Authenticated users can insert matches" on matches
  for insert with check (auth.uid() is not null);
create policy "Authenticated users can update matches" on matches
  for update using (auth.uid() is not null);
create policy "Authenticated users can insert events" on match_events
  for insert with check (auth.uid() is not null);
create policy "Authenticated users can delete events" on match_events
  for delete using (auth.uid() is not null);

-- Realtime
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table match_events;

select 'Migration 001 complete: matches + match_events tables created' as result;
