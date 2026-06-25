import { S } from "../styles.jsx";

export default function HowItWorksScreen({ onClose }) {
  return (
    <div style={S.screen}>
      <div style={{ ...S.loginBox, maxWidth: 440, textAlign: "left" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={S.logo}>❔ How It Works</div>
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14, fontSize: 14, color: "#cfcfe0", lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>
            <b style={{ color: "#f5c842" }}>ScoreKing</b> is a live scoreboard for card games like 13-card rummy —
            everyone sees the same scores update instantly on their own phone.
          </p>
          <p style={{ margin: 0 }}>
            <b style={{ color: "#a48cff" }}>One account does everything.</b> After logging in, you'll choose
            whether to host your own room or join a friend's using their room code — you can always switch later.
          </p>
          <p style={{ margin: 0 }}>
            <b style={{ color: "#22c97a" }}>Hosting?</b> You'll get a room code to share. You can choose to play
            too, or just run the scoreboard for everyone else.
          </p>
          <p style={{ margin: 0 }}>
            <b style={{ color: "#60b4fa" }}>Joining?</b> Just enter the room code your host gives you — you're in
            instantly, no approval needed.
          </p>
        </div>

        <button style={{ ...S.btn, ...S.btnAccent, width: "100%", marginTop: 22 }} onClick={onClose}>
          ✕ Close
        </button>
      </div>
    </div>
  );
}
