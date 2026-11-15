// Admin → Achievement Awards: the award catalog. Every award has its design (the AMPEX award design, or
// artwork uploaded from the computer), an optional automatic criterion (members who qualify get it on
// their profile), and can also be given by hand. Separate from World Record certificates.
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Download, Pencil, UserPlus, Zap } from "lucide-react";
import { ui, pill, useAdminApi, Notice, Empty, Modal, SectionHeader, Field, Table, fmtDate } from "./adminUi";
import ImageUploadField from "./ImageUploadField";
import MemberPicker from "./MemberPicker";
import AwardPreview from "../AwardPreview";
import { downloadAwardPdf, awardFromRow as toDrawable } from "../../utils/awardPdf";

const BLANK = { title: "", description: "", icon: "🏆", background_url: "", design: "template", criteria: "manual", criteria_value: "", status: "draft", sort_order: 100 };
const ICONS = ["🏆", "👑", "🥇", "🥈", "🥉", "⭐", "🎖️", "🏅", "📜", "💪", "🔥", "⚡", "🚀", "🎯", "🦁"];
const today = () => new Date().toISOString().slice(0, 10);
const sample = (a, extra = {}) => toDrawable(a, { recipientName: "Member Name", date: today(), awardNumber: "AWD-2026-SAMPLE", ...extra });

function AwardEditor({ initial, criteria, onClose, onSaved }) {
  const api = useAdminApi();
  const [form, setForm] = useState({ ...BLANK, ...initial, criteria_value: initial.criteria_value ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e?.target ? e.target.value : e });
  const rule = criteria.find((c) => c.value === form.criteria);

  const save = async (status) => {
    if (!form.title.trim()) { setError("Give the award a title."); return; }
    if (form.design === "artwork" && !form.background_url) { setError("Upload the award artwork, or choose the AMPEX award design."); return; }
    setSaving(true); setError("");
    try {
      const body = { ...form, status, criteria_value: form.criteria_value === "" ? null : Number(form.criteria_value) };
      const saved = form.id ? await api(`/admin/awards/${form.id}`, "PUT", body) : await api("/admin/awards", "POST", body);
      onSaved(saved, status);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <Modal title={form.id ? `Edit: ${initial.title}` : "New achievement award"} onClose={onClose} width={1000}
      footer={<>
        <button type="button" style={ui.btnGhost} onClick={onClose}>Cancel</button>
        <button type="button" style={ui.btnGhost} disabled={saving} onClick={() => save("draft")}>{saving ? "Saving…" : "Save as draft"}</button>
        <button type="button" style={ui.btn} disabled={saving} onClick={() => save("published")}>{saving ? "Saving…" : form.status === "published" ? "Save" : "Publish"}</button>
      </>}>
      {error && <Notice type="error">{error}</Notice>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Award name"><input style={ui.input} value={form.title} onChange={set("title")} placeholder="e.g. Iron Will Achievement Award" maxLength={120} /></Field>
          <Field label="Design">
            <div style={{ display: "grid", gap: 8 }}>
              {[["template", "AMPEX award design", "The site writes the award name and description on the AMPEX design."], ["artwork", "Upload my own finished artwork", "A complete design from your computer (name and text already on it). The site writes the member's name, date and award number."]].map(([v, l, d]) => (
                <label key={v} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", ...ui.card, padding: 12, borderColor: form.design === v ? "#FF5500" : "rgba(255,255,255,0.06)" }}>
                  <input type="radio" name="design" checked={form.design === v} onChange={() => setForm({ ...form, design: v })} style={{ marginTop: 3 }} />
                  <span><span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>{l}</span><span style={{ display: "block", color: "#888", fontSize: 12, marginTop: 2, lineHeight: 1.4 }}>{d}</span></span>
                </label>
              ))}
            </div>
          </Field>
          {form.design === "artwork" && (
            <ImageUploadField label="Award artwork (portrait, 8.5 × 11)" value={form.background_url || ""} onChange={set("background_url")} previewHeight={160}
              hint="Leave the line under “Presented to” empty: the member's name is written there." />
          )}
          <Field label={form.design === "artwork" ? "Description (shown on the profile)" : "Description (printed on the award)"}>
            <textarea style={{ ...ui.input, minHeight: 90, resize: "vertical" }} value={form.description} onChange={set("description")} maxLength={1200} placeholder="What this award recognises" />
          </Field>
          <Field label="Given automatically when">
            <select style={ui.input} value={form.criteria} onChange={(e) => setForm({ ...form, criteria: e.target.value, criteria_value: "" })}>
              {criteria.map((c) => <option key={c.value} value={c.value}>{c.value === "manual" ? "Never automatically: an admin gives it" : c.label}</option>)}
            </select>
          </Field>
          {rule?.needsNumber && (
            <Field label="How many" hint="For example: top 10 in at least 3 categories.">
              <input type="number" min="1" max="999" style={ui.input} value={form.criteria_value} onChange={set("criteria_value")} placeholder="1" />
            </Field>
          )}
          <Field label="Badge icon (small icon on the profile)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ICONS.map((i) => (
                <button key={i} type="button" onClick={() => setForm({ ...form, icon: i })} aria-pressed={form.icon === i} style={{ fontSize: 18, width: 36, height: 36, borderRadius: 10, cursor: "pointer", background: form.icon === i ? "rgba(255,85,0,0.2)" : "rgba(255,255,255,0.04)", border: form.icon === i ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.08)" }}>{i}</button>
              ))}
            </div>
          </Field>
          <Field label="Order in the list (lower shows first)"><input type="number" style={ui.input} value={form.sort_order} onChange={set("sort_order")} /></Field>
        </div>
        <div style={{ position: "sticky", top: 0 }}>
          <div style={ui.label}>Preview</div>
          <AwardPreview award={sample(form)} width={900} />
          <p style={{ ...ui.muted, marginTop: 10, lineHeight: 1.5 }}>Drafts are hidden from members. Published awards show on member profiles under Achievements, where members can print them.</p>
        </div>
      </div>
    </Modal>
  );
}

