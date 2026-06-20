import { useState, useEffect } from "react";
import { S } from "../styles.jsx";
import { genInviteCode } from "../constants.js";
import { createInviteCode, listInviteCodes, revokeInviteCode, listAllAdmins, deleteAdmin } from "../db.js";

export default function SuperAdminScreen({ onExit }) {
  const [codes, setCodes] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const refresh = async () => {
    const [c, a] = await Promise.all([listInviteCodes(), listAllAdmins()]);
    setCodes(c); setAdmins(a); setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleGenerate = async () => {
    const code = genInviteCode();
    const ok = await createInviteCode(code);
    if (ok) { showToast(`✅ Created code: ${code}`); refresh(); }
    else showToast("⚠️ Failed to create code");
  };

  const handleRevoke = async (code) => {
    const ok = await revokeInviteCode(code);
    if (ok) { showToast("Revoked"); refresh(); }
  };

  const handleDeleteAdmin = async (username) => {
    if (!confirm(`Delete admin "${username}" and their entire room, viewers, and history? This can't be undone.`)) return;
    const ok = await deleteAdmin(username);
    if (ok) { showToast(`Deleted ${username}`); refresh(); }
    else showToast("⚠️ Failed to delete");
  };

  return (
    <div style={S.appWrap}>
      <div style={S.topBar}>
        <div style={{ fontWeight: 700, color: "#a48cff" }}>🛡 Super Admin</div>
        <button style={{ ...S.btn, ...S.btnGhost }} onClick={onExit}>✕ Exit</button>
      </div>

      <div style={S.glass}>
        <div style={S.sectionLabel}>Invite Codes</div>
        <button style={{ ...S.btn, ...S.btnAccent, width: "100%", marginBottom: 14 }} onClick={handleGenerate}>
          ✨ Generate New Invite Code
        </button>

        {loading && <div style={{ color: "#6b6b8a", fontSize: 13, textAlign: "center" }}>Loading…</div>}

        {!loading && codes.map(c => (
          <div key={c.code} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            padding: "10px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 10, marginBottom: 8, opacity: c.revoked ? 0.45 : 1,
          }}>
            <div>
              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, color: "#f5c842" }}>{c.code}</div>
              <div style={{ fontSize: 11, color: "#6b6b8a" }}>
                {c.revoked ? "Revoked" : c.used_by ? `Used by ${c.used_by}` : "Unused"}
              </div>
            </div>
            {!c.revoked && !c.used_by && (
              <button style={{ ...S.btn, ...S.btnRed, padding: "5px 10px", minHeight: 30, fontSize: 12 }} onClick={() => handleRevoke(c.code)}>
                Revoke
              </button>
            )}
          </div>
        ))}
        {!loading && codes.length === 0 && <div style={{ color: "#6b6b8a", fontSize: 13, textAlign: "center" }}>No codes yet</div>}
      </div>

      <div style={S.glass}>
        <div style={S.sectionLabel}>All Admin Rooms</div>
        {!loading && admins.map(a => (
          <div key={a.username} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            padding: "10px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 10, marginBottom: 8,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#f0f0ff" }}>{a.username}</div>
              <div style={{ fontSize: 11, color: "#6b6b8a" }}>Joined {new Date(a.created_at).toLocaleDateString()}</div>
            </div>
            <button style={{ ...S.btn, ...S.btnRed, padding: "5px 10px", minHeight: 30, fontSize: 12 }} onClick={() => handleDeleteAdmin(a.username)}>
              Delete
            </button>
          </div>
        ))}
        {!loading && admins.length === 0 && <div style={{ color: "#6b6b8a", fontSize: 13, textAlign: "center" }}>No admins yet</div>}
      </div>

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}
