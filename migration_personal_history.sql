-- ════════════════════════════════════════════════
-- Migration: persistent personal game history
-- Stores a permanent record of every completed/reset game, per player,
-- surviving room switches, resets, and even being removed from a room.
-- Run this once in Supabase SQL Editor.
-- ════════════════════════════════════════════════

create table game_records (
  id bigint generated always as identity primary key,
  admin_username text not null,        -- which room this game was played in
  ended_at timestamptz default now(),
  winner text,                          -- player name who won, or null if reset early/no winner
  max_score int not null,
  rounds_played int not null,
  full_history jsonb not null,          -- the complete round-by-round log (same shape as game.history)
  final_standings jsonb not null        -- [{name, total, eliminated}, ...] at the moment of recording
);

-- One row per PLAYER per game record, so each player can query "my games" directly,
-- without scanning every room's full_history and filtering by name (which wouldn't be
-- reliable anyway since display names aren't unique — only usernames are).
create table player_game_results (
  id bigint generated always as identity primary key,
  game_record_id bigint not null references game_records(id) on delete cascade,
  username text not null,               -- the viewer's permanent username
  player_name text not null,             -- their display name AT THE TIME (names can change later)
  admin_username text not null,
  ended_at timestamptz default now(),
  final_score int not null,
  eliminated boolean not null,
  won boolean not null,
  rounds_played int not null
);

alter table game_records enable row level security;
alter table player_game_results enable row level security;

create policy "public read game_records"  on game_records for select using (true);
create policy "public write game_records" on game_records for insert with check (true);

create policy "public read player_game_results"  on player_game_results for select using (true);
create policy "public write player_game_results" on player_game_results for insert with check (true);

create index idx_player_game_results_username on player_game_results(username);
