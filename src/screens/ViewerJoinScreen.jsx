import { useState } from "react";
import { S } from "../styles.jsx";
import { requestJoin } from "../db.js";

export default function ViewerJoinScreen({ onBack }) {
  const [adminUsername, setAdminUsername] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr("");
    if (!adminUsername.trim()) return setErr("Enter the host's username");
    if (!name.trim()) return setErr("Enter your display name");
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) return setErr("Username must be 3-20 letters/numbers/underscores");
    if (!/^\d{4}$/.test(pin)) return setErr("PIN must be exactly 4 digits");

    setBusy(true);
    const res = await requestJoin({ username: username.trim(), pin, name: name.trim(), adminUsername: adminUsername.trim() });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    setDone(true);
  };

  if (done) {
    return (
      <div style={S.screen}>
        <div style={S.loginBox}>
          <div style={S.logo}>ScoreKing 🃏</div>
          <div style={{ fontSize: 40, margin: "16px 0" }}>⏳</div>
          <div style={{ color: "#f0f0ff", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Request sent!</div>
          <div style={{ color: "#9999bb", fontSize: 13, marginBottom: 20 }}>
            Ask <b>{adminUsername}</b> to approve you in their admin panel. Once approved, log in with your username and PIN.
          </div>
          <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={onBack}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing 🃏</div>
        <div style={S.logoSub}>Join a Friend's Game</div>

        <div style={{ ...S.flex("column", "stretch"), gap: 12, textAlign: "left" }}>
          <div>
            <label style={S.fieldLabel}>Host's username (ask them for it)</label>
            <input style={S.input} value={adminUsername} onChange={e => setAdminUsername(e.target.value)} placeholder="e.g. yogi" autoCapitalize="none" />
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
            {busy ? "Sending…" : "Send Join Request"}
          </button>
          <button style={S.linkBtn} onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  );
}
