import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award, CheckCircle, Clock, Download, Edit3, ExternalLink, FileText, Image as ImageIcon,
  Loader2, Plus, Search, ShieldAlert, Star, Trash2, UploadCloud, X, XCircle, Copy,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiCall, uploadDirect } from "../../utils/api";
import {
  PRESET_OPTIONS, drawCertificate, downloadCertificatePdf, formatCertDate, loadTemplateImage, verifyUrlFor,
} from "../../utils/certificatePdf";

// Certificate & award catalog.
// Nothing is issued automatically: every certificate is approved here by an administrator.

const css = `
.acert { color: #fff; }
.acert-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; margin-bottom: 28px; }
.acert-kicker { color: #FF5500; font-size: 11px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
.acert-title { font-size: clamp(26px, 4vw, 36px); font-weight: 950; margin: 0 0 8px; letter-spacing: -1px; }
.acert-sub { color: #888; margin: 0; font-size: 14px; max-width: 560px; line-height: 1.6; }
.acert-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
.acert-stat { background: #161616; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 16px 18px; }
.acert-stat b { display: block; font-size: 24px; font-weight: 900; }
.acert-stat span { color: #888; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
.acert-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.acert-tab { background: rgba(255,255,255,0.04); color: #aaa; border: 1px solid rgba(255,255,255,0.08); border-radius: 100px; padding: 10px 18px; font-weight: 800; font-size: 12px; cursor: pointer; }
.acert-tab.on { background: #FF5500; color: #fff; border-color: #FF5500; }
.acert-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
.acert-search { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px; background: #111; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0 14px; }
.acert-search input { flex: 1; background: none; border: none; outline: none; color: #fff; padding: 12px 0; font-size: 13px; min-width: 0; }
.acert-list { display: flex; flex-direction: column; gap: 10px; }
.acert-row { background: #161616; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 14px 16px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.acert-thumb { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; background: #0d0d0d; flex-shrink: 0; }
.acert-main { flex: 1; min-width: 200px; }
.acert-name { font-weight: 800; font-size: 15px; overflow-wrap: anywhere; }
.acert-meta { color: #888; font-size: 12px; margin-top: 4px; line-height: 1.5; overflow-wrap: anywhere; }
.acert-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.acert-btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 100px; padding: 9px 14px; font-size: 12px; font-weight: 800; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #ddd; white-space: nowrap; }
.acert-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.acert-btn.primary { background: #FF5500; border-color: #FF5500; color: #fff; }
.acert-btn.danger { color: #ef4444; border-color: rgba(239,68,68,0.35); background: rgba(239,68,68,0.06); }
.acert-badge { display: inline-block; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.3px; text-transform: uppercase; }
.acert-empty { text-align: center; color: #777; padding: 48px 20px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px; font-size: 14px; }
.acert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.acert-card { background: #161616; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; }
.acert-card-img { aspect-ratio: 4 / 3; background: #0d0d0d; display: flex; align-items: center; justify-content: center; padding: 8px; }
.acert-card-img img { width: 100%; height: 100%; object-fit: contain; }
.acert-card-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.acert-note { border-radius: 12px; padding: 12px 14px; font-size: 13px; font-weight: 700; margin-bottom: 16px; display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.acert-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.82); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: flex-start; justify-content: center; padding: 20px; overflow-y: auto; }
.acert-modal { background: #141414; border: 1px solid rgba(255,85,0,0.25); border-radius: 20px; width: 100%; max-width: 1100px; margin: auto; padding: 24px; position: relative; }
.acert-modal.narrow { max-width: 560px; }
.acert-modal h3 { margin: 0 0 4px; font-size: 22px; font-weight: 900; }
.acert-x { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.06); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.acert-issue { display: grid; grid-template-columns: minmax(0, 360px) minmax(0, 1fr); gap: 24px; margin-top: 18px; }
.acert-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.acert-field label { color: #888; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
.acert-field input, .acert-field select { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; padding: 11px 12px; font-size: 13px; outline: none; width: 100%; box-sizing: border-box; }
.acert-field input:focus, .acert-field select:focus { border-color: #FF5500; }
.acert-two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.acert-preview { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 10px; position: sticky; top: 10px; }
.acert-preview canvas { width: 100%; height: auto; display: block; border-radius: 6px; }
.acert-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #ccc; margin-bottom: 10px; cursor: pointer; }
@media (max-width: 900px) {
  .acert-issue { grid-template-columns: 1fr; }
  .acert-preview { position: static; order: -1; }
  .acert-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 480px) {
  .acert-modal { padding: 18px 14px; }
  .acert-two { grid-template-columns: 1fr; }
  .acert-row { align-items: flex-start; }
}
`;

