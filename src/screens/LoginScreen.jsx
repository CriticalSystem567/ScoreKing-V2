import { useState } from "react";
import { getStyles } from "../styles.jsx";
import { useTheme } from "../ThemeContext.jsx";
import { useViewport } from "../ViewportContext.jsx";
import { login } from "../db.js";
import InstallPrompt from "../components/InstallPrompt.jsx";
import Toggle from "../components/Toggle.jsx";

const REMEMBER_KEY = "sk_remembered_login";

function loadRememberedLogin() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function LoginScreen({ onBack, onForgot, onDone, installEvent, onInstallHandled, showIOSInstructions }) {
  const { theme } = useTheme();
  const vp = useViewport();
  const S = getStyles(theme, vp);
  const saved = loadRememberedLogin();
  const [username, setUsername] = useState(saved?.username || "");
  const [password, setPassword] = useState(saved?.password || "");
  const [rememberMe, setRememberMe] = useState(!!saved);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!username.trim() || !password) return setErr("Enter your username and password");
    setBusy(true);
    const res = await login(username.trim(), password);
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }

    // Save (or clear) the remembered credentials based on the checkbox,
    // only once login actually succeeds.
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username: username.trim(), password }));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    const p = res.player;
    onDone({ username: p.username, name: p.name, avatar: p.avatar });
  };

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Log In</div>
        <div style={{ fontSize: 12, color: theme.textFaint, marginBottom: 16, lineHeight: 1.5 }}>
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

          <Toggle
            checked={rememberMe}
            onChange={setRememberMe}
            icon="🔒"
            label="Remember my login on this device"
          />

          {err && <div style={{ color: theme.red, fontSize: 13 }}>{err}</div>}
          <button style={{ ...S.btn, ...S.btnAccent, width: "100%", marginTop: 6 }} onClick={submit} disabled={busy}>
            {busy ? "Logging in…" : "Log In"}
          </button>
          <button style={S.linkBtn} onClick={onForgot}>Forgot password?</button>
          <button style={S.linkBtn} onClick={onBack}>← Back</button>
        </div>

        <InstallPrompt installEvent={installEvent} onInstallHandled={onInstallHandled} showIOSInstructions={showIOSInstructions} />
      </div>
    </div>
  );
}
