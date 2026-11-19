// Opened from the "Verify my email" button in the email sent after sign-up.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiCall } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState(token ? { phase: "working" } : { phase: "bad", text: "This verification link is incomplete. Please use the newest email we sent you." });

  useEffect(() => {
    if (!token) return;
    apiCall("/auth/verify-email", "POST", { token })
      .then((r) => { setState({ phase: "done", email: r.email, already: r.already }); refreshUser?.(); })
      .catch((e) => setState({ phase: "bad", text: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const title = { working: "One moment…", done: state.already ? "Already verified" : "Email verified", bad: "This link didn't work" }[state.phase];
  const text = state.phase === "working" ? "Confirming your email address."
    : state.phase === "done" ? `Thank you! ${state.email || "Your email address"} is confirmed for your AMPEX World Records account.`
    : state.text;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "white" }}>
      <Navbar />
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "140px 20px 60px", textAlign: "center" }}>
        <img src="/images/ampex-logo.webp" alt="AMPEX World Records" width={120} height={120} style={{ margin: "0 auto 24px", display: "block" }} />
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 12px" }}>{title}</h1>
        <p style={{ color: "#aaa", lineHeight: 1.6, margin: "0 0 28px" }}>{text}</p>
        {user
          ? <Link to="/profile" style={{ color: "#FF6A00", fontWeight: 800 }}>Go to my profile</Link>
          : <Link to="/login" style={{ color: "#FF6A00", fontWeight: 800 }}>Log in</Link>}
      </div>
    </div>
  );
}
