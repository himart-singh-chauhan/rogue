// Admin → Sponsors & Ads → Ad prices: what sponsors pay for a 10 sec / 30 sec / 1 min video ad and for each
// banner spot. These prices show on the public "Advertise with us" page (/advertise), where sponsors pick what
// they want and send a request; it arrives in the admin inbox and by email.
import { useEffect, useState } from "react";
import { ui, useAdminApi, Notice } from "./adminUi";
import { PERIODS } from "./adPeriods";

const lengthLabel = (s) => (s === 60 ? "1 minute video ad" : `${s} second video ad`);

export default function AdminAdPricing() {
  const api = useAdminApi();
  const [form, setForm] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => { api("/admin/ad-pricing").then(setForm).catch(() => {}); }, [api]);

  const setRow = (group, i, patch) => setForm((f) => ({ ...f, [group]: f[group].map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const save = async () => {
    setSaving(true);
    try { const r = await api("/admin/ad-pricing", "PUT", form); setForm(r); setNotice({ type: "success", text: r.message }); }
    catch (e) { setNotice({ type: "error", text: e.message }); } finally { setSaving(false); }
  };

  if (!form) return null;
  const row = (group, r, i, label) => (
    <div key={`${group}-${i}`} style={{ display: "grid", gridTemplateColumns: "minmax(160px, 1.4fr) minmax(110px, 0.8fr) minmax(120px, 0.8fr) auto", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ color: r.enabled ? "white" : "#666", fontWeight: 700, fontSize: 13 }}>{label}</span>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: 14 }}>$</span>
        <input type="number" min="0" step="0.01" aria-label={`${label} price`} style={{ ...ui.input, paddingLeft: 24 }} value={r.price} onChange={(e) => setRow(group, i, { price: e.target.value })} />
      </div>
      <select aria-label={`${label} billing`} style={ui.input} value={r.period} onChange={(e) => setRow(group, i, { period: e.target.value })}>
        {PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <label style={{ display: "flex", gap: 6, alignItems: "center", color: "#aaa", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
        <input type="checkbox" checked={r.enabled} onChange={(e) => setRow(group, i, { enabled: e.target.checked })} /> Offer it
      </label>
    </div>
  );

  return (
    <div style={{ ...ui.card, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ ...ui.h3, marginBottom: 4 }}>Ad prices</h3>
          <p style={{ ...ui.muted, margin: 0 }}>What sponsors pay for each ad. Sponsors see these on <a href="/advertise" target="_blank" rel="noopener noreferrer" style={{ color: "#FF5500" }}>ampexworldrecords.com/advertise</a> and send you a request.</p>
        </div>
        <button type="button" style={ui.btnGhost} onClick={() => setOpen((o) => !o)}>{open ? "Hide prices" : "Change prices"}</button>
      </div>
      {notice && <div style={{ marginTop: 12 }}><Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}
      {open && (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <div style={{ minWidth: 560 }}>
            <div style={{ ...ui.label, marginTop: 4 }}>Video ads (play before record videos, replays and live streams)</div>
            {form.video.map((r, i) => row("video", r, i, lengthLabel(r.seconds)))}
            <div style={{ ...ui.label, marginTop: 20 }}>Banners</div>
            {form.banners.map((r, i) => row("banners", r, i, r.label || r.placement))}
            <div style={{ ...ui.label, marginTop: 20 }}>Note shown under the prices (optional)</div>
            <textarea style={{ ...ui.input, minHeight: 70, resize: "vertical" }} maxLength={1000} value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Ask about packages for live events and championship matches." />
            <button type="button" style={{ ...ui.btn, marginTop: 14 }} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save ad prices"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
