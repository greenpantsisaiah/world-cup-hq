-- Set passwords for test users so they can log in via the app
-- Password for all test users: "worldcup2026"
-- Uses Supabase's crypt() function with bf (bcrypt) algorithm

update auth.users
set encrypted_password = crypt('worldcup2026', gen_salt('bf'))
where email like '%@example.com';

-- Also need to create identities for email provider login
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  id,
  id::text,
  'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  now(),
  now(),
  now()
from auth.users
where email like '%@example.com'
on conflict (provider, provider_id) do nothing;

select email, 'password: worldcup2026' as credentials
from auth.users
where email like '%@example.com'
order by email;
