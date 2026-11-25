// Videos, live streams, replays and record pages are for members (Curtis, Nov 25): visitors can see the lists
// and pictures, but opening one asks them to create a free account or sign in.
//   <MembersOnlyCard />                the message with "Create free account" and "Sign in" buttons
//   <MembersOnlyBox poster title>      a video spot: the player for members, the message over a blurred picture for visitors
//   <MembersGateModal open onClose />  the same message as a pop-up
//   <MembersOnlyPage kind="record">    a whole page (record or stream page) for members only
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useParams } from "react-router-dom";
import { Lock, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiCall, formatProductImage } from "../utils/api";
import Navbar from "./Navbar";
import Footer from "./Footer";

const btn = { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 100, padding: "12px 22px", fontSize: 13, fontWeight: 900, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.04em" };

export function MembersOnlyCard({ compact = false, title, style }) {
  const location = useLocation();
  const from = `${location.pathname}${location.search || ""}`;
  return (
    <div role="region" aria-label="Members only" style={{ background: "rgba(14,14,14,0.92)", border: "1px solid rgba(255,106,0,0.35)", borderRadius: compact ? 18 : 24, padding: compact ? "20px 18px" : "32px 28px", maxWidth: 460, width: "100%", textAlign: "center", color: "white", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", ...style }}>
      <div style={{ width: compact ? 40 : 52, height: compact ? 40 : 52, borderRadius: "50%", background: "rgba(255,106,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <Lock size={compact ? 18 : 22} color="#FF6A00" />
      </div>
      {title && <div style={{ fontSize: 12, color: "#aaa", fontWeight: 700, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>}
      <h3 style={{ fontSize: compact ? 17 : 22, fontWeight: 950, margin: "0 0 8px", lineHeight: 1.2 }}>Create a free account or sign in</h3>
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: compact ? 13 : 14, lineHeight: 1.55, margin: "0 0 18px" }}>
        to watch live streams and replays, view records, submit records and compete.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link to="/signup" state={{ from }} style={{ ...btn, background: "#FF6A00", color: "white", boxShadow: "0 10px 24px rgba(255,106,0,0.3)" }}>Create free account</Link>
        <Link to="/login" state={{ from }} style={{ ...btn, background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.35)" }}>Sign in</Link>
      </div>
    </div>
  );
}

// Fills its parent (which must be position: relative and sized), like a video player would
export function MembersOnlyBox({ poster, title, children }) {
  const { user } = useAuth();
  if (user) return children;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#050505", overflow: "hidden" }}>
      {poster && <img src={poster} alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(14px) brightness(0.45)", transform: "scale(1.1)" }} />}
      <MembersOnlyCard compact title={title} style={{ position: "relative" }} />
    </div>
  );
}

export function MembersGateModal({ open, onClose, title }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Members only" onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 460 }}>
        <button type="button" onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 10, right: 10, zIndex: 2, background: "transparent", border: "none", color: "#aaa", cursor: "pointer", padding: 6 }}><X size={20} /></button>
        <MembersOnlyCard title={title} />
      </div>
    </div>,
    document.body
  );
}

// Record and stream pages: members see the page, visitors see what they clicked (title and picture) and the message
const previewOf = async (kind, id) => {
  if (kind === "record") {
    const d = await apiCall(`/records/${id}`, "GET");
    const r = d?.record || d || {};
    const img = r.thumbnail_url && r.thumbnail_url !== "pending_upload" ? formatProductImage(r.thumbnail_url) : "";
    const value = String(r.value ?? "").trim();
    const unit = String(r.unit || "").trim();
    // "50 feet" + "FEET" → "50 feet" (some records already have the unit in the value)
    const line = value ? (unit && !value.toLowerCase().includes(unit.toLowerCase()) ? `${value} ${unit}` : value) : "";
    return { title: r.title || "", img, line };
  }
  const e = await apiCall(`/events/${id}`, "GET");
  const ev = e?.event || e || {};
  return { title: ev.title || "", img: ev.imageUrl || ev.image || ev.img || "", line: ev.isLive ? "LIVE NOW" : "" };
};

export function MembersOnlyPage({ kind, children }) {
  const { user, loading } = useAuth();
  const params = useParams();
  const id = params.recordId || params.id;
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (user || loading || !id) return undefined;
    let cancelled = false;
    previewOf(kind, id).then((p) => { if (!cancelled) setPreview(p); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user, loading, kind, id]);
  if (loading) return <div style={{ minHeight: "100vh", background: "#000" }} />;
  if (user) return children;
  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "white", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 16px 60px", overflow: "hidden" }}>
        {preview?.img && <img src={preview.img} alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(18px) brightness(0.35)", transform: "scale(1.1)" }} />}
        <div style={{ position: "relative", width: "100%", maxWidth: 520, textAlign: "center" }}>
          <div style={{ color: "#FF6A00", fontSize: 12, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>{kind === "record" ? "World record" : "Live stream"}</div>
          {preview?.title && <h1 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 950, textTransform: "uppercase", lineHeight: 1.1, margin: "0 0 8px" }}>{preview.title}</h1>}
          {preview?.line && <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 800, marginBottom: 20 }}>{preview.line}</div>}
          <MembersOnlyCard style={{ margin: "16px auto 0" }} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
