// Admin → Achievement Awards: create custom awards (separate from World Record certificates),
// preview them, publish them, give them to members, and download or remove them.
import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, Download, Award, Pencil, UserPlus } from "lucide-react";
import { ui, pill, useAdminApi, Notice, Empty, Modal, SectionHeader, Field, Table, fmtDate } from "./adminUi";
import ImageUploadField from "./ImageUploadField";
import MemberPicker from "./MemberPicker";
import { drawAward, downloadAwardPdf, DEFAULT_SIGNERS, awardFromRow as toDrawable } from "../../utils/awardPdf";

const BLANK = {
  title: "", description: "", icon: "🏆", image_url: "", background_url: "", orientation: "landscape", color: "#FF6A00",
  signer1_name: DEFAULT_SIGNERS[0].name, signer1_title: DEFAULT_SIGNERS[0].title, signer1_signature_url: DEFAULT_SIGNERS[0].signatureUrl,
  signer2_name: DEFAULT_SIGNERS[1].name, signer2_title: DEFAULT_SIGNERS[1].title, signer2_signature_url: DEFAULT_SIGNERS[1].signatureUrl,
  status: "draft",
};
const ICONS = ["🏆", "👑", "🥇", "🥈", "🥉", "⭐", "🎖️", "🏅", "💪", "🔥", "⚡", "🚀", "🎯", "🦁", "📜"];
const today = () => new Date().toISOString().slice(0, 10);

function Preview({ award, height = 260 }) {
  const ref = useRef(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      if (!ref.current) return;
      drawAward(ref.current, award, { width: 1100 }).then(() => alive && setError("")).catch((e) => alive && setError(e.message));
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [award]);
  return (
    <div>
      <canvas ref={ref} style={{ width: "100%", maxHeight: height * 2.2, objectFit: "contain", borderRadius: 10, background: "#000", display: "block" }} />
      {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{error}</div>}
    </div>
  );
}

