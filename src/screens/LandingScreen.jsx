import { useState } from "react";
import { S } from "../styles.jsx";

export default function LandingScreen({ onLogin, onSignup, onJoinRoom, onAbout }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div style={S.screen}>
      <div style={S.loginBox}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>Live Card Game Scoreboard</div>

        <div style={{ ...S.flex("column", "stretch"), gap: 10 }}>
          <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={onLogin}>
            🔑 Log In
          </button>
          <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={onJoinRoom}>
            ➕ Join a Friend's Game
          </button>

          <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "14px 0" }} />

          <button style={{ ...S.linkBtn }} onClick={onSignup}>
            New here? Create an account →
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
                One account does everything: create your own room to host a game and share your room code with
                friends, or join someone else's room the same way. You can do both with the same login.
              </p>
              <p style={{ marginBottom: 0 }}>
                <b style={{ color: "#22c97a" }}>Already have a room code?</b> Tap "Join a Friend's Game" — if you're
                new, you'll create an account in the same step.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
