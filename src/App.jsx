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
import InstallPrompt from "./components/InstallPrompt.jsx";

function getSuperParam() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("super");
  } catch { return null; }
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [aboutSeen, setAboutSeen] = useState(false);
  // session: { username, name, avatar }
  const [session, setSession] = useState(null);
  // viewMode: whose room is currently active — "own" (I host it) or "joined" (someone else's)
  const [viewMode, setViewMode] = useState(null);
  // activeRoomId: the specific room (by id) currently being viewed. Required
  // because an admin can own MULTIPLE rooms now — viewMode alone isn't enough
  // to know which one.
  const [activeRoomId, setActiveRoomId] = useState(null);

  useEffect(() => {
    const sp = getSuperParam();
    if (sp && sp === SUPER_ADMIN_PASSPHRASE) setScreen("superadmin");
  }, []);

  const goLanding = () => { setSession(null); setViewMode(null); setActiveRoomId(null); setScreen("landing"); };
  const updateSession = (patch) => setSession(prev => ({ ...prev, ...patch }));

  const enterOwnRoom = (roomId) => { setActiveRoomId(roomId); setViewMode("own"); };
  const enterJoinedRoom = (roomId) => { setActiveRoomId(roomId); setViewMode("joined"); };

  // Backing out of an active room (e.g. "New Room" or "Exit Room") returns to
  // the choice screen rather than logging all the way out.
  const backToChoice = () => { setActiveRoomId(null); setViewMode(null); };

  const renderScreen = () => {
  if (screen === "superadmin") return <SuperAdminScreen onExit={goLanding} />;

  // Logged in, but no room actively open yet: always show the choice screen.
  if (session && !activeRoomId) {
    return (
      <ChooseRoomScreen
        session={session}
        onEnterOwnRoom={enterOwnRoom}
        onEnterJoinedRoom={enterJoinedRoom}
        onUpdateSession={updateSession}
        onLogout={goLanding}
      />
    );
  }

  if (session && activeRoomId) {
    return (
      <GameScreen
        session={session}
        viewMode={viewMode}
        roomId={activeRoomId}
        onLogout={goLanding}
        onBackToChoice={backToChoice}
        onEnterOwnRoom={enterOwnRoom}
        onEnterJoinedRoom={enterJoinedRoom}
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
          onDone={(s, roomId) => { setSession(s); enterJoinedRoom(roomId); }}
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
  };

  return (
    <>
      {renderScreen()}
      <InstallPrompt />
    </>
  );
}
