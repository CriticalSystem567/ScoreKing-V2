import { S } from "../styles.jsx";

export default function LandingScreen({ onAdminLogin, onAdminSignup, onViewerJoin, onViewerLogin }) {
  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing 🃏</div>
        <div style={S.logoSub}>Live Card Game Scoreboard</div>

        <div style={{ ...S.flex("column", "stretch"), gap: 10 }}>
          <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={onViewerLogin}>
            🎮 I'm a Player — Log In
          </button>
          <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={onViewerJoin}>
            ➕ Join a Friend's Game
          </button>

          <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "14px 0" }} />

          <div style={{ fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>
            Hosting a game?
          </div>
          <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={onAdminLogin}>
            👑 Admin Login
          </button>
          <button style={{ ...S.linkBtn, marginTop: 4 }} onClick={onAdminSignup}>
            New host? Create an admin account →
          </button>
        </div>
      </div>
    </div>
  );
}