function AwardEditor({ initial, onClose, onSaved }) {
  const api = useAdminApi();
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e?.target ? e.target.value : e });

  const save = async (status) => {
    if (!form.title.trim()) { setError("Give the award a title."); return; }
    setSaving(true); setError("");
    try {
      const body = { ...form, status };
      const saved = form.id ? await api(`/admin/awards/${form.id}`, "PUT", body) : await api("/admin/awards", "POST", body);
      onSaved(saved, status);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <Modal title={form.id ? "Edit award" : "New achievement award"} onClose={onClose} width={980}
      footer={<>
        <button type="button" style={ui.btnGhost} onClick={onClose}>Cancel</button>
        <button type="button" style={ui.btnGhost} disabled={saving} onClick={() => save("draft")}>{saving ? "Saving…" : "Save as draft"}</button>
        <button type="button" style={ui.btn} disabled={saving} onClick={() => save("published")}>{saving ? "Saving…" : form.status === "published" ? "Save" : "Publish"}</button>
      </>}>
      {error && <Notice type="error">{error}</Notice>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Award title"><input style={ui.input} value={form.title} onChange={set("title")} placeholder="e.g. Iron Will Award" maxLength={120} /></Field>
          <Field label="Description (printed on the award)"><textarea style={{ ...ui.input, minHeight: 90, resize: "vertical" }} value={form.description} onChange={set("description")} maxLength={1200} placeholder="What this award recognises" /></Field>
          <Field label="Badge icon">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ICONS.map((i) => (
                <button key={i} type="button" onClick={() => setForm({ ...form, icon: i })} aria-pressed={form.icon === i} style={{ fontSize: 20, width: 40, height: 40, borderRadius: 10, cursor: "pointer", background: form.icon === i ? "rgba(255,85,0,0.2)" : "rgba(255,255,255,0.04)", border: form.icon === i ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.08)" }}>{i}</button>
              ))}
            </div>
          </Field>
          <ImageUploadField label="Badge image (optional, replaces the icon)" value={form.image_url} onChange={set("image_url")} previewHeight={90} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Layout">
              <select style={ui.input} value={form.orientation} onChange={set("orientation")}>
                <option value="landscape">Landscape (11 × 8.5 in)</option>
                <option value="portrait">Portrait (8.5 × 11 in)</option>
              </select>
            </Field>
            <Field label="Accent colour"><input type="color" value={form.color} onChange={set("color")} style={{ ...ui.input, padding: 4, height: 44 }} /></Field>
          </div>
          <ImageUploadField label="Own award design (optional full-page background)" value={form.background_url} onChange={set("background_url")} previewHeight={90} hint="Leave empty to use the AMPEX gold frame. A custom design should leave the middle of the page free for the text." />
          {[1, 2].map((n) => (
            <div key={n} style={{ ...ui.card, padding: 14, display: "grid", gap: 10 }}>
              <div style={{ color: "white", fontWeight: 800, fontSize: 13 }}>Signature {n}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={ui.input} value={form[`signer${n}_name`] || ""} onChange={set(`signer${n}_name`)} placeholder="Name" />
                <input style={ui.input} value={form[`signer${n}_title`] || ""} onChange={set(`signer${n}_title`)} placeholder="Title" />
              </div>
              <ImageUploadField label="Signature image (PNG with a transparent background)" value={form[`signer${n}_signature_url`] || ""} onChange={set(`signer${n}_signature_url`)} previewHeight={60} />
            </div>
          ))}
        </div>
        <div style={{ position: "sticky", top: 0 }}>
          <div style={ui.label}>Preview</div>
          <Preview award={toDrawable(form, { recipientName: "Member Name", date: today(), awardNumber: "AWD-2026-PREVIEW" })} />
          <p style={{ ...ui.muted, marginTop: 10, lineHeight: 1.5 }}>Drafts are not shown to members. Published awards appear on the member's profile under Achievements, where they can print or download them.</p>
        </div>
      </div>
    </Modal>
  );
}

function AssignPanel({ award, onClose, onChanged }) {
  const api = useAdminApi();
  const [list, setList] = useState(null);
  const [member, setMember] = useState(null);
  const [form, setForm] = useState({ awardDate: today(), recipientName: "", title: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => api(`/admin/awards/${award.id}/members`).then(setList).catch((e) => setNotice({ type: "error", text: e.message })), [api, award.id]);
  useEffect(() => { load(); }, [load]);

  const give = async () => {
    if (!member) { setNotice({ type: "error", text: "Choose a member first." }); return; }
    setBusy(true); setNotice(null);
    try {
      await api(`/admin/awards/${award.id}/assign`, "POST", { userId: member.id, ...form, recipientName: form.recipientName || member.name });
      setNotice({ type: "success", text: award.status === "published" ? `Award given to ${member.name}. It is on their profile and they got a message.` : `Award given to ${member.name}. Publish the award to show it on their profile.` });
      setMember(null); setForm({ awardDate: today(), recipientName: "", title: "", description: "" });
      load(); onChanged();
    } catch (e) { setNotice({ type: "error", text: e.message }); } finally { setBusy(false); }
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove this award from ${row.user?.name || "this member"}? It disappears from their profile.`)) return;
    try { await api(`/admin/member-awards/${row.id}`, "DELETE"); load(); onChanged(); } catch (e) { setNotice({ type: "error", text: e.message }); }
  };

  const download = (row) => downloadAwardPdf(toDrawable(award, {
    title: row.title_override || award.title, description: row.description_override || award.description,
    recipientName: row.recipient_name || row.user?.name, date: row.award_date, awardNumber: row.award_number,
  })).catch((e) => setNotice({ type: "error", text: e.message }));

  return (
    <Modal title={`Give "${award.title}"`} onClose={onClose} width={860}>
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      {award.status !== "published" && <Notice type="info">This award is a draft. Members you give it to will see it once you publish it.</Notice>}
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
        <Field label="Title for this member (optional)"><input style={ui.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={award.title} /></Field>
        <Field label="Description for this member (optional)"><textarea style={{ ...ui.input, minHeight: 70 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={award.description} /></Field>
        {member && <Preview award={toDrawable(award, { title: form.title || award.title, description: form.description || award.description, recipientName: form.recipientName || member.name, date: form.awardDate, awardNumber: "AWD-NEW" })} height={200} />}
        <div><button type="button" style={ui.btn} disabled={busy || !member} onClick={give}><UserPlus size={15} /> {busy ? "Giving…" : "Give award"}</button></div>
      </div>
      <div style={{ color: "white", fontWeight: 900 }}>Members with this award</div>
      {!list ? <div style={ui.muted}>Loading…</div> : list.length === 0 ? <Empty>Nobody has this award yet.</Empty> : (
        <Table head={["Member", "Award no.", "Date", ""]} minWidth={560}>
          {list.map((r) => (
            <tr key={r.id}>
              <td style={ui.td}><strong>{r.recipient_name || r.user?.name}</strong><div style={{ color: "#888", fontSize: 12 }}>{r.user?.email}</div></td>
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
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);
  const [assigning, setAssigning] = useState(null);

  const load = useCallback(() => api("/admin/awards").then((r) => { setAwards(r); setError(""); }).catch((e) => setError(e.message)), [api]);
  useEffect(() => { load(); }, [load]);

  const remove = async (a) => {
    const given = a.given_count ? ` It is also removed from the ${a.given_count} ${a.given_count === 1 ? "member" : "members"} who have it.` : "";
    if (!window.confirm(`Delete the award "${a.title}"?${given} This cannot be undone.`)) return;
    try { await api(`/admin/awards/${a.id}`, "DELETE"); setNotice({ type: "success", text: `"${a.title}" deleted.` }); load(); } catch (e) { setNotice({ type: "error", text: e.message }); }
  };
  const togglePublish = async (a) => {
    try { await api(`/admin/awards/${a.id}`, "PUT", { status: a.status === "published" ? "draft" : "published" }); load(); } catch (e) { setNotice({ type: "error", text: e.message }); }
  };

  return (
    <div>
      <SectionHeader eyebrow="Awards" title="Achievement Awards"
        desc="Make your own awards, give them to members, and let members print them from their profile. These are separate from World Record Certificates."
        actions={<button type="button" style={ui.btn} onClick={() => setEditing({})}><Plus size={15} /> New award</button>} />
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      {error && <Notice type="error">{/relation|does not exist|schema cache/i.test(error) ? "The awards tables are not in the database yet: run the 2026-11-14 migration in Supabase." : error}</Notice>}
      {!awards ? (!error && <div style={ui.muted}>Loading awards…</div>) : awards.length === 0 ? (
        <Empty>No awards yet. Press “New award” to make the first one.</Empty>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {awards.map((a) => (
            <div key={a.id} style={{ ...ui.card, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#0b0b0b", border: `2px solid ${a.color || "#FF6A00"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, overflow: "hidden" }}>
                  {a.image_url ? <img src={a.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : a.icon || <Award size={22} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "white", fontWeight: 900, fontSize: 15, overflowWrap: "anywhere" }}>{a.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={pill(a.status === "published" ? "#22c55e" : "#fbbf24")}>{a.status === "published" ? "Published" : "Draft"}</span>
                    <span style={pill("#aaa")}>{a.given_count} given</span>
                  </div>
                </div>
              </div>
              {a.description && <div style={{ color: "#999", fontSize: 13, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.description}</div>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
                <button type="button" style={ui.btn} onClick={() => setAssigning(a)}><UserPlus size={14} /> Give to member</button>
                <button type="button" style={ui.btnGhost} onClick={() => setEditing(a)}><Pencil size={14} /> Edit</button>
                <button type="button" style={ui.btnGhost} onClick={() => togglePublish(a)}>{a.status === "published" ? "Unpublish" : "Publish"}</button>
                <button type="button" style={ui.btnGhost} onClick={() => downloadAwardPdf(toDrawable(a, { recipientName: "Member Name", date: today(), awardNumber: "AWD-SAMPLE" })).catch((e) => setNotice({ type: "error", text: e.message }))}><Download size={14} /> Sample PDF</button>
                <button type="button" style={ui.btnDanger} onClick={() => remove(a)} aria-label={`Delete ${a.title}`}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <AwardEditor initial={editing} onClose={() => setEditing(null)} onSaved={(saved, status) => {
          setEditing(null); load();
          setNotice({ type: "success", text: status === "published" ? `"${saved.title}" is published.` : `"${saved.title}" saved as a draft.` });
        }} />
      )}
      {assigning && <AssignPanel award={assigning} onClose={() => setAssigning(null)} onChanged={load} />}
    </div>
  );
}
