// Admin → Divisions: live category hierarchy + weight classes with custom ranges (saved in the database).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, Network, Scale } from "lucide-react";
import { ui, pill, useAdminApi, Field, Notice, Modal, Empty } from "./adminUi";
import { useCategories, treeOrder } from "./AdminCategoryManager";

const blankClass = { id: null, name: "", code: "", minWeight: "", maxWeight: "", unit: "lbs", categoryId: "", description: "", sortOrder: 0, active: true };

export default function AdminDivisionPanels({ onManageCategories }) {
  const api = useAdminApi();
  const { flat } = useCategories();
  const tree = useMemo(() => treeOrder(flat), [flat]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/weight-classes?all=1");
      setClasses(Array.isArray(res) ? res : res?.weightClasses || []);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Could not load weight classes" });
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name.trim()) { setMsg({ type: "error", text: "Weight class name is required." }); return; }
    const min = form.minWeight === "" ? null : Number(form.minWeight);
    const max = form.maxWeight === "" ? null : Number(form.maxWeight);
    if (min !== null && max !== null && min > max) { setMsg({ type: "error", text: "The minimum weight cannot be above the maximum." }); return; }
    setSaving(true);
    try {
      const body = { ...form, minWeight: min, maxWeight: max, categoryId: form.categoryId || null };
      if (form.id) await api(`/weight-classes/${form.id}`, "PUT", body);
      else await api("/weight-classes", "POST", body);
      setForm(null);
      setMsg({ type: "success", text: `"${body.name}" saved.` });
      await load();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Could not save." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (w) => {
    if (!window.confirm(`Delete the weight class "${w.name}"?`)) return;
    try {
      await api(`/weight-classes/${w.id}`, "DELETE");
      await load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const catName = (id) => flat.find((c) => c.id === id)?.name;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "24px", marginTop: "32px" }}>
      {/* Category hierarchy (live) */}
      <div style={ui.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><Network size={18} color="#FF5500" /><h3 style={ui.h3}>Categories Hierarchy</h3></div>
          {onManageCategories && <button style={ui.btnGhost} onClick={onManageCategories}>Manage categories</button>}
        </div>
        {tree.length === 0 ? <Empty>No categories yet.</Empty> : (
          <div data-lenis-prevent style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "420px", overflowY: "auto", paddingRight: "4px" }}>
            {tree.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "10px 12px", marginLeft: `${Math.min(c.depth, 4) * 18}px`, background: c.depth ? "rgba(255,255,255,0.02)" : "rgba(255,85,0,0.05)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", opacity: c.active === false ? 0.55 : 1 }}>
                <span style={{ fontWeight: c.depth ? 600 : 800, color: c.depth ? "#ccc" : "white", fontSize: "14px" }}>{c.depth ? "↳ " : ""}{c.name}</span>
                <span style={{ ...ui.muted, fontSize: "12px", whiteSpace: "nowrap" }}>{c.verifiedCount || 0} verified · {c.recordCount || 0} total</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weight classes */}
      <div style={ui.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><Scale size={18} color="#FF5500" /><h3 style={ui.h3}>Weight Classes</h3></div>
          <button style={ui.btn} onClick={() => setForm({ ...blankClass })}><Plus size={15} /> Define New Weight Class</button>
        </div>
        <Notice type={msg.type} onClose={() => setMsg({ type: "", text: "" })}>{msg.text}</Notice>
        {loading && !classes.length ? <Empty>Loading...</Empty> : classes.length === 0 ? <Empty>No weight classes yet.</Empty> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {classes.map((w) => (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", flexWrap: "wrap", opacity: w.active ? 1 : 0.55 }}>
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: "white" }}>{w.name}{w.code ? <span style={{ color: "#FF5500", marginLeft: "8px", fontSize: "12px" }}>{w.code}</span> : null}</div>
                  <div style={{ ...ui.muted, fontSize: "12px" }}>{w.label}{w.categoryId ? ` · ${catName(w.categoryId) || "category"}` : " · all categories"}</div>
                </div>
                {!w.active && <span style={pill("#888")}>inactive</span>}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button style={ui.iconBtn} title="Edit" onClick={() => setForm({ ...blankClass, ...w, minWeight: w.minWeight ?? "", maxWeight: w.maxWeight ?? "", categoryId: w.categoryId || "" })}><Edit3 size={15} /></button>
                  <button style={{ ...ui.iconBtn, color: "#ef4444" }} title="Delete" onClick={() => remove(w)}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {form && (
        <Modal
          title={form.id ? `Edit ${form.name}` : "New weight class"}
          onClose={() => setForm(null)}
          footer={<>
            <button style={ui.btnGhost} onClick={() => setForm(null)}>Cancel</button>
            <button style={ui.btn} disabled={saving} onClick={save}>{saving ? "Saving..." : "Save weight class"}</button>
          </>}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
            <Field label="Name"><input style={ui.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Light Heavyweight" autoFocus /></Field>
            <Field label="Code"><input style={ui.input} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="LHW" /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <Field label="Min weight" hint="Empty = no minimum"><input type="number" min="0" step="0.1" inputMode="decimal" style={ui.input} value={form.minWeight} onChange={(e) => setForm({ ...form, minWeight: e.target.value })} /></Field>
            <Field label="Max weight" hint="Empty = no maximum"><input type="number" min="0" step="0.1" inputMode="decimal" style={ui.input} value={form.maxWeight} onChange={(e) => setForm({ ...form, maxWeight: e.target.value })} /></Field>
            <Field label="Unit">
              <select style={ui.input} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </Field>
          </div>
          <Field label="Applies to category" hint="Optional. Leave empty to use this class in every category.">
            <select style={ui.input} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">All categories</option>
              {tree.map((c) => <option key={c.id} value={c.id}>{"— ".repeat(c.depth)}{c.name}</option>)}
            </select>
          </Field>
          <Field label="Description"><textarea style={{ ...ui.input, minHeight: "60px" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Display order"><input type="number" style={ui.input} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></Field>
            <Field label="Status">
              <select style={ui.input} value={form.active ? "1" : "0"} onChange={(e) => setForm({ ...form, active: e.target.value === "1" })}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
