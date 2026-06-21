import { useState } from "react";
import { S } from "../styles.jsx";
import { loginViewer } from "../db.js";

export default function ViewerLoginScreen({ onBack, onDone }) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!username.trim()) return setErr("Enter your username");
    if (!/^\d{4}$/.test(pin)) return setErr("Enter your 4-digit PIN");
    setBusy(true);
    const res = await loginViewer(username.trim(), pin);
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    if (!res.viewer.admin_username) {
      setErr("You're not in a room yet — use \"Join a Friend's Game\" below with a room code.");
      return;
    }
    onDone({
      role: "viewer",
      username: res.viewer.username,
      name: res.viewer.name,
      avatar: res.viewer.avatar,
      adminUsername: res.viewer.admin_username,
    });
  };

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Player Login</div>
        <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 16, lineHeight: 1.5 }}>
          Already joined a room before? Log in with the username and PIN you picked then.
        </div>

        <div style={{ ...S.flex("column", "stretch"), gap: 12, textAlign: "left" }}>
          <div>
            <label style={S.fieldLabel}>Username</label>
            <input style={S.input} value={username} onChange={e => setUsername(e.target.value)}
              autoCapitalize="none" onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          <div>
            <label style={S.fieldLabel}>4-digit PIN</label>
            <input style={S.input} type="password" inputMode="numeric" maxLength={4}
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          {err && <div style={{ color: "#ff5c5c", fontSize: 13 }}>{err}</div>}
          <button style={{ ...S.btn, ...S.btnAccent, width: "100%", marginTop: 6 }} onClick={submit} disabled={busy}>
            {busy ? "Logging in…" : "Log In"}
          </button>
          <button style={S.linkBtn} onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  );
}
