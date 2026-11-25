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
  // the three small videos beside the big one
  const side = form?.side || { mode: "auto", items: [] };
  const setSide = (next) => setForm((f) => ({ ...f, side: { ...(f.side || { mode: "auto", items: [] }), ...next } }));
  const setItem = (i, patch) => setSide({ items: side.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  const moveItem = (i, d) => { const items = [...side.items]; const j = i + d; if (j < 0 || j >= items.length) return; [items[i], items[j]] = [items[j], items[i]]; setSide({ items }); };

  useEffect(() => {
    apiCall("/settings/homepage-hero", "GET").then(setForm).catch(() => setForm({ mode: "auto", kind: "advertisement" }));
    apiCall("/events", "GET").then((l) => setEvents(Array.isArray(l) ? l : [])).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try { const r = await api("/admin/homepage-hero", "PUT", form); setForm({ ...r, side: r.side || form.side }); setNotice({ type: "success", text: r.message }); }
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

      <h3 style={{ ...ui.h3, margin: "28px 0 4px" }}>Small videos (right side)</h3>
      <p style={{ ...ui.muted, margin: "0 0 12px" }}>The three small videos beside the big one. Choose your own videos (upload or YouTube / Vimeo link) or events, or let it show your live and upcoming streams.</p>
      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {[["auto", "Live and upcoming streams (automatic)"], ["custom", "My own choice"]].map(([v, l]) => (
          <label key={v} style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", padding: 10, borderRadius: 10, border: `1px solid ${side.mode === v ? "#FF5500" : "rgba(255,255,255,0.08)"}` }}>
            <input type="radio" name="side-mode" checked={side.mode === v} onChange={() => setSide({ mode: v, items: v === "custom" && !side.items.length ? [{ type: "video", videoUrl: "", posterUrl: "", title: "" }] : side.items })} />
            <strong style={{ color: "white", fontSize: 13 }}>{l}</strong>
          </label>
        ))}
      </div>
      {side.mode === "custom" && (
        <div style={{ display: "grid", gap: 12 }}>
          {side.items.map((it, i) => (
            <div key={i} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <strong style={{ color: "white", fontSize: 13, marginRight: "auto" }}>Small video {i + 1}</strong>
                <select style={{ ...ui.input, width: "auto" }} value={it.type} onChange={(e) => setItem(i, e.target.value === "event" ? { type: "event", eventId: "" } : { type: "video", videoUrl: "", posterUrl: "", title: "" })}>
                  <option value="video">A video</option>
                  <option value="event">An event / stream</option>
                </select>
                <button type="button" style={ui.btnGhost} disabled={i === 0} onClick={() => moveItem(i, -1)} aria-label="Move up">↑</button>
                <button type="button" style={ui.btnGhost} disabled={i === side.items.length - 1} onClick={() => moveItem(i, 1)} aria-label="Move down">↓</button>
                <button type="button" style={ui.btnDanger} onClick={() => setSide({ items: side.items.filter((_, j) => j !== i) })}>Remove</button>
              </div>
              {it.type === "event" ? (
                <Field label="Event">
                  <select style={ui.input} value={it.eventId || ""} onChange={(e) => setItem(i, { eventId: e.target.value })}>
                    <option value="">Choose an event…</option>
                    {events.map((e) => <option key={e.id} value={e.id}>{e.title} · {e.isLive ? "LIVE" : new Date(e.date).toLocaleDateString()}</option>)}
                  </select>
                </Field>
              ) : (
                <>
                  <VideoUploadField label="Video" value={it.videoUrl} onChange={(v) => setItem(i, { videoUrl: v })} hint="Opens in a pop-up player. Visitors are asked to sign up or sign in first." />
                  <ImageUploadField label="Picture on the small card (optional; YouTube videos use their own)" value={it.posterUrl || ""} onChange={(v) => setItem(i, { posterUrl: v })} previewHeight={80} />
                  <Field label="Title"><input style={ui.input} maxLength={120} value={it.title || ""} onChange={(e) => setItem(i, { title: e.target.value })} placeholder="e.g. Most push-ups in 1 minute" /></Field>
                </>
              )}
            </div>
          ))}
          {side.items.length < 3 && (
            <button type="button" style={{ ...ui.btnGhost, justifySelf: "start" }} onClick={() => setSide({ items: [...side.items, { type: "video", videoUrl: "", posterUrl: "", title: "" }] })}>+ Add a small video</button>
          )}
        </div>
      )}
      <button type="button" style={{ ...ui.btn, marginTop: 16 }} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save homepage videos"}</button>
    </div>
  );
}
