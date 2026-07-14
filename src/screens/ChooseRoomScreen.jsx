import { useState, useEffect } from "react";
import { getStyles } from "../styles.jsx";
import { useTheme } from "../ThemeContext.jsx";
import { useViewport } from "../ViewportContext.jsx";
import { joinRoomByCode, createRoom, listMyRooms } from "../db.js";
import QRScanner from "../components/QRScanner.jsx";

export default function ChooseRoomScreen({ session, onEnterOwnRoom, onEnterJoinedRoom, onUpdateSession, onLogout }) {
  const { theme } = useTheme();
  const vp = useViewport();
  const S = getStyles(theme, vp);
  const [mode, setMode] = useState("menu"); // menu | join | reopen
  const [roomCode, setRoomCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [myRooms, setMyRooms] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(false);

  useEffect(() => {
    if (mode === "reopen" && myRooms === null) {
      setRoomsLoading(true);
      listMyRooms(session.username).then(rooms => { setMyRooms(rooms); setRoomsLoading(false); });
    }
  }, [mode]);

  const handleNewRoom = async () => {
    setErr(""); setBusy(true);
    const res = await createRoom(session.username);
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }
    onEnterOwnRoom(res.roomId);
  };

  const submitJoin = async (code) => {
    const codeToUse = (code || roomCode).trim();
    setErr("");
    if (!codeToUse) return setErr("Enter a room code");
    setBusy(true);
    const res = await joinRoomByCode(session.username, codeToUse);
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }
    onUpdateSession?.({});
    onEnterJoinedRoom(res.roomId);
  };

  const handleScan = async (scannedCode) => {
    setShowScanner(false);
    setRoomCode(scannedCode);
    setErr("");
    setBusy(true);
    const res = await joinRoomByCode(session.username, scannedCode);
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }
    onUpdateSession?.({});
    onEnterJoinedRoom(res.roomId);
  };

  if (mode === "menu") {
    return (
      <div style={S.screen}>
        <div style={S.loginBox}>
          <div style={S.logo}>ScoreKing ♠️</div>
          <div style={S.logoSub}>Welcome back, {session.name || session.username}</div>

          <div style={{ ...S.flex("column", "stretch"), gap: 12, marginTop: 10 }}>
            <button style={{ ...S.btn, ...S.btnAccent, width: "100%", padding: "16px 18px" }} onClick={handleNewRoom} disabled={busy}>
              {busy ? "Creating…" : "✨ Create a New Room"}
            </button>
            <button style={{ ...S.btn, ...S.btnGhost, width: "100%", padding: "16px 18px" }} onClick={() => setMode("join")}>
              ➕ Join a Friend's Room
            </button>
            <button style={{ ...S.btn, ...S.btnGhost, width: "100%", padding: "16px 18px" }} onClick={() => setMode("reopen")}>
              📂 Reopen One of My Rooms
            </button>
            {err && <div style={{ color: theme.red, fontSize: 13 }}>{err}</div>}
            <button style={S.linkBtn} onClick={onLogout}>↩ Logout</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <>
        {showScanner && (
          <QRScanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        )}
        <div style={S.screen}>
          <div style={S.loginBox}>
            <div style={S.logo}>ScoreKing ♠️</div>
            <div style={S.logoSub}>Join a Friend's Room</div>
            <div style={{ ...S.flex("column", "stretch"), gap: 12, textAlign: "left", marginTop: 10 }}>

              {/* QR Scan button */}
              <button style={{
                ...S.btn, width: "100%", padding: "14px 18px",
                background: theme.accentBg, border: `1px solid ${theme.accentBorder}`, color: theme.accentLight,
              }} onClick={() => setShowScanner(true)}>
                📷 Scan QR Code
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: theme.divider }} />
                <span style={{ fontSize: 11, color: theme.textFaint }}>or enter manually</span>
                <div style={{ flex: 1, height: 1, background: theme.divider }} />
              </div>

              <div>
                <label style={S.fieldLabel}>Room code</label>
                <input style={{ ...S.input, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em" }}
                  value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} placeholder="e.g. AB3DKX" maxLength={10}
                  onKeyDown={e => e.key === "Enter" && submitJoin()} />
              </div>

              {err && <div style={{ color: theme.red, fontSize: 13 }}>{err}</div>}

              <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={() => submitJoin()} disabled={busy}>
                {busy ? "Joining…" : "Join Room"}
              </button>
              <button style={S.linkBtn} onClick={() => { setMode("menu"); setErr(""); }}>← Back</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // mode === "reopen"
  return (
    <div style={S.screen}>
      <div style={{ ...S.loginBox, maxWidth: vp.isDesktop ? 560 : vp.isTablet ? 500 : 420 }}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Reopen a Room</div>

        <div style={{ marginTop: 10, textAlign: "left" }}>
          {roomsLoading && <div style={{ textAlign: "center", color: theme.textFaint, padding: 20, fontSize: 13 }}>Loading your rooms…</div>}
          {!roomsLoading && myRooms && myRooms.length === 0 && (
            <div style={{ textAlign: "center", color: theme.textFaint, padding: 20, fontSize: 13 }}>
              You haven't created any rooms yet.
            </div>
          )}
          {!roomsLoading && myRooms && myRooms.map(r => (
            <button key={r.id} onClick={() => onEnterOwnRoom(r.id)} style={{
              display: "block", width: "100%", textAlign: "left", padding: "12px 14px", marginBottom: 8,
              borderRadius: 12, border: `1px solid ${theme.surfaceBorder}`, background: theme.surface, cursor: "pointer",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: theme.gold, letterSpacing: "0.05em" }}>{r.roomCode}</div>
                {r.locked && <span style={{ fontSize: 10, color: theme.red, fontWeight: 700 }}>🔒 CLOSED</span>}
              </div>
              <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 4 }}>
                {r.numPlayers} player{r.numPlayers !== 1 ? "s" : ""} · round {r.round} · created {new Date(r.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>

        <button style={{ ...S.linkBtn, marginTop: 8 }} onClick={() => { setMode("menu"); }}>← Back</button>
      </div>
    </div>
  );
}
