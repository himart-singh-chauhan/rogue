// Admin → Email Members: email one member, a hand-picked list, a group or everyone from the AMPEX address.
// Account emails reach everyone; promotional emails (promotions, challenges) skip members who opted out.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, Mail, RefreshCw, Eye } from "lucide-react";
import { ui, pill, useAdminApi, Notice, Empty, Modal, SectionHeader, Field, Table, fmtDate } from "./adminUi";
import ImageUploadField from "./ImageUploadField";
import MemberPicker from "./MemberPicker";

const STATUS = { sent: ["Sent", "#22c55e"], partial: ["Partly sent", "#fbbf24"], failed: ["Failed", "#ef4444"], sending: ["Sending", "#38bdf8"] };
const newKey = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const EMPTY = { subject: "", body: "", imageUrl: "", buttonText: "", buttonUrl: "", kind: "account" };
const isWebLink = (u) => !u || /^https?:\/\/[^\s]+\.[^\s]+/i.test(u.trim());

function EmailPreview({ form }) {
  const lines = (form.body || "").replace(/\{\{\s*name\s*\}\}/gi, "Alex").split("\n");
  return (
    <div style={{ background: "#f4f1ec", borderRadius: 12, padding: 14 }}>
      <div style={{ background: "white", borderRadius: 10, overflow: "hidden", color: "#222", fontFamily: "Arial, sans-serif" }}>
        <div style={{ background: "#0A0A0A", color: "#FF6A00", fontWeight: 900, letterSpacing: 2, textAlign: "center", padding: 14, fontSize: 14 }}>AMPEX WORLD RECORDS</div>
        {form.imageUrl && <img src={form.imageUrl} alt="" style={{ width: "100%", display: "block" }} />}
        <div style={{ padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>{(form.subject || "Subject").replace(/\{\{\s*name\s*\}\}/gi, "Alex")}</div>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>{lines.map((l, i) => <div key={i}>{l || " "}</div>)}</div>
          {form.buttonUrl && <div style={{ marginTop: 18 }}><span style={{ display: "inline-block", background: "#FF6A00", color: "white", fontWeight: 800, padding: "10px 20px", borderRadius: 100, fontSize: 13 }}>{form.buttonText || "Open"}</span></div>}
        </div>
        <div style={{ borderTop: "1px solid #eee", padding: "12px 18px", color: "#888", fontSize: 11 }}>
          {form.kind === "marketing" ? "Includes an unsubscribe link for promotional emails." : "Account email: reaches every chosen member."}
        </div>
      </div>
    </div>
  );
}

function CampaignDetail({ id, onClose }) {
  const api = useAdminApi();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api(`/admin/emails/${id}`).then(setData).catch((e) => setError(e.message)); }, [api, id]);
  return (
    <Modal title={data?.campaign?.subject || "Email"} onClose={onClose} width={760}>
      {error && <Notice type="error">{error}</Notice>}
      {!data ? !error && <div style={ui.muted}>Loading…</div> : (
        <>
          <div style={{ color: "#aaa", fontSize: 13 }}>{data.campaign.audience_label} · {data.campaign.kind === "marketing" ? "Promotional" : "Account"} · sent {fmtDate(data.campaign.created_at)} by {data.campaign.sender?.name || "admin"}</div>
          <div style={{ ...ui.card, padding: 14, whiteSpace: "pre-wrap", color: "#ddd", fontSize: 14 }}>{data.campaign.body}</div>
          <Table head={["Member", "Email", "Status"]} minWidth={520}>
            {data.deliveries.map((d) => (
              <tr key={d.id}>
                <td style={ui.td}>{d.name || "—"}</td>
                <td style={{ ...ui.td, fontSize: 12 }}>{d.email}</td>
                <td style={ui.td}><span style={pill(d.status === "sent" ? "#22c55e" : d.status === "failed" ? "#ef4444" : "#38bdf8")}>{d.status}</span>{d.error && <div style={{ color: "#f87171", fontSize: 11, marginTop: 4 }}>{d.error}</div>}</td>
              </tr>
            ))}
          </Table>
        </>
      )}
    </Modal>
  );
}

