// Image field for admin forms: upload a file or paste a URL, with preview, replace and remove.
import React, { useRef, useState } from "react";
import { UploadCloud, Trash2, Link as LinkIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { uploadDirect, formatProductImage } from "../../utils/api";
import { ui } from "./adminUi";

export default function ImageUploadField({ label = "Image", value, onChange, kind = "admin-image", hint, previewHeight = 160 }) {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [mode, setMode] = useState("upload");
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const pick = async (file) => {
    if (!file) return;
    setError("");
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { setError("Please choose a JPG, PNG, WEBP or GIF image."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Images must be smaller than 10 MB."); return; }
    try {
      setProgress(0);
      const url = await uploadDirect(file, kind, user?.token, setProgress);
      onChange(url);
    } catch (e) {
      setError(e.message || "Upload failed.");
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
        <span style={ui.label}>{label}</span>
        <div style={{ display: "flex", gap: "4px" }}>
          {[["upload", "Upload"], ["url", "Use URL"]].map(([m, l]) => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{ background: mode === m ? "rgba(255,85,0,0.15)" : "transparent", color: mode === m ? "#FF5500" : "#888", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </div>

      {value ? (
        <div style={{ position: "relative", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden", background: "#0b0b0b" }}>
          <img src={formatProductImage(value)} alt="Preview" style={{ display: "block", width: "100%", height: `${previewHeight}px`, objectFit: "contain" }} />
          <div style={{ display: "flex", gap: "6px", padding: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
            <button type="button" style={{ ...ui.btnGhost, padding: "6px 12px", fontSize: "12px" }} onClick={() => (mode === "upload" ? fileRef.current?.click() : setMode("url"))}>
              <UploadCloud size={13} /> Replace
            </button>
            <button type="button" style={{ ...ui.btnDanger, padding: "6px 12px", fontSize: "12px" }} onClick={() => onChange("")}>
              <Trash2 size={13} /> Remove
            </button>
          </div>
        </div>
      ) : mode === "upload" ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          style={{ width: "100%", border: "2px dashed rgba(255,85,0,0.35)", background: "rgba(255,85,0,0.03)", borderRadius: "10px", padding: "18px", color: "#aaa", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          <UploadCloud size={16} color="#FF5500" /> {progress !== null ? `Uploading... ${progress}%` : "Click or drop an image (JPG, PNG, WEBP, GIF · max 10 MB)"}
        </button>
      ) : null}

      {mode === "url" && (
        <div style={{ position: "relative", marginTop: value ? "8px" : 0 }}>
          <LinkIcon size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#666" }} />
          <input type="url" style={{ ...ui.input, paddingLeft: "34px" }} placeholder="https://..." value={value || ""} onChange={(e) => onChange(e.target.value.trim())} />
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={(e) => pick(e.target.files?.[0])} />
      {progress !== null && value && <div style={{ ...ui.muted, marginTop: "6px" }}>Uploading... {progress}%</div>}
      {error && <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px", fontWeight: 700 }}>{error}</div>}
      {hint && <div style={{ color: "#666", fontSize: "12px", marginTop: "6px" }}>{hint}</div>}
    </div>
  );
}
