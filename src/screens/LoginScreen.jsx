import { useState } from "react";
import { S } from "../styles.jsx";
import { login } from "../db.js";

export default function LoginScreen({ onBack, onForgot, onDone }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!username.trim() || !password) return setErr("Enter your username and password");
    setBusy(true);
    const res = await login(username.trim(), password);
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }

    const p = res.player;
    const session = { username: p.username, name: p.name, avatar: p.avatar, roomCode: p.room_code, joinedHost: p.current_room };
    onDone(session);
  };

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Log In</div>
        <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 16, lineHeight: 1.5 }}>
          One login for everything — host your own room, join a friend's, or both.
        </div>

        <div style={{ ...S.flex("column", "stretch"), gap: 12, textAlign: "left" }}>
          <div>
            <label style={S.fieldLabel}>Username</label>
            <input style={S.input} value={username} onChange={e => setUsername(e.target.value)}
              autoCapitalize="none" onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          <div>
            <label style={S.fieldLabel}>Password</label>
            <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          {err && <div style={{ color: "#ff5c5c", fontSize: 13 }}>{err}</div>}
          <button style={{ ...S.btn, ...S.btnAccent, width: "100%", marginTop: 6 }} onClick={submit} disabled={busy}>
            {busy ? "Logging in…" : "Log In"}
          </button>
          <button style={S.linkBtn} onClick={onForgot}>Forgot password?</button>
          <button style={S.linkBtn} onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  );
}
