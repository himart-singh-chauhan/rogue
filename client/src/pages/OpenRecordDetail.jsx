// One Try These Records challenge: its rules, video requirements and the "Try This Record" submission form.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Share2, ShieldAlert, FileText, Target, Clock, Video, Award, Users } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ChallengeSubmitForm from "../components/ChallengeSubmitForm";
import { apiCall } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { statusChip, SCORING, GeneralRules } from "./TryTheseRecords";

const box = { background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 20 };
const h = { display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 900, color: "#FF6A00", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 };

export default function OpenRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [o, setO] = useState(undefined);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { apiCall(`/open-records/${id}`, "GET", null, user?.token).then(setO).catch(() => setO(null)); }, [id, user?.token]);

  if (o === undefined) return <div style={{ background: "#0A0A0A", minHeight: "100vh" }}><Navbar /></div>;
  if (o === null) {
    return (
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ padding: "160px 5%", textAlign: "center" }}>
          <h1 style={{ fontWeight: 950 }}>Challenge not found</h1>
          <Link to="/try-these-records" style={{ color: "#FF6A00", fontWeight: 800 }}>See all challenges</Link>
        </div>
      </div>
    );
  }
  const st = statusChip(o);
  const closed = o.status === "paused" || (o.deadline && new Date(o.deadline) < new Date());
  const tryIt = () => {
    if (o.status === "set" && o.recordId) {
      // the record has a verified holder: beat it through the normal challenge flow
      const target = `/challenge-verify?recordId=${encodeURIComponent(o.recordId)}&record=${encodeURIComponent(o.title)}`;
      if (!user) { navigate("/login", { state: { from: target, message: "Please log in or create an account to challenge this record." } }); return; }
      navigate(target);
      return;
    }
    if (!user) { navigate("/login", { state: { from: `/try-these-records/${o.id}`, message: "Please log in or create an account to try this record." } }); return; }
    setShowForm(true);
    setTimeout(() => document.getElementById("try-this-record")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const share = async () => {
    const url = window.location.href;
    try { if (navigator.share) await navigator.share({ title: o.title, url }); else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); } } catch { /* cancelled */ }
  };

  return (
    <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh" }}>
      <Navbar />
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "130px 5% 30px", display: "grid", gap: 16 }}>
        <Link to="/try-these-records" style={{ color: "#FF6A00", fontWeight: 800, fontSize: 13 }}>← All challenges</Link>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: st.color, border: `1px solid ${st.color}66`, borderRadius: 6, padding: "4px 10px" }}>{st.text.toUpperCase()}</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: "#aaa", border: "1px solid #444", borderRadius: 6, padding: "4px 10px" }}>{o.code}</span>
          {o.section && <span style={{ fontSize: 11, fontWeight: 900, color: "#aaa", border: "1px solid #444", borderRadius: 6, padding: "4px 10px" }}>{o.section.toUpperCase()}</span>}
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 950, margin: 0, lineHeight: 1.08 }}>{o.title}</h1>
        {o.description && <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 18, lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{o.description}</p>}

        {o.status === "set" && o.holder && (
          <div style={{ ...box, borderColor: "rgba(34,197,94,0.4)" }}>
            <div style={{ ...h, color: "#22c55e" }}><Award size={14} /> Record set</div>
            <div style={{ fontSize: 20, fontWeight: 950 }}>{o.holder.username ? <Link to={`/profile/${o.holder.username}`} style={{ color: "white" }}>{o.holder.name}</Link> : o.holder.name}</div>
            <div style={{ color: "rgba(255,255,255,0.75)", marginTop: 6, lineHeight: 1.7 }}>
              Verified result: <strong style={{ color: "#FF6A00" }}>{o.holder.value} {String(o.holder.unit || "").toLowerCase()}</strong>
              {o.holder.country ? ` · ${o.holder.country}` : ""}{o.holder.verifiedAt ? ` · verified ${new Date(o.holder.verifiedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}` : ""}
            </div>
            {o.recordId && <Link to={`/record/${o.recordId}`} style={{ color: "#FF6A00", fontWeight: 800, fontSize: 13, display: "inline-block", marginTop: 8 }}>See the record →</Link>}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" disabled={closed} onClick={tryIt} style={{ background: closed ? "#444" : "#FF6A00", color: "white", border: "none", borderRadius: 100, padding: "16px 28px", fontSize: 14, fontWeight: 900, textTransform: "uppercase", cursor: closed ? "not-allowed" : "pointer", display: "inline-flex", gap: 8, alignItems: "center" }}>
            {o.status === "set" ? "Challenge This Record" : "Try This Record"} <ArrowRight size={16} />
          </button>
          <button type="button" onClick={share} style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 100, padding: "15px 22px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "inline-flex", gap: 8, alignItems: "center" }}>
            <Share2 size={15} /> {copied ? "Link copied!" : "Share"}
          </button>
        </div>
        {closed && <div style={{ color: "#F59E0B", fontWeight: 800 }}>{o.status === "paused" ? "Attempts are paused for now." : "The deadline for this challenge has passed."}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {o.scoring && <div style={box}><div style={h}><Target size={14} /> Scoring</div><div style={{ fontWeight: 800 }}>{SCORING[o.scoring]}{o.measurementUnit ? ` (${o.measurementUnit})` : ""}</div></div>}
          <div style={box}><div style={h}><Clock size={14} /> Time limit</div><div style={{ fontWeight: 800 }}>{o.timeLimit || (o.scoring === "most" ? "None (one continuous run)" : "Timed from start to finish")}</div></div>
          <div style={box}><div style={h}><Users size={14} /> Attempts so far</div><div style={{ fontWeight: 800 }}>{o.attempts}</div></div>
          {o.deadline && <div style={box}><div style={h}><Clock size={14} /> Deadline</div><div style={{ fontWeight: 800 }}>{new Date(o.deadline).toLocaleDateString("en-US", { dateStyle: "long" })}</div></div>}
        </div>
        {o.rules && <div style={box}><div style={h}><FileText size={14} /> Rules for this challenge</div><div style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.75, whiteSpace: "pre-line" }}>{o.rules}</div></div>}
        {o.evidence && <div style={box}><div style={h}><Video size={14} /> Video requirements</div><div style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.75, whiteSpace: "pre-line" }}>{o.evidence}</div></div>}
        {o.safety && <div style={{ ...box, borderColor: "rgba(239,68,68,0.35)" }}><div style={{ ...h, color: "#ef4444" }}><ShieldAlert size={14} /> Safety</div><div style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.75, whiteSpace: "pre-line" }}>{o.safety}</div></div>}
        <GeneralRules />
        {showForm && user && o.status !== "set" && !closed && <ChallengeSubmitForm challenge={o} />}
        <div style={{ ...box, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, fontSize: 14 }}>
          <strong style={{ color: "white" }}>How the first record holder is decided:</strong> the challenge stays open while attempts are reviewed. The first attempt AMPEX approves sets the official record (it isn't simply who uploads first). After that, members beat it through the normal Records challenge: later attempts must exceed the verified count or hold time, or finish faster. Matching a result leaves the record in place.
        </div>
      </section>
      <Footer />
    </div>
  );
}
