// How a submission is reviewed: AI screening first, then a human adjudicator who makes the final decision.
import { Upload, Cpu, RotateCcw, UserCheck, Gavel } from "lucide-react";

const STEPS = [
  { icon: <Upload size={20} />, title: "1. You upload your submission", text: "Your video, photos, measurements and supporting details." },
  { icon: <Cpu size={20} />, title: "2. AI screening", text: "Our AI checks for missing information, video or photo quality problems, signs of editing, incomplete evidence and rule violations." },
  { icon: <RotateCcw size={20} />, title: "3. Fix and resend if needed", text: "If something is wrong, the submission comes back to you with what to fix, before it reaches a person." },
  { icon: <UserCheck size={20} />, title: "4. Human adjudicator", text: "Submissions that pass screening go to a human AMPEX adjudicator, who reviews the evidence against the rules." },
  { icon: <Gavel size={20} />, title: "5. Final decision by a person", text: "The adjudicator makes the final decision: verified, rejected, or more evidence needed." },
];

export default function AiReviewProcess({ style }) {
  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 5%", ...style }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#FF6A00", letterSpacing: "0.15em", marginBottom: 10 }}>HOW REVIEW WORKS</div>
      <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 950, textTransform: "uppercase", margin: "0 0 12px", color: "white" }}>AI-assisted screening, human decisions</h2>
      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 16, lineHeight: 1.7, maxWidth: 820, margin: "0 0 28px" }}>
        AI helps us screen every submission quickly and consistently, but <strong style={{ color: "white" }}>AI never issues a world-record decision</strong>.
        Every record is approved or rejected by a human AMPEX adjudicator.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {STEPS.map((s) => (
          <div key={s.title} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,106,0,0.12)", color: "#FF6A00", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{s.icon}</div>
            <div style={{ color: "white", fontWeight: 900, fontSize: 14, marginBottom: 6 }}>{s.title}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6 }}>{s.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
