import { supabase } from "./supabaseClient.js";

/* ════════════════════════════════════════
   All Supabase queries for the multi-tenant room system live here.
   Tables: invite_codes, admins, rooms, viewers
   ════════════════════════════════════════ */

const norm = (s) => String(s || "").trim().toLowerCase();

function genRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/* ─── INVITE CODES ─── */
export async function createInviteCode(code) {
  const { error } = await supabase.from("invite_codes").insert({ code });
  return !error;
}
export async function listInviteCodes() {
  const { data, error } = await supabase.from("invite_codes").select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}
export async function revokeInviteCode(code) {
  const { error } = await supabase.from("invite_codes").update({ revoked: true }).eq("code", code);
  return !error;
}
export async function checkInviteCode(code) {
  const { data, error } = await supabase.from("invite_codes").select("*").eq("code", code).maybeSingle();
  if (error || !data) return { valid: false, reason: "Invite code not found" };
  if (data.revoked) return { valid: false, reason: "This invite code has been revoked" };
  if (data.used_by) return { valid: false, reason: "This invite code has already been used" };
  return { valid: true };
}
async function consumeInviteCode(code, username) {
  await supabase.from("invite_codes").update({ used_by: username, used_at: new Date().toISOString() }).eq("code", code);
}

/* ─── ADMINS ─── */
export async function usernameTaken(username) {
  const u = norm(username);
  const [a, v] = await Promise.all([
    supabase.from("admins").select("username").eq("username", u).maybeSingle(),
    supabase.from("viewers").select("username").eq("username", u).maybeSingle(),
  ]);
  return Boolean(a.data || v.data);
}

export async function signUpAdmin({ username, password, securityQuestion, securityAnswer, inviteCode }) {
  const u = norm(username);
  if (await usernameTaken(u)) return { ok: false, error: "Username already taken" };

  // Invite codes are no longer required to sign up as an admin (open signup).
  // If a code IS provided, still validate + consume it (keeps the door open to
  // re-enabling gatekeeping later without touching this function again).
  let usedCode = null;
  if (inviteCode && inviteCode.trim()) {
    const check = await checkInviteCode(inviteCode.trim());
    if (check.valid) usedCode = inviteCode.trim();
  }

  const { error } = await supabase.from("admins").insert({
    username: u,
    password,
    security_question: securityQuestion,
    security_answer: norm(securityAnswer),
    invite_code: usedCode,
  });
  if (error) return { ok: false, error: "Could not create account: " + error.message };

  if (usedCode) await consumeInviteCode(usedCode, u);

  // create their room with a fresh, unique room code (retry on rare collision)
  let roomCode = genRoomCode();
  let roomErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from("rooms").insert({ admin_username: u, room_code: roomCode });
    if (!error) { roomErr = null; break; }
    roomErr = error;
    if (error.code === "23505") { roomCode = genRoomCode(); continue; } // unique violation, retry with new code
    break;
  }
  if (roomErr) return { ok: false, error: "Account created but room setup failed: " + roomErr.message };

  return { ok: true, username: u };
}

export async function loginAdmin(username, password) {
  const u = norm(username);
  const { data, error } = await supabase.from("admins").select("*").eq("username", u).maybeSingle();
  if (error || !data) return { ok: false, error: "Admin not found" };
  if (data.password !== password) return { ok: false, error: "Incorrect password" };
  return { ok: true, admin: data };
}

export async function changeAdminAvatar(username, avatarUrl) {
  const { error } = await supabase.from("admins").update({ avatar: avatarUrl }).eq("username", norm(username));
  return !error;
}

