# ScoreKing — Unified Accounts

This is a major architecture change: there is no longer a separate "admin"
and "viewer" account type. Everyone has ONE account that can both host their
own room and join other people's rooms, using the same username and password.

## What changed

- **One signup/login** for everyone (username, password, security question).
- **Hosting** is automatic: the first time you log in, you get your own room
  with a shareable room code, found under your profile → "🏠 Room" tab.
- **Joining** someone else's room (via their room code) makes you a player
  there. If you also host your own room, that's unaffected — you can switch
  between "My Room" and any room you've joined using a button that appears
  whenever both apply.
- **"I'm playing too"** — when starting your own game, toggle this if you
  want to be one of the scored players, not just running the scoreboard.
- **No more typed player names** — players are selected from the list of
  people who've actually joined your room via room code. Dealing order is
  set per-player with a small dropdown.
- **Setup locks once a game starts** — number of players, max score, and
  dealing order can't change until you Reset.
- **Personal history dashboard** — total games played/won/lost and win rate,
  plus a full per-game list, available from your profile's "📜 History" tab,
  regardless of which room you're currently viewing.
- **Super-admin panel** now lists every account, flags which ones host a
  room, and can delete any account (which also removes their room if they
  have one).

## IMPORTANT: this is a fresh start, not a data migration

Existing admin/viewer accounts from the previous version are **not**
carried over. Everyone — including you — creates a new account under this
system. The old `admins`, `viewers`, and `invite_codes` tables are left in
the database, untouched and unused; you can drop them later if you like.

## Setup

1. Run `migration_unified_accounts.sql` in Supabase SQL Editor. **Read it
   first** — it deletes any existing rows in the `rooms` table as part of
   re-pointing its foreign key, since those rooms belonged to the old admin
   accounts that no longer exist under this system.
2. Set your own `SUPER_ADMIN_PASSPHRASE` in `src/constants.js` if you
   haven't already.
3. Deploy as before: GitHub → Vercel auto-redeploy.

## Everything else

Room codes, dealer rotation, round history, zone jokes, winner lines, room
locking, profile photos, and the About/intro screen all carry over unchanged
from the previous version — only the account system underneath them changed.
