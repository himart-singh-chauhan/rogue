// Admin → System: company details (About / Contact) and social media links (footer icons).
import { useEffect, useState } from "react";
import { apiCall } from "../../utils/api";
import { ui, useAdminApi, Notice, Field } from "./adminUi";
import { clearCompanyCache, SOCIALS } from "../../utils/company";

export default function AdminCompanyProfile() {
  const api = useAdminApi();
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  useEffect(() => { apiCall("/settings/company", "GET").then(setF).catch(() => setF({ emails: {}, social: {} })); }, []);
  if (!f) return null;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setIn = (group, k) => (e) => setF({ ...f, [group]: { ...(f[group] || {}), [k]: e.target.value } });

  const save = async () => {
    setSaving(true);
    try { const r = await api("/admin/company-profile", "PUT", f); setF(r); clearCompanyCache(); setNotice({ type: "success", text: "Saved. About, Contact and the footer now show these details." }); }
    catch (e) { setNotice({ type: "error", text: e.message }); } finally { setSaving(false); }
  };

  return (
    <div style={{ ...ui.card, marginBottom: 24 }}>
      <h3 style={{ ...ui.h3, marginBottom: 4 }}>Company & social links</h3>
      <p style={{ ...ui.muted, margin: "0 0 16px" }}>Shown on About, Contact and in the footer. Anything left empty is not shown on the site.</p>
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <Field label="Official company name"><input style={ui.input} value={f.companyName || ""} onChange={set("companyName")} placeholder="e.g. AMPEX World Records LLC" /></Field>
        <Field label="Business location or service region"><input style={ui.input} value={f.serviceRegion || ""} onChange={set("serviceRegion")} placeholder="e.g. Based in Atlanta, Georgia · Serving athletes worldwide" /></Field>
        <Field label="Founder / CEO name"><input style={ui.input} value={f.founderName || ""} onChange={set("founderName")} /></Field>
        <Field label="Founder / CEO title"><input style={ui.input} value={f.founderTitle || ""} onChange={set("founderTitle")} placeholder="e.g. Founder & CEO" /></Field>
        <Field label="Business address (optional)" style={{ gridColumn: "1 / -1" }}><input style={ui.input} value={f.address || ""} onChange={set("address")} /></Field>
        <Field label="About the founder" style={{ gridColumn: "1 / -1" }}><textarea style={{ ...ui.input, minHeight: 80 }} value={f.founderBio || ""} onChange={set("founderBio")} /></Field>
        <Field label="The verification team" hint="Who reviews records: e.g. certified adjudicators, their experience, how decisions are made." style={{ gridColumn: "1 / -1" }}><textarea style={{ ...ui.input, minHeight: 80 }} value={f.verificationTeam || ""} onChange={set("verificationTeam")} /></Field>
      </div>
      <div style={{ ...ui.label, marginTop: 16 }}>Email addresses</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {[["support", "Support"], ["submissions", "Record submissions"], ["records", "Records & verification"], ["sales", "Shop & sales"], ["partners", "Partners & sponsors"]].map(([k, l]) => (
          <Field key={k} label={l}><input type="email" style={ui.input} value={f.emails?.[k] || ""} onChange={setIn("emails", k)} /></Field>
        ))}
      </div>
      <div style={{ ...ui.muted, fontSize: 12, marginTop: 6 }}>Leave a box empty to hide it from the site.</div>
      <div style={{ ...ui.label, marginTop: 16 }}>Social media links (footer icons)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {SOCIALS.map(([k, l]) => (
          <Field key={k} label={l}><input style={ui.input} value={f.social?.[k] || ""} onChange={setIn("social", k)} placeholder={`https://${k === "x" ? "x.com" : `${k}.com`}/…`} /></Field>
        ))}
      </div>
      <button type="button" style={{ ...ui.btn, marginTop: 16 }} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save company details"}</button>
    </div>
  );
}
