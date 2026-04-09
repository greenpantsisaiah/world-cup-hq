-- Feedback / Feature Request table
create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  type text not null check (type in ('bug', 'feature', 'idea', 'other')),
  title text not null check (length(title) <= 200),
  description text check (length(description) <= 2000),
  page text, -- which page they were on
  status text default 'new' check (status in ('new', 'reviewed', 'planned', 'done', 'wont_fix')),
  votes int default 1,
  created_at timestamptz default now()
);

-- Upvotes tracking
create table feedback_votes (
  feedback_id uuid references feedback(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (feedback_id, user_id)
);

-- RLS
alter table feedback enable row level security;
alter table feedback_votes enable row level security;

-- Anyone authenticated can read feedback
create policy "Anyone can read feedback" on feedback for select using (true);
-- Authenticated users can submit
create policy "Users can submit feedback" on feedback for insert with check (auth.uid() = user_id);
-- Anyone can read votes
create policy "Anyone can read votes" on feedback_votes for select using (true);
-- Users can vote
create policy "Users can vote" on feedback_votes for insert with check (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table feedback;
