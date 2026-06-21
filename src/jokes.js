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
];

/* Tracks recently shown jokes per player (by index) within a session,
   to reduce immediate repeats without needing any storage/backend. */
const recentByPlayer = {};

export function getZoneJoke(playerKey, zone) {
  const pool = zone === "danger" ? DANGER_JOKES : WARN_JOKES;
  const recent = recentByPlayer[playerKey] || [];
  let candidates = pool.filter((j) => !recent.includes(j));
  if (candidates.length === 0) candidates = pool; // exhausted — allow repeats again
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  const updated = [pick, ...recent].slice(0, Math.min(5, pool.length - 1));
  recentByPlayer[playerKey] = updated;
  return pick;
}
