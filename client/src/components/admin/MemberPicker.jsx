// Admin: find members by name, email, username or member number. Single pick (onPick) or
// several (multiple + value/onChange with an array of members).
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ui, useAdminApi } from "./adminUi";

let cache = null; // the member list is loaded once per admin session

const useMembers = () => {
  const api = useAdminApi();
  const [members, setMembers] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);
  useEffect(() => {
    if (cache) return undefined;
    let alive = true;
    api("/dashboard/users/list/all")
      .then((r) => { cache = (r.users || r || []).filter((u) => u && u.id); if (alive) setMembers(cache); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [api]);
  return { members, loading };
};

export default function MemberPicker({ onPick, multiple = false, value = [], onChange, placeholder = "Search members by name, email or username…" }) {
  const { members, loading } = useMembers();
  const [q, setQ] = useState("");
  const chosen = new Set(value.map((m) => m.id));
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 1) return [];
    return members.filter((u) => [u.name, u.email, u.username, u.member_number].some((v) => String(v || "").toLowerCase().includes(s))).slice(0, 8);
  }, [q, members]);

  const pick = (u) => {
    if (multiple) { if (!chosen.has(u.id)) onChange([...value, u]); }
    else onPick?.(u);
    setQ("");
  };

  return (
    <div>
      {multiple && value.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {value.map((m) => (
            <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,85,0,0.12)", border: "1px solid rgba(255,85,0,0.35)", color: "white", borderRadius: 100, padding: "4px 6px 4px 12px", fontSize: 12, fontWeight: 700 }}>
              {m.name || m.email}
              <button type="button" aria-label={`Remove ${m.name}`} onClick={() => onChange(value.filter((x) => x.id !== m.id))} style={{ background: "rgba(0,0,0,0.3)", border: "none", color: "#ccc", borderRadius: "50%", width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <Search size={15} color="#777" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (results[0]) pick(results[0]); } }}
          placeholder={loading ? "Loading members…" : placeholder}
          style={{ ...ui.input, paddingLeft: 36 }}
        />
        {results.length > 0 && (
          <div data-lenis-prevent="true" style={{ position: "absolute", zIndex: 30, left: 0, right: 0, top: "calc(100% + 4px)", background: "#1b1b1b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", maxHeight: 280, overflowY: "auto", boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}>
            {results.map((u) => (
              <button key={u.id} type="button" onClick={() => pick(u)} disabled={chosen.has(u.id)} style={{ display: "flex", width: "100%", gap: 10, alignItems: "center", textAlign: "left", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "10px 12px", color: "white", cursor: "pointer", opacity: chosen.has(u.id) ? 0.4 : 1 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 800, fontSize: 13 }}>{u.name || "(no name)"}{u.username ? <span style={{ color: "#888", fontWeight: 600 }}> · @{u.username}</span> : null}</span>
                  <span style={{ display: "block", color: "#888", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}{u.member_number ? ` · ${u.member_number}` : ""}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
