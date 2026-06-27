import { useState } from "react";
import { getStyles } from "../styles.jsx";
import { useTheme } from "../ThemeContext.jsx";
import { joinRoomByCode } from "../db.js";

export default function ChooseRoomScreen({ session, onChooseOwn, onChooseJoined, onUpdateSession, onLogout }) {
  const { theme } = useTheme();
  const S = getStyles(theme);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // If they were already sitting in a room before this login (e.g. they got
  // logged out unexpectedly), offer a one-tap way straight back in — same
  // ease the host already has with "Host My Room," instead of forcing them
  // to track down the room code again.
  const alreadyInARoom = session.joinedHost && session.joinedHost !== session.username;

  const submitJoin = async () => {
    setErr("");
    if (!roomCode.trim()) return setErr("Enter a room code");
    setBusy(true);
    const res = await joinRoomByCode(session.username, roomCode.trim());
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }
    onUpdateSession?.({ joinedHost: res.hostUsername });
    onChooseJoined();
  };

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Welcome back, {session.name || session.username}</div>

        {!showJoinForm ? (
          <div style={{ ...S.flex("column", "stretch"), gap: 12, marginTop: 10 }}>
            {alreadyInARoom && (
              <button style={{ ...S.btn, ...S.btnAccent, width: "100%", padding: "16px 18px" }} onClick={onChooseJoined}>
                ↩ Return to {session.joinedHost}'s Room
              </button>
            )}
            <button style={{ ...S.btn, ...(alreadyInARoom ? S.btnGhost : S.btnAccent), width: "100%", padding: "16px 18px" }} onClick={onChooseOwn}>
              🏠 Host My Room
            </button>
            <button style={{ ...S.btn, ...S.btnGhost, width: "100%", padding: "16px 18px" }} onClick={() => setShowJoinForm(true)}>
              ➕ Join a Different Room
            </button>
            <button style={S.linkBtn} onClick={onLogout}>↩ Logout</button>
          </div>
        ) : (
          <div style={{ ...S.flex("column", "stretch"), gap: 12, textAlign: "left", marginTop: 10 }}>
            <div>
              <label style={S.fieldLabel}>Room code</label>
              <input style={{ ...S.input, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em" }}
                value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} placeholder="e.g. AB3DKX" maxLength={10}
                onKeyDown={e => e.key === "Enter" && submitJoin()} />
            </div>
            {err && <div style={{ color: theme.red, fontSize: 13 }}>{err}</div>}
            <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={submitJoin} disabled={busy}>
              {busy ? "Joining…" : "Join Room"}
            </button>
            <button style={S.linkBtn} onClick={() => { setShowJoinForm(false); setErr(""); }}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
