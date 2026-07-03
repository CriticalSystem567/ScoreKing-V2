-- ════════════════════════════════════════════════
-- Migration: multi-room support
-- An admin can now own MULTIPLE rooms over time (not just one). Each room
-- gets its own id and room_code; an admin's `players` row no longer stores
-- a single room_code directly — instead, rooms reference the admin who owns
-- them, and an admin can list/reopen any room they've created.
-- Run this ONCE in Supabase SQL Editor.
-- ════════════════════════════════════════════════

-- 1. Give rooms a real primary key instead of admin_username being the PK.
--    (This allows many rooms per admin.)
alter table rooms add column if not exists id bigint generated always as identity;
alter table rooms add column if not exists created_at timestamptz default now();
alter table rooms add column if not exists archived boolean not null default false;

-- Drop the old primary-key constraint on admin_username (if it exists as PK)
-- and make id the primary key instead.
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'rooms' and constraint_type = 'PRIMARY KEY'
  ) then
    execute (
      select 'alter table rooms drop constraint ' || quote_ident(constraint_name)
      from information_schema.table_constraints
      where table_name = 'rooms' and constraint_type = 'PRIMARY KEY'
      limit 1
    );
  end if;
end $$;

alter table rooms add primary key (id);

-- admin_username is no longer unique (one admin, many rooms) — just an
-- indexed foreign key now.
alter table rooms drop constraint if exists rooms_admin_username_fkey;
alter table rooms add constraint rooms_admin_username_fkey
  foreign key (admin_username) references players(username);
create index if not exists idx_rooms_admin_username on rooms(admin_username);

-- room_code stays unique across ALL rooms (so a code always identifies
-- exactly one room, globally).
alter table rooms drop constraint if exists rooms_room_code_key;
alter table rooms add constraint rooms_room_code_key unique (room_code);

-- 2. `players.room_code` is removed as a concept — an admin's "current room
--    code" doesn't make sense anymore when they can have many. Players
--    still use `current_room` to track which room (by id now, not by admin
--    username) they're actively sitting in as a participant.
alter table players drop column if exists room_code;
alter table players add column if not exists current_room_id bigint references rooms(id);

-- current_room (admin_username-based) is superseded by current_room_id
-- (room-id based). Drop the old column once you've confirmed the app no
-- longer needs it — left in place for now in case a rollback is needed:
-- alter table players drop column if exists current_room;
