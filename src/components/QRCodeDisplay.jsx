import { useEffect, useRef, useState } from "react";

/**
 * Displays a QR code for the given value.
 * Uses the `qrcode` npm package to generate a canvas-based QR code.
 * Falls back gracefully if the library isn't available.
 */
export default function QRCodeDisplay({ value, size = 180, label = null }) {
  const canvasRef = useRef(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    import("qrcode").then(QRCode => {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: "#1a1a2e", light: "#f7f3ed" },
      }, (error) => {
        if (error) { console.error(error); setErr(true); }
      });
    }).catch(() => setErr(true));
  }, [value, size]);

  if (err) {
    return (
      <div style={{ textAlign: "center", fontSize: 13, color: "#9999bb", padding: 20 }}>
        QR code unavailable — use the room code above instead.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <canvas ref={canvasRef} style={{ borderRadius: 12, display: "block" }} />
      {label && <div style={{ fontSize: 11, color: "#9999bb", textAlign: "center" }}>{label}</div>}
    </div>
  );
}
