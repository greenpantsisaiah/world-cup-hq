-- Fix test user auth: clean up and recreate identities properly

-- Remove any broken identities first
delete from auth.identities where provider = 'email'
  and user_id in (select id from auth.users where email like '%@example.com');

-- Set passwords
update auth.users
set
  encrypted_password = crypt('worldcup2026', gen_salt('bf')),
  raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', array['email']),
  raw_user_meta_data = jsonb_build_object('name', split_part(email, '@', 1)),
  is_sso_user = false,
  updated_at = now()
where email like '%@example.com';

-- Create proper identities
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  id,  -- use same UUID as user ID
  id,
  id::text,
  'email',
  jsonb_build_object(
    'sub', id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false
  ),
  now(),
  now(),
  now()
from auth.users
where email like '%@example.com'
on conflict (provider, provider_id) do update set
  identity_data = excluded.identity_data,
  updated_at = now();

-- Verify
select u.email, i.provider, 'ready' as status
from auth.users u
join auth.identities i on i.user_id = u.id
where u.email like '%@example.com'
order by u.email;
