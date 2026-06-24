-- ════════════════════════════════════════════════
-- Migration: unified accounts (one login for hosting AND playing)
-- This replaces the admins/viewers split with a single "players" table.
-- Fresh start: existing admin/viewer accounts are NOT migrated — everyone
-- signs up again under the new system. Old tables (admins, viewers,
-- invite_codes) are left in place but unused; drop them later if you like.
-- Run this ONCE in Supabase SQL Editor.
-- ════════════════════════════════════════════════

create table players (
  username text primary key,
  password text not null,                 -- plain text, same trade-off as before
  name text not null,                       -- display name
  avatar text,                              -- emoji or photo URL
  security_question text not null,
  security_answer text not null,

  -- Hosting: present only if this player has created their own room.
  room_code text unique,                    -- null if they've never hosted

  -- Current participation: which room they're currently inside as a PLAYER
  -- (null while not actively in anyone's room; this can even be their OWN
  -- username if they've toggled "I'm playing too" in their own room).
  current_room text references players(username),

  created_at timestamptz default now()
);

alter table players enable row level security;
create policy "public read players"   on players for select using (true);
create policy "public write players"  on players for insert with check (true);
create policy "public update players" on players for update using (true);
create policy "public delete players" on players for delete using (true);

-- Re-point `rooms` to key off `players` instead of the old `admins` table.
-- This DELETES any existing rooms tied to old admin accounts, since this is
-- a fresh start and those rooms have no corresponding player account anymore.
delete from rooms;
alter table rooms drop constraint if exists rooms_admin_username_fkey;
alter table rooms add constraint rooms_admin_username_fkey
  foreign key (admin_username) references players(username);

-- game_records / player_game_results key by plain text username with no FK
-- to admins/viewers specifically. Old history rows are harmless to leave, but
-- since accounts are starting fresh, you may want to clear them too:
-- delete from player_game_results;
-- delete from game_records;
