-- ── Build of the Week — Sample Nominations Seed ─────────────────────────────
-- Run this in your Supabase SQL Editor.
-- Week 2026-W18  (Apr 27 – May 3 2026)
-- Today is Saturday → Final Round phase, so top-3 by round-1 votes are shown.

-- ── 1. Nominations ───────────────────────────────────────────────────────────

INSERT INTO nominations (id, week_id, post_id, post_slug, post_title, post_hero_image, vehicle_label, submitter_user_id)
VALUES
  (
    'f1a2b3c4-0001-4d5e-a6f7-b8c9d0e1f2a3',
    '2026-W18',
    'sample-nom-wrx',
    'widebody-wrx-sti-build',
    'Widebody WRX STI',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80',
    '2018 Subaru WRX STI',
    'sample-submitter-1'
  ),
  (
    'f1a2b3c4-0002-4d5e-a6f7-b8c9d0e1f2a3',
    '2026-W18',
    'sample-nom-gr86',
    'gr86-track-day-spec',
    'GR86 Track Day Spec',
    'https://images.unsplash.com/photo-1632245889029-e406faaa34cd?w=800&q=80',
    '2023 Toyota GR86',
    'sample-submitter-2'
  ),
  (
    'f1a2b3c4-0003-4d5e-a6f7-b8c9d0e1f2a3',
    '2026-W18',
    'sample-nom-350z',
    'track-built-350z',
    'Track-Built 350Z',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80',
    '2004 Nissan 350Z',
    'sample-submitter-3'
  ),
  (
    'f1a2b3c4-0004-4d5e-a6f7-b8c9d0e1f2a3',
    '2026-W18',
    'sample-nom-mustang',
    'coyote-mustang-gt500',
    'Coyote Mustang GT',
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80',
    '2021 Ford Mustang GT',
    'sample-submitter-4'
  ),
  (
    'f1a2b3c4-0005-4d5e-a6f7-b8c9d0e1f2a3',
    '2026-W18',
    'sample-nom-m2',
    'bmw-m2-comp-street',
    'BMW M2 Competition',
    'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?w=800&q=80',
    '2020 BMW M2 Competition',
    'sample-submitter-5'
  )
ON CONFLICT (week_id, post_id) DO NOTHING;


-- ── 2. Round-1 votes (Mon–Fri voting) ────────────────────────────────────────
-- WRX STI: 8 votes  → advances to final
-- GR86:    6 votes  → advances to final
-- 350Z:    5 votes  → advances to final
-- Mustang: 2 votes  (doesn't advance)
-- M2:      1 vote   (doesn't advance)

INSERT INTO nomination_votes (week_id, nomination_id, user_id, round)
VALUES
  -- WRX STI votes
  ('2026-W18', 'f1a2b3c4-0001-4d5e-a6f7-b8c9d0e1f2a3', 'voter-001', 1),
  ('2026-W18', 'f1a2b3c4-0001-4d5e-a6f7-b8c9d0e1f2a3', 'voter-002', 1),
  ('2026-W18', 'f1a2b3c4-0001-4d5e-a6f7-b8c9d0e1f2a3', 'voter-003', 1),
  ('2026-W18', 'f1a2b3c4-0001-4d5e-a6f7-b8c9d0e1f2a3', 'voter-004', 1),
  ('2026-W18', 'f1a2b3c4-0001-4d5e-a6f7-b8c9d0e1f2a3', 'voter-005', 1),
  ('2026-W18', 'f1a2b3c4-0001-4d5e-a6f7-b8c9d0e1f2a3', 'voter-006', 1),
  ('2026-W18', 'f1a2b3c4-0001-4d5e-a6f7-b8c9d0e1f2a3', 'voter-007', 1),
  ('2026-W18', 'f1a2b3c4-0001-4d5e-a6f7-b8c9d0e1f2a3', 'voter-008', 1),

  -- GR86 votes
  ('2026-W18', 'f1a2b3c4-0002-4d5e-a6f7-b8c9d0e1f2a3', 'voter-009', 1),
  ('2026-W18', 'f1a2b3c4-0002-4d5e-a6f7-b8c9d0e1f2a3', 'voter-010', 1),
  ('2026-W18', 'f1a2b3c4-0002-4d5e-a6f7-b8c9d0e1f2a3', 'voter-011', 1),
  ('2026-W18', 'f1a2b3c4-0002-4d5e-a6f7-b8c9d0e1f2a3', 'voter-012', 1),
  ('2026-W18', 'f1a2b3c4-0002-4d5e-a6f7-b8c9d0e1f2a3', 'voter-013', 1),
  ('2026-W18', 'f1a2b3c4-0002-4d5e-a6f7-b8c9d0e1f2a3', 'voter-014', 1),

  -- 350Z votes
  ('2026-W18', 'f1a2b3c4-0003-4d5e-a6f7-b8c9d0e1f2a3', 'voter-015', 1),
  ('2026-W18', 'f1a2b3c4-0003-4d5e-a6f7-b8c9d0e1f2a3', 'voter-016', 1),
  ('2026-W18', 'f1a2b3c4-0003-4d5e-a6f7-b8c9d0e1f2a3', 'voter-017', 1),
  ('2026-W18', 'f1a2b3c4-0003-4d5e-a6f7-b8c9d0e1f2a3', 'voter-018', 1),
  ('2026-W18', 'f1a2b3c4-0003-4d5e-a6f7-b8c9d0e1f2a3', 'voter-019', 1),

  -- Mustang votes
  ('2026-W18', 'f1a2b3c4-0004-4d5e-a6f7-b8c9d0e1f2a3', 'voter-020', 1),
  ('2026-W18', 'f1a2b3c4-0004-4d5e-a6f7-b8c9d0e1f2a3', 'voter-021', 1),

  -- M2 vote
  ('2026-W18', 'f1a2b3c4-0005-4d5e-a6f7-b8c9d0e1f2a3', 'voter-022', 1)

ON CONFLICT (week_id, user_id, round) DO NOTHING;
