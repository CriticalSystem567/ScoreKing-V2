import { PLAYER_COLORS } from "../constants.js";

/* A dependency-free SVG line chart: X axis = round number, Y axis =
   cumulative score. One line per player, color-matched to their
   scoreboard card. Built from `history` entries (which already carry the
   player's running `total` after each round — see GameScreen's addRound). */
export default function RoundScoreChart({ players, history, maxScore, theme }) {
  const maxRound = Math.max(0, ...history.map(h => h.round));

  if (!players?.length || maxRound === 0) {
    return (
      <div style={{
        border: `1px dashed ${theme.surfaceBorder}`, borderRadius: 16, padding: "28px 16px",
        textAlign: "center", color: theme.textFaint, fontSize: 12.5, lineHeight: 1.6,
      }}>
        📈 The round-by-round chart will appear here once at least one round has been played.
      </div>
    );
  }

  // Build one point series per player: (round, cumulativeTotal). A series
  // stops the moment a player has no entry for a round (i.e. they'd
  // already been eliminated before that round was played).
  const series = players.map((p, i) => {
    const pts = [{ round: 0, total: 0 }];
    for (let r = 1; r <= maxRound; r++) {
      const entry = history.find(h => h.round === r && h.player === p.name);
      if (!entry) break;
      pts.push({ round: r, total: entry.total });
    }
    return { name: p.name, color: PLAYER_COLORS[i % PLAYER_COLORS.length], points: pts, eliminated: p.eliminated };
  });

  const highestTotal = Math.max(maxScore, ...series.flatMap(s => s.points.map(pt => pt.total)));

  // Layout
  const W = 360, H = 260;
  const padL = 36, padR = 12, padT = 14, padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const mapX = (round) => padL + (maxRound === 0 ? 0 : (round / maxRound) * plotW);
  const mapY = (val) => padT + plotH - (val / highestTotal) * plotH;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(highestTotal * f));
  // Thin out x-axis labels once there are a lot of rounds, so they don't overlap.
  const xTickStep = maxRound <= 8 ? 1 : Math.ceil(maxRound / 8);
  const xTicks = [];
  for (let r = 0; r <= maxRound; r += xTickStep) xTicks.push(r);
  if (xTicks[xTicks.length - 1] !== maxRound) xTicks.push(maxRound);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
        {/* horizontal gridlines + y labels */}
        {yTicks.map((v, idx) => (
          <g key={idx}>
            <line x1={padL} x2={W - padR} y1={mapY(v)} y2={mapY(v)} stroke={theme.surfaceBorder} strokeWidth="1" />
            <text x={padL - 6} y={mapY(v) + 3} fontSize="9" fill={theme.textFaint} textAnchor="end">{v}</text>
          </g>
        ))}

        {/* elimination threshold line */}
        <line x1={padL} x2={W - padR} y1={mapY(maxScore)} y2={mapY(maxScore)} stroke={theme.red} strokeWidth="1" strokeDasharray="4 3" opacity="0.55" />
        <text x={W - padR} y={mapY(maxScore) - 4} fontSize="8.5" fill={theme.red} textAnchor="end" opacity="0.8">Max {maxScore}</text>

        {/* x labels */}
        {xTicks.map((r) => (
          <text key={r} x={mapX(r)} y={H - 8} fontSize="9" fill={theme.textFaint} textAnchor="middle">{r}</text>
        ))}
        <text x={W / 2} y={H} fontSize="8.5" fill={theme.textFaint} textAnchor="middle" opacity="0.7">Round</text>

        {/* player lines */}
        {series.map((s, i) => {
          const pointsStr = s.points.map(pt => `${mapX(pt.round)},${mapY(pt.total)}`).join(" ");
          return (
            <g key={i} opacity={s.eliminated ? 0.45 : 1}>
              <polyline points={pointsStr} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {s.points.map((pt, j) => (
                <circle key={j} cx={mapX(pt.round)} cy={mapY(pt.total)} r={j === s.points.length - 1 ? 4 : 2.2} fill={s.color} stroke={theme.bg} strokeWidth={j === s.points.length - 1 ? 1.5 : 0} />
              ))}
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 10, justifyContent: "center" }}>
        {series.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: s.eliminated ? theme.textFaint : theme.textDim, opacity: s.eliminated ? 0.6 : 1 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            {s.name}{s.eliminated ? " (out)" : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
