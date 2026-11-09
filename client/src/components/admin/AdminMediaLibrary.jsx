// Admin → Media Library: upload images, videos and PDFs to storage, rename, filter, copy links, delete.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, Trash2, Copy, FileText, Video, Image as ImageIcon, Edit3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { uploadDirect } from "../../utils/api";
import { ui, pill, useAdminApi, SectionHeader, Notice, Empty, Tabs, fmtDate } from "./adminUi";

const TYPES = [
  { id: "all", label: "All" },
  { id: "photo", label: "Photos" },
  { id: "video", label: "Videos" },
  { id: "graphic", label: "Graphics" },
  { id: "banner", label: "Banners" },
  { id: "certificate", label: "Certificates" },
  { id: "document", label: "Documents" },
];
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf";
const sizeLabel = (n) => (!n ? "" : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export default function AdminMediaLibrary() {
  const api = useAdminApi();
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [assetType, setAssetType] = useState("auto");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = useCallback(async () => {
    try {
      const res = await api("/admin/media");
      setAssets(Array.isArray(res) ? res : []);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Could not load media" });
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const onFiles = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    let done = 0;
    for (const file of list) {
      try {
        setProgress({ name: file.name, pct: 0, index: done + 1, count: list.length });
        const fileUrl = await uploadDirect(file, "admin-media", user?.token, (pct) => setProgress((p) => ({ ...p, pct })));
        await api("/admin/media", "POST", {
          fileUrl,
          title: file.name.replace(/\.[^.]+$/, ""),
          assetType: assetType === "auto" ? undefined : assetType,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });
        done += 1;
      } catch (e) {
        setMsg({ type: "error", text: `${file.name}: ${e.message}` });
      }
    }
    setProgress(null);
    if (fileRef.current) fileRef.current.value = "";
    if (done) setMsg({ type: "success", text: `${done} file${done === 1 ? "" : "s"} uploaded.` });
    await load();
  };

  const rename = async (a) => {
    const title = window.prompt("Asset name", a.title || "");
    if (title === null || !title.trim()) return;
    try {
      await api(`/admin/media/${a.id}`, "PUT", { title: title.trim() });
      await load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? The file is removed from storage too.`)) return;
    try {
      await api(`/admin/media/${a.id}`, "DELETE");
      setAssets((list) => list.filter((x) => x.id !== a.id));
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const copy = async (url) => {
    try { await navigator.clipboard.writeText(url); setMsg({ type: "success", text: "Link copied." }); }
    catch { window.prompt("Copy this link:", url); }
  };

  const shown = filter === "all" ? assets : assets.filter((a) => a.asset_type === filter);
  const counts = Object.fromEntries(TYPES.map((t) => [t.id, t.id === "all" ? assets.length : assets.filter((a) => a.asset_type === t.id).length]));

  return (
    <div>
      <SectionHeader
        eyebrow="Content"
        title="Media Library"
        desc="Upload photos, graphics, banners, videos (up to 50 MB) and PDF documents. Copy a file's link to use it anywhere on the site."
        actions={<>
          <select style={{ ...ui.input, width: "auto" }} value={assetType} onChange={(e) => setAssetType(e.target.value)} aria-label="Asset type for new uploads">
            <option value="auto">Type: detect automatically</option>
            {TYPES.slice(1).map((t) => <option key={t.id} value={t.id}>Type: {t.label}</option>)}
          </select>
          <button style={ui.btn} onClick={() => fileRef.current?.click()} disabled={!!progress}><UploadCloud size={16} /> Upload Asset</button>
          <input ref={fileRef} type="file" multiple accept={ACCEPT} style={{ display: "none" }} onChange={(e) => onFiles(e.target.files)} />
        </>}
      />
      <Notice type={msg.type} onClose={() => setMsg({ type: "", text: "" })}>{msg.text}</Notice>
      {progress && (
        <div style={{ ...ui.card, padding: "14px 16px", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", color: "#ccc", marginBottom: "8px" }}>Uploading {progress.name} ({progress.index}/{progress.count}) · {progress.pct}%</div>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ width: `${progress.pct}%`, height: "100%", background: "#FF5500", transition: "width 0.2s" }} />
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
        onClick={() => !progress && fileRef.current?.click()}
        style={{ border: "2px dashed rgba(255,85,0,0.35)", borderRadius: "14px", padding: "22px", textAlign: "center", color: "#999", fontSize: "14px", cursor: "pointer", marginBottom: "20px", background: "rgba(255,85,0,0.03)" }}
      >
        <UploadCloud size={22} color="#FF5500" style={{ marginBottom: "6px" }} />
        <div>Drop files here or click to choose · JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, PDF</div>
      </div>

      <Tabs tabs={TYPES.map((t) => ({ ...t, count: counts[t.id] }))} value={filter} onChange={setFilter} />

      {loading ? <Empty>Loading media...</Empty> : shown.length === 0 ? <Empty>No assets here yet.</Empty> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
          {shown.map((a) => {
            const isImg = (a.mime_type || "").startsWith("image/") || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(a.file_url || "");
            const isVid = (a.mime_type || "").startsWith("video/") || /\.(mp4|webm|mov)(\?|$)/i.test(a.file_url || "");
            return (
              <div key={a.id} style={{ ...ui.card, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <a href={a.file_url} target="_blank" rel="noreferrer" style={{ aspectRatio: "4 / 3", background: "#0b0b0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isImg ? <img src={a.file_url} alt={a.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : isVid ? <Video size={34} color="#FF5500" /> : <FileText size={34} color="#FF5500" />}
                </a>
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "white", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.title}>{a.title}</div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={pill("#FF5500")}>{a.asset_type}</span>
                    <span style={{ ...ui.muted, fontSize: "11px" }}>{sizeLabel(a.file_size)} {fmtDate(a.created_at)}</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "auto" }}>
                    <button style={ui.iconBtn} title="Copy link" onClick={() => copy(a.file_url)}><Copy size={14} /></button>
                    <button style={ui.iconBtn} title="Rename" onClick={() => rename(a)}><Edit3 size={14} /></button>
                    <button style={{ ...ui.iconBtn, color: "#ef4444" }} title="Delete" onClick={() => remove(a)}><Trash2 size={14} /></button>
                    {isImg && <ImageIcon size={14} color="#555" style={{ marginLeft: "auto", alignSelf: "center" }} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
