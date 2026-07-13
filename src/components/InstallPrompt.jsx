import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { getStyles } from "../styles.jsx";

const DISMISS_KEY = "sk_install_prompt_dismissed";

/**
 * Chrome fires its own "Add ScoreKing to Home screen" mini-infobar
 * automatically whenever the PWA install criteria are met — that's the
 * native browser popup users were seeing pop up on top of the app.
 *
 * Here we capture that event ourselves (preventDefault stops Chrome's
 * native UI from appearing at all) and show our own themed card instead,
 * with a "Don't ask again" option that's remembered in localStorage so
 * it won't keep coming back once the user has made a choice.
 */
export default function InstallPrompt() {
  const { theme } = useTheme();
  const S = getStyles(theme);
  const [deferredEvent, setDeferredEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    // Already installed / running standalone — nothing to prompt.
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredEvent(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const closeAndMaybeRemember = () => {
    if (remember) localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredEvent) return;
    deferredEvent.prompt();
    try {
      await deferredEvent.userChoice;
    } catch { /* ignore */ }
    // Whatever the user picked in Chrome's own dialog, we don't need to
    // ask again ourselves.
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const handleNotNow = () => closeAndMaybeRemember();

  if (!visible) return null;

  return (
    <div style={{ ...S.overlayWrapTop, zIndex: 10000 }}>
      <div style={{ ...S.winBox, textAlign: "left" }}>
        <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>📲</div>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6, textAlign: "center", color: theme.text }}>
          Install ScoreKing
        </div>
        <div style={{ fontSize: 13, color: theme.textDim, textAlign: "center", lineHeight: 1.5, marginBottom: 18 }}>
          Add it to your home screen for a fullscreen, app-like experience — no browser bar, faster to open.
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: theme.textFaint, marginBottom: 18, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          Remember my choice — don't ask again
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.btn, ...S.btnGhost, flex: 1 }} onClick={handleNotNow}>
            Not now
          </button>
          <button style={{ ...S.btn, ...S.btnAccent, flex: 1 }} onClick={handleInstall}>
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
