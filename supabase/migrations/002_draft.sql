-- ============================================================
-- Migration 002: Draft Order + Pick Tracking on Leagues
-- ============================================================

alter table leagues add column if not exists draft_order uuid[] default '{}';
alter table leagues add column if not exists current_pick_number int default 0;

select 'Migration 002 complete: draft_order and current_pick_number added to leagues' as result;
