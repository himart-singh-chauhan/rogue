// A member's spectator pass with its QR code. Staff scan it at the door (Live Events → ticket scanner).
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function TicketPass({ ticket, memberName }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(ticket.accessCode, { width: 360, margin: 1, errorCorrectionLevel: "M" }).then(setSrc).catch(() => setSrc(""));
  }, [ticket.accessCode]);
  const ev = ticket.event || {};
  const used = ticket.status === "used";
  return (
    <div style={{ background: "linear-gradient(135deg, #1a1a1a, #0c0c0c)", border: "1px solid rgba(255,106,0,0.35)", borderRadius: 20, padding: 18, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", color: "white" }}>
      <div style={{ background: "white", borderRadius: 14, padding: 10, width: 170, height: 170, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {src ? <img src={src} alt={`QR code for ${ev.title || "your pass"}`} width={150} height={150} /> : <span style={{ color: "#999", fontSize: 12 }}>Loading QR…</span>}
      </div>
      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#FF6A00", letterSpacing: "0.15em" }}>AMPEX LIVE EVENT PASS</div>
        <div style={{ fontSize: 20, fontWeight: 950, textTransform: "uppercase", margin: "6px 0", lineHeight: 1.15 }}>{ev.title || "Live event"}</div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.6 }}>
          {ev.date && <div>{new Date(ev.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</div>}
          {ev.location && <div>{ev.location}</div>}
          {memberName && <div>Pass holder: <strong style={{ color: "white" }}>{memberName}</strong></div>}
          <div>{(ticket.ticketType || "spectator").toUpperCase()} PASS</div>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 8, wordBreak: "break-all" }}>{ticket.accessCode}</div>
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, color: used ? "#F59E0B" : "#22c55e" }}>
          {used ? `Checked in${ticket.lastScannedAt ? ` · ${new Date(ticket.lastScannedAt).toLocaleString()}` : ""}` : "Valid · show this QR code at the entrance"}
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Watching online? Your pass also unlocks the stream on the event page.</div>
      </div>
    </div>
  );
}
