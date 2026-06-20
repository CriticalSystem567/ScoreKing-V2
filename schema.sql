-- ════════════════════════════════════════════════
-- ScoreKing Multi-Tenant Schema
-- Run this entire file in Supabase SQL Editor in one go.
-- (Safe to run even though you already have `games` and `profiles` —
--  those old tables are no longer used by the new system and can be
--  left as-is or deleted later; this script does not touch them.)
-- ════════════════════════════════════════════════

-- 1. INVITE CODES — generated/revoked by the super-admin, consumed once by a new admin signing up
create table invite_codes (
  code text primary key,
  created_at timestamptz default now(),
  used_by text,            -- admin username that consumed it, null if unused
  used_at timestamptz,
  revoked boolean default false
);

-- 2. ADMINS — one row per room owner (Yogi, Tharun, etc.)
create table admins (
  username text primary key,        -- globally unique, lowercase enforced in app code
  password text not null,           -- plain text for simplicity at this scale; see note below
  security_question text not null,
  security_answer text not null,    -- stored lowercase/trimmed for matching
  invite_code text references invite_codes(code),
  created_at timestamptz default now()
);

-- 3. ROOMS — one row per admin, holds that admin's entire game state as JSON
--    (same shape as your old `games` table's `data` column)
create table rooms (
  admin_username text primary key references admins(username),
  game jsonb not null default '{
    "numPlayers": 4,
    "maxScore": 200,
    "round": 1,
    "players": [],
    "history": [],
    "updatedAt": 0
  }'::jsonb,
  updated_at timestamptz default now()
);

-- 4. VIEWERS — approved players inside a specific admin's room
--    username is globally unique across the WHOLE app (admins + viewers share the namespace)
create table viewers (
  username text primary key,
  pin text not null,                -- 4 digit
  name text not null,
  avatar text not null default '🎮', -- emoji or a photo URL
  admin_username text not null references admins(username),
  approved boolean default false,
  created_at timestamptz default now()
);

-- ── Row Level Security: public read/write, same model as your existing tables.
--    There's no sensitive data here beyond a casual scoreboard password, but note this
--    means anyone with your public API key could technically read these tables directly.
alter table invite_codes enable row level security;
alter table admins        enable row level security;
alter table rooms         enable row level security;
alter table viewers       enable row level security;

create policy "public read invite_codes"  on invite_codes for select using (true);
create policy "public write invite_codes" on invite_codes for insert with check (true);
create policy "public update invite_codes" on invite_codes for update using (true);

create policy "public read admins"  on admins for select using (true);
create policy "public write admins" on admins for insert with check (true);
create policy "public update admins" on admins for update using (true);

create policy "public read rooms"  on rooms for select using (true);
create policy "public write rooms" on rooms for insert with check (true);
create policy "public update rooms" on rooms for update using (true);

create policy "public read viewers"  on viewers for select using (true);
create policy "public write viewers" on viewers for insert with check (true);
create policy "public update viewers" on viewers for update using (true);
create policy "public delete viewers" on viewers for delete using (true);
