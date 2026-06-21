-- ════════════════════════════════════════════════
-- Migration: allow a viewer to exist with no room (after "Leave Room")
-- Previously, leaving a room deleted the entire account — including PIN,
-- display name, and any link to personal game history. Now leaving just
-- clears admin_username, keeping everything else intact.
-- Run this once in Supabase SQL Editor.
-- ════════════════════════════════════════════════

alter table viewers alter column admin_username drop not null;
