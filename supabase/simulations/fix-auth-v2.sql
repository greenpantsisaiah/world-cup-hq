-- Fix: recreate identities without the generated email column

delete from auth.identities
where user_id in (select id from auth.users where email like '%@example.com');

update auth.users
set
  encrypted_password = crypt('worldcup2026', gen_salt('bf')),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}',
  is_sso_user = false,
  updated_at = now()
where email like '%@example.com';

-- email column is auto-generated from identity_data, so omit it
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  id,
  id::text,
  'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true, 'phone_verified', false),
  now(),
  now(),
  now()
from auth.users
where email like '%@example.com';

select u.email, i.provider, 'ready' as status
from auth.users u
join auth.identities i on i.user_id = u.id
where u.email like '%@example.com'
order by u.email;
