// Round color buttons under a product picture. Clicking one switches the picture (no page reload).
import { isLight } from "../utils/shopColors";

export default function ColorSwatches({ colors, value, onChange, size = 28, label = true, compact = false }) {
  if (!colors?.length) return null;
  return (
    <div style={{ marginTop: compact ? 10 : 16 }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Color{value ? <span style={{ color: "white", marginLeft: 6 }}>· {value}</span> : null}
        </div>
      )}
      <div role="radiogroup" aria-label="Color" style={{ display: "flex", flexWrap: "wrap", gap: compact ? 6 : 10 }}>
        {colors.map((c) => {
          const on = value === c.name;
          return (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={c.name}
              title={c.name}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(c.name); }}
              style={{
                width: size, height: size, borderRadius: "50%", padding: 0, cursor: "pointer", flexShrink: 0,
                background: c.hex,
                border: isLight(c.hex) ? "1px solid rgba(0,0,0,0.35)" : "1px solid rgba(255,255,255,0.15)",
                boxShadow: on ? "0 0 0 2px #0a0a0a, 0 0 0 4px #FF6A00" : "none",
                transform: on ? "scale(1.08)" : "none",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
