// Admin → Categories: the real category tree from the database.
// Add / edit / delete / hide categories and subcategories; every change is saved and re-read.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, ChevronDown, ChevronRight, Eye, EyeOff, Search, CornerDownRight } from "lucide-react";
import { ui, pill, useAdminApi, SectionHeader, Field, Notice, Modal, Empty } from "./adminUi";

const blank = { id: null, name: "", description: "", parent: "", order: 0, active: true, rules: "", submissionRequirements: "" };

export const useCategories = () => {
  const api = useAdminApi();
  const [flat, setFlat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/categories");
      setFlat(res?.flat || []);
      setError("");
    } catch (e) {
      setError(e.message || "Could not load categories");
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => { reload(); }, [reload]);
  return { flat, loading, error, reload };
};

// flat list -> [{...cat, depth, childCount}] in tree order
export const treeOrder = (flat) => {
  const byParent = {};
  flat.forEach((c) => { const k = c.parent || "root"; (byParent[k] = byParent[k] || []).push(c); });
  Object.values(byParent).forEach((list) => list.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name)));
  const ids = new Set(flat.map((c) => c.id));
  const out = [];
  const walk = (parentKey, depth) => {
    (byParent[parentKey] || []).forEach((c) => {
      out.push({ ...c, depth, childCount: (byParent[c.id] || []).length });
      walk(c.id, depth + 1);
    });
  };
  walk("root", 0);
  // orphans (parent was deleted elsewhere) show at top level
  flat.filter((c) => c.parent && !ids.has(c.parent)).forEach((c) => out.push({ ...c, depth: 0, childCount: 0 }));
  return out;
};

const descendantsOf = (flat, id) => {
  const out = new Set();
  const walk = (pid) => flat.filter((c) => c.parent === pid).forEach((c) => { out.add(c.id); walk(c.id); });
  walk(id);
  return out;
};

