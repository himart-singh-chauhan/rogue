// Communications → New Message: send a message to one member or to every member.
// Members read it in the Messages section of their profile.
import React, { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { ui, useAdminApi, Field, Notice, Modal } from "./adminUi";

export default function AdminComposeMessage({ onClose, onSent, defaultRecipient = null }) {
  const api = useAdminApi();
  const [to, setTo] = useState(defaultRecipient ? "user" : "user");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [receiver, setReceiver] = useState(defaultRecipient);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/admin/users?limit=500")
      .then((res) => setUsers(Array.isArray(res) ? res : res?.users || res?.data || []))
      .catch(() => setUsers([]));
  }, [api]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users.slice(0, 8);
    return users.filter((u) => [u.name, u.email, u.username].some((v) => String(v || "").toLowerCase().includes(q))).slice(0, 8);
  }, [users, search]);

  const send = async () => {
    setError("");
    if (to === "user" && !receiver) { setError("Choose who should receive this message."); return; }
    if (!subject.trim() || !body.trim()) { setError("Subject and message are both required."); return; }
    if (to === "all" && !window.confirm(`Send this message to all ${users.length || ""} members?`)) return;
    setSending(true);
    try {
      const res = await api("/admin/messages", "POST", { to, receiverId: receiver?.id || receiver?._id, subject: subject.trim(), body: body.trim() });
      onSent?.(res?.message || "Message sent.");
      onClose();
    } catch (e) {
      setError(e.message || "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      title="New message"
      onClose={onClose}
      width={600}
      footer={<>
        <button style={ui.btnGhost} onClick={onClose}>Cancel</button>
        <button style={ui.btn} disabled={sending} onClick={send}><Send size={14} /> {sending ? "Sending..." : "Send message"}</button>
      </>}
    >
      <Notice type="error">{error}</Notice>
      <Field label="Send to">
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[["user", "One member"], ["all", "All members"]].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setTo(v)} style={{ ...ui.btnGhost, background: to === v ? "#FF5500" : "rgba(255,255,255,0.04)", borderColor: to === v ? "#FF5500" : "rgba(255,255,255,0.1)" }}>{l}</button>
          ))}
        </div>
      </Field>
      {to === "user" && (
        <Field label="Recipient">
          {receiver ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", ...ui.input }}>
              <span><strong>{receiver.name || receiver.username}</strong> <span style={ui.muted}>{receiver.email}</span></span>
              <button type="button" style={{ background: "none", border: "none", color: "#FF5500", cursor: "pointer", fontWeight: 700 }} onClick={() => setReceiver(null)}>Change</button>
            </div>
          ) : (
            <>
              <input style={ui.input} placeholder="Search by name, email or username" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
              <div style={{ marginTop: "6px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden" }}>
                {matches.length === 0 ? <div style={{ padding: "10px 14px", ...ui.muted }}>No members found.</div> : matches.map((u) => (
                  <button key={u.id || u._id} type="button" onClick={() => setReceiver(u)} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "10px 14px", color: "white", cursor: "pointer", fontSize: "14px" }}>
                    {u.name || u.username} <span style={ui.muted}>{u.email}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </Field>
      )}
      <Field label="Subject"><input style={ui.input} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} /></Field>
      <Field label="Message"><textarea style={{ ...ui.input, minHeight: "160px" }} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
    </Modal>
  );
}
