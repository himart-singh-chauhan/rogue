// Admin → Users → click a member: their full profile with real data, and ways to contact them.
// initialTab / initialCompose let the Users "⋮" menu open it on Membership, Appeals, Manage or a new message.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, ExternalLink, RefreshCw, Send } from "lucide-react";
import { ui, pill, StatusPill, useAdminApi, Notice, Empty, Tabs, Table, fmtDate, fmtMoney } from "./adminUi";
import ImageUploadField from "./ImageUploadField";
import { formatHeight, formatWeight } from "../../utils/units";

const newKey = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const Stat = ({ label, value, color = "white" }) => (
  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 16px", minWidth: 0 }}>
    <div style={{ fontSize: "10px", color: "#777", fontWeight: 900, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
    <div style={{ fontSize: "20px", color, fontWeight: 900, overflowWrap: "anywhere" }}>{value}</div>
  </div>
);
const Row = ({ label, value }) => (
  <div style={{ display: "grid", gridTemplateColumns: "minmax(110px, 160px) minmax(0, 1fr)", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
    <span style={{ color: "#777", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</span>
    <span style={{ color: "#e5e5e5", fontSize: "14px", overflowWrap: "anywhere" }}>{value || "—"}</span>
  </div>
);

export default function AdminMemberProfile({ userId, initialTab = "overview", initialCompose = null }) {
  const api = useAdminApi();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(initialTab);
  const [compose, setCompose] = useState(initialCompose ? { mode: initialCompose, subject: "", body: "" } : null); // { mode: 'message' | 'email', subject, body }
  const [notice, setNotice] = useState(null);
  const [sending, setSending] = useState(false);
  const [composeError, setComposeError] = useState("");
  const sendKey = useRef(newKey()); // one key per email: a double click never sends it twice
  const [photo, setPhoto] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try { setData(await api(`/admin/members/${userId}/overview`)); } catch (e) { setError(e.message); }
  }, [api, userId]);
  useEffect(() => { load(); }, [load]);

  if (error) return <Notice type="error">{error}</Notice>;
  if (!data) return <div style={{ color: "#888", padding: "30px 0", textAlign: "center" }}>Loading member…</div>;

  const u = data.user;
  const address = [u.street_address, u.apartment, u.city, u.state, u.zip_code, u.country].filter(Boolean).join(", ");
  const mailto = (subject = "", body = "") => `mailto:${encodeURIComponent(u.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const openCompose = (mode) => { setNotice(null); setComposeError(""); sendKey.current = newKey(); setCompose({ mode, subject: "", body: "" }); };
  const send = async () => {
    if (sending) return;
    if (compose.mode === "email" && !u.email) { setComposeError("This member has no email address."); return; }
    if (!compose.subject.trim()) { setComposeError("Write a subject."); return; }
    if (!compose.body.trim()) { setComposeError("Write a message."); return; }
    setComposeError("");
    setSending(true);
    try {
      if (compose.mode === "message") {
        await api("/admin/messages", "POST", { to: "user", receiverId: u.id, subject: compose.subject, body: compose.body });
        setNotice({ type: "success", text: `Message sent. ${u.name} will see it under Messages on their profile.` });
      } else {
        const r = await api(`/admin/members/${u.id}/email`, "POST", { subject: compose.subject, body: compose.body, requestKey: sendKey.current });
        setNotice({ type: "success", text: r.message || "Email sent." });
      }
      setCompose(null);
      load();
    } catch (e) {
      setComposeError(e.message);
    } finally {
      setSending(false);
    }
  };

  const savePhoto = async (url) => {
    setSavingPhoto(true);
    try {
      await api(`/dashboard/users/${u.id}`, "PUT", { profileImage: url || "" });
      setPhoto(null);
      setNotice({ type: "success", text: url ? "Profile photo updated." : "Profile photo removed." });
      load();
    } catch (e) { setNotice({ type: "error", text: e.message }); } finally { setSavingPhoto(false); }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "records", label: "Records", count: data.records.length },
    { id: "membership", label: "Membership & payments", count: data.payments.length },
    { id: "orders", label: "Orders", count: data.orders.length },
    { id: "certificates", label: "Certificates", count: data.certificates.length },
    { id: "rewards", label: "Rewards" },
    { id: "messages", label: "Messages", count: data.messages.length },
    { id: "awards", label: "Awards", count: (data.awards || []).length },
    { id: "emails", label: "Emails", count: (data.emails || []).length },
    { id: "appeals", label: "Appeals", count: (data.appeals || []).length },
    { id: "manage", label: "Manage" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: "18px", alignItems: "center", flexWrap: "wrap", ...ui.card, padding: "20px" }}>
        <img src={u.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "M")}&background=FF6A00&color=fff&size=128`} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <div style={{ color: "white", fontSize: "22px", fontWeight: 950 }}>{u.name}</div>
          <div style={{ color: "#999", fontSize: "13px", overflowWrap: "anywhere" }}>{u.email}{u.username ? ` · @${u.username}` : ""} · {u.member_number || "No member number"}</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
            <span style={pill("#FF5500")}>{(u.role || "athlete").replace(/_/g, " ")}</span>
            <StatusPill status={u.account_status || "active"} />
            {data.activeMembership && <span style={pill("#22c55e")}>{data.activeMembership.tier} plan</span>}
            {data.rewards?.isAmbassador && <span style={pill("#FF6A00")}>🎖️ AMPEX Ambassador</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" style={ui.btn} onClick={() => openCompose("message")}><MessageSquare size={15} /> Message</button>
          <button type="button" style={ui.btnGhost} onClick={() => openCompose("email")}><Mail size={15} /> Email</button>
          {u.username && <Link to={`/profile/${u.username}`} target="_blank" rel="noreferrer" style={{ ...ui.btnGhost, textDecoration: "none" }}><ExternalLink size={15} /> Public profile</Link>}
          <button type="button" style={ui.iconBtn} onClick={load} aria-label="Refresh"><RefreshCw size={15} /></button>
        </div>
      </div>

      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      {compose && (
        <div style={{ ...ui.card, padding: "20px", borderColor: "rgba(255,85,0,0.3)" }}>
          <div style={{ color: "white", fontWeight: 900, marginBottom: "12px" }}>
            {compose.mode === "message" ? `Send a message to ${u.name} (arrives in their Messages on the site)` : `Email ${u.email || "(no email address)"}`}
          </div>
          {compose.mode === "email" && data.emailService && <div style={{ color: "#888", fontSize: "12px", marginBottom: "10px" }}>From {data.emailFrom}. The email is saved under Admin → Email Members.</div>}
          <input style={{ ...ui.input, marginBottom: "10px" }} placeholder="Subject" aria-label="Subject" maxLength={200} value={compose.subject}
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            onChange={(e) => setCompose({ ...compose, subject: e.target.value })} />
          <textarea style={{ ...ui.input, minHeight: "120px", resize: "vertical" }} placeholder="Write your message…" aria-label="Message" value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} />
          {composeError && <div role="alert" style={{ color: "#f87171", fontSize: "13px", fontWeight: 700, marginTop: "8px" }}>{composeError}</div>}
          {compose.mode === "email" && !data.emailService && (
            <div style={{ color: "#aaa", fontSize: "12px", marginTop: "8px", lineHeight: 1.5 }}>
              Email from the site is not switched on yet (the Gmail App Password for ampexworldrecords@gmail.com still has to be added on the server). Until then, "Open in my email app" opens your own email program with this message filled in.
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
            {compose.mode === "email" && !data.emailService
              ? <a href={mailto(compose.subject, compose.body)} style={{ ...ui.btn, textDecoration: "none" }}><Mail size={15} /> Open in my email app</a>
              : <button type="button" style={ui.btn} disabled={sending} onClick={send}><Send size={15} /> {sending ? "Sending…" : compose.mode === "message" ? "Send message" : "Send email"}</button>}
            <button type="button" style={ui.btnGhost} disabled={sending} onClick={() => setCompose(null)}>Cancel</button>
          </div>
        </div>
      )}

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
            <Stat label="Global rank" value={data.ranking?.global_rank ? `#${data.ranking.global_rank}` : "—"} color="#FFD700" />
            <Stat label="Points" value={data.ranking?.total_points ?? 0} />
            <Stat label="Verified records" value={data.ranking?.verified_records_count ?? 0} color="#22c55e" />
            <Stat label="Tier" value={data.ranking?.tier_badge || "Challenger"} />
            <Stat label="Reward points" value={data.rewards?.points ?? 0} color="#FF6A00" />
          </div>
          <div style={{ ...ui.card, padding: "8px 20px" }}>
            <Row label="Member since" value={fmtDate(u.created_at)} />
            <Row label="Last login" value={u.last_login_at ? fmtDate(u.last_login_at) : "—"} />
            <Row label="Phone" value={u.phone} />
            <Row label="Date of birth" value={u.dob ? fmtDate(u.dob) : ""} />
            <Row label="Gender" value={u.gender} />
            <Row label="Address" value={address} />
            <Row label="Height / weight" value={[formatHeight(u.height, u.height_unit), formatWeight(u.weight, u.weight_unit)].filter(Boolean).join(" · ")} />
            <Row label="Promotional emails" value={u.marketing_opt_out ? "Opted out (gets account emails only)" : "Subscribed"} />
            {u.account_status !== "active" && <Row label="Suspension" value={[u.suspension_reason, u.suspended_until && `until ${fmtDate(u.suspended_until)}`].filter(Boolean).join(" ")} />}
          </div>
        </>
      )}

      {tab === "records" && (data.records.length ? (
        <Table head={["Record", "Category", "Result", "Status", "Submitted", "Verified"]}>
          {data.records.map((r) => (
            <tr key={r.id}>
              <td style={ui.td}><Link to={`/record/${r.id}`} target="_blank" rel="noreferrer" style={{ color: "white", fontWeight: 700 }}>{r.title}</Link>{r.record_type === "challenge" && <span style={{ ...pill("#38bdf8"), marginLeft: 6 }}>challenge</span>}</td>
              <td style={ui.td}>{r.category}</td>
              <td style={ui.td}>{[r.value, r.unit].filter(Boolean).join(" ")}</td>
              <td style={ui.td}><StatusPill status={r.status} /></td>
              <td style={ui.td}>{fmtDate(r.created_at)}</td>
              <td style={ui.td}>{fmtDate(r.verified_at)}</td>
            </tr>
          ))}
        </Table>
      ) : <Empty>No record submissions yet.</Empty>)}

      {tab === "membership" && (
        <>
          {data.memberships.length ? (
            <Table head={["Plan", "Status", "Started", "Ends"]} minWidth={480}>
              {data.memberships.map((m) => (
                <tr key={m.id}>
                  <td style={ui.td}>{m.tier}</td>
                  <td style={ui.td}><StatusPill status={m.status} /></td>
                  <td style={ui.td}>{fmtDate(m.start_date)}</td>
                  <td style={ui.td}>{m.end_date ? fmtDate(m.end_date) : "No end date"}</td>
                </tr>
              ))}
            </Table>
          ) : <Empty>Free plan: no membership purchases.</Empty>}
          {data.payments.length > 0 && (
            <Table head={["Date", "What", "Amount", "Status", "Reference"]} minWidth={560}>
              {data.payments.map((p, i) => (
                <tr key={i}>
                  <td style={ui.td}>{fmtDate(p.date)}</td>
                  <td style={ui.td}>{p.kind}{p.plan ? ` · ${p.plan}` : ""}</td>
                  <td style={ui.td}>{fmtMoney(p.amount)}</td>
                  <td style={ui.td}><StatusPill status={p.status === "completed" ? "paid" : p.status} /></td>
                  <td style={{ ...ui.td, color: "#888", fontSize: "12px" }}>{p.reference}</td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}

      {tab === "orders" && (data.orders.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.orders.map((o) => (
            <div key={o.id} style={{ ...ui.card, padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                <span style={{ color: "white", fontWeight: 800 }}>Order {String(o.id).slice(0, 8).toUpperCase()} · {fmtDate(o.created_at)}</span>
                <span style={{ display: "flex", gap: "6px", alignItems: "center" }}><StatusPill status={o.payment_status} /><StatusPill status={o.shipping_status} /><strong style={{ color: "#FF6A00" }}>{fmtMoney(o.total)}</strong></span>
              </div>
              {(o.items || []).map((it, i) => (
                <div key={i} style={{ color: "#ccc", fontSize: "13px", padding: "4px 0" }}>
                  {it.quantity}× {it.product_name}{it.size ? ` (${it.size})` : ""} — {fmtMoney(it.price)}
                  {it.notes && <div style={{ color: "#fbbf24", fontSize: "12px", marginTop: "2px", whiteSpace: "pre-wrap" }}>💬 {it.notes}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : <Empty>No shop orders.</Empty>)}

      {tab === "certificates" && (data.certificates.length ? (
        <Table head={["Number", "Record", "Status", "Issued"]} minWidth={480}>
          {data.certificates.map((c) => (
            <tr key={c.id}>
              <td style={ui.td}><Link to={`/certificate/${c.certificate_number}`} target="_blank" rel="noreferrer" style={{ color: "white", fontWeight: 700 }}>{c.certificate_number}</Link></td>
              <td style={ui.td}>{c.record_title}</td>
              <td style={ui.td}><StatusPill status={c.status} /></td>
              <td style={ui.td}>{fmtDate(c.issued_at || c.created_at)}</td>
            </tr>
          ))}
        </Table>
      ) : <Empty>No certificates issued yet.</Empty>)}

      {tab === "rewards" && (data.rewards ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
          <Stat label="Reward level" value={data.rewards.level} color="#FF6A00" />
          <Stat label="Discount" value={`${data.rewards.discountPercent}%`} />
          <Stat label="Points" value={data.rewards.points} />
          <Stat label="Lifetime earned" value={data.rewards.lifetimeEarned} />
          <Stat label="Referral code" value={data.rewards.referralCode || "—"} />
          <Stat label="Referred by" value={data.rewards.referredBy?.name || "—"} />
        </div>
      ) : <Empty>The rewards program is not set up yet.</Empty>)}

      {tab === "messages" && (data.messages.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.messages.map((m) => (
            <div key={m.id} style={{ ...ui.card, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <strong style={{ color: "white" }}>{m.subject}</strong>
                <span style={{ color: "#888", fontSize: "12px" }}>{fmtDate(m.created_at)} · {m.is_read ? "Read" : "Unread"}</span>
              </div>
              <div style={{ color: "#bbb", fontSize: "13px", marginTop: "6px", whiteSpace: "pre-wrap" }}>{m.body}</div>
            </div>
          ))}
        </div>
      ) : <Empty>No messages sent to this member yet.</Empty>)}

      {tab === "awards" && ((data.awards || []).length ? (
        <Table head={["Award", "Number", "Date", "Shown"]} minWidth={480}>
          {data.awards.map((a) => (
            <tr key={a.id}>
              <td style={ui.td}>{a.award?.icon} {a.title_override || a.award?.title}</td>
              <td style={{ ...ui.td, fontFamily: "monospace", fontSize: 12 }}>{a.award_number}</td>
              <td style={ui.td}>{fmtDate(a.award_date)}</td>
              <td style={ui.td}>{a.award?.status === "published" ? <span style={pill("#22c55e")}>on profile</span> : <span style={pill("#fbbf24")}>award is a draft</span>}</td>
            </tr>
          ))}
        </Table>
      ) : <Empty>No achievement awards yet. Give one under Admin → Achievement Awards.</Empty>)}

      {tab === "emails" && ((data.emails || []).length ? (
        <Table head={["Date", "Subject", "Type", "Status"]} minWidth={520}>
          {data.emails.map((e) => (
            <tr key={e.id}>
              <td style={ui.td}>{fmtDate(e.sent_at || e.created_at)}</td>
              <td style={ui.td}>{e.campaign?.subject}</td>
              <td style={ui.td}>{e.campaign?.kind === "marketing" ? "Promotional" : "Account"}</td>
              <td style={ui.td}><span style={pill(e.status === "sent" ? "#22c55e" : e.status === "failed" ? "#ef4444" : "#38bdf8")}>{e.status}</span>{e.error && <div style={{ color: "#f87171", fontSize: 11, marginTop: 4 }}>{e.error}</div>}</td>
            </tr>
          ))}
        </Table>
      ) : <Empty>No emails sent to this member from the site yet.</Empty>)}

      {tab === "appeals" && ((data.appeals || []).length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.appeals.map((a) => (
            <div key={a.id} style={{ ...ui.card, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <strong style={{ color: "white" }}>{a.record?.title || "Record"}</strong>
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}><StatusPill status={a.status} />{a.priority && <span style={pill("#aaa")}>{a.priority}</span>}<span style={{ color: "#888", fontSize: "12px" }}>{fmtDate(a.created_at)}</span></span>
              </div>
              <div style={{ color: "#bbb", fontSize: "13px", marginTop: "6px", whiteSpace: "pre-wrap" }}>{a.appeal_reason}</div>
              {a.admin_notes && <div style={{ color: "#fbbf24", fontSize: "12px", marginTop: "6px" }}>Admin notes: {a.admin_notes}</div>}
            </div>
          ))}
          <Link to="/admin?tab=appeals" style={{ ...ui.btnGhost, textDecoration: "none", alignSelf: "flex-start" }}>Open Appeals to handle them</Link>
        </div>
      ) : <Empty>This member has no appeals or disputes.</Empty>)}

      {tab === "manage" && (
        <div style={{ ...ui.card, padding: "20px", display: "grid", gap: "16px", maxWidth: "560px" }}>
          <div style={{ color: "white", fontWeight: 900 }}>Profile photo</div>
          <ImageUploadField label="Upload a new photo" value={photo ?? u.profile_image ?? ""} onChange={setPhoto} previewHeight={140} />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button type="button" style={ui.btn} disabled={savingPhoto || photo === null} onClick={() => savePhoto(photo)}>{savingPhoto ? "Saving…" : "Save photo"}</button>
            {u.profile_image && <button type="button" style={ui.btnDanger} disabled={savingPhoto} onClick={() => { if (window.confirm(`Remove ${u.name}'s profile photo?`)) savePhoto(""); }}>Remove photo</button>}
          </div>
          <div style={{ color: "#888", fontSize: "12px", lineHeight: 1.5 }}>To change the name, email, plan, height or weight, use "Edit User Details" in the member's ⋮ menu.</div>
        </div>
      )}
    </div>
  );
}
