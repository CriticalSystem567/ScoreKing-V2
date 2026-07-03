import { useState, useEffect } from "react";
import { getStyles } from "../styles.jsx";
import { useTheme } from "../ThemeContext.jsx";
import { listAllPlayers, deletePlayerAccount, getRoomCountsByAdmin } from "../db.js";

export default function SuperAdminScreen({ onExit }) {
  const { theme } = useTheme();
  const S = getStyles(theme);
  const [players, setPlayers] = useState([]);
  const [roomCounts, setRoomCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [confirmDlg, setConfirmDlg] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const askConfirm = (msg, onYes) => setConfirmDlg({ msg, onYes });

  const refresh = async () => {
    const [a, counts] = await Promise.all([listAllPlayers(), getRoomCountsByAdmin()]);
    setPlayers(a); setRoomCounts(counts); setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = (username) => {
    askConfirm(`Delete account "${username}"? Any rooms they host (and their history) are removed too. This can't be undone.`, async () => {
      const ok = await deletePlayerAccount(username);
      if (ok) { showToast(`Deleted ${username}`); refresh(); }
      else showToast("⚠️ Failed to delete");
    });
  };

  const hostCount = Object.keys(roomCounts).length;
  const totalRooms = Object.values(roomCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={S.appWrap}>
      <div style={S.topBar}>
        <div style={{ fontWeight: 700, color: theme.accentLight }}>🛡 Super Admin</div>
        <button style={{ ...S.btn, ...S.btnGhost }} onClick={onExit}>✕ Exit</button>
      </div>

      <div style={S.glass}>
        <div style={S.sectionLabel}>
          All Accounts ({players.length}) · {hostCount} hosting · {totalRooms} total room{totalRooms !== 1 ? "s" : ""}
        </div>
        {loading && <div style={{ color: theme.textFaint, fontSize: 13, textAlign: "center" }}>Loading…</div>}
        {!loading && players.map(p => {
          const rooms = roomCounts[p.username] || 0;
          return (
            <div key={p.username} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
              padding: "10px 12px", background: theme.surface, border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 10, marginBottom: 8,
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>
                  {p.name || p.username} <span style={{ color: theme.textFaint, fontWeight: 400 }}>@{p.username}</span>
                  {rooms > 0 && (
                    <span style={{ fontSize: 10, background: theme.accentBg, color: theme.accentLight, padding: "2px 7px", borderRadius: 10, marginLeft: 6 }}>
                      {rooms} ROOM{rooms !== 1 ? "S" : ""}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: theme.textFaint }}>Joined {new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <button style={{ ...S.btn, ...S.btnRed, padding: "5px 10px", minHeight: 30, fontSize: 12 }} onClick={() => handleDelete(p.username)}>
                Delete
              </button>
            </div>
          );
        })}
        {!loading && players.length === 0 && <div style={{ color: theme.textFaint, fontSize: 13, textAlign: "center" }}>No accounts yet</div>}
      </div>

      {toast && <div style={S.toast}>{toast}</div>}

      {confirmDlg && (
        <div style={S.overlayWrap}>
          <div style={{ ...S.winBox, maxWidth: 340, padding: 28 }}>
            <div style={{ fontSize: 15, color: theme.text, marginBottom: 22 }}>{confirmDlg.msg}</div>
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
