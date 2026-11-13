// Member → member message (call someone out on a record, reply to a message). Arrives in the other
// member's Messages tab on their profile.
import { useState } from "react";
import { X, Send } from "lucide-react";
import { apiCall } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const box = { width: "100%", boxSizing: "border-box", background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 14px", color: "white", fontSize: 15, outline: "none" };

export default function MessageComposer({ to, subject: initialSubject = "", body: initialBody = "", recordId = null, onClose, onSent }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const send = async () => {
    if (sending) return;
    if (!subject.trim()) { setError("Write a subject."); return; }
    if (!body.trim()) { setError("Write your message."); return; }
    setSending(true); setError("");
    try {
      const r = await apiCall("/messages", "POST", { toUserId: to.id, subject, body, recordId }, user?.token);
      setDone(r.message || "Message sent.");
      onSent?.();
    } catch (e) {
      setError(e.message || "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-lenis-prevent="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-label={`Message ${to.name}`} style={{ width: "100%", maxWidth: 520, background: "#141414", border: "1px solid rgba(255,85,0,0.3)", borderRadius: 20, padding: 22, color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 17 }}>Message {to.name}</div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        {done ? (
          <>
            <div style={{ color: "#4ade80", fontWeight: 800, marginBottom: 16 }}>{done} {to.name} will see it under Messages on their profile.</div>
            <button type="button" onClick={onClose} style={{ background: "#FF5500", color: "white", border: "none", borderRadius: 100, padding: "12px 22px", fontWeight: 900, cursor: "pointer" }}>Done</button>
          </>
        ) : (
          <>
            <input style={{ ...box, marginBottom: 10 }} value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" aria-label="Subject" />
            <textarea style={{ ...box, minHeight: 140, resize: "vertical" }} value={body} maxLength={5000} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" aria-label="Message" />
            {error && <div role="alert" style={{ color: "#f87171", fontSize: 13, fontWeight: 700, marginTop: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <button type="button" disabled={sending} onClick={send} style={{ background: "#FF5500", color: "white", border: "none", borderRadius: 100, padding: "12px 22px", fontWeight: 900, cursor: sending ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}><Send size={15} /> {sending ? "Sending…" : "Send message"}</button>
              <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 100, padding: "12px 22px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
            </div>
            <div style={{ color: "#777", fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>Keep it friendly. Messages are for challenges and AMPEX business; abuse can get an account suspended.</div>
          </>
        )}
      </div>
    </div>
  );
}
