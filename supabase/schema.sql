-- ============================================================
-- World Cup HQ Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Leagues
create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  admin_id uuid references profiles(id) not null,
  scoring_preset text default 'standard' check (scoring_preset in ('casual', 'standard', 'competitive')),
  draft_mode text default 'snake' check (draft_mode in ('snake', 'straight')),
  countries_per_person int default 2,
  players_per_person int default 5,
  max_participants int default 16,
  allegiance_enabled boolean default true,
  hot_takes_enabled boolean default true,
  ban_boost_enabled boolean default true,
  async_draft boolean default false,
  async_draft_clock_minutes int default 60,
  late_joiner_policy text default 'free_agents' check (late_joiner_policy in ('allegiance_only', 'free_agents', 'no_join')),
  draft_status text default 'pre_draft' check (draft_status in ('pre_draft', 'allegiance', 'country_draft', 'player_draft', 'complete')),
  invite_code text unique default upper(substr(md5(random()::text) || md5(random()::text), 1, 12)),
  created_at timestamptz default now()
);

-- League members
create table league_members (
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (league_id, user_id)
);

-- Allegiance picks
create table allegiances (
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  country_code text not null,
  created_at timestamptz default now(),
  primary key (league_id, user_id)
);

-- Draft picks (countries and players)
create table draft_picks (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  pick_type text not null check (pick_type in ('country', 'player')),
  country_code text,
  player_id text,
  round int not null,
  pick_number int not null,
  created_at timestamptz default now()
);

-- Match predictions
create table predictions (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  match_id text not null,
  predicted_winner text check (predicted_winner in ('home', 'away', 'draw')),
  predicted_total_goals text check (predicted_total_goals in ('over', 'under')),
  predicted_first_scorer text,
  banned_player_id text,
  boosted_player_id text,
  created_at timestamptz default now(),
  unique (league_id, user_id, match_id)
);

-- Daily picks (country + player of the day)
create table daily_picks (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  pick_date date not null,
  country_of_the_day text not null,
  player_of_the_day text not null,
  created_at timestamptz default now(),
  unique (league_id, user_id, pick_date)
);

-- Head-to-head matchups
create table h2h_matchups (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  match_date date not null,
  user1_id uuid references profiles(id),
  user2_id uuid references profiles(id),
  user1_lineup text[] default '{}',
  user2_lineup text[] default '{}',
  user1_score numeric default 0,
  user2_score numeric default 0,
  is_locked boolean default false,
  is_complete boolean default false,
  created_at timestamptz default now()
);

-- Hot takes
create table hot_takes (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  text text not null,
  locks_at timestamptz not null,
  status text default 'open' check (status in ('open', 'locked', 'resolved_hit', 'resolved_miss')),
  created_at timestamptz default now()
);

-- Hot take votes (back or fade)
create table hot_take_votes (
  hot_take_id uuid references hot_takes(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  vote text not null check (vote in ('back', 'fade')),
  created_at timestamptz default now(),
  primary key (hot_take_id, user_id)
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table profiles enable row level security;
alter table leagues enable row level security;
alter table league_members enable row level security;
alter table allegiances enable row level security;
alter table draft_picks enable row level security;
alter table predictions enable row level security;
alter table daily_picks enable row level security;
alter table h2h_matchups enable row level security;
alter table hot_takes enable row level security;
alter table hot_take_votes enable row level security;

-- Profiles: anyone can read, users can update their own
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Leagues: members can read, admin can update
create policy "Leagues viewable by members" on leagues for select using (
  id in (select league_id from league_members where user_id = auth.uid())
);
create policy "Anyone can create a league" on leagues for insert with check (admin_id = auth.uid());
create policy "Admin can update league" on leagues for update using (admin_id = auth.uid());

-- League members: members can see other members, anyone can join
create policy "Members can see members" on league_members for select using (
  league_id in (select league_id from league_members where user_id = auth.uid())
);
create policy "Anyone can join" on league_members for insert with check (user_id = auth.uid());

-- Allegiances: league members can see, own user can insert
create policy "Members can see allegiances" on allegiances for select using (
  league_id in (select league_id from league_members where user_id = auth.uid())
);
create policy "Users can set allegiance" on allegiances for insert with check (user_id = auth.uid());
create policy "Users can update allegiance" on allegiances for update using (user_id = auth.uid());

-- Draft picks: league members can see all
create policy "Members can see picks" on draft_picks for select using (
  league_id in (select league_id from league_members where user_id = auth.uid())
);
create policy "Users can make picks" on draft_picks for insert with check (user_id = auth.uid());

-- Predictions: own user can see/create, all visible after lock
create policy "Members can see predictions" on predictions for select using (
  league_id in (select league_id from league_members where user_id = auth.uid())
);
create policy "Users can predict" on predictions for insert with check (user_id = auth.uid());
create policy "Users can update predictions" on predictions for update using (user_id = auth.uid());

-- Daily picks
create policy "Members can see daily picks" on daily_picks for select using (
  league_id in (select league_id from league_members where user_id = auth.uid())
);
create policy "Users can make daily picks" on daily_picks for insert with check (user_id = auth.uid());

-- H2H matchups
create policy "Members can see h2h" on h2h_matchups for select using (
  league_id in (select league_id from league_members where user_id = auth.uid())
);
create policy "Participants can update lineup" on h2h_matchups for update using (
  user1_id = auth.uid() or user2_id = auth.uid()
);

-- Hot takes
create policy "Members can see takes" on hot_takes for select using (
  league_id in (select league_id from league_members where user_id = auth.uid())
);
create policy "Members can create takes" on hot_takes for insert with check (author_id = auth.uid());

-- Hot take votes
create policy "Members can see votes" on hot_take_votes for select using (
  hot_take_id in (
    select id from hot_takes where league_id in (
      select league_id from league_members where user_id = auth.uid()
    )
  )
);
create policy "Users can vote" on hot_take_votes for insert with check (user_id = auth.uid());
create policy "Users can change vote" on hot_take_votes for update using (user_id = auth.uid());

-- ============================================================
-- Enable Realtime for key tables
-- ============================================================

alter publication supabase_realtime add table draft_picks;
alter publication supabase_realtime add table allegiances;
alter publication supabase_realtime add table league_members;
alter publication supabase_realtime add table hot_takes;
alter publication supabase_realtime add table hot_take_votes;
alter publication supabase_realtime add table h2h_matchups;
alter publication supabase_realtime add table daily_picks;
alter publication supabase_realtime add table leagues;
