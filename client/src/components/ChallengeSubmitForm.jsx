// Try These Records: the submission form for one challenge (result + attempt video). The attempt is saved with
// the challenge, then goes to the normal submission checkout and on to AI screening and an adjudicator.
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiCall, uploadDirect } from "../utils/api";
import SubmissionAllowanceNote from "./SubmissionAllowanceNote";

const input = { width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 16px", color: "white", fontSize: 15, outline: "none", boxSizing: "border-box" };
const label = { display: "block", fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 8 };

export default function ChallengeSubmitForm({ challenge }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [result, setResult] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const timed = challenge.scoring === "fastest" || challenge.scoring === "longest";
  const unit = challenge.measurementUnit || (timed ? "seconds" : "reps");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const value = Number(String(result).replace(",", "."));
    if (!result || !Number.isFinite(value) || value <= 0) { setError(timed ? "Enter your time in seconds (for example 12.48)." : `Enter your result as a number of ${unit}.`); return; }
    if (!file && !link.trim()) { setError("Upload your attempt video or paste a YouTube / Vimeo link."); return; }
    setBusy(true);
    try {
      let evidenceUrl = link.trim();
      if (file) {
        setProgress(0);
        evidenceUrl = await uploadDirect(file, "record-video", user.token, setProgress);
        setProgress(null);
      }
      const submissionData = {
        title: challenge.title,
        category: challenge.subcategory || challenge.category,
        description: [`${challenge.code}: ${challenge.title}`, `Attempt date: ${date}`, notes.trim()].filter(Boolean).join("\n"),
        athleteName: user.name,
        recordType: "standard",
        value: String(value),
        unit,
        evidenceUrl,
        thumbnailUrl: "pending_upload",
        paymentStatus: "pending_payment",
        openRecordId: challenge.id,
      };
      const response = await apiCall("/records", "POST", submissionData, user.token);
      navigate("/submission-checkout", { state: { submissionData: { ...submissionData, id: response?.id || "TEMP" } } });
    } catch (err) {
      setError(err.message || "Could not submit your attempt.");
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form id="try-this-record" onSubmit={submit} style={{ background: "#111", border: "1px solid rgba(255,106,0,0.35)", borderRadius: 22, padding: 24, display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#FF6A00", letterSpacing: "0.15em" }}>SUBMIT YOUR ATTEMPT</div>
        <div style={{ fontSize: 20, fontWeight: 950, textTransform: "uppercase", marginTop: 4 }}>{challenge.code} · {challenge.title}</div>
      </div>
      <SubmissionAllowanceNote />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <label>
          <span style={label}>Your result ({timed ? "time in seconds" : unit})</span>
          <input style={input} inputMode="decimal" value={result} onChange={(e) => setResult(e.target.value)} placeholder={timed ? "e.g. 12.48" : "e.g. 57"} required />
        </label>
        <label>
          <span style={label}>Attempt date</span>
          <input type="date" style={{ ...input, colorScheme: "dark" }} value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} required />
        </label>
      </div>
      <div>
        <span style={label}>Attempt video (one continuous, unedited recording)</span>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "white", borderRadius: 100, padding: "12px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "inline-flex", gap: 8, alignItems: "center" }}>
            <UploadCloud size={16} /> {file ? "Change video" : "Upload video"}
          </button>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{file ? file.name : "MP4 or MOV"}</span>
          <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/webm" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "10px 0 6px" }}>or paste a YouTube / Vimeo link</div>
        <input style={input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtube.com/…" />
      </div>
      <label>
        <span style={label}>Notes for the adjudicator (optional)</span>
        <textarea style={{ ...input, minHeight: 80, resize: "vertical" }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Equipment used, witnesses, timing method…" />
      </label>
      {error && <div role="alert" style={{ color: "#f87171", fontWeight: 700, fontSize: 13 }}>{error}</div>}
      <button type="submit" disabled={busy} style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: 100, padding: "16px 28px", fontSize: 14, fontWeight: 900, textTransform: "uppercase", cursor: busy ? "wait" : "pointer", display: "inline-flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
        {busy ? <><Loader2 size={16} className="animate-spin" /> {progress !== null ? `Uploading ${Math.round(progress)}%` : "Submitting…"}</> : "Submit my attempt"}
      </button>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.6 }}>
        Your attempt is screened by AI, then reviewed by a human adjudicator. Follow its progress in Profile → Submissions. The first attempt that is approved sets the official record.
      </div>
    </form>
  );
}
