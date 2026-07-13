import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient.js";
import { getStyles, Avatar } from "../styles.jsx";
import { useTheme } from "../ThemeContext.jsx";
import { PLAYER_COLORS, DEFAULT_GAME, buildGameCSV, downloadCSV } from "../constants.js";
import { getZoneJoke, getWinnerLine, getRoundWinLine } from "../jokes.js";
import QRCodeDisplay from "../components/QRCodeDisplay.jsx";
import {
  getRoomGame, setRoomGame, createRoom, setRoomLocked, regenerateRoomCode,
  listRoomParticipants, removeParticipant, joinRoomByCode, leaveCurrentRoom,
  changeName, changePassword, changeAvatar, uploadAvatarPhoto,
  recordFinishedGame, getMyGameHistory, getMyOverallStats, getAdminGameHistory,
  checkIfStillInRoom,
} from "../db.js";

const POLL_MS = 3000;

export default function GameScreen({ session, viewMode, roomId, onLogout, onBackToChoice, onEnterOwnRoom, onEnterJoinedRoom, onUpdateSession }) {
  const { theme } = useTheme();
  const S = getStyles(theme);

  const isOwnView = viewMode === "own";
  const isHost = isOwnView; // I'm the host/scorer of the room currently being viewed

  // The room's host username — needed for history queries and display. For
  // "own" view it's just me; for "joined" view we look it up once the room
  // record loads (see roomHostUsername state below).
  const [roomHostUsername, setRoomHostUsername] = useState(isOwnView ? session.username : null);
  const roomOwner = roomHostUsername;

  const [game, setGame] = useState(null);
  const [roundInputs, setRoundInputs] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [tableView, setTableView] = useState(false);
  const [showWinner, setShowWinner] = useState(true);
  const [toast, setToast] = useState("");
  const [csvText, setCsvText] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState(null);
  const toastTimer = useRef(null);

  const [participants, setParticipants] = useState([]); // people sitting in this room right now
  const [setupSelected, setSetupSelected] = useState([]);
  const [setupMax, setSetupMax] = useState(200);
  const [roomCode, setRoomCodeState] = useState(null);
  const [regenBusy, setRegenBusy] = useState(false);
  const [lockBusy, setLockBusy] = useState(false);
  const [newRoomBusy, setNewRoomBusy] = useState(false);

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
  const [wasKicked, setWasKicked] = useState(false); // true if admin removed me from the room
  const pollRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };
  const askConfirm = (msg, onYes) => setConfirmDlg({ msg, onYes });

  /* ── fetch + realtime game sync ── */
  const fetchGame = useCallback(async () => {
    if (!roomId) return;
    const g = await getRoomGame(roomId);
    if (g) {
      setGame(prev => (!prev || g.updatedAt > (prev.updatedAt || 0)) ? g : prev);
      setLastSync(new Date());
      setRoomCodeState(g._roomCode || null);
    } else if (isOwnView) {
      const fresh = { ...DEFAULT_GAME, updatedAt: Date.now() };
      await setRoomGame(roomId, fresh);
      setGame(fresh);
    }
  }, [roomId, isOwnView]);

  useEffect(() => {
    if (!roomId) return;
    fetchGame();
    pollRef.current = setInterval(fetchGame, POLL_MS);

    const channel = supabase
      .channel(`room-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const g = payload.new?.game;
          if (g) {
            const merged = { ...g, _roomLocked: payload.new?.locked || false, _roomCode: payload.new?.room_code };
            setGame(prev => (!prev || merged.updatedAt > (prev.updatedAt || 0)) ? merged : prev);
            setLastSync(new Date());
            setRoomCodeState(payload.new?.room_code || null);
          }
        })
      .subscribe();

    return () => { clearInterval(pollRef.current); supabase.removeChannel(channel); };
  }, [roomId, fetchGame]);

  useEffect(() => {
    if (!game) return;
    setSetupMax(game.maxScore);
    if (!game.gameStarted) {
      setSetupSelected(game.players.map(p => p.username).filter(Boolean));
      refreshParticipants();
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

  /* ── resolve the host's username for "joined" view (needed for display + participant queries) ── */
  useEffect(() => {
    if (isOwnView) { setRoomHostUsername(session.username); return; }
    if (!roomId) return;
    supabase.from("rooms").select("admin_username").eq("id", roomId).maybeSingle()
      .then(({ data }) => { if (data) setRoomHostUsername(data.admin_username); });
  }, [isOwnView, roomId, session.username]);

  /* ── kick detection: non-hosts poll to see if they've been removed from the room ── */
  useEffect(() => {
    setWasKicked(false); // always reset when entering a new room
    if (isHost || !roomId) return;
    let intervalId = null;
    let missCount = 0; // consecutive confirmed "not in room" results
    const check = async () => {
      const stillIn = await checkIfStillInRoom(session.username, roomId);
      if (stillIn === null) {
        // Query failed (e.g. network still reconnecting after the phone's
        // screen was locked) — we don't know the real state, so don't count
        // it as evidence either way.
        return;
      }
      if (stillIn) {
        missCount = 0;
        return;
      }
      // Require two consecutive confirmed misses before declaring a kick,
      // so a single transient/racy read can't falsely boot the player.
      missCount += 1;
      if (missCount >= 2) setWasKicked(true);
    };
    // Delay the first check by 2s — gives the DB time to write current_room_id
    // before we read it back, preventing a false "kicked" on fresh joins.
    const delayId = setTimeout(() => {
      check();
      intervalId = setInterval(check, POLL_MS);
    }, 2000);
    // Re-check as soon as the tab/screen becomes visible again, giving the
    // network a moment to reconnect first, so we don't judge on a stale poll
    // that was queued up while the screen was locked.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setTimeout(check, 1000);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(delayId);
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isHost, roomId, session.username]);

  /* ── participants currently in this room (only meaningful when I'm the host) ── */
  const refreshParticipants = useCallback(async () => {
    if (!isHost || !roomId || !roomOwner) return;
    const list = await listRoomParticipants(roomId, roomOwner);
    setParticipants(list);
  }, [isHost, roomId, roomOwner]);

  useEffect(() => {
    if (!isHost || !roomId) return;
    refreshParticipants();
    const iv = setInterval(refreshParticipants, POLL_MS);
    return () => clearInterval(iv);
  }, [isHost, roomId, refreshParticipants]);

  /* ── manual refresh: re-syncs score/game state (and participants, for the
     host) on demand — an alternative to reloading the whole page, which
     would drop the session and log the person out ── */
  const handleManualRefresh = useCallback(async () => {
    if (manualRefreshing) return;
    setManualRefreshing(true);
    try {
      await fetchGame();
      if (isHost) await refreshParticipants();
      showToast("🔄 Refreshed");
    } finally {
      setManualRefreshing(false);
    }
  }, [manualRefreshing, fetchGame, isHost, refreshParticipants]);

  /* ── push game state ── */
  const pushGame = async (newG) => {
    const g = { ...newG, updatedAt: Date.now() };
    setSyncing(true);
    await setRoomGame(roomId, g);
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

  // Deduplicated view of setupSelected — defends against any duplicate that
  // might sneak in (e.g. toggling "I'm playing too" rapidly), so the displayed
  // count and the actual game-start logic can never diverge from reality.
  const setupSelectedUnique = [...new Set(setupSelected)];
  const includeSelfAsPlayer = setupSelectedUnique.includes(session.username);

  // candidates available to select as players: everyone currently in the room,
  // plus the host themselves if they've ticked "I'm playing too"
  const selectablePeopleRaw = [
    ...(includeSelfAsPlayer ? [{ username: session.username, name: session.name || session.username, avatar: session.avatar || "👑" }] : []),
    ...participants,
  ];
  // Dedupe by username — the host can otherwise show up twice if they've also
  // somehow ended up as a participant in their own room (e.g. via "Join a
  // Different Room" pointed back at themselves).
  const seenUsernames = new Set();
  const selectablePeople = selectablePeopleRaw.filter(v => {
    if (seenUsernames.has(v.username)) return false;
    seenUsernames.add(v.username);
    return true;
  });

  const applySetup = async () => {
    if (setupSelectedUnique.length < 2) { showToast("⚠️ Select at least 2 players"); return; }
    const old = game.players || [];
    const byUsername = {};
    old.forEach(p => { if (p.username) byUsername[p.username] = p; });

    const players = setupSelectedUnique.map(username => {
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
    const dealerIdx = game.dealerIndex || 0;
    const dealerName = game.players[dealerIdx]?.name || `Player ${dealerIdx + 1}`;
    // A field left blank means "no entry for this player" (skip). A field that's
    // explicitly "0" means they declared and won this round — that's a real,
    // meaningful entry, not a no-op, so it must be tracked and shown in history.
    const wasEntered = (i) => scores[i] !== undefined && scores[i] !== "";

    const activePlayers = game.players.map((p, i) => ({ p, i })).filter(({ p }) => !p.eliminated);
    const missing = activePlayers.filter(({ i }) => scores[i] === undefined || scores[i] === "");
    if (missing.length > 0) {
      showToast(`⚠️ Enter score for: ${missing.map(({ p }) => p.name).join(", ")}`);
      return;
    }

    const players = game.players.map((p, i) => {
      if (p.eliminated) return p;
      if (!wasEntered(i)) return p;
      const pts = Math.max(0, parseInt(scores[i]));
      const total = p.total + pts;
      return { ...p, total, lastAdded: pts, roundWon: pts === 0, eliminated: total >= game.maxScore };
    });
    const history = [...game.history];
    game.players.forEach((p, i) => {
      if (p.eliminated || !wasEntered(i)) return;
      const pts = Math.max(0, parseInt(scores[i]));
      history.push({
        round: game.round, player: p.name, added: pts, total: players[i].total,
        won: pts === 0,
        roundWinLine: pts === 0 ? getRoundWinLine(`${roomOwner}-${game.round}-${i}`) : null,
        status: players[i].eliminated ? "ELIMINATED" : pts === 0 ? "WON ROUND" : "ACTIVE",
        dealer: dealerName, time: new Date().toLocaleTimeString(),
      });
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

  const newGame = async () => {
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
    showToast("New game ready — players and dealer order can be adjusted before you start.");
  };

  const handleNewRoom = () => {
    askConfirm(
      "Create a brand-new, completely empty room? Your current room (with its code, players, and history) stays exactly as it is — you can reopen it anytime from the room-choice screen.",
      async () => {
        // Record the outgoing game's history first, same as a normal reset would.
        if (game.history && game.history.length > 0) {
          const usernameByPlayerIndex = {};
          game.players.forEach((p, i) => { if (p.username) usernameByPlayerIndex[i] = p.username; });
          await recordFinishedGame({ adminUsername: roomOwner, game, usernameByPlayerIndex });
        }
        setNewRoomBusy(true);
        const res = await createRoom(session.username);
        setNewRoomBusy(false);
        if (!res.ok) { showToast("⚠️ Failed: " + res.error); return; }
        showToast("✅ New room created!");
        onEnterOwnRoom?.(res.roomId);
      }
    );
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
      const res = await regenerateRoomCode(roomId);
      setRegenBusy(false);
      if (res.ok) { setRoomCodeState(res.code); showToast("✅ New room code generated"); }
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
        const ok = await setRoomLocked(roomId, goingToLock);
        setLockBusy(false);
        if (ok) { setGame(prev => ({ ...prev, _roomLocked: goingToLock })); showToast(goingToLock ? "🔒 Room closed" : "🔓 Room reopened"); }
        else showToast("⚠️ Failed to update room status");
      }
    );
  };

  const handleRemoveParticipant = (username, displayName) => {
    askConfirm(`Remove ${displayName || "this player"} from your room? If they're in the current game, they'll be removed from it immediately too.`, async () => {
      const ok = await removeParticipant(username);
      if (!ok) { showToast("⚠️ Failed to remove"); return; }

      // If they're currently part of the live game, kick them out of it too —
      // not just stop them from being selectable next time.
      if (game && game.players.some(p => p.username === username)) {
        const players = game.players.filter(p => p.username !== username);
        const removedWasDealer = game.players.findIndex(p => p.username === username) === (game.dealerIndex || 0);
        const dealerIndex = removedWasDealer ? 0 : Math.min(game.dealerIndex || 0, Math.max(0, players.length - 1));
        await pushGame({ ...game, players, numPlayers: players.length, dealerIndex });
        setSetupSelected(prev => prev.filter(u => u !== username));
      }

      showToast("Removed");
      refreshParticipants();
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
    setProfileOpen(false);
    showToast("✅ Joined! Viewing that room now.");
    onEnterJoinedRoom?.(res.roomId);
  };

  const handleLeaveJoinedRoom = () => {
    askConfirm("Exit this room? You can join another anytime.", async () => {
      const ok = await leaveCurrentRoom(session.username);
      if (ok) {
        showToast("Left the room");
        setProfileOpen(false);
        onBackToChoice?.();
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

  if (!roomId || !roomOwner) {
    return <div style={S.appWrap}><div style={{ textAlign: "center", padding: 40, color: theme.textDim }}>
      Loading…
    </div></div>;
  }

  if (!game) {
    return <div style={S.appWrap}><div style={{ textAlign: "center", padding: 40, color: theme.textDim }}>Loading game data…</div></div>;
  }

  // Non-hosts get fully blocked while the room is locked.
  if (!isHost && game._roomLocked) {
    return (
      <div style={S.screen}>
        <div style={S.loginBox}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 8 }}>This room is closed</div>
          <div style={{ fontSize: 13, color: theme.textDim, marginBottom: 24 }}>
            {roomOwner} has temporarily closed this room. Your spot, score history, and account are all safe —
            check back once they reopen it.
          </div>
          <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={onLogout}>↩ Logout</button>
        </div>
      </div>
    );
  }

  // Non-hosts who've been kicked (removed from the room via ✕) see a clear message.
  if (!isHost && wasKicked) {
    return (
      <div style={S.screen}>
        <div style={S.loginBox}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 8 }}>You've been removed</div>
          <div style={{ fontSize: 13, color: theme.textDim, marginBottom: 24 }}>
            {roomOwner || "The host"} has removed you from this room. Your account and personal history are safe.
            You can join a different room anytime.
          </div>
          <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={onBackToChoice}>↩ Back to Rooms</button>
          <button style={{ ...S.btn, ...S.btnGhost, width: "100%", marginTop: 8 }} onClick={onLogout}>Logout</button>
        </div>
      </div>
    );
  }

  // Non-hosts who are NOT in the current game's active player list
  // (unchecked in setup) are blocked from seeing the live scoreboard.
  const isInActiveGame = !isHost && game.gameStarted &&
    game.players.some(p => p.username === session.username);
  const isSpectatorBlocked = !isHost && game.gameStarted && !isInActiveGame;

  if (isSpectatorBlocked) {
    return (
      <div style={S.screen}>
        <div style={S.loginBox}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 8 }}>You're not in this game</div>
          <div style={{ fontSize: 13, color: theme.textDim, marginBottom: 24 }}>
            {roomOwner || "The host"} hasn't selected you for the current game.
            Sit tight — you'll be able to see the scoreboard once the next game starts and you're added.
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
            <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{session.name || session.username}</div>
            <div style={{ fontSize: 11, color: theme.textFaint }}>
              {isOwnView ? "Your room · tap to manage" : `Playing in ${roomOwner}'s room · tap to manage`}
            </div>
          </div>
        </div>
        <div style={S.flex("row", "center", 8)}>
          <div style={{ fontSize: 11, color: syncing ? theme.gold : theme.green, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: syncing ? theme.gold : theme.green, display: "inline-block" }} />
            {syncing ? "Syncing…" : lastSync ? "Live" : "—"}
          </div>
        </div>
      </div>

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
          <div style={{ flex: 1, fontSize: 12, color: theme.textDim, lineHeight: 1.5 }}>
            {isHost
              ? <>You're hosting — select players below, enter each round's scores, and tap your name/avatar anytime to manage your room or account.</>
              : <>You're watching live — scores update automatically. Tap your name/avatar anytime to change your profile, switch rooms, or check your game history.</>}
          </div>
          <button style={{ background: "none", border: "none", color: theme.textFaint, cursor: "pointer", fontSize: 16, padding: 0 }} onClick={() => setShowHelpTip(false)}>✕</button>
        </div>
      )}

      {/* SETUP (host only) */}
      {isHost && (
        <div style={S.glass}>
          <div style={{ ...S.flex("row", "center"), justifyContent: "space-between", marginBottom: 10 }}>
            <div style={S.sectionLabel}>Game Setup</div>
            {game.gameStarted && <span style={{ fontSize: 11, color: theme.gold, fontWeight: 700 }}>🔒 Locked — reset to change</span>}
          </div>

          {game.gameStarted ? (
            <div style={{ fontSize: 13, color: theme.textDim }}>
              Players, max score, and dealing order are locked for this game. Use <b>↺ Reset</b> below if you need to change them.
            </div>
          ) : (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 14,
                background: includeSelfAsPlayer ? theme.accentBg : theme.surface,
                border: `1px solid ${includeSelfAsPlayer ? theme.accentBorder : theme.surfaceBorder}`,
                cursor: "pointer",
              }} onClick={() => {
                if (includeSelfAsPlayer) {
                  setSetupSelected(prev => prev.filter(u => u !== session.username));
                } else {
                  setSetupSelected(prev => prev.includes(session.username) ? prev : [session.username, ...prev]);
                }
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: includeSelfAsPlayer ? theme.accent : "transparent", border: `1.5px solid ${includeSelfAsPlayer ? theme.accent : theme.textFaint}`,
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700,
                }}>{includeSelfAsPlayer ? "✓" : ""}</div>
                <div style={{ fontSize: 14, color: theme.text }}>🎮 I'm playing too (not just scoring)</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ ...S.flex("row", "center"), justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={S.fieldLabel}>Select players (from people who've joined your room)</label>
                  {setupSelectedUnique.length > 0 && (
                    <button style={{ ...S.linkBtn, fontSize: 11, padding: 0 }} onClick={() => setSetupSelected([])}>Clear all</button>
                  )}
                </div>
                {participants.length === 0 && !includeSelfAsPlayer && (
                  <div style={{ fontSize: 12, color: theme.textFaint, padding: "10px 0" }}>
                    Nobody's joined your room yet — share your room code first (tap your name above → 🏠 Room).
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selectablePeople.map(v => {
                    const idx = setupSelectedUnique.indexOf(v.username);
                    const selected = idx !== -1;
                    const isSelf = v.username === session.username;
                    return (
                      <div key={v.username} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                        borderRadius: 10, cursor: "pointer",
                        background: selected ? theme.accentBg : theme.surface,
                        border: `1px solid ${selected ? theme.accentBorder : theme.surfaceBorder}`,
                      }} onClick={() => toggleSetupPlayer(v.username)}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          background: selected ? theme.accent : "transparent", border: `1.5px solid ${selected ? theme.accent : theme.textFaint}`,
                          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700,
                        }}>{selected ? "✓" : ""}</div>
                        <Avatar avatar={v.avatar} size={20} />
                        <div style={{ flex: 1, fontSize: 14, color: theme.text }}>{v.name}{isSelf && " (you)"}</div>
                        {selected && (
                          <select value={idx} onClick={e => e.stopPropagation()} onChange={e => moveSetupPlayer(v.username, +e.target.value)}
                            style={{ ...S.select, width: "auto", padding: "4px 8px", fontSize: 12 }}>
                            {setupSelectedUnique.map((_, pos) => (
                              <option key={pos} value={pos}>{pos + 1}{pos === 0 ? "st" : pos === 1 ? "nd" : pos === 2 ? "rd" : "th"} to deal</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 8 }}>
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
                ✓ Start Game with {setupSelectedUnique.length} Player{setupSelectedUnique.length !== 1 ? "s" : ""}
              </button>
            </>
          )}
        </div>
      )}

      {/* INFO STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "14px 0" }}>
        {[["Players", game.numPlayers, theme.accentLight], ["Max", maxS, theme.blue], ["Round", game.round, theme.gold], ["Active", getActive(), theme.green]].map(([l, v, c]) => (
          <div key={l} style={S.statBox}>
            <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: c, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* dealer banner */}
      {game.gameStarted && (
        <div style={{ ...S.glass, padding: "10px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🂠</span>
          <div>
            <div style={{ fontSize: 11, color: theme.textFaint, textTransform: "uppercase", letterSpacing: ".06em" }}>Dealing this round</div>
            <div style={{ fontWeight: 700, color: theme.gold }}>{game.players[dealerIdx]?.name || "—"}</div>
          </div>
        </div>
      )}

      {/* ROUND LABEL + VIEW TOGGLE */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0", padding: "0 2px" }}>
        <div style={{ flex: 1, height: 1, background: theme.surfaceBorder }} />
        <span style={{ fontSize: 11, color: theme.textFaint, textTransform: "uppercase", letterSpacing: ".12em", whiteSpace: "nowrap" }}>
          Round {game.round} — {isHost ? "Enter scores below" : "Viewing live scores"}
        </span>
        <div style={{ flex: 1, height: 1, background: theme.surfaceBorder }} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, padding: 3, gap: 2 }}>
          <button onClick={() => setTableView(false)} style={{ ...S.btn, padding: "6px 14px", minHeight: 30, fontSize: 12, background: !tableView ? "rgba(124,109,250,.25)" : "transparent", color: !tableView ? theme.accentLight : theme.textDim }}>🗂 Cards</button>
          <button onClick={() => setTableView(true)} style={{ ...S.btn, padding: "6px 14px", minHeight: 30, fontSize: 12, background: tableView ? "rgba(124,109,250,.25)" : "transparent", color: tableView ? theme.accentLight : theme.textDim }}>📋 Table</button>
        </div>
      </div>

      {/* PLAYER CARDS */}
      {!tableView && game.players.length === 0 && (
        <div style={{ ...S.glass, textAlign: "center", padding: 30, color: theme.textFaint, fontSize: 13 }}>
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
            const rankColors = [null, theme.gold, theme.silver, theme.bronze];
            const isDealer = i === dealerIdx && !elim;
            const zone = elim ? null : pct >= 90 ? "danger" : pct >= 70 ? "warn" : null;
            const joke = zone ? game.jokes?.[i]?.text : null;
            return (
              <div key={i} style={{ ...S.pcard, opacity: elim ? .45 : 1, position: "relative" }}>
                {elim && <div style={S.outBadge}>OUT</div>}
                {isDealer && <div style={S.dealerBadge}>🂠 DEALER</div>}
                <div style={{ ...S.flex("row", "center", 12), marginBottom: 14, marginTop: isDealer ? 14 : 0 }}>
                  <div style={{ ...S.rankBubble, background: `${col}22`, color: rank <= 3 ? rankColors[rank] : theme.textDim }}>{rank || "—"}</div>
                  <Avatar avatar={p.avatar} size={26} />
                  <div style={{ flex: 1, fontWeight: 700, fontSize: 16, color: col }}>{p.name}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: pct >= 90 && !elim ? theme.red : pct >= 70 && !elim ? theme.orange : theme.text }}>{p.total}</div>
                </div>
                <div style={{ height: 5, background: theme.surfaceBorder, borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? theme.red : pct >= 70 ? theme.orange : theme.green, borderRadius: 3, transition: "width .5s" }} />
                </div>
                {joke && (
                  <div style={{
                    fontSize: 12, fontStyle: "italic", marginBottom: 12, padding: "6px 10px", borderRadius: 8,
                    color: zone === "danger" ? theme.dangerSoft : theme.warnSoft,
                    background: zone === "danger" ? theme.redBg : theme.orangeBg,
                  }}>
                    {zone === "danger" ? "💀 " : "😬 "}{joke}
                  </div>
                )}
                <div style={{ ...S.flex("row", "center"), justifyContent: "space-between" }}>
                  <div style={S.flex("row", "center", 16)}>
                    <div><div style={S.metaLbl}>Needs</div><div style={{ ...S.metaVal, color: elim ? theme.textFaint : theme.red }}>{elim ? "—" : needs}</div></div>
                    <div><div style={S.metaLbl}>Last +</div><div style={{ ...S.metaVal, color: p.lastAdded > 0 ? theme.green : theme.textFaint }}>{p.lastAdded > 0 ? `+${p.lastAdded}` : "—"}</div></div>
                    <div>
                      <div style={S.metaLbl}>Status</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: game.winner === p.name ? theme.gold : elim ? theme.textFaint : pct >= 90 ? theme.red : pct >= 70 ? theme.orange : theme.green }}>
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
                  <tr key={i} style={{ opacity: elim ? .45 : 1, borderBottom: `1px solid ${theme.rowBorder}` }}>
                    <td style={S.td}>{rank || "—"}</td>
                    <td style={{ ...S.td, textAlign: "left", fontWeight: 700, color: col }}>
                      {p.name}{isDealer && <span style={{ marginLeft: 6, fontSize: 11 }}>🂠</span>}
                    </td>
                    <td style={{ ...S.td, fontFamily: "monospace", fontWeight: 700 }}>{p.total}</td>
                    <td style={{ ...S.td, color: elim ? theme.textFaint : theme.red }}>{elim ? "—" : needs}</td>
                    <td style={{ ...S.td, fontWeight: 700, fontSize: 11, color: game.winner === p.name ? theme.gold : elim ? theme.textFaint : pct >= 90 ? theme.red : pct >= 70 ? theme.orange : theme.green }}>
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
          <button style={{ ...S.btn, ...S.btnRed }} onClick={() => askConfirm("Start a new game? Scores reset to 0, but you keep this room, its code, and its players.", newGame)}>
            ↺ New Game
          </button>
          <button style={{ ...S.btn, ...S.btnGhost }} onClick={() => setShowHistory(v => !v)}>📊 History</button>
          <button style={{ ...S.btn, ...S.btnGhost }} onClick={handleNewRoom} disabled={newRoomBusy}>
            {newRoomBusy ? "Creating…" : "🆕 New Room"}
          </button>
          <button style={{ ...S.btn, ...S.btnGhost }} onClick={handleExport}>⬇ Export CSV</button>
          <button style={{ ...S.btn, ...S.btnGhost, gridColumn: "span 2" }} onClick={handleManualRefresh} disabled={manualRefreshing}>
            {manualRefreshing ? "Refreshing…" : "🔄 Refresh Score"}
          </button>
        </div>
      )}

      {!isHost && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={() => setShowHistory(v => !v)}>📊 {showHistory ? "Hide" : "View"} Round History</button>
          <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={handleManualRefresh} disabled={manualRefreshing}>
            {manualRefreshing ? "Refreshing…" : "🔄 Refresh Score"}
          </button>
          <div style={{ textAlign: "center", color: theme.textFaint, fontSize: 13, padding: "4px 0" }}>
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
            {!game.history.length && <div style={{ textAlign: "center", color: theme.textFaint, padding: 20, fontSize: 13 }}>No rounds played yet</div>}
            {game.history.length > 0 && (() => {
              const filtered = historyFilter === "all" ? game.history : game.history.filter(h => h.player === historyFilter);
              if (filtered.length === 0) return <div style={{ textAlign: "center", color: theme.textFaint, padding: 20, fontSize: 13 }}>No rounds yet for {historyFilter}</div>;
              return [...filtered].reverse().map((h, i) => (
                <div key={i} style={{
                  padding: "8px 4px", borderBottom: `1px solid ${theme.rowBorder}`,
                  background: h.won ? theme.goldBg : "transparent",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 50px 50px 76px", fontSize: 12, alignItems: "center", gap: 4 }}>
                    <div style={{ color: theme.textFaint, fontWeight: 600, fontSize: 11 }}>{h.round}</div>
                    <div style={{ color: theme.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.player}{h.dealer && <span style={{ color: theme.textFaint, fontSize: 10 }}> · dealer: {h.dealer}</span>}
                    </div>
                    <div style={{ color: theme.gold, fontWeight: h.won ? 800 : 600 }}>{h.won ? "0" : `+${h.added}`}</div>
                    <div style={{ fontWeight: 700, color: theme.text }}>{h.total}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: h.won ? theme.gold : h.status === "ELIMINATED" ? theme.red : theme.green }}>
                      {h.won ? "🏆 WON" : h.status}
                    </div>
                  </div>
                  {h.won && h.roundWinLine && (
                    <div style={{ fontSize: 11, fontStyle: "italic", color: theme.gold, marginTop: 4, paddingLeft: 36 }}>
                      {h.roundWinLine}
                    </div>
                  )}
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
            <div style={{ fontSize: 24, fontWeight: 700, color: theme.accentLight, marginBottom: 4 }}>Game Over!</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: theme.gold, marginBottom: 10 }}>{game.winner}</div>

            {game.players.length > 1 && (
              <div style={{
                fontSize: 13, fontWeight: 800, letterSpacing: "0.04em", color: theme.bg,
                background: `linear-gradient(135deg,${theme.gold},${theme.orange})`,
                padding: "8px 16px", borderRadius: 30, marginBottom: 14, display: "inline-block",
              }}>
                👑 BEAT ALL {game.players.length - 1} OTHER PLAYER{game.players.length - 1 !== 1 ? "S" : ""} 👑
              </div>
            )}

            <div style={{
              fontSize: 14, color: theme.text, marginBottom: 24, fontStyle: "italic", lineHeight: 1.5,
              padding: "10px 14px", background: theme.goldBg, border: `1px solid ${theme.gold}33`, borderRadius: 10,
            }}>
              {game.winnerLine || "wins with the lowest score! 🎉"}
            </div>
            {isHost && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button style={{ ...S.btn, ...S.btnAccent, width: "100%" }} onClick={newGame}>🎮 Play Again</button>
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
            <div style={{ fontSize: 15, color: theme.text, marginBottom: 22 }}>{confirmDlg.msg}</div>
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
              <div style={{ fontWeight: 700, color: theme.accentLight }}>📋 Copy your game data</div>
              <button style={{ ...S.btn, ...S.btnGhost, padding: "5px 12px", minHeight: 30, fontSize: 13 }} onClick={() => setCsvText(null)}>✕ Close</button>
            </div>
            <textarea readOnly value={csvText} style={{ width: "100%", height: 240, background: theme.inputBg, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, color: theme.textDim, fontSize: 11, padding: 10, fontFamily: "monospace", resize: "none", outline: "none" }} />
          </div>
        </div>
      )}

      {/* UNIFIED PROFILE PANEL */}
      {profileOpen && (
        <div style={S.overlayWrap}>
          <div style={{ ...S.winBox, maxWidth: 460, maxHeight: "90vh", overflowY: "auto", textAlign: "left", padding: 24 }}>
            <div style={{ ...S.flex("row", "center"), justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: theme.accentLight }}>👤 My Account</div>
              <button style={{ ...S.btn, ...S.btnGhost, padding: "5px 12px", minHeight: 30, fontSize: 13 }}
                onClick={() => { setProfileOpen(false); setProfileErr(""); }}>✕ Close</button>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <div style={{ position: "relative" }}>
                <Avatar avatar={session.avatar || "🎮"} size={80} />
                <label style={{
                  position: "absolute", bottom: -4, right: -4, background: theme.accent, borderRadius: "50%",
                  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 13, border: `2px solid ${theme.cardBg}`,
                }}>
                  📷
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => handlePhotoSelect(e.target.files?.[0])} disabled={photoUploading} />
                </label>
              </div>
            </div>
            {photoUploading && <div style={{ textAlign: "center", fontSize: 12, color: theme.textDim, marginBottom: 12 }}>Uploading…</div>}

            <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
              {["profile", "room", ...(isOwnView ? ["players"] : []), "history"].map(tab => (
                <button key={tab} onClick={() => {
                  setProfileTab(tab); setProfileErr("");
                  if (tab === "history") { isOwnView ? loadAdminHistory() : null; loadMyHistory(); }
                }} style={{
                  ...S.btn, flex: 1, padding: "8px 0", minHeight: 36, fontSize: 12,
                  background: profileTab === tab ? "rgba(124,109,250,.25)" : theme.surface,
                  color: profileTab === tab ? theme.accentLight : theme.textDim,
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

                <div style={{ height: 1, background: theme.divider }} />

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

                {profileErr && <div style={{ color: theme.red, fontSize: 13 }}>{profileErr}</div>}

                <div style={{ height: 1, background: theme.divider }} />
                <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={onLogout}>↩ Logout</button>
              </div>
            )}

            {profileTab === "room" && (
              <div>
                <div style={S.sectionLabel}>🏠 Current Room</div>
                <div style={{ textAlign: "center", padding: "24px 16px", background: theme.accentBg, border: `1px solid ${theme.accentBorder}`, borderRadius: 14, marginBottom: 10 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 32, fontWeight: 800, letterSpacing: "0.1em", color: theme.gold }}>
                    {isOwnView ? (roomCode || "…") : "— hosted by " + roomOwner + " —"}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textDim, marginTop: 8 }}>
                    {isOwnView
                      ? "Share this code or show the QR below — friends can scan it to join instantly."
                      : `You're currently in ${roomOwner}'s room as a player.`}
                  </div>
                </div>

                {isOwnView && roomCode && (
                  <div style={{ marginBottom: 14 }}>
                    <QRCodeDisplay
                      value={roomCode}
                      size={200}
                      label="Players can scan this to join your room"
                    />
                  </div>
                )}

                {!isOwnView && (
                  <button style={{ ...S.btn, ...S.btnRed, width: "100%", marginBottom: 18 }} onClick={handleLeaveJoinedRoom}>
                    🚪 Exit This Room
                  </button>
                )}
                {isOwnView && (
                  <button style={{ ...S.btn, ...S.btnGhost, width: "100%", marginBottom: 18 }} onClick={() => { setProfileOpen(false); onBackToChoice?.(); }}>
                    ↩ Back to Room Picker
                  </button>
                )}

                {isOwnView && (
                  <>
                    <div style={{ height: 1, background: theme.divider, margin: "18px 0" }} />

                    <button style={{ ...S.btn, ...S.btnGhost, width: "100%" }} onClick={handleRegenerateCode} disabled={regenBusy}>
                      {regenBusy ? "Generating…" : "🔄 Generate New Code"}
                    </button>
                    <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 8, marginBottom: 18, textAlign: "center" }}>
                      Regenerating immediately invalidates the old code — players who already joined are unaffected.
                    </div>
                  </>
                )}

                <div style={{ height: 1, background: theme.divider, marginBottom: 18 }} />

                <div style={S.sectionLabel}>➕ Join a Different Room</div>
                <div style={{ fontSize: 12, color: theme.textFaint, marginBottom: 10 }}>
                  Enter a friend's room code to join their game as a player.
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input style={{ ...S.input, flex: 1, fontFamily: "monospace", fontWeight: 700 }} value={joinCodeVal}
                    onChange={e => setJoinCodeVal(e.target.value.toUpperCase())} placeholder="Room code" maxLength={10} />
                  <button style={{ ...S.btn, ...S.btnAccent, padding: "8px 14px", minHeight: 44 }} onClick={handleJoinAnotherRoom} disabled={profileBusy}>Join</button>
                </div>
                {profileErr && <div style={{ color: theme.red, fontSize: 13, marginBottom: 8 }}>{profileErr}</div>}

                {isOwnView && (
                  <>
                    <div style={{ height: 1, background: theme.divider, margin: "18px 0" }} />

                    <div style={S.sectionLabel}>Room Status</div>
                    <div style={{
                      padding: "14px 16px", borderRadius: 12, marginBottom: 12,
                      background: roomLocked ? theme.redBg : theme.greenBg,
                      border: `1px solid ${roomLocked ? theme.redBorder : theme.greenBorder}`,
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: roomLocked ? theme.red : theme.green }}>
                        {roomLocked ? "🔒 Room is Closed" : "🔓 Room is Open"}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>
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
                  <div key={v.username} style={{ ...S.flex("row", "center", 10), padding: "10px 12px", background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 10, marginBottom: 8 }}>
                    <Avatar avatar={v.avatar} size={22} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: theme.textFaint }}>@{v.username}{v.room_code && " · also hosts their own room"}</div>
                    </div>
                    <button style={{ ...S.btn, ...S.btnRed, padding: "4px 8px", minHeight: 26, fontSize: 11 }} onClick={() => handleRemoveParticipant(v.username, v.name)}>✕</button>
                  </div>
                ))}
                {participants.length === 0 && (
                  <div style={{ textAlign: "center", color: theme.textFaint, padding: 16, fontSize: 13 }}>
                    Nobody's joined yet. Share your room code from the "🏠 Room" tab.
                  </div>
                )}
              </div>
            )}

            {profileTab === "history" && (
              <div>
                {historyLoading && <div style={{ textAlign: "center", color: theme.textFaint, padding: 20, fontSize: 13 }}>Loading…</div>}

                {!historyLoading && myStats && (
                  <>
                    <div style={S.sectionLabel}>Your Overall Stats</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
                      <div style={S.statBox}>
                        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: theme.accentLight }}>{myStats.played}</div>
                        <div style={{ fontSize: 9, color: theme.textFaint, marginTop: 4, textTransform: "uppercase" }}>Played</div>
                      </div>
                      <div style={S.statBox}>
                        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: theme.gold }}>{myStats.won}</div>
                        <div style={{ fontSize: 9, color: theme.textFaint, marginTop: 4, textTransform: "uppercase" }}>Won</div>
                      </div>
                      <div style={{ ...S.statBox }}>
                        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: theme.red }}>{myStats.lost}</div>
                        <div style={{ fontSize: 9, color: theme.textFaint, marginTop: 4, textTransform: "uppercase" }}>Lost</div>
                      </div>
                      <div style={{ ...S.statBox }}>
                        <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: theme.green }}>{myStats.winRate}%</div>
                        <div style={{ fontSize: 9, color: theme.textFaint, marginTop: 4, textTransform: "uppercase" }}>Win Rate</div>
                      </div>
                    </div>
                  </>
                )}

                {!historyLoading && myHistory && myHistory.length === 0 && (
                  <div style={{ textAlign: "center", color: theme.textFaint, padding: 20, fontSize: 13 }}>
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
                          background: r.won ? "rgba(245,200,66,.08)" : theme.surface,
                          border: `1px solid ${r.won ? "rgba(245,200,66,.25)" : theme.surfaceBorder}`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: r.won ? theme.gold : theme.text }}>
                              {r.won ? "🏆 Won" : r.eliminated ? "❌ Eliminated" : "Game ended"} — room: {r.admin_username}
                            </div>
                            <div style={{ fontSize: 11, color: theme.textFaint }}>{new Date(r.ended_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ fontSize: 12, color: theme.textDim }}>
                            Final score: <b style={{ color: theme.text }}>{r.final_score}</b> · {r.rounds_played} round{r.rounds_played !== 1 ? "s" : ""} played
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {isOwnView && !historyLoading && adminHistory && (
                  <>
                    <div style={{ height: 1, background: theme.divider, marginBottom: 18 }} />
                    <div style={S.sectionLabel}>Games Played in Your Room</div>
                    {adminHistory.length === 0 && (
                      <div style={{ textAlign: "center", color: theme.textFaint, padding: 16, fontSize: 13 }}>No completed games yet.</div>
                    )}
                    <div style={{ maxHeight: 260, overflowY: "auto" }}>
                      {adminHistory.map(r => (
                        <div key={r.id} style={{
                          padding: "10px 12px", marginBottom: 8, borderRadius: 10,
                          background: r.winner ? "rgba(245,200,66,.08)" : theme.surface,
                          border: `1px solid ${r.winner ? "rgba(245,200,66,.25)" : theme.surfaceBorder}`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: r.winner ? theme.gold : theme.text }}>
                              {r.winner ? `🏆 ${r.winner} won` : "Ended without a winner"}
                            </div>
                            <div style={{ fontSize: 11, color: theme.textFaint }}>{new Date(r.ended_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ fontSize: 12, color: theme.textDim }}>
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
