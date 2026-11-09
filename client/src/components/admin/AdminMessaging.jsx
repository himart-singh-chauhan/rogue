import { useState } from "react";
import {
  Mail, Bell, Send, Users, Megaphone, Clock, CheckCircle, X, Plus,
  Trash2, Search, AlertTriangle, MessageSquare, ChevronRight, Settings,
  Globe, Zap, Calendar, Star, ToggleLeft, ToggleRight, Eye, Edit3
} from "lucide-react";

const MOCK_MESSAGES = [
  { id: "m-001", to: "all", toLabel: "All Users (1,247)", subject: "Welcome to AMPEX World Records!", body: "We are thrilled to have you as part of our growing community...", sentAt: "2026-05-25T10:00:00Z", status: "sent", type: "announcement" },
  { id: "m-002", to: "user:james.park@email.com", toLabel: "James Park", subject: "Your submission is under review", body: "Your record attempt for Most Juggling Objects has been received...", sentAt: "2026-05-27T14:30:00Z", status: "sent", type: "reminder" },
  { id: "m-003", to: "membership:gold", toLabel: "Gold Members (84)", subject: "Exclusive Gold Event Invitation", body: "As a Gold member, you have exclusive access to our upcoming...", sentAt: "2026-05-28T09:00:00Z", status: "sent", type: "event" },
  { id: "m-004", to: "all", toLabel: "All Users", subject: "Maintenance Notice — 2AM UTC", body: "The platform will be down for scheduled maintenance...", sentAt: null, status: "draft", type: "maintenance" },
];

const MOCK_EMAIL_TEMPLATES = [
  { id: "et-001", name: "Registration Confirmation", trigger: "on_register", subject: "Welcome to AMPEX World Records!", active: true, lastEdited: "2026-05-10" },
  { id: "et-002", name: "Submission Received", trigger: "on_submit", subject: "Your record submission has been received", active: true, lastEdited: "2026-05-12" },
  { id: "et-003", name: "Submission Approved", trigger: "on_approve", subject: "Congratulations! Your record is VERIFIED 🏆", active: true, lastEdited: "2026-05-15" },
  { id: "et-004", name: "Submission Denied", trigger: "on_deny", subject: "Your submission requires attention", active: true, lastEdited: "2026-05-15" },
  { id: "et-005", name: "Appeal Received", trigger: "on_appeal", subject: "Your appeal is being reviewed", active: true, lastEdited: "2026-04-30" },
  { id: "et-006", name: "Payment Confirmed", trigger: "on_payment", subject: "Payment Confirmed — Thank You!", active: true, lastEdited: "2026-05-01" },
  { id: "et-007", name: "Ticket Purchased", trigger: "on_ticket", subject: "Your event ticket is confirmed 🎟️", active: true, lastEdited: "2026-05-05" },
  { id: "et-008", name: "Membership Renewal Reminder", trigger: "on_renewal_reminder", subject: "Your membership expires in 7 days", active: false, lastEdited: "2026-04-20" },
  { id: "et-009", name: "Order Shipped", trigger: "on_ship", subject: "Your order is on the way! 📦", active: true, lastEdited: "2026-05-03" },
  { id: "et-010", name: "Challenge Reminder", trigger: "on_challenge_due", subject: "Your challenge deadline is approaching", active: true, lastEdited: "2026-05-18" },
];

const NOTIFICATION_TYPES = [
  { id: "n-001", type: "push", title: "New Record Verified", body: "Marcus Thorne just broke the push-up record!", sentAt: "2026-05-28T10:00:00Z", recipients: 1247, opened: 834 },
  { id: "n-002", type: "website", title: "🔴 Live Event Starting", body: "The World Championship is going live in 5 minutes!", sentAt: "2026-05-27T18:55:00Z", recipients: 1247, opened: 1102 },
  { id: "n-003", type: "emergency", title: "⚠️ Emergency Maintenance", body: "Unexpected downtime — team is working on it", sentAt: "2026-05-26T03:00:00Z", recipients: 1247, opened: 445 },
  { id: "n-004", type: "event", title: "Summer Championships Open!", body: "Registrations are now open for the Summer Championships 2026", sentAt: "2026-05-25T12:00:00Z", recipients: 1247, opened: 967 },
];

