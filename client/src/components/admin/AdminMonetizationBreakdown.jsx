// Admin → Monetization: revenue breakdowns computed from real orders, memberships, tickets,
// submission fees, manual revenue and coupon redemptions (GET /admin/monetization/breakdown).
import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ui, useAdminApi, SectionHeader, Notice, Empty, Table, fmtMoney } from "./adminUi";

const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });
};
const SOURCES = [["membership", "Memberships"], ["shop", "Shop"], ["tickets", "Tickets"], ["submissions", "Submission fees"], ["manual", "Manual"]];

// Single-series monthly revenue bars with a hover tooltip and a table view
function RevenueBars({ trend }) {
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...trend.map((t) => t.total));
  const H = 180;
  return (
    <div style={ui.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <h3 style={ui.h3}>Revenue by month (last 12 months)</h3>
        <button style={ui.btnGhost} onClick={() => setAsTable((v) => !v)}>{asTable ? "Show chart" : "Show table"}</button>
      </div>
      {asTable ? (
        <Table head={["Month", ...SOURCES.map((s) => s[1]), "Total"]} minWidth={640}>
          {trend.map((t) => (
            <tr key={t.month}>
              <td style={ui.td}>{monthLabel(t.month)}</td>
              {SOURCES.map(([k]) => <td key={k} style={ui.td}>{fmtMoney(t[k])}</td>)}
              <td style={{ ...ui.td, fontWeight: 800, color: "white" }}>{fmtMoney(t.total)}</td>
            </tr>
          ))}
        </Table>
      ) : (
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: `${H}px`, borderBottom: "1px solid rgba(255,255,255,0.12)" }} onMouseLeave={() => setHover(null)}>
            {trend.map((t, i) => (
              <div
                key={t.month}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={0}
                aria-label={`${monthLabel(t.month)}: ${fmtMoney(t.total)}`}
                style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", cursor: "default", outline: "none" }}
              >
                <div style={{ width: "100%", maxWidth: "36px", margin: "0 auto", height: `${Math.max(t.total ? 3 : 0, (t.total / max) * (H - 8))}px`, background: hover === i ? "#ff7a33" : "#FF5500", borderRadius: "4px 4px 0 0" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "2px", marginTop: "6px" }}>
            {trend.map((t, i) => (
              <div key={t.month} style={{ flex: 1, textAlign: "center", fontSize: "10px", color: "#777", overflow: "hidden", whiteSpace: "nowrap", visibility: trend.length > 8 && i % 2 ? "hidden" : "visible" }}>{monthLabel(t.month)}</div>
            ))}
          </div>
          {hover !== null && trend[hover] && (
            <div style={{ position: "absolute", top: 0, left: `${Math.min(70, Math.max(0, (hover / trend.length) * 100 - 10))}%`, background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "10px 12px", fontSize: "12px", color: "#ccc", pointerEvents: "none", minWidth: "170px", boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>
              <div style={{ fontWeight: 800, color: "white", marginBottom: "6px" }}>{monthLabel(trend[hover].month)} · {fmtMoney(trend[hover].total)}</div>
              {SOURCES.map(([k, label]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}><span>{label}</span><span style={{ color: "white" }}>{fmtMoney(trend[hover][k])}</span></div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminMonetizationBreakdown() {
  const api = useAdminApi();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    api("/admin/monetization/breakdown")
      .then((d) => { if (alive) { setData(d); setError(""); } })
      .catch((e) => { if (alive) setError(e.message || "Could not load the breakdown"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [api, tick]);

  const t = data?.totals || {};
  const tiles = [
    ["All-time revenue", fmtMoney(t.allTime)],
    ["Memberships", fmtMoney(t.membership)],
    ["Shop", fmtMoney(t.shop)],
    ["Event tickets", fmtMoney(t.tickets)],
    ["Submission fees", fmtMoney(t.submissions)],
    ["Manual revenue", fmtMoney(t.manual)],
    ["Coupon discounts given", fmtMoney(t.couponDiscounts)],
    ["Active members", t.activeMembers ?? 0],
    ["Paid shop orders", t.orders ?? 0],
    ["Failed payments", t.failedPayments ?? 0],
  ];

  return (
    <div style={{ marginTop: "8px", marginBottom: "40px" }}>
      <SectionHeader
        eyebrow="Monetization"
        title="Revenue Breakdown"
        desc="Calculated from completed payments only: paid shop orders, confirmed membership payments, issued event tickets, paid submission fees and manual revenue entries."
        actions={<button style={ui.btnGhost} onClick={() => { setLoading(true); setTick((n) => n + 1); }}><RefreshCw size={14} /> Refresh</button>}
      />
      <Notice type="error">{error}</Notice>
      {loading && !data ? <Empty>Loading revenue data...</Empty> : data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px" }}>
            {tiles.map(([label, value]) => (
              <div key={label} style={{ ...ui.card, padding: "16px" }}>
                <div style={{ ...ui.label, marginBottom: "6px" }}>{label}</div>
                <div style={{ fontSize: "22px", fontWeight: 900, color: "white" }}>{value}</div>
              </div>
            ))}
          </div>

          <RevenueBars trend={data.trend || []} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "20px" }}>
            <div style={ui.card}>
              <h3 style={{ ...ui.h3, marginBottom: "14px" }}>Memberships by plan</h3>
              {(data.membershipByTier || []).length === 0 ? <Empty>No memberships yet.</Empty> : (
                <Table head={["Plan", "Active", "All time", "Revenue"]} minWidth={360}>
                  {data.membershipByTier.map((r) => (
                    <tr key={r.tier}><td style={ui.td}>{r.name}</td><td style={ui.td}>{r.active}</td><td style={ui.td}>{r.total}</td><td style={{ ...ui.td, color: "white", fontWeight: 700 }}>{fmtMoney(r.revenue)}</td></tr>
                  ))}
                </Table>
              )}
            </div>
            <div style={ui.card}>
              <h3 style={{ ...ui.h3, marginBottom: "14px" }}>Member movement</h3>
              <Table head={["Month", "New", "Cancelled", "Net"]} minWidth={340}>
                {(data.memberMovement || []).slice().reverse().map((r) => (
                  <tr key={r.month}>
                    <td style={ui.td}>{monthLabel(r.month)}</td>
                    <td style={ui.td}>{r.newMembers}</td>
                    <td style={ui.td}>{r.cancelled}</td>
                    <td style={{ ...ui.td, color: "white", fontWeight: 700 }}>{r.newMembers - r.cancelled > 0 ? "+" : ""}{r.newMembers - r.cancelled}</td>
                  </tr>
                ))}
              </Table>
            </div>
            <div style={ui.card}>
              <h3 style={{ ...ui.h3, marginBottom: "14px" }}>Top products</h3>
              {(data.topProducts || []).length === 0 ? <Empty>No paid orders yet.</Empty> : (
                <Table head={["Product", "Units", "Revenue"]} minWidth={340}>
                  {data.topProducts.map((p) => (
                    <tr key={p.product}><td style={ui.td}>{p.product}</td><td style={ui.td}>{p.units}</td><td style={{ ...ui.td, color: "white", fontWeight: 700 }}>{fmtMoney(p.revenue)}</td></tr>
                  ))}
                </Table>
              )}
            </div>
            <div style={ui.card}>
              <h3 style={{ ...ui.h3, marginBottom: "14px" }}>Coupon usage</h3>
              {(data.coupons || []).length === 0 ? <Empty>No coupons redeemed yet.</Empty> : (
                <Table head={["Code", "Uses", "Discount given"]} minWidth={320}>
                  {data.coupons.map((c) => (
                    <tr key={c.code}><td style={{ ...ui.td, fontFamily: "monospace", color: "white" }}>{c.code}</td><td style={ui.td}>{c.uses}</td><td style={ui.td}>{fmtMoney(c.discount)}</td></tr>
                  ))}
                </Table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
