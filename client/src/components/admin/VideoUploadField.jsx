// Admin: a video from the computer (MP4 / WEBM / MOV, uploaded straight to storage) or a YouTube / Vimeo link.
import { useRef, useState } from "react";
import { UploadCloud, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { uploadDirect } from "../../utils/api";
import { ui } from "./adminUi";

export default function VideoUploadField({ label = "Video", value, onChange, hint }) {
  const { user } = useAuth();
  const ref = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const pick = async (file) => {
    if (!file) return;
    setError("");
    if (!/^video\/(mp4|webm|quicktime)$/.test(file.type)) { setError("Please choose an MP4, WEBM or MOV video."); return; }
    try {
      setProgress(0);
      onChange(await uploadDirect(file, "admin-video", user?.token, setProgress));
    } catch (e) { setError(e.message || "Upload failed."); } finally { setProgress(null); if (ref.current) ref.current.value = ""; }
  };

  return (
    <div>
      <span style={ui.label}>{label}</span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input style={{ ...ui.input, flex: "1 1 260px" }} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="https://youtube.com/… or upload a file" />
        <button type="button" style={ui.btnGhost} onClick={() => ref.current?.click()} disabled={progress !== null}><UploadCloud size={15} /> {progress !== null ? `Uploading ${Math.round(progress)}%` : "Upload video"}</button>
        {value && <button type="button" style={ui.btnDanger} onClick={() => onChange("")} aria-label="Remove video"><Trash2 size={14} /></button>}
        <input ref={ref} type="file" accept="video/mp4,video/webm,video/quicktime" style={{ display: "none" }} onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      {hint && <div style={{ color: "#777", fontSize: 12, marginTop: 6, lineHeight: 1.4 }}>{hint}</div>}
      {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
