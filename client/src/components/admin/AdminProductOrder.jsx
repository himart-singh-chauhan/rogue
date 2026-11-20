// Admin → Products → Arrange shop order: the order products appear in the shop.
// Drag a row (or use the arrows) to move it, or "Group by section" to put all clothes together, then
// trophies, belts and so on. Nothing changes in the shop until "Save order".
import { useState } from "react";
import { ArrowUp, ArrowDown, GripVertical, Layers, X } from "lucide-react";
import { ui, useAdminApi, Notice } from "./adminUi";
import { SHOP_CATEGORIES } from "../../utils/shopCategories";
import { formatProductImage } from "../../utils/api";

const imageOf = (p) => p.image_url || (Array.isArray(p.image_urls) && p.image_urls[0]) || "";

export default function AdminProductOrder({ products, onSaved, onClose }) {
  const api = useAdminApi();
  const [list, setList] = useState(products);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const changed = list.some((p, i) => p.id !== products[i]?.id);

  const move = (from, to) => {
    if (to < 0 || to >= list.length || from === to) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setList(next);
  };

  // Same section next to each other, in the shop's section order; inside a section the current order stays
  const groupBySection = () => {
    const rank = (c) => { const i = SHOP_CATEGORIES.indexOf(c); return i === -1 ? SHOP_CATEGORIES.length : i; };
    setList(list.map((p, i) => ({ p, i })).sort((a, b) => rank(a.p.category) - rank(b.p.category) || String(a.p.category || "").localeCompare(String(b.p.category || "")) || a.i - b.i).map((x) => x.p));
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await api("/admin/products/order", "PUT", { ids: list.map((p) => p.id) });
      setNotice({ type: "success", text: "Shop order saved. The shop now shows the products in this order." });
      onSaved?.(r.products || list);
    } catch (e) {
      setNotice({ type: "error", text: e.message });
    } finally { setSaving(false); }
  };

  const btn = { ...ui.iconBtn, width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center" };
  return (
    <div style={{ ...ui.card, marginBottom: 24, borderColor: "rgba(255,85,0,0.35)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div style={ui.h3}>Arrange shop order</div>
          <div style={{ ...ui.muted, marginTop: 4 }}>Drag a product up or down (or use the arrows). The first product here is the first one in the shop. New products are added at the end.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" style={ui.btnGhost} onClick={groupBySection}><Layers size={14} /> Group by section</button>
          <button type="button" style={ui.btn} disabled={saving || !changed} onClick={save}>{saving ? "Saving…" : "Save order"}</button>
          <button type="button" style={ui.btnGhost} onClick={onClose}><X size={14} /> Close</button>
        </div>
      </div>
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      {changed && <div style={{ color: "#FF8A3D", fontSize: 12, fontWeight: 800, marginBottom: 8 }}>You have unsaved changes.</div>}
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
        {list.map((p, i) => (
          <li
            key={p.id}
            draggable
            onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; }}
            onDragOver={(e) => { e.preventDefault(); if (overIndex !== i) setOverIndex(i); }}
            onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) move(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
            onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, cursor: "grab",
              background: dragIndex === i ? "rgba(255,85,0,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${overIndex === i && dragIndex !== i ? "#FF5500" : "rgba(255,255,255,0.06)"}`,
              opacity: dragIndex === i ? 0.6 : 1,
            }}
          >
            <GripVertical size={16} color="#666" style={{ flexShrink: 0 }} />
            <span style={{ color: "#777", fontSize: 12, fontWeight: 900, width: 22, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
            {imageOf(p)
              ? <img src={formatProductImage(imageOf(p))} alt="" loading="lazy" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0, background: "#111" }} />
              : <span style={{ width: 40, height: 40, borderRadius: 8, background: "#111", flexShrink: 0 }} />}
            <span style={{ flex: "1 1 auto", minWidth: 0 }}>
              <span style={{ display: "block", color: "white", fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              <span style={{ color: "#888", fontSize: 11, fontWeight: 700 }}>{p.category || "No section"} · ${Number(p.price || 0).toFixed(2)}</span>
            </span>
            <button type="button" style={btn} aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp size={14} /></button>
            <button type="button" style={btn} aria-label={`Move ${p.name} down`} disabled={i === list.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={14} /></button>
          </li>
        ))}
      </ol>
    </div>
  );
}
