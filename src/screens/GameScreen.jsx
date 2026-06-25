import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient.js";
import { S, Avatar } from "../styles.jsx";
import { PLAYER_COLORS, DEFAULT_GAME, buildGameCSV, downloadCSV } from "../constants.js";
import { getZoneJoke, getWinnerLine } from "../jokes.js";
import {
  getRoomGame, setRoomGame, createRoom, setRoomLocked, regenerateRoomCode,
  listRoomParticipants, removeParticipant, joinRoomByCode, leaveCurrentRoom,
  changeName, changePassword, changeAvatar, uploadAvatarPhoto,
  recordFinishedGame, getMyGameHistory, getMyOverallStats, getAdminGameHistory,
} from "../db.js";

const POLL_MS = 3000;

export default function GameScreen({ session, viewMode, onLogout, onSwitchView, onUpdateSession }) {
  const isOwnView = viewMode === "own";
  // Whose room are we currently looking at? My own (session.username) or
  // whichever host's room I joined (carried in session.joinedHost).
  const roomOwner = isOwnView ? session.username : session.joinedHost;
  const isHost = isOwnView; // I'm the host/scorer of the room currently being viewed

  const [myRoomCode, setMyRoomCode] = useState(session.roomCode || null);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const [game, setGame] = useState(null);
  const [roundInputs, setRoundInputs] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [tableView, setTableView] = useState(false);
  const [showWinner, setShowWinner] = useState(true);
  const [toast, setToast] = useState("");
  const [csvText, setCsvText] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState(null);
  const toastTimer = useRef(null);

  const [participants, setParticipants] = useState([]); // people sitting in roomOwner's room right now
  const [includeSelfAsPlayer, setIncludeSelfAsPlayer] = useState(false);
  const [setupSelected, setSetupSelected] = useState([]);
  const [setupMax, setSetupMax] = useState(200);
  const [roomCode, setRoomCodeState] = useState(null);
  const [regenBusy, setRegenBusy] = useState(false);
  const [lockBusy, setLockBusy] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState("profile"); // profile | room | players | history
  const [photoUploading, setPhotoUploading] = useState(false);
  const [editNameVal, setEditNameVal] = useState(session.name || session.username || "");
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [joinCodeVal, setJoinCodeVal] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

  const [myHistory, setMyHistory] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [adminHistory, setAdminHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showHelpTip, setShowHelpTip] = useState(true);
  const pollRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };
  const askConfirm = (msg, onYes) => setConfirmDlg({ msg, onYes });

  /* ── create a room on the fly if viewing "own" but no room exists yet ── */
  useEffect(() => {
    if (!isOwnView) return;
    if (myRoomCode) return;
    (async () => {
      setCreatingRoom(true);
      const res = await createRoom(session.username);
      setCreatingRoom(false);
      if (res.ok) { setMyRoomCode(res.code); onUpdateSession?.({ roomCode: res.code }); }
    })();
  }, [isOwnView, myRoomCode, session.username]);

  /* ── fetch + realtime game sync ── */
  const fetchGame = useCallback(async () => {
    if (!roomOwner) return;
    const g = await getRoomGame(roomOwner);
    if (g) {
      setGame(prev => (!prev || g.updatedAt > (prev.updatedAt || 0)) ? g : prev);
      setLastSync(new Date());
    } else if (isOwnView) {
      const fresh = { ...DEFAULT_GAME, updatedAt: Date.now() };
      await setRoomGame(roomOwner, fresh);
      setGame(fresh);
    }
  }, [roomOwner, isOwnView]);

  useEffect(() => {
    if (!roomOwner) return;
    fetchGame();
    pollRef.current = setInterval(fetchGame, POLL_MS);

    const channel = supabase
      .channel(`room-${roomOwner}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `admin_username=eq.${roomOwner}` },
        (payload) => {
          const g = payload.new?.game;
          if (g) {
            const merged = { ...g, _roomLocked: payload.new?.locked || false };
            setGame(prev => (!prev || merged.updatedAt > (prev.updatedAt || 0)) ? merged : prev);
            setLastSync(new Date());
          }
        })
      .subscribe();

    return () => { clearInterval(pollRef.current); supabase.removeChannel(channel); };
  }, [roomOwner, fetchGame]);

  useEffect(() => {
    if (!game) return;
    setSetupMax(game.maxScore);
    if (!game.gameStarted) {
      setSetupSelected(game.players.map(p => p.username).filter(Boolean));
    }
  }, [game?.maxScore, game?.gameStarted]);

  // Re-show the winner overlay whenever a NEW winner appears (including via sync).
  const lastSeenWinnerRef = useRef(null);
  useEffect(() => {
    if (game?.winner && game.winner !== lastSeenWinnerRef.current) {
      lastSeenWinnerRef.current = game.winner;
      setShowWinner(true);
    }
    if (!game?.winner) lastSeenWinnerRef.current = null;
  }, [game?.winner]);

  /* ── participants currently in this room (only meaningful when I'm the host) ── */
  const refreshParticipants = useCallback(async () => {
    if (!isHost) return;
    const list = await listRoomParticipants(roomOwner);
    setParticipants(list);
  }, [isHost, roomOwner]);

  useEffect(() => {
    if (!isHost || !roomOwner) return;
    refreshParticipants();
    setRoomCodeState(myRoomCode);
    const iv = setInterval(refreshParticipants, POLL_MS);
    return () => clearInterval(iv);
  }, [isHost, roomOwner, myRoomCode, refreshParticipants]);

  /* ── push game state ── */
  const pushGame = async (newG) => {
    const g = { ...newG, updatedAt: Date.now() };
    setSyncing(true);
    await setRoomGame(roomOwner, g);
    setGame(g);
    setLastSync(new Date());
    setSyncing(false);
  };

  /* ── setup: pick players (and optionally myself) + dealing order ── */
  const toggleSetupPlayer = (username) => {
    setSetupSelected(prev =>
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };
  const moveSetupPlayer = (username, newPos) => {
    setSetupSelected(prev => {
      const without = prev.filter(u => u !== username);
      const pos = Math.max(0, Math.min(newPos, without.length));
      return [...without.slice(0, pos), username, ...without.slice(pos)];
    });
  };

  // candidates available to select as players: everyone currently in the room,
  // plus the host themselves if they've ticked "I'm playing too"
  const selectablePeople = [
    ...(includeSelfAsPlayer ? [{ username: session.username, name: session.name || session.username, avatar: session.avatar || "👑" }] : []),
    ...participants,
  ];

  const applySetup = async () => {
    if (setupSelected.length < 2) { showToast("⚠️ Select at least 2 players"); return; }
    const old = game.players || [];
    const byUsername = {};
    old.forEach(p => { if (p.username) byUsername[p.username] = p; });

    const players = setupSelected.map(username => {
      const person = selectablePeople.find(v => v.username === username);
      const existing = byUsername[username];
      return existing || {
        username, name: person?.name || username, avatar: person?.avatar || "🎮",
        total: 0, lastAdded: 0, eliminated: false,
      };
    });

    const maxScore = (setupMax === "" || +setupMax < 10) ? 200 : +setupMax;
    setSetupMax(maxScore);
    await pushGame({ ...game, numPlayers: players.length, maxScore, players, dealerIndex: 0, gameStarted: true });
    setRoundInputs({});
    showToast("✓ Game started! Settings are now locked until you reset.");
  };

  const addRound = async () => {
    if (syncing) return;
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

    let nextDealer = dealerIdx;
    for (let step = 1; step <= players.length; step++) {
      const candidate = (dealerIdx + step) % players.length;
      if (!players[candidate].eliminated) { nextDealer = candidate; break; }
    }

    const jokes = {};
    players.forEach((p, i) => {
      if (p.eliminated) return;
      const pct = Math.round((p.total / game.maxScore) * 100);
      const zone = pct >= 90 ? "danger" : pct >= 70 ? "warn" : null;
      if (zone) jokes[i] = { zone, text: getZoneJoke(`${i}`, zone) };
    });

    const active = players.filter(p => !p.eliminated);
    const winner = active.length === 1 ? active[0].name : null;
    const winnerLine = winner ? getWinnerLine(`${roomOwner}-${game.round}-${winner}`) : null;

    const newG = { ...game, players, round: game.round + 1, history, dealerIndex: nextDealer, winner, winnerLine, jokes };
    await pushGame(newG);
    setRoundInputs({});
    setShowWinner(true);
    showToast(`✅ Round ${game.round} saved! Dealt by ${dealerName}`);
    if (active.length === 0) showToast("All players eliminated!");
  };

  const resetGame = async () => {
    if (game.history && game.history.length > 0) {
      const usernameByPlayerIndex = {};
      game.players.forEach((p, i) => { if (p.username) usernameByPlayerIndex[i] = p.username; });
      await recordFinishedGame({ adminUsername: roomOwner, game, usernameByPlayerIndex });
    }
    const players = game.players.map(p => ({ ...p, total: 0, lastAdded: 0, eliminated: false }));
    await pushGame({ ...game, round: 1, history: [], players, dealerIndex: 0, winner: null, winnerLine: null, jokes: {}, gameStarted: false });
    setSetupSelected(game.players.map(p => p.username).filter(Boolean));
    setRoundInputs({});
    setShowWinner(true);
    showToast("Game reset — setup unlocked");
  };

  const handleExport = () => {
    const csv = buildGameCSV(game, roomOwner);
    const ok = downloadCSV(csv, `ScoreKing_${roomOwner}`);
    if (ok) showToast("📥 CSV downloaded!");
    else setCsvText(csv);
  };

  /* ── room lock / code (host only) ── */
  const handleRegenerateCode = () => {
    askConfirm("Generate a new room code? The old code will stop working immediately.", async () => {
      setRegenBusy(true);
      const res = await regenerateRoomCode(roomOwner);
      setRegenBusy(false);
      if (res.ok) { setRoomCodeState(res.code); setMyRoomCode(res.code); onUpdateSession?.({ roomCode: res.code }); showToast("✅ New room code generated"); }
      else showToast("⚠️ Failed: " + res.error);
    });
  };

  const roomLocked = game?._roomLocked || false;
  const handleToggleLock = () => {
    const goingToLock = !roomLocked;
    askConfirm(
      goingToLock ? "Close this room? Players won't be able to view or play until you reopen it."
        : "Reopen this room? Players will be able to view and play again.",
      async () => {
        setLockBusy(true);
        const ok = await setRoomLocked(roomOwner, goingToLock);
        setLockBusy(false);
        if (ok) { setGame(prev => ({ ...prev, _roomLocked: goingToLock })); showToast(goingToLock ? "🔒 Room closed" : "🔓 Room reopened"); }
        else showToast("⚠️ Failed to update room status");
      }
    );
  };

  const handleRemoveParticipant = (username) => {
    askConfirm(`Remove this player from your room?`, async () => {
      const ok = await removeParticipant(username);
      if (ok) { showToast("Removed"); refreshParticipants(); }
    });
  };

  /* ── profile panel: my own account ── */
  const handleSaveName = async () => {
    setProfileErr("");
    const res = await changeName(session.username, editNameVal);
    if (!res.ok) { setProfileErr(res.error); return; }
    onUpdateSession?.({ name: editNameVal.trim() });
    showToast("✅ Name updated");
  };

  const handleChangePassword = async () => {
    setProfileErr("");
    setProfileBusy(true);
    const res = await changePassword(session.username, pwCurrent, pwNew);
    setProfileBusy(false);
    if (!res.ok) { setProfileErr(res.error); return; }
    setPwCurrent(""); setPwNew("");
    showToast("✅ Password updated");
  };

  const handlePhotoSelect = async (file) => {
    if (!file || !file.type.startsWith("image/")) { showToast("Please choose an image file"); return; }
    setPhotoUploading(true);
    const url = await uploadAvatarPhoto(file, session.username);
    setPhotoUploading(false);
    if (!url) { showToast("⚠️ Upload failed"); return; }
    const ok = await changeAvatar(session.username, url);
    if (!ok) { showToast("⚠️ Failed to save photo"); return; }
    onUpdateSession?.({ avatar: url });
    showToast("📷 Photo updated");
  };

  const handleJoinAnotherRoom = async () => {
    setProfileErr("");
    if (!joinCodeVal.trim()) { setProfileErr("Enter a room code"); return; }
    setProfileBusy(true);
    const res = await joinRoomByCode(session.username, joinCodeVal.trim());
    setProfileBusy(false);
    if (!res.ok) { setProfileErr(res.error); return; }
    onUpdateSession?.({ joinedHost: res.hostUsername });
    onSwitchView?.("joined");
    setProfileOpen(false);
    showToast("✅ Joined! Viewing that room now.");
  };

  const handleLeaveJoinedRoom = () => {
    askConfirm("Leave this room? You can join another anytime.", async () => {
      const ok = await leaveCurrentRoom(session.username);
      if (ok) {
        showToast("Left the room");
        onUpdateSession?.({ joinedHost: null });
        onSwitchView?.("own");
        setProfileOpen(false);
      } else showToast("⚠️ Failed to leave");
    });
  };

  const loadMyHistory = async () => {
    setHistoryLoading(true);
    const [records, stats] = await Promise.all([getMyGameHistory(session.username), getMyOverallStats(session.username)]);
    setMyHistory(records);
    setMyStats(stats);
    setHistoryLoading(false);
  };

  const loadAdminHistory = async () => {
    setHistoryLoading(true);
    const records = await getAdminGameHistory(roomOwner);
    setAdminHistory(records);
    setHistoryLoading(false);
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

  if (!roomOwner || creatingRoom) {
    return <div style={S.appWrap}><div style={{ textAlign: "center", padding: 40, color: "#9999bb" }}>
      {creatingRoom ? "Setting up your room…" : "Loading…"}
    </div></div>;
  }

  if (!game) {
    return <div style={S.appWrap}><div style={{ textAlign: "center", padding: 40, color: "#9999bb" }}>Loading game data…</div></div>;
  }

  // Non-hosts get fully blocked while the room is locked.
  if (!isHost && game._roomLocked) {
    return (
      <div style={S.screen}>
        <div style={S.loginBox}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f0ff", marginBottom: 8 }}>This room is closed</div>
          <div style={{ fontSize: 13, color: "#9999bb", marginBottom: 24 }}>
            {roomOwner} has temporarily closed this room. Your spot, score history, and account are all safe —
            check back once they reopen it.
          </div>
          <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={onLogout}>↩ Logout</button>
        </div>
      </div>
    );
  }

  const maxS = game.maxScore;

  return (
    <div style={S.appWrap}>
      {/* TOP BAR */}
      <div style={S.topBar}>
        <div style={{ ...S.flex("row", "center", 8), cursor: "pointer" }} onClick={() => { setProfileOpen(true); setProfileErr(""); }}>
          <Avatar avatar={session.avatar || "🎮"} size={20} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#f0f0ff" }}>{session.name || session.username}</div>
            <div style={{ fontSize: 11, color: "#6b6b8a" }}>
              {isOwnView ? "Your room · tap to manage" : `Playing in ${roomOwner}'s room · tap to manage`}
            </div>
          </div>
        </div>
        <div style={S.flex("row", "center", 8)}>
          <div style={{ fontSize: 11, color: syncing ? "#f5c842" : "#22c97a", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: syncing ? "#f5c842" : "#22c97a", display: "inline-block" }} />
            {syncing ? "Syncing…" : lastSync ? "Live" : "—"}
          </div>
        </div>
      </div>

      {/* room switcher, if relevant */}
      {viewMode === "joined" && (
        <button style={{ ...S.btn, ...S.btnGhost, width: "100%", marginBottom: 10 }} onClick={() => onSwitchView?.("own")}>
          ↩ Switch to My Room
        </button>
      )}
      {viewMode === "own" && session.joinedHost && (
        <button style={{ ...S.btn, ...S.btnGhost, width: "100%", marginBottom: 10 }} onClick={() => onSwitchView?.("joined")}>
          🎮 Switch to {session.joinedHost}'s Room
        </button>
      )}

      <div style={{ textAlign: "center", padding: "16px 0 16px" }}>
        <div style={S.logo}>ScoreKing ♠️</div>
        <div style={S.logoSub}>{isOwnView ? "Your Room" : `${roomOwner}'s Room`}</div>
      </div>

      {showHelpTip && (
        <div style={{
          ...S.glass, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 10,
          background: "rgba(124,109,250,.08)", border: "1px solid rgba(124,109,250,.2)",
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <div style={{ flex: 1, fontSize: 12, color: "#9999bb", lineHeight: 1.5 }}>
            {isHost
              ? <>You're hosting — select players below, enter each round's scores, and tap your name/avatar anytime to manage your room or account.</>
              : <>You're watching live — scores update automatically. Tap your name/avatar anytime to change your profile, switch rooms, or check your game history.</>}
          </div>
          <button style={{ background: "none", border: "none", color: "#6b6b8a", cursor: "pointer", fontSize: 16, padding: 0 }} onClick={() => setShowHelpTip(false)}>✕</button>
        </div>
      )}

      {/* SETUP (host only) */}
      {isHost && (
        <div style={S.glass}>
          <div style={{ ...S.flex("row", "center"), justifyContent: "space-between", marginBottom: 10 }}>
            <div style={S.sectionLabel}>Game Setup</div>
            {game.gameStarted && <span style={{ fontSize: 11, color: "#f5c842", fontWeight: 700 }}>🔒 Locked — reset to change</span>}
          </div>

          {game.gameStarted ? (
            <div style={{ fontSize: 13, color: "#9999bb" }}>
              Players, max score, and dealing order are locked for this game. Use <b>↺ Reset</b> below if you need to change them.
            </div>
          ) : (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 14,
                background: includeSelfAsPlayer ? "rgba(124,109,250,.15)" : "rgba(255,255,255,.04)",
                border: `1px solid ${includeSelfAsPlayer ? "rgba(124,109,250,.4)" : "rgba(255,255,255,.07)"}`,
                cursor: "pointer",
              }} onClick={() => {
                setIncludeSelfAsPlayer(v => !v);
                if (!includeSelfAsPlayer) setSetupSelected(prev => [session.username, ...prev]);
                else setSetupSelected(prev => prev.filter(u => u !== session.username));
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: includeSelfAsPlayer ? "#7c6dfa" : "transparent", border: `1.5px solid ${includeSelfAsPlayer ? "#7c6dfa" : "#6b6b8a"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700,
                }}>{includeSelfAsPlayer ? "✓" : ""}</div>
                <div style={{ fontSize: 14, color: "#f0f0ff" }}>🎮 I'm playing too (not just scoring)</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Select players (from people who've joined your room)</label>
                {participants.length === 0 && !includeSelfAsPlayer && (
                  <div style={{ fontSize: 12, color: "#6b6b8a", padding: "10px 0" }}>
                    Nobody's joined your room yet — share your room code first (tap your name above → 🏠 Room).
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selectablePeople.map(v => {
                    const idx = setupSelected.indexOf(v.username);
                    const selected = idx !== -1;
                    const isSelf = v.username === session.username;
                    return (
                      <div key={v.username} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                        borderRadius: 10, cursor: "pointer",
                        background: selected ? "rgba(124,109,250,.15)" : "rgba(255,255,255,.04)",
                        border: `1px solid ${selected ? "rgba(124,109,250,.4)" : "rgba(255,255,255,.07)"}`,
                      }} onClick={() => toggleSetupPlayer(v.username)}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          background: selected ? "#7c6dfa" : "transparent", border: `1.5px solid ${selected ? "#7c6dfa" : "#6b6b8a"}`,
                          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700,
                        }}>{selected ? "✓" : ""}</div>
                        <Avatar avatar={v.avatar} size={20} />
                        <div style={{ flex: 1, fontSize: 14, color: "#f0f0ff" }}>{v.name}{isSelf && " (you)"}</div>
                        {selected && (
                          <select value={idx} onClick={e => e.stopPropagation()} onChange={e => moveSetupPlayer(v.username, +e.target.value)}
                            style={{ ...S.select, width: "auto", padding: "4px 8px", fontSize: 12 }}>
                            {setupSelected.map((_, pos) => (
                              <option key={pos} value={pos}>{pos + 1}{pos === 0 ? "st" : pos === 1 ? "nd" : pos === 2 ? "rd" : "th"} to deal</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: "#6b6b8a", marginTop: 8 }}>
                  Dealing starts with whoever you set as 1st, then rotates through the rest in order, looping back, skipping anyone eliminated.
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Out at score</label>
                <input style={S.input} type="number" value={setupMax} onFocus={e => e.target.select()}
                  onChange={e => setSetupMax(e.target.value === "" ? "" : +e.target.value)}
                  onBlur={e => { if (e.target.value === "" || +e.target.value < 10) setSetupMax(200); }}
                  min={10} inputMode="numeric" />
              </div>

              <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={applySetup}>
                ✓ Start Game with {setupSelected.length} Player{setupSelected.length !== 1 ? "s" : ""}
              </button>
            </>
          )}
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
      {game.gameStarted && (
        <div style={{ ...S.glass, padding: "10px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🂠</span>
          <div>
            <div style={{ fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".06em" }}>Dealing this round</div>
            <div style={{ fontWeight: 700, color: "#f5c842" }}>{game.players[dealerIdx]?.name || "—"}</div>
          </div>
        </div>
      )}

      {/* ROUND LABEL + VIEW TOGGLE */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0", padding: "0 2px" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
        <span style={{ fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".12em", whiteSpace: "nowrap" }}>
          Round {game.round} — {isHost ? "Enter scores below" : "Viewing live scores"}
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
      {!tableView && game.players.length === 0 && (
        <div style={{ ...S.glass, textAlign: "center", padding: 30, color: "#6b6b8a", fontSize: 13 }}>
          {isHost ? "Select players above and start the game to see scores here." : "The host hasn't started the game yet — check back soon."}
        </div>
      )}
      {!tableView && game.players.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {game.players.map((p, i) => {
            const elim = p.eliminated;
            const pct = Math.min(100, Math.round(p.total / maxS * 100));
            const needs = maxS - p.total;
            const col = PLAYER_COLORS[i % PLAYER_COLORS.length];
            const rank = getRank(i);
            const rankColors = [null, "#f5c842", "#c0c0d0", "#d48050"];
            const isDealer = i === dealerIdx && !elim;
            const zone = elim ? null : pct >= 90 ? "danger" : pct >= 70 ? "warn" : null;
            const joke = zone ? game.jokes?.[i]?.text : null;
            return (
              <div key={i} style={{ ...S.pcard, opacity: elim ? .45 : 1, position: "relative" }}>
                {elim && <div style={S.outBadge}>OUT</div>}
                {isDealer && <div style={S.dealerBadge}>🂠 DEALER</div>}
                <div style={{ ...S.flex("row", "center", 12), marginBottom: 14, marginTop: isDealer ? 14 : 0 }}>
                  <div style={{ ...S.rankBubble, background: `${col}22`, color: rank <= 3 ? rankColors[rank] : "#9999bb" }}>{rank || "—"}</div>
                  <Avatar avatar={p.avatar} size={26} />
                  <div style={{ flex: 1, fontWeight: 700, fontSize: 16, color: col }}>{p.name}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: pct >= 90 && !elim ? "#ff5c5c" : pct >= 70 && !elim ? "#ff8c42" : "#f0f0ff" }}>{p.total}</div>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,.07)", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? "#ff5c5c" : pct >= 70 ? "#ff8c42" : "#22c97a", borderRadius: 3, transition: "width .5s" }} />
                </div>
                {joke && (
                  <div style={{
                    fontSize: 12, fontStyle: "italic", marginBottom: 12, padding: "6px 10px", borderRadius: 8,
                    color: zone === "danger" ? "#ff8c9a" : "#ffc98c",
                    background: zone === "danger" ? "rgba(255,92,92,.08)" : "rgba(255,140,66,.08)",
                  }}>
                    {zone === "danger" ? "💀 " : "😬 "}{joke}
                  </div>
                )}
                <div style={{ ...S.flex("row", "center"), justifyContent: "space-between" }}>
                  <div style={S.flex("row", "center", 16)}>
                    <div><div style={S.metaLbl}>Needs</div><div style={{ ...S.metaVal, color: elim ? "#6b6b8a" : "#ff5c5c" }}>{elim ? "—" : needs}</div></div>
                    <div><div style={S.metaLbl}>Last +</div><div style={{ ...S.metaVal, color: p.lastAdded > 0 ? "#22c97a" : "#6b6b8a" }}>{p.lastAdded > 0 ? `+${p.lastAdded}` : "—"}</div></div>
                    <div>
                      <div style={S.metaLbl}>Status</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: game.winner === p.name ? "#f5c842" : elim ? "#6b6b8a" : pct >= 90 ? "#ff5c5c" : pct >= 70 ? "#ff8c42" : "#22c97a" }}>
                        {game.winner === p.name ? "🏆 WON" : elim ? "OUT" : pct >= 90 ? "DANGER" : pct >= 70 ? "WARN" : "SAFE"}
                      </div>
                    </div>
                  </div>
                  {isHost && !elim && (
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: col, fontWeight: 700 }}>+</span>
                      <input type="number" inputMode="numeric" min="0" placeholder="0" style={S.scoreInput}
                        value={roundInputs[i] ?? ""} onFocus={e => e.target.select()}
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
                {isHost && <th style={S.th}>Add</th>}
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
                    <td style={{ ...S.td, fontWeight: 700, fontSize: 11, color: game.winner === p.name ? "#f5c842" : elim ? "#6b6b8a" : pct >= 90 ? "#ff5c5c" : pct >= 70 ? "#ff8c42" : "#22c97a" }}>
                      {game.winner === p.name ? "🏆 WON" : elim ? "OUT" : pct >= 90 ? "DANGER" : pct >= 70 ? "WARN" : "SAFE"}
                    </td>
                    {isHost && (
                      <td style={S.td}>
                        {!elim && (
                          <input type="number" inputMode="numeric" min="0" placeholder="0"
                            style={{ ...S.scoreInput, width: 64, padding: "6px 6px 6px 18px", fontSize: 13, minHeight: 34 }}
                            value={roundInputs[i] ?? ""} onFocus={e => e.target.select()}
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

      {/* ACTION BAR (host only) */}
      {isHost && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <button style={{ ...S.btn, ...S.btnGreen, gridColumn: "span 2" }} onClick={addRound} disabled={syncing}>
            {syncing ? "Saving…" : "▶ Add Round"}
          </button>
          <button style={{ ...S.btn, ...S.btnRed }} onClick={() => askConfirm("Reset game?", resetGame)}>↺ Reset</button>
          <button style={{ ...S.btn, ...S.btnGhost }} onClick={() => setShowHistory(v => !v)}>📊 History</button>
          <button style={{ ...S.btn, ...S.btnGhost, gridColumn: "span 2" }} onClick={handleExport}>⬇ Export CSV</button>
        </div>
      )}

      {!isHost && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={() => setShowHistory(v => !v)}>📊 {showHistory ? "Hide" : "View"} Round History</button>
          <div style={{ textAlign: "center", color: "#6b6b8a", fontSize: 13, padding: "4px 0" }}>
            🔴 Live · Auto-refreshes every {POLL_MS / 1000}s
          </div>
        </div>
      )}

      {/* HISTORY (this game, round by round) */}
      {showHistory && (
        <div style={{ ...S.glass, marginBottom: 14 }}>
          <div style={{ ...S.flex("row", "center"), justifyContent: "space-between", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
            <div style={S.sectionLabel}>Round History</div>
            {isHost && <button style={{ ...S.btn, ...S.btnGhost, padding: "4px 10px", minHeight: 28, fontSize: 12 }}
              onClick={() => askConfirm("Clear history?", () => pushGame({ ...game, history: [] }))}>Clear</button>}
          </div>
          <select style={{ ...S.select, marginBottom: 12 }} value={historyFilter} onChange={e => setHistoryFilter(e.target.value)}>
            <option value="all">All players</option>
            {game.players.map((p, i) => <option key={i} value={p.name}>{p.name} only</option>)}
          </select>
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {!game.history.length && <div style={{ textAlign: "center", color: "#6b6b8a", padding: 20, fontSize: 13 }}>No rounds played yet</div>}
            {game.history.length > 0 && (() => {
              const filtered = historyFilter === "all" ? game.history : game.history.filter(h => h.player === historyFilter);
              if (filtered.length === 0) return <div style={{ textAlign: "center", color: "#6b6b8a", padding: 20, fontSize: 13 }}>No rounds yet for {historyFilter}</div>;
              return [...filtered].reverse().map((h, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr 50px 50px 64px", padding: "8px 4px", borderBottom: "1px solid rgba(255,255,255,.04)", fontSize: 12, alignItems: "center", gap: 4 }}>
                  <div style={{ color: "#6b6b8a", fontWeight: 600, fontSize: 11 }}>{h.round}</div>
                  <div style={{ color: "#9999bb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.player}{h.dealer && <span style={{ color: "#6b6b8a", fontSize: 10 }}> · dealer: {h.dealer}</span>}
                  </div>
                  <div style={{ color: "#f5c842", fontWeight: 600 }}>+{h.added}</div>
                  <div style={{ fontWeight: 700 }}>{h.total}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: h.status === "ELIMINATED" ? "#ff5c5c" : "#22c97a" }}>{h.status}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* WINNER OVERLAY */}
      {game.winner && showWinner && (
        <div style={S.overlayWrap}>
          <div style={S.winBox}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#a48cff", marginBottom: 4 }}>Game Over!</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f5c842", marginBottom: 10 }}>{game.winner}</div>
            <div style={{
              fontSize: 14, color: "#f0f0ff", marginBottom: 24, fontStyle: "italic", lineHeight: 1.5,
              padding: "10px 14px", background: "rgba(245,200,66,.08)", border: "1px solid rgba(245,200,66,.2)", borderRadius: 10,
            }}>
              {game.winnerLine || "wins with the lowest score! 🎉"}
            </div>
            {isHost && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={resetGame}>🎮 Play Again</button>
                <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={() => setShowWinner(false)}>Close (review scores first)</button>
              </div>
            )}
            {!isHost && <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={() => setShowWinner(false)}>Close</button>}
          </div>
        </div>
      )}

      {toast && <div style={S.toast}>{toast}</div>}

      {confirmDlg && (
        <div style={S.overlayWrapTop}>
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

      {/* UNIFIED PROFILE PANEL */}
      {profileOpen && (
        <div style={S.overlayWrap}>
          <div style={{ ...S.winBox, maxWidth: 460, maxHeight: "90vh", overflowY: "auto", textAlign: "left", padding: 24 }}>
            <div style={{ ...S.flex("row", "center"), justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#a48cff" }}>👤 My Account</div>
              <button style={{ ...S.btn, ...S.btnGhost, padding: "5px 12px", minHeight: 30, fontSize: 13 }}
                onClick={() => { setProfileOpen(false); setProfileErr(""); }}>✕ Close</button>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <div style={{ position: "relative" }}>
                <Avatar avatar={session.avatar || "🎮"} size={80} />
                <label style={{
                  position: "absolute", bottom: -4, right: -4, background: "#7c6dfa", borderRadius: "50%",
                  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 13, border: "2px solid #1a1a2e",
                }}>
                  📷
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => handlePhotoSelect(e.target.files?.[0])} disabled={photoUploading} />
                </label>
              </div>
            </div>
            {photoUploading && <div style={{ textAlign: "center", fontSize: 12, color: "#9999bb", marginBottom: 12 }}>Uploading…</div>}

            <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
              {["profile", "room", ...(isOwnView ? ["players"] : []), "history"].map(tab => (
                <button key={tab} onClick={() => {
                  setProfileTab(tab); setProfileErr("");
                  if (tab === "history") { isOwnView ? loadAdminHistory() : null; loadMyHistory(); }
                }} style={{
                  ...S.btn, flex: 1, padding: "8px 0", minHeight: 36, fontSize: 12,
                  background: profileTab === tab ? "rgba(124,109,250,.25)" : "rgba(255,255,255,.04)",
                  color: profileTab === tab ? "#a48cff" : "#9999bb",
                }}>
                  {tab === "profile" ? "Profile" : tab === "room" ? "🏠 Room" : tab === "players" ? "Players" : "📜 History"}
                </button>
              ))}
            </div>

            {profileTab === "profile" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={S.fieldLabel}>Display name</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...S.input, flex: 1 }} value={editNameVal} onChange={e => setEditNameVal(e.target.value)} />
                    <button style={{ ...S.btn, ...S.btnAccent, padding: "8px 14px", minHeight: 44 }} onClick={handleSaveName}>Save</button>
                  </div>
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,.08)" }} />

                <div>
                  <div style={S.sectionLabel}>Change Password</div>
                  <label style={S.fieldLabel}>Current password</label>
                  <input style={{ ...S.input, marginBottom: 10 }} type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} />
                  <label style={S.fieldLabel}>New password</label>
                  <input style={{ ...S.input, marginBottom: 10 }} type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} />
                  <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={handleChangePassword} disabled={profileBusy}>
                    {profileBusy ? "Updating…" : "Update Password"}
                  </button>
                </div>

                {profileErr && <div style={{ color: "#ff5c5c", fontSize: 13 }}>{profileErr}</div>}

                <div style={{ height: 1, background: "rgba(255,255,255,.08)" }} />
                <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={onLogout}>↩ Logout</button>
              </div>
            )}

            {profileTab === "room" && (
              <div>
                <div style={S.sectionLabel}>🏠 Current Room</div>
                <div style={{ textAlign: "center", padding: "24px 16px", background: "rgba(124,109,250,.08)", border: "1px solid rgba(124,109,250,.25)", borderRadius: 14, marginBottom: 10 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 32, fontWeight: 800, letterSpacing: "0.1em", color: "#f5c842" }}>
                    {isOwnView ? (roomCode || myRoomCode || "…") : "— hosted by " + roomOwner + " —"}
                  </div>
                  <div style={{ fontSize: 12, color: "#9999bb", marginTop: 8 }}>
                    {isOwnView
                      ? "This is your room — share the code above with friends so they can join."
                      : `You're currently in ${roomOwner}'s room as a player.`}
                  </div>
                </div>

                {!isOwnView && (
                  <button style={{ ...S.btn, ...S.btnRed, width: "100%", marginBottom: 18 }} onClick={handleLeaveJoinedRoom}>
                    🚪 Exit This Room
                  </button>
                )}

                <div style={{ height: 1, background: "rgba(255,255,255,.08)", marginBottom: 18 }} />

                <div style={S.sectionLabel}>➕ Join a Different Room</div>
                <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 10 }}>
                  Enter a friend's room code to join their game as a player.
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input style={{ ...S.input, flex: 1, fontFamily: "monospace", fontWeight: 700 }} value={joinCodeVal}
                    onChange={e => setJoinCodeVal(e.target.value.toUpperCase())} placeholder="Room code" maxLength={10} />
                  <button style={{ ...S.btn, ...S.btnAccent, padding: "8px 14px", minHeight: 44 }} onClick={handleJoinAnotherRoom} disabled={profileBusy}>Join</button>
                </div>
                {profileErr && <div style={{ color: "#ff5c5c", fontSize: 13, marginBottom: 8 }}>{profileErr}</div>}

                {isOwnView && (
                  <>
                    <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "18px 0" }} />

                    <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={handleRegenerateCode} disabled={regenBusy}>
                      {regenBusy ? "Generating…" : "🔄 Generate New Code"}
                    </button>
                    <div style={{ fontSize: 11, color: "#6b6b8a", marginTop: 8, marginBottom: 18, textAlign: "center" }}>
                      Regenerating immediately invalidates the old code — players who already joined are unaffected.
                    </div>

                    <div style={S.sectionLabel}>Room Status</div>
                    <div style={{
                      padding: "14px 16px", borderRadius: 12, marginBottom: 12,
                      background: roomLocked ? "rgba(255,92,92,.08)" : "rgba(34,201,122,.08)",
                      border: `1px solid ${roomLocked ? "rgba(255,92,92,.25)" : "rgba(34,201,122,.25)"}`,
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: roomLocked ? "#ff5c5c" : "#22c97a" }}>
                        {roomLocked ? "🔒 Room is Closed" : "🔓 Room is Open"}
                      </div>
                      <div style={{ fontSize: 12, color: "#9999bb", marginTop: 4 }}>
                        {roomLocked ? "Players see a closed message and can't view or play. Your scores and history are safe." : "Players can view the scoreboard and play normally."}
                      </div>
                    </div>
                    <button style={{ ...S.btn, ...(roomLocked ? S.btnGreen : S.btnRed), width: "100%" }} onClick={handleToggleLock} disabled={lockBusy}>
                      {lockBusy ? "Updating…" : roomLocked ? "🔓 Reopen Room" : "🔒 Close Room"}
                    </button>
                  </>
                )}
              </div>
            )}

            {profileTab === "players" && isOwnView && (
              <div>
                <div style={S.sectionLabel}>People in Your Room</div>
                {participants.map(v => (
                  <div key={v.username} style={{ ...S.flex("row", "center", 10), padding: "10px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, marginBottom: 8 }}>
                    <Avatar avatar={v.avatar} size={22} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#f0f0ff" }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: "#6b6b8a" }}>@{v.username}{v.room_code && " · also hosts their own room"}</div>
                    </div>
                    <button style={{ ...S.btn, ...S.btnRed, padding: "4px 8px", minHeight: 26, fontSize: 11 }} onClick={() => handleRemoveParticipant(v.username)}>✕</button>
                  </div>
                ))}
                {participants.length === 0 && (
                  <div style={{ textAlign: "center", color: "#6b6b8a", padding: 16, fontSize: 13 }}>
                    Nobody's joined yet. Share your room code from the "🏠 Room" tab.
                  </div>
                )}
              </div>
            )}

            {profileTab === "history" && (
              <div>
                {historyLoading && <div style={{ textAlign: "center", color: "#6b6b8a", padding: 20, fontSize: 13 }}>Loading…</div>}

                {!historyLoading && myStats && (
                  <>
                    <div style={S.sectionLabel}>Your Overall Stats</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
                      <div style={S.statBox}>
                        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#a48cff" }}>{myStats.played}</div>
                        <div style={{ fontSize: 9, color: "#6b6b8a", marginTop: 4, textTransform: "uppercase" }}>Played</div>
                      </div>
                      <div style={S.statBox}>
                        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#f5c842" }}>{myStats.won}</div>
                        <div style={{ fontSize: 9, color: "#6b6b8a", marginTop: 4, textTransform: "uppercase" }}>Won</div>
                      </div>
                      <div style={{ ...S.statBox }}>
                        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#ff5c5c" }}>{myStats.lost}</div>
                        <div style={{ fontSize: 9, color: "#6b6b8a", marginTop: 4, textTransform: "uppercase" }}>Lost</div>
                      </div>
                      <div style={{ ...S.statBox }}>
                        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#22c97a" }}>{myStats.winRate}%</div>
                        <div style={{ fontSize: 9, color: "#6b6b8a", marginTop: 4, textTransform: "uppercase" }}>Win Rate</div>
                      </div>
                    </div>
                  </>
                )}

                {!historyLoading && myHistory && myHistory.length === 0 && (
                  <div style={{ textAlign: "center", color: "#6b6b8a", padding: 20, fontSize: 13 }}>
                    No completed games yet. This fills in once a game you've played finishes or resets.
                  </div>
                )}
                {!historyLoading && myHistory && myHistory.length > 0 && (
                  <>
                    <div style={S.sectionLabel}>Game by Game</div>
                    <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: isOwnView ? 18 : 0 }}>
                      {myHistory.map(r => (
                        <div key={r.id} style={{
                          padding: "10px 12px", marginBottom: 8, borderRadius: 10,
                          background: r.won ? "rgba(245,200,66,.08)" : "rgba(255,255,255,.04)",
                          border: `1px solid ${r.won ? "rgba(245,200,66,.25)" : "rgba(255,255,255,.07)"}`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: r.won ? "#f5c842" : "#f0f0ff" }}>
                              {r.won ? "🏆 Won" : r.eliminated ? "❌ Eliminated" : "Game ended"} — room: {r.admin_username}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b6b8a" }}>{new Date(r.ended_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ fontSize: 12, color: "#9999bb" }}>
                            Final score: <b style={{ color: "#f0f0ff" }}>{r.final_score}</b> · {r.rounds_played} round{r.rounds_played !== 1 ? "s" : ""} played
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {isOwnView && !historyLoading && adminHistory && (
                  <>
                    <div style={{ height: 1, background: "rgba(255,255,255,.08)", marginBottom: 18 }} />
                    <div style={S.sectionLabel}>Games Played in Your Room</div>
                    {adminHistory.length === 0 && (
                      <div style={{ textAlign: "center", color: "#6b6b8a", padding: 16, fontSize: 13 }}>No completed games yet.</div>
                    )}
                    <div style={{ maxHeight: 260, overflowY: "auto" }}>
                      {adminHistory.map(r => (
                        <div key={r.id} style={{
                          padding: "10px 12px", marginBottom: 8, borderRadius: 10,
                          background: r.winner ? "rgba(245,200,66,.08)" : "rgba(255,255,255,.04)",
                          border: `1px solid ${r.winner ? "rgba(245,200,66,.25)" : "rgba(255,255,255,.07)"}`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: r.winner ? "#f5c842" : "#f0f0ff" }}>
                              {r.winner ? `🏆 ${r.winner} won` : "Ended without a winner"}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b6b8a" }}>{new Date(r.ended_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ fontSize: 12, color: "#9999bb" }}>
                            {r.rounds_played} round{r.rounds_played !== 1 ? "s" : ""} · max score {r.max_score} · {(r.final_standings || []).length} players
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
