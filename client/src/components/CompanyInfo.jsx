// Who runs AMPEX World Records: company, founder, verification team, location and contact addresses.
// Only what the admin has filled in is shown (Admin → System → Company & social links).
import { Building2, User, ShieldCheck, MapPin, Mail } from "lucide-react";
import { useCompany } from "../utils/company";
import SocialIcons from "./SocialIcons";

const card = { background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 };
const label = { fontSize: 11, fontWeight: 900, color: "#FF6A00", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 };

export default function CompanyInfo({ title = "About the company", showEmails = true, showVerification = true, style }) {
  const c = useCompany();
  if (!c) return null;
  const emails = [["support", "Support"], ["submissions", "Record submissions"], ["records", "Records & verification"], ["sales", "Shop & sales"], ["partners", "Partners, sponsors & media"]].filter(([k]) => c.emails?.[k]);
  const blocks = [
    c.companyName && { icon: <Building2 size={14} />, label: "Company", body: <><div style={{ fontWeight: 900, fontSize: 18 }}>{c.companyName}</div>{c.address && <div style={{ color: "#aaa", marginTop: 4 }}>{c.address}</div>}</> },
    c.founderName && { icon: <User size={14} />, label: c.founderTitle || "Founder", body: <div style={{ fontWeight: 900, fontSize: 18 }}>{c.founderName}</div> },
    showVerification && c.verificationTeam && { icon: <ShieldCheck size={14} />, label: "Verification team", body: <p style={{ color: "#ccc", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{c.verificationTeam}</p> },
    c.serviceRegion && { icon: <MapPin size={14} />, label: "Location & service region", body: <div style={{ color: "#ddd", lineHeight: 1.6 }}>{c.serviceRegion}</div> },
    showEmails && emails.length > 0 && { icon: <Mail size={14} />, label: "Email us", body: <div style={{ display: "grid", gap: 6 }}>{emails.map(([k, l]) => <div key={k}><span style={{ color: "#888", fontSize: 12 }}>{l}: </span><a href={`mailto:${c.emails[k]}`} style={{ color: "#FF6A00", fontWeight: 800 }}>{c.emails[k]}</a></div>)}</div> },
  ].filter(Boolean);
  if (!blocks.length) return null;
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 5%", ...style }}>
      <h2 style={{ fontSize: 32, fontWeight: 950, textTransform: "uppercase", margin: "0 0 24px", color: "white" }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {blocks.map((b) => (
          <div key={b.label} style={card}>
            <div style={label}>{b.icon} {b.label}</div>
            <div style={{ color: "white" }}>{b.body}</div>
          </div>
        ))}
      </div>
      <SocialIcons style={{ marginTop: 20 }} />
    </section>
  );
}
