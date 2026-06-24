import { supabase } from "./supabaseClient.js";

/* ════════════════════════════════════════
   Unified account model: ONE "players" table for everyone.
   - Every account can host a room (if room_code is set) AND/OR
     join other rooms as a participant (tracked via current_room).
   - Being inside your OWN room as host is different from being a scored
     PLAYER in a game — that's controlled by whether your username appears
     in game.players for that room (see GameScreen's "I'm playing too" toggle).
   ════════════════════════════════════════ */

const norm = (s) => String(s || "").trim().toLowerCase();

function genCode(len, chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789") {
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/* ─── ACCOUNTS ─── */
export async function usernameTaken(username) {
  const { data } = await supabase.from("players").select("username").eq("username", norm(username)).maybeSingle();
  return Boolean(data);
}

export async function signUp({ username, password, name, securityQuestion, securityAnswer }) {
  const u = norm(username);
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) return { ok: false, error: "Username must be 3-20 letters/numbers/underscores" };
  if (await usernameTaken(u)) return { ok: false, error: "Username already taken" };
  if (password.length < 4) return { ok: false, error: "Password must be at least 4 characters" };

  const { error } = await supabase.from("players").insert({
    username: u, password, name: name.trim() || u,
    security_question: securityQuestion, security_answer: norm(securityAnswer),
  });
  if (error) return { ok: false, error: "Could not create account: " + error.message };
  return { ok: true, username: u };
}

export async function login(username, password) {
  const u = norm(username);
  const { data, error } = await supabase.from("players").select("*").eq("username", u).maybeSingle();
  if (error || !data) return { ok: false, error: "Account not found" };
  if (data.password !== password) return { ok: false, error: "Incorrect password" };
  return { ok: true, player: data };
}

export async function getSecurityQuestion(username) {
  const { data } = await supabase.from("players").select("security_question").eq("username", norm(username)).maybeSingle();
  return data?.security_question || null;
}

export async function resetPassword(username, securityAnswer, newPassword) {
  const u = norm(username);
  const { data } = await supabase.from("players").select("security_answer").eq("username", u).maybeSingle();
  if (!data) return { ok: false, error: "Account not found" };
  if (norm(securityAnswer) !== data.security_answer) return { ok: false, error: "Security answer doesn't match" };
  const { error } = await supabase.from("players").update({ password: newPassword }).eq("username", u);
  if (error) return { ok: false, error: "Could not update password" };
  return { ok: true };
}

export async function changeName(username, newName) {
  if (!newName.trim()) return { ok: false, error: "Enter a name" };
  const { error } = await supabase.from("players").update({ name: newName.trim() }).eq("username", norm(username));
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function changePassword(username, currentPassword, newPassword) {
  if (newPassword.length < 4) return { ok: false, error: "New password must be at least 4 characters" };
  const u = norm(username);
  const { data } = await supabase.from("players").select("password").eq("username", u).maybeSingle();
  if (!data) return { ok: false, error: "Account not found" };
  if (data.password !== currentPassword) return { ok: false, error: "Current password is incorrect" };
  const { error } = await supabase.from("players").update({ password: newPassword }).eq("username", u);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function changeAvatar(username, avatarUrl) {
  const { error } = await supabase.from("players").update({ avatar: avatarUrl }).eq("username", norm(username));
  return !error;
}

/* ─── SUPER-ADMIN ─── */
export async function listAllPlayers() {
  const { data, error } = await supabase.from("players").select("username, name, room_code, created_at").order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}
export async function deletePlayerAccount(username) {
  const u = norm(username);
  // detach anyone currently inside this player's room, if they host one
  await supabase.from("players").update({ current_room: null }).eq("current_room", u);
  await supabase.from("rooms").delete().eq("admin_username", u);
  const { error } = await supabase.from("players").delete().eq("username", u);
  return !error;
}

/* ─── ROOMS (hosting) ─── */
export async function createRoom(username) {
  const u = norm(username);
  let code = genCode(6);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error: roomErr } = await supabase.from("rooms").insert({ admin_username: u, room_code: code });
    if (!roomErr) {
      await supabase.from("players").update({ room_code: code }).eq("username", u);
      return { ok: true, code };
    }
    if (roomErr.code === "23505") { code = genCode(6); continue; }
    return { ok: false, error: roomErr.message };
  }
  return { ok: false, error: "Could not create a unique room code, try again" };
}

