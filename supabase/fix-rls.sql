-- Fix infinite recursion in RLS policies
-- The issue: league_members policies reference league_members, causing a loop

-- Drop the recursive policies
drop policy if exists "Members can see members" on league_members;
drop policy if exists "Leagues viewable by members" on leagues;
drop policy if exists "Members can see allegiances" on allegiances;
drop policy if exists "Members can see picks" on draft_picks;
drop policy if exists "Members can see predictions" on predictions;
drop policy if exists "Members can see daily picks" on daily_picks;
drop policy if exists "Members can see h2h" on h2h_matchups;
drop policy if exists "Members can see takes" on hot_takes;
drop policy if exists "Members can see votes" on hot_take_votes;

-- Create a security definer function to check membership without RLS
create or replace function is_league_member(check_league_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from league_members
    where league_id = check_league_id and user_id = check_user_id
  );
$$;

-- Recreate policies using the function instead of subqueries

-- League members: use the function to avoid recursion
create policy "Members can see members" on league_members
  for select using (is_league_member(league_id, auth.uid()));

-- Leagues
create policy "Leagues viewable by members" on leagues
  for select using (is_league_member(id, auth.uid()));

-- Allegiances
create policy "Members can see allegiances" on allegiances
  for select using (is_league_member(league_id, auth.uid()));

-- Draft picks
create policy "Members can see picks" on draft_picks
  for select using (is_league_member(league_id, auth.uid()));

-- Predictions
create policy "Members can see predictions" on predictions
  for select using (is_league_member(league_id, auth.uid()));

-- Daily picks
create policy "Members can see daily picks" on daily_picks
  for select using (is_league_member(league_id, auth.uid()));

-- H2H
create policy "Members can see h2h" on h2h_matchups
  for select using (is_league_member(league_id, auth.uid()));

-- Hot takes
create policy "Members can see takes" on hot_takes
  for select using (is_league_member(league_id, auth.uid()));

-- Hot take votes
create policy "Members can see votes" on hot_take_votes
  for select using (
    exists (
      select 1 from hot_takes ht
      where ht.id = hot_take_id
      and is_league_member(ht.league_id, auth.uid())
    )
  );
