// Admin → Memberships → Subscribers / Payments: real memberships from the database.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, XCircle, RefreshCw } from "lucide-react";
import { ui, useAdminApi, Notice, Empty, Table, StatusPill, Modal, Field, fmtDate, fmtMoney } from "./adminUi";

export default function AdminSubscribers({ mode = "subscribers" }) {
  const api = useAdminApi();
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState("");
  const [tier, setTier] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "500" });
      if (status) qs.set("status", status);
      if (tier) qs.set("tier", tier);
      if (search.trim()) qs.set("search", search.trim());
      const [m, p] = await Promise.all([api(`/memberships?${qs}`), plans.length ? Promise.resolve(plans) : api("/membership-plans/all")]);
      setRows(m?.memberships || []);
      if (!plans.length) setPlans(Array.isArray(p) ? p : []);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Could not load memberships" });
    } finally {
      setLoading(false);
    }
  }, [api, status, tier, search, plans]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [status, tier]);

  const planName = (slug) => plans.find((p) => p.slug === slug)?.name || slug;

  const payments = useMemo(() => rows.flatMap((m) => (m.paymentHistory || []).map((p, i) => ({
    key: `${m.id}-${i}`, member: m.user, plan: m.tier, ...p,
  }))).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)), [rows]);

  const changePlan = async () => {
    try {
      await api(`/memberships/${editing.id}/change-tier`, "PUT", { newTier: editing.newTier });
      setEditing(null);
      setMsg({ type: "success", text: "Plan changed." });
      await load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const cancel = async (m) => {
    const reason = window.prompt(`Cancel ${m.user?.name || "this member"}'s ${planName(m.tier)} membership? Reason (optional):`, "");
    if (reason === null) return;
    try {
      await api(`/memberships/${m.id}/cancel`, "PUT", { reason });
      setMsg({ type: "success", text: "Membership cancelled." });
      await load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  return (
    <div>
      <Notice type={msg.type} onClose={() => setMsg({ type: "", text: "" })}>{msg.text}</Notice>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: "340px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#666" }} />
          <input style={{ ...ui.input, paddingLeft: "36px" }} placeholder="Search name or email, then Enter" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") load(); }} />
        </div>
        <select style={{ ...ui.input, width: "auto" }} value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="">All plans</option>
          {plans.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
        </select>
        <select style={{ ...ui.input, width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="pending">Pending payment</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <button style={ui.btnGhost} onClick={load}><RefreshCw size={14} /> Refresh</button>
      </div>

      {loading ? <Empty>Loading...</Empty> : mode === "payments" ? (
        payments.length === 0 ? <Empty>No membership payments recorded yet.</Empty> : (
          <Table head={["Date", "Member", "Plan", "Amount", "Status", "Reference"]} minWidth={720}>
            {payments.map((p) => (
              <tr key={p.key}>
                <td style={ui.td}>{fmtDate(p.date)}</td>
                <td style={ui.td}><div style={{ color: "white", fontWeight: 700 }}>{p.member?.name || "—"}</div><div style={ui.muted}>{p.member?.email}</div></td>
                <td style={ui.td}>{planName(p.plan)}</td>
                <td style={{ ...ui.td, color: "white", fontWeight: 700 }}>{fmtMoney(p.amount)}</td>
                <td style={ui.td}><StatusPill status={p.status === "completed" ? "paid" : p.status} /></td>
                <td style={{ ...ui.td, fontFamily: "monospace", fontSize: "12px" }}>{p.transactionId || "—"}</td>
              </tr>
            ))}
          </Table>
        )
      ) : rows.length === 0 ? <Empty>No memberships match.</Empty> : (
        <Table head={["Member", "Plan", "Status", "Started", "Renews / ends", "Submissions", ""]} minWidth={820}>
          {rows.map((m) => (
            <tr key={m.id}>
              <td style={ui.td}><div style={{ color: "white", fontWeight: 700 }}>{m.user?.name || "—"}</div><div style={ui.muted}>{m.user?.email}</div></td>
              <td style={ui.td}>{planName(m.tier)}</td>
              <td style={ui.td}><StatusPill status={m.status} /></td>
              <td style={ui.td}>{fmtDate(m.startDate)}</td>
              <td style={ui.td}>{m.endDate ? fmtDate(m.endDate) : "No end date"}</td>
              <td style={ui.td}>{m.submissionCount || 0} / {m.submissionLimit == null ? "∞" : m.submissionLimit}</td>
              <td style={{ ...ui.td, whiteSpace: "nowrap" }}>
                {m.status === "active" && <>
                  <button style={{ ...ui.btnGhost, marginRight: "6px" }} onClick={() => setEditing({ id: m.id, name: m.user?.name, newTier: m.tier })}>Change plan</button>
                  <button style={ui.btnDanger} onClick={() => cancel(m)}><XCircle size={14} /> Cancel</button>
                </>}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {editing && (
        <Modal title={`Change plan for ${editing.name || "member"}`} onClose={() => setEditing(null)} footer={<>
          <button style={ui.btnGhost} onClick={() => setEditing(null)}>Cancel</button>
          <button style={ui.btn} onClick={changePlan}>Save</button>
        </>}>
          <Field label="New plan" hint="The submission limit and end date update to match the new plan.">
            <select style={ui.input} value={editing.newTier} onChange={(e) => setEditing({ ...editing, newTier: e.target.value })}>
              {plans.map((p) => <option key={p.slug} value={p.slug}>{p.name}{p.price ? ` (${fmtMoney(p.price)})` : ""}</option>)}
            </select>
          </Field>
        </Modal>
      )}
    </div>
  );
}
