-- Fix: The SELECT policy blocks RETURNING after INSERT because
-- the user isn't a league_member yet when the row is created.
-- Solution: Also allow the admin to SELECT their own leagues.

drop policy "Leagues viewable by members" on leagues;

create policy "Leagues viewable by members or admin" on leagues
  for select using (
    admin_id = auth.uid() OR is_league_member(id, auth.uid())
  );