export default function AdminCategoryManager() {
  const api = useAdminApi();
  const { flat, loading, error, reload } = useCategories();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const rows = useMemo(() => treeOrder(flat), [flat]);
  const q = query.trim().toLowerCase();
  const visible = rows.filter((c) => {
    if (q) return c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q);
    // hide rows under a collapsed ancestor
    let p = c.parent;
    while (p) {
      if (collapsed[p]) return false;
      p = flat.find((x) => x.id === p)?.parent;
    }
    return true;
  });

  const stats = {
    total: flat.length,
    top: flat.filter((c) => !c.parent).length,
    sub: flat.filter((c) => c.parent).length,
    hidden: flat.filter((c) => c.active === false).length,
    records: flat.reduce((s, c) => s + (c.recordCount || 0), 0),
  };

  const save = async () => {
    if (!form.name.trim()) { setMsg({ type: "error", text: "Category name is required." }); return; }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      description: form.description,
      parent: form.parent || null,
      order: Number(form.order) || 0,
      active: !!form.active,
      rules: form.rules,
      submissionRequirements: form.submissionRequirements,
    };
    try {
      if (form.id) await api(`/categories/${form.id}`, "PUT", body);
      else await api("/categories", "POST", body);
      setMsg({ type: "success", text: `"${body.name}" saved.` });
      setForm(null);
      await reload();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Could not save the category." });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      await api(`/categories/${c.id}`, "PUT", { active: c.active === false });
      await reload();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const remove = async (c) => {
    const extra = c.childCount ? ` Its ${c.childCount} subcategor${c.childCount === 1 ? "y moves" : "ies move"} up one level.` : "";
    const recs = c.recordCount ? ` ${c.recordCount} record(s) keep their category name.` : "";
    if (!window.confirm(`Delete "${c.name}"?${extra}${recs}`)) return;
    try {
      await api(`/categories/${c.id}`, "DELETE");
      setMsg({ type: "success", text: `"${c.name}" deleted.` });
      await reload();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const blocked = form?.id ? descendantsOf(flat, form.id) : new Set();
  const parentOptions = rows.filter((c) => c.id !== form?.id && !blocked.has(c.id));

  return (
    <div>
      <SectionHeader
        eyebrow="Administration"
        title="Category Management"
        desc="Categories and subcategories shown across the site (homepage, Explore Records, submissions). Changes save to the database immediately."
        actions={<button style={ui.btn} onClick={() => setForm({ ...blank })}><Plus size={16} /> New Category</button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {[["Total", stats.total, "#fff"], ["Top level", stats.top, "#FF5500"], ["Subcategories", stats.sub, "#38bdf8"], ["Hidden", stats.hidden, "#888"], ["Records", stats.records, "#22c55e"]].map(([l, v, c]) => (
          <div key={l} style={{ ...ui.card, padding: "16px" }}>
            <div style={{ ...ui.label, marginBottom: "4px" }}>{l}</div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <Notice type={msg.type} onClose={() => setMsg({ type: "", text: "" })}>{msg.text}</Notice>
      <Notice type="error">{error}</Notice>

      <div style={{ position: "relative", marginBottom: "16px", maxWidth: "380px" }}>
        <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#666" }} />
        <input style={{ ...ui.input, paddingLeft: "36px" }} placeholder="Search categories" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading && !flat.length ? <Empty>Loading categories...</Empty> : visible.length === 0 ? (
        <Empty>{flat.length ? "No categories match your search." : "No categories yet. Create the first one."}</Empty>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {visible.map((c) => (
            <div key={c.id} style={{ ...ui.card, padding: "14px 16px", marginLeft: q ? 0 : `${Math.min(c.depth, 4) * 22}px`, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", opacity: c.active === false ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 220px", minWidth: 0 }}>
                {c.childCount > 0 && !q ? (
                  <button style={{ ...ui.iconBtn, width: "28px", height: "28px" }} onClick={() => setCollapsed((s) => ({ ...s, [c.id]: !s[c.id] }))} aria-label={collapsed[c.id] ? "Expand" : "Collapse"}>
                    {collapsed[c.id] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </button>
                ) : c.depth > 0 ? <CornerDownRight size={16} color="#555" /> : <span style={{ width: "28px" }} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: "white", fontSize: "15px" }}>{c.name}</div>
                  <div style={{ ...ui.muted, fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "420px" }}>
                    {c.depth > 0 ? `Subcategory of ${flat.find((x) => x.id === c.parent)?.name || "—"}` : "Top-level category"}
                    {c.description ? ` · ${c.description}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={pill("#22c55e")}>{c.verifiedCount || 0} verified</span>
                <span style={pill("#888")}>{c.recordCount || 0} records</span>
                {c.childCount > 0 && <span style={pill("#38bdf8")}>{c.childCount} sub</span>}
                {c.active === false && <span style={pill("#888")}>hidden</span>}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button title="Add subcategory" style={ui.iconBtn} onClick={() => setForm({ ...blank, parent: c.id })}><Plus size={15} /></button>
                <button title="Edit" style={ui.iconBtn} onClick={() => setForm({ ...blank, ...c, parent: c.parent || "" })}><Edit3 size={15} /></button>
                <button title={c.active === false ? "Show on site" : "Hide from site"} style={ui.iconBtn} onClick={() => toggleActive(c)}>{c.active === false ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                <button title="Delete" style={{ ...ui.iconBtn, color: "#ef4444" }} onClick={() => remove(c)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal
          title={form.id ? `Edit "${form.name || "category"}"` : form.parent ? "New subcategory" : "New category"}
          onClose={() => setForm(null)}
          footer={<>
            <button style={ui.btnGhost} onClick={() => setForm(null)}>Cancel</button>
            <button style={ui.btn} disabled={saving} onClick={save}>{saving ? "Saving..." : "Save category"}</button>
          </>}
        >
          <Field label="Name"><input style={ui.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
          <Field label="Parent category" hint="Leave on 'Top level' for a main category, or pick a parent to make this a subcategory.">
            <select style={ui.input} value={form.parent || ""} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
              <option value="">Top level</option>
              {parentOptions.map((c) => <option key={c.id} value={c.id}>{"— ".repeat(c.depth)}{c.name}</option>)}
            </select>
          </Field>
          <Field label="Description"><textarea style={{ ...ui.input, minHeight: "70px" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
            <Field label="Display order" hint="Lower shows first"><input type="number" style={ui.input} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></Field>
            <Field label="Visibility">
              <select style={ui.input} value={form.active ? "1" : "0"} onChange={(e) => setForm({ ...form, active: e.target.value === "1" })}>
                <option value="1">Shown on site</option>
                <option value="0">Hidden</option>
              </select>
            </Field>
          </div>
          <Field label="Rules (optional)"><textarea style={{ ...ui.input, minHeight: "60px" }} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></Field>
          <Field label="Submission requirements (optional)"><textarea style={{ ...ui.input, minHeight: "60px" }} value={form.submissionRequirements} onChange={(e) => setForm({ ...form, submissionRequirements: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}
