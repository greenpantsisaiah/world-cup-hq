-- ============================================================
-- VERIFY: Check simulation data state
-- Run anytime to see what's loaded
-- ============================================================

select 'USERS' as section, count(*) as total from profiles
union all
select 'LEAGUES', count(*) from leagues
union all
select 'LEAGUE_MEMBERS', count(*) from league_members
union all
select 'ALLEGIANCES', count(*) from allegiances
union all
select 'COUNTRY_PICKS', count(*) from draft_picks where pick_type = 'country'
union all
select 'PLAYER_PICKS', count(*) from draft_picks where pick_type = 'player'
union all
select 'PREDICTIONS', count(*) from predictions
union all
select 'DAILY_PICKS', count(*) from daily_picks
union all
select 'H2H_MATCHUPS', count(*) from h2h_matchups
union all
select 'H2H_COMPLETE', count(*) from h2h_matchups where is_complete = true
union all
select 'H2H_PENDING', count(*) from h2h_matchups where is_complete = false
union all
select 'HOT_TAKES', count(*) from hot_takes
union all
select 'HOT_TAKES_RESOLVED', count(*) from hot_takes where status like 'resolved%'
union all
select 'HOT_TAKE_VOTES', count(*) from hot_take_votes
order by section;

-- Player standings (who's winning based on data)
select
  p.name,
  coalesce(a.country_code, '—') as allegiance,
  (select count(*) from draft_picks dp where dp.user_id = p.id and dp.pick_type = 'country') as countries,
  (select count(*) from draft_picks dp where dp.user_id = p.id and dp.pick_type = 'player') as players,
  (select count(*) from predictions pr where pr.user_id = p.id) as predictions_made,
  (select count(*) from daily_picks dpk where dpk.user_id = p.id) as daily_picks_made,
  coalesce(h2h.wins, 0) as h2h_wins,
  coalesce(h2h.losses, 0) as h2h_losses,
  coalesce(h2h.draws, 0) as h2h_draws
from profiles p
left join allegiances a on a.user_id = p.id
left join lateral (
  select
    count(*) filter (where (user1_id = p.id and user1_score > user2_score) or (user2_id = p.id and user2_score > user1_score)) as wins,
    count(*) filter (where (user1_id = p.id and user1_score < user2_score) or (user2_id = p.id and user2_score < user1_score)) as losses,
    count(*) filter (where user1_score = user2_score and is_complete) as draws
  from h2h_matchups hm
  where (hm.user1_id = p.id or hm.user2_id = p.id) and hm.is_complete
) h2h on true
order by h2h.wins desc nulls last, p.name;
