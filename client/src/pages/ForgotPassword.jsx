// "Forgot password?": email a reset link (the answer is the same whether or not the address has an account).
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Captcha, { captchaOn, captchaMessage } from "../components/Captcha";
import { apiCall } from "../utils/api";

const box = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "16px 24px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" };

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ text: "", ok: false });
    setBusy(true);
    const token = captchaOn ? (captchaToken || await captchaRef.current?.getToken(15000)) : "";
    if (captchaOn && !token) { setBusy(false); setMsg({ text: captchaMessage(captchaRef.current?.status(), "press Send again"), ok: false }); return; }
    try {
      const r = await apiCall("/auth/forgot-password", "POST", { email, captchaToken: token || undefined });
      setMsg({ text: r.message, ok: true });
    } catch (err) {
      setMsg({ text: err.message, ok: false });
      captchaRef.current?.reset();
    } finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "white" }}>
      <Navbar />
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "140px 20px 60px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 950, margin: "0 0 8px" }}>Forgot your password?</h1>
        <p style={{ color: "#aaa", lineHeight: 1.6, margin: "0 0 24px" }}>Enter the email address of your account. We'll send you a link to choose a new password.</p>
        {msg.ok ? (
          <div role="status" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 16, padding: 18, lineHeight: 1.6 }}>{msg.text}</div>
        ) : (
          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            <input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={box} />
            <Captcha ref={captchaRef} onToken={setCaptchaToken} />
            {msg.text && <div role="alert" style={{ color: "#f87171", fontSize: 13, fontWeight: 700 }}>{msg.text}</div>}
            <button type="submit" disabled={busy} style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: 100, padding: 16, fontSize: 13, fontWeight: 900, textTransform: "uppercase", cursor: busy ? "wait" : "pointer" }}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <div style={{ marginTop: 24 }}><Link to="/login" style={{ color: "#FF6A00", fontWeight: 800 }}>Back to Login</Link></div>
      </div>
    </div>
  );
}
