import { useEffect, useRef, useState } from "react";

const SCANNER_ID = "scoreking-qr-scanner";

/**
 * Camera-based QR code scanner.
 * Calls onScan(text) when a QR code is successfully read.
 * Calls onClose() when the user dismisses it.
 */
export default function QRScanner({ onScan, onClose }) {
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const scannerRef = useRef(null);

  useEffect(() => {
    let scanner = null;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: "environment" }, // rear camera
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          // Try to extract a 6-char alphanumeric room code from whatever was scanned.
          // The QR encodes just the room code directly (uppercase), but handle
          // lowercase and longer strings defensively.
          const clean = decodedText.trim().toUpperCase();
          const match = clean.match(/[A-Z0-9]{6}/);
          const code = match ? match[0] : clean;

          // Stop first, then notify parent — avoids setState-after-unmount issues
          scanner.stop()
            .catch(() => {})
            .finally(() => { onScan(code); });
        },
        () => {} // ignore per-frame decode errors (normal during scanning)
      ).then(() => {
        setLoading(false);
      }).catch((e) => {
        console.error(e);
        setErr("Camera access denied or not available. Enter the room code manually.");
        setLoading(false);
      });
    }).catch(() => {
      setErr("QR scanner not available. Enter the room code manually.");
      setLoading(false);
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{ color: "#f0f0ff", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        📷 Scan Room QR Code
      </div>

      {loading && !err && (
        <div style={{ color: "#9999bb", fontSize: 13, marginBottom: 16 }}>Starting camera…</div>
      )}

      {err ? (
        <div style={{ color: "#ff5c5c", fontSize: 13, textAlign: "center", marginBottom: 16, maxWidth: 280 }}>{err}</div>
      ) : (
        <div id={SCANNER_ID} style={{ width: 280, height: 280, borderRadius: 16, overflow: "hidden", background: "#000" }} />
      )}

      <div style={{ fontSize: 12, color: "#6b6b8a", marginTop: 12, textAlign: "center" }}>
        Point your camera at the host's QR code
      </div>

      <button onClick={() => {
        if (scannerRef.current) scannerRef.current.stop().catch(() => {});
        onClose();
      }} style={{
        marginTop: 20, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
        color: "#f0f0ff", borderRadius: 10, padding: "12px 28px", fontSize: 14, cursor: "pointer",
        fontFamily: "inherit", fontWeight: 600,
      }}>
        Cancel
      </button>
    </div>
  );
}
