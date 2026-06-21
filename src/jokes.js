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
