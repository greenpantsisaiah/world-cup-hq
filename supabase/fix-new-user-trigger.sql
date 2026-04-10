-- Fix the new user trigger to handle edge cases properly

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Also ensure profiles has an insert policy for the trigger
-- (security definer should bypass, but belt + suspenders)
create policy "Trigger can insert profiles" on profiles
  for insert with check (true);
