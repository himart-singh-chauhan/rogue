// Opened from the "Choose a new password" button in the reset email.
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "../components/Navbar";
import { apiCall } from "../utils/api";

const box = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "16px 96px 16px 24px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" };

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: token ? "" : "This reset link is incomplete. Please request a new one.", ok: false });

  const submit = async (e) => {
    e.preventDefault();
    if (pw !== pw2) { setMsg({ text: "The two passwords don't match.", ok: false }); return; }
    setBusy(true); setMsg({ text: "", ok: false });
    try {
      const r = await apiCall("/auth/reset-password", "POST", { token, password: pw });
      setMsg({ text: r.message, ok: true });
    } catch (err) { setMsg({ text: err.message, ok: false }); } finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "white" }}>
      <Navbar />
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "140px 20px 60px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 950, margin: "0 0 8px" }}>Choose a new password</h1>
        <p style={{ color: "#aaa", lineHeight: 1.6, margin: "0 0 24px" }}>At least 8 characters, with at least one letter and one number.</p>
        {msg.ok ? (
          <div role="status" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 16, padding: 18, lineHeight: 1.6 }}>
            {msg.text} <Link to="/login" style={{ color: "#FF6A00", fontWeight: 800 }}>Log in</Link>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            {[["New password", pw, setPw], ["Type it again", pw2, setPw2]].map(([ph, v, set]) => (
              <div key={ph} style={{ position: "relative" }}>
                <input type={show ? "text" : "password"} autoComplete="new-password" required placeholder={ph} value={v} onChange={(e) => set(e.target.value)} style={box} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 900 }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />} {show ? "HIDE" : "SHOW"}
                </button>
              </div>
            ))}
            {msg.text && <div role="alert" style={{ color: "#f87171", fontSize: 13, fontWeight: 700 }}>{msg.text} {!token || /expired|not valid|incomplete/i.test(msg.text) ? <Link to="/forgot-password" style={{ color: "#FF6A00" }}>Request a new link</Link> : null}</div>}
            <button type="submit" disabled={busy || !token} style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: 100, padding: 16, fontSize: 13, fontWeight: 900, textTransform: "uppercase", cursor: busy ? "wait" : "pointer" }}>
              {busy ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
