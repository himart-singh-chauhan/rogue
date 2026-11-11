// Profile → My Rewards: reward level, points, discount, progress, referral link, referrals and history.
import React, { useEffect, useState } from "react";
import { Copy, Check, Gift, Users, ShoppingBag } from "lucide-react";
import { apiCall } from "../utils/api";

const card = { background: "#121212", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "18px", padding: "22px" };
const label = { fontSize: "10px", fontWeight: 900, color: "#777", letterSpacing: "1px", textTransform: "uppercase" };
const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");

export default function MyRewards({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiCall("/rewards/me", "GET", null, token).then(setData).catch((e) => setError(e.message || "Could not load your rewards."));
  }, [token]);

  if (error) return <div style={{ ...card, color: "#ef4444" }}>{error}</div>;
  if (!data) return <div style={{ ...card, color: "#888", textAlign: "center" }}>Loading your rewards…</div>;
  if (!data.enabled) return <div style={{ ...card, color: "#aaa" }}>The AMPEX Rewards program is paused at the moment.</div>;

  const copy = async () => {
    try { await navigator.clipboard.writeText(data.referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };
  const pct = Math.round((data.progress || 0) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: "white" }}>MY REWARDS</h2>
        <p style={{ color: "#777", fontSize: "13px", margin: "4px 0 0 0" }}>Earn points by inviting members and shopping. Higher levels unlock bigger shop discounts. Points are never spent.</p>
      </div>

      {/* Level + progress */}
      <div style={{ ...card, background: "linear-gradient(135deg, rgba(255,85,0,0.14), #121212 60%)", borderColor: "rgba(255,85,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div style={label}>Your level</div>
            <div style={{ fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 950, color: "white", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {data.isAmbassador && <span aria-hidden="true">🎖️</span>}{data.level}
            </div>
            <div style={{ color: "#FF8A3D", fontWeight: 800, marginTop: "4px" }}>
              {data.discountPercent > 0 ? `${data.discountPercent}% off eligible shop items` : "Reach the next level to unlock a shop discount"}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(110px, 1fr))", gap: "10px" }}>
            <div><div style={label}>Current points</div><div style={{ color: "white", fontSize: "26px", fontWeight: 950 }}>{data.points}</div></div>
            <div><div style={label}>Lifetime earned</div><div style={{ color: "white", fontSize: "26px", fontWeight: 950 }}>{data.lifetimeEarned}</div></div>
          </div>
        </div>
        {data.next ? (
          <div style={{ marginTop: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: "12px", fontWeight: 700, marginBottom: "6px", gap: "10px", flexWrap: "wrap" }}>
              <span>{data.next.pointsToGo} points to {data.next.name} ({data.next.discountPercent}% off)</span><span>{pct}%</span>
            </div>
            <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ height: "10px", background: "rgba(255,255,255,0.08)", borderRadius: "100px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #FF5500, #ff9a3c)", borderRadius: "100px" }} />
            </div>
          </div>
        ) : (
          <div style={{ marginTop: "16px", color: "#FFD700", fontWeight: 800 }}>You've reached the top level. Thank you for being an AMPEX Ambassador!</div>
        )}
        {data.promotion && <div style={{ marginTop: "14px", color: "#4ade80", fontWeight: 800, fontSize: "13px" }}>🔥 {data.promotion.label || "Bonus points promotion"}: purchases earn {data.promotion.multiplier}× points right now.</div>}
      </div>

      {/* Levels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
        {data.levels.map((l) => {
          const reached = data.points >= l.minPoints;
          return (
            <div key={l.name} style={{ ...card, padding: "14px", borderColor: l.name === data.level ? "#FF5500" : "rgba(255,255,255,0.06)", opacity: reached ? 1 : 0.6 }}>
              <div style={{ color: "white", fontWeight: 900, fontSize: "14px" }}>{l.name}</div>
              <div style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>{l.minPoints.toLocaleString()}+ points</div>
              <div style={{ color: "#FF8A3D", fontWeight: 800, fontSize: "13px", marginTop: "6px" }}>{l.discountPercent}% off</div>
            </div>
          );
        })}
      </div>

      {/* Referral link */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", fontWeight: 900, marginBottom: "6px" }}><Gift size={18} color="#FF5500" /> Invite friends</div>
        <p style={{ color: "#999", fontSize: "13px", margin: "0 0 14px 0", lineHeight: 1.6 }}>
          Share your link. You earn {data.referralPoints} points when someone joins with it and {data.referralQualifiesOn === "signup" ? "creates their account" : "gets their first record verified"}.
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input readOnly value={data.referralLink || ""} aria-label="Your referral link" onFocus={(e) => e.target.select()} style={{ flex: "1 1 240px", minWidth: 0, background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "11px 14px", color: "white", fontSize: "14px" }} />
          <button type="button" onClick={copy} style={{ background: "#FF5500", color: "white", border: "none", borderRadius: "10px", padding: "11px 18px", fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy link</>}
          </button>
        </div>
        <div style={{ color: "#777", fontSize: "12px", marginTop: "8px" }}>Your code: <strong style={{ color: "white", letterSpacing: "1px" }}>{data.referralCode}</strong></div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
        <div style={card}><div style={{ ...label, display: "flex", gap: 6, alignItems: "center" }}><Users size={13} /> Successful referrals</div><div style={{ color: "white", fontSize: "26px", fontWeight: 950, marginTop: 6 }}>{data.successfulReferrals}</div></div>
        <div style={card}><div style={{ ...label, display: "flex", gap: 6, alignItems: "center" }}><ShoppingBag size={13} /> Points from purchases</div><div style={{ color: "white", fontSize: "26px", fontWeight: 950, marginTop: 6 }}>{data.purchaseRewards}</div></div>
      </div>

      {/* Referrals */}
      {data.referrals.length > 0 && (
        <div style={card}>
          <div style={{ color: "white", fontWeight: 900, marginBottom: "10px" }}>People you invited</div>
          {data.referrals.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" }}>
              <span style={{ color: "#ddd" }}>{r.name} <span style={{ color: "#777", fontSize: "12px" }}>· joined {fmt(r.createdAt)}</span></span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: r.status === "qualified" ? "#22c55e" : r.status === "rejected" ? "#ef4444" : "#fbbf24" }}>
                {r.status === "qualified" ? `+${r.points} points` : r.status === "rejected" ? "Not eligible" : "Waiting for verification"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      <div style={card}>
        <div style={{ color: "white", fontWeight: 900, marginBottom: "10px" }}>Points history</div>
        {data.transactions.length === 0 ? (
          <div style={{ color: "#777", fontSize: "13px" }}>No points yet. Share your link or shop to start earning.</div>
        ) : data.transactions.map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" }}>
            <span style={{ color: "#ddd", minWidth: 0 }}>{t.label}{t.reason ? <span style={{ color: "#777", fontSize: "12px" }}> · {t.reason}</span> : null}<span style={{ display: "block", color: "#666", fontSize: "11px" }}>{fmt(t.createdAt)}</span></span>
            <span style={{ fontWeight: 900, color: t.points >= 0 ? "#22c55e" : "#ef4444" }}>{t.points >= 0 ? "+" : ""}{t.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
