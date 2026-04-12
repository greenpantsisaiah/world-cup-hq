-- Fix: Allow any authenticated user to look up a league by invite code
-- This is needed for the join-by-code flow — you can't join a league
-- you can't find.

-- Create a security definer function that bypasses RLS for invite code lookup
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
  limit 1;
$$;
