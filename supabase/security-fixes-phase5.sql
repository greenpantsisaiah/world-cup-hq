-- Security fixes for Phase 5 audit findings

-- M2+M3: Tighten user_scores — only scoring engine should write
drop policy if exists "System can update scores" on user_scores;
drop policy if exists "System can insert scores" on user_scores;

-- Only allow writes via the init trigger (security definer) and scoring engine
-- Regular users cannot modify their own scores
-- The scoring engine uses createServerSupabase() which runs as the authenticated user,
-- but we restrict to admin-only writes
create policy "Admin can update scores" on user_scores
  for update using (
    exists (select 1 from leagues where id = league_id and admin_id = auth.uid())
  );

create policy "Admin can insert scores" on user_scores
  for insert with check (
    exists (select 1 from leagues where id = league_id and admin_id = auth.uid())
    or auth.uid() = user_id  -- allow init trigger
  );

-- M1: Tighten matches write access to league admins only
drop policy if exists "Authenticated users can insert matches" on matches;
drop policy if exists "Authenticated users can update matches" on matches;
drop policy if exists "Authenticated users can insert events" on match_events;
drop policy if exists "Authenticated users can delete events" on match_events;

create policy "League admins can insert matches" on matches
  for insert with check (
    exists (select 1 from leagues where admin_id = auth.uid())
  );

create policy "League admins can update matches" on matches
  for update using (
    exists (select 1 from leagues where admin_id = auth.uid())
  );

create policy "League admins can delete matches" on matches
  for delete using (
    exists (select 1 from leagues where admin_id = auth.uid())
  );

create policy "League admins can insert events" on match_events
  for insert with check (
    exists (select 1 from leagues where admin_id = auth.uid())
  );

create policy "League admins can delete events" on match_events
  for delete using (
    exists (select 1 from leagues where admin_id = auth.uid())
  );

select 'Phase 5 security fixes applied' as result;
