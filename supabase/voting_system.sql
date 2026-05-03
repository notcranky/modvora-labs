-- ── Build of the Week Voting System ─────────────────────────────────────────

-- Nominations: one entry per post per week
create table if not exists nominations (
  id           uuid primary key default gen_random_uuid(),
  week_id      text not null,
  post_id      text not null,
  post_slug    text not null,
  post_title   text not null,
  post_hero_image text,
  vehicle_label text,
  submitter_user_id text not null,
  created_at   timestamptz default now(),
  unique(week_id, post_id)
);

-- Votes: one vote per user per round per week (enforced by unique constraint)
create table if not exists nomination_votes (
  id             uuid primary key default gen_random_uuid(),
  week_id        text not null,
  nomination_id  uuid not null references nominations(id) on delete cascade,
  user_id        text not null,
  round          integer not null default 1, -- 1 = main, 2 = final
  created_at     timestamptz default now(),
  unique(week_id, user_id, round)
);

-- Enable RLS
alter table nominations enable row level security;
alter table nomination_votes enable row level security;

-- Nominations: anyone can read, anyone can submit
create policy "Anyone can read nominations"
  on nominations for select using (true);

create policy "Anyone can submit nominations"
  on nominations for insert with check (true);

-- Votes: anyone can read, anyone can vote, anyone can change their vote
create policy "Anyone can read votes"
  on nomination_votes for select using (true);

create policy "Anyone can cast vote"
  on nomination_votes for insert with check (true);

create policy "Anyone can remove own vote"
  on nomination_votes for delete using (true);

-- Enable realtime for live vote counts
alter publication supabase_realtime add table nomination_votes;
alter publication supabase_realtime add table nominations;
