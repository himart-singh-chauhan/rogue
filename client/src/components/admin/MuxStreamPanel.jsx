// Admin: the event's Mux live stream. Create it once, then put the server URL and stream key
// into OBS (or any streaming app) and press "Start streaming". The page goes live by itself.
import { useEffect, useState } from "react";
import { apiCall } from "../../utils/api";

const label = { display: "block", fontSize: "10px", fontWeight: 900, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" };
const field = { flex: 1, minWidth: 0, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 12px", color: "white", fontSize: "13px", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const btn = (bg = "#FF6A00") => ({ background: bg, color: "white", border: "none", borderRadius: "100px", padding: "10px 20px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", cursor: "pointer" });
const STATUS = {
  active: ["🔴 LIVE NOW", "#EF4444"],
  connected: ["Connected, starting…", "#F59E0B"],
  recording: ["Connected, starting…", "#F59E0B"],
  disconnected: ["Signal lost, waiting to reconnect", "#F59E0B"],
  idle: ["Ready, waiting for your stream", "rgba(255,255,255,0.7)"],
};

export default function MuxStreamPanel({ eventId, token }) {
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState("");

  const call = async (method, path = "") => {
    setBusy(true);
    setError("");
    try {
      setInfo(await apiCall(`/events/${eventId}/mux${path}`, method, method === "GET" ? null : {}, token));
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  // Load now, then refresh the status every 15 s (so "LIVE NOW" appears when the broadcast starts)
  useEffect(() => {
    const load = () => apiCall(`/events/${eventId}/mux`, "GET", null, token).then(setInfo).catch((e) => setError(e.message || "Could not load the live stream"));
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [eventId, token]);

  const copy = (text, what) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(what); setTimeout(() => setCopied(""), 1500); }).catch(() => {});
  };

  const wrap = { marginTop: "20px", padding: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" };
  const title = <div style={{ fontSize: "13px", fontWeight: 950, letterSpacing: "0.05em", marginBottom: "6px" }}>📡 MUX LIVE STREAM</div>;

  if (!info) return <div style={wrap}>{title}<div style={{ fontSize: 13, opacity: 0.6 }}>{error || "Loading…"}</div></div>;
  if (!info.enabled) return <div style={wrap}>{title}<div style={{ fontSize: 13, opacity: 0.7 }}>Live streaming is not switched on yet (the Mux keys are missing on the server).</div></div>;

  if (!info.liveStreamId) {
    return (
      <div style={wrap}>
        {title}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 14px" }}>
          Create a live stream for this event. You'll get a server URL and a stream key to paste into OBS, Streamlabs or your camera app. Paid events can only be watched by ticket holders, and the broadcast is saved as a replay.
        </p>
        {error && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{error}</div>}
        <button type="button" style={btn()} disabled={busy} onClick={() => call("POST")}>{busy ? "Creating…" : "Create live stream"}</button>
      </div>
    );
  }

  const [statusText, statusColor] = STATUS[info.status] || [info.status || "Unknown", "rgba(255,255,255,0.7)"];
  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {title}
        <span style={{ fontSize: 12, fontWeight: 900, color: statusColor }}>{statusText}</span>
      </div>
      {!info.signedPlayback && (
        <div style={{ color: "#F59E0B", fontSize: 12, fontWeight: 700, margin: "6px 0 10px" }}>Viewers can't watch yet: the Mux signing key is missing on the server.</div>
      )}
      <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
        <div>
          <span style={label}>Server URL (RTMPS)</span>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={field}>{info.rtmpUrl}</div>
            <button type="button" style={btn("rgba(255,255,255,0.1)")} onClick={() => copy(info.rtmpUrl, "url")}>{copied === "url" ? "Copied" : "Copy"}</button>
          </div>
        </div>
        <div>
          <span style={label}>Stream key (keep it private: anyone with it can broadcast on this event)</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={field}>{showKey ? info.streamKey : "•".repeat(24)}</div>
            <button type="button" style={btn("rgba(255,255,255,0.1)")} onClick={() => setShowKey((s) => !s)}>{showKey ? "Hide" : "Show"}</button>
            <button type="button" style={btn("rgba(255,255,255,0.1)")} onClick={() => copy(info.streamKey, "key")}>{copied === "key" ? "Copied" : "Copy"}</button>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "12px 0" }}>
        In OBS: Settings → Stream → Service "Custom…", paste the server URL and stream key, then press Start Streaming. The event page shows LIVE within a few seconds. When you stop, the replay appears on the page a few minutes later.
      </p>
      {error && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" style={btn("rgba(255,255,255,0.1)")} disabled={busy} onClick={() => { if (window.confirm("Make a new stream key? The current key stops working.")) call("POST", "/reset-key"); }}>New stream key</button>
        <button type="button" style={btn("rgba(239,68,68,0.8)")} disabled={busy} onClick={() => { if (window.confirm("Delete this live stream? You can create a new one afterwards.")) call("DELETE"); }}>Delete live stream</button>
      </div>
    </div>
  );
}
