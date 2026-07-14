/* A small, real-looking playing card (SVG) — used in Learn to Play so
   learners see "A♥" as an actual card, not just text. */
const SUIT_COLOR = {
  "♥": "#d6363f",
  "♦": "#d6363f",
  "♠": "#1a1a2e",
  "♣": "#1a1a2e",
};

const SUIT_NAME = {
  "♥": "Hearts",
  "♦": "Diamonds",
  "♠": "Spades",
  "♣": "Clubs",
};

export default function PlayingCard({ rank, suit, size = 58, faded = false }) {
  const color = SUIT_COLOR[suit] || "#1a1a2e";
  const w = size;
  const h = Math.round(size * 1.42);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 142"
      role="img"
      aria-label={`${rank} of ${SUIT_NAME[suit] || suit}`}
      style={{ display: "block", flexShrink: 0, opacity: faded ? 0.45 : 1 }}
    >
      <rect x="2" y="2" width="96" height="138" rx="10" fill="#ffffff" stroke="#d8d8e0" strokeWidth="2" />
      <text x="9" y="26" fontSize="19" fontWeight="800" fill={color} fontFamily="Georgia, 'Times New Roman', serif">{rank}</text>
      <text x="9" y="44" fontSize="16" fill={color} fontFamily="Georgia, serif">{suit}</text>
      <text x="50" y="80" fontSize="46" fill={color} textAnchor="middle" dominantBaseline="central" fontFamily="Georgia, serif">{suit}</text>
      <g transform="rotate(180 50 71)">
        <text x="9" y="26" fontSize="19" fontWeight="800" fill={color} fontFamily="Georgia, 'Times New Roman', serif">{rank}</text>
        <text x="9" y="44" fontSize="16" fill={color} fontFamily="Georgia, serif">{suit}</text>
      </g>
    </svg>
  );
}

export function CardRow({ cards, size = 58, gap = 8, faded = [] }) {
  if (!cards || cards.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap }}>
      {cards.map((c, i) => (
        <PlayingCard key={i} rank={c.rank} suit={c.suit} size={size} faded={faded.includes(i)} />
      ))}
    </div>
  );
}
