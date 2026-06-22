-- ════════════════════════════════════════════════
-- Migration: admin display name
-- Admins only ever had a username (used for login) — no separate display name,
-- unlike viewers who have both. This adds one, defaulting to the username so
-- existing admins aren't left blank.
-- Run this once in Supabase SQL Editor.
-- ════════════════════════════════════════════════

alter table admins add column if not exists name text;
update admins set name = username where name is null;
