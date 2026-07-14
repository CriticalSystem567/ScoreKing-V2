import { useState } from "react";
import { getStyles } from "../styles.jsx";
import { useTheme } from "../ThemeContext.jsx";
import { useViewport } from "../ViewportContext.jsx";
import { GAME_GUIDES, LEARN_DISCLAIMER } from "../gamesData.js";
import { CardRow } from "../components/PlayingCard.jsx";

function Section({ theme, title, color, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 800, color: color || theme.accentLight, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function GameDetail({ game, theme, S, onBack }) {
  return (
    <div style={{ textAlign: "left" }}>
      <button style={{ ...S.linkBtn, padding: 0, marginBottom: 14 }} onClick={onBack}>
        ← Back to all games
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 30 }}>{game.emoji}</span>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>{game.name}</div>
          <div style={{ fontSize: 12, color: theme.textFaint }}>{game.tag}</div>
        </div>
      </div>

      <div style={{
        marginTop: 14, marginBottom: 18, fontSize: 12, lineHeight: 1.5, color: theme.warnSoft,
        background: theme.orangeBg, border: `1px solid ${theme.redBorder}`, borderRadius: 10, padding: "10px 12px",
      }}>
        ⚠️ For learning &amp; friendly play only — never play this for real money.
      </div>

      <Section theme={theme} title="Overview">
        <div style={{ fontSize: 14, color: theme.textDim, lineHeight: 1.6, marginBottom: 8 }}>{game.objective}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <div style={S.statBox}>
            <div style={S.metaLbl}>Players</div>
            <div style={{ ...S.metaVal, marginTop: 4 }}>{game.players}</div>
          </div>
          <div style={S.statBox}>
            <div style={S.metaLbl}>Deck</div>
            <div style={{ ...S.metaVal, marginTop: 4, fontSize: 12 }}>{game.deck}</div>
          </div>
        </div>
      </Section>

      {game.setup && (
        <Section theme={theme} title="Setup" color={theme.green}>
          <ol style={{ margin: 0, paddingLeft: 20, color: theme.textDim, fontSize: 14, lineHeight: 1.7 }}>
            {game.setup.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </Section>
      )}

      {game.howTo && (
        <Section theme={theme} title="How to Play — Step by Step" color={theme.gold}>
          <ol style={{ margin: 0, paddingLeft: 20, color: theme.textDim, fontSize: 14, lineHeight: 1.7 }}>
            {game.howTo.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
          </ol>
        </Section>
      )}

      {game.terms && (
        <Section theme={theme} title="Key Terms & Glossary" color={theme.blue}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {game.terms.map((t, i) => (
              <div key={i} style={{ ...S.glass, margin: 0, padding: "10px 12px" }}>
                <div style={{ fontWeight: 700, color: theme.text, fontSize: 13.5, marginBottom: 3 }}>{t.term}</div>
                <div style={{ fontSize: 13, color: theme.textDim, lineHeight: 1.5 }}>{t.def}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {game.handRankings && (
        <Section theme={theme} title="Hand Rankings (best → worst)" color={theme.red}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {game.handRankings.map((h) => (
              <div key={h.rank} style={{ ...S.glass, margin: 0, padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: h.cards ? 10 : 0 }}>
                  <div style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: theme.accentBg,
                    color: theme.accentLight, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {h.rank}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: theme.text, fontSize: 13.5 }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: theme.gold, fontFamily: "monospace", marginTop: 2 }}>{h.notation}</div>
                    <div style={{ fontSize: 13, color: theme.textDim, lineHeight: 1.5, marginTop: 3 }}>{h.desc}</div>
                  </div>
                </div>
                {h.cards && (
                  <div style={{ paddingLeft: 36 }}>
                    <CardRow cards={h.cards} size={44} gap={6} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {game.notationNote && (
            <div style={{ fontSize: 12.5, color: theme.textFaint, lineHeight: 1.6, marginTop: 10, fontStyle: "italic" }}>
              {game.notationNote}
            </div>
          )}
        </Section>
      )}

      {game.scoring && (
        <Section theme={theme} title="Scoring" color={theme.green}>
          <ul style={{ margin: 0, paddingLeft: 20, color: theme.textDim, fontSize: 14, lineHeight: 1.7 }}>
            {game.scoring.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
          </ul>
        </Section>
      )}

      {game.example && (
        <Section theme={theme} title={game.example.title || "Example"} color={theme.accentLight}>
          {game.example.cards && (
            <div style={{ marginBottom: 10 }}>
              <CardRow cards={game.example.cards} size={50} gap={8} />
              {game.example.cardsCaption && (
                <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 6 }}>{game.example.cardsCaption}</div>
              )}
            </div>
          )}
          <div style={{
            fontSize: 13.5, color: theme.textDim, lineHeight: 1.65, background: theme.accentBg,
            border: `1px solid ${theme.accentBorder}`, borderRadius: 10, padding: "12px 14px",
          }}>
            {game.example.body}
          </div>
        </Section>
      )}

      <button style={{ ...S.btn, ...S.btnGhost, width: "100%", marginTop: 6 }} onClick={onBack}>
        ← Back to all games
      </button>
    </div>
  );
}

export default function LearnToPlayScreen({ onClose }) {
  const { theme } = useTheme();
  const vp = useViewport();
  const S = getStyles(theme, vp);
  const [selected, setSelected] = useState(null);

  return (
    <div style={S.screen}>
      <div style={{
        ...S.loginBox,
        maxWidth: selected ? (vp.isDesktop ? 640 : vp.isTablet ? 600 : 520) : (vp.isDesktop ? 860 : vp.isTablet ? 680 : 520),
        textAlign: "left", maxHeight: "88vh", overflowY: "auto",
      }}>
        {!selected && (
          <>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={S.logo}>🎓 Learn to Play</div>
              <div style={S.logoSub}>Card game guides</div>
            </div>

            <div style={{
              marginTop: 10, marginBottom: 16, fontSize: 12.5, lineHeight: 1.6, color: theme.warnSoft,
              background: theme.orangeBg, border: `1px solid ${theme.redBorder}`, borderRadius: 10, padding: "12px 14px",
            }}>
              ⚠️ {LEARN_DISCLAIMER}
            </div>

            <div style={{ fontSize: 13, color: theme.textDim, marginBottom: 14, lineHeight: 1.5 }}>
              Pick a game to see the full rules, key terms explained in plain English, and a worked example.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: vp.isDesktop ? "1fr 1fr 1fr" : vp.isTablet ? "1fr 1fr" : "1fr", gap: 10 }}>
              {GAME_GUIDES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelected(g.id)}
                  style={{
                    ...S.glass, margin: 0, cursor: "pointer", textAlign: "left", display: "flex",
                    alignItems: "center", gap: 12, border: `1px solid ${theme.surfaceBorder}`,
                    background: theme.surfaceStrong, width: "100%", fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 26 }}>{g.emoji}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontWeight: 700, color: theme.text, fontSize: 14.5 }}>{g.name}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: theme.textFaint, marginTop: 2 }}>{g.tag}</span>
                  </span>
                  <span style={{ color: theme.textFaint, fontSize: 18 }}>›</span>
                </button>
              ))}
            </div>

            <button style={{ ...S.btn, ...S.btnAccent, width: "100%", marginTop: 20 }} onClick={onClose}>
              ✕ Close
            </button>
          </>
        )}

        {selected && (
          <GameDetail
            game={GAME_GUIDES.find((g) => g.id === selected)}
            theme={theme}
            S={S}
            onBack={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}
