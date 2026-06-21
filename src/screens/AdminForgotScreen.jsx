import { useState } from "react";
import { S } from "../styles.jsx";
import { getAdminSecurityQuestion, resetAdminPassword } from "../db.js";

export default function AdminForgotScreen({ onBack }) {
  const [step, setStep] = useState(1); // 1 = enter username, 2 = answer + new password, 3 = done
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const findAccount = async () => {
    setErr("");
    if (!username.trim()) return setErr("Enter your username");
    setBusy(true);
    const q = await getAdminSecurityQuestion(username.trim());
    setBusy(false);
    if (!q) return setErr("No admin found with that username");
    setQuestion(q);
    setStep(2);
  };

  const submitReset = async () => {
    setErr("");
    if (!answer.trim()) return setErr("Enter your answer");
    if (newPw.length < 4) return setErr("New password must be at least 4 characters");
    if (newPw !== confirmPw) return setErr("Passwords don't match");
    setBusy(true);
    const res = await resetAdminPassword(username.trim(), answer, newPw);
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    setStep(3);
  };

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Reset Admin Password</div>

        <div style={{ ...S.flex("column", "stretch"), gap: 12, textAlign: "left" }}>
          {step === 1 && (
            <>
              <div>
                <label style={S.fieldLabel}>Your username</label>
                <input style={S.input} value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="none" />
              </div>
              {err && <div style={{ color: "#ff5c5c", fontSize: 13 }}>{err}</div>}
              <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={findAccount} disabled={busy}>
                {busy ? "Checking…" : "Continue"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 13, color: "#9999bb" }}>{question}</div>
              <div>
                <label style={S.fieldLabel}>Your answer</label>
                <input style={S.input} value={answer} onChange={e => setAnswer(e.target.value)} />
              </div>
              <div>
                <label style={S.fieldLabel}>New password</label>
                <input style={S.input} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
              </div>
              <div>
                <label style={S.fieldLabel}>Confirm new password</label>
                <input style={S.input} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
              </div>
              {err && <div style={{ color: "#ff5c5c", fontSize: 13 }}>{err}</div>}
              <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={submitReset} disabled={busy}>
                {busy ? "Updating…" : "Reset Password"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ color: "#22c97a", fontSize: 15, fontWeight: 600, padding: "10px 0" }}>
                ✅ Password updated! You can log in now.
              </div>
              <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={onBack}>Go to Login</button>
            </>
          )}

          {step !== 3 && <button style={S.linkBtn} onClick={onBack}>← Back to login</button>}
        </div>
      </div>
    </div>
  );
}
