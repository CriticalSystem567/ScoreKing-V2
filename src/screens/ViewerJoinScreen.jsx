import { useState } from "react";
import { S } from "../styles.jsx";
import { joinRoom } from "../db.js";

export default function ViewerJoinScreen({ onBack, onDone }) {
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!roomCode.trim()) return setErr("Enter the room code your host gave you");
    if (!name.trim()) return setErr("Enter your display name");
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) return setErr("Username must be 3-20 letters/numbers/underscores");
    if (!/^\d{4}$/.test(pin)) return setErr("PIN must be exactly 4 digits");

    setBusy(true);
    const res = await joinRoom({ username: username.trim(), pin, name: name.trim(), roomCode: roomCode.trim() });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    onDone({ role: "viewer", username: username.trim().toLowerCase(), name: name.trim(), avatar: "🎮", adminUsername: res.adminUsername });
  };

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Join a Friend's Game</div>
        <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 16, lineHeight: 1.5 }}>
          Ask whoever's hosting for their room code. You'll join instantly and can save your username + PIN
          to log back in anytime.
        </div>

        <div style={{ ...S.flex("column", "stretch"), gap: 12, textAlign: "left" }}>
          <div>
            <label style={S.fieldLabel}>Room code (ask your host)</label>
            <input style={{ ...S.input, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em" }}
              value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} placeholder="e.g. AB3DKX" maxLength={10} />
          </div>
          <div>
            <label style={S.fieldLabel}>Your display name</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ravi" />
          </div>
          <div>
            <label style={S.fieldLabel}>Choose a username</label>
            <input style={S.input} value={username} onChange={e => setUsername(e.target.value)} placeholder="must be unique" autoCapitalize="none" />
          </div>
          <div>
            <label style={S.fieldLabel}>Choose a 4-digit PIN</label>
            <input style={S.input} type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} />
          </div>
          {err && <div style={{ color: "#ff5c5c", fontSize: 13 }}>{err}</div>}
          <button style={{ ...S.btn, ...S.btnAccent, width: "100%", marginTop: 6 }} onClick={submit} disabled={busy}>
            {busy ? "Joining…" : "Join Game"}
          </button>
          <button style={S.linkBtn} onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  );
}
