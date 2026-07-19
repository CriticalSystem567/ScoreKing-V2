import { useEffect, useRef, useState } from "react";

/* The single memorable motion effect: score numbers roll up/down like an
   odometer whenever `value` changes, with a brief gold-glow flash the
   instant they land. Tweens with requestAnimationFrame (no deps) so it
   stays lightweight and works anywhere a plain number was rendered. */
export default function RollingNumber({ value, style, duration = 700, flashColor }) {
  const numeric = Number(value) || 0;
  const [display, setDisplay] = useState(numeric);
  const [landed, setLanded] = useState(false);
  const fromRef = useRef(numeric);
  const rafRef = useRef(null);
  const firstRef = useRef(true);

  useEffect(() => {
    // Don't animate the very first paint — only real changes should roll.
    if (firstRef.current) {
      firstRef.current = false;
      fromRef.current = numeric;
      setDisplay(numeric);
      return;
    }
    const from = fromRef.current;
    const to = numeric;
    if (from === to) return;

    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setDisplay(to);
        setLanded(true);
        setTimeout(() => setLanded(false), 260);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [numeric, duration]);

  return (
    <span
      style={{
        display: "inline-block",
        fontVariantNumeric: "tabular-nums",
        transition: "transform .22s cubic-bezier(.3,1.6,.4,1), text-shadow .3s ease",
        transform: landed ? "scale(1.12)" : "scale(1)",
        textShadow: landed ? `0 0 16px ${flashColor || "currentColor"}` : "0 0 0 transparent",
        ...style,
      }}
    >
      {display}
    </span>
  );
}
