import { useState } from "react";
import { S } from "../styles.jsx";
import { SECURITY_QUESTIONS } from "../constants.js";
import { joinRoomByCode, login, signUp } from "../db.js";

export default function JoinRoomScreen({ onBack, onDone }) {
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState(null); // null | "login" | "signup"

  // login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // signup fields
  const [name, setName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState("");

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const attachToRoom = async (forUsername) => {
    const res = await joinRoomByCode(forUsername, roomCode.trim());
    if (!res.ok) { setErr(res.error); return null; }
    return { hostUsername: res.hostUsername };
  };

  const submitLogin = async () => {
    setErr("");
    if (!roomCode.trim()) return setErr("Enter the room code first");
    if (!username.trim() || !password) return setErr("Enter your username and password");
    setBusy(true);
    const res = await login(username.trim(), password);
    if (!res.ok) { setBusy(false); setErr(res.error); return; }
    const attached = await attachToRoom(res.player.username);
    setBusy(false);
    if (!attached) return;
    onDone({ username: res.player.username, name: res.player.name, avatar: res.player.avatar, roomCode: res.player.room_code, joinedHost: attached.hostUsername });
  };

  const submitSignup = async () => {
    setErr("");
    if (!roomCode.trim()) return setErr("Enter the room code first");
    if (!name.trim()) return setErr("Enter your display name");
    if (newPassword.length < 4) return setErr("Password must be at least 4 characters");
    if (newPassword !== confirmPw) return setErr("Passwords don't match");
    if (!answer.trim()) return setErr("Enter an answer to your security question");

    setBusy(true);
    const res = await signUp({
      username: newUsername.trim(), password: newPassword, name,
      securityQuestion: question, securityAnswer: answer,
    });
    if (!res.ok) { setBusy(false); setErr(res.error); return; }
    const attached = await attachToRoom(res.username);
    setBusy(false);
    if (!attached) return;
    onDone({ username: res.username, name: name.trim(), avatar: null, roomCode: null, joinedHost: attached.hostUsername });
  };

  if (!mode) {
    return (
      <div style={S.screen}>
        <div style={S.loginBox}>
          <div style={S.logo}>ScoreKing ♠️</div>
          <div style={S.logoSub}>Join a Friend's Game</div>
          <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 16, lineHeight: 1.5 }}>
            Ask your host for their room code.
          </div>

          <div style={{ ...S.flex("column", "stretch"), gap: 12, textAlign: "left" }}>
            <div>
              <label style={S.fieldLabel}>Room code</label>
              <input style={{ ...S.input, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em" }}
                value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} placeholder="e.g. AB3DKX" maxLength={10} />
            </div>
            {err && <div style={{ color: "#ff5c5c", fontSize: 13 }}>{err}</div>}
            <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }}
              onClick={() => { if (!roomCode.trim()) { setErr("Enter the room code first"); return; } setErr(""); setMode("login"); }}>
              I already have an account
            </button>
            <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }}
              onClick={() => { if (!roomCode.trim()) { setErr("Enter the room code first"); return; } setErr(""); setMode("signup"); }}>
              I'm new — create an account
            </button>
            <button style={S.linkBtn} onClick={onBack}>← Back</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "login") {
    return (
      <div style={S.screen}>
        <div style={S.loginBox}>
          <div style={S.logo}>ScoreKing ♠️</div>
          <div style={S.logoSub}>Log In to Join</div>
          <div style={{ ...S.flex("column", "stretch"), gap: 12, textAlign: "left" }}>
            <div>
              <label style={S.fieldLabel}>Username</label>
              <input style={S.input} value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="none" />
            </div>
            <div>
              <label style={S.fieldLabel}>Password</label>
              <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {err && <div style={{ color: "#ff5c5c", fontSize: 13 }}>{err}</div>}
            <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={submitLogin} disabled={busy}>
              {busy ? "Joining…" : "Log In & Join"}
            </button>
            <button style={S.linkBtn} onClick={() => { setMode(null); setErr(""); }}>← Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Create Account & Join</div>
        <div style={{ ...S.flex("column", "stretch"), gap: 12, textAlign: "left" }}>
          <div>
            <label style={S.fieldLabel}>Your display name</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ravi" />
          </div>
          <div>
            <label style={S.fieldLabel}>Choose a username</label>
            <input style={S.input} value={newUsername} onChange={e => setNewUsername(e.target.value)} autoCapitalize="none" />
          </div>
          <div>
            <label style={S.fieldLabel}>Password</label>
            <input style={S.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label style={S.fieldLabel}>Confirm password</label>
            <input style={S.input} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
          </div>
          <div>
            <label style={S.fieldLabel}>Security question</label>
            <select style={S.select} value={question} onChange={e => setQuestion(e.target.value)}>
              {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div>
            <label style={S.fieldLabel}>Your answer</label>
            <input style={S.input} value={answer} onChange={e => setAnswer(e.target.value)} />
          </div>
          {err && <div style={{ color: "#ff5c5c", fontSize: 13 }}>{err}</div>}
          <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={submitSignup} disabled={busy}>
            {busy ? "Joining…" : "Create Account & Join"}
          </button>
          <button style={S.linkBtn} onClick={() => { setMode(null); setErr(""); }}>← Back</button>
        </div>
      </div>
    </div>
  );
}
