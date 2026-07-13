import { useTheme } from "../ThemeContext.jsx";

/**
 * Polished pill/switch toggle — used anywhere we'd otherwise drop in a bare
 * <input type="checkbox">. Fully theme-aware (works in both light & dark).
 *
 * Usage:
 *   <Toggle
 *     checked={rememberMe}
 *     onChange={setRememberMe}
 *     icon="🔒"
 *     label="Remember my login on this device"
 *   />
 */
export default function Toggle({ checked, onChange, icon, label, description }) {
  const { theme: t } = useTheme();

  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        background: checked ? t.accentBg : t.surfaceStrong,
        border: `1px solid ${checked ? t.accentBorder : t.surfaceBorder}`,
        cursor: "pointer",
        userSelect: "none",
        transition: "background .18s, border-color .18s",
      }}
    >
      {icon && (
        <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0, opacity: checked ? 1 : 0.6, transition: "opacity .18s" }}>
          {icon}
        </span>
      )}

      <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: checked ? t.text : t.textDim, lineHeight: 1.35, transition: "color .18s" }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 11, color: t.textFaint, marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>

      {/* Switch track */}
      <span
        style={{
          flexShrink: 0,
          width: 38,
          height: 22,
          borderRadius: 999,
          position: "relative",
          background: checked ? `linear-gradient(135deg,${t.accent},${t.accentLight})` : t.divider,
          border: `1px solid ${checked ? "transparent" : t.surfaceBorder}`,
          transition: "background .2s ease",
        }}
      >
        {/* Switch knob */}
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,.35)",
            transition: "left .2s ease",
          }}
        />
      </span>
    </div>
  );
}
