// About page: the founder's story (Admin → System → Company & social links → About the founder).
import { useCompany } from "../utils/company";

// web addresses in the text become links
const withLinks = (line) => line.split(/(https?:\/\/[^\s)]+)/g).map((part, i) => (/^https?:\/\//.test(part)
  ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "#FF6A00", wordBreak: "break-all" }}>{part}</a>
  : part));

export default function FounderBio({ style }) {
  const c = useCompany();
  if (!c?.founderBio) return null;
  const paras = c.founderBio.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const note = (p) => /^timing reference:/i.test(p);
  return (
    <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 5% 40px", ...style }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#FF6A00", letterSpacing: "0.2em", marginBottom: 10 }}>MEET THE FOUNDER</div>
      <h2 style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 950, textTransform: "uppercase", margin: "0 0 6px", color: "white", lineHeight: 1.05 }}>{c.founderName || "Our founder"}</h2>
      {c.founderTitle && <div style={{ color: "rgba(255,255,255,0.6)", fontWeight: 800, fontSize: 15, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 28 }}>{c.founderTitle}{c.companyName ? ` · ${c.companyName}` : ""}</div>}
      <div style={{ display: "grid", gap: 18 }}>
        {paras.map((p, i) => (
          <p key={i} style={note(p)
            ? { color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6, margin: "6px 0 0" }
            : { color: "rgba(255,255,255,0.82)", fontSize: 17, lineHeight: 1.8, margin: 0 }}>
            {withLinks(p)}
          </p>
        ))}
      </div>
    </section>
  );
}
