import { useEffect, useRef, useState } from "react";

/**
 * QR Scanner using native browser camera API + jsQR for decoding.
 * Avoids html5-qrcode's DOM management issues entirely.
 * jsQR is loaded from CDN via a script tag.
 */

function loadJsQR() {
  return new Promise((resolve, reject) => {
    if (window.jsQR) { resolve(window.jsQR); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
    script.onload = () => resolve(window.jsQR);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState("starting"); // starting | scanning | error
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    let jsQR = null;

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };

    const tick = () => {
      if (!mountedRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (result) {
        const clean = result.data.trim().toUpperCase();
        const match = clean.match(/[A-Z0-9]{6}/);
        const code = match ? match[0] : clean;
        stop();
        if (mountedRef.current) onScan(code);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const start = async () => {
      try {
        jsQR = await loadJsQR();
        if (!mountedRef.current) return;

        // Try to find the main (1x) back camera by label, avoiding the
        // ultra-wide (0.5x) lens that browsers sometimes default to.
        let preferredDeviceId = null;
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const backCams = devices.filter(
            (d) => d.kind === "videoinput" && /back|rear|environment/i.test(d.label)
          );
          const nonUltraWide = backCams.find(
            (d) => !/ultra\s*-?\s*wide|0\.5x|wide angle/i.test(d.label)
          );
          if (nonUltraWide) preferredDeviceId = nonUltraWide.deviceId;
        } catch (enumErr) {
          // enumerateDevices can fail/return empty labels before permission
          // is granted on some browsers — just fall back to facingMode.
        }

        const baseVideoConstraints = preferredDeviceId
          ? { deviceId: { exact: preferredDeviceId } }
          : { facingMode: { ideal: "environment" } };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { ...baseVideoConstraints, zoom: { ideal: 1 } },
          });
        } catch (constraintErr) {
          // "zoom" as a getUserMedia constraint isn't supported everywhere;
          // retry without it.
          stream = await navigator.mediaDevices.getUserMedia({
            video: baseVideoConstraints,
          });
        }

        if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        // Explicitly force 1x zoom via track constraints where supported
        // (Android Chrome mainly; iOS Safari largely ignores this).
        try {
          const [track] = stream.getVideoTracks();
          const caps = track.getCapabilities ? track.getCapabilities() : null;
          if (caps && caps.zoom) {
            const targetZoom = Math.min(Math.max(1, caps.zoom.min), caps.zoom.max);
            await track.applyConstraints({ advanced: [{ zoom: targetZoom }] });
          }
        } catch (zoomErr) {
          console.warn("Could not force 1x zoom:", zoomErr);
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        if (mountedRef.current) setStatus("scanning");
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        console.error("QR camera error:", e);
        if (mountedRef.current) {
          setStatus("error");
          setErrMsg(
            e.name === "NotAllowedError"
              ? "Camera permission denied. Allow camera access and try again."
              : "Camera not available on this device. Use the room code instead."
          );
        }
      }
    };

    start();

    return () => {
      mountedRef.current = false;
      stop();
    };
  }, []);

  const handleCancel = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.96)", zIndex: 9999,
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
        <div style={{ position: "relative", width: 260, height: 260, borderRadius: 16, overflow: "hidden", background: "#000" }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {/* scanning crosshair overlay */}
          {status === "scanning" && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 180, height: 180, border: "2px solid rgba(201,168,76,.8)", borderRadius: 12,
                boxShadow: "0 0 0 2000px rgba(0,0,0,.35)",
              }} />
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas used only for pixel extraction — never displayed */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {status === "scanning" && (
        <div style={{ fontSize: 12, color: "#9999bb", marginTop: 14, textAlign: "center" }}>
          Point your camera at the host's QR code
        </div>
      )}

      <button onClick={handleCancel} style={{
        marginTop: 24, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.2)",
        color: "#f0f0ff", borderRadius: 10, padding: "12px 32px", fontSize: 14, cursor: "pointer",
        fontFamily: "inherit", fontWeight: 600,
      }}>
        Cancel
      </button>
    </div>
  );
}
