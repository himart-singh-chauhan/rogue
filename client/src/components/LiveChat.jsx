// Live chat beside an event stream. New messages are fetched every few seconds.
// Paid events: pass holders only. Admins can remove messages; the chat can be switched off per event.
import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { apiCall } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function LiveChat({ eventId, height = 420 }) {
  const { user } = useAuth();
  const [state, setState] = useState({ loaded: false, enabled: true, locked: false, messages: [] });
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const lastAt = useRef(null);

  const load = useCallback(async (fresh = false) => {
    try {
      const qs = !fresh && lastAt.current ? `?after=${encodeURIComponent(lastAt.current)}` : "";
      const r = await apiCall(`/events/${eventId}/chat${qs}`, "GET", null, user?.token);
      setState((s) => {
        const merged = fresh ? r.messages : [...s.messages, ...r.messages.filter((m) => !s.messages.some((x) => x.id === m.id))];
        const msgs = merged.slice(-150);
        if (msgs.length) lastAt.current = msgs[msgs.length - 1].created_at;
        return { loaded: true, enabled: r.enabled !== false, locked: !!r.locked, messages: msgs };
      });
    } catch {
      setState((s) => ({ ...s, loaded: true }));
    }
  }, [eventId, user?.token]);

  useEffect(() => {
    lastAt.current = null;
    load(true);
    const t = setInterval(() => load(false), 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [state.messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true); setError("");
    try {
      const m = await apiCall(`/events/${eventId}/chat`, "POST", { body: text }, user?.token);
      setText("");
      setState((s) => ({ ...s, messages: [...s.messages, m] }));
      lastAt.current = m.created_at;
    } catch (err) { setError(err.message || "Message not sent."); } finally { setSending(false); }
  };
  const remove = async (id) => {
    try { await apiCall(`/events/${eventId}/chat/${id}`, "DELETE", null, user?.token); setState((s) => ({ ...s, messages: s.messages.filter((m) => m.id !== id) })); } catch { /* ignore */ }
  };

  const shell = { display: "flex", flexDirection: "column", height, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" };
  const head = <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, fontWeight: 900, letterSpacing: "0.1em", color: "white" }}>LIVE CHAT</div>;
  if (!state.enabled) return <div style={{ ...shell, height: "auto" }}>{head}<div style={{ padding: 16, color: "#888", fontSize: 13 }}>Live chat is turned off for this event.</div></div>;
  if (state.locked) return <div style={{ ...shell, height: "auto" }}>{head}<div style={{ padding: 16, color: "#888", fontSize: 13 }}>Chat is for spectator pass holders.</div></div>;

  return (
    <div style={shell}>
      {head}
      <div ref={listRef} data-lenis-prevent="true" style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {state.loaded && state.messages.length === 0 && <div style={{ color: "#777", fontSize: 13, textAlign: "center", marginTop: 20 }}>No messages yet. Say hello!</div>}
        {state.messages.map((m) => (
          <div key={m.id} style={{ fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.85)", display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
              <strong style={{ color: m.is_admin ? "#FF6A00" : "#9ecbff" }}>{m.name}{m.is_admin ? " · AMPEX" : ""}:</strong> {m.body}
            </span>
            {(user?.isAdmin || user?.is_admin) && (
              <button type="button" onClick={() => remove(m.id)} aria-label="Remove message" title="Remove" style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 2 }}><Trash2 size={12} /></button>
            )}
          </div>
        ))}
      </div>
      {user ? (
        <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <input value={text} maxLength={300} onChange={(e) => setText(e.target.value)} placeholder="Say something…" aria-label="Chat message"
            style={{ flex: 1, minWidth: 0, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 100, padding: "10px 14px", color: "white", fontSize: 13 }} />
          <button type="submit" disabled={sending || !text.trim()} aria-label="Send" style={{ background: "#FF6A00", border: "none", color: "white", borderRadius: "50%", width: 38, height: 38, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Send size={15} /></button>
        </form>
      ) : (
        <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 13, color: "#999" }}><Link to="/login" style={{ color: "#FF6A00", fontWeight: 800 }}>Log in</Link> to chat.</div>
      )}
      {error && <div style={{ padding: "0 12px 10px", color: "#f87171", fontSize: 12 }}>{error}</div>}
    </div>
  );
}
