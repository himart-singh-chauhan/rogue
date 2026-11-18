// Opened from the "Unsubscribe from promotional emails" link in AMPEX emails.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiCall } from "../utils/api";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const u = params.get("u") || "";
  const e = params.get("e") || ""; // people outside the community: their email address
  const t = params.get("t") || "";
  const [state, setState] = useState((u || e) && t ? "working" : "bad");

  useEffect(() => {
    if ((!u && !e) || !t) return;
    apiCall("/email/unsubscribe", "POST", e ? { e, t } : { u, t }).then(() => setState("done")).catch(() => setState("bad"));
  }, [u, e, t]);

  const text = {
    working: ["One moment…", "Saving your email setting."],
    done: e
      ? ["You are unsubscribed", "You will not get emails from AMPEX World Records at this address again."]
      : ["You are unsubscribed", "You will no longer get promotional emails from AMPEX World Records. Emails about your account still arrive. You can switch promotions back on from your profile under Messages."],
    bad: ["This link is not valid", "The unsubscribe link is incomplete or has expired. You can switch promotional emails off on your profile under Messages."],
  }[state];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "white" }}>
      <Navbar />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "140px 20px 60px", textAlign: "center" }}>
        <img src="/images/ampex-logo.webp" alt="AMPEX World Records" width={120} height={120} style={{ margin: "0 auto 24px", display: "block" }} />
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 12px" }}>{text[0]}</h1>
        <p style={{ color: "#aaa", lineHeight: 1.6, margin: "0 0 28px" }}>{text[1]}</p>
        {e ? <Link to="/" style={{ color: "#FF6A00", fontWeight: 800 }}>Visit AMPEX World Records</Link> : <Link to="/profile" style={{ color: "#FF6A00", fontWeight: 800 }}>Go to my profile</Link>}
      </div>
    </div>
  );
}
