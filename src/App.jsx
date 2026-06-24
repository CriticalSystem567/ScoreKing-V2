import { useState, useEffect } from "react";
import { SUPER_ADMIN_PASSPHRASE } from "./constants.js";

import AboutScreen from "./screens/AboutScreen.jsx";
import LandingScreen from "./screens/LandingScreen.jsx";
import SignupScreen from "./screens/SignupScreen.jsx";
import LoginScreen from "./screens/LoginScreen.jsx";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen.jsx";
import JoinRoomScreen from "./screens/JoinRoomScreen.jsx";
import SuperAdminScreen from "./screens/SuperAdminScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";

function getSuperParam() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("super");
  } catch { return null; }
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [aboutSeen, setAboutSeen] = useState(false);
  // session: { username, name, avatar, roomCode } — the same shape regardless
  // of whether this person is about to view their own room or someone else's.
  const [session, setSession] = useState(null);
  // viewMode: "own" (their own room, as host) or "joined" (someone else's room, as a player)
  const [viewMode, setViewMode] = useState("own");

  useEffect(() => {
    const sp = getSuperParam();
    if (sp && sp === SUPER_ADMIN_PASSPHRASE) setScreen("superadmin");
  }, []);

  const goLanding = () => { setSession(null); setScreen("landing"); };

  if (screen === "superadmin") return <SuperAdminScreen onExit={goLanding} />;

  if (session) {
    return (
      <GameScreen
        session={session}
        viewMode={viewMode}
        onLogout={goLanding}
        onSwitchView={(mode) => setViewMode(mode)}
        onUpdateSession={(patch) => setSession(prev => ({ ...prev, ...patch }))}
      />
    );
  }

  if (!aboutSeen && screen === "landing") {
    return <AboutScreen onClose={() => setAboutSeen(true)} />;
  }

  switch (screen) {
    case "about":
      return <AboutScreen onClose={() => setScreen("landing")} showCloseAsContinue={false} />;
    case "signup":
      return <SignupScreen onBack={() => setScreen("landing")} onDone={(s) => { setSession(s); setViewMode("own"); }} />;
    case "login":
      return (
        <LoginScreen
          onBack={() => setScreen("landing")}
          onForgot={() => setScreen("forgot")}
          onDone={(s, mode) => { setSession(s); setViewMode(mode); }}
        />
      );
    case "forgot":
      return <ForgotPasswordScreen onBack={() => setScreen("login")} />;
    case "joinRoom":
      return (
        <JoinRoomScreen
          onBack={() => setScreen("landing")}
          onDone={(s) => { setSession(s); setViewMode("joined"); }}
        />
      );
    default:
      return (
        <LandingScreen
          onLogin={() => setScreen("login")}
          onSignup={() => setScreen("signup")}
          onJoinRoom={() => setScreen("joinRoom")}
          onAbout={() => setScreen("about")}
        />
      );
  }
}
