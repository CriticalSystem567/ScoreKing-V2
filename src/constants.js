/* ─── App-wide constants ─── */

// CHANGE THIS to your own secret passphrase before deploying.
// Whoever knows this can open the super-admin panel at /?super=PASSPHRASE
export const SUPER_ADMIN_PASSPHRASE = "Preswar0607";

export const PLAYER_COLORS = [
  "#a48cff","#22c97a","#ff5c5c","#f5c842",
  "#60b4fa","#ff8c42","#c064fa","#2ddcc8",
  "#f064a0","#64c850","#fab450","#50a0f0",
];

export const EMOJIS = ["🎮","🃏","🎲","🏆","🎯","🦁","🐯","🦊","🐺","🦅",
  "🔥","⚡","🌟","💎","🚀","😎","🤴","👸","🧙","🧝"];

export const SECURITY_QUESTIONS = [
  "What's your favorite card game?",
  "What city were you born in?",
  "What was your first pet's name?",
  "What's your mother's maiden name?",
  "What's your favorite food?",
];

export const ABOUT_TEXT = {
  title: "Welcome to ScoreKing",
  paragraphs: [
    "ScoreKing was built for one reason: to make game nights with friends and family easier, livelier, and a little more fun \u2014 nothing more, nothing less.",
    "Whether it's a quiet evening of 13-card rummy with family or a loud, competitive night with your closest friends, ScoreKing keeps score so nobody has to argue about it, frees everyone to focus on the game and the company, and adds a bit of light-hearted banter along the way as the scores rise and fall.",
    "Every dealer rotation, every roast for the player sweating in the danger zone, every \"Game Over\" celebration \u2014 it's all here purely to make the night a little more memorable. This app exists for fun, laughter, and the kind of stories that get retold for years.",
  ],
  warning: "Please remember: ScoreKing is meant for friendly, casual play only. Never use this app \u2014 or any game it scores \u2014 for gambling, betting, or risking real money. Keep it about the fun, the friends, and the memories you'll make together.",
};

export const DEFAULT_GAME = {
  numPlayers: 0,
  maxScore: 200,
  round: 1,
  dealerIndex: 0,          // whose turn it is to deal this round
  gameStarted: false,       // locks setup once true; reset clears it back to false
  players: [],
  history: [],
  updatedAt: 0,
};

export function isPhotoAvatar(avatar) {
  return typeof avatar === "string" && avatar.startsWith("http");
}

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildGameCSV(game, adminUsername) {
  const lines = [];
  lines.push(`ScoreKing Export — Room: ${adminUsername}`);
  lines.push(`Round,${game.round}`);
  lines.push(`Max Score,${game.maxScore}`);
  lines.push("");
  lines.push("Player,Total,Status");
  game.players.forEach((p) => lines.push(`${p.name},${p.total},${p.eliminated ? "OUT" : "ACTIVE"}`));
  lines.push("");
  lines.push("Round,Player,Added,Total,Status,Dealer");
  game.history.forEach((h) => lines.push(`${h.round},${h.player},${h.added},${h.total},${h.status},${h.dealer || ""}`));
  return lines.join("\n");
}

export function downloadCSV(csv, filenamePrefix = "ScoreKing") {
  try {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date();
    a.href = url;
    a.download = `${filenamePrefix}_${ts.getDate()}-${ts.getMonth() + 1}-${ts.getFullYear()}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    return true;
  } catch {
    return false;
  }
}
