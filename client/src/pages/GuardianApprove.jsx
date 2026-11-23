// Opened by a parent/guardian from the approval email for a member under 18.
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiCall } from "../utils/api";

export default function GuardianApprove() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState(token ? { phase: "ask" } : { phase: "bad", text: "This approval link is incomplete." });

  const approve = async () => {
    setState({ phase: "working" });
    try {
      const r = await apiCall("/auth/guardian-approve", "POST", { token });
      setState({ phase: "done", name: r.memberName, already: r.already });
    } catch (e) { setState({ phase: "bad", text: e.message }); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "white" }}>
      <Navbar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "140px 20px 60px", textAlign: "center" }}>
        <img src="/images/ampex-logo.webp" alt="AMPEX World Records" width={110} height={110} style={{ margin: "0 auto 20px", display: "block" }} />
        {state.phase === "ask" || state.phase === "working" ? (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 950, margin: "0 0 12px" }}>Approve your child's account</h1>
            <p style={{ color: "#aaa", lineHeight: 1.6, margin: "0 0 20px" }}>Members under 18 need a parent or legal guardian, who is at least 18 years old, to approve and manage their AMPEX World Records account.</p>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 14, fontSize: 13, lineHeight: 1.6, cursor: "pointer" }}>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ accentColor: "#FF6A00", marginTop: 4 }} />
              I confirm that I am this member's parent or legal guardian, that I am at least 18 years old, and that I approve and will manage this account. I understand that false age or guardian information may result in account suspension and the revocation of any records earned through the account.
            </label>
            <button type="button" disabled={!agree || state.phase === "working"} onClick={approve} style={{ marginTop: 18, background: agree ? "#FF6A00" : "#444", color: "white", border: "none", borderRadius: 100, padding: "14px 28px", fontSize: 13, fontWeight: 900, textTransform: "uppercase", cursor: agree ? "pointer" : "not-allowed" }}>
              {state.phase === "working" ? "Approving…" : "Approve the account"}
            </button>
          </>
        ) : state.phase === "done" ? (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 950, margin: "0 0 12px" }}>{state.already ? "Already approved" : "Account approved"}</h1>
            <p style={{ color: "#aaa", lineHeight: 1.6 }}>Thank you. {state.name || "The member"} can now log in to AMPEX World Records.</p>
            <Link to="/" style={{ color: "#FF6A00", fontWeight: 800 }}>Visit AMPEX World Records</Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 950, margin: "0 0 12px" }}>This link didn't work</h1>
            <p style={{ color: "#aaa", lineHeight: 1.6 }}>{state.text} If you need help, contact AMPEX World Records support.</p>
          </>
        )}
      </div>
    </div>
  );
}