export async function getMyRoomCode(username) {
  const { data } = await supabase.from("players").select("room_code").eq("username", norm(username)).maybeSingle();
  return data?.room_code || null;
}

export async function getRoomGame(adminUsername) {
  const { data, error } = await supabase.from("rooms").select("game, locked").eq("admin_username", norm(adminUsername)).maybeSingle();
  if (error || !data) return null;
  return { ...data.game, _roomLocked: data.locked };
}
export async function setRoomGame(adminUsername, game) {
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
export async function regenerateRoomCode(adminUsername) {
  let newCode = genCode(6);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from("rooms").update({ room_code: newCode }).eq("admin_username", norm(adminUsername));
    if (!error) {
      await supabase.from("players").update({ room_code: newCode }).eq("username", norm(adminUsername));
      return { ok: true, code: newCode };
    }
    if (error.code === "23505") { newCode = genCode(6); continue; }
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Could not generate a unique code, try again" };
}
async function findHostByRoomCode(roomCode) {
  const { data } = await supabase.from("rooms").select("admin_username").eq("room_code", roomCode.trim().toUpperCase()).maybeSingle();
  return data?.admin_username || null;
}

/* ─── JOINING / LEAVING / SWITCHING ROOMS (as a participant) ─── */
export async function joinRoomByCode(username, roomCode) {
  const hostUsername = await findHostByRoomCode(roomCode);
  if (!hostUsername) return { ok: false, error: "Room code not found — check it with your host" };
  const { error } = await supabase.from("players").update({ current_room: hostUsername }).eq("username", norm(username));
  if (error) return { ok: false, error: error.message };
  return { ok: true, hostUsername };
}
export async function leaveCurrentRoom(username) {
  const { error } = await supabase.from("players").update({ current_room: null }).eq("username", norm(username));
  return !error;
}

/* ─── ROOM PARTICIPANTS (people currently sitting in a given room) ─── */
export async function listRoomParticipants(adminUsername) {
  const { data, error } = await supabase.from("players").select("*").eq("current_room", norm(adminUsername)).order("created_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
}
export async function removeParticipant(username) {
  const { error } = await supabase.from("players").update({ current_room: null }).eq("username", norm(username));
  return !error;
}

/* ─── PERSISTENT PERSONAL GAME HISTORY ─── */
export async function recordFinishedGame({ adminUsername, game, usernameByPlayerIndex }) {
  if (!game.history || game.history.length === 0) return { ok: true, skipped: true };

  const finalStandings = game.players.map(p => ({ name: p.name, total: p.total, eliminated: p.eliminated }));

  const { data: recordRow, error: recErr } = await supabase.from("game_records").insert({
    admin_username: norm(adminUsername),
    winner: game.winner || null,
    max_score: game.maxScore,
    rounds_played: game.round - 1,
    full_history: game.history,
    final_standings: finalStandings,
  }).select("id").single();

  if (recErr || !recordRow) return { ok: false, error: recErr?.message || "Failed to create game record" };

  const rows = [];
  game.players.forEach((p, i) => {
    const username = usernameByPlayerIndex[i];
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

  if (rows.length > 0) {
    const { error: prErr } = await supabase.from("player_game_results").insert(rows);
    if (prErr) return { ok: false, error: prErr.message };
  }
  return { ok: true };
}

export async function getMyGameHistory(username) {
  const { data, error } = await supabase
    .from("player_game_results")
    .select("*")
    .eq("username", norm(username))
    .order("ended_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function getMyOverallStats(username) {
  const history = await getMyGameHistory(username);
  const played = history.length;
  const won = history.filter(r => r.won).length;
  const lost = history.filter(r => !r.won && r.eliminated).length;
  const other = played - won - lost; // e.g. game reset before anyone was eliminated/won
  const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
  return { played, won, lost, other, winRate };
}

export async function getAdminGameHistory(adminUsername) {
  const { data, error } = await supabase
    .from("game_records")
    .select("*")
    .eq("admin_username", norm(adminUsername))
    .order("ended_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

/* ─── AVATAR PHOTO UPLOAD (Supabase Storage 'avatars' bucket) ─── */
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
