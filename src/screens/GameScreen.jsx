import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient.js";
import { S, Avatar } from "../styles.jsx";
import { PLAYER_COLORS, EMOJIS, DEFAULT_GAME, isPhotoAvatar, buildGameCSV, downloadCSV } from "../constants.js";
import {
  getRoomGame, setRoomGame, listViewersForAdmin, approveViewer, rejectViewer,
  updateViewer, removeViewer, uploadAvatarPhoto,
} from "../db.js";

const POLL_MS = 3000;

export default function GameScreen({ session, onLogout }) {
  const isAdmin = session.role === "admin";
  const roomOwner = isAdmin ? session.username : session.adminUsername;

  const [game, setGame] = useState(null);
  const [roundInputs, setRoundInputs] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [tableView, setTableView] = useState(false);
  const [winnerName, setWinnerName] = useState(null);
  const [toast, setToast] = useState("");
  const [csvText, setCsvText] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState(null);
  const toastTimer = useRef(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState("setup"); // setup | players | requests
  const [setupPlayers, setSetupPlayers] = useState(4);
  const [setupMax, setSetupMax] = useState(200);
  const [setupDealer, setSetupDealer] = useState(0);

  const [viewers, setViewers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [editNameIdx, setEditNameIdx] = useState(null);
  const [editPhotoUsername, setEditPhotoUsername] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const pollRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };
  const askConfirm = (msg, onYes) => setConfirmDlg({ msg, onYes });

  /* ── fetch + realtime game sync ── */
  const fetchGame = useCallback(async () => {
    const g = await getRoomGame(roomOwner);
    if (g) {
      setGame(prev => (!prev || g.updatedAt > (prev.updatedAt || 0)) ? g : prev);
      setLastSync(new Date());
    } else {
      // shouldn't normally happen (room created at signup), but guard anyway
      const fresh = { ...DEFAULT_GAME, updatedAt: Date.now() };
      await setRoomGame(roomOwner, fresh);
      setGame(fresh);
    }
  }, [roomOwner]);

  useEffect(() => {
    fetchGame();
    pollRef.current = setInterval(fetchGame, POLL_MS);

    const channel = supabase
      .channel(`room-${roomOwner}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `admin_username=eq.${roomOwner}` },
        (payload) => {
          const g = payload.new?.game;
          if (g) {
            setGame(prev => (!prev || g.updatedAt > (prev.updatedAt || 0)) ? g : prev);
            setLastSync(new Date());
          }
        })
      .subscribe();

    return () => { clearInterval(pollRef.current); supabase.removeChannel(channel); };
  }, [roomOwner, fetchGame]);

  useEffect(() => {
    if (game) { setSetupPlayers(game.numPlayers); setSetupMax(game.maxScore); setSetupDealer(game.dealerIndex || 0); }
  }, [game?.numPlayers, game?.maxScore]);

  /* ── viewer list (admin only) ── */
  const refreshViewers = useCallback(async () => {
    if (!isAdmin) return;
    const list = await listViewersForAdmin(roomOwner);
    setViewers(list);
    setPendingCount(list.filter(v => !v.approved).length);
  }, [isAdmin, roomOwner]);

  useEffect(() => {
    if (!isAdmin) return;
    refreshViewers();
    const iv = setInterval(refreshViewers, POLL_MS);
    return () => clearInterval(iv);
  }, [isAdmin, refreshViewers]);

  /* ── push game state ── */
  const pushGame = async (newG) => {
    const g = { ...newG, updatedAt: Date.now() };
    setSyncing(true);
    await setRoomGame(roomOwner, g);
    setGame(g);
    setLastSync(new Date());
    setSyncing(false);
  };

  /* ── setup / dealer order ── */
  const applySetup = async () => {
    const n = setupPlayers;
    const old = game.players || [];
    const players = Array.from({ length: n }, (_, i) => old[i] || { name: `Player ${i + 1}`, total: 0, lastAdded: 0, eliminated: false });
    const dealerIndex = Math.min(setupDealer, n - 1);
    await pushGame({ ...game, numPlayers: n, maxScore: setupMax, players, dealerIndex });
    setRoundInputs({});
    showToast("✓ Settings applied");
  };

  const addRound = async () => {
    const scores = roundInputs;
    let any = false;
    const dealerIdx = game.dealerIndex || 0;
    const dealerName = game.players[dealerIdx]?.name || `Player ${dealerIdx + 1}`;

    const players = game.players.map((p, i) => {
      if (p.eliminated) return p;
      const pts = parseInt(scores[i] || 0);
      if (pts <= 0) return p;
      any = true;
      const total = p.total + pts;
      return { ...p, total, lastAdded: pts, eliminated: total >= game.maxScore };
    });
    if (!any) { showToast("⚠️ No scores entered!"); return; }

    const history = [...game.history];
    game.players.forEach((p, i) => {
      const pts = parseInt(scores[i] || 0);
      if (!p.eliminated && pts > 0) {
        history.push({
          round: game.round, player: p.name, added: pts, total: players[i].total,
          status: players[i].eliminated ? "ELIMINATED" : "ACTIVE",
          dealer: dealerName, time: new Date().toLocaleTimeString(),
        });
      }
    });

    // advance dealer to next active player, cycling around
    let nextDealer = dealerIdx;
    for (let step = 1; step <= players.length; step++) {
      const candidate = (dealerIdx + step) % players.length;
      if (!players[candidate].eliminated) { nextDealer = candidate; break; }
    }

    const newG = { ...game, players, round: game.round + 1, history, dealerIndex: nextDealer };
    await pushGame(newG);
    setRoundInputs({});
    showToast(`✅ Round ${game.round} saved! Dealt by ${dealerName}`);

    const active = players.filter(p => !p.eliminated);
    if (active.length === 1) setWinnerName(active[0].name);
    else if (active.length === 0) showToast("All players eliminated!");
  };

  const resetGame = async () => {
    const players = game.players.map(p => ({ ...p, total: 0, lastAdded: 0, eliminated: false }));
    await pushGame({ ...game, round: 1, history: [], players, dealerIndex: 0 });
    setRoundInputs({});
    setWinnerName(null);
    showToast("Game reset!");
  };

  const updatePlayerName = async (i, name) => {
    const players = game.players.map((p, j) => j === i ? { ...p, name: name || `Player ${i + 1}` } : p);
    await pushGame({ ...game, players });
  };

  const handleExport = () => {
    const csv = buildGameCSV(game, roomOwner);
    const ok = downloadCSV(csv, `ScoreKing_${roomOwner}`);
    if (ok) showToast("📥 CSV downloaded!");
    else setCsvText(csv);
  };

  /* ── viewer management (admin) ── */
  const handleApprove = async (username) => {
    const ok = await approveViewer(username);
    if (ok) { showToast(`✅ Approved ${username}`); refreshViewers(); }
  };
  const handleReject = async (username) => {
    const ok = await rejectViewer(username);
    if (ok) { showToast("Rejected"); refreshViewers(); }
  };
  const handleRemoveViewer = (username) => {
    askConfirm(`Remove ${username} from your room?`, async () => {
      const ok = await removeViewer(username);
      if (ok) { showToast("Removed"); refreshViewers(); }
    });
  };
  const handleViewerNameSave = async (username, name) => {
    if (!name.trim()) return;
    await updateViewer(username, { name: name.trim() });
    refreshViewers();
    setEditNameIdx(null);
    showToast("Name updated");
  };
  const handleViewerPhotoSelect = async (username, file) => {
    if (!file || !file.type.startsWith("image/")) { showToast("Please choose an image file"); return; }
    setPhotoUploading(true);
    const url = await uploadAvatarPhoto(file, username);
    setPhotoUploading(false);
    if (!url) { showToast("⚠️ Upload failed"); return; }
    await updateViewer(username, { avatar: url });
    refreshViewers();
    setEditPhotoUsername(null);
    showToast("📷 Photo updated");
  };

  /* ── helpers ── */
  const getRank = (idx) => {
    if (!game) return 0;
    const active = game.players.filter(p => !p.eliminated);
    const sorted = [...active].sort((a, b) => a.total - b.total);
    const p = game.players[idx];
    if (p.eliminated) return 0;
    return sorted.indexOf(p) + 1;
  };
  const getActive = () => game ? game.players.filter(p => !p.eliminated).length : 0;
  const dealerIdx = game?.dealerIndex || 0;

  if (!game) {
    return <div style={S.appWrap}><div style={{ textAlign: "center", padding: 40, color: "#9999bb" }}>Loading game data…</div></div>;
  }

  const maxS = game.maxScore;

  return (
    <div style={S.appWrap}>
      {/* TOP BAR */}
      <div style={S.topBar}>
        <div style={S.flex("row", "center", 8)}>
          <Avatar avatar={session.avatar || (isAdmin ? "👑" : "🎮")} size={20} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#f0f0ff" }}>{session.name || session.username}</div>
            <div style={{ fontSize: 11, color: "#6b6b8a" }}>{isAdmin ? "Admin · " + session.username : "Player @ " + roomOwner}</div>
          </div>
        </div>
        <div style={S.flex("row", "center", 8)}>
          <div style={{ fontSize: 11, color: syncing ? "#f5c842" : "#22c97a", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: syncing ? "#f5c842" : "#22c97a", display: "inline-block" }} />
            {syncing ? "Syncing…" : lastSync ? "Live" : "—"}
          </div>
          {isAdmin && (
            <button style={{ ...S.btn, ...S.btnGhost, position: "relative" }} onClick={() => setAdminOpen(true)}>
              ⚙️ Admin
              {pendingCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "#ff5c5c", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {pendingCount}
                </span>
              )}
            </button>
          )}
          <button style={S.btnGhost} onClick={onLogout}>↩ Logout</button>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
        <div style={S.logo}>ScoreKing 🃏</div>
        <div style={S.logoSub}>{isAdmin ? "Your Room" : `${roomOwner}'s Room`}</div>
      </div>

      {/* SETUP (admin only) */}
      {isAdmin && (
        <div style={S.glass}>
          <div style={S.sectionLabel}>Game Setup</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={S.fieldLabel}>Players</label>
              <select style={S.select} value={setupPlayers} onChange={e => setSetupPlayers(+e.target.value)}>
                {Array.from({ length: 11 }, (_, i) => i + 2).map(n => <option key={n} value={n}>{n} Players</option>)}
              </select>
            </div>
            <div>
              <label style={S.fieldLabel}>Out at score</label>
              <input style={S.input} type="number" value={setupMax} onChange={e => setSetupMax(+e.target.value || 200)} min={10} inputMode="numeric" />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.fieldLabel}>Who deals first?</label>
            <select style={S.select} value={setupDealer} onChange={e => setSetupDealer(+e.target.value)}>
              {Array.from({ length: setupPlayers }, (_, i) => (
                <option key={i} value={i}>{game.players[i]?.name || `Player ${i + 1}`}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: "#6b6b8a", marginTop: 4 }}>
              Dealing rotates automatically each round, in player order, looping back to the start.
            </div>
          </div>
          <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={applySetup}>✓ Apply Settings</button>
        </div>
      )}

      {/* INFO STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "14px 0" }}>
        {[["Players", game.numPlayers, "#a48cff"], ["Max", maxS, "#60b4fa"], ["Round", game.round, "#f5c842"], ["Active", getActive(), "#22c97a"]].map(([l, v, c]) => (
          <div key={l} style={S.statBox}>
            <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: c, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 10, color: "#6b6b8a", marginTop: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* dealer banner */}
      <div style={{ ...S.glass, padding: "10px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>🂠</span>
        <div>
          <div style={{ fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".06em" }}>Dealing this round</div>
          <div style={{ fontWeight: 700, color: "#f5c842" }}>{game.players[dealerIdx]?.name || "—"}</div>
        </div>
      </div>

      {/* ROUND LABEL + VIEW TOGGLE */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0", padding: "0 2px" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
        <span style={{ fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".12em", whiteSpace: "nowrap" }}>
          Round {game.round} — {isAdmin ? "Enter scores below" : "Viewing live scores"}
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: 3, gap: 2 }}>
          <button onClick={() => setTableView(false)} style={{ ...S.btn, padding: "6px 14px", minHeight: 30, fontSize: 12, background: !tableView ? "rgba(124,109,250,.25)" : "transparent", color: !tableView ? "#a48cff" : "#9999bb" }}>🗂 Cards</button>
          <button onClick={() => setTableView(true)} style={{ ...S.btn, padding: "6px 14px", minHeight: 30, fontSize: 12, background: tableView ? "rgba(124,109,250,.25)" : "transparent", color: tableView ? "#a48cff" : "#9999bb" }}>📋 Table</button>
        </div>
      </div>

      {/* PLAYER CARDS */}
      {!tableView && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {game.players.map((p, i) => {
            const elim = p.eliminated;
            const pct = Math.min(100, Math.round(p.total / maxS * 100));
            const needs = maxS - p.total;
            const col = PLAYER_COLORS[i % PLAYER_COLORS.length];
            const rank = getRank(i);
            const rankColors = [null, "#f5c842", "#c0c0d0", "#d48050"];
            const isDealer = i === dealerIdx && !elim;
            return (
              <div key={i} style={{ ...S.pcard, opacity: elim ? .45 : 1, position: "relative" }}>
                {elim && <div style={S.outBadge}>OUT</div>}
                {isDealer && <div style={S.dealerBadge}>🂠 DEALER</div>}
                <div style={{ ...S.flex("row", "center", 12), marginBottom: 14, marginTop: isDealer ? 14 : 0 }}>
                  <div style={{ ...S.rankBubble, background: `${col}22`, color: rank <= 3 ? rankColors[rank] : "#9999bb" }}>
                    {rank || "—"}
                  </div>
                  {isAdmin && !elim
                    ? <input style={{ ...S.nameInput, color: col }} defaultValue={p.name}
                        onBlur={e => updatePlayerName(i, e.target.value.trim())} disabled={elim} />
                    : <div style={{ flex: 1, fontWeight: 700, fontSize: 16, color: col }}>{p.name}</div>
                  }
                  <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: pct >= 90 && !elim ? "#ff5c5c" : pct >= 70 && !elim ? "#ff8c42" : "#f0f0ff" }}>{p.total}</div>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,.07)", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? "#ff5c5c" : pct >= 70 ? "#ff8c42" : "#22c97a", borderRadius: 3, transition: "width .5s" }} />
                </div>
                <div style={{ ...S.flex("row", "center"), justifyContent: "space-between" }}>
                  <div style={S.flex("row", "center", 16)}>
                    <div><div style={S.metaLbl}>Needs</div><div style={{ ...S.metaVal, color: elim ? "#6b6b8a" : "#ff5c5c" }}>{elim ? "—" : needs}</div></div>
                    <div><div style={S.metaLbl}>Last +</div><div style={{ ...S.metaVal, color: p.lastAdded > 0 ? "#22c97a" : "#6b6b8a" }}>{p.lastAdded > 0 ? `+${p.lastAdded}` : "—"}</div></div>
                    <div>
                      <div style={S.metaLbl}>Status</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: elim ? "#6b6b8a" : pct >= 90 ? "#ff5c5c" : pct >= 70 ? "#ff8c42" : "#22c97a" }}>
                        {elim ? "OUT" : pct >= 90 ? "DANGER" : pct >= 70 ? "WARN" : "SAFE"}
                      </div>
                    </div>
                  </div>
                  {isAdmin && !elim && (
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: col, fontWeight: 700 }}>+</span>
                      <input type="number" inputMode="numeric" min="0" placeholder="0"
                        style={S.scoreInput}
                        value={roundInputs[i] ?? ""}
                        onFocus={e => e.target.select()}
                        onChange={e => setRoundInputs(r => ({ ...r, [i]: e.target.value }))} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {tableView && (
        <div style={{ ...S.glass, overflowX: "auto", marginBottom: 14, padding: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={{ ...S.th, textAlign: "left" }}>Player</th>
                <th style={S.th}>Total</th>
                <th style={S.th}>Needs</th>
                <th style={S.th}>Status</th>
                {isAdmin && <th style={S.th}>Add</th>}
              </tr>
            </thead>
            <tbody>
              {game.players.map((p, i) => {
                const elim = p.eliminated;
                const pct = Math.min(100, Math.round(p.total / maxS * 100));
                const needs = maxS - p.total;
                const col = PLAYER_COLORS[i % PLAYER_COLORS.length];
                const rank = getRank(i);
                const isDealer = i === dealerIdx && !elim;
                return (
                  <tr key={i} style={{ opacity: elim ? .45 : 1, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                    <td style={S.td}>{rank || "—"}</td>
                    <td style={{ ...S.td, textAlign: "left", fontWeight: 700, color: col }}>
                      {p.name}{isDealer && <span style={{ marginLeft: 6, fontSize: 11 }}>🂠</span>}
                    </td>
                    <td style={{ ...S.td, fontFamily: "monospace", fontWeight: 700 }}>{p.total}</td>
                    <td style={{ ...S.td, color: elim ? "#6b6b8a" : "#ff5c5c" }}>{elim ? "—" : needs}</td>
                    <td style={{ ...S.td, fontWeight: 700, fontSize: 11, color: elim ? "#6b6b8a" : pct >= 90 ? "#ff5c5c" : pct >= 70 ? "#ff8c42" : "#22c97a" }}>
                      {elim ? "OUT" : pct >= 90 ? "DANGER" : pct >= 70 ? "WARN" : "SAFE"}
                    </td>
                    {isAdmin && (
                      <td style={S.td}>
                        {!elim && (
                          <input type="number" inputMode="numeric" min="0" placeholder="0"
                            style={{ ...S.scoreInput, width: 64, padding: "6px 6px 6px 18px", fontSize: 13, minHeight: 34 }}
                            value={roundInputs[i] ?? ""}
                            onFocus={e => e.target.select()}
                            onChange={e => setRoundInputs(r => ({ ...r, [i]: e.target.value }))} />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ACTION BAR (admin only) */}
      {isAdmin && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <button style={{ ...S.btn, ...S.btnGreen, gridColumn: "span 2" }} onClick={addRound}>▶ Add Round</button>
          <button style={{ ...S.btn, ...S.btnRed }} onClick={() => askConfirm("Reset game?", resetGame)}>↺ Reset</button>
          <button style={{ ...S.btn, ...S.btnGhost }} onClick={() => setShowHistory(v => !v)}>📊 History</button>
          <button style={{ ...S.btn, ...S.btnGhost, gridColumn: "span 2" }} onClick={handleExport}>⬇ Export CSV</button>
        </div>
      )}

      {!isAdmin && (
        <div style={{ textAlign: "center", color: "#6b6b8a", fontSize: 13, marginBottom: 14, padding: "10px 0" }}>
          🔴 Live · Auto-refreshes every {POLL_MS / 1000}s
        </div>
      )}

      {/* HISTORY */}
      {showHistory && (
        <div style={{ ...S.glass, marginBottom: 14 }}>
          <div style={{ ...S.flex("row", "center"), justifyContent: "space-between", marginBottom: 12 }}>
            <div style={S.sectionLabel}>Round History</div>
            {isAdmin && <button style={{ ...S.btn, ...S.btnGhost, padding: "4px 10px", minHeight: 28, fontSize: 12 }}
              onClick={() => askConfirm("Clear history?", () => pushGame({ ...game, history: [] }))}>Clear</button>}
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {!game.history.length && <div style={{ textAlign: "center", color: "#6b6b8a", padding: 20, fontSize: 13 }}>No rounds played yet</div>}
            {[...game.history].reverse().map((h, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr 50px 50px 64px", padding: "8px 4px", borderBottom: "1px solid rgba(255,255,255,.04)", fontSize: 12, alignItems: "center", gap: 4 }}>
                <div style={{ color: "#6b6b8a", fontWeight: 600, fontSize: 11 }}>{h.round}</div>
                <div style={{ color: "#9999bb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {h.player}{h.dealer && <span style={{ color: "#6b6b8a", fontSize: 10 }}> · dealer: {h.dealer}</span>}
                </div>
                <div style={{ color: "#f5c842", fontWeight: 600 }}>+{h.added}</div>
                <div style={{ fontWeight: 700 }}>{h.total}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: h.status === "ELIMINATED" ? "#ff5c5c" : "#22c97a" }}>{h.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WINNER OVERLAY */}
      {winnerName && (
        <div style={S.overlayWrap}>
          <div style={S.winBox}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#a48cff", marginBottom: 4 }}>Game Over!</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f5c842", marginBottom: 6 }}>{winnerName}</div>
            <div style={{ color: "#6b6b8a", fontSize: 14, marginBottom: 24 }}>wins with the lowest score!</div>
            {isAdmin && <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={() => { resetGame(); setWinnerName(null); }}>🎮 Play Again</button>}
            {!isAdmin && <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={() => setWinnerName(null)}>Close</button>}
          </div>
        </div>
      )}

      {toast && <div style={S.toast}>{toast}</div>}

      {confirmDlg && (
        <div style={S.overlayWrap}>
          <div style={{ ...S.winBox, maxWidth: 320, padding: 28 }}>
            <div style={{ fontSize: 15, color: "#f0f0ff", marginBottom: 22 }}>{confirmDlg.msg}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button style={{ ...S.btn, ...S.btnGhost }} onClick={() => setConfirmDlg(null)}>Cancel</button>
              <button style={{ ...S.btn, ...S.btnRed }} onClick={() => { confirmDlg.onYes(); setConfirmDlg(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {csvText && (
        <div style={S.overlayWrap}>
          <div style={{ ...S.winBox, maxWidth: 420, textAlign: "left", padding: 20 }}>
            <div style={{ ...S.flex("row", "center"), justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: "#a48cff" }}>📋 Copy your game data</div>
              <button style={{ ...S.btn, ...S.btnGhost, padding: "5px 12px", minHeight: 30, fontSize: 13 }} onClick={() => setCsvText(null)}>✕ Close</button>
            </div>
            <textarea readOnly value={csvText} style={{ width: "100%", height: 240, background: "#0d0d1a", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, color: "#9999bb", fontSize: 11, padding: 10, fontFamily: "monospace", resize: "none", outline: "none" }} />
          </div>
        </div>
      )}

      {/* ADMIN PANEL */}
      {adminOpen && (
        <div style={S.overlayWrap}>
          <div style={{ ...S.winBox, maxWidth: 460, maxHeight: "90vh", overflowY: "auto", textAlign: "left", padding: 24 }}>
            <div style={{ ...S.flex("row", "center"), justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#a48cff" }}>⚙️ Admin Panel</div>
              <button style={{ ...S.btn, ...S.btnGhost, padding: "5px 12px", minHeight: 30, fontSize: 13 }} onClick={() => { setAdminOpen(false); setEditNameIdx(null); setEditPhotoUsername(null); }}>✕ Close</button>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {["players", "requests"].map(tab => (
                <button key={tab} onClick={() => setAdminTab(tab)} style={{
                  ...S.btn, flex: 1, padding: "8px 0", minHeight: 36, fontSize: 13,
                  background: adminTab === tab ? "rgba(124,109,250,.25)" : "rgba(255,255,255,.04)",
                  color: adminTab === tab ? "#a48cff" : "#9999bb",
                  position: "relative",
                }}>
                  {tab === "players" ? "Your Players" : "Join Requests"}
                  {tab === "requests" && pendingCount > 0 && (
                    <span style={{ marginLeft: 6, background: "#ff5c5c", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>

            {adminTab === "players" && (
              <>
                <div style={S.sectionLabel}>Approved Players in Your Room</div>
                {viewers.filter(v => v.approved).map(v => (
                  <div key={v.username} style={{ ...S.flex("row", "center", 10), padding: "10px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, marginBottom: 8 }}>
                    <Avatar avatar={v.avatar} size={22} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editNameIdx === v.username ? (
                        <input autoFocus style={{ ...S.adminInput, padding: "5px 8px", fontSize: 13 }} defaultValue={v.name}
                          onBlur={e => handleViewerNameSave(v.username, e.target.value)}
                          onKeyDown={e => e.key === "Enter" && e.target.blur()} />
                      ) : (
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#f0f0ff" }}>{v.name}</div>
                      )}
                      <div style={{ fontSize: 11, color: "#6b6b8a" }}>@{v.username}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button style={{ ...S.btn, ...S.btnGhost, padding: "4px 8px", minHeight: 26, fontSize: 11 }} onClick={() => setEditNameIdx(v.username)}>✏️</button>
                      <label style={{ ...S.btn, ...S.btnGhost, padding: "4px 8px", minHeight: 26, fontSize: 11, cursor: "pointer" }}>
                        📷
                        <input type="file" accept="image/*" style={{ display: "none" }}
                          onChange={e => handleViewerPhotoSelect(v.username, e.target.files?.[0])} />
                      </label>
                      <button style={{ ...S.btn, ...S.btnRed, padding: "4px 8px", minHeight: 26, fontSize: 11 }} onClick={() => handleRemoveViewer(v.username)}>✕</button>
                    </div>
                  </div>
                ))}
                {viewers.filter(v => v.approved).length === 0 && (
                  <div style={{ textAlign: "center", color: "#6b6b8a", padding: 16, fontSize: 13 }}>
                    No approved players yet. Share your username (<b>{roomOwner}</b>) so friends can join.
                  </div>
                )}
              </>
            )}

            {adminTab === "requests" && (
              <>
                <div style={S.sectionLabel}>Pending Join Requests</div>
                {viewers.filter(v => !v.approved).map(v => (
                  <div key={v.username} style={{ ...S.flex("row", "center", 10), padding: "10px 12px", background: "rgba(245,200,66,.08)", border: "1px solid rgba(245,200,66,.25)", borderRadius: 10, marginBottom: 8 }}>
                    <Avatar avatar={v.avatar} size={22} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#f0f0ff" }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: "#6b6b8a" }}>@{v.username}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ ...S.btn, ...S.btnGreen, padding: "5px 10px", minHeight: 30, fontSize: 12 }} onClick={() => handleApprove(v.username)}>✓ Approve</button>
                      <button style={{ ...S.btn, ...S.btnRed, padding: "5px 10px", minHeight: 30, fontSize: 12 }} onClick={() => handleReject(v.username)}>✕</button>
                    </div>
                  </div>
                ))}
                {viewers.filter(v => !v.approved).length === 0 && (
                  <div style={{ textAlign: "center", color: "#6b6b8a", padding: 16, fontSize: 13 }}>No pending requests</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
