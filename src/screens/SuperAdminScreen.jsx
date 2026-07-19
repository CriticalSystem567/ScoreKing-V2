import { useState, useEffect } from "react";
import { getStyles } from "../styles.jsx";
import { useTheme } from "../ThemeContext.jsx";
import { useViewport } from "../ViewportContext.jsx";
import { listAllPlayers, deletePlayerAccount, getRoomCountsByAdmin, listAllRoomsForSuperAdmin, transferRoomOwnership } from "../db.js";

export default function SuperAdminScreen({ onExit }) {
  const { theme } = useTheme();
  const vp = useViewport();
  const S = getStyles(theme, vp);
  const [players, setPlayers] = useState([]);
  const [roomCounts, setRoomCounts] = useState({});
  const [allRooms, setAllRooms] = useState([]); // every room, for the transfer UI
  const [expandedPlayer, setExpandedPlayer] = useState(null); // username whose rooms are shown
  const [transferDlg, setTransferDlg] = useState(null); // { roomId, roomCode, currentOwner, newOwner }
  const [transferBusy, setTransferBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [confirmDlg, setConfirmDlg] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const askConfirm = (msg, onYes) => setConfirmDlg({ msg, onYes });

  const refresh = async () => {
    const [a, counts, rooms] = await Promise.all([listAllPlayers(), getRoomCountsByAdmin(), listAllRoomsForSuperAdmin()]);
    setPlayers(a); setRoomCounts(counts); setAllRooms(rooms); setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = (username) => {
    askConfirm(`Delete account "${username}"? Any rooms they host (and their history) are removed too. This can't be undone.`, async () => {
      const ok = await deletePlayerAccount(username);
      if (ok) { showToast(`Deleted ${username}`); refresh(); }
      else showToast("⚠️ Failed to delete");
    });
  };

  const openTransfer = (room) => setTransferDlg({ roomId: room.id, roomCode: room.roomCode, currentOwner: room.adminUsername, newOwner: "" });

  const submitTransfer = async () => {
    if (!transferDlg?.newOwner) { showToast("Pick who to transfer it to"); return; }
    setTransferBusy(true);
    const res = await transferRoomOwnership(transferDlg.roomId, transferDlg.newOwner);
    setTransferBusy(false);
    if (!res.ok) { showToast("⚠️ " + res.error); return; }
    showToast(`Room ${transferDlg.roomCode} → ${transferDlg.newOwner}`);
    setTransferDlg(null);
    refresh();
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
          const isExpanded = expandedPlayer === p.username;
          const theirRooms = allRooms.filter(r => r.adminUsername === p.username);
          return (
            <div key={p.username} style={{
              background: theme.surface, border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 10, marginBottom: 8, overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>
                    {p.name || p.username} <span style={{ color: theme.textFaint, fontWeight: 400 }}>@{p.username}</span>
                    {rooms > 0 && (
                      <span
                        onClick={() => setExpandedPlayer(isExpanded ? null : p.username)}
                        style={{
                          fontSize: 10, background: theme.accentBg, color: theme.accentLight, padding: "2px 7px",
                          borderRadius: 10, marginLeft: 6, cursor: "pointer", userSelect: "none",
                        }}
                      >
                        {rooms} ROOM{rooms !== 1 ? "S" : ""} {isExpanded ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textFaint }}>Joined {new Date(p.created_at).toLocaleDateString()}</div>
                </div>
                <button style={{ ...S.btn, ...S.btnRed, padding: "5px 10px", minHeight: 30, fontSize: 12 }} onClick={() => handleDelete(p.username)}>
                  Delete
                </button>
              </div>
              {isExpanded && theirRooms.length > 0 && (
                <div style={{ borderTop: `1px solid ${theme.surfaceBorder}`, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {theirRooms.map(room => (
                    <div key={room.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontSize: 12, color: theme.textDim, fontFamily: "monospace" }}>
                        {room.roomCode} {room.locked ? "🔒" : ""}
                      </div>
                      <button style={{ ...S.btn, ...S.btnGhost, padding: "4px 10px", minHeight: 26, fontSize: 11 }} onClick={() => openTransfer(room)}>
                        Transfer →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!loading && players.length === 0 && <div style={{ color: theme.textFaint, fontSize: 13, textAlign: "center" }}>No accounts yet</div>}
      </div>

      {toast && <div style={S.toast}>{toast}</div>}

      {transferDlg && (
        <div style={S.overlayWrap}>
          <div style={{ ...S.winBox, maxWidth: 360, padding: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
              Transfer room {transferDlg.roomCode}
            </div>
            <div style={{ fontSize: 13, color: theme.textDim, marginBottom: 16 }}>
              Currently owned by <b>{transferDlg.currentOwner}</b>. The room, its scores, history, and
              everyone sitting in it stay exactly as-is — only the host changes.
            </div>
            <label style={S.fieldLabel}>Transfer to</label>
            <select
              style={S.select}
              value={transferDlg.newOwner}
              onChange={e => setTransferDlg({ ...transferDlg, newOwner: e.target.value })}
            >
              <option value="">— choose a player —</option>
              {players.filter(p => p.username !== transferDlg.currentOwner).map(p => (
                <option key={p.username} value={p.username}>{p.name || p.username} (@{p.username})</option>
              ))}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 20 }}>
              <button style={{ ...S.btn, ...S.btnGhost }} onClick={() => setTransferDlg(null)}>Cancel</button>
              <button style={{ ...S.btn, ...S.btnAccent }} onClick={submitTransfer} disabled={transferBusy}>
                {transferBusy ? "Transferring…" : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

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
