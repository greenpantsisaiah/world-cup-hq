-- ============================================================
-- RESET: Clear all simulation data
-- Run this before loading any simulation
-- ============================================================

-- Delete game data (order matters for foreign keys)
delete from hot_take_votes;
delete from hot_takes;
delete from h2h_matchups;
delete from daily_picks;
delete from predictions;
delete from draft_picks;
delete from allegiances;
delete from league_members;
delete from leagues;
delete from profiles;
delete from auth.users;

select 'Reset complete — all data cleared' as result;
