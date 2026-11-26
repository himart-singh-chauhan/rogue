// Admin → Try These Records: record ideas waiting for their first holder.
// Create / edit / publish / pause / remove, see everyone attempting, choose the verified first holder.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Link2, Users, X, ArrowUp, ArrowDown, BookOpen } from "lucide-react";
import { apiCall } from "../../utils/api";
import { ui, useAdminApi, Notice, Field, SectionHeader, Empty } from "./adminUi";

const EMPTY = { number: "", section: "Record Challenges", title: "", category: "", subcategory: "", description: "", rules: "", scoring: "most", timeLimit: "", measurement: "repetitions", measurementUnit: "", evidence: "", divisions: "", eligibility: "Worldwide", difficulty: "medium", safety: "", points: 0, deadline: "", status: "draft" };
const STATUS_COLOR = { draft: "#888", open: "#22c55e", paused: "#F59E0B", set: "#3b82f6", removed: "#ef4444" };
const STATUS_LABEL = { draft: "Draft (not public)", open: "Open to Set (public)", paused: "Paused", set: "Record Set", removed: "Archived" };

export default function AdminOpenRecords() {
  const api = useAdminApi();
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null); // null = closed; {id?} = editing
  const [attemptsFor, setAttemptsFor] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [notice, setNotice] = useState(null);
  const [filter, setFilter] = useState("all");
  const [orderDirty, setOrderDirty] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rules, setRules] = useState([]);
  useEffect(() => { apiCall("/open-records-rules", "GET").then((r) => setRules(Array.isArray(r) ? r : [])).catch(() => {}); }, []);
  const saveRules = async () => {
    try { setRules(await api("/admin/open-records-rules", "PUT", { rules })); setNotice({ type: "success", text: "General rules saved." }); setRulesOpen(false); }
    catch (e) { setNotice({ type: "error", text: e.message }); }
  };
  // reorder: move within the full list, then "Save order"
  const move = (id, dir) => {
    setRows((list) => {
      const i = list.findIndex((o) => o.id === id); const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list]; [next[i], next[j]] = [next[j], next[i]]; return next;
    });
    setOrderDirty(true);
  };
  const saveOrder = async () => {
    try { await api("/admin/open-records/order", "PUT", { ids: rows.map((o) => o.id) }); setOrderDirty(false); setNotice({ type: "success", text: "Order saved. Try These Records shows the challenges in this order." }); }
    catch (e) { setNotice({ type: "error", text: e.message }); }
  };

  const load = useCallback(() => api("/open-records?all=1").then(setRows).catch((e) => setNotice({ type: "error", text: e.message })), [api]);
  useEffect(() => { load(); }, [load]);

  const save = async (statusOverride) => {
    const body = { ...form, ...(statusOverride ? { status: statusOverride } : {}), divisions: String(form.divisions || "").split(",").map((d) => d.trim()).filter(Boolean) };
    try {
      if (form.id) await api(`/admin/open-records/${form.id}`, "PUT", body);
      else await api("/admin/open-records", "POST", body);
      setNotice({ type: "success", text: statusOverride === "open" ? "Published: it's now on Try These Records." : "Saved." });
      setForm(null); load();
    } catch (e) { setNotice({ type: "error", text: e.message }); }
  };
  const setStatus = async (o, status) => {
    try { await api(`/admin/open-records/${o.id}`, "PUT", { ...toForm(o), status, divisions: o.divisions }); load(); }
    catch (e) { setNotice({ type: "error", text: e.message }); }
  };
  const toForm = (o) => ({ id: o.id, sectionNumber: o.sectionNumber || null, number: o.number ?? "", section: o.section || "", scoring: o.scoring || "most", timeLimit: o.timeLimit || "", title: o.title, category: o.category || "", subcategory: o.subcategory || "", description: o.description || "", rules: o.rules || "", measurement: o.measurement, measurementUnit: o.measurementUnit || "", evidence: o.evidence || "", divisions: (o.divisions || []).join(", "), eligibility: o.eligibility || "Worldwide", difficulty: o.difficulty, safety: o.safety || "", points: o.points || 0, deadline: o.deadline ? o.deadline.slice(0, 10) : "", status: o.status });
  const openAttempts = async (o) => {
    setAttemptsFor(o); setAttempts([]);
    try { setAttempts(await api(`/admin/open-records/${o.id}/attempts`)); } catch (e) { setNotice({ type: "error", text: e.message }); }
  };
  const makeHolder = async (recordId) => {
    if (!window.confirm("Make this verified attempt the original record holder? The open record becomes a normal record others can challenge.")) return;
    try { await api(`/admin/open-records/${attemptsFor.id}/holder`, "PUT", { recordId }); setNotice({ type: "success", text: "Record holder set." }); setAttemptsFor(null); load(); }
    catch (e) { setNotice({ type: "error", text: e.message }); }
  };
  const copyLink = async (o) => {
    const url = `${window.location.origin}/try-these-records/${o.id}`;
    try { await navigator.clipboard.writeText(url); setNotice({ type: "success", text: `Link copied: ${url}` }); } catch { window.prompt("Copy this link:", url); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const shown = (rows || []).filter((o) => filter === "all" ? o.status !== "removed" : o.status === filter);

  return (
    <div>
      <SectionHeader eyebrow="Records" title="Try These Records" desc="Record ideas waiting for their first official holder. The first attempt that is verified becomes the original record automatically, or choose the holder yourself below."
        actions={<button type="button" style={ui.btn} onClick={() => setForm({ ...EMPTY })}><Plus size={14} /> New challenge</button>} />
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      {form && (
        <div style={{ ...ui.card, marginBottom: 20, borderColor: "rgba(255,85,0,0.35)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={ui.h3}>{form.id ? "Edit open record" : "New open record"}</div>
            <button type="button" style={ui.iconBtn} onClick={() => setForm(null)} aria-label="Close"><X size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <Field label="Challenge number"><div style={{ ...ui.input, color: "#aaa" }}>{form.id && form.sectionNumber ? `${String(form.sectionNumber).padStart(2, "0")} in ${form.section || "its section"}` : "Given automatically"}</div><div style={{ ...ui.muted, fontSize: 11, marginTop: 4 }}>Each section is numbered from 1 in page order. Use the arrows in the list to change the order.</div></Field>
            <Field label="Group on the page">
              <select style={ui.input} value={form.section} onChange={set("section")}>
                {["Record Challenges", "Funny Talent Challenges"].map((s) => <option key={s}>{s}</option>)}
                {form.section && !["Record Challenges", "Funny Talent Challenges"].includes(form.section) && <option>{form.section}</option>}
              </select>
            </Field>
            <Field label="Record title" style={{ gridColumn: "1 / -1" }}><input style={ui.input} value={form.title} onChange={set("title")} placeholder="e.g. Most kettlebell swings in 1 minute" /></Field>
            <Field label="Scoring method">
              <select style={ui.input} value={form.scoring} onChange={set("scoring")}>
                <option value="most">Highest count wins</option><option value="longest">Longest time wins</option><option value="fastest">Fastest time wins</option>
              </select>
            </Field>
            <Field label="Time limit (if any)"><input style={ui.input} value={form.timeLimit} onChange={set("timeLimit")} placeholder="e.g. 1 minute" /></Field>
            <Field label="Category"><input style={ui.input} value={form.category} onChange={set("category")} placeholder="e.g. Strength" /></Field>
            <Field label="Subcategory"><input style={ui.input} value={form.subcategory} onChange={set("subcategory")} /></Field>
            <Field label="Measured by">
              <select style={ui.input} value={form.measurement} onChange={set("measurement")}>{["time", "weight", "repetitions", "distance", "score", "other"].map((m) => <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>)}</select>
            </Field>
            <Field label="Unit (optional)"><input style={ui.input} value={form.measurementUnit} onChange={set("measurementUnit")} placeholder="e.g. reps, seconds, kg, meters" /></Field>
            <Field label="Difficulty">
              <select style={ui.input} value={form.difficulty} onChange={set("difficulty")}>{["easy", "medium", "hard", "extreme"].map((m) => <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>)}</select>
            </Field>
            <Field label="Eligibility"><input style={ui.input} value={form.eligibility} onChange={set("eligibility")} placeholder="Worldwide, or a country" /></Field>
            <Field label="Age / competition divisions" hint="Comma separated. Empty = all divisions."><input style={ui.input} value={form.divisions} onChange={set("divisions")} placeholder="e.g. Teen (13–17), Adult (18–35)" /></Field>
            <Field label="Points for setting it"><input type="number" min="0" style={ui.input} value={form.points} onChange={set("points")} /></Field>
            <Field label="Submission deadline (optional)"><input type="date" style={{ ...ui.input, colorScheme: "dark" }} value={form.deadline} onChange={set("deadline")} /></Field>
            <Field label="Short description" style={{ gridColumn: "1 / -1" }}><textarea style={{ ...ui.input, minHeight: 70 }} value={form.description} onChange={set("description")} /></Field>
            <Field label="Official rules" style={{ gridColumn: "1 / -1" }}><textarea style={{ ...ui.input, minHeight: 110 }} value={form.rules} onChange={set("rules")} /></Field>
            <Field label="Video requirements" style={{ gridColumn: "1 / -1" }}><textarea style={{ ...ui.input, minHeight: 80 }} value={form.evidence} onChange={set("evidence")} placeholder="e.g. One uncut video showing the full attempt and the timer; two witness statements" /></Field>
            <Field label="Safety requirements / warnings" style={{ gridColumn: "1 / -1" }}><textarea style={{ ...ui.input, minHeight: 70 }} value={form.safety} onChange={set("safety")} /></Field>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button type="button" style={ui.btn} onClick={() => save("open")}>{form.status === "open" ? "Save" : "Save & publish"}</button>
            {form.status !== "open" && form.status !== "set" && <button type="button" style={ui.btnGhost} onClick={() => save("draft")}>Save as draft</button>}
          </div>
        </div>
      )}

      {attemptsFor && (
        <div style={{ ...ui.card, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={ui.h3}>Attempts: {attemptsFor.title}</div>
            <button type="button" style={ui.iconBtn} onClick={() => setAttemptsFor(null)} aria-label="Close"><X size={16} /></button>
          </div>
          <div style={{ ...ui.muted, marginBottom: 10 }}>Review attempts in Admin → Records (verify, reject, or ask for more evidence). The first verified attempt becomes the record automatically.</div>
          {attempts.length === 0 ? <Empty>No attempts yet.</Empty> : attempts.map((a) => (
            <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <strong style={{ color: "white", minWidth: 140 }}>{a.member?.name || "Member"}</strong>
              <span style={{ color: "#ccc" }}>{a.value} {a.unit}</span>
              <span style={{ color: "#888", fontSize: 12 }}>{new Date(a.createdAt).toLocaleString()}</span>
              <span style={{ color: a.status === "verified" ? "#22c55e" : a.status === "rejected" ? "#ef4444" : "#F59E0B", fontWeight: 800, fontSize: 12 }}>{a.status}</span>
              <Link to={`/record/${a.id}`} target="_blank" style={{ color: "#FF6A00", fontSize: 12, fontWeight: 800 }}>Open</Link>
              {a.status === "verified" && attemptsFor.status !== "set" && <button type="button" style={{ ...ui.btn, padding: "6px 12px", fontSize: 12 }} onClick={() => makeHolder(a.id)}>Make record holder</button>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button type="button" style={ui.btnGhost} onClick={() => setRulesOpen((v) => !v)}><BookOpen size={14} /> General rules ({rules.length})</button>
        {orderDirty && <button type="button" style={ui.btn} onClick={saveOrder}>Save order</button>}
      </div>
      {rulesOpen && (
        <div style={{ ...ui.card, marginBottom: 16 }}>
          <div style={{ ...ui.h3, marginBottom: 6 }}>General rules (shown on Try These Records and every challenge)</div>
          {rules.map((r, i) => (
            <div key={i} style={{ display: "grid", gap: 6, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={ui.input} value={r.heading} placeholder="Heading" onChange={(e) => setRules(rules.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)))} />
                <button type="button" style={ui.iconBtn} aria-label="Remove rule" onClick={() => setRules(rules.filter((_, j) => j !== i))}><X size={14} /></button>
              </div>
              <textarea style={{ ...ui.input, minHeight: 70 }} value={r.text} onChange={(e) => setRules(rules.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={ui.btnGhost} onClick={() => setRules([...rules, { heading: "", text: "" }])}><Plus size={14} /> Add a rule</button>
            <button type="button" style={ui.btn} onClick={saveRules}>Save rules</button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {["all", "draft", "open", "paused", "set", "removed"].map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} style={{ ...ui.btnGhost, padding: "6px 12px", fontSize: 12, borderColor: filter === s ? "#FF5500" : undefined }}>{s === "all" ? "All" : STATUS_LABEL[s]}</button>
        ))}
      </div>
      {!rows ? <div style={ui.muted}>Loading…</div> : shown.length === 0 ? <Empty>No open records here yet. Press “New open record” to add one.</Empty> : (
        <div style={{ display: "grid", gap: 10 }}>
          {shown.map((o) => (
            <div key={o.id} style={{ ...ui.card, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ color: "white", fontWeight: 900 }}>{o.sectionNumber ? `${String(o.sectionNumber).padStart(2, "0")} · ` : ""}{o.title}</div>
                <div style={{ color: "#888", fontSize: 12 }}>{o.section || "No group"} · {[o.category, o.subcategory].filter(Boolean).join(" · ") || "No category"} · {o.attempts} attempts{o.deadline ? ` · deadline ${new Date(o.deadline).toLocaleDateString()}` : ""}</div>
                {o.status === "set" && o.holder && <div style={{ color: "#3b82f6", fontSize: 12, fontWeight: 800 }}>Holder: {o.holder.name} · {o.holder.value} {o.holder.unit}</div>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 900, color: STATUS_COLOR[o.status] }}>{STATUS_LABEL[o.status]}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {filter === "all" && <>
                  <button type="button" style={ui.iconBtn} aria-label={`Move ${o.title} up`} onClick={() => move(o.id, -1)}><ArrowUp size={14} /></button>
                  <button type="button" style={ui.iconBtn} aria-label={`Move ${o.title} down`} onClick={() => move(o.id, 1)}><ArrowDown size={14} /></button>
                </>}
                <button type="button" style={{ ...ui.btnGhost, padding: "6px 10px", fontSize: 12 }} onClick={() => setForm(toForm(o))}>Edit</button>
                <button type="button" style={{ ...ui.btnGhost, padding: "6px 10px", fontSize: 12 }} onClick={() => openAttempts(o)}><Users size={12} /> Attempts</button>
                {o.status !== "set" && o.status !== "open" && <button type="button" style={{ ...ui.btnGhost, padding: "6px 10px", fontSize: 12, color: "#22c55e" }} onClick={() => setStatus(o, "open")}>Publish</button>}
                {o.status === "open" && <button type="button" style={{ ...ui.btnGhost, padding: "6px 10px", fontSize: 12, color: "#F59E0B" }} onClick={() => setStatus(o, "paused")}>Pause</button>}
                {o.status !== "removed" && o.status !== "set" && <button type="button" style={{ ...ui.btnGhost, padding: "6px 10px", fontSize: 12, color: "#ef4444" }} onClick={() => window.confirm("Archive this challenge? It's hidden from the public; its submissions and any verified result stay here in admin.") && setStatus(o, "removed")}>Archive</button>}
                {o.status === "removed" && <button type="button" style={{ ...ui.btnGhost, padding: "6px 10px", fontSize: 12 }} onClick={() => setStatus(o, "draft")}>Restore as draft</button>}
                <button type="button" style={{ ...ui.btnGhost, padding: "6px 10px", fontSize: 12 }} onClick={() => copyLink(o)}><Link2 size={12} /> Copy link</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
