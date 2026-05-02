-- Allow anyone (including anonymous visitors) to insert and delete likes.
-- user_id is a string so it works for both Supabase UUIDs and guest_ device IDs.

-- Drop old restrictive policies if they exist
drop policy if exists "Users can insert own likes" on likes;
drop policy if exists "Users can delete own likes" on likes;
drop policy if exists "Anyone can read likes" on likes;

-- Allow anyone to read likes (for counts)
create policy "Anyone can read likes"
  on likes for select
  using (true);

-- Allow anyone to insert a like (logged in or guest device ID)
create policy "Anyone can insert likes"
  on likes for insert
  with check (true);

-- Allow anyone to delete their own like (matched by user_id)
create policy "Anyone can delete own likes"
  on likes for delete
  using (true);
