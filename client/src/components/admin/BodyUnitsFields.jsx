// Height (cm or feet + inches) and weight (kg or lbs) inputs with unit toggles.
// Values are kept in the format the database uses: height "188" (cm) or 6'2" (ft_in), weight "305" + "lbs".
// Switching a toggle converts the number already typed instead of clearing it.
import { convertHeight, convertWeight, parseFeetInches, formatFeetInches } from "../../utils/units";

const label = { display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" };
const input = { width: "100%", minWidth: 0, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" };

function Toggle({ value, options, onChange }) {
  return (
    <div role="group" style={{ display: "inline-flex", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "100px", padding: "2px", marginLeft: "auto" }}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          style={{ border: "none", cursor: "pointer", borderRadius: "100px", padding: "3px 10px", fontSize: "10px", fontWeight: 900, background: value === v ? "#FF5500" : "transparent", color: value === v ? "white" : "#888" }}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export default function BodyUnitsFields({ form, setForm }) {
  const heightUnit = form.heightUnit === "ft_in" ? "ft_in" : "cm";
  const weightUnit = form.weightUnit === "lbs" ? "lbs" : "kg";
  const { ft, inch } = heightUnit === "ft_in" ? parseFeetInches(form.height) : { ft: "", inch: "" };

  const setFtIn = (nextFt, nextIn) => {
    const value = nextFt === "" && nextIn === "" ? "" : formatFeetInches(nextFt === "" ? 0 : nextFt, nextIn === "" ? 0 : nextIn);
    setForm({ ...form, height: value });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <label style={{ ...label, marginBottom: 0 }}>HEIGHT ({heightUnit === "cm" ? "cm" : "ft / in"})</label>
          <Toggle
            value={heightUnit}
            options={[["cm", "CM"], ["ft_in", "FT / IN"]]}
            onChange={(to) => setForm({ ...form, heightUnit: to, height: convertHeight(form.height, heightUnit, to) })}
          />
        </div>
        {heightUnit === "cm" ? (
          <input type="number" inputMode="numeric" min="0" step="1" placeholder="180" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} style={input} />
        ) : (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="number" inputMode="numeric" min="0" max="9" step="1" placeholder="5" aria-label="Feet" value={ft} onChange={(e) => setFtIn(e.target.value, inch)} style={input} />
            <span style={{ color: "#777", fontSize: "12px", fontWeight: 800 }}>ft</span>
            <input type="number" inputMode="numeric" min="0" max="11" step="1" placeholder="11" aria-label="Inches" value={inch} onChange={(e) => setFtIn(ft, e.target.value)} style={input} />
            <span style={{ color: "#777", fontSize: "12px", fontWeight: 800 }}>in</span>
          </div>
        )}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <label style={{ ...label, marginBottom: 0 }}>WEIGHT ({weightUnit})</label>
          <Toggle
            value={weightUnit}
            options={[["kg", "KG"], ["lbs", "LBS"]]}
            onChange={(to) => setForm({ ...form, weightUnit: to, weight: convertWeight(form.weight, weightUnit, to) })}
          />
        </div>
        <input type="number" inputMode="decimal" min="0" step="0.1" placeholder={weightUnit === "kg" ? "75" : "165"} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} style={input} />
      </div>
    </div>
  );
}
