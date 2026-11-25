// Shown to a logged-in member whose email address isn't verified yet, with a button to send the link again.
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiCall } from "../utils/api";

export default function VerifyEmailBanner({ style }) {
  const { user } = useAuth();
  const [state, setState] = useState({ busy: false, text: "", ok: false });
  if (!user || user.emailVerified !== false) return null;

  const resend = async () => {
    setState({ busy: true, text: "", ok: false });
    try {
      const r = await apiCall("/auth/resend-verification", "POST", {}, user.token);
      setState({ busy: false, text: r.message || "We sent you a new link.", ok: true });
    } catch (e) {
      setState({ busy: false, text: e.message || "Could not send the email.", ok: false });
    }
  };

  return (
    <div role="status" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", background: "rgba(255,106,0,0.1)", border: "1px solid rgba(255,106,0,0.35)", borderRadius: 16, padding: "14px 18px", color: "white", ...style }}>
      <MailCheck size={22} color="#FF6A00" style={{ flexShrink: 0 }} />
      <div style={{ flex: "1 1 260px", minWidth: 0, fontSize: 14, lineHeight: 1.5 }}>
        <strong>Please verify your email address.</strong>{" "}
        We sent a link to <strong>{user.email}</strong>. Open it to confirm this is your address. Can't find it? Check your Spam or Promotions folder, and mark our email "Not spam".
        {state.text && <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: state.ok ? "#22c55e" : "#f87171" }}>{state.text}</div>}
      </div>
      <button type="button" onClick={resend} disabled={state.busy}
        style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: 100, padding: "10px 18px", fontSize: 12, fontWeight: 900, cursor: state.busy ? "wait" : "pointer", whiteSpace: "nowrap" }}>
        {state.busy ? "Sending…" : "Send the link again"}
      </button>
    </div>
  );
}