const msgTypeStyle = (type) => {
  const map = {
    announcement: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    reminder: { color: "#FF5500", bg: "rgba(255,85,0,0.12)" },
    event: { color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
    maintenance: { color: "#ffcc00", bg: "rgba(255,204,0,0.12)" },
    emergency: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  };
  return map[type] || { color: "#888", bg: "rgba(255,255,255,0.05)" };
};

const notifTypeStyle = (type) => {
  const map = {
    push: { color: "#3b82f6", label: "PUSH" },
    website: { color: "#22c55e", label: "WEBSITE" },
    emergency: { color: "#ef4444", label: "EMERGENCY" },
    event: { color: "#a855f7", label: "EVENT" },
  };
  return map[type] || { color: "#888", label: type.toUpperCase() };
};

export default function AdminMessaging({ user, showToast }) {
  const [subTab, setSubTab] = useState("compose");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [templates, setTemplates] = useState(MOCK_EMAIL_TEMPLATES);

  // Compose form
  const [composeForm, setComposeForm] = useState({
    to: "all",
    customEmail: "",
    subject: "",
    body: "",
    type: "announcement",
    sendNow: true,
    scheduleAt: "",
  });
  const [composing, setComposing] = useState(false);

  // Notification form
  const [notifForm, setNotifForm] = useState({
    title: "",
    body: "",
    type: "push",
    target: "all",
  });

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const handleSendMessage = async () => {
    if (!composeForm.subject.trim() || !composeForm.body.trim()) {
      showToast("Subject and body are required", "error");
      return;
    }
    setComposing(true);
    await new Promise(r => setTimeout(r, 800));
    const newMsg = {
      id: `m-${Date.now()}`,
      to: composeForm.to,
      toLabel: composeForm.to === "all" ? "All Users" : composeForm.to === "custom" ? composeForm.customEmail : composeForm.to,
      subject: composeForm.subject,
      body: composeForm.body,
      type: composeForm.type,
      sentAt: composeForm.sendNow ? new Date().toISOString() : null,
      status: composeForm.sendNow ? "sent" : "draft",
    };
    setMessages(prev => [newMsg, ...prev]);
    setComposeForm({ to: "all", customEmail: "", subject: "", body: "", type: "announcement", sendNow: true, scheduleAt: "" });
    setComposing(false);
    showToast(composeForm.sendNow ? "Message sent successfully!" : "Message saved as draft", "success");
  };

  const handleSendNotification = async () => {
    if (!notifForm.title.trim() || !notifForm.body.trim()) {
      showToast("Title and body are required", "error");
      return;
    }
    await new Promise(r => setTimeout(r, 600));
    showToast(`${notifForm.type.toUpperCase()} notification sent to ${notifForm.target === "all" ? "all users" : notifForm.target}`, "success");
    setNotifForm({ title: "", body: "", type: "push", target: "all" });
  };

  const toggleTemplate = (id) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
    showToast("Email template updated", "success");
  };

  const S = {
    card: { background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px" },
    inputStyle: { width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "11px 14px", color: "white", fontSize: "13px", outline: "none", fontFamily: "inherit" },
    label: { fontSize: "10px", color: "#555", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "7px" },
    subTabBtn: (active) => ({
      background: active ? "rgba(255,85,0,0.12)" : "transparent",
      border: `1px solid ${active ? "rgba(255,85,0,0.3)" : "rgba(255,255,255,0.06)"}`,
      color: active ? "#FF5500" : "#888",
      padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "900",
      cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
      textTransform: "uppercase", letterSpacing: "0.5px", transition: "all 0.15s"
    }),
    pill: (color, bg) => ({ background: bg, color, padding: "3px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase" }),
  };

  const SUB_TABS = [
    { key: "compose", label: "Compose & Inbox", icon: <Mail size={14} /> },
    { key: "notifications", label: "Notification Center", icon: <Bell size={14} /> },
    { key: "email-templates", label: "Email Templates", icon: <Settings size={14} /> },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
        <div>
          <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>Comms Headquarters</div>
          <h2 style={{ fontSize: "52px", fontWeight: "950", margin: "0 0 12px 0", color: "white", letterSpacing: "-2px", textTransform: "uppercase", lineHeight: "1" }}>
            MESSAGING &<br /><span style={{ color: "#FF5500" }}>NOTIFICATIONS</span>
          </h2>
          <p style={{ color: "#888", fontSize: "14px", lineHeight: "1.6", maxWidth: "500px", margin: 0 }}>
            Send messages to users, manage notifications, announcements, reminders, and email templates.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Messages Sent", value: messages.filter(m => m.status === "sent").length, color: "#3b82f6", icon: <Send size={18} /> },
          { label: "Drafts", value: messages.filter(m => m.status === "draft").length, color: "#ffcc00", icon: <Edit3 size={18} /> },
          { label: "Notifications Sent", value: NOTIFICATION_TYPES.length, color: "#22c55e", icon: <Bell size={18} /> },
          { label: "Email Templates", value: templates.filter(t => t.active).length, color: "#a855f7", icon: <Mail size={18} /> },
        ].map(stat => (
          <div key={stat.label} style={{ ...S.card, display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.8px" }}>{stat.label}</div>
              <div style={{ color: stat.color, opacity: 0.7 }}>{stat.icon}</div>
            </div>
            <div style={{ fontSize: "36px", fontWeight: "950", color: stat.color, lineHeight: "1" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
        {SUB_TABS.map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={S.subTabBtn(subTab === t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== COMPOSE & INBOX ===== */}
      {subTab === "compose" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "24px" }}>
          {/* Compose Panel */}
          <div style={S.card}>
            <div style={{ fontSize: "15px", fontWeight: "900", color: "white", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Send size={16} color="#FF5500" /> Compose Message
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Send To</label>
              <select value={composeForm.to} onChange={e => setComposeForm(p => ({ ...p, to: e.target.value }))}
                style={S.inputStyle}>
                <option value="all">All Users</option>
                <option value="membership:free">Free Members</option>
                <option value="membership:bronze">Bronze Members</option>
                <option value="membership:silver">Silver Members</option>
                <option value="membership:gold">Gold Members</option>
                <option value="role:athlete">All Athletes</option>
                <option value="role:judge">All Judges</option>
                <option value="custom">Custom Email</option>
              </select>
            </div>

            {composeForm.to === "custom" && (
              <div style={{ marginBottom: "14px" }}>
                <label style={S.label}>Recipient Email</label>
                <input type="email" placeholder="user@example.com" value={composeForm.customEmail} onChange={e => setComposeForm(p => ({ ...p, customEmail: e.target.value }))} style={S.inputStyle} />
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Message Type</label>
              <select value={composeForm.type} onChange={e => setComposeForm(p => ({ ...p, type: e.target.value }))} style={S.inputStyle}>
                <option value="announcement">Announcement</option>
                <option value="reminder">Reminder</option>
                <option value="event">Event Notification</option>
                <option value="maintenance">Maintenance Notice</option>
                <option value="emergency">Emergency Alert</option>
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Subject</label>
              <input type="text" placeholder="Message subject..." value={composeForm.subject} onChange={e => setComposeForm(p => ({ ...p, subject: e.target.value }))} style={S.inputStyle} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={S.label}>Message Body</label>
              <textarea
                placeholder="Write your message..."
                value={composeForm.body}
                onChange={e => setComposeForm(p => ({ ...p, body: e.target.value }))}
                style={{ ...S.inputStyle, minHeight: "120px", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleSendMessage} disabled={composing}
                style={{ flex: 1, background: composing ? "rgba(255,85,0,0.3)" : "linear-gradient(135deg, #FF5500 0%, #ff8800 100%)", border: "none", color: "white", padding: "12px", borderRadius: "10px", fontSize: "12px", fontWeight: "900", cursor: composing ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>
                {composing ? "SENDING..." : <><Send size={14} style={{ marginRight: "6px" }} />SEND NOW</>}
              </button>
              <button onClick={() => { setComposeForm(p => ({ ...p, sendNow: false })); handleSendMessage(); }}
                style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#aaa", padding: "12px", borderRadius: "10px", fontSize: "12px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase" }}>
                SAVE DRAFT
              </button>
            </div>
          </div>

          {/* Message Inbox/History */}
          <div style={S.card}>
            <div style={{ fontSize: "15px", fontWeight: "900", color: "white", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare size={16} color="#FF5500" /> Message History
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.map(msg => {
                const ts = msgTypeStyle(msg.type);
                return (
                  <div key={msg.id} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "14px 16px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                          <span style={{ background: ts.bg, color: ts.color, padding: "2px 8px", borderRadius: "100px", fontSize: "9px", fontWeight: "900", textTransform: "uppercase" }}>{msg.type}</span>
                          <span style={{ background: msg.status === "sent" ? "rgba(34,197,94,0.1)" : "rgba(255,204,0,0.1)", color: msg.status === "sent" ? "#22c55e" : "#ffcc00", padding: "2px 8px", borderRadius: "100px", fontSize: "9px", fontWeight: "900", textTransform: "uppercase" }}>{msg.status}</span>
                        </div>
                        <div style={{ fontWeight: "800", fontSize: "13px", color: "white", marginBottom: "3px" }}>{msg.subject}</div>
                        <div style={{ fontSize: "11px", color: "#555" }}>
                          To: {msg.toLabel}
                          {msg.sentAt && ` · ${new Date(msg.sentAt).toLocaleDateString()}`}
                        </div>
                      </div>
                      <button onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                        style={{ background: "transparent", border: "none", color: "#444", cursor: "pointer" }}><X size={16} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== NOTIFICATION CENTER ===== */}
      {subTab === "notifications" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "24px" }}>
          {/* Send Notification Form */}
          <div style={S.card}>
            <div style={{ fontSize: "15px", fontWeight: "900", color: "white", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell size={16} color="#FF5500" /> Send Notification
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Notification Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { value: "push", label: "Push", color: "#3b82f6" },
                  { value: "website", label: "Website Alert", color: "#22c55e" },
                  { value: "emergency", label: "Emergency", color: "#ef4444" },
                  { value: "event", label: "Event", color: "#a855f7" },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setNotifForm(p => ({ ...p, type: opt.value }))}
                    style={{ padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: "900", cursor: "pointer", border: notifForm.type === opt.value ? `2px solid ${opt.color}` : "1px solid rgba(255,255,255,0.08)", background: notifForm.type === opt.value ? `${opt.color}22` : "transparent", color: notifForm.type === opt.value ? opt.color : "#666" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Target Audience</label>
              <select value={notifForm.target} onChange={e => setNotifForm(p => ({ ...p, target: e.target.value }))} style={S.inputStyle}>
                <option value="all">All Users</option>
                <option value="membership:gold">Gold Members</option>
                <option value="membership:silver">Silver Members</option>
                <option value="role:athlete">Athletes Only</option>
                <option value="role:judge">Judges Only</option>
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Title</label>
              <input type="text" placeholder="Notification title..." value={notifForm.title} onChange={e => setNotifForm(p => ({ ...p, title: e.target.value }))} style={S.inputStyle} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={S.label}>Message</label>
              <textarea placeholder="Notification message..." value={notifForm.body} onChange={e => setNotifForm(p => ({ ...p, body: e.target.value }))}
                style={{ ...S.inputStyle, minHeight: "80px", resize: "vertical" }} />
            </div>

            <button onClick={handleSendNotification}
              style={{ width: "100%", background: "linear-gradient(135deg, #FF5500 0%, #ff8800 100%)", border: "none", color: "white", padding: "12px", borderRadius: "10px", fontSize: "12px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>
              <Bell size={14} style={{ marginRight: "8px" }} />SEND NOTIFICATION
            </button>
          </div>

          {/* Sent Notifications History */}
          <div style={S.card}>
            <div style={{ fontSize: "15px", fontWeight: "900", color: "white", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell size={16} color="#FF5500" /> Notification History
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {NOTIFICATION_TYPES.map(notif => {
                const nt = notifTypeStyle(notif.type);
                const openRate = Math.round((notif.opened / notif.recipients) * 100);
                return (
                  <div key={notif.id} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <span style={{ background: `${nt.color}20`, color: nt.color, padding: "2px 8px", borderRadius: "100px", fontSize: "9px", fontWeight: "900", textTransform: "uppercase", marginRight: "6px" }}>{nt.label}</span>
                        <div style={{ fontWeight: "800", fontSize: "13px", color: "white", marginTop: "6px" }}>{notif.title}</div>
                        <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{notif.body}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div>
                        <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", textTransform: "uppercase" }}>Sent</div>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#aaa" }}>{notif.recipients.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", textTransform: "uppercase" }}>Opened</div>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#22c55e" }}>{notif.opened.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", textTransform: "uppercase" }}>Open Rate</div>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: openRate > 70 ? "#22c55e" : openRate > 40 ? "#ffcc00" : "#ef4444" }}>{openRate}%</div>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                        <div style={{ fontSize: "10px", color: "#555" }}>{new Date(notif.sentAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: "10px", width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px" }}>
                      <div style={{ width: `${openRate}%`, height: "100%", background: "linear-gradient(90deg, #FF5500, #ff8800)", borderRadius: "2px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== EMAIL TEMPLATES ===== */}
      {subTab === "email-templates" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "15px", fontWeight: "900", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={16} color="#FF5500" /> Email Templates
              <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", padding: "2px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: "900" }}>
                {templates.filter(t => t.active).length} active
              </span>
            </div>
            <button onClick={() => showToast("Template editor coming soon", "info")}
              style={{ background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.2)", color: "#FF5500", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <Plus size={14} /> New Template
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                {["TEMPLATE NAME", "TRIGGER EVENT", "SUBJECT", "STATUS", "LAST EDITED", "ACTIONS"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", color: "#555", fontWeight: "900", letterSpacing: "0.8px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map(tmpl => (
                <tr key={tmpl.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "14px 16px", fontWeight: "800", color: "white", fontSize: "13px" }}>{tmpl.name}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: "rgba(255,255,255,0.05)", color: "#888", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontFamily: "monospace" }}>{tmpl.trigger}</span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#888", fontSize: "12px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tmpl.subject}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: tmpl.active ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", color: tmpl.active ? "#22c55e" : "#555", padding: "3px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase" }}>{tmpl.active ? "ACTIVE" : "INACTIVE"}</span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#555", fontSize: "12px" }}>{tmpl.lastEdited}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => showToast(`Editing template: ${tmpl.name}`, "info")}
                        style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#888", width: "30px", height: "30px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => toggleTemplate(tmpl.id)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: tmpl.active ? "#22c55e" : "#555" }}>
                        {tmpl.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
