// Admin → System Settings → Fees: the extra submission packs members can buy (shown on the Membership page).
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ui, useAdminApi, Notice } from "./adminUi";

export default function AdminSubmissionPacksCard() {
  const api = useAdminApi();
  const [packs, setPacks] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/admin/submission-packs").then((r) => setPacks(r.packs.map((p) => ({ ...p, price: Number(p.price).toFixed(2) })))).catch((e) => setNotice({ type: "error", text: e.message }));
  }, [api]);

  const set = (i, k, v) => setPacks(packs.map((p, j) => (j === i ? { ...p, [k]: v } : k === "popular" && v ? { ...p, popular: false } : p)));
  const save = async () => {
    setSaving(true);
    try {
      const r = await api("/admin/submission-packs", "PUT", { packs });
      setPacks(r.packs.map((p) => ({ ...p, price: Number(p.price).toFixed(2) })));
      setNotice({ type: "success", text: r.message });
    } catch (e) { setNotice({ type: "error", text: e.message }); } finally { setSaving(false); }
  };

  if (!packs) return notice ? <Notice type={notice.type}>{notice.text}</Notice> : null;
  return (
    <div style={{ ...ui.card, marginTop: "20px", background: "#111", borderRadius: "20px" }}>
      <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "white" }}>Extra submission packs</h3>
      <p style={{ ...ui.muted, margin: "0 0 16px 0", lineHeight: 1.5 }}>
        Each plan includes a number of submissions per month (Memberships). When a member has used them, every extra submission uses one credit from a pack. Credits never expire. The submission fee above still applies to each record.
      </p>
      {notice && <div style={{ marginBottom: 12 }}><Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}
      <div style={{ display: "grid", gap: 10 }}>
        {packs.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#ccc", fontSize: 13 }}>
              <input type="number" min="1" step="1" style={{ ...ui.input, width: 90 }} value={p.count} onChange={(e) => set(i, "count", e.target.value)} aria-label="Submissions in this pack" />
              submissions for $
            </label>
            <input type="number" min="0.5" step="0.01" style={{ ...ui.input, width: 110 }} value={p.price} onChange={(e) => set(i, "price", e.target.value)} aria-label="Price" />
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#ccc", fontSize: 13, cursor: "pointer" }}>
              <input type="radio" name="popular-pack" checked={!!p.popular} onChange={() => set(i, "popular", true)} /> Most popular
            </label>
            <button type="button" style={{ ...ui.iconBtn, color: "#ef4444" }} aria-label="Remove pack" onClick={() => setPacks(packs.filter((_, j) => j !== i))} disabled={packs.length === 1}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        {packs.length < 6 && <button type="button" style={ui.btnGhost} onClick={() => setPacks([...packs, { count: 20, price: "39.99", popular: false }])}><Plus size={14} /> Add pack</button>}
        <button type="button" style={ui.btn} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save packs"}</button>
      </div>
    </div>
  );
}
