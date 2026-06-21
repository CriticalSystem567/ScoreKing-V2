import { useState, useEffect } from "react";
import { S } from "../styles.jsx";
import { listAllAdmins, deleteAdmin } from "../db.js";

export default function SuperAdminScreen({ onExit }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [confirmDlg, setConfirmDlg] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const askConfirm = (msg, onYes) => setConfirmDlg({ msg, onYes });

  const refresh = async () => {
    const a = await listAllAdmins();
    setAdmins(a); setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleDeleteAdmin = (username) => {
    askConfirm(`Delete admin "${username}" and their entire room, players, and history? This can't be undone.`, async () => {
      const ok = await deleteAdmin(username);
      if (ok) { showToast(`Deleted ${username}`); refresh(); }
      else showToast("⚠️ Failed to delete");
    });
  };

  return (
    <div style={S.appWrap}>
      <div style={S.topBar}>
        <div style={{ fontWeight: 700, color: "#a48cff" }}>🛡 Super Admin</div>
        <button style={{ ...S.btn, ...S.btnGhost }} onClick={onExit}>✕ Exit</button>
      </div>

      <div style={S.glass}>
        <div style={S.sectionLabel}>All Admin Rooms ({admins.length})</div>
        {loading && <div style={{ color: "#6b6b8a", fontSize: 13, textAlign: "center" }}>Loading…</div>}
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

      {confirmDlg && (
        <div style={S.overlayWrap}>
          <div style={{ ...S.winBox, maxWidth: 340, padding: 28 }}>
            <div style={{ fontSize: 15, color: "#f0f0ff", marginBottom: 22 }}>{confirmDlg.msg}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button style={{ ...S.btn, ...S.btnGhost }} onClick={() => setConfirmDlg(null)}>Cancel</button>
              <button style={{ ...S.btn, ...S.btnRed }} onClick={() => { confirmDlg.onYes(); setConfirmDlg(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
