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
  "You're one careless discard from a bad night.",
  "This hand needs therapy, not another draw.",
  "The math isn't mathing for you right now.",
  "You picked up hope, then discarded it immediately.",
  "Your sequence has more holes than a strainer.",
  "Mild panic is a completely reasonable response here.",
  "You're not in danger yet, but danger can see you.",
  "Every round, your face tells the whole story.",
  "The table's starting to notice your hand shaking.",
  "Your cards are giving mixed signals, mostly bad ones.",
  "Confidence: high. Sequence: nowhere to be found.",
  "You're improvising, and it's not going great.",
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
  "You're basically renting space in the danger zone now.",
  "One more round like that and they'll retire your jersey.",
  "Your scorecard is starting to look like a phone number.",
  "The deck has officially given up on you.",
  "This is the kind of score that becomes a group chat joke.",
  "You're not playing rummy anymore, you're surviving it.",
  "At this score, declaring would be a war crime.",
  "Your hand is a museum exhibit titled 'What Not To Do'.",
  "Somewhere your ancestors are watching this in disappointment.",
  "You've made 'almost out' your entire personality tonight.",
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

/* ─── Celebration lines for someone who wins a single ROUND (scores 0) ───
   Distinct from WINNER_LINES, which celebrate winning the entire game. */
export const ROUND_WIN_LINES = [
  "Clean declare — zero stress, zero score.",
  "In and out before anyone saw it coming.",
  "That's a textbook hand right there.",
  "Declared like they'd been holding it all along.",
  "Zero on the board, already shuffling for the next one.",
  "That's how you make a round look easy.",
  "Quietly brilliant, loudly zero.",
  "Some people fold under pressure — this one declares.",
  "Smooth round. Smoothest score on the board.",
  "Nothing to add, because they added nothing.",
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

const roundWinLineCache = {}; // key (player+round) -> chosen line, stable for that round
export function getRoundWinLine(key) {
  if (roundWinLineCache[key]) return roundWinLineCache[key];
  const pick = ROUND_WIN_LINES[Math.floor(Math.random() * ROUND_WIN_LINES.length)];
  roundWinLineCache[key] = pick;
  return pick;
}
