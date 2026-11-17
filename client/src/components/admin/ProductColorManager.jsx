// Admin → Shop Catalog → product form: the colors a shopper can choose (hats, shirts, hoodies, jackets…).
// Switch any of the 12 standard colors on, upload the picture of the item in that color, hide (disable) or
// remove it, or add another color. Saved with the product as products.colors.
import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import ImageUploadField from "./ImageUploadField";
import { STANDARD_COLORS, isLight } from "../../utils/shopColors";

const dot = (hex, size = 22) => ({ width: size, height: size, borderRadius: "50%", background: hex, flexShrink: 0, border: isLight(hex) ? "1px solid rgba(0,0,0,0.4)" : "1px solid rgba(255,255,255,0.2)" });
const small = { background: "rgba(255,255,255,0.05)", color: "#ddd", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 };

export default function ProductColorManager({ colors = [], onChange }) {
  const list = Array.isArray(colors) ? colors : [];
  const [custom, setCustom] = useState({ name: "", hex: "#ff7a00" });
  const has = (name) => list.some((c) => c.name.toLowerCase() === name.toLowerCase());
  const update = (i, patch) => onChange(list.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const toggleStandard = (std) => {
    if (has(std.name)) onChange(list.filter((c) => c.name.toLowerCase() !== std.name.toLowerCase()));
    else onChange([...list, { name: std.name, hex: std.hex, image_url: "", enabled: true }]);
  };
  const addCustom = () => {
    const name = custom.name.trim();
    if (!name || has(name)) return;
    onChange([...list, { name, hex: custom.hex, image_url: "", enabled: true }]);
    setCustom({ name: "", hex: "#ff7a00" });
  };

  return (
    <div style={{ marginTop: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14 }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: "950", color: "#FF5500", letterSpacing: "0.5px", marginBottom: 4 }}>COLORS (OPTIONAL)</label>
      <div style={{ color: "#888", fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
        Tick the colors this item comes in and upload a picture of each. Shoppers see round color buttons under the picture; a click shows that color. Sizes stay as they are.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {STANDARD_COLORS.map((c) => {
          const on = has(c.name);
          return (
            <button key={c.name} type="button" onClick={() => toggleStandard(c)} aria-pressed={on}
              style={{ ...small, background: on ? "rgba(255,85,0,0.15)" : small.background, borderColor: on ? "#FF5500" : "rgba(255,255,255,0.1)" }}>
              <span style={dot(c.hex, 14)} /> {c.name}
            </button>
          );
        })}
      </div>

      {list.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10, marginBottom: 12 }}>
          {list.map((c, i) => (
            <div key={`${c.name}-${i}`} style={{ background: "rgba(0,0,0,0.35)", border: `1px solid ${c.enabled === false ? "rgba(255,255,255,0.05)" : "rgba(255,85,0,0.25)"}`, borderRadius: 10, padding: 10, opacity: c.enabled === false ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <input type="color" value={c.hex || "#888888"} onChange={(e) => update(i, { hex: e.target.value })} aria-label={`${c.name} swatch color`} style={{ width: 28, height: 28, padding: 0, border: "none", background: "none", cursor: "pointer" }} />
                <input value={c.name} onChange={(e) => update(i, { name: e.target.value })} aria-label="Color name" style={{ flex: 1, minWidth: 0, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 8px", color: "white", fontSize: 13, fontWeight: 700 }} />
              </div>
              <ImageUploadField label={`${c.name} picture`} value={c.image_url || ""} onChange={(url) => update(i, { image_url: url })} previewHeight={110} />
              {!c.image_url && <div style={{ color: "#fbbf24", fontSize: 11, marginTop: 6 }}>No picture yet: shoppers will see the main product picture.</div>}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button type="button" style={small} onClick={() => update(i, { enabled: c.enabled === false })}>
                  {c.enabled === false ? <><Eye size={13} /> Show</> : <><EyeOff size={13} /> Hide</>}
                </button>
                <button type="button" style={{ ...small, color: "#ef4444", borderColor: "rgba(239,68,68,0.35)" }} onClick={() => { if (window.confirm(`Remove ${c.name} from this product?`)) onChange(list.filter((_, j) => j !== i)); }}>
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input type="color" value={custom.hex} onChange={(e) => setCustom({ ...custom, hex: e.target.value })} aria-label="New color swatch" style={{ width: 32, height: 32, padding: 0, border: "none", background: "none", cursor: "pointer" }} />
        <input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} placeholder="Another color, e.g. Gold" style={{ flex: "1 1 160px", minWidth: 0, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 10px", color: "white", fontSize: 13 }} />
        <button type="button" style={small} onClick={addCustom} disabled={!custom.name.trim() || has(custom.name.trim())}><Plus size={13} /> Add color</button>
      </div>
    </div>
  );
}
