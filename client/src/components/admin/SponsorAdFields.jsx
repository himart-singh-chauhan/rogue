// Inside the sponsor form (Admin → Sponsors & Ads): how long the sponsor's video ad runs (10 sec / 30 sec /
// 1 min) and what this sponsor pays. Picking a length or a banner spot fills in the price from the Ad prices list.
import { useEffect, useState } from "react";
import { useAdminApi } from "./adminUi";
import { PERIODS } from "./adPeriods";

export default function SponsorAdFields({ form, setForm, labelStyle, inputStyle }) {
  const api = useAdminApi();
  const [pricing, setPricing] = useState(null);
  useEffect(() => { api("/admin/ad-pricing").then(setPricing).catch(() => {}); }, [api]);

  const isVideoAd = form.placement === "video_preroll";
  const listPrice = (() => {
    if (!pricing) return null;
    if (isVideoAd) return pricing.video.find((v) => v.seconds === Number(form.ad_seconds)) || null;
    return pricing.banners.find((b) => b.placement === form.placement) || null;
  })();
  const fillFrom = (p) => { if (p && Number(p.price) > 0) setForm((f) => ({ ...f, price: String(p.price), price_period: p.period })); };

  return (
    <>
      {isVideoAd && (
        <div>
          <label style={labelStyle}>Video ad length *</label>
          <select value={form.ad_seconds || ""} style={inputStyle}
            onChange={(e) => {
              const seconds = e.target.value;
              setForm((f) => ({ ...f, ad_seconds: seconds, content_type: "video" }));
              fillFrom(pricing?.video.find((v) => v.seconds === Number(seconds)));
            }}>
            <option value="">Choose…</option>
            <option value="10">10 seconds</option>
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
          </select>
          <div style={{ fontSize: "11px", color: "#888", marginTop: "6px" }}>Plays before record videos, replays and live streams, and stops at this length. Upload the sponsor's video below.</div>
        </div>
      )}
      <div>
        <label style={labelStyle}>Price this sponsor pays</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input type="number" min="0" step="0.01" value={form.price ?? ""} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" style={{ ...inputStyle, flex: 1 }} />
          <select value={form.price_period || ""} onChange={(e) => setForm((f) => ({ ...f, price_period: e.target.value }))} style={{ ...inputStyle, flex: 1 }}>
            <option value="">—</option>
            {PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {listPrice && Number(listPrice.price) > 0 && (
          <div style={{ fontSize: "11px", color: "#888", marginTop: "6px" }}>
            Your price list: ${Number(listPrice.price).toFixed(2)} {(PERIODS.find(([v]) => v === listPrice.period) || [])[1]}.{" "}
            <button type="button" onClick={() => fillFrom(listPrice)} style={{ background: "none", border: "none", color: "#FF5500", cursor: "pointer", padding: 0, fontSize: "11px", fontWeight: 800 }}>Use it</button>
          </div>
        )}
      </div>
    </>
  );
}
