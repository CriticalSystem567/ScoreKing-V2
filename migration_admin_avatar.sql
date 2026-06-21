-- ════════════════════════════════════════════════
-- Migration: admin profile photo support
-- Admins never had an avatar field at all (only viewers did).
-- Run this once in Supabase SQL Editor.
-- ════════════════════════════════════════════════

alter table admins add column if not exists avatar text;
