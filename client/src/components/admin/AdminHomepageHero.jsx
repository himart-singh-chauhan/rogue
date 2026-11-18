// Admin → Homepage Control: the big video beside Explore Categories.
import { useEffect, useState } from "react";
import { apiCall } from "../../utils/api";
import { ui, useAdminApi, Notice, Field } from "./adminUi";
import ImageUploadField from "./ImageUploadField";
import VideoUploadField from "./VideoUploadField";

const MODES = [
  ["video", "A video", "An advertisement, commercial or advertiser video you upload or link."],
  ["event", "An event's live stream", "Shows the stream of an event (free events play right on the homepage)."],
  ["auto", "Featured event (automatic)", "The featured event from Live Events, as before."],
];
const KINDS = [["advertisement", "Advertisement"], ["commercial", "Commercial"], ["advertiser", "Advertiser video"], ["live", "Live stream"]];

export default function AdminHomepageHero() {
  const api = useAdminApi();
  const [form, setForm] = useState(null);
  const [events, setEvents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  useEffect(() => {
    apiCall("/settings/homepage-hero", "GET").then(setForm).catch(() => setForm({ mode: "auto", kind: "advertisement" }));
    apiCall("/events", "GET").then((l) => setEvents(Array.isArray(l) ? l : [])).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try { const r = await api("/admin/homepage-hero", "PUT", form); setForm(r); setNotice({ type: "success", text: r.message }); }
    catch (e) { setNotice({ type: "error", text: e.message }); } finally { setSaving(false); }
  };

  if (!form) return null;
  return (
    <div style={{ ...ui.card, marginBottom: 28 }}>
      <h3 style={{ ...ui.h3, marginBottom: 4 }}>Big homepage video</h3>
      <p style={{ ...ui.muted, margin: "0 0 16px" }}>The large video beside Explore Categories. The three small videos beside it show your live and upcoming streams.</p>
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {MODES.map(([v, l, d]) => (
          <label key={v} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", padding: 10, borderRadius: 10, border: `1px solid ${form.mode === v ? "#FF5500" : "rgba(255,255,255,0.08)"}` }}>
            <input type="radio" name="hero-mode" checked={form.mode === v} onChange={() => setForm({ ...form, mode: v })} style={{ marginTop: 3 }} />
            <span><strong style={{ color: "white", fontSize: 13 }}>{l}</strong><span style={{ display: "block", color: "#888", fontSize: 12 }}>{d}</span></span>
          </label>
        ))}
      </div>
      {form.mode === "video" && (
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="What is it">
            <select style={ui.input} value={form.kind} onChange={set("kind")}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </Field>
          <VideoUploadField label="Video" value={form.videoUrl} onChange={set("videoUrl")} hint="Uploaded videos play with the site's controls; YouTube / Vimeo links play muted with a Sound on button." />
          <ImageUploadField label="Cover picture (shown before it plays)" value={form.posterUrl || ""} onChange={set("posterUrl")} previewHeight={100} />
          <Field label="Title (small, bottom left)"><input style={ui.input} maxLength={120} value={form.title || ""} onChange={set("title")} placeholder="e.g. Train like a record holder" /></Field>
          <Field label="Short line under the title (optional)"><input style={ui.input} maxLength={200} value={form.subtitle || ""} onChange={set("subtitle")} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <Field label="Button text"><input style={ui.input} maxLength={40} value={form.linkText || ""} onChange={set("linkText")} placeholder="Learn more" /></Field>
            <Field label="Button link (optional)"><input style={ui.input} value={form.linkUrl || ""} onChange={set("linkUrl")} placeholder="https://… or /shop" /></Field>
          </div>
        </div>
      )}
      {form.mode === "event" && (
        <Field label="Event">
          <select style={ui.input} value={form.eventId || ""} onChange={set("eventId")}>
            <option value="">Choose an event…</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title} · {e.isLive ? "LIVE" : new Date(e.date).toLocaleDateString()}{e.isPaid ? " · paid" : ""}</option>)}
          </select>
        </Field>
      )}
      <button type="button" style={{ ...ui.btn, marginTop: 16 }} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save homepage video"}</button>
    </div>
  );
}
