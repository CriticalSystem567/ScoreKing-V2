import { useState } from "react";
import { S } from "../styles.jsx";
import { loginAdmin } from "../db.js";

export default function AdminLoginScreen({ onBack, onForgot, onDone }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!username.trim() || !password) return setErr("Enter your username and password");
    setBusy(true);
    const res = await loginAdmin(username.trim(), password);
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }
    onDone({ role: "admin", username: res.admin.username, avatar: res.admin.avatar, name: res.admin.name });
  };

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Admin Login</div>
        <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 16, lineHeight: 1.5 }}>
          Log in to manage your room: enter scores, control dealing order, and share your room code with players.
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
