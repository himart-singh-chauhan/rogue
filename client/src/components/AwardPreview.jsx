// Draws an achievement award (the real design, with the member's name) on a canvas.
// Used for the thumbnails and the large preview in Admin → Achievement Awards and on member profiles.
import { useEffect, useRef, useState } from "react";
import { drawAward } from "../utils/awardPdf";

export default function AwardPreview({ award, width = 700, style, dim = false }) {
  const ref = useRef(null);
  const [error, setError] = useState("");
  const key = JSON.stringify(award);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      if (!ref.current) return;
      drawAward(ref.current, award, { width }).then(() => alive && setError("")).catch((e) => alive && setError(e.message || "Preview failed"));
    }, 120);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, width]);
  return (
    <div style={{ position: "relative" }}>
      <canvas ref={ref} role="img" aria-label={award.title || "Achievement award"}
        style={{ width: "100%", height: "auto", display: "block", borderRadius: 8, background: "#0b1440", filter: dim ? "grayscale(0.85) brightness(0.55)" : "none", ...style }} />
      {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
