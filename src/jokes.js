/* ─── Roast lines shown next to players in WARN or DANGER zone ───
   Light, playful jokes themed around 13-card rummy. Each call returns
   a fresh line not recently repeated for that specific player. */

export const WARN_JOKES = [
  "Sorting your hand or sorting out your life?",
  "One bad pure sequence away from disaster.",
  "The joker called — it wants a divorce.",
  "Your hand's giving 'still thinking' energy.",
  "Declaring soon, or just window shopping?",
  "Living dangerously close to the discard pile.",
  "Your sequence is more 'suggestion' than 'pure'.",
  "Started strong, now just vibing on edge.",
  "Plot twist incoming — and not the good kind.",
  "You've entered the 'please don't pick that' zone.",
  "One wrong drop from a very bad evening.",
  "Currently auditioning for 'most improvable hand'.",
  "Getting comfortable in mediocrity, I see.",
  "Halfway to a sequence, fully committed to suffering.",
  "Your cards have trust issues with each other.",
  "This hand called, it wants new management.",
  "Your luck took a coffee break an hour ago.",
  "Pure sequence: still buffering.",
  "You're playing chess, the cards are playing checkers.",
  "Somewhere between 'fine' and 'concerning'.",
  "Your strategy: hope and pray, mostly pray.",
  "The deck owes you an apology at this point.",
  "Warning lights are on, nobody's checking the engine.",
  "You've discarded better hands than this one.",
  "Currently vibing in 'it's giving struggle' territory.",
  "Your run is more gap than sequence right now.",
  "One step from danger, two steps from denial.",
  "Even your joker is side-eyeing this hand.",
];

export const DANGER_JOKES = [
  "Pack your bags, the OUT zone is calling.",
  "This is less a hand, more a cry for help.",
  "Your score's climbing faster than your luck.",
  "At this point even the joker's lost hope.",
  "One more bad round and you're folklore.",
  "Speedrunning your own elimination, impressive.",
  "Your hand peaked back when dinosaurs roamed.",
  "Somewhere, your cards are filing a complaint.",
  "You're not losing, you're just 'building character'.",
  "This score belongs in a museum, sadly.",
  "Last seen: your chances of winning this round.",
  "Bro is one card away from retirement.",
  "Achievement unlocked: Professional Almost-Out.",
  "At this rate, you'll need a new deck and a new plan.",
  "Your sequence is theoretical at this point.",
  "Breaking news: local player still hasn't declared.",
  "Even a wild joker can't save this hand now.",
  "You've officially entered 'why do I even play' territory.",
  "Your score has its own gravitational pull now.",
  "This isn't a comeback story, this is a cautionary tale.",
  "The exit door is basically calling your name.",
  "You've graduated from struggling to legendary struggling.",
  "Somewhere a statistician is taking notes on this disaster.",
  "Your hand needs a miracle, not a draw pile.",
  "Each round you survive is now technically an upset.",
  "The scoreboard is starting to feel bad for you.",
  "At this score, even folding sounds appealing.",
  "You're not just behind, you're in a different time zone.",
  "This hand is held together by hope alone.",
  "Your odds are now measured in 'unlikely' and 'lol no'.",
];

/* ─── Celebration lines for the round's winner ─── */
export const WINNER_LINES = [
  "Lowest score, biggest flex. Take the win! 🏆",
  "While everyone panicked, you just played chess. Champion energy.",
  "That's not luck, that's a masterclass. Well played!",
  "Cleanest hand at the table — nobody saw it coming.",
  "You turned this game into a victory lap. Respect.",
  "Calm, calculated, and clearly the smartest player tonight.",
  "Everyone else was surviving. You were winning.",
  "That's how it's done — textbook, ruthless, brilliant.",
  "The cards listened to you tonight. Take the crown.",
  "While others sweated, you were already three moves ahead.",
];

/* Caches the chosen joke per exact key (player+round+zone), so repeated renders
   within the same round return the SAME line. Also tracks recently-shown jokes
   per player across rounds, so consecutive rounds don't repeat the same joke. */
const jokeCache = {};       // key -> chosen joke (stable for that key's lifetime)
const recentByPlayer = {};  // playerIndex -> last few jokes shown, across rounds

export function getZoneJoke(key, zone) {
  if (jokeCache[key]) return jokeCache[key]; // already picked for this exact round+zone — don't re-roll

  const pool = zone === "danger" ? DANGER_JOKES : WARN_JOKES;
  const playerKey = key.split("-")[0]; // recency tracked per player, not per exact key
  const recent = recentByPlayer[playerKey] || [];
  let candidates = pool.filter((j) => !recent.includes(j));
  if (candidates.length === 0) candidates = pool; // exhausted — allow repeats again
  const pick = candidates[Math.floor(Math.random() * candidates.length)];

  jokeCache[key] = pick;
  recentByPlayer[playerKey] = [pick, ...recent].slice(0, Math.min(5, pool.length - 1));
  return pick;
}

const winnerLineCache = {}; // gameKey -> chosen celebration line, stable for that win
export function getWinnerLine(key) {
  if (winnerLineCache[key]) return winnerLineCache[key];
  const pick = WINNER_LINES[Math.floor(Math.random() * WINNER_LINES.length)];
  winnerLineCache[key] = pick;
  return pick;
}
