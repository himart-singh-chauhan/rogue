// Try These Records: new records AMPEX is asking members to set for the first time.
// Grouped into Record Challenges and Funny Talent Challenges, in the admin's order.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Target, Clock, Users, ChevronDown, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SponsorBanner from "../components/SponsorBanner";
import { apiCall } from "../utils/api";

export const SCORING = { most: "Highest count wins", longest: "Longest time wins", fastest: "Fastest time wins" };
const DIFF = { easy: "Easy", medium: "Medium", hard: "Hard", extreme: "Extreme" };
const SECTION_ORDER = ["Record Challenges", "Funny Talent Challenges"];
const sel = { background: "#111", border: "1px solid rgba(255,255,255,0.12)", color: "white", borderRadius: 100, padding: "10px 14px", fontSize: 13, fontWeight: 700 };

export const statusChip = (o) => o.status === "set"
  ? { text: "Record Set", color: "#22c55e" }
  : o.status === "paused" ? { text: "Paused", color: "#F59E0B" }
  : o.deadline && new Date(o.deadline) < new Date() ? { text: "Deadline passed", color: "#888" }
  : { text: "Open to Set", color: "#FF6A00" };

export function GeneralRules({ defaultOpen = false }) {
  const [rules, setRules] = useState([]);
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { apiCall("/open-records-rules", "GET").then((r) => setRules(Array.isArray(r) ? r : [])).catch(() => {}); }, []);
  if (!rules.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ width: "100%", background: "none", border: "none", color: "white", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        General rules for every challenge <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{ padding: "0 20px 18px", display: "grid", gap: 14 }}>
          {rules.map((r) => (
            <div key={r.heading}>
              <div style={{ color: "#FF6A00", fontWeight: 900, fontSize: 13, marginBottom: 4 }}>{r.heading}</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.65 }}>{r.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ o }) {
  const st = statusChip(o);
  return (
    <Link to={`/try-these-records/${o.id}`} style={{ textDecoration: "none", color: "white", background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {o.number && <span style={{ fontSize: 12, fontWeight: 950, color: "rgba(255,255,255,0.45)" }}>{String(o.number).padStart(2, "0")}</span>}
        <span style={{ fontSize: 10, fontWeight: 900, color: st.color, border: `1px solid ${st.color}66`, borderRadius: 6, padding: "3px 8px" }}>{st.text.toUpperCase()}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 950, lineHeight: 1.2 }}>{o.title}</div>
      {o.description && <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.5 }}>{o.description}</div>}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "#999", fontSize: 12 }}>
        {o.scoring && <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><Target size={12} /> {SCORING[o.scoring]}</span>}
        {o.timeLimit && <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><Clock size={12} /> {o.timeLimit}</span>}
        <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><Users size={12} /> {o.attempts} {o.attempts === 1 ? "attempt" : "attempts"}</span>
      </div>
      {o.status === "set" && o.holder
        ? <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 800 }}>Record: {o.holder.name} · {o.holder.value} {String(o.holder.unit || "").toLowerCase()}</div>
        : <span style={{ marginTop: "auto", alignSelf: "flex-start", background: "#FF6A00", color: "white", borderRadius: 100, padding: "9px 16px", fontSize: 12, fontWeight: 900, display: "inline-flex", gap: 6, alignItems: "center" }}>Try This Record <ArrowRight size={13} /></span>}
    </Link>
  );
}

export default function TryTheseRecords() {
  const [list, setList] = useState(null);
  const [q, setQ] = useState("");
  const [f, setF] = useState({ section: "", scoring: "", difficulty: "", status: "open", sort: "order" });
  useEffect(() => { apiCall("/open-records", "GET").then(setList).catch(() => setList([])); }, []);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    let r = (list || []).filter((o) =>
      (!s || [o.title, o.category, o.subcategory, o.description, o.number && String(o.number).padStart(2, "0")].some((v) => String(v || "").toLowerCase().includes(s)))
      && (!f.section || o.section === f.section)
      && (!f.scoring || o.scoring === f.scoring)
      && (!f.difficulty || o.difficulty === f.difficulty)
      && (f.status === "all" || (f.status === "open" ? o.status === "open" : o.status === "set")));
    if (f.sort === "popular") r = [...r].sort((a, b) => b.attempts - a.attempts);
    else if (f.sort === "newest") r = [...r].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return r; // "order": the admin's order, as the server sends it
  }, [list, q, f]);

  const groups = useMemo(() => {
    const names = [...new Set(shown.map((o) => o.section || "More Challenges"))].sort((a, b) => {
      const ia = SECTION_ORDER.indexOf(a); const ib = SECTION_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    return names.map((n) => ({ name: n, items: shown.filter((o) => (o.section || "More Challenges") === n) }));
  }, [shown]);
  const sections = [...new Set((list || []).map((o) => o.section).filter(Boolean))];
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh" }}>
      <Navbar />
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "140px 5% 30px" }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#FF6A00", letterSpacing: "0.2em", marginBottom: 12 }}>NEW RECORDS · OPEN TO SET</div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 950, textTransform: "uppercase", margin: "0 0 16px", lineHeight: 1 }}>Try These Records</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, lineHeight: 1.6, maxWidth: 780, margin: "0 0 10px" }}>
          These records are waiting for their first official record holder. Choose an open record, follow the rules, submit your evidence, and become the first person to make AMPEX history.
        </p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, maxWidth: 780, margin: "0 0 24px" }}>
          Want to beat a record that already has a verified holder? Use <Link to="/explore-records" style={{ color: "#FF6A00", fontWeight: 800 }}>Explore Records</Link> and challenge it there.
        </p>
        <GeneralRules />
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 5% 10px" }}>
        <div style={{ position: "relative", maxWidth: 520, marginBottom: 14 }}>
          <Search size={16} color="#777" style={{ position: "absolute", left: 16, top: 14 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search challenges…" style={{ ...sel, width: "100%", padding: "12px 16px 12px 42px", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select style={sel} value={f.status} onChange={set("status")} aria-label="Status"><option value="open">Open to Set</option><option value="set">Record Set</option><option value="all">All</option></select>
          <select style={sel} value={f.section} onChange={set("section")} aria-label="Group"><option value="">All challenges</option>{sections.map((s) => <option key={s}>{s}</option>)}</select>
          <select style={sel} value={f.scoring} onChange={set("scoring")} aria-label="Scoring"><option value="">Any scoring</option>{Object.entries(SCORING).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select style={sel} value={f.difficulty} onChange={set("difficulty")} aria-label="Difficulty"><option value="">Any difficulty</option>{Object.entries(DIFF).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select style={sel} value={f.sort} onChange={set("sort")} aria-label="Sort"><option value="order">Challenge order</option><option value="popular">Most popular</option><option value="newest">Newest</option></select>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 5% 60px", display: "grid", gap: 36 }}>
        {list === null ? <div style={{ color: "#888" }}>Loading…</div> : shown.length === 0 ? (
          <div style={{ background: "#111", borderRadius: 20, padding: 32, color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
            {list.length ? "No challenges match these filters." : "New record challenges are coming soon. Check back shortly!"}
          </div>
        ) : groups.map((g) => (
          <div key={g.name}>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 950, textTransform: "uppercase", margin: "0 0 16px" }}>{g.name} <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 16 }}>({g.items.length})</span></h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
              {g.items.map((o) => <ChallengeCard key={o.id} o={o} />)}
            </div>
          </div>
        ))}
      </section>
      <SponsorBanner placements={["records"]} />
      <Footer />
    </div>
  );
}