function AssignPanel({ award, onClose, onChanged }) {
  const api = useAdminApi();
  const [list, setList] = useState(null);
  const [member, setMember] = useState(null);
  const [form, setForm] = useState({ awardDate: today(), recipientName: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => api(`/admin/awards/${award.id}/members`).then(setList).catch((e) => setNotice({ type: "error", text: e.message })), [api, award.id]);
  useEffect(() => { load(); }, [load]);

  const give = async () => {
    if (!member) { setNotice({ type: "error", text: "Choose a member first." }); return; }
    if (list?.some((r) => r.user?.id === member.id) && !window.confirm(`${member.name} already has this award. Give it again?`)) return;
    setBusy(true); setNotice(null);
    try {
      await api(`/admin/awards/${award.id}/assign`, "POST", { userId: member.id, ...form, recipientName: form.recipientName || member.name });
      setNotice({ type: "success", text: award.status === "published" ? `Award given to ${member.name}. It is on their profile and they got a message.` : `Award given to ${member.name}. Publish the award to show it on their profile.` });
      setMember(null); setForm({ awardDate: today(), recipientName: "" });
      load(); onChanged();
    } catch (e) { setNotice({ type: "error", text: e.message }); } finally { setBusy(false); }
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove this award from ${row.user?.name || "this member"}? It disappears from their profile.${row.auto ? " It was given automatically, so it comes back if they still qualify." : ""}`)) return;
    try { await api(`/admin/member-awards/${row.id}`, "DELETE"); load(); onChanged(); } catch (e) { setNotice({ type: "error", text: e.message }); }
  };

  const download = (row) => downloadAwardPdf(toDrawable(award, {
    title: row.title_override || award.title, description: row.description_override || award.description,
    recipientName: row.recipient_name || row.user?.name, date: row.award_date, awardNumber: row.award_number,
  })).catch((e) => setNotice({ type: "error", text: e.message }));

  return (
    <Modal title={`Give “${award.title}”`} onClose={onClose} width={880}>
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      {award.status !== "published" && <Notice type="info">This award is a draft. Members you give it to see it once you publish it.</Notice>}
      <div style={{ ...ui.card, padding: 16, display: "grid", gap: 12 }}>
        <Field label="Member">
          {member ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, ...ui.input }}>
              <span><strong>{member.name}</strong> <span style={{ color: "#888" }}>{member.email}</span></span>
              <button type="button" style={ui.btnGhost} onClick={() => setMember(null)}>Change</button>
            </div>
          ) : <MemberPicker onPick={(u) => { setMember(u); setForm((f) => ({ ...f, recipientName: u.name || "" })); }} />}
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <Field label="Name printed on the award"><input style={ui.input} value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} placeholder="Member's name" /></Field>
          <Field label="Award date"><input type="date" style={{ ...ui.input, colorScheme: "dark" }} value={form.awardDate} onChange={(e) => setForm({ ...form, awardDate: e.target.value })} /></Field>
        </div>
        {member && <div style={{ maxWidth: 360 }}><AwardPreview award={toDrawable(award, { recipientName: form.recipientName || member.name, date: form.awardDate, awardNumber: "AWD-NEW" })} width={700} /></div>}
        <div><button type="button" style={ui.btn} disabled={busy || !member} onClick={give}><UserPlus size={15} /> {busy ? "Giving…" : "Give award"}</button></div>
      </div>
      <div style={{ color: "white", fontWeight: 900 }}>Members with this award</div>
      {!list ? <div style={ui.muted}>Loading…</div> : list.length === 0 ? <Empty>Nobody has this award yet.</Empty> : (
        <Table head={["Member", "Award no.", "Date", ""]} minWidth={560}>
          {list.map((r) => (
            <tr key={r.id}>
              <td style={ui.td}><strong>{r.recipient_name || r.user?.name}</strong><div style={{ color: "#888", fontSize: 12 }}>{r.user?.email}{r.auto ? " · automatic" : ""}</div></td>
              <td style={{ ...ui.td, fontFamily: "monospace", fontSize: 12 }}>{r.award_number}</td>
              <td style={ui.td}>{fmtDate(r.award_date)}</td>
              <td style={{ ...ui.td, textAlign: "right", whiteSpace: "nowrap" }}>
                <button type="button" style={ui.iconBtn} onClick={() => download(r)} aria-label="Download PDF" title="Download PDF"><Download size={15} /></button>{" "}
                <button type="button" style={{ ...ui.iconBtn, color: "#ef4444" }} onClick={() => remove(r)} aria-label="Remove" title="Remove from member"><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Modal>
  );
}

export default function AdminAchievementAwards() {
  const api = useAdminApi();
  const [awards, setAwards] = useState(null);
  const [criteria, setCriteria] = useState([{ value: "manual", label: "Given by an admin" }]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(() => api("/admin/awards").then((r) => { setAwards(r); setError(""); }).catch((e) => setError(e.message)), [api]);
  useEffect(() => {
    load();
    api("/admin/awards/criteria").then(setCriteria).catch(() => {});
  }, [api, load]);

  const remove = async (a) => {
    const given = a.given_count ? ` It is also removed from the ${a.given_count} ${a.given_count === 1 ? "member" : "members"} who have it.` : "";
    if (!window.confirm(`Delete “${a.title}”?${given} This cannot be undone.`)) return;
    try { await api(`/admin/awards/${a.id}`, "DELETE"); setNotice({ type: "success", text: `“${a.title}” deleted.` }); load(); } catch (e) { setNotice({ type: "error", text: e.message }); }
  };
  const togglePublish = async (a) => {
    try {
      const r = await api(`/admin/awards/${a.id}`, "PUT", { status: a.status === "published" ? "draft" : "published" });
      if (r.granted) setNotice({ type: "success", text: `Published. ${r.granted} qualifying ${r.granted === 1 ? "member got" : "members got"} it.` });
      load();
    } catch (e) { setNotice({ type: "error", text: e.message }); }
  };
  const syncNow = async () => {
    setSyncing(true);
    try { const r = await api("/admin/awards/sync", "POST", {}); setNotice({ type: "success", text: r.message }); load(); }
    catch (e) { setNotice({ type: "error", text: e.message }); } finally { setSyncing(false); }
  };

  return (
    <div>
      <SectionHeader eyebrow="Awards" title="Achievement Awards"
        desc="The award catalog. Members who meet an award's criteria get it on their profile automatically; you can also give any award by hand. Separate from World Record Certificates."
        actions={<>
          <button type="button" style={ui.btnGhost} disabled={syncing} onClick={syncNow}><Zap size={15} /> {syncing ? "Checking…" : "Give automatic awards now"}</button>
          <button type="button" style={ui.btn} onClick={() => setEditing({})}><Plus size={15} /> New award</button>
        </>} />
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      {error && <Notice type="error">{error}</Notice>}
      {!awards ? (!error && <div style={ui.muted}>Loading awards…</div>) : awards.length === 0 ? (
        <Empty>No awards yet. Press “New award” to make the first one.</Empty>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 18 }}>
          {awards.map((a) => (
            <div key={a.id} style={{ ...ui.card, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <button type="button" onClick={() => setEditing(a)} aria-label={`Edit ${a.title}`} style={{ padding: 0, border: "none", background: "none", cursor: "pointer" }}>
                <AwardPreview award={sample(a)} width={420} />
              </button>
              <div style={{ color: "white", fontWeight: 900, fontSize: 15, overflowWrap: "anywhere" }}>{a.icon} {a.title}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={pill(a.status === "published" ? "#22c55e" : "#fbbf24")}>{a.status === "published" ? "Published" : "Draft"}</span>
                <span style={pill("#aaa")}>{a.given_count} given</span>
                <span style={pill("#38bdf8")}>{a.design === "artwork" ? "Uploaded artwork" : a.design === "template" ? "AMPEX design" : "Older design"}</span>
              </div>
              <div style={{ color: "#bbb", fontSize: 12, lineHeight: 1.45 }}><strong style={{ color: "#888" }}>Earned by: </strong>{a.criteria === "manual" ? "Given by an admin" : `${a.criteria_label} (automatic)`}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                <button type="button" style={ui.btn} onClick={() => setAssigning(a)}><UserPlus size={14} /> Give</button>
                <button type="button" style={ui.btnGhost} onClick={() => setEditing(a)}><Pencil size={14} /> Edit</button>
                <button type="button" style={ui.btnGhost} onClick={() => togglePublish(a)}>{a.status === "published" ? "Unpublish" : "Publish"}</button>
                <button type="button" style={ui.iconBtn} title="Sample PDF" aria-label="Download a sample PDF" onClick={() => downloadAwardPdf(sample(a)).catch((e) => setNotice({ type: "error", text: e.message }))}><Download size={14} /></button>
                <button type="button" style={{ ...ui.iconBtn, color: "#ef4444" }} onClick={() => remove(a)} aria-label={`Delete ${a.title}`} title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <AwardEditor initial={editing} criteria={criteria} onClose={() => setEditing(null)} onSaved={(saved, status) => {
          setEditing(null); load();
          const extra = saved.granted ? ` ${saved.granted} qualifying ${saved.granted === 1 ? "member got" : "members got"} it.` : "";
          setNotice({ type: "success", text: status === "published" ? `“${saved.title}” is published.${extra}` : `“${saved.title}” saved as a draft.` });
        }} />
      )}
      {assigning && <AssignPanel award={assigning} onClose={() => setAssigning(null)} onChanged={load} />}
    </div>
  );
}
