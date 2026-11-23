// Record history on every record page: who holds it now, who held it before (with the date it was broken),
// how the record progressed, and the other attempts at it (verified, under review or not approved).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, History, TrendingUp, ListChecks } from "lucide-react";
import { apiCall } from "../utils/api";

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—");
const score = (r) => `${r.value ?? ""}${r.unit ? ` ${String(r.unit).toLowerCase()}` : ""}`.trim() || "—";
const card = { background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 };
const h = { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 900, letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 14px", color: "white" };
const STATUS = {
  "PREVIOUS RECORD": { text: "Verified attempt", color: "#22c55e" },
  "PENDING REVIEW": { text: "Under review", color: "#F59E0B" },
  "FAILED ATTEMPT": { text: "Not approved", color: "#ef4444" },
};

function Holder({ r }) {
  const name = r.holder?.name || "Athlete";
  return r.holder?.username
    ? <Link to={`/profile/${r.holder.username}`} style={{ color: "white", fontWeight: 800, textDecoration: "none" }}>{name}</Link>
    : <span style={{ color: "white", fontWeight: 800 }}>{name}</span>;
}

export default function RecordHistory({ recordId }) {
  const [h1, setData] = useState(null);
  useEffect(() => {
    if (!recordId) return;
    apiCall(`/records/${recordId}/history`, "GET").then(setData).catch(() => setData(null));
  }, [recordId]);
  if (!h1?.current) return null;

  const { current, previous = [], attempts = [] } = h1;
  // previous[0] is the record the current one replaced; its beatenAt is when the current holder took it
  const progression = [...previous].reverse().concat(current); // oldest → newest
  const verifiedAttempts = attempts.filter((a) => a.label === "PREVIOUS RECORD");
  const otherAttempts = attempts.filter((a) => a.label !== "PREVIOUS RECORD");

  return (
    <section style={{ margin: "40px 0 60px", display: "grid", gap: 20 }}>
      <h2 style={{ fontSize: 26, fontWeight: 950, textTransform: "uppercase", margin: 0, color: "white" }}>Record History</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <div style={{ ...card, borderColor: "rgba(255,106,0,0.4)" }}>
          <div style={h}><Trophy size={16} color="#FF6A00" /> Current record holder</div>
          <div style={{ fontSize: 18 }}><Holder r={current} /></div>
          <div style={{ fontSize: 28, fontWeight: 950, color: "#FF6A00", margin: "6px 0" }}>{score(current)}</div>
          <div style={{ color: "#999", fontSize: 13 }}>Verified {fmt(current.date)}{current.holder?.country ? ` · ${current.holder.country}` : ""}</div>
          {current.id !== recordId && <Link to={`/record/${current.id}`} style={{ color: "#FF6A00", fontSize: 13, fontWeight: 800, display: "inline-block", marginTop: 10 }}>Open the current record →</Link>}
        </div>
        <div style={card}>
          <div style={h}><History size={16} color="#FF6A00" /> Previous record holder</div>
          {previous[0] ? (
            <>
              <div style={{ fontSize: 18 }}><Holder r={previous[0]} /></div>
              <div style={{ fontSize: 24, fontWeight: 950, color: "white", margin: "6px 0" }}>{score(previous[0])}</div>
              <div style={{ color: "#999", fontSize: 13 }}>Record broken on {fmt(previous[0].beatenAt)}</div>
            </>
          ) : <div style={{ color: "#999", fontSize: 14 }}>None yet: this is the original record.</div>}
        </div>
      </div>

      {progression.length > 1 && (
        <div style={card}>
          <div style={h}><TrendingUp size={16} color="#FF6A00" /> Record progression</div>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {progression.map((r, i) => (
              <li key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: i === progression.length - 1 ? "#FF6A00" : "#333", color: "white", fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                <span style={{ minWidth: 120, fontWeight: 900, color: i === progression.length - 1 ? "#FF6A00" : "white" }}>{score(r)}</span>
                <Holder r={r} />
                <span style={{ color: "#888", fontSize: 12 }}>
                  set {fmt(r.date)}{r.beatenAt ? ` · broken ${fmt(r.beatenAt)}` : i === progression.length - 1 ? " · current record" : ""}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div style={card}>
        <div style={h}><ListChecks size={16} color="#FF6A00" /> Attempts at this record ({attempts.length})</div>
        {attempts.length === 0 ? (
          <div style={{ color: "#999", fontSize: 14 }}>No challenges yet. <Link to="/challenge" style={{ color: "#FF6A00", fontWeight: 800 }}>Think you can beat it?</Link></div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {[...verifiedAttempts, ...otherAttempts].slice(0, 30).map((a) => {
              const st = STATUS[a.label] || STATUS["PENDING REVIEW"];
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ minWidth: 110, fontWeight: 900, color: "white" }}>{score(a)}</span>
                  <Holder r={a} />
                  <span style={{ color: "#888", fontSize: 12 }}>{fmt(a.date)}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 900, color: st.color, border: `1px solid ${st.color}55`, borderRadius: 6, padding: "2px 8px" }}>{st.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
