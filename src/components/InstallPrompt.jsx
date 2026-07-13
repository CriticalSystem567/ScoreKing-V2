import { useState } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { getStyles } from "../styles.jsx";

const DISMISS_KEY = "sk_install_prompt_dismissed";

/**
 * Inline "Install ScoreKing" card — NOT a popup/overlay. It's meant to be
 * rendered by LoginScreen, inside the login card, underneath every other
 * option (Log In / Forgot password / Back). It only ever shows there, to
 * players using the web username+password login — never on the landing
 * screen and never as an overlay on top of other screens.
 *
 * The actual `beforeinstallprompt` browser event is captured once, at the
 * App level (see App.jsx), since it only fires a single time on page load.
 * This component just receives that captured event as a prop and renders
 * the UI for it when appropriate.
 *
 * "Remember my choice — don't ask again" here only affects whether this
 * install card keeps showing on future visits. It's unrelated to, and
 * separate from, the "remember my login" checkbox on the login form.
 */
export default function InstallPrompt({ installEvent, onInstallHandled }) {
  const { theme } = useTheme();
  const S = getStyles(theme);
  const [remember, setRemember] = useState(true);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1"
  );

  if (dismissed || !installEvent) return null;

  const closeAndMaybeRemember = () => {
    if (remember) localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    onInstallHandled?.();
  };

  const handleInstall = async () => {
    installEvent.prompt();
    try {
      await installEvent.userChoice;
    } catch { /* ignore */ }
    // Whatever the user picked in Chrome's own dialog, we don't need to
    // ask again ourselves.
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    onInstallHandled?.();
  };

  const handleNotNow = () => closeAndMaybeRemember();

  return (
    <div
      style={{
        marginTop: 20,
        paddingTop: 20,
        borderTop: `1px solid ${theme.surfaceBorder}`,
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 10, textAlign: "center" }}>📲</div>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, textAlign: "center", color: theme.text }}>
        Install ScoreKing
      </div>
      <div style={{ fontSize: 12, color: theme.textDim, textAlign: "center", lineHeight: 1.5, marginBottom: 14 }}>
        Add it to your home screen for a fullscreen, app-like experience — no browser bar, faster to open.
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: theme.textFaint, marginBottom: 14, cursor: "pointer" }}>
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
  );
}
