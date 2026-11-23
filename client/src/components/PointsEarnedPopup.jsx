// Shown over the order confirmation as soon as a paid order's points are credited to the member's account.
// The number comes from the points ledger for that order, so it always matches what was added.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, X } from "lucide-react";

export default function PointsEarnedPopup({ points, balance, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!(points > 0)) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="points-popup-title" onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 440, background: "linear-gradient(160deg, #1d1d1d, #0d0d0d)", border: "1px solid rgba(255,106,0,0.5)", borderRadius: 28, padding: "36px 28px 28px", textAlign: "center", color: "white", boxShadow: "0 30px 80px rgba(255,106,0,0.25)" }}>
        <button type="button" onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.08)", border: "none", color: "white", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        <div style={{ width: 84, height: 84, borderRadius: "50%", margin: "0 auto 18px", background: "rgba(255,106,0,0.15)", border: "2px solid #FF6A00", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Star size={40} color="#FF6A00" fill="#FF6A00" />
        </div>
        <div style={{ fontSize: 48, fontWeight: 950, color: "#FF6A00", lineHeight: 1 }}>+{points.toLocaleString()}</div>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", margin: "6px 0 18px" }}>REWARD POINTS</div>
        <h2 id="points-popup-title" style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.4, margin: "0 0 10px" }}>
          Congratulations! You earned {points.toLocaleString()} points for your purchase on Ampex World Records.
        </h2>
        {balance != null && <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 22 }}>Your points balance is now <strong style={{ color: "white" }}>{Number(balance).toLocaleString()}</strong>.</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: 100, padding: "14px 28px", fontSize: 13, fontWeight: 900, textTransform: "uppercase", cursor: "pointer" }}>Great!</button>
          <Link to="/profile" onClick={onClose} style={{ border: "1px solid rgba(255,255,255,0.25)", color: "white", borderRadius: 100, padding: "13px 22px", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>See my rewards</Link>
        </div>
      </div>
    </div>
  );
}
