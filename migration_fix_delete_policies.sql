-- ════════════════════════════════════════════════
-- Migration: fix missing DELETE policies
-- Bug: the original schema gave `rooms` and `admins` tables select/insert/update
-- policies but never a DELETE policy, so the Super Admin's "Delete admin" button
-- silently deleted 0 rows (Row Level Security blocks deletes with no matching policy).
-- Run this once in Supabase SQL Editor to fix it.
-- ════════════════════════════════════════════════

create policy "public delete rooms" on rooms for delete using (true);
create policy "public delete admins" on admins for delete using (true);
