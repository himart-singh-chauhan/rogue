// Small shared building blocks for the admin panels (same dark look as Admin.jsx).
import React, { useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiCall } from "../../utils/api";

export const ACCENT = "#FF5500";

export const ui = {
  card: { background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px" },
  eyebrow: { color: ACCENT, fontSize: "11px", fontWeight: 900, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" },
  h2: { fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 950, margin: "0 0 10px 0", color: "white", letterSpacing: "-0.5px" },
  h3: { fontSize: "18px", fontWeight: 900, margin: 0, color: "white" },
  sub: { color: "#888", margin: 0, fontSize: "14px", lineHeight: 1.6, maxWidth: "640px" },
  label: { display: "block", fontSize: "11px", fontWeight: 800, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" },
  input: { width: "100%", boxSizing: "border-box", background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "11px 14px", color: "white", fontSize: "14px", outline: "none", fontFamily: "inherit" },
  btn: { background: ACCENT, color: "white", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" },
  btnGhost: { background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "9px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" },
  btnDanger: { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "9px 14px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" },
  iconBtn: { background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", width: "34px", height: "34px", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
  th: { textAlign: "left", padding: "12px 14px", fontSize: "11px", fontWeight: 800, color: "#777", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" },
  td: { padding: "14px", fontSize: "14px", color: "#ddd", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" },
  muted: { color: "#777", fontSize: "13px" },
};

export const pill = (color) => ({
  display: "inline-block", padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 800,
  background: `${color}1f`, color, border: `1px solid ${color}55`, whiteSpace: "nowrap",
});

export const STATUS_COLORS = {
  active: "#22c55e", approved: "#22c55e", issued: "#22c55e", paid: "#22c55e", verified: "#22c55e", fulfilled: "#38bdf8",
  pending: "#fbbf24", inactive: "#888", hidden: "#888", denied: "#ef4444", revoked: "#ef4444", cancelled: "#ef4444", expired: "#888",
};
export const StatusPill = ({ status }) => <span style={pill(STATUS_COLORS[status] || "#aaa")}>{status}</span>;

// apiCall bound to the admin's token
export const useAdminApi = () => {
  const { user } = useAuth();
  const token = user?.token;
  return useCallback((path, method = "GET", body = null) => apiCall(path, method, body, token), [token]);
};

export const SectionHeader = ({ eyebrow, title, desc, actions }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
    <div style={{ minWidth: 0 }}>
      {eyebrow && <div style={ui.eyebrow}>{eyebrow}</div>}
      <h2 style={ui.h2}>{title}</h2>
      {desc && <p style={ui.sub}>{desc}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>{actions}</div>}
  </div>
);

export const Field = ({ label, hint, children, style }) => (
  <label style={{ display: "block", ...style }}>
    <span style={ui.label}>{label}</span>
    {children}
    {hint && <span style={{ display: "block", color: "#666", fontSize: "12px", marginTop: "5px", lineHeight: 1.4 }}>{hint}</span>}
  </label>
);

export const Notice = ({ type = "info", children, onClose }) => {
  const c = type === "error" ? "#ef4444" : type === "success" ? "#22c55e" : "#38bdf8";
  if (!children) return null;
  return (
    <div style={{ background: `${c}14`, border: `1px solid ${c}55`, color: c, borderRadius: "12px", padding: "12px 16px", fontSize: "13px", fontWeight: 700, marginBottom: "16px", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
      <span>{children}</span>
      {onClose && <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: c, cursor: "pointer", padding: 0 }} aria-label="Dismiss"><X size={14} /></button>}
    </div>
  );
};

export const Modal = ({ title, onClose, children, width = 560, footer }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      data-lenis-prevent
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 10000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 12px", overflowY: "auto" }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} style={{ background: "#151515", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", width: "100%", maxWidth: `${width}px`, margin: "auto", boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ ...ui.h3, fontSize: "17px" }}>{title}</h3>
          <button type="button" onClick={onClose} style={ui.iconBtn} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>{children}</div>
        {footer && <div style={{ padding: "16px 22px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>{footer}</div>}
      </div>
    </div>
  );
};

export const Table = ({ head, children, minWidth = 640 }) => (
  <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${minWidth}px` }}>
      <thead><tr>{head.map((h) => <th key={h} style={ui.th}>{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const Empty = ({ children }) => (
  <div style={{ textAlign: "center", color: "#777", padding: "40px 16px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "14px", fontSize: "14px" }}>{children}</div>
);

export const Tabs = ({ tabs, value, onChange }) => (
  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "22px" }}>
    {tabs.map((t) => (
      <button
        type="button"
        key={t.id}
        onClick={() => onChange(t.id)}
        style={{ ...ui.btnGhost, background: value === t.id ? ACCENT : "rgba(255,255,255,0.04)", borderColor: value === t.id ? ACCENT : "rgba(255,255,255,0.1)" }}
      >
        {t.label}{t.count !== undefined && <span style={{ background: "rgba(0,0,0,0.3)", borderRadius: "100px", padding: "1px 8px", fontSize: "11px" }}>{t.count}</span>}
      </button>
    ))}
  </div>
);

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");
export const fmtMoney = (n) => `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