export async function changeAdminName(username, newName) {
  if (!newName.trim()) return { ok: false, error: "Enter a name" };
  const { error } = await supabase.from("admins").update({ name: newName.trim() }).eq("username", norm(username));
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getAdminSecurityQuestion(username) {
  const { data } = await supabase.from("admins").select("security_question").eq("username", norm(username)).maybeSingle();
  return data?.security_question || null;
}

export async function resetAdminPassword(username, securityAnswer, newPassword) {
  const u = norm(username);
  const { data } = await supabase.from("admins").select("security_answer").eq("username", u).maybeSingle();
  if (!data) return { ok: false, error: "Admin not found" };
  if (norm(securityAnswer) !== data.security_answer) return { ok: false, error: "Security answer doesn't match" };
  const { error } = await supabase.from("admins").update({ password: newPassword }).eq("username", u);
  if (error) return { ok: false, error: "Could not update password" };
  return { ok: true };
}

/* ─── SUPER-ADMIN ─── */
export async function listAllAdmins() {
  const { data, error } = await supabase.from("admins").select("username, created_at").order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}
export async function deleteAdmin(username) {
  const u = norm(username);
  const r1 = await supabase.from("viewers").delete().eq("admin_username", u);
  if (r1.error) { console.error("delete viewers failed:", r1.error); return false; }
  const r2 = await supabase.from("rooms").delete().eq("admin_username", u);
  if (r2.error) { console.error("delete room failed:", r2.error); return false; }
  const r3 = await supabase.from("admins").delete().eq("username", u);
  if (r3.error) { console.error("delete admin failed:", r3.error); return false; }
  return true;
}

/* ─── ROOMS (game state + room code + lock status) ─── */
export async function getRoomGame(adminUsername) {
  const { data, error } = await supabase.from("rooms").select("game, locked").eq("admin_username", norm(adminUsername)).maybeSingle();
  if (error || !data) return null;
  return { ...data.game, _roomLocked: data.locked };
}
export async function setRoomGame(adminUsername, game) {
  // strip the transient _roomLocked flag before saving — it's read from the rooms.locked
  // column directly, not part of the game JSON blob itself.
  const { _roomLocked, ...cleanGame } = game;
  const { error } = await supabase.from("rooms")
    .update({ game: cleanGame, updated_at: new Date().toISOString() })
    .eq("admin_username", norm(adminUsername));
  if (error) console.error(error);
  return !error;
}
export async function setRoomLocked(adminUsername, locked) {
  const { error } = await supabase.from("rooms").update({ locked }).eq("admin_username", norm(adminUsername));
  return !error;
}
export async function getRoomCode(adminUsername) {
  const { data, error } = await supabase.from("rooms").select("room_code").eq("admin_username", norm(adminUsername)).maybeSingle();
  if (error || !data) return null;
  return data.room_code;
}
export async function regenerateRoomCode(adminUsername) {
  let newCode = genRoomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from("rooms").update({ room_code: newCode }).eq("admin_username", norm(adminUsername));
    if (!error) return { ok: true, code: newCode };
    if (error.code === "23505") { newCode = genRoomCode(); continue; }
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Could not generate a unique code, try again" };
}
async function findAdminByRoomCode(roomCode) {
  const { data, error } = await supabase.from("rooms").select("admin_username").eq("room_code", roomCode.trim().toUpperCase()).maybeSingle();
  if (error || !data) return null;
  return data.admin_username;
}

/* ─── VIEWERS ─── */
export async function joinRoom({ username, pin, name, roomCode }) {
  const u = norm(username);
  if (await usernameTaken(u)) return { ok: false, error: "Username already taken" };
  if (!/^\d{4}$/.test(pin)) return { ok: false, error: "PIN must be 4 digits" };

  const adminUsername = await findAdminByRoomCode(roomCode);
  if (!adminUsername) return { ok: false, error: "Room code not found — check it with your host" };

  const { error } = await supabase.from("viewers").insert({
    username: u, pin, name: name.trim() || u, admin_username: adminUsername, approved: true,
  });
  if (error) return { ok: false, error: "Could not join: " + error.message };
  return { ok: true, adminUsername };
}

export async function loginViewer(username, pin) {
  const u = norm(username);
  const { data, error } = await supabase.from("viewers").select("*").eq("username", u).maybeSingle();
  if (error || !data) return { ok: false, error: "Username not found" };
  if (data.pin !== pin) return { ok: false, error: "Incorrect PIN" };
  return { ok: true, viewer: data };
}

export async function listViewersForAdmin(adminUsername) {
  const { data, error } = await supabase.from("viewers").select("*").eq("admin_username", norm(adminUsername)).order("created_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function updateViewer(username, fields) {
  const { error } = await supabase.from("viewers").update(fields).eq("username", norm(username));
  return !error;
}
export async function removeViewer(username) {
  const { error } = await supabase.from("viewers").delete().eq("username", norm(username));
  return !error;
}

/* ─── SELF-SERVICE (player manages their own profile) ─── */
export async function changeOwnName(username, newName) {
  if (!newName.trim()) return { ok: false, error: "Enter a name" };
  const { error } = await supabase.from("viewers").update({ name: newName.trim() }).eq("username", norm(username));
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
export async function changeOwnPin(username, currentPin, newPin) {
  if (!/^\d{4}$/.test(newPin)) return { ok: false, error: "New PIN must be 4 digits" };
  const u = norm(username);
  const { data, error } = await supabase.from("viewers").select("pin").eq("username", u).maybeSingle();
  if (error || !data) return { ok: false, error: "Account not found" };
  if (data.pin !== currentPin) return { ok: false, error: "Current PIN is incorrect" };
  const { error: updErr } = await supabase.from("viewers").update({ pin: newPin }).eq("username", u);
  if (updErr) return { ok: false, error: updErr.message };
  return { ok: true };
}
/* Leave the current room and join a different one by room code, keeping the same username/PIN. */
export async function switchRoom(username, newRoomCode) {
  const adminUsername = await findAdminByRoomCode(newRoomCode);
  if (!adminUsername) return { ok: false, error: "Room code not found — check it with your host" };
  const { error } = await supabase.from("viewers").update({ admin_username: adminUsername }).eq("username", norm(username));
  if (error) return { ok: false, error: error.message };
  return { ok: true, adminUsername };
}
export async function leaveRoom(username) {
  // Previously deleted the whole account — now just detaches from the room,
  // so the player's username, PIN, and personal game history all survive.
  const { error } = await supabase.from("viewers").update({ admin_username: null }).eq("username", norm(username));
  return !error;
}

/* ─── PERSISTENT PERSONAL GAME HISTORY ───
   Recorded once per game (on reset/replay or natural end-with-winner), survives
   room switches, resets, and even a player being removed from a room. */
export async function recordFinishedGame({ adminUsername, game, viewerUsernameByPlayerIndex }) {
  try {
    console.log("[ScoreKing/db] recordFinishedGame starting. history:", game?.history?.length);
    if (!game.history || game.history.length === 0) {
      console.log("[ScoreKing/db] skipped — no history");
      return { ok: true, skipped: true };
    }

    const finalStandings = game.players.map(p => ({ name: p.name, total: p.total, eliminated: p.eliminated }));

    const insertPayload = {
      admin_username: norm(adminUsername),
      winner: game.winner || null,
      max_score: game.maxScore,
      rounds_played: game.round - 1,
      full_history: game.history,
      final_standings: finalStandings,
    };
    console.log("[ScoreKing/db] inserting game_records:", insertPayload);

    const { data: recordRow, error: recErr } = await supabase.from("game_records").insert(insertPayload).select("id").single();
    console.log("[ScoreKing/db] game_records insert result:", { recordRow, recErr });

    if (recErr || !recordRow) return { ok: false, error: recErr?.message || "Failed to create game record" };

    const rows = [];
    game.players.forEach((p, i) => {
      const username = viewerUsernameByPlayerIndex[i];
      if (!username) return;
      rows.push({
        game_record_id: recordRow.id,
        username: norm(username),
        player_name: p.name,
        admin_username: norm(adminUsername),
        final_score: p.total,
        eliminated: p.eliminated,
        won: game.winner === p.name,
        rounds_played: game.round - 1,
      });
    });
    console.log("[ScoreKing/db] player_game_results rows to insert:", rows);

    if (rows.length > 0) {
      const { error: prErr, data: prData } = await supabase.from("player_game_results").insert(rows).select();
      console.log("[ScoreKing/db] player_game_results insert result:", { prData, prErr });
      if (prErr) return { ok: false, error: prErr.message };
    } else {
      console.log("[ScoreKing/db] no rows to insert — no players matched a real viewer account");
    }
    return { ok: true };
  } catch (e) {
    console.error("[ScoreKing/db] recordFinishedGame THREW:", e);
    return { ok: false, error: String(e) };
  }
}

export async function getMyGameHistory(username) {
  console.log("[ScoreKing/db] getMyGameHistory for:", username);
  const { data, error } = await supabase
    .from("player_game_results")
    .select("*, game_records(full_history, final_standings)")
    .eq("username", norm(username))
    .order("ended_at", { ascending: false });
  console.log("[ScoreKing/db] getMyGameHistory result:", { data, error });
  if (error) { console.error("[ScoreKing/db] getMyGameHistory ERROR:", error); return []; }
  return data || [];
}

/* Every game ever recorded in an admin's room — who won, when, how many rounds. */
export async function getAdminGameHistory(adminUsername) {
  const { data, error } = await supabase
    .from("game_records")
    .select("*")
    .eq("admin_username", norm(adminUsername))
    .order("ended_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

/* ─── AVATAR PHOTO UPLOAD (reused from v1) ─── */
export async function uploadAvatarPhoto(file, idHint) {
  try {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${idHint}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { console.error(upErr); return null; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) { console.error(e); return null; }
}
