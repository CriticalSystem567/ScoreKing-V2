import { useState, useEffect } from "react";
import { SUPER_ADMIN_PASSPHRASE } from "./constants.js";

import LandingScreen from "./screens/LandingScreen.jsx";
import AdminSignupScreen from "./screens/AdminSignupScreen.jsx";
import AdminLoginScreen from "./screens/AdminLoginScreen.jsx";
import AdminForgotScreen from "./screens/AdminForgotScreen.jsx";
import ViewerJoinScreen from "./screens/ViewerJoinScreen.jsx";
import ViewerLoginScreen from "./screens/ViewerLoginScreen.jsx";
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
  // session: { role: "admin"|"viewer", username, name?, avatar?, adminUsername? (for viewers) }
  const [session, setSession] = useState(null);

  useEffect(() => {
    const sp = getSuperParam();
    if (sp && sp === SUPER_ADMIN_PASSPHRASE) {
      setScreen("superadmin");
    }
  }, []);

  const goLanding = () => { setSession(null); setScreen("landing"); };

  if (screen === "superadmin") return <SuperAdminScreen onExit={goLanding} />;

  if (session?.role === "admin" || session?.role === "viewer") {
    return <GameScreen session={session} onLogout={goLanding} />;
  }

  switch (screen) {
    case "adminSignup":
      return <AdminSignupScreen onBack={() => setScreen("landing")} onDone={(s) => setSession(s)} />;
    case "adminLogin":
      return <AdminLoginScreen onBack={() => setScreen("landing")} onForgot={() => setScreen("adminForgot")} onDone={(s) => setSession(s)} />;
    case "adminForgot":
      return <AdminForgotScreen onBack={() => setScreen("adminLogin")} />;
    case "viewerJoin":
      return <ViewerJoinScreen onBack={() => setScreen("landing")} />;
    case "viewerLogin":
      return <ViewerLoginScreen onBack={() => setScreen("landing")} onDone={(s) => setSession(s)} />;
    default:
      return (
        <LandingScreen
          onAdminLogin={() => setScreen("adminLogin")}
          onAdminSignup={() => setScreen("adminSignup")}
          onViewerJoin={() => setScreen("viewerJoin")}
          onViewerLogin={() => setScreen("viewerLogin")}
        />
      );
  }
}
