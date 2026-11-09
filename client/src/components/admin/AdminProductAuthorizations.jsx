// Shop → Purchase approvals: championship belts (and any product marked "requires approval")
// can only be bought by a competitor an administrator approves for that product.
import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, Plus, ShieldCheck } from "lucide-react";
import { formatProductImage } from "../../utils/api";
import { ui, useAdminApi, SectionHeader, Field, Notice, Modal, Empty, Table, Tabs, StatusPill, fmtDate } from "./adminUi";

export default function AdminProductAuthorizations({ products = [] }) {
  const api = useAdminApi();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [grant, setGrant] = useState(null);
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const restricted = products.filter((p) => p.requires_authorization || p.requiresAuthorization);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api(`/admin/product-authorizations?status=${status}`);
      setRows(Array.isArray(res) ? res : []);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Could not load approvals" });
    } finally {
      setLoading(false);
    }
  }, [api, status]);
  useEffect(() => { load(); }, [load]);

  const decide = async (row, next) => {
    const note = next === "approved" ? "" : window.prompt("Note for the competitor (optional):", "");
    if (note === null) return;
    try {
      await api(`/admin/product-authorizations/${row.id}`, "PUT", { status: next, adminNote: note });
      setMsg({ type: "success", text: `${row.user?.name || "Competitor"} ${next === "approved" ? "approved" : next} for ${row.product?.name || "this product"}.` });
      await load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const openGrant = async () => {
    setGrant({ productId: restricted[0]?.id || "", userId: "", adminNote: "" });
    if (!users.length) {
      try { const u = await api("/admin/users"); setUsers(Array.isArray(u) ? u : []); } catch { /* list stays empty */ }
    }
  };

  const saveGrant = async () => {
    if (!grant.productId || !grant.userId) { setMsg({ type: "error", text: "Choose a product and a competitor." }); return; }
    try {
      await api("/admin/product-authorizations", "POST", grant);
      setGrant(null);
      if (status === "approved") await load(); else setStatus("approved");
      setMsg({ type: "success", text: "Approval granted. The competitor can now buy this item." });
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <SectionHeader
        eyebrow="Shop"
        title="Purchase Approvals"
        desc="Championship belts can only be bought after you approve the competitor for that belt. Competitors request approval on the product page; you can also grant it directly."
        actions={<button style={ui.btn} onClick={openGrant} disabled={!restricted.length}><Plus size={15} /> Grant approval</button>}
      />
      <Notice type={msg.type} onClose={() => setMsg({ type: "", text: "" })}>{msg.text}</Notice>
      {!restricted.length && <Notice>No products need approval yet. Tick "Requires admin approval" on a product (championship belts are ticked automatically).</Notice>}
      <Tabs
        value={status}
        onChange={setStatus}
        tabs={[{ id: "pending", label: "Waiting" }, { id: "approved", label: "Approved" }, { id: "fulfilled", label: "Purchased" }, { id: "denied", label: "Denied" }, { id: "all", label: "All" }]}
      />
      {loading ? <Empty>Loading...</Empty> : rows.length === 0 ? <Empty>Nothing here.</Empty> : (
        <Table head={["Product", "Competitor", "Status", "Requested", "Notes", ""]} minWidth={780}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={ui.td}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img src={formatProductImage(r.product?.imageUrl)} alt="" style={{ width: "40px", height: "40px", objectFit: "contain", background: "#0b0b0b", borderRadius: "8px" }} />
                  <span style={{ color: "white", fontWeight: 700 }}>{r.product?.name || "—"}</span>
                </div>
              </td>
              <td style={ui.td}><div style={{ color: "white", fontWeight: 700 }}>{r.user?.name || r.user?.username || "—"}</div><div style={ui.muted}>{r.user?.email}</div></td>
              <td style={ui.td}><StatusPill status={r.status} /></td>
              <td style={ui.td}>{fmtDate(r.createdAt)}</td>
              <td style={{ ...ui.td, maxWidth: "240px", fontSize: "13px" }}>{r.requestNote || r.adminNote || <span style={ui.muted}>—</span>}</td>
              <td style={{ ...ui.td, whiteSpace: "nowrap" }}>
                {r.status === "pending" && <>
                  <button style={{ ...ui.btn, padding: "8px 12px", marginRight: "6px" }} onClick={() => decide(r, "approved")}><CheckCircle size={14} /> Approve</button>
                  <button style={ui.btnDanger} onClick={() => decide(r, "denied")}><XCircle size={14} /> Deny</button>
                </>}
                {r.status === "approved" && <button style={ui.btnDanger} onClick={() => decide(r, "revoked")}>Revoke</button>}
                {(r.status === "denied" || r.status === "revoked") && <button style={ui.btnGhost} onClick={() => decide(r, "approved")}><ShieldCheck size={14} /> Approve</button>}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {grant && (
        <Modal
          title="Grant purchase approval"
          onClose={() => setGrant(null)}
          footer={<>
            <button style={ui.btnGhost} onClick={() => setGrant(null)}>Cancel</button>
            <button style={ui.btn} onClick={saveGrant}>Grant approval</button>
          </>}
        >
          <Field label="Product">
            <select style={ui.input} value={grant.productId} onChange={(e) => setGrant({ ...grant, productId: e.target.value })}>
              {restricted.map((p) => <option key={p.id} value={p.id}>{p.name || p.title}</option>)}
            </select>
          </Field>
          <Field label="Competitor">
            <select style={ui.input} value={grant.userId} onChange={(e) => setGrant({ ...grant, userId: e.target.value })}>
              <option value="">Choose a competitor</option>
              {users.map((u) => <option key={u.id || u._id} value={u.id || u._id}>{u.name || u.username} ({u.email})</option>)}
            </select>
          </Field>
          <Field label="Note (optional)"><input style={ui.input} value={grant.adminNote} onChange={(e) => setGrant({ ...grant, adminNote: e.target.value })} placeholder="e.g. 2026 Heavyweight champion" /></Field>
        </Modal>
      )}
    </div>
  );
}
