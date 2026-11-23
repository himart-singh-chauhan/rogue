// Admin, on Live Events: check members in at the door by scanning the QR code on their pass with the camera,
// or by typing the code. The server checks the pass and blocks a second scan of the same pass.
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, ScanLine, RotateCcw } from "lucide-react";
import { apiCall } from "../../utils/api";

const RESULT = {
  ok: { bg: "rgba(34,197,94,0.12)", border: "#22c55e", title: "✅ Pass valid: let them in" },
  duplicate: { bg: "rgba(245,158,11,0.12)", border: "#F59E0B", title: "⚠️ Already scanned: this pass was used before" },
  bad: { bg: "rgba(239,68,68,0.12)", border: "#ef4444", title: "❌ Not valid" },
};

export default function AdminTicketScanner({ token }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const lastCode = useRef({ code: "", at: 0 });
  const [camera, setCamera] = useState(false);
  const [camError, setCamError] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera(false);
  };
  useEffect(() => () => stopCamera(), []);

  const check = async (raw) => {
    const value = String(raw || "").trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      const r = await apiCall("/tickets/scan", "POST", { accessCode: value }, token);
      const t = r.ticket || r;
      setResult({ kind: "ok", name: t.user?.name, event: t.event?.title, type: t.ticketType, code: value });
      setLog((l) => [{ at: new Date(), code: value, name: t.user?.name || "Member", outcome: "Admitted" }, ...l].slice(0, 10));
    } catch (e) {
      const dup = /duplicate|already used/i.test(e.message || "");
      setResult({ kind: dup ? "duplicate" : "bad", message: e.message, code: value });
      setLog((l) => [{ at: new Date(), code: value, name: "—", outcome: dup ? "Already used" : "Refused" }, ...l].slice(0, 10));
    } finally { setBusy(false); setCode(""); }
  };

  const scanFrame = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !streamRef.current) return;
    if (v.readyState === v.HAVE_ENOUGH_DATA) {
      c.width = v.videoWidth; c.height = v.videoHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(v, 0, 0, c.width, c.height);
      const img = ctx.getImageData(0, 0, c.width, c.height);
      const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
      // the same code is checked once every few seconds, not on every frame
      if (qr?.data && (qr.data !== lastCode.current.code || Date.now() - lastCode.current.at > 4000)) {
        lastCode.current = { code: qr.data, at: Date.now() };
        check(qr.data);
      }
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      setCamera(true);
      requestAnimationFrame(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
        rafRef.current = requestAnimationFrame(scanFrame);
      });
    } catch (e) {
      setCamError(e?.name === "NotAllowedError" ? "Camera permission was refused. Allow the camera for this site, or type the code below." : "No camera is available on this device. Type the code from the pass below.");
    }
  };

  const R = result ? RESULT[result.kind] : null;
  return (
    <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 24, color: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 950, textTransform: "uppercase" }}>Event check-in: scan passes</div>
        {camera
          ? <button type="button" onClick={stopCamera} style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 100, padding: "10px 18px", fontWeight: 900, fontSize: 12, cursor: "pointer", display: "inline-flex", gap: 8, alignItems: "center" }}><CameraOff size={14} /> Stop camera</button>
          : <button type="button" onClick={startCamera} style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: 100, padding: "10px 18px", fontWeight: 900, fontSize: 12, cursor: "pointer", display: "inline-flex", gap: 8, alignItems: "center" }}><Camera size={14} /> Scan with camera</button>}
      </div>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>
        Members find their pass with its QR code in Profile → My Event Passes, or on the event page. Point the camera at the QR code; each pass can be checked in once.
      </p>
      {camError && <div role="alert" style={{ color: "#f87171", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{camError}</div>}
      {camera && (
        <div style={{ position: "relative", maxWidth: 420, borderRadius: 16, overflow: "hidden", border: "2px solid #FF6A00", marginBottom: 16, background: "#000" }}>
          <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block" }} />
          <ScanLine size={64} color="rgba(255,106,0,0.7)" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }} />
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <form onSubmit={(e) => { e.preventDefault(); check(code); }} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Or type the code on the pass (TKT-…)" style={{ flex: "1 1 260px", background: "#000", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 100, padding: "12px 18px", color: "white", fontFamily: "monospace" }} />
        <button type="submit" disabled={busy || !code.trim()} style={{ background: "white", color: "#111", border: "none", borderRadius: 100, padding: "12px 20px", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>{busy ? "Checking…" : "Check pass"}</button>
      </form>
      {R && (
        <div role="status" style={{ background: R.bg, border: `1px solid ${R.border}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>{R.title}</div>
          {result.kind === "ok"
            ? <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6 }}>{result.name || "Member"} · {result.event || "Live event"} · {(result.type || "spectator").toUpperCase()} pass</div>
            : <div style={{ marginTop: 6, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{result.message}</div>}
          <div style={{ marginTop: 4, fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{result.code}</div>
        </div>
      )}
      {log.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em" }}>THIS SESSION</div>
            <button type="button" onClick={() => { setLog([]); setResult(null); }} style={{ background: "none", border: "none", color: "#888", fontSize: 11, cursor: "pointer", display: "inline-flex", gap: 4, alignItems: "center" }}><RotateCcw size={12} /> Clear</button>
          </div>
          {log.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" }}>
              <span style={{ color: "#888" }}>{l.at.toLocaleTimeString()}</span>
              <span style={{ fontWeight: 800 }}>{l.name}</span>
              <span style={{ fontFamily: "monospace", color: "#777" }}>{l.code}</span>
              <span style={{ marginLeft: "auto", fontWeight: 900, color: l.outcome === "Admitted" ? "#22c55e" : l.outcome === "Already used" ? "#F59E0B" : "#ef4444" }}>{l.outcome}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
