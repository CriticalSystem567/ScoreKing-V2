import { S } from "../styles.jsx";
import { ABOUT_TEXT } from "../constants.js";

export default function AboutScreen({ onClose, showCloseAsContinue = true }) {
  return (
    <div style={S.screen}>
      <div style={{ ...S.loginBox, maxWidth: 440, textAlign: "left" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>♠️ 🎲 🏆</div>
          <div style={S.logo}>{ABOUT_TEXT.title}</div>
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {ABOUT_TEXT.paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 14, color: "#cfcfe0", lineHeight: 1.6, margin: 0 }}>{p}</p>
          ))}

          <div style={{
            marginTop: 6, padding: "14px 16px", borderRadius: 12,
            background: "rgba(255,92,92,.08)", border: "1px solid rgba(255,92,92,.25)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ff8c8c", marginBottom: 6 }}>
              ⚠️ Please play responsibly
            </div>
            <div style={{ fontSize: 13, color: "#e0b0b0", lineHeight: 1.6 }}>{ABOUT_TEXT.warning}</div>
          </div>
        </div>

        <button style={{ ...S.btn, ...S.btnAccent, width: "100%", marginTop: 22 }} onClick={onClose}>
          {showCloseAsContinue ? "Got it — Continue →" : "✕ Close"}
        </button>
      </div>
    </div>
  );
}
