import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext.jsx";

/**
 * Inline "Install ScoreKing" control — NOT a popup/overlay. Rendered by
 * LoginScreen, inside the login card, underneath every other option
 * (Log In / Forgot password / Back). Only ever shows there, to players
 * using the web username+password login — never on the landing screen.
 *
 * A small pill chip is always visible (unless already installed); tapping
 * it expands an iOS-style frosted-glass panel. What that panel offers
 * depends on what the browser actually supports at the moment:
 *  - if we're holding a captured `beforeinstallprompt` event -> real
 *    one-tap Install button
 *  - iOS Safari (which never fires that event) -> manual instructions
 *  - anything else -> a generic "check your browser menu" fallback
 */
export default function InstallPrompt({ installEvent, onInstallHandled }) {
  const { theme } = useTheme();
  const [standalone, setStandalone] = useState(false);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;
    setStandalone(isStandalone);

    const onInstalled = () => setStandalone(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
  }, [open]);

  if (standalone) return null;

  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  const handleInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    try {
      await installEvent.userChoice;
    } catch { /* ignore */ }
    setOpen(false);
    onInstallHandled?.();
  };

  return (
    <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${theme.surfaceBorder}`, textAlign: "center" }}>
      <style>{`
        .sk-install-chip { transition: transform .15s ease, background .15s ease; }
        .sk-install-chip:hover { background: ${theme.surfaceStrong}; }
        .sk-install-chip:active { transform: scale(.96); }
        .sk-install-primary { transition: transform .12s ease, filter .12s ease; }
        .sk-install-primary:hover { filter: brightness(1.08); }
        .sk-install-primary:active { transform: scale(.96); }
        .sk-install-secondary { transition: background .15s ease, transform .12s ease; }
        .sk-install-secondary:hover { background: ${theme.surfaceStrong}; }
        .sk-install-secondary:active { transform: scale(.96); }
      `}</style>

      <button
        className="sk-install-chip"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: theme.surface, border: `1px solid ${theme.surfaceBorder}`,
          borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 600,
          color: theme.text, cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>📲</span> Install App
      </button>

      {open && (
        <div
          style={{
            marginTop: 14,
            textAlign: "left",
            background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02))",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: 20,
            padding: "20px 18px",
            boxShadow: "0 10px 34px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.07)",
            opacity: shown ? 1 : 0,
            transform: shown ? "translateY(0)" : "translateY(-6px)",
            transition: "opacity .22s ease, transform .22s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(145deg, ${theme.accentLight}, ${theme.accent})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 21, boxShadow: `0 4px 16px ${theme.accentBg}`,
              }}
            >
              📲
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: theme.text }}>Install ScoreKing</div>
              <div style={{ fontSize: 12, color: theme.textDim, marginTop: 2 }}>
                Fullscreen, app-like, one tap away
              </div>
            </div>
          </div>

          {installEvent ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="sk-install-secondary"
                onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 14,
                  border: `1px solid ${theme.surfaceBorder}`, background: "transparent",
                  color: theme.textDim, fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                Not now
              </button>
              <button
                className="sk-install-primary"
                onClick={handleInstall}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 14, border: "none",
                  background: `linear-gradient(135deg, ${theme.accentLight}, ${theme.accent})`,
                  color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  boxShadow: `0 4px 16px ${theme.accentBg}`,
                }}
              >
                Install
              </button>
            </div>
          ) : isIOS ? (
            <div style={{ fontSize: 12.5, color: theme.textDim, lineHeight: 1.6 }}>
              Tap the <strong style={{ color: theme.text }}>Share</strong> icon in Safari's toolbar,
              then choose <strong style={{ color: theme.text }}>"Add to Home Screen."</strong>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: theme.textDim, lineHeight: 1.6 }}>
              Look for <strong style={{ color: theme.text }}>"Install app"</strong> or{" "}
              <strong style={{ color: theme.text }}>"Add to Home screen"</strong> in your browser's
              menu — usually under the ⋮ or ⋯ icon next to the address bar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
