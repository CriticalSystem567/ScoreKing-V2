import { useEffect, useRef, useState } from "react";

/**
 * Camera-based QR code scanner.
 * Uses html5-qrcode but with proper lifecycle management to avoid
 * the blank-screen issue caused by DOM element conflicts.
 */
export default function QRScanner({ onScan, onClose }) {
  const [status, setStatus] = useState("starting"); // starting | scanning | error
  const [errMsg, setErrMsg] = useState("");
  const scannerRef = useRef(null);
  const mountedRef = useRef(true);    // tracks if component is still mounted
  const scannedRef = useRef(false);   // prevents onScan firing more than once
  const containerId = "sk-qr-container";

  useEffect(() => {
    mountedRef.current = true;
    scannedRef.current = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (!mountedRef.current) return;

      const qr = new Html5Qrcode(containerId);
      scannerRef.current = qr;

      qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          // Guard against firing multiple times for the same scan
          if (scannedRef.current) return;
          scannedRef.current = true;

          const clean = decodedText.trim().toUpperCase();
          const match = clean.match(/[A-Z0-9]{6}/);
          const code = match ? match[0] : clean;

          // Stop the scanner, then call onScan — component stays mounted
          // until parent decides to remove it (after onScan fires)
          qr.stop().catch(() => {}).finally(() => {
            if (mountedRef.current) onScan(code);
          });
        },
        () => {} // per-frame error, ignore
      ).then(() => {
        if (mountedRef.current) setStatus("scanning");
      }).catch((e) => {
        console.error("QR start error:", e);
        if (mountedRef.current) {
          setStatus("error");
          setErrMsg("Camera not available. Use the room code instead.");
        }
      });
    }).catch(() => {
      if (mountedRef.current) {
        setStatus("error");
        setErrMsg("QR scanner failed to load. Use the room code instead.");
      }
    });

    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleCancel = () => {
    if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.95)", zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{ color: "#f0f0ff", fontSize: 17, fontWeight: 700, marginBottom: 20 }}>
        📷 Scan Room QR Code
      </div>

      {status === "starting" && (
        <div style={{ color: "#9999bb", fontSize: 13, marginBottom: 16 }}>Starting camera…</div>
      )}

      {status === "error" ? (
        <div style={{ color: "#ff5c5c", fontSize: 14, textAlign: "center", maxWidth: 280, lineHeight: 1.6, marginBottom: 20 }}>
          {errMsg}
        </div>
      ) : (
        /* Always render the container div so html5-qrcode can find it */
        <div style={{ position: "relative", width: 260, height: 260 }}>
          <div
            id={containerId}
            style={{
              width: 260, height: 260, borderRadius: 16,
              overflow: "hidden", background: "#111",
              opacity: status === "scanning" ? 1 : 0,
              transition: "opacity 0.3s",
            }}
          />
          {status === "starting" && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center",
              justifyContent: "center", color: "#6b6b8a", fontSize: 13,
            }}>
              Loading…
            </div>
          )}
        </div>
      )}

      {status === "scanning" && (
        <div style={{ fontSize: 12, color: "#6b6b8a", marginTop: 14, textAlign: "center" }}>
          Point your camera at the host's QR code
        </div>
      )}

      <button onClick={handleCancel} style={{
        marginTop: 24, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
        color: "#f0f0ff", borderRadius: 10, padding: "12px 32px", fontSize: 14, cursor: "pointer",
        fontFamily: "inherit", fontWeight: 600,
      }}>
        Cancel
      </button>
    </div>
  );
}
