-- Check actual RLS policies on leagues table
select policyname, cmd, qual, with_check
from pg_policies
where tablename = 'leagues';
