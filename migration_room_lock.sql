-- ════════════════════════════════════════════════
-- Migration: room lock/close feature
-- Lets an admin temporarily lock their room — viewers see a "closed" message
-- instead of the scoreboard, and can't play until the admin reopens it.
-- Run this once in Supabase SQL Editor.
-- ════════════════════════════════════════════════

alter table rooms add column if not exists locked boolean not null default false;
