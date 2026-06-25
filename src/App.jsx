import { useState, useEffect } from "react";
import { SUPER_ADMIN_PASSPHRASE } from "./constants.js";

import AboutScreen from "./screens/AboutScreen.jsx";
import HowItWorksScreen from "./screens/HowItWorksScreen.jsx";
import LandingScreen from "./screens/LandingScreen.jsx";
import SignupScreen from "./screens/SignupScreen.jsx";
import LoginScreen from "./screens/LoginScreen.jsx";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen.jsx";
import ChooseRoomScreen from "./screens/ChooseRoomScreen.jsx";
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
  // session: { username, name, avatar, roomCode, joinedHost }
  const [session, setSession] = useState(null);
  // viewMode is only meaningful once a choice has been made on ChooseRoomScreen
  const [viewMode, setViewMode] = useState(null); // null | "own" | "joined"

  useEffect(() => {
    const sp = getSuperParam();
    if (sp && sp === SUPER_ADMIN_PASSPHRASE) setScreen("superadmin");
  }, []);

  const goLanding = () => { setSession(null); setViewMode(null); setScreen("landing"); };
  const updateSession = (patch) => setSession(prev => ({ ...prev, ...patch }));

  if (screen === "superadmin") return <SuperAdminScreen onExit={goLanding} />;

  // Logged in, but hasn't picked host-vs-join yet this session: always ask, every login.
  if (session && !viewMode) {
    return (
      <ChooseRoomScreen
        session={session}
        onChooseOwn={() => setViewMode("own")}
        onChooseJoined={() => setViewMode("joined")}
        onUpdateSession={updateSession}
        onLogout={goLanding}
      />
    );
  }

  if (session && viewMode) {
    return (
      <GameScreen
        session={session}
        viewMode={viewMode}
        onLogout={goLanding}
        onSwitchView={(mode) => setViewMode(mode)}
        onUpdateSession={updateSession}
      />
    );
  }

  if (!aboutSeen && screen === "landing") {
    return <AboutScreen onClose={() => setAboutSeen(true)} />;
  }

  switch (screen) {
    case "about":
      return <AboutScreen onClose={() => setScreen("landing")} showCloseAsContinue={false} />;
    case "howItWorks":
      return <HowItWorksScreen onClose={() => setScreen("landing")} />;
    case "quickJoin":
      return (
        <JoinRoomScreen
          onBack={() => setScreen("landing")}
          onDone={(s) => { setSession(s); setViewMode("joined"); }}
        />
      );
    case "signup":
      return <SignupScreen onBack={() => setScreen("landing")} onDone={(s) => setSession(s)} />;
    case "login":
      return (
        <LoginScreen
          onBack={() => setScreen("landing")}
          onForgot={() => setScreen("forgot")}
          onDone={(s) => setSession(s)}
        />
      );
    case "forgot":
      return <ForgotPasswordScreen onBack={() => setScreen("login")} />;
    default:
      return (
        <LandingScreen
          onLogin={() => setScreen("login")}
          onSignup={() => setScreen("signup")}
          onAbout={() => setScreen("about")}
          onHowItWorks={() => setScreen("howItWorks")}
          onQuickJoin={() => setScreen("quickJoin")}
        />
      );
  }
}
