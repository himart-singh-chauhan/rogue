// Admin → Communications: compose messages to one member or everyone, and see what was sent.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, RefreshCw } from "lucide-react";
import { ui, pill, useAdminApi, SectionHeader, Notice, Empty, Table, fmtDate } from "./adminUi";
import AdminComposeMessage from "./AdminComposeMessage";

export default function AdminCommunications() {
  const api = useAdminApi();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [open, setOpen] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/admin/messages");
      setMessages(Array.isArray(res) ? res : []);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Could not load messages" });
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  // A message to "all members" is stored once per member: show it once with a count.
  const sent = useMemo(() => {
    const groups = new Map();
    messages.forEach((m) => {
      const key = `${m.subject}|${m.body}|${String(m.created_at).slice(0, 16)}`;
      const g = groups.get(key) || { key, subject: m.subject, body: m.body, date: m.created_at, recipients: [], read: 0 };
      g.recipients.push(m.receiver_id?.username || m.receiver_id?.email || "member");
      if (m.is_read) g.read += 1;
      groups.set(key, g);
    });
    return [...groups.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [messages]);

  return (
    <div>
      <SectionHeader
        eyebrow="Communications"
        title="Messages to Members"
        desc="Send a message to one member or to every member. Members read it in the Messages section of their profile, with an unread badge."
        actions={<>
          <button style={ui.btnGhost} onClick={load}><RefreshCw size={14} /> Refresh</button>
          <button style={ui.btn} onClick={() => setComposing(true)}><MessageSquare size={16} /> New Message</button>
        </>}
      />
      <Notice type={msg.type} onClose={() => setMsg({ type: "", text: "" })}>{msg.text}</Notice>

      {loading ? <Empty>Loading messages...</Empty> : sent.length === 0 ? <Empty>No messages sent yet. Use "New Message" to write the first one.</Empty> : (
        <Table head={["Subject", "Sent to", "Read", "Date"]} minWidth={620}>
          {sent.map((g) => (
            <React.Fragment key={g.key}>
              <tr onClick={() => setOpen(open === g.key ? null : g.key)} style={{ cursor: "pointer" }}>
                <td style={{ ...ui.td, color: "white", fontWeight: 700 }}>{g.subject}</td>
                <td style={ui.td}>{g.recipients.length > 1 ? <span style={pill("#FF5500")}>{g.recipients.length} members</span> : g.recipients[0]}</td>
                <td style={ui.td}>{g.read} / {g.recipients.length}</td>
                <td style={ui.td}>{fmtDate(g.date)}</td>
              </tr>
              {open === g.key && (
                <tr><td colSpan={4} style={{ ...ui.td, whiteSpace: "pre-line", color: "#bbb", background: "rgba(255,255,255,0.02)" }}>{g.body}</td></tr>
              )}
            </React.Fragment>
          ))}
        </Table>
      )}

      {composing && (
        <AdminComposeMessage
          onClose={() => setComposing(false)}
          onSent={(text) => { setMsg({ type: "success", text }); load(); }}
        />
      )}
    </div>
  );
}
