// Admin → Rewards & Referrals: the AMPEX Referral, Points & Rewards program.
import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Search, RefreshCw } from "lucide-react";
import { ui, pill, StatusPill, useAdminApi, SectionHeader, Field, Notice, Empty, Tabs, Table, fmtDate } from "./adminUi";
import { SHOP_CATEGORIES } from "../../utils/shopCategories";

const TYPE_OPTIONS = [["manual", "Manual adjustment"], ["promotion", "Promotion bonus"], ["fraud_adjustment", "Fraud adjustment"]];

function Overview({ api }) {
  const [r, setR] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api("/admin/rewards/report").then(setR).catch((e) => setErr(e.message)); }, [api]);
  if (err) return <Notice type="error">{err}</Notice>;
  if (!r) return <div style={ui.muted}>Loading…</div>;
  const tile = (label, value) => (
    <div style={{ ...ui.card, padding: "16px" }}><div style={{ ...ui.label, marginBottom: 4 }}>{label}</div><div style={{ color: "white", fontSize: "24px", fontWeight: 950 }}>{value}</div></div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {!r.enabled && <Notice type="error">The program is switched off. Turn it on in Settings.</Notice>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
        {tile("Members with points", r.membersWithPoints)}
        {tile("Points outstanding", r.pointsOutstanding.toLocaleString())}
        {tile("Qualified referrals", r.referrals.qualified)}
        {tile("Pending referrals", r.referrals.pending)}
        {tile("Flagged referrals", r.referrals.flagged)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
        <div style={ui.card}>
          <div style={{ ...ui.h3, marginBottom: 12 }}>Members per level</div>
          {Object.entries(r.levelCounts).map(([name, n]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#ddd" }}><span>{name}</span><strong>{n}</strong></div>
          ))}
        </div>
        <div style={ui.card}>
          <div style={{ ...ui.h3, marginBottom: 12 }}>Top referrers</div>
          {r.topReferrers.length === 0 ? <div style={ui.muted}>No qualified referrals yet.</div> : r.topReferrers.map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#ddd" }}><span>{t.name}</span><strong>{t.referrals}</strong></div>
          ))}
        </div>
        <div style={ui.card}>
          <div style={{ ...ui.h3, marginBottom: 12 }}>Points by source</div>
          {Object.keys(r.pointsByType).length === 0 ? <div style={ui.muted}>No points awarded yet.</div> : Object.entries(r.pointsByType).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#ddd" }}><span>{k.replace(/_/g, " ")}</span><strong style={{ color: v < 0 ? "#ef4444" : "white" }}>{v}</strong></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Members({ api, onOpenLedger }) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(null);
  const [adjust, setAdjust] = useState(null);
  const [notice, setNotice] = useState(null);
  const load = useCallback(() => api(`/admin/rewards/members?search=${encodeURIComponent(search)}`).then(setRows).catch((e) => setNotice({ type: "error", text: e.message })), [api, search]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const save = async () => {
    try {
      const r = await api("/admin/rewards/adjust", "POST", { userId: adjust.member.id, points: parseInt(adjust.points, 10), reason: adjust.reason, type: adjust.type });
      setNotice({ type: "success", text: `${adjust.member.name} now has ${r.summary.points} points (${r.summary.level}).` });
      setAdjust(null);
      load();
    } catch (e) { setNotice({ type: "error", text: e.message }); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      <div style={{ position: "relative", maxWidth: 420 }}>
        <Search size={16} color="#777" style={{ position: "absolute", left: 12, top: 12 }} />
        <input style={{ ...ui.input, paddingLeft: 36 }} placeholder="Search name, email, member number or referral code" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {adjust && (
        <div style={{ ...ui.card, borderColor: "rgba(255,85,0,0.35)" }}>
          <div style={{ ...ui.h3, marginBottom: 12 }}>Adjust points for {adjust.member.name} (now {adjust.member.points})</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <Field label="Points (negative to remove)"><input type="number" style={ui.input} value={adjust.points} onChange={(e) => setAdjust({ ...adjust, points: e.target.value })} placeholder="e.g. 50 or -20" /></Field>
            <Field label="Type"><select style={ui.input} value={adjust.type} onChange={(e) => setAdjust({ ...adjust, type: e.target.value })}>{TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Reason (required, shown to the member)" style={{ gridColumn: "1 / -1" }}><input style={ui.input} value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} placeholder="e.g. Bonus for hosting a live event" /></Field>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" style={ui.btn} onClick={save}>Save adjustment</button>
            <button type="button" style={ui.btnGhost} onClick={() => setAdjust(null)}>Cancel</button>
          </div>
        </div>
      )}
      {!rows ? <div style={ui.muted}>Loading…</div> : rows.length === 0 ? <Empty>No members found.</Empty> : (
        <Table head={["Member", "Points", "Level", "Discount", "Referrals", "Code", ""]} minWidth={760}>
          {rows.map((m) => (
            <tr key={m.id}>
              <td style={ui.td}><div style={{ color: "white", fontWeight: 700 }}>{m.name}</div><div style={{ ...ui.muted, fontSize: 12 }}>{m.email}</div></td>
              <td style={ui.td}><strong>{m.points}</strong></td>
              <td style={ui.td}>{m.isAmbassador ? <span style={pill("#FF6A00")}>🎖️ {m.level}</span> : m.level}</td>
              <td style={ui.td}>{m.discountPercent}%</td>
              <td style={ui.td}>{m.referrals}</td>
              <td style={{ ...ui.td, fontFamily: "monospace" }}>{m.referralCode || "—"}</td>
              <td style={{ ...ui.td, whiteSpace: "nowrap" }}>
                <button type="button" style={ui.btnGhost} onClick={() => setAdjust({ member: m, points: "", reason: "", type: "manual" })}>Adjust</button>{" "}
                <button type="button" style={ui.btnGhost} onClick={() => onOpenLedger(m)}>History</button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function Referrals({ api }) {
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState(null);
  const [notice, setNotice] = useState(null);
  const load = useCallback(() => api(`/admin/rewards/referrals?status=${status}`).then(setRows).catch((e) => setNotice({ type: "error", text: e.message })), [api, status]);
  useEffect(() => { load(); }, [load]);
  const decide = async (r, action) => {
    const note = action === "reject" ? window.prompt("Reason for rejecting (optional):", "") : "";
    if (note === null) return;
    try { await api(`/admin/rewards/referrals/${r.id}`, "PUT", { action, note }); setNotice({ type: "success", text: action === "approve" ? "Referral approved and points awarded." : "Referral rejected." }); load(); }
    catch (e) { setNotice({ type: "error", text: e.message }); }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      <Tabs tabs={["all", "pending", "flagged", "qualified", "rejected"].map((s) => ({ id: s, label: s[0].toUpperCase() + s.slice(1) }))} value={status} onChange={setStatus} />
      {!rows ? <div style={ui.muted}>Loading…</div> : rows.length === 0 ? <Empty>No referrals here.</Empty> : (
        <Table head={["Invited member", "Invited by", "Status", "Points", "Joined", "Note", ""]} minWidth={820}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={ui.td}><div style={{ color: "white", fontWeight: 700 }}>{r.referred?.name}</div><div style={{ ...ui.muted, fontSize: 12 }}>{r.referred?.email}</div></td>
              <td style={ui.td}>{r.referrer?.name}<div style={{ ...ui.muted, fontSize: 12 }}>code {r.code}</div></td>
              <td style={ui.td}><StatusPill status={r.status === "qualified" ? "approved" : r.status === "flagged" ? "pending" : r.status} /> {r.status === "flagged" && <span style={pill("#f97316")}>flagged</span>}</td>
              <td style={ui.td}>{r.points || "—"}</td>
              <td style={ui.td}>{fmtDate(r.createdAt)}</td>
              <td style={{ ...ui.td, color: "#aaa", fontSize: 12 }}>{r.note || ""}</td>
              <td style={{ ...ui.td, whiteSpace: "nowrap" }}>
                {r.status !== "qualified" && <button type="button" style={ui.btn} onClick={() => decide(r, "approve")}>Approve</button>}{" "}
                {r.status !== "rejected" && <button type="button" style={ui.btnDanger} onClick={() => decide(r, "reject")}>Reject</button>}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function Ledger({ api, member, onClear }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    setRows(null);
    api(`/admin/rewards/transactions${member ? `?userId=${member.id}` : ""}`).then(setRows).catch((e) => setErr(e.message));
  }, [api, member]);
  if (err) return <Notice type="error">{err}</Notice>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {member && <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><span style={{ color: "white", fontWeight: 800 }}>History for {member.name}</span><button type="button" style={ui.btnGhost} onClick={onClear}>Show everyone</button></div>}
      <div style={ui.muted}>Every change to anyone's points is listed here and can't be edited or deleted. To correct a mistake, add an adjustment.</div>
      {!rows ? <div style={ui.muted}>Loading…</div> : rows.length === 0 ? <Empty>No transactions yet.</Empty> : (
        <Table head={["Date", "Member", "Type", "Points", "Reason", "By"]} minWidth={760}>
          {rows.map((t) => (
            <tr key={t.id}>
              <td style={ui.td}>{fmtDate(t.createdAt)}</td>
              <td style={ui.td}>{t.member?.name || "—"}</td>
              <td style={ui.td}>{t.label}</td>
              <td style={{ ...ui.td, fontWeight: 900, color: t.points >= 0 ? "#22c55e" : "#ef4444" }}>{t.points >= 0 ? "+" : ""}{t.points}</td>
              <td style={{ ...ui.td, color: "#bbb", fontSize: 13 }}>{t.reason}</td>
              <td style={ui.td}>{t.admin || "System"}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

const csv = (a) => (a || []).join(", ");
const fromCsv = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

function Settings({ api }) {
  const [s, setS] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  useEffect(() => { api("/admin/rewards/settings").then(setS).catch((e) => setNotice({ type: "error", text: e.message })); }, [api]);
  useEffect(() => { api("/admin/products").then((p) => setProducts(Array.isArray(p) ? p : p?.products || [])).catch(() => {}); }, [api]);
  if (!s) return notice ? <Notice type="error">{notice.text}</Notice> : <div style={ui.muted}>Loading…</div>;

  const setLevel = (i, k, v) => setS({ ...s, levels: s.levels.map((l, j) => (j === i ? { ...l, [k]: v } : l)) });
  const setP = (k, v) => setS({ ...s, purchase: { ...s.purchase, [k]: v } });
  const setD = (k, v) => setS({ ...s, discount: { ...s.discount, [k]: v } });
  const setPromo = (k, v) => setS({ ...s, promotion: { ...s.promotion, [k]: v } });
  const rates = Object.entries(s.purchase.categoryRates || {});

  const save = async () => {
    setSaving(true);
    try {
      const body = { ...s, levels: s.levels.map((l) => ({ ...l, minPoints: Number(l.minPoints) || 0, discountPercent: Number(l.discountPercent) || 0 })) };
      setS(await api("/admin/rewards/settings", "PUT", body));
      setNotice({ type: "success", text: "Settings saved. They apply straight away." });
    } catch (e) { setNotice({ type: "error", text: e.message }); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      <div style={ui.card}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, color: "white", fontWeight: 800, cursor: "pointer" }}>
          <input type="checkbox" checked={!!s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} style={{ width: 18, height: 18 }} />
          Rewards program is on
        </label>
        <div style={{ ...ui.muted, marginTop: 6 }}>When off, no points are awarded and no reward discounts are given (existing points are kept).</div>
      </div>

      <div style={ui.card}>
        <div style={{ ...ui.h3, marginBottom: 12 }}>Referrals</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <Field label="Points per referral"><input type="number" min="0" style={ui.input} value={s.referralPoints} onChange={(e) => setS({ ...s, referralPoints: e.target.value })} /></Field>
          <Field label="A referral counts when the new member…">
            <select style={ui.input} value={s.referralQualifiesOn} onChange={(e) => setS({ ...s, referralQualifiesOn: e.target.value })}>
              <option value="first_verified_record">gets their first record verified (recommended)</option>
              <option value="signup">creates their account</option>
            </select>
          </Field>
          <Field label="Max referrals per member per day" hint="More than this are held as 'flagged' for you to check."><input type="number" min="1" style={ui.input} value={s.maxReferralsPerDay} onChange={(e) => setS({ ...s, maxReferralsPerDay: e.target.value })} /></Field>
        </div>
      </div>

      <div style={ui.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={ui.h3}>Reward levels</div>
          <button type="button" style={ui.btnGhost} onClick={() => setS({ ...s, levels: [...s.levels, { name: "New level", minPoints: (s.levels[s.levels.length - 1]?.minPoints || 0) + 500, discountPercent: 0 }] })}><Plus size={14} /> Add level</button>
        </div>
        <div style={ui.muted}>Separate from paid membership plans. A member's level comes from their points (refunds and reversals are subtracted). The top level is the AMPEX Ambassador badge.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {s.levels.map((l, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) auto", gap: 8, alignItems: "end" }}>
              <Field label="Name"><input style={ui.input} value={l.name} onChange={(e) => setLevel(i, "name", e.target.value)} /></Field>
              <Field label="From points"><input type="number" min="0" style={ui.input} value={l.minPoints} disabled={i === 0} onChange={(e) => setLevel(i, "minPoints", e.target.value)} /></Field>
              <Field label="Discount %"><input type="number" min="0" max="100" style={ui.input} value={l.discountPercent} onChange={(e) => setLevel(i, "discountPercent", e.target.value)} /></Field>
              <button type="button" style={{ ...ui.iconBtn, marginBottom: 2 }} disabled={i === 0} aria-label={`Remove level ${l.name}`} onClick={() => setS({ ...s, levels: s.levels.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      <div style={ui.card}>
        <div style={{ ...ui.h3, marginBottom: 12 }}>Points for purchases</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          <Field label="Points per $1 spent" hint="Counted on the amount paid after discounts, once payment is confirmed. Refunded or cancelled orders lose their points."><input type="number" min="0" step="0.1" style={ui.input} value={s.purchase.pointsPerDollar} onChange={(e) => setP("pointsPerDollar", e.target.value)} /></Field>
          <Field label="Sections that earn no points" hint="Comma separated, e.g. Tickets"><input style={ui.input} value={csv(s.purchase.excludedCategories)} onChange={(e) => setP("excludedCategories", fromCsv(e.target.value))} /></Field>
        </div>
        <div style={{ ...ui.label, marginTop: 14 }}>Different rate for a shop section (points per $1)</div>
        {rates.map(([cat, rate]) => (
          <div key={cat} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ color: "white", minWidth: 150 }}>{cat}</span>
            <input type="number" min="0" step="0.1" style={{ ...ui.input, width: 120 }} value={rate} onChange={(e) => setP("categoryRates", { ...s.purchase.categoryRates, [cat]: e.target.value })} />
            <button type="button" style={ui.iconBtn} aria-label={`Remove rate for ${cat}`} onClick={() => { const n = { ...s.purchase.categoryRates }; delete n[cat]; setP("categoryRates", n); }}><Trash2 size={14} /></button>
          </div>
        ))}
        <select style={{ ...ui.input, maxWidth: 260 }} value="" onChange={(e) => e.target.value && setP("categoryRates", { ...s.purchase.categoryRates, [e.target.value]: s.purchase.pointsPerDollar })}>
          <option value="">+ Add a section rate…</option>
          {SHOP_CATEGORIES.filter((c) => !(c in (s.purchase.categoryRates || {}))).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ ...ui.label, marginTop: 16 }}>Fixed points for a product (replaces the per-dollar rate for that product)</div>
        {Object.entries(s.purchase.productPoints || {}).map(([pid, pts]) => (
          <div key={pid} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ color: "white", minWidth: 200, flex: "1 1 200px" }}>{products.find((p) => p.id === pid)?.name || pid}</span>
            <input type="number" min="0" style={{ ...ui.input, width: 120 }} value={pts} onChange={(e) => setP("productPoints", { ...s.purchase.productPoints, [pid]: e.target.value })} />
            <span style={ui.muted}>points each</span>
            <button type="button" style={ui.iconBtn} aria-label="Remove fixed points" onClick={() => { const n = { ...s.purchase.productPoints }; delete n[pid]; setP("productPoints", n); }}><Trash2 size={14} /></button>
          </div>
        ))}
        <select style={{ ...ui.input, maxWidth: 360 }} value="" onChange={(e) => e.target.value && setP("productPoints", { ...(s.purchase.productPoints || {}), [e.target.value]: 10 })}>
          <option value="">+ Set fixed points for a product…</option>
          {products.filter((p) => !((s.purchase.productPoints || {})[p.id] !== undefined)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ ...ui.label, marginTop: 16 }}>Products that earn no points</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
          {(s.purchase.excludedProductIds || []).map((pid) => (
            <span key={pid} style={{ ...pill("#aaa"), display: "inline-flex", alignItems: "center", gap: 6 }}>
              {products.find((p) => p.id === pid)?.name || pid}
              <button type="button" aria-label="Remove" onClick={() => setP("excludedProductIds", s.purchase.excludedProductIds.filter((x) => x !== pid))} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: 0 }}>×</button>
            </span>
          ))}
        </div>
        <select style={{ ...ui.input, maxWidth: 360 }} value="" onChange={(e) => e.target.value && setP("excludedProductIds", [...(s.purchase.excludedProductIds || []), e.target.value])}>
          <option value="">+ Exclude a product…</option>
          {products.filter((p) => !(s.purchase.excludedProductIds || []).includes(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div style={ui.card}>
        <div style={{ ...ui.h3, marginBottom: 12 }}>Reward discounts at checkout</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          <Field label="Sections with no reward discount" hint="Comma separated, e.g. Tickets, Championship Belts"><input style={ui.input} value={csv(s.discount.excludedCategories)} onChange={(e) => setD("excludedCategories", fromCsv(e.target.value))} /></Field>
          <Field label="Coupons and reward discounts">
            <select style={ui.input} value={s.allowCouponStacking ? "yes" : "no"} onChange={(e) => setS({ ...s, allowCouponStacking: e.target.value === "yes" })}>
              <option value="no">Don't combine: the bigger discount is used (recommended)</option>
              <option value="yes">Combine both</option>
            </select>
          </Field>
        </div>
      </div>

      <div style={ui.card}>
        <div style={{ ...ui.h3, marginBottom: 12 }}>Promotion</div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, color: "white", fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>
          <input type="checkbox" checked={!!s.promotion.active} onChange={(e) => setPromo("active", e.target.checked)} style={{ width: 18, height: 18 }} /> Multiply purchase points during a promotion
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <Field label="Multiplier"><input type="number" min="1" step="0.5" style={ui.input} value={s.promotion.multiplier} onChange={(e) => setPromo("multiplier", e.target.value)} /></Field>
          <Field label="Starts"><input type="date" style={ui.input} value={(s.promotion.startsAt || "").slice(0, 10)} onChange={(e) => setPromo("startsAt", e.target.value || null)} /></Field>
          <Field label="Ends"><input type="date" style={ui.input} value={(s.promotion.endsAt || "").slice(0, 10)} onChange={(e) => setPromo("endsAt", e.target.value ? `${e.target.value}T23:59:59` : null)} /></Field>
          <Field label="Label shown to members"><input style={ui.input} value={s.promotion.label} onChange={(e) => setPromo("label", e.target.value)} placeholder="e.g. Double points weekend" /></Field>
        </div>
      </div>

      <div><button type="button" style={ui.btn} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save settings"}</button></div>
    </div>
  );
}

export default function AdminRewards() {
  const api = useAdminApi();
  const [tab, setTab] = useState("overview");
  const [ledgerMember, setLedgerMember] = useState(null);
  const [nonce, setNonce] = useState(0);
  return (
    <div>
      <SectionHeader
        eyebrow="Loyalty"
        title="Rewards & Referrals"
        desc="Members earn reward points for referrals and purchases. Levels unlock shop discounts automatically and points are never spent. These points are separate from competition ranking points."
        actions={<button type="button" style={ui.btnGhost} onClick={() => setNonce((n) => n + 1)}><RefreshCw size={14} /> Refresh</button>}
      />
      <Tabs tabs={[{ id: "overview", label: "Overview" }, { id: "members", label: "Members" }, { id: "referrals", label: "Referrals" }, { id: "ledger", label: "Points ledger" }, { id: "settings", label: "Settings" }]} value={tab} onChange={setTab} />
      <div key={`${tab}-${nonce}`}>
        {tab === "overview" && <Overview api={api} />}
        {tab === "members" && <Members api={api} onOpenLedger={(m) => { setLedgerMember(m); setTab("ledger"); }} />}
        {tab === "referrals" && <Referrals api={api} />}
        {tab === "ledger" && <Ledger api={api} member={ledgerMember} onClear={() => setLedgerMember(null)} />}
        {tab === "settings" && <Settings api={api} />}
      </div>
    </div>
  );
}
