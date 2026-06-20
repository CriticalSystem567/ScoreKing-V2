/* ─── App-wide constants ─── */

// CHANGE THIS to your own secret passphrase before deploying.
// Whoever knows this can open the super-admin panel at /?super=PASSPHRASE
export const SUPER_ADMIN_PASSPHRASE = "#Preswar@0607";

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

export const DEFAULT_GAME = {
  numPlayers: 4,
  maxScore: 200,
  round: 1,
  dealerIndex: 0,          // whose turn it is to deal this round
  players: Array.from({ length: 4 }, (_, i) => ({
    name: `Player ${i + 1}`, total: 0, lastAdded: 0, eliminated: false,
  })),
  history: [],
  updatedAt: 0,
};

export function genInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

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