export default function AdminEmailMembers() {
  const api = useAdminApi();
  const [options, setOptions] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [audType, setAudType] = useState("member");
  const [single, setSingle] = useState(null);
  const [selected, setSelected] = useState([]);
  const [group, setGroup] = useState({ membership: [], role: [], country: "" });
  const [count, setCount] = useState(null);
  const [sending, setSending] = useState(null); // { message, remaining }
  const [notice, setNotice] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [detail, setDetail] = useState(null);
  const keyRef = useRef(newKey());

  const loadHistory = useCallback(() => api("/admin/emails").then((r) => setHistory(r.campaigns || [])).catch(() => {}), [api]);
  useEffect(() => {
    api("/admin/emails/options").then(setOptions).catch((e) => setNotice({ type: "error", text: e.message }));
    loadHistory();
  }, [api, loadHistory]);

  const audience = useMemo(() => {
    if (audType === "member") return single ? { type: "member", userId: single.id } : null;
    if (audType === "selected") return selected.length ? { type: "selected", userIds: selected.map((m) => m.id) } : null;
    if (audType === "group") return { type: "group", ...group };
    return { type: "all" };
  }, [audType, single, selected, group]);

  // Live count of who will get it
  useEffect(() => {
    if (!audience) return undefined;
    let alive = true;
    const t = setTimeout(() => api("/admin/emails/preview", "POST", { audience, kind: form.kind }).then((r) => alive && setCount(r)).catch(() => {}), 300);
    return () => { alive = false; clearTimeout(t); };
  }, [api, audience, form.kind]);

  const validate = () => {
    const e = {};
    if (!audience) e.audience = audType === "member" ? "Choose a member." : "Choose at least one member.";
    if (!form.subject.trim()) e.subject = "Write a subject.";
    if (!form.body.trim()) e.body = "Write the message.";
    if (!isWebLink(form.buttonUrl)) e.buttonUrl = "Use a full web address, starting with https://";
    if (form.buttonUrl && !form.buttonText.trim()) e.buttonText = "Write the button text.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const run = async (first) => {
    let r = first;
    setSending({ message: r.message, remaining: r.remaining });
    while (!r.done) {
      r = await api(`/admin/emails/${r.campaign.id}/continue`, "POST", {});
      setSending({ message: r.message, remaining: r.remaining });
    }
    return r;
  };

  const send = async () => {
    setNotice(null);
    if (!validate()) return;
    const n = audience ? count?.count ?? 0 : 0;
    if (n === 0) { setNotice({ type: "error", text: "Nobody matches this choice." }); return; }
    if (n > 1 && !window.confirm(`Send "${form.subject}" to ${n} members? This cannot be undone.`)) return;
    try {
      const first = await api("/admin/emails", "POST", { ...form, audience, requestKey: keyRef.current });
      const done = await run(first);
      setNotice({ type: done.campaign.failed_count ? "error" : "success", text: first.duplicate ? "This email was already sent (it was not sent twice)." : done.message });
      setForm(EMPTY); setSingle(null); setSelected([]); setErrors({});
      keyRef.current = newKey();
      loadHistory();
    } catch (e) {
      setNotice({ type: "error", text: e.message });
    } finally {
      setSending(null);
    }
  };

  const resume = async (c, retry) => {
    try {
      const first = await api(`/admin/emails/${c.id}/${retry ? "retry" : "continue"}`, "POST", {});
      const done = await run(first);
      setNotice({ type: done.campaign.failed_count ? "error" : "success", text: done.message });
    } catch (e) { setNotice({ type: "error", text: e.message }); } finally { setSending(null); loadHistory(); }
  };

  const toggle = (k, v) => setGroup((g) => ({ ...g, [k]: g[k].includes(v) ? g[k].filter((x) => x !== v) : [...g[k], v] }));
  const chip = (on) => ({ ...ui.btnGhost, padding: "6px 12px", fontSize: 12, background: on ? "rgba(255,85,0,0.18)" : "rgba(255,255,255,0.04)", borderColor: on ? "#FF5500" : "rgba(255,255,255,0.1)" });
  const err = (k) => errors[k] && <div style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>{errors[k]}</div>;

  return (
    <div>
      <SectionHeader eyebrow="Communications" title="Email Members"
        desc={`Emails are sent from ${options?.from || "ampexworldrecords@gmail.com"}. Write {{name}} to put in each member's first name.`} />
      {options && !options.enabled && (
        <Notice type="error">Email is not switched on yet. Add GMAIL_USER and GMAIL_APP_PASSWORD (an App Password for ampexworldrecords@gmail.com) in Vercel, then redeploy.</Notice>
      )}
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
        <div style={{ ...ui.card, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Who gets it">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[["member", "One member"], ["selected", "Selected members"], ["group", "A group"], ["all", "All members"]].map(([v, l]) => (
                <button key={v} type="button" style={chip(audType === v)} onClick={() => setAudType(v)}>{l}</button>
              ))}
            </div>
          </Field>
          {audType === "member" && (single ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, ...ui.input }}>
              <span><strong>{single.name}</strong> <span style={{ color: "#888" }}>{single.email}</span></span>
              <button type="button" style={ui.btnGhost} onClick={() => setSingle(null)}>Change</button>
            </div>
          ) : <MemberPicker onPick={setSingle} />)}
          {audType === "selected" && <MemberPicker multiple value={selected} onChange={setSelected} placeholder="Add members…" />}
          {audType === "group" && options && (
            <div style={{ display: "grid", gap: 12 }}>
              <div><span style={ui.label}>Membership plan (any)</span><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{options.memberships.map((m) => <button key={m} type="button" style={chip(group.membership.includes(m))} onClick={() => toggle("membership", m)}>{m.replace(/_/g, " ")}</button>)}</div></div>
              <div><span style={ui.label}>Role (any)</span><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{options.roles.map((r) => <button key={r} type="button" style={chip(group.role.includes(r))} onClick={() => toggle("role", r)}>{r.replace(/_/g, " ")}</button>)}</div></div>
              <Field label="Country (optional)">
                <select style={ui.input} value={group.country} onChange={(e) => setGroup({ ...group, country: e.target.value })}>
                  <option value="">All countries</option>
                  {options.countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          )}
          {err("audience")}
          {audience && count && <div style={{ color: "#bbb", fontSize: 13 }}><strong style={{ color: "white" }}>{count.count}</strong> {count.count === 1 ? "member" : "members"} will get this{count.skipped ? ` · ${count.skipped} opted out of promotional email` : ""}.</div>}

          <Field label="Type of email">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" style={chip(form.kind === "account")} onClick={() => setForm({ ...form, kind: "account" })}>About their account</button>
              <button type="button" style={chip(form.kind === "marketing")} onClick={() => setForm({ ...form, kind: "marketing" })}>Promotion / challenge</button>
            </div>
          </Field>
          <Field label="Subject"><input style={ui.input} value={form.subject} maxLength={200} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. New challenge: break the deadlift record" />{err("subject")}</Field>
          <Field label="Message"><textarea style={{ ...ui.input, minHeight: 180, resize: "vertical" }} value={form.body} maxLength={20000} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder={"Hi {{name}},\n\n…"} />{err("body")}</Field>
          <ImageUploadField label="Image (optional)" value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} previewHeight={110} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <Field label="Button text"><input style={ui.input} value={form.buttonText} maxLength={60} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} placeholder="View challenge" />{err("buttonText")}</Field>
            <Field label="Button link (optional)"><input style={ui.input} value={form.buttonUrl} onChange={(e) => setForm({ ...form, buttonUrl: e.target.value })} placeholder="https://…" />{err("buttonUrl")}</Field>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" style={ui.btn} disabled={!!sending || (options && !options.enabled)} onClick={send}><Send size={15} /> {sending ? "Sending…" : "Send email"}</button>
            <button type="button" style={ui.btnGhost} onClick={() => setShowPreview((s) => !s)}><Eye size={15} /> {showPreview ? "Hide preview" : "Preview"}</button>
            {sending && <span style={{ color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>{sending.message}</span>}
          </div>
        </div>
        {showPreview && <div><div style={ui.label}>Preview</div><EmailPreview form={form} /></div>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "32px 0 12px" }}>
        <h3 style={ui.h3}>Sent emails</h3>
        <button type="button" style={ui.iconBtn} onClick={loadHistory} aria-label="Refresh"><RefreshCw size={15} /></button>
      </div>
      {history.length === 0 ? <Empty>No emails sent yet.</Empty> : (
        <Table head={["Date", "Subject", "To", "Result", ""]} minWidth={720}>
          {history.map((c) => {
            const [label, color] = STATUS[c.status] || [c.status, "#aaa"];
            return (
              <tr key={c.id}>
                <td style={ui.td}>{fmtDate(c.created_at)}</td>
                <td style={ui.td}><button type="button" onClick={() => setDetail(c.id)} style={{ background: "none", border: "none", color: "white", fontWeight: 800, cursor: "pointer", padding: 0, textAlign: "left" }}><Mail size={13} style={{ verticalAlign: -2 }} /> {c.subject}</button><div style={{ color: "#777", fontSize: 12 }}>{c.kind === "marketing" ? "Promotional" : "Account"} · {c.sender?.name || ""}</div></td>
                <td style={ui.td}>{c.audience_label}</td>
                <td style={ui.td}><span style={pill(color)}>{label}</span><div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>{c.sent_count}/{c.recipient_count} sent{c.failed_count ? ` · ${c.failed_count} failed` : ""}{c.skipped_count ? ` · ${c.skipped_count} opted out` : ""}</div></td>
                <td style={{ ...ui.td, textAlign: "right" }}>
                  {c.status === "sending" && <button type="button" style={ui.btnGhost} disabled={!!sending} onClick={() => resume(c, false)}>Continue</button>}
                  {(c.status === "partial" || c.status === "failed") && <button type="button" style={ui.btnGhost} disabled={!!sending} onClick={() => resume(c, true)}>Retry failed</button>}
                </td>
              </tr>
            );
          })}
        </Table>
      )}
      {detail && <CampaignDetail id={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
