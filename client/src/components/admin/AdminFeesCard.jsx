// Admin → System Settings → Fees: what members pay to submit a record or to challenge one.
import React, { useEffect, useState } from "react";
import { apiCall } from "../../utils/api";
import { ui, useAdminApi, Field, Notice } from "./adminUi";

export default function AdminFeesCard() {
  const api = useAdminApi();
  const [fees, setFees] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiCall("/settings/public", "GET")
      .then((s) => setFees({ submissionFee: String(s.submissionFee ?? "3.50"), challengeFee: String(s.challengeFee ?? "3.50") }))
      .catch(() => setFees({ submissionFee: "3.50", challengeFee: "3.50" }));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api("/admin/settings/fees", "PUT", { submissionFee: fees.submissionFee, challengeFee: fees.challengeFee });
      setFees({ submissionFee: r.submissionFee.toFixed(2), challengeFee: r.challengeFee.toFixed(2) });
      setNotice({ type: "success", text: "Fees saved. New submissions and challenges are charged the new amounts." });
    } catch (e) {
      setNotice({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (!fees) return null;
  return (
    <div id="fees" style={{ ...ui.card, marginTop: "20px", background: "#111", borderRadius: "20px" }}>
      <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "white" }}>Fees</h3>
      <p style={{ ...ui.muted, margin: "0 0 16px 0" }}>What members pay at checkout. Coupons still apply on top.</p>
      {notice && <div style={{ marginBottom: 12 }}><Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        <Field label="Record submission fee ($)">
          <input type="number" min="0" step="0.01" inputMode="decimal" style={ui.input} value={fees.submissionFee} onChange={(e) => setFees({ ...fees, submissionFee: e.target.value })} />
        </Field>
        <Field label="Challenge a record fee ($)">
          <input type="number" min="0" step="0.01" inputMode="decimal" style={ui.input} value={fees.challengeFee} onChange={(e) => setFees({ ...fees, challengeFee: e.target.value })} />
        </Field>
      </div>
      <button type="button" style={{ ...ui.btn, marginTop: 16 }} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save fees"}</button>
    </div>
  );
}
