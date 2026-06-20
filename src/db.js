import { supabase } from "./supabaseClient.js";

/* ════════════════════════════════════════
   All Supabase queries for the multi-tenant room system live here.
   Tables: invite_codes, admins, rooms, viewers
   ════════════════════════════════════════ */

const norm = (s) => String(s || "").trim().toLowerCase();

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
  const check = await checkInviteCode(inviteCode);
  if (!check.valid) return { ok: false, error: check.reason };

  const { error } = await supabase.from("admins").insert({
    username: u,
    password,
    security_question: securityQuestion,
    security_answer: norm(securityAnswer),
    invite_code: inviteCode,
  });
  if (error) return { ok: false, error: "Could not create account: " + error.message };

  await consumeInviteCode(inviteCode, u);

  // create their room
  const { error: roomErr } = await supabase.from("rooms").insert({ admin_username: u });
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
  await supabase.from("viewers").delete().eq("admin_username", u);
  await supabase.from("rooms").delete().eq("admin_username", u);
  const { error } = await supabase.from("admins").delete().eq("username", u);
  return !error;
}

/* ─── ROOMS (game state) ─── */
export async function getRoomGame(adminUsername) {
  const { data, error } = await supabase.from("rooms").select("game").eq("admin_username", norm(adminUsername)).maybeSingle();
  if (error || !data) return null;
  return data.game;
}
export async function setRoomGame(adminUsername, game) {
  const { error } = await supabase.from("rooms")
    .update({ game, updated_at: new Date().toISOString() })
    .eq("admin_username", norm(adminUsername));
  if (error) console.error(error);
  return !error;
}

/* ─── VIEWERS ─── */
export async function requestJoin({ username, pin, name, adminUsername }) {
  const u = norm(username);
  if (await usernameTaken(u)) return { ok: false, error: "Username already taken" };
  if (!/^\d{4}$/.test(pin)) return { ok: false, error: "PIN must be 4 digits" };
  const { data: adminExists } = await supabase.from("admins").select("username").eq("username", norm(adminUsername)).maybeSingle();
  if (!adminExists) return { ok: false, error: "No admin found with that username" };

  const { error } = await supabase.from("viewers").insert({
    username: u, pin, name: name.trim() || u, admin_username: norm(adminUsername), approved: false,
  });
  if (error) return { ok: false, error: "Could not submit request: " + error.message };
  return { ok: true };
}

export async function loginViewer(username, pin) {
  const u = norm(username);
  const { data, error } = await supabase.from("viewers").select("*").eq("username", u).maybeSingle();
  if (error || !data) return { ok: false, error: "Username not found" };
  if (data.pin !== pin) return { ok: false, error: "Incorrect PIN" };
  if (!data.approved) return { ok: false, error: "Your request hasn't been approved yet by the admin" };
  return { ok: true, viewer: data };
}

export async function listViewersForAdmin(adminUsername) {
  const { data, error } = await supabase.from("viewers").select("*").eq("admin_username", norm(adminUsername)).order("created_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function approveViewer(username) {
  const { error } = await supabase.from("viewers").update({ approved: true }).eq("username", norm(username));
  return !error;
}
export async function rejectViewer(username) {
  const { error } = await supabase.from("viewers").delete().eq("username", norm(username));
  return !error;
}
export async function updateViewer(username, fields) {
  const { error } = await supabase.from("viewers").update(fields).eq("username", norm(username));
  return !error;
}
export async function removeViewer(username) {
  const { error } = await supabase.from("viewers").delete().eq("username", norm(username));
  return !error;
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
