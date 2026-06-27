import { getStyles } from "../styles.jsx";
import { useTheme } from "../ThemeContext.jsx";
import { APP_VERSION } from "../constants.js";

export default function LandingScreen({ onLogin, onSignup, onAbout, onHowItWorks, onQuickJoin }) {
  const { theme } = useTheme();
  const S = getStyles(theme);

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Live Card Game Scoreboard</div>

        <div style={{ ...S.flex("column", "stretch"), gap: 10 }}>
          <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={onLogin}>
            🔑 Log In
          </button>
          <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={onSignup}>
            ✨ Create Account
          </button>

          <button style={{ ...S.linkBtn, marginTop: 4 }} onClick={onQuickJoin}>
            Have a room code? Join directly →
          </button>

          <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 12 }}>
            <button style={S.linkBtn} onClick={onHowItWorks}>❔ How it works</button>
            <button style={S.linkBtn} onClick={onAbout}>ℹ️ About</button>
          </div>
        </div>

        <div style={{ marginTop: 22, fontSize: 11, color: theme.textFaint }}>{APP_VERSION}</div>
      </div>
    </div>
  );
}
