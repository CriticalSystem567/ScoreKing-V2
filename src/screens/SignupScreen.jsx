import { useState } from "react";
import { S } from "../styles.jsx";
import { SECURITY_QUESTIONS } from "../constants.js";
import { signUp } from "../db.js";

export default function SignupScreen({ onBack, onDone }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!name.trim()) return setErr("Enter your display name");
    if (password.length < 4) return setErr("Password must be at least 4 characters");
    if (password !== confirmPw) return setErr("Passwords don't match");
    if (!answer.trim()) return setErr("Enter an answer to your security question");

    setBusy(true);
    const res = await signUp({
      username: username.trim(), password, name,
      securityQuestion: question, securityAnswer: answer,
    });
    setBusy(false);
    if (!res.ok) { setErr(res.error); return; }
    onDone({ username: res.username, name: name.trim(), avatar: null, roomCode: null });
  };

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Create your account</div>
        <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 16, lineHeight: 1.5 }}>
          One account does it all — host your own room and join friends' rooms, anytime.
        </div>

        <div style={{ ...S.flex("column", "stretch"), gap: 12, textAlign: "left" }}>
          <div>
            <label style={S.fieldLabel}>Your display name</label>
            <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Yogi" />
          </div>
          <div>
            <label style={S.fieldLabel}>Choose a username</label>
            <input style={S.input} value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. yogi99" autoCapitalize="none" />
          </div>
          <div>
            <label style={S.fieldLabel}>Password</label>
            <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 4 characters" />
          </div>
          <div>
            <label style={S.fieldLabel}>Confirm password</label>
            <input style={S.input} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
          </div>
          <div>
            <label style={S.fieldLabel}>Security question (for password recovery)</label>
            <select style={S.select} value={question} onChange={e => setQuestion(e.target.value)}>
              {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div>
            <label style={S.fieldLabel}>Your answer</label>
            <input style={S.input} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Remember this exactly" />
          </div>

          {err && <div style={{ color: "#ff5c5c", fontSize: 13 }}>{err}</div>}

          <button style={{ ...S.btn, ...S.btnAccent, width: "100%", marginTop: 6 }} onClick={submit} disabled={busy}>
            {busy ? "Creating account…" : "Create Account"}
          </button>
          <button style={S.linkBtn} onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  );
}
