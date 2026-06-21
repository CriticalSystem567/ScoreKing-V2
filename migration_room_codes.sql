-- ════════════════════════════════════════════════
-- Migration: add room codes for instant viewer join
-- Run this in Supabase SQL Editor (safe to run once on your existing schema)
-- ════════════════════════════════════════════════

alter table rooms add column if not exists room_code text unique;

-- Backfill a room_code for any existing rooms that don't have one yet
-- (uses a short random code derived from a random uuid, uppercased)
update rooms
set room_code = upper(substring(replace(gen_random_uuid()::text, '-', '') for 6))
where room_code is null;
