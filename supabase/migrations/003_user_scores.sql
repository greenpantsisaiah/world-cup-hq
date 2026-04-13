-- ============================================================
-- Migration 003: User Scores Table
-- Cached/materialized scores for leaderboard performance
-- ============================================================

create table user_scores (
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  allegiance numeric default 0,
  country_draft numeric default 0,
  player_draft numeric default 0,
  predictions numeric default 0,
  daily_picks numeric default 0,
  head_to_head numeric default 0,
  hot_takes numeric default 0,
  total numeric default 0,
  h2h_wins int default 0,
  h2h_losses int default 0,
  h2h_draws int default 0,
  prediction_streak int default 0,
  last_updated timestamptz default now(),
  primary key (league_id, user_id)
);

-- Auto-init user_scores when someone joins a league
create or replace function init_user_scores()
returns trigger as $$
begin
  insert into user_scores (league_id, user_id)
  values (NEW.league_id, NEW.user_id)
  on conflict do nothing;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_league_member_added
  after insert on league_members
  for each row execute function init_user_scores();

-- RLS
alter table user_scores enable row level security;

create policy "Members can see scores" on user_scores
  for select using (is_league_member(league_id, auth.uid()));

create policy "System can update scores" on user_scores
  for update using (auth.uid() is not null);

create policy "System can insert scores" on user_scores
  for insert with check (auth.uid() is not null);

-- Realtime
alter publication supabase_realtime add table user_scores;

-- Initialize scores for existing league members
insert into user_scores (league_id, user_id)
select league_id, user_id from league_members
on conflict do nothing;

select 'Migration 003 complete: user_scores table created + initialized' as result;
