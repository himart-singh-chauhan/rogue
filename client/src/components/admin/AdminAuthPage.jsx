// Admin → Homepage Control: the big picture and title on the Login and Sign Up pages.
import { useEffect, useState } from "react";
import { apiCall } from "../../utils/api";
import { AUTH_PAGE_DEFAULT, clearAuthPageCache } from "../../utils/authPage";
import { ui, useAdminApi, Notice, Field } from "./adminUi";
import ImageUploadField from "./ImageUploadField";

export default function AdminAuthPage() {
  const api = useAdminApi();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  useEffect(() => {
    apiCall("/settings/auth-page", "GET").then((p) => setForm({ ...AUTH_PAGE_DEFAULT, ...p })).catch(() => setForm({ ...AUTH_PAGE_DEFAULT }));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api("/admin/auth-page", "PUT", form);
      setForm({ ...AUTH_PAGE_DEFAULT, ...r });
      clearAuthPageCache();
      setNotice({ type: "success", text: r.message });
    } catch (e) { setNotice({ type: "error", text: e.message }); } finally { setSaving(false); }
  };

  if (!form) return null;
  return (
    <div style={{ ...ui.card, marginBottom: 28 }}>
      <h3 style={{ ...ui.h3, marginBottom: 4 }}>Login &amp; Sign Up pages</h3>
      <p style={{ ...ui.muted, margin: "0 0 16px" }}>The big picture and the title people see when they log in or sign up. Press Enter in a title to start a new line. Leave a picture empty to keep the current one.</p>
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <strong style={{ color: "white", fontSize: 14 }}>Login page</strong>
          <ImageUploadField label="Picture (left side; tall pictures work best, about 1200 × 1400 px)" value={form.loginImage || ""} onChange={set("loginImage")} previewHeight={160} />
          <Field label="Small line above the title"><input style={ui.input} maxLength={60} value={form.loginKicker || ""} onChange={set("loginKicker")} placeholder="AMPEX WORLD RECORDS" /></Field>
          <Field label="Title"><textarea style={{ ...ui.input, minHeight: 84, resize: "vertical" }} maxLength={80} value={form.loginTitle || ""} onChange={set("loginTitle")} placeholder={"PUSH\nBEYOND\nLIMITS"} /></Field>
        </div>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <strong style={{ color: "white", fontSize: 14 }}>Sign Up page</strong>
          <ImageUploadField label="Background picture (wide, about 1600 × 900 px; shown faded behind the form)" value={form.signupImage || ""} onChange={set("signupImage")} previewHeight={160} />
          <Field label="Title"><textarea style={{ ...ui.input, minHeight: 84, resize: "vertical" }} maxLength={80} value={form.signupTitle || ""} onChange={set("signupTitle")} placeholder={"JOIN THE\nELITE"} /></Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        <button type="button" style={ui.btn} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Login & Sign Up pages"}</button>
        <a href="/login" target="_blank" rel="noopener noreferrer" style={{ ...ui.btnGhost, textDecoration: "none" }}>Open Login page</a>
        <a href="/signup" target="_blank" rel="noopener noreferrer" style={{ ...ui.btnGhost, textDecoration: "none" }}>Open Sign Up page</a>
      </div>
    </div>
  );
}
