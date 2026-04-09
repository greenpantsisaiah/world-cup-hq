-- Strengthen invite codes from 8 hex chars to 12 alphanumeric chars
-- and add max_participants enforcement

-- Update the default invite code generation to use 12 alphanumeric chars
alter table leagues
  alter column invite_code
  set default upper(substr(md5(random()::text) || md5(random()::text), 1, 12));

-- Regenerate existing invite codes (if any) with stronger codes
update leagues
  set invite_code = upper(substr(md5(random()::text) || md5(random()::text), 1, 12))
  where length(invite_code) < 12;

-- Add a trigger to enforce max_participants on league_members insert
create or replace function enforce_max_participants()
returns trigger as $$
declare
  current_count int;
  max_allowed int;
begin
  select count(*) into current_count
    from league_members
    where league_id = new.league_id;

  select max_participants into max_allowed
    from leagues
    where id = new.league_id;

  if current_count >= max_allowed then
    raise exception 'League has reached maximum participants (%)', max_allowed;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists check_max_participants on league_members;
create trigger check_max_participants
  before insert on league_members
  for each row execute function enforce_max_participants();

-- Add text length constraint on hot_takes
alter table hot_takes
  add constraint hot_take_text_length check (length(text) <= 500);
