// On the submit and challenge forms: how many submissions the member has left this month,
// and a link to extra submission packs when they have run out.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiCall } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function SubmissionAllowanceNote({ style }) {
  const { user } = useAuth();
  const [a, setA] = useState(null);
  useEffect(() => {
    if (!user?.token) return;
    apiCall("/submissions/allowance", "GET", null, user.token).then(setA).catch(() => {});
  }, [user?.token]);
  if (!a || a.limit === null) return null;
  const out = a.remaining === 0 && a.extra === 0;
  const box = {
    display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px", borderRadius: 14, padding: "12px 16px", fontSize: 13, lineHeight: 1.5,
    background: out ? "rgba(239,68,68,0.08)" : "rgba(255,106,0,0.06)", border: `1px solid ${out ? "rgba(239,68,68,0.35)" : "rgba(255,106,0,0.25)"}`, color: "rgba(255,255,255,0.8)", ...style,
  };
  return (
    <div style={box} role={out ? "alert" : undefined}>
      <span style={{ flex: "1 1 240px" }}>
        {out
          ? <>You have used all <strong>{a.limit}</strong> submissions in your {a.planName} plan this month. Get an extra submission pack or upgrade to submit more.</>
          : <><strong style={{ color: "white" }}>{a.remaining}</strong> of {a.limit} submissions left this month ({a.planName} plan){a.extra > 0 && <> · <strong style={{ color: "#FF6A00" }}>{a.extra}</strong> extra</>}.</>}
      </span>
      {(out || a.remaining <= 1) && (
        <Link to="/elite#packs" style={{ color: "#FF6A00", fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>Get more submissions →</Link>
      )}
    </div>
  );
}
