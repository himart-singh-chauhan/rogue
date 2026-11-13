// Height and weight units. The database keeps each value in the unit the member chose, next to that unit
// (users.height + height_unit "cm" | "ft_in", users.weight + weight_unit "kg" | "lbs"), the same way
// signup and the profile page save it. Heights in feet are written like 6'2".
export const CM_PER_IN = 2.54;
export const KG_PER_LB = 0.45359237;

const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

// "6'2\"", "6' 2", "6ft 2in", "6 2", "74in" -> { ft: 6, inch: 2 }
export const parseFeetInches = (text) => {
  const s = String(text ?? "").trim().toLowerCase();
  if (!s) return { ft: "", inch: "" };
  const onlyIn = s.match(/^(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")$/);
  if (onlyIn) { const total = Math.round(Number(onlyIn[1])); return { ft: Math.floor(total / 12), inch: total % 12 }; }
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft|feet|foot)?\s*(?:(\d+(?:\.\d+)?)\s*(?:"|''|in|inch|inches)?)?$/);
  if (!m) return { ft: "", inch: "" };
  return { ft: Math.round(Number(m[1])), inch: m[2] !== undefined ? Math.round(Number(m[2])) : 0 };
};

export const formatFeetInches = (ft, inch) => {
  if (ft === "" && inch === "") return "";
  let f = Math.max(0, Math.round(Number(ft) || 0));
  let i = Math.max(0, Math.round(Number(inch) || 0));
  f += Math.floor(i / 12); i %= 12;
  return `${f}'${i}"`;
};

// Height in cm from a stored value + unit
export const heightToCm = (value, unit) => {
  if (unit === "ft_in") {
    const { ft, inch } = parseFeetInches(value);
    if (ft === "") return null;
    return Math.round((Number(ft) * 12 + Number(inch || 0)) * CM_PER_IN);
  }
  const n = num(value);
  return n === null ? null : Math.round(n);
};

export const cmToFeetInches = (cm) => {
  const n = num(cm);
  if (n === null) return { ft: "", inch: "" };
  const totalIn = Math.round(n / CM_PER_IN);
  return { ft: Math.floor(totalIn / 12), inch: totalIn % 12 };
};

// Weight conversions, rounded to 1 decimal
const r1 = (n) => Math.round(n * 10) / 10;
export const lbsToKg = (v) => { const n = num(v); return n === null ? "" : String(r1(n * KG_PER_LB)); };
export const kgToLbs = (v) => { const n = num(v); return n === null ? "" : String(r1(n / KG_PER_LB)); };
export const weightToKg = (value, unit) => { const n = num(value); if (n === null) return null; return unit === "lbs" ? r1(n * KG_PER_LB) : r1(n); };

// Convert a weight already typed in a field when the unit toggle changes (keeps the number, never clears it)
export const convertWeight = (value, from, to) => {
  if (from === to || value === "" || value == null) return value ?? "";
  return to === "lbs" ? kgToLbs(value) : lbsToKg(value);
};

// Convert a height (stored-format string) between "cm" and "ft_in"
export const convertHeight = (value, from, to) => {
  if (from === to || value === "" || value == null) return value ?? "";
  if (to === "ft_in") { const { ft, inch } = cmToFeetInches(value); return ft === "" ? "" : formatFeetInches(ft, inch); }
  const cm = heightToCm(value, "ft_in");
  return cm === null ? "" : String(cm);
};

// Display: "188 cm" / "6'2\"" / "305 lbs"
export const formatHeight = (value, unit) => {
  if (value === "" || value == null) return "";
  if (unit === "ft_in") { const { ft, inch } = parseFeetInches(value); return ft === "" ? String(value) : formatFeetInches(ft, inch); }
  return `${value} cm`;
};
export const formatWeight = (value, unit) => (value === "" || value == null ? "" : `${value} ${unit === "lbs" ? "lbs" : "kg"}`);
