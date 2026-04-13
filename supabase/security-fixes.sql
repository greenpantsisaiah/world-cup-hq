-- Security fixes from audit 2026-04-12

-- H2: Require auth for invite code lookup
create or replace function lookup_league_by_invite_code(code text)
returns table (id uuid, name text, max_participants int, invite_code text)
language sql
security definer
set search_path = public
stable
as $$
  select l.id, l.name, l.max_participants, l.invite_code
  from leagues l
  where l.invite_code = code
    and auth.uid() is not null  -- require authentication
  limit 1;
$$;

-- M4: Restrict feedback SELECT to authenticated users
drop policy if exists "Anyone can read feedback" on feedback;
create policy "Authenticated users can read feedback" on feedback
  for select using (auth.uid() is not null);

-- M5: Restrict profile INSERT to own ID only
drop policy if exists "Trigger can insert profiles" on profiles;
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- H1: Add DELETE policies for admin operations
create policy "Admin can delete league members" on league_members
  for delete using (
    league_id in (select id from leagues where admin_id = auth.uid())
    or user_id = auth.uid()
  );

create policy "Admin can delete hot takes" on hot_takes
  for delete using (author_id = auth.uid());

create policy "Users can delete own votes" on hot_take_votes
  for delete using (user_id = auth.uid());

create policy "Users can delete own predictions" on predictions
  for delete using (user_id = auth.uid());

create policy "Users can delete own daily picks" on daily_picks
  for delete using (user_id = auth.uid());

create policy "Users can delete own feedback" on feedback
  for delete using (user_id = auth.uid());

select 'Security fixes applied' as result;
