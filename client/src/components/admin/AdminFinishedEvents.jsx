// Admins only, on Live Events: events that have finished and wait for approval before the public sees them in
// Past events. (Pass holders can still watch their 24-hour replay in the meantime.)
import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { apiCall } from "../../utils/api";

export default function AdminFinishedEvents({ events, token, onChanged }) {
  const [busy, setBusy] = useState("");
  const waiting = events.filter((e) => e.status === "PAST" && !e.replayApproved);
  if (!waiting.length) return null;

  const decide = async (ev, approve) => {
    setBusy(ev.id);
    try {
      await apiCall(`/events/${ev.id}/stream-settings`, "PUT", { replayApproved: approve }, token);
      onChanged?.();
    } catch (e) { alert(e.message); } finally { setBusy(""); }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto 32px", width: "100%", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 20, padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#F59E0B", letterSpacing: "0.08em", marginBottom: 4 }}>ADMIN · FINISHED EVENTS WAITING FOR APPROVAL ({waiting.length})</div>
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 14 }}>These events have ended. They appear in the public Past events only after you approve them. Only admins see this box.</div>
      <div style={{ display: "grid", gap: 8 }}>
        {waiting.map((ev) => (
          <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: "10px 12px" }}>
            <img src={ev.img} alt="" style={{ width: 54, height: 38, objectFit: "cover", borderRadius: 8 }} />
            <div style={{ flex: "1 1 220px", minWidth: 0 }}>
              <div style={{ color: "white", fontWeight: 900, fontSize: 13, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
              <div style={{ color: "#999", fontSize: 11, fontWeight: 700 }}>{ev.time}{ev.isPaid ? " · paid event" : " · free event"}</div>
            </div>
            <Link to={`/stream/${ev.id}`} style={{ color: "#FF6A00", fontSize: 12, fontWeight: 800 }}>Open event</Link>
            <button type="button" disabled={busy === ev.id} onClick={() => decide(ev, true)} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: 100, padding: "9px 16px", fontSize: 12, fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={14} /> Approve for Past events
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
