import { getStyles } from "../styles.jsx";
import { useTheme } from "../ThemeContext.jsx";
import { ABOUT_TEXT, APP_VERSION } from "../constants.js";

export default function AboutScreen({ onClose, showCloseAsContinue = true }) {
  const { theme, mode } = useTheme();
  const S = getStyles(theme);

  return (
    <div style={S.screen}>
      <div style={{ ...S.loginBox, maxWidth: 440, textAlign: "left" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>♠️ 🎲 🏆</div>
          <div style={S.logo}>{ABOUT_TEXT.title}</div>
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {ABOUT_TEXT.paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 14, color: theme.textDim, lineHeight: 1.6, margin: 0 }}>{p}</p>
          ))}

          <div style={{
            marginTop: 6, padding: "14px 16px", borderRadius: 12,
            background: mode === "light" ? "rgba(224,69,63,.08)" : "rgba(255,92,92,.08)",
            border: `1px solid ${theme.red}40`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.red, marginBottom: 6 }}>
              ⚠️ Please play responsibly
            </div>
            <div style={{ fontSize: 13, color: theme.textDim, lineHeight: 1.6 }}>{ABOUT_TEXT.warning}</div>
          </div>
        </div>

        <button style={{ ...S.btn, ...S.btnAccent, width: "100%", marginTop: 22 }} onClick={onClose}>
          {showCloseAsContinue ? "Got it — Continue →" : "✕ Close"}
        </button>

        <div style={{ marginTop: 18, fontSize: 11, color: theme.textFaint, textAlign: "center" }}>{APP_VERSION}</div>
      </div>
    </div>
  );
}
