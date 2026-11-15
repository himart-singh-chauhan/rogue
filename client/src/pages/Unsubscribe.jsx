// Opened from the "Unsubscribe from promotional emails" link in AMPEX emails.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiCall } from "../utils/api";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const u = params.get("u") || "";
  const t = params.get("t") || "";
  const [state, setState] = useState(u && t ? "working" : "bad");

  useEffect(() => {
    if (!u || !t) return;
    apiCall("/email/unsubscribe", "POST", { u, t }).then(() => setState("done")).catch(() => setState("bad"));
  }, [u, t]);

  const text = {
    working: ["One moment…", "Saving your email setting."],
    done: ["You are unsubscribed", "You will no longer get promotional emails from AMPEX World Records. Emails about your account still arrive. You can switch promotions back on from your profile under Messages."],
    bad: ["This link is not valid", "The unsubscribe link is incomplete or has expired. You can switch promotional emails off on your profile under Messages."],
  }[state];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "white" }}>
      <Navbar />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "140px 20px 60px", textAlign: "center" }}>
        <img src="/images/ampex-logo.webp" alt="AMPEX World Records" width={120} height={120} style={{ margin: "0 auto 24px", display: "block" }} />
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 12px" }}>{text[0]}</h1>
        <p style={{ color: "#aaa", lineHeight: 1.6, margin: "0 0 28px" }}>{text[1]}</p>
        <Link to="/profile" style={{ color: "#FF6A00", fontWeight: 800 }}>Go to my profile</Link>
      </div>
    </div>
  );
}
