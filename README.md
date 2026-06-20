# ScoreKing v2 — Multi-Tenant Rooms

This is a major rebuild of ScoreKing. Instead of one shared game for everyone,
each admin now runs their own completely separate, private room.

## What's new vs v1

- **Super-admin panel** (you) — generate/revoke invite codes, view/delete any admin's room
- **Admin signup** — requires an invite code; sets username + password + a security question
- **Admin login** — username + password (forgot-password via security question, no email needed)
- **Viewer self-registration** — players pick which admin's room to join, choose a username + PIN,
  then wait for that admin to approve them
- **Full data isolation** — every admin's game, scores, and player list are separate; no two rooms
  ever see each other's data
- **Dealer rotation** — before the game, the admin picks who deals first; dealing then auto-rotates
  through players in order every round, looping back to the start, skipping eliminated players
- **Fixed score-input bug** — number fields now select-all on focus, so typing immediately replaces
  the old value instead of inserting alongside it

## One-time setup (already done if you followed along)

1. Ran `schema.sql` in Supabase SQL Editor — creates `invite_codes`, `admins`, `rooms`, `viewers`
2. `src/supabaseClient.js` is wired to your existing Supabase project

## IMPORTANT: set your super-admin passphrase before deploying

Open `src/constants.js` and change this line to your own secret value:

```js
export const SUPER_ADMIN_PASSPHRASE = "changeme-super-2026";
```

To access the super-admin panel after deploying, visit:
```
https://your-app-url.vercel.app/?super=YOUR_PASSPHRASE
```
Keep this passphrase private — anyone who knows it can generate invite codes and manage all rooms.

## How people use the app

- **You (super-admin)**: generate an invite code, send it to a new host (e.g. Yogi)
- **Yogi (admin)**: visits the app, clicks "Create an admin account," enters the invite code,
  picks a username/password/security question — gets their own room
- **Yogi's friends (viewers)**: visit the app, click "Join a Friend's Game," enter Yogi's username,
  their own display name, a username, and a 4-digit PIN — request goes to Yogi for approval
- **Yogi approves them** in his Admin Panel → "Join Requests" tab
- **Approved friends** log in anytime via "I'm a Player — Log In" with their username + PIN,
  and land directly in Yogi's live game

## Deploying

Same process as before:
1. Upload this project's files to your GitHub repo (replacing the old ones), OR create a
   brand-new repo if you want this running as a separate app/URL alongside the old one
2. Connect/redeploy via Vercel
3. Share the resulting URL

### Running this as a second, separate deployment (testing alongside v1)

Since you wanted a separate test version: create a **new GitHub repo** (e.g. `scoreking-v2`),
upload these files there, then **Add New → Project** in Vercel pointing at that new repo.
You'll get a second independent URL, while your original v1 app keeps running untouched at
its existing URL. Both can share the same Supabase project (the new tables don't conflict
with the old `games`/`profiles` tables) or you can point this at a brand-new Supabase project
for full separation — your choice.

## Notes on security

- Passwords and PINs are stored in plain text in the database (no hashing). This is a
  deliberate simplification since there's no backend server here to hash them securely —
  acceptable for a casual game app, but don't reuse important passwords here.
- All tables are publicly readable/writable via your Supabase public API key, same model
  as v1. Fine for this use case; not suitable for sensitive data.
