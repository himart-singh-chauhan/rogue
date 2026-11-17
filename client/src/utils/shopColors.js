// Shop colors (hats, shirts, hoodies, jackets…). A product's colors live in products.colors:
// [{ name, hex, image_url, enabled }]. Only enabled colors show in the shop; each has its own picture.
import { formatProductImage } from "./api";

// The 12 standard colors Curtis asked for, in his order
export const STANDARD_COLORS = [
  { name: "Red", hex: "#d32f2f" },
  { name: "Blue", hex: "#1e4fd8" },
  { name: "White", hex: "#ffffff" },
  { name: "Green", hex: "#2e7d32" },
  { name: "Brown", hex: "#6d4c41" },
  { name: "Gray", hex: "#8a8a8a" },
  { name: "Light Blue", hex: "#7cc4f5" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Orange", hex: "#ff7a00" },
  { name: "Purple", hex: "#7b2cbf" },
  { name: "Light Purple", hex: "#c4a7f0" },
  { name: "Black", hex: "#111111" },
];

const HEX = /^#[0-9a-f]{6}$/i;
export const hexFor = (name) => STANDARD_COLORS.find((c) => c.name.toLowerCase() === String(name || "").toLowerCase())?.hex || "#888888";

// The colors a shopper can pick, in the order the admin set
export const availableColors = (product) => (Array.isArray(product?.colors) ? product.colors : [])
  .filter((c) => c && c.name && c.enabled !== false)
  .map((c) => ({ name: String(c.name), hex: HEX.test(c.hex || "") ? c.hex : hexFor(c.name), image: c.image_url ? formatProductImage(c.image_url) : "" }));

// A light swatch (white, light blue…) needs a darker ring to be visible
export const isLight = (hex) => {
  const m = String(hex || "").match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return false;
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 190;
};
