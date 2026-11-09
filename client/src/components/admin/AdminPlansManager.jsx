// Admin → Memberships: edit/create plans (price, billing, submission limit, features)
// and approve upgrade requests waiting for payment confirmation.
import React, { useCallback, useEffect, useState } from "react";
import { Plus, Edit3, Trash2, CheckCircle, XCircle, Crown } from "lucide-react";
import { ui, pill, useAdminApi, SectionHeader, Field, Notice, Modal, Empty, Table, fmtDate, fmtMoney } from "./adminUi";

const INTERVALS = { month: "Monthly", year: "Yearly", one_time: "One-time (lifetime)" };
const blank = { id: null, name: "", slug: "", description: "", price: "", billingInterval: "month", submissionLimit: "", features: "", priorityReview: false, vipProfile: false, color: "#FF6A00", sortOrder: 0, active: true, stripePriceId: "" };

export default function AdminPlansManager() {
  const api = useAdminApi();
  const [plans, setPlans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        api("/membership-plans/all"),
        api("/memberships?status=pending&limit=200").catch(() => ({ memberships: [] })),
      ]);
      setPlans(Array.isArray(p) ? p : []);
      setRequests(r?.memberships || []);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Could not load plans" });
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name.trim()) { setMsg({ type: "error", text: "Plan name is required." }); return; }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      slug: form.slug || undefined,
      description: form.description,
      price: form.price === "" ? 0 : Number(form.price),
      billingInterval: form.billingInterval,
      submissionLimit: form.submissionLimit === "" ? null : Number(form.submissionLimit),
      features: String(form.features).split("\n").map((f) => f.trim()).filter(Boolean),
      priorityReview: !!form.priorityReview,
      vipProfile: !!form.vipProfile,
      color: form.color,
      sortOrder: Number(form.sortOrder) || 0,
      active: !!form.active,
      stripePriceId: form.stripePriceId || null,
    };
    try {
      if (form.id) await api(`/membership-plans/${form.id}`, "PUT", body);
      else await api("/membership-plans", "POST", body);
      setForm(null);
      setMsg({ type: "success", text: `Plan "${body.name}" saved. The Membership page shows it straight away.` });
      await load();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Could not save the plan." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete the ${p.name} plan? Plans with members are hidden instead of deleted.`)) return;
    try {
      const res = await api(`/membership-plans/${p.id}`, "DELETE");
      setMsg({ type: "success", text: res?.message || "Plan removed." });
      await load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const activate = async (m) => {
    if (!window.confirm(`Activate ${m.tier} for ${m.user?.name || m.user?.email || "this member"}? Confirm you have received the payment first.`)) return;
    try {
      await api(`/memberships/${m.id}/activate`, "PUT", { paymentReceived: true });
      setMsg({ type: "success", text: "Membership activated." });
      await load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const decline = async (m) => {
    const reason = window.prompt("Reason for declining (optional):", "");
    if (reason === null) return;
    try {
      await api(`/memberships/${m.id}/cancel`, "PUT", { reason: reason || "Upgrade request declined" });
      setMsg({ type: "success", text: "Request declined." });
      await load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const planName = (slug) => plans.find((p) => p.slug === slug)?.name || slug;
  const contact = (m) => { try { return JSON.parse(m.notes || "{}"); } catch { return {}; } };

  return (
    <div style={{ marginBottom: "40px" }}>
      <SectionHeader
        eyebrow="Memberships"
        title="Membership Plans"
        desc="Prices, billing, submission limits and benefits for every plan. Changes appear on the Membership page immediately. Existing members keep their plan when you edit it."
        actions={<button style={ui.btn} onClick={() => setForm({ ...blank })}><Plus size={16} /> New Plan</button>}
      />
      <Notice type={msg.type} onClose={() => setMsg({ type: "", text: "" })}>{msg.text}</Notice>

      {loading && !plans.length ? <Empty>Loading plans...</Empty> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px", marginBottom: "32px" }}>
          {plans.map((p) => (
            <div key={p.id} style={{ ...ui.card, padding: "18px", borderTop: `3px solid ${p.color}`, opacity: p.active ? 1 : 0.55, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: "17px", color: "white" }}>{p.name}</div>
                  <div style={{ ...ui.muted, fontSize: "12px" }}>{p.slug}</div>
                </div>
                {!p.active && <span style={pill("#888")}>hidden</span>}
              </div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: p.color }}>
                {p.price ? fmtMoney(p.price) : "Free"}
                {p.price ? <span style={{ fontSize: "12px", color: "#888", fontWeight: 600 }}> {p.billingInterval === "one_time" ? "one-time" : p.billingInterval === "year" ? "/ year" : "/ month"}</span> : null}
              </div>
              <div style={{ fontSize: "13px", color: "#ccc" }}>{p.submissionLimit == null ? "Unlimited submissions" : `${p.submissionLimit} submissions / month`}</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {p.priorityReview && <span style={pill("#fbbf24")}>Priority review</span>}
                {p.vipProfile && <span style={pill("#a855f7")}>VIP profile</span>}
                <span style={pill("#22c55e")}>{p.activeMembers || 0} active</span>
              </div>
              <div style={{ display: "flex", gap: "6px", marginTop: "auto", paddingTop: "8px" }}>
                <button style={{ ...ui.btnGhost, flex: 1, justifyContent: "center" }} onClick={() => setForm({ ...blank, ...p, price: p.price, submissionLimit: p.submissionLimit ?? "", features: (p.features || []).join("\n"), stripePriceId: p.stripePriceId || "" })}><Edit3 size={14} /> Edit</button>
                <button style={ui.iconBtn} title="Delete" onClick={() => remove(p)}><Trash2 size={15} color="#ef4444" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <Crown size={18} color="#FF5500" />
        <h3 style={ui.h3}>Upgrade requests waiting for payment</h3>
        <span style={pill(requests.length ? "#fbbf24" : "#888")}>{requests.length}</span>
      </div>
      <p style={{ ...ui.sub, marginBottom: "14px" }}>
        Until Stripe is connected, members request a paid plan from the Membership page and nothing is charged. Activate a request once you have received the payment; the member's plan and submission limit update immediately.
      </p>
      {requests.length === 0 ? <Empty>No pending upgrade requests.</Empty> : (
        <Table head={["Member", "Plan", "Amount", "Requested", "Contact", ""]} minWidth={760}>
          {requests.map((m) => {
            const c = contact(m);
            const amount = (m.paymentHistory || []).find((h) => h.status === "pending")?.amount ?? m.price;
            return (
              <tr key={m.id}>
                <td style={ui.td}><div style={{ fontWeight: 700, color: "white" }}>{m.user?.name || c.fullName || "—"}</div><div style={ui.muted}>{m.user?.email || c.email}</div></td>
                <td style={ui.td}>{planName(m.tier)}</td>
                <td style={ui.td}>{fmtMoney(amount)}{c.couponCode ? <div style={ui.muted}>coupon {c.couponCode}</div> : null}</td>
                <td style={ui.td}>{fmtDate(m.createdAt)}</td>
                <td style={ui.td}><div style={{ fontSize: "13px" }}>{c.phone || "—"}</div><div style={{ ...ui.muted, fontSize: "12px", maxWidth: "220px" }}>{c.address}</div></td>
                <td style={{ ...ui.td, whiteSpace: "nowrap" }}>
                  <button style={{ ...ui.btn, padding: "8px 12px", marginRight: "6px" }} onClick={() => activate(m)}><CheckCircle size={14} /> Activate</button>
                  <button style={ui.btnDanger} onClick={() => decline(m)}><XCircle size={14} /> Decline</button>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {form && (
        <Modal
          title={form.id ? `Edit ${form.name}` : "New membership plan"}
          onClose={() => setForm(null)}
          width={620}
          footer={<>
            <button style={ui.btnGhost} onClick={() => setForm(null)}>Cancel</button>
            <button style={ui.btn} disabled={saving} onClick={save}>{saving ? "Saving..." : "Save plan"}</button>
          </>}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <Field label="Plan name"><input style={ui.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
            <Field label="Price (USD)" hint="0 = free plan"><input type="number" min="0" step="0.01" inputMode="decimal" style={ui.input} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <Field label="Billing">
              <select style={ui.input} value={form.billingInterval} onChange={(e) => setForm({ ...form, billingInterval: e.target.value })}>
                {Object.entries(INTERVALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Submissions per month" hint="Leave empty for unlimited"><input type="number" min="0" inputMode="numeric" style={ui.input} value={form.submissionLimit} onChange={(e) => setForm({ ...form, submissionLimit: e.target.value })} /></Field>
          </div>
          <Field label="Short description"><input style={ui.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Who this plan is for" /></Field>
          <Field label="Benefits" hint="One per line. Shown as the checklist on the plan card."><textarea style={{ ...ui.input, minHeight: "120px" }} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></Field>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ddd", fontSize: "14px" }}><input type="checkbox" checked={form.priorityReview} onChange={(e) => setForm({ ...form, priorityReview: e.target.checked })} /> Priority review</label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ddd", fontSize: "14px" }}><input type="checkbox" checked={form.vipProfile} onChange={(e) => setForm({ ...form, vipProfile: e.target.checked })} /> VIP profile</label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ddd", fontSize: "14px" }}><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Shown on Membership page</label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
            <Field label="Card colour"><input type="color" style={{ ...ui.input, padding: "4px", height: "42px" }} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
            <Field label="Display order"><input type="number" style={ui.input} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></Field>
            <Field label="Stripe price ID" hint="Filled in once Stripe is connected"><input style={ui.input} value={form.stripePriceId} onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })} placeholder="price_..." /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
