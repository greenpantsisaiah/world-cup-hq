-- Full reset + proper user recreation

-- Nuke ALL game data
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
delete from auth.identities;
delete from auth.users;

-- Recreate users with every field GoTrue expects
do $$
declare
  test_users text[] := array[
    'Isaiah', 'Sarah', 'Marcus', 'Lisa', 'Phil', 'Dave', 'Emma', 'Jake',
    'Alex', 'Mia', 'Chris', 'Nina', 'Tom', 'Olivia', 'Ryan', 'Zoe'
  ];
  user_name text;
  user_email text;
  user_uuid uuid;
  i int := 1;
begin
  foreach user_name in array test_users loop
    user_email := lower(user_name) || '@example.com';
    user_uuid := ('a0000001-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid;

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user, is_anonymous,
      created_at, updated_at
    ) values (
      user_uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      user_email,
      crypt('worldcup2026', gen_salt('bf')),
      now(), '', '', '', '',
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('name', user_name),
      false, false, false,
      now(), now()
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), user_uuid, user_uuid::text, 'email',
      jsonb_build_object('sub', user_uuid::text, 'email', user_email, 'email_verified', true, 'phone_verified', false),
      now(), now(), now()
    );

    i := i + 1;
  end loop;
end $$;

-- Verify
select u.email, p.name, i.provider
from auth.users u
join profiles p on p.id = u.id
join auth.identities i on i.user_id = u.id
where u.email like '%@example.com'
order by u.email;
