-- The likes table user_id column was uuid, but we use emails and device IDs.
-- Change it to text so any stable identifier works.

ALTER TABLE likes ALTER COLUMN user_id TYPE text USING user_id::text;

-- Do the same for saves if it exists
ALTER TABLE post_saves ALTER COLUMN user_id TYPE text USING user_id::text;