const STATUS_BADGE = {
  issued: { color: "#22c55e", background: "rgba(34,197,94,0.12)" },
  revoked: { color: "#ef4444", background: "rgba(239,68,68,0.12)" },
};

const fetchAll = (token) => Promise.allSettled([
  apiCall("/certificates/admin/queue", "GET", null, token),
  apiCall("/certificates/admin/issued", "GET", null, token),
  apiCall("/certificates/admin/templates", "GET", null, token),
]);

const today = () => new Date().toISOString().slice(0, 10);

const emptyTemplateForm = { id: null, name: "", kind: "certificate", layoutPreset: "generic-landscape", orientation: "landscape", isDefault: false, active: true, imageUrl: "" };

export default function AdminCertificates() {
  const { user } = useAuth();
  const token = user?.token;

  const [tab, setTab] = useState("queue");
  const [queue, setQueue] = useState([]);
  const [issued, setIssued] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [notice, setNotice] = useState(null); // { type: 'ok' | 'error', text }
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  // issue modal
  const [issueFor, setIssueFor] = useState(null);
  const [issueForm, setIssueForm] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [justIssued, setJustIssued] = useState(null);
  const canvasRef = useRef(null);
  const [previewError, setPreviewError] = useState("");

  // template modal
  const [tplForm, setTplForm] = useState(null);
  const [tplFile, setTplFile] = useState(null);
  const [tplPreview, setTplPreview] = useState("");
  const [tplSaving, setTplSaving] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const say = (type, text) => setNotice({ type, text });

  // fetching has no side effects; applyLoaded stores the results (called from promise callbacks)
  const applyLoaded = useCallback((results) => {
    const [q, i, t] = results;
    if (q.status === "fulfilled") setQueue(Array.isArray(q.value) ? q.value : []);
    if (i.status === "fulfilled") setIssued(Array.isArray(i.value) ? i.value : []);
    if (t.status === "fulfilled") setTemplates(Array.isArray(t.value) ? t.value : []);
    const failed = results.find((r) => r.status === "rejected");
    if (failed) setNotice({ type: "error", text: `Some certificate data could not be loaded: ${failed.reason?.message || "server error"}` });
    setLoading(false);
  }, []);

  const load = useCallback(() => {
    if (!token) return Promise.resolve();
    return fetchAll(token).then(applyLoaded);
  }, [token, applyLoaded]);

  useEffect(() => {
    if (!token) return;
    fetchAll(token).then(applyLoaded);
  }, [token, applyLoaded]);

  const activeTemplates = useMemo(() => templates.filter((t) => t.active), [templates]);
  const defaultTemplate = useMemo(
    () => activeTemplates.find((t) => t.isDefault && t.kind === "certificate") || activeTemplates[0] || null,
    [activeTemplates]
  );

  // ---------- issue ----------
  const openIssue = (rec) => {
    setJustIssued(null);
    setPreviewError("");
    setIssueFor(rec);
    setIssueForm({
      templateId: defaultTemplate?.id || "",
      recipientName: rec.recipientName || "",
      recordTitle: rec.recordTitle || "",
      recordValue: rec.recordValue || "",
      dateAchieved: rec.dateAchieved || "",
      dateVerified: rec.dateVerified || today(),
    });
  };
  const closeIssue = () => { setIssueFor(null); setIssueForm(null); setJustIssued(null); };

  const issueTemplate = templates.find((t) => t.id === issueForm?.templateId) || null;

  // live preview
  useEffect(() => {
    if (!issueForm || !issueTemplate || !canvasRef.current) return undefined;
    let cancelled = false;
    loadTemplateImage(issueTemplate.imageUrl)
      .then((img) => {
        if (cancelled || !canvasRef.current) return;
        drawCertificate(canvasRef.current, img, { ...issueForm, certificateNumber: justIssued?.certificateNumber || "AMPEX-0000-PREVIEW" }, issueTemplate, 1200);
        setPreviewError("");
      })
      .catch((err) => { if (!cancelled) setPreviewError(err.message); });
    return () => { cancelled = true; };
  }, [issueForm, issueTemplate, justIssued]);

  const setIF = (k) => (e) => setIssueForm((f) => ({ ...f, [k]: e.target.value }));

  const submitIssue = async () => {
    if (!issueForm.templateId) return say("error", "Choose a certificate template first.");
    if (!issueForm.recipientName.trim()) return say("error", "Recipient name is required.");
    setIssuing(true);
    try {
      const cert = await apiCall("/certificates/admin/issue", "POST", { recordId: issueFor.recordId, ...issueForm }, token);
      setJustIssued(cert);
      setQueue((q) => q.filter((r) => r.recordId !== issueFor.recordId));
      setIssued((list) => [cert, ...list]);
      say("ok", `Certificate ${cert.certificateNumber} issued to ${cert.recipientName}.`);
    } catch (err) {
      say("error", err.message || "Could not issue the certificate.");
    } finally {
      setIssuing(false);
    }
  };

  const downloadPdf = async (cert) => {
    const template = cert.template || defaultTemplate;
    if (!template) return say("error", "No template is available for this certificate.");
    setBusyId(`dl-${cert.id}`);
    try {
      await downloadCertificatePdf(cert, template);
    } catch (err) {
      say("error", err.message || "Could not create the PDF.");
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (cert) => {
    const reason = window.prompt(`Revoke certificate ${cert.certificateNumber}?\nThe public verification page will show it as revoked.\n\nReason (optional):`, "");
    if (reason === null) return;
    setBusyId(`rv-${cert.id}`);
    try {
      const updated = await apiCall(`/certificates/admin/${cert.id}/revoke`, "PUT", { reason }, token);
      setIssued((list) => list.map((c) => (c.id === cert.id ? updated : c)));
      say("ok", `Certificate ${cert.certificateNumber} revoked. The record is back in the approval queue.`);
      load();
    } catch (err) {
      say("error", err.message || "Could not revoke the certificate.");
    } finally {
      setBusyId(null);
    }
  };

  const copyLink = async (number) => {
    try {
      await navigator.clipboard.writeText(verifyUrlFor(number));
      say("ok", "Verification link copied.");
    } catch {
      say("error", verifyUrlFor(number));
    }
  };

  // ---------- templates ----------
  const openTemplate = (t) => {
    setTplFile(null);
    setUploadPct(0);
    if (t) {
      setTplForm({ id: t.id, name: t.name, kind: t.kind, layoutPreset: t.layout?.preset || `generic-${t.orientation}`, orientation: t.orientation, isDefault: t.isDefault, active: t.active, imageUrl: t.imageUrl });
      setTplPreview(t.imageUrl);
    } else {
      setTplForm({ ...emptyTemplateForm });
      setTplPreview("");
    }
  };
  const closeTemplate = () => {
    if (tplPreview && tplPreview.startsWith("blob:")) URL.revokeObjectURL(tplPreview);
    setTplForm(null);
    setTplFile(null);
  };

  const pickTemplateFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return say("error", "Template must be a PNG, JPG or WebP image.");
    if (tplPreview && tplPreview.startsWith("blob:")) URL.revokeObjectURL(tplPreview);
    const url = URL.createObjectURL(file);
    setTplFile(file);
    setTplPreview(url);
    const probe = new Image();
    probe.onload = () => {
      const orientation = probe.naturalHeight > probe.naturalWidth ? "portrait" : "landscape";
      setTplForm((f) => ({
        ...f,
        orientation,
        // keep an AMPEX preset if one was chosen, otherwise match the new image's shape
        layoutPreset: f.layoutPreset?.startsWith("ampex-") ? f.layoutPreset : `generic-${orientation}`,
        name: f.name || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      }));
    };
    probe.src = url;
  };

  const saveTemplate = async () => {
    if (!tplForm.name.trim()) return say("error", "Template name is required.");
    if (!tplForm.id && !tplFile) return say("error", "Upload the template image.");
    setTplSaving(true);
    try {
      let imageUrl = tplForm.imageUrl;
      if (tplFile) imageUrl = await uploadDirect(tplFile, "admin-image", token, setUploadPct);
      const body = {
        name: tplForm.name.trim(),
        kind: tplForm.kind,
        layoutPreset: tplForm.layoutPreset,
        orientation: tplForm.layoutPreset.endsWith("portrait") ? "portrait" : "landscape",
        isDefault: !!tplForm.isDefault,
        active: !!tplForm.active,
        imageUrl,
      };
      if (tplForm.id) {
        await apiCall(`/certificates/admin/templates/${tplForm.id}`, "PUT", body, token);
        say("ok", "Template updated.");
      } else {
        await apiCall("/certificates/admin/templates", "POST", body, token);
        say("ok", "Template added to the catalog.");
      }
      closeTemplate();
      const list = await apiCall("/certificates/admin/templates", "GET", null, token);
      setTemplates(Array.isArray(list) ? list : []);
    } catch (err) {
      say("error", err.message || "Could not save the template.");
    } finally {
      setTplSaving(false);
    }
  };

  const setDefault = async (t) => {
    setBusyId(`def-${t.id}`);
    try {
      await apiCall(`/certificates/admin/templates/${t.id}`, "PUT", { isDefault: true, active: true }, token);
      const list = await apiCall("/certificates/admin/templates", "GET", null, token);
      setTemplates(Array.isArray(list) ? list : []);
      say("ok", `"${t.name}" is now the default ${t.kind}.`);
    } catch (err) {
      say("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  const removeTemplate = async (t) => {
    if (!window.confirm(`Delete the template "${t.name}"?\nIf certificates were issued with it, it is archived instead so they can still be downloaded.`)) return;
    setBusyId(`del-${t.id}`);
    try {
      const res = await apiCall(`/certificates/admin/templates/${t.id}`, "DELETE", null, token);
      const list = await apiCall("/certificates/admin/templates", "GET", null, token);
      setTemplates(Array.isArray(list) ? list : []);
      say("ok", res?.message || "Template deleted.");
    } catch (err) {
      say("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ---------- filtering ----------
  const q = search.trim().toLowerCase();
  const matches = (...vals) => !q || vals.some((v) => String(v || "").toLowerCase().includes(q));
  const queueShown = queue.filter((r) => matches(r.recipientName, r.recordTitle, r.category, r.recordValue));
  const issuedShown = issued
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .filter((c) => matches(c.certificateNumber, c.recipientName, c.recordTitle));

  const counts = {
    queue: queue.length,
    issued: issued.filter((c) => c.status === "issued").length,
    revoked: issued.filter((c) => c.status === "revoked").length,
    templates: activeTemplates.length,
  };

  return (
    <div className="acert">
      <style>{css}</style>

      <div className="acert-head">
        <div>
          <div className="acert-kicker">Certificates &amp; Awards</div>
          <h2 className="acert-title">Certificate Catalog</h2>
          <p className="acert-sub">
            Verified records wait here for your approval. Nothing is issued automatically: review the details, pick a design and
            issue. Each certificate gets a unique verification number that anyone can check online.
          </p>
        </div>
        <button className="acert-btn primary" onClick={() => { setTab("templates"); openTemplate(null); }}>
          <UploadCloud size={14} /> Upload template
        </button>
      </div>

      <div className="acert-stats">
        <div className="acert-stat"><b style={{ color: "#fbbf24" }}>{counts.queue}</b><span>Awaiting approval</span></div>
        <div className="acert-stat"><b style={{ color: "#22c55e" }}>{counts.issued}</b><span>Issued</span></div>
        <div className="acert-stat"><b style={{ color: "#ef4444" }}>{counts.revoked}</b><span>Revoked</span></div>
        <div className="acert-stat"><b style={{ color: "#FF5500" }}>{counts.templates}</b><span>Active templates</span></div>
      </div>

      {notice && (
        <div className="acert-note" style={notice.type === "ok"
          ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }
          : { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
          <span style={{ overflowWrap: "anywhere" }}>{notice.text}</span>
          <button onClick={() => setNotice(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      <div className="acert-tabs">
        {[
          { id: "queue", label: `Approval queue (${counts.queue})`, icon: <Clock size={13} /> },
          { id: "issued", label: `Issued (${issued.length})`, icon: <CheckCircle size={13} /> },
          { id: "templates", label: `Templates (${templates.length})`, icon: <ImageIcon size={13} /> },
        ].map((t) => (
          <button key={t.id} className={`acert-tab${tab === t.id ? " on" : ""}`} onClick={() => { setTab(t.id); setSearch(""); }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{t.icon} {t.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="acert-empty"><Loader2 size={18} className="spin" style={{ animation: "spin 1s linear infinite" }} /> Loading certificates...</div>
      )}

      {/* ---------- APPROVAL QUEUE ---------- */}
      {!loading && tab === "queue" && (
        <>
          <div className="acert-bar">
            <div className="acert-search"><Search size={14} color="#666" /><input placeholder="Search athlete, record or category" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          </div>
          {queueShown.length === 0 ? (
            <div className="acert-empty">{queue.length === 0 ? "Every verified record already has a certificate. New verified records will appear here." : "No records match your search."}</div>
          ) : (
            <div className="acert-list">
              {queueShown.map((r) => (
                <div className="acert-row" key={r.recordId}>
                  {r.thumbnailUrl ? <img className="acert-thumb" src={r.thumbnailUrl} alt="" loading="lazy" /> : <div className="acert-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Award size={22} color="#FF5500" /></div>}
                  <div className="acert-main">
                    <div className="acert-name">{r.recordTitle}</div>
                    <div className="acert-meta">
                      {r.recipientName} · {r.recordValue || "no value"} · {r.category || "Uncategorised"}
                      {r.recordType === "world_record" && <span className="acert-badge" style={{ marginLeft: 8, color: "#fbbf24", background: "rgba(251,191,36,0.12)" }}>World record</span>}
                      <br />Verified {r.dateVerified ? formatCertDate(r.dateVerified) : "(date not recorded)"}
                    </div>
                  </div>
                  <div className="acert-actions">
                    <button className="acert-btn primary" onClick={() => openIssue(r)} disabled={!activeTemplates.length}>
                      <FileText size={13} /> Review &amp; issue
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!activeTemplates.length && queue.length > 0 && (
            <p style={{ color: "#fbbf24", fontSize: 13, marginTop: 12 }}>Add an active template in the Templates tab before issuing certificates.</p>
          )}
        </>
      )}

      {/* ---------- ISSUED ---------- */}
      {!loading && tab === "issued" && (
        <>
          <div className="acert-bar">
            <div className="acert-search"><Search size={14} color="#666" /><input placeholder="Search number, athlete or record" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div className="acert-field" style={{ margin: 0, minWidth: 140 }}>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="issued">Issued</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>
          {issuedShown.length === 0 ? (
            <div className="acert-empty">{issued.length === 0 ? "No certificates issued yet." : "No certificates match."}</div>
          ) : (
            <div className="acert-list">
              {issuedShown.map((c) => (
                <div className="acert-row" key={c.id}>
                  <div className="acert-main">
                    <div className="acert-name">
                      {c.recipientName}{" "}
                      <span className="acert-badge" style={STATUS_BADGE[c.status] || {}}>{c.status}</span>
                    </div>
                    <div className="acert-meta">
                      {c.recordTitle}{c.recordValue ? ` · ${c.recordValue}` : ""}<br />
                      <span style={{ color: "#FF5500", fontWeight: 800 }}>{c.certificateNumber}</span> · issued {formatCertDate(c.issuedAt)} · {c.downloadCount} download{c.downloadCount === 1 ? "" : "s"}
                      {c.status === "revoked" && c.revokeReason ? <><br />Revoked: {c.revokeReason}</> : null}
                    </div>
                  </div>
                  <div className="acert-actions">
                    <button className="acert-btn" onClick={() => downloadPdf(c)} disabled={busyId === `dl-${c.id}`}>
                      {busyId === `dl-${c.id}` ? <Loader2 size={13} /> : <Download size={13} />} PDF
                    </button>
                    <button className="acert-btn" onClick={() => copyLink(c.certificateNumber)}><Copy size={13} /> Link</button>
                    <a className="acert-btn" href={`/certificate/${c.certificateNumber}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><ExternalLink size={13} /> Verify</a>
                    {c.status === "issued" && (
                      <button className="acert-btn danger" onClick={() => revoke(c)} disabled={busyId === `rv-${c.id}`}><XCircle size={13} /> Revoke</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------- TEMPLATES ---------- */}
      {!loading && tab === "templates" && (
        <>
          <div className="acert-bar">
            <button className="acert-btn primary" onClick={() => openTemplate(null)}><Plus size={13} /> New template</button>
            <span style={{ color: "#777", fontSize: 12 }}>Certificates and award designs. The default certificate is preselected when you issue.</span>
          </div>
          {templates.length === 0 ? (
            <div className="acert-empty">No templates yet. Upload your certificate design to get started.</div>
          ) : (
            <div className="acert-grid">
              {templates.map((t) => (
                <div className="acert-card" key={t.id} style={!t.active ? { opacity: 0.55 } : undefined}>
                  <div className="acert-card-img"><img src={t.imageUrl} alt={t.name} loading="lazy" /></div>
                  <div className="acert-card-body">
                    <div style={{ fontWeight: 800, fontSize: 14, overflowWrap: "anywhere" }}>{t.name}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span className="acert-badge" style={{ color: "#93c5fd", background: "rgba(59,130,246,0.12)" }}>{t.kind}</span>
                      <span className="acert-badge" style={{ color: "#ccc", background: "rgba(255,255,255,0.06)" }}>{t.orientation}</span>
                      {t.isDefault && <span className="acert-badge" style={{ color: "#fbbf24", background: "rgba(251,191,36,0.12)" }}>Default</span>}
                      {!t.active && <span className="acert-badge" style={{ color: "#ef4444", background: "rgba(239,68,68,0.12)" }}>Archived</span>}
                    </div>
                    <div style={{ color: "#777", fontSize: 11 }}>{PRESET_OPTIONS.find((p) => p.value === t.layout?.preset)?.label || "Custom layout"}</div>
                    <div className="acert-actions" style={{ marginTop: "auto" }}>
                      {!t.isDefault && t.active && (
                        <button className="acert-btn" onClick={() => setDefault(t)} disabled={busyId === `def-${t.id}`}><Star size={12} /> Default</button>
                      )}
                      <button className="acert-btn" onClick={() => openTemplate(t)}><Edit3 size={12} /> Edit</button>
                      <button className="acert-btn danger" onClick={() => removeTemplate(t)} disabled={busyId === `del-${t.id}`}><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------- ISSUE MODAL ---------- */}
      {issueFor && issueForm && (
        <div className="acert-overlay" data-lenis-prevent onClick={(e) => { if (e.target === e.currentTarget && !issuing) closeIssue(); }}>
          <div className="acert-modal" role="dialog" aria-modal="true" aria-label="Issue certificate">
            <button className="acert-x" onClick={closeIssue} aria-label="Close"><X size={16} /></button>
            <h3>{justIssued ? "Certificate issued" : "Review & issue certificate"}</h3>
            <p style={{ color: "#888", fontSize: 13, margin: 0 }}>
              {justIssued
                ? <>Number <b style={{ color: "#FF5500" }}>{justIssued.certificateNumber}</b>. The athlete can now download it from their profile.</>
                : "Check every detail against the verified record. These details are printed on the certificate exactly as shown."}
            </p>

            <div className="acert-issue">
              <div>
                <div className="acert-field">
                  <label>Template</label>
                  <select value={issueForm.templateId} onChange={setIF("templateId")} disabled={!!justIssued}>
                    {activeTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isDefault ? " (default)" : ""}</option>)}
                  </select>
                </div>
                <div className="acert-field"><label>Presented to</label><input value={issueForm.recipientName} onChange={setIF("recipientName")} disabled={!!justIssued} maxLength={120} /></div>
                <div className="acert-field"><label>Record title</label><input value={issueForm.recordTitle} onChange={setIF("recordTitle")} disabled={!!justIssued} maxLength={200} /></div>
                <div className="acert-field"><label>Official record achieved</label><input value={issueForm.recordValue} onChange={setIF("recordValue")} disabled={!!justIssued} maxLength={120} placeholder="e.g. 112 reps" /></div>
                <div className="acert-two">
                  <div className="acert-field"><label>Date achieved</label><input type="date" value={issueForm.dateAchieved || ""} onChange={setIF("dateAchieved")} disabled={!!justIssued} /></div>
                  <div className="acert-field"><label>Date verified</label><input type="date" value={issueForm.dateVerified || ""} onChange={setIF("dateVerified")} disabled={!!justIssued} /></div>
                </div>

                {justIssued ? (
                  <div className="acert-actions" style={{ marginTop: 8 }}>
                    <button className="acert-btn primary" onClick={() => downloadPdf(justIssued)} disabled={busyId === `dl-${justIssued.id}`}><Download size={13} /> Download PDF</button>
                    <button className="acert-btn" onClick={() => copyLink(justIssued.certificateNumber)}><Copy size={13} /> Copy verify link</button>
                    <button className="acert-btn" onClick={closeIssue}>Done</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 12, padding: "10px 12px", color: "#fbbf24", fontSize: 12, lineHeight: 1.5, margin: "4px 0 14px" }}>
                      <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                      Issuing is your official approval. A unique verification number is created and the certificate becomes public.
                    </div>
                    <div className="acert-actions">
                      <button className="acert-btn primary" onClick={submitIssue} disabled={issuing}>
                        {issuing ? <Loader2 size={13} /> : <CheckCircle size={13} />} {issuing ? "Issuing..." : "Approve & issue"}
                      </button>
                      <button className="acert-btn" onClick={closeIssue} disabled={issuing}>Cancel</button>
                    </div>
                  </>
                )}
              </div>

              <div className="acert-preview">
                {issueTemplate ? <canvas ref={canvasRef} aria-label="Certificate preview" /> : <div className="acert-empty">Choose a template to see the preview.</div>}
                {previewError && <p style={{ color: "#f87171", fontSize: 12, margin: "8px 0 0" }}>{previewError}</p>}
                <p style={{ color: "#666", fontSize: 11, margin: "8px 0 0", textAlign: "center" }}>Live preview. The PDF uses the same layout at print resolution.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- TEMPLATE MODAL ---------- */}
      {tplForm && (
        <div className="acert-overlay" data-lenis-prevent onClick={(e) => { if (e.target === e.currentTarget && !tplSaving) closeTemplate(); }}>
          <div className="acert-modal narrow" role="dialog" aria-modal="true" aria-label="Certificate template">
            <button className="acert-x" onClick={closeTemplate} aria-label="Close"><X size={16} /></button>
            <h3>{tplForm.id ? "Edit template" : "New template"}</h3>
            <p style={{ color: "#888", fontSize: 13, margin: "0 0 16px" }}>Upload the blank design (PNG or JPG, at least 2000px wide for sharp printing).</p>

            <div className="acert-card-img" style={{ borderRadius: 12, marginBottom: 12, border: "1px dashed rgba(255,255,255,0.12)" }}>
              {tplPreview ? <img src={tplPreview} alt="Template preview" /> : <span style={{ color: "#666", fontSize: 13 }}>No image yet</span>}
            </div>
            <label className="acert-btn" style={{ marginBottom: 14 }}>
              <UploadCloud size={13} /> {tplPreview ? "Replace image" : "Choose image"}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickTemplateFile} style={{ display: "none" }} />
            </label>
            {tplSaving && tplFile && <div style={{ color: "#888", fontSize: 12, marginBottom: 10 }}>Uploading... {uploadPct}%</div>}

            <div className="acert-field"><label>Name</label><input value={tplForm.name} onChange={(e) => setTplForm((f) => ({ ...f, name: e.target.value }))} maxLength={150} /></div>
            <div className="acert-two">
              <div className="acert-field">
                <label>Type</label>
                <select value={tplForm.kind} onChange={(e) => setTplForm((f) => ({ ...f, kind: e.target.value }))}>
                  <option value="certificate">Certificate</option>
                  <option value="award">Award</option>
                </select>
              </div>
              <div className="acert-field">
                <label>Text layout</label>
                <select value={tplForm.layoutPreset} onChange={(e) => setTplForm((f) => ({ ...f, layoutPreset: e.target.value }))}>
                  {PRESET_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <p style={{ color: "#777", fontSize: 11, margin: "-4px 0 12px", lineHeight: 1.5 }}>
              "AMPEX design" fills the blank lines of the official AMPEX certificates. "Custom design" prints the labels and details in the centre of any blank design.
            </p>
            <label className="acert-check"><input type="checkbox" checked={!!tplForm.isDefault} onChange={(e) => setTplForm((f) => ({ ...f, isDefault: e.target.checked }))} /> Default for this type</label>
            <label className="acert-check"><input type="checkbox" checked={!!tplForm.active} onChange={(e) => setTplForm((f) => ({ ...f, active: e.target.checked }))} /> Active (available when issuing)</label>

            <div className="acert-actions" style={{ marginTop: 8 }}>
              <button className="acert-btn primary" onClick={saveTemplate} disabled={tplSaving}>{tplSaving ? <Loader2 size={13} /> : <CheckCircle size={13} />} {tplSaving ? "Saving..." : "Save template"}</button>
              <button className="acert-btn" onClick={closeTemplate} disabled={tplSaving}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
