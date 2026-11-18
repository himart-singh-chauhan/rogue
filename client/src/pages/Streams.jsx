// View All Streams: every real event broadcast, live first, then upcoming, then replays.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Search, Timer, Film } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiCall, formatProductImage } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const stateOf = (e) => {
  const st = String(e.status || "").toLowerCase();
  if (e.isLive || st === "live") return "LIVE";
  if (st === "cancelled") return "CANCELLED";
  if (st === "completed" || st === "past" || e.endedAt) return "REPLAY";
  return "UPCOMING";
};
const ORDER = { LIVE: 0, UPCOMING: 1, REPLAY: 2, CANCELLED: 3 };
const BADGE = { LIVE: ["#ef4444", "LIVE"], UPCOMING: ["#FF5500", "SCHEDULED"], REPLAY: ["#555", "REPLAY"], CANCELLED: ["#333", "CANCELLED"] };

export default function Streams() {
  const { user } = useAuth();
  const [events, setEvents] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");

  useEffect(() => {
    apiCall("/events", "GET", null, user?.token).then((list) => setEvents(Array.isArray(list) ? list : [])).catch(() => setEvents([]));
  }, [user?.token]);

  const list = useMemo(() => (events || [])
    .map((e) => ({ ...e, state: stateOf(e) }))
    .filter((e) => e.state !== "CANCELLED")
    .filter((e) => filter === "ALL" || e.state === filter)
    .filter((e) => !q.trim() || [e.title, e.category, e.competitors, e.location].some((v) => String(v || "").toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => (ORDER[a.state] - ORDER[b.state]) || (a.state === "REPLAY" ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date))), [events, filter, q]);

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />
        <div style={{ padding: "140px 5% 120px", maxWidth: "1400px", margin: "0 auto" }}>
          <header style={{ marginBottom: "48px" }}>
            <div style={{ color: "#FF6A00", fontWeight: "800", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "16px" }}>LIVE BROADCASTS</div>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: "950", textTransform: "uppercase", marginBottom: "24px", lineHeight: "1" }}>ALL STREAMS</h1>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "500px" }}>
                <Search size={18} style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search streams…" aria-label="Search streams"
                  style={{ width: "100%", boxSizing: "border-box", background: "#161616", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "100px", padding: "16px 20px 16px 50px", color: "white", fontSize: "14px", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[["ALL", "All"], ["LIVE", "Live now"], ["UPCOMING", "Upcoming"], ["REPLAY", "Replays"]].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setFilter(k)}
                    style={{ padding: "12px 22px", borderRadius: "100px", background: filter === k ? "#FF6A00" : "rgba(255,255,255,0.05)", color: filter === k ? "white" : "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: "900", border: "none", cursor: "pointer", textTransform: "uppercase" }}>{l}</button>
                ))}
              </div>
            </div>
          </header>

          {events === null ? (
            <div style={{ color: "#888" }}>Loading streams…</div>
          ) : list.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "28px" }}>
              {list.map((e) => {
                const [bg, label] = BADGE[e.state];
                const img = e.imageUrl || e.image;
                return (
                  <Link key={e.id} to={`/stream/${e.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ background: "#161616", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", height: "100%" }}>
                      <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#0d0d0d" }}>
                        {img ? <img loading="lazy" decoding="async" src={formatProductImage(img)} alt={e.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                        <div style={{ position: "absolute", top: 14, left: 14, background: bg, color: "white", padding: "5px 12px", borderRadius: "8px", fontWeight: "900", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
                          {e.state === "UPCOMING" ? <Timer size={12} /> : e.state === "REPLAY" ? <Film size={12} /> : <Play size={11} fill="white" />} {label}
                        </div>
                        {e.isPaid && <div style={{ position: "absolute", top: 14, right: 14, background: "#FFaa00", color: "#000", padding: "5px 12px", borderRadius: "8px", fontWeight: "900", fontSize: "11px" }}>PASS ${Number(e.ticketPrice || 0).toFixed(2)}</div>}
                        {/* small play button (Curtis: no big orange button over the preview) */}
                        <div style={{ position: "absolute", right: 14, bottom: 14, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play size={14} fill="white" color="white" style={{ marginLeft: 2 }} />
                        </div>
                      </div>
                      <div style={{ padding: "22px 24px" }}>
                        <div style={{ color: "#FF6A00", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.1em" }}>
                          {e.category}{e.state === "UPCOMING" && e.date ? ` · ${new Date(e.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}` : ""}
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: "950", lineHeight: "1.3", textTransform: "uppercase", margin: 0 }}>{e.title}</h3>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "100px 20px", background: "#111", borderRadius: "32px", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "18px", color: "rgba(255,255,255,0.4)", fontWeight: "700" }}>No streams here yet. New events appear here as soon as they are scheduled.</div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </PageTransition>
  );
}
