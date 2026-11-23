// Admin, on an event's page: go live / end the event, live chat on or off, keep the replay.
// Works for every event (Mux streams and YouTube/Vimeo links). With Mux, "End event" also tells Mux the
// broadcast is over so the recording is finished for the replay.
import { useEffect, useState } from "react";
import { Radio, Square, MessageSquare, Film, Eye } from "lucide-react";
import { apiCall } from "../../utils/api";

const btn = (bg) => ({ background: bg, color: "white", border: "none", borderRadius: 100, padding: "10px 18px", fontSize: 12, fontWeight: 900, textTransform: "uppercase", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 });

function Switch({ on, onChange, label, icon }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: "white", fontSize: 13, fontWeight: 700 }}>
      <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} style={{ width: 44, height: 24, borderRadius: 100, border: "none", cursor: "pointer", background: on ? "#22c55e" : "#444", position: "relative", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.15s" }} />
      </button>
      {icon} {label}
    </label>
  );
}

export default function EventLiveControls({ eventId, token, onChanged }) {
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    apiCall(`/events/${eventId}`, "GET", null, token).then(setInfo).catch(() => {});
  }, [eventId, token]);

  if (!info) return null;
  const status = String(info.status || "").toLowerCase();
  const live = info.isLive || status === "live";
  const ended = status === "completed" || status === "past" || !!info.endedAt;

  const act = async (action) => {
    if (action === "end" && !window.confirm("End this event now? Viewers see that it has ended; the replay stays on the page.")) return;
    setBusy(true); setNotice("");
    try {
      const r = await apiCall(`/events/${eventId}/live`, "POST", { action }, token);
      setInfo((i) => ({ ...i, status: r.status, isLive: r.is_live, startedAt: r.started_at, endedAt: r.ended_at }));
      setNotice(r.message);
      onChanged?.();
    } catch (e) { setNotice(e.message); } finally { setBusy(false); }
  };
  const setting = async (key, value) => {
    try {
      const r = await apiCall(`/events/${eventId}/stream-settings`, "PUT", { [key]: value }, token);
      setInfo((i) => ({ ...i, chatEnabled: r.chatEnabled, replayEnabled: r.replayEnabled, replayApproved: r.replayApproved }));
    } catch (e) { setNotice(e.message); }
  };

  return (
    <div style={{ marginTop: 20, padding: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 950, letterSpacing: "0.05em" }}>🎬 LIVE EVENT CONTROLS</div>
        <span style={{ fontSize: 12, fontWeight: 900, color: live ? "#ef4444" : ended ? "#aaa" : "#F59E0B" }}>{live ? "🔴 LIVE NOW" : ended ? "Ended" : "Not started"}</span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {!live && <button type="button" style={btn("#ef4444")} disabled={busy} onClick={() => act("start")}><Radio size={14} /> {ended ? "Go live again" : "Start event (go live)"}</button>}
        {live && <button type="button" style={btn("rgba(255,255,255,0.12)")} disabled={busy} onClick={() => act("end")}><Square size={14} /> End event</button>}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        <Switch on={info.chatEnabled !== false} onChange={(v) => setting("chatEnabled", v)} label="Live chat on this event" icon={<MessageSquare size={14} />} />
        <Switch on={info.replayEnabled !== false} onChange={(v) => setting("replayEnabled", v)} label="Save the recording and show the replay after the event" icon={<Film size={14} />} />
        <Switch on={info.replayApproved === true} onChange={(v) => setting("replayApproved", v)} label="Approved: list this event in the public Past events after it ends" icon={<Eye size={14} />} />
      </div>
      {ended && info.replayApproved !== true && (
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", color: "#F59E0B", fontSize: 12, fontWeight: 800 }}>
          This event has ended and is waiting for your approval. The public won't see it in Past events until you switch on "Approved" above. Pass holders can still watch their 24-hour replay.
        </div>
      )}
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "12px 0 0" }}>
        Free events: everyone can watch, live and replay. Paid events: only spectator pass holders; after the event ends they can watch the replay for 24 hours.
        {" "}With a Mux stream, viewers see LIVE as soon as your broadcast starts; “End event” closes it and finishes the recording.
      </p>
      {notice && <div style={{ marginTop: 10, color: "#FF6A00", fontSize: 12, fontWeight: 700 }}>{notice}</div>}
    </div>
  );
}
