-- Add draft_date to leagues
alter table leagues add column if not exists draft_date timestamptz;

select 'Migration 004: draft_date added to leagues' as result;
