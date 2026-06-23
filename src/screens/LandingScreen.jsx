import { useState } from "react";
import { S } from "../styles.jsx";

export default function LandingScreen({ onAdminLogin, onAdminSignup, onViewerJoin, onViewerLogin, onAbout }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
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

          <button style={{ ...S.linkBtn, marginTop: 12 }} onClick={() => setShowHelp(v => !v)}>
            {showHelp ? "▲ Hide" : "❔ How does this work?"}
          </button>
          <button style={S.linkBtn} onClick={onAbout}>
            ℹ️ About ScoreKing
          </button>

          {showHelp && (
            <div style={{ textAlign: "left", fontSize: 13, color: "#9999bb", lineHeight: 1.6, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: 14, marginTop: 4 }}>
              <p style={{ marginBottom: 10 }}>
                <b style={{ color: "#f5c842" }}>ScoreKing</b> is a live scoreboard for card games like 13-card rummy —
                everyone sees the same scores update instantly on their own phone.
              </p>
              <p style={{ marginBottom: 10 }}>
                <b style={{ color: "#a48cff" }}>Hosting a game?</b> Create a free admin account, then share your
                room code with friends. You'll enter scores each round; everyone else just watches live.
              </p>
              <p style={{ marginBottom: 0 }}>
                <b style={{ color: "#22c97a" }}>Just playing?</b> Get a room code from whoever's hosting, tap
                "Join a Friend's Game," and pick a username + PIN. Next time, just log in directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
