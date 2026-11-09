import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle, Search, Loader2, Award } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiCall } from "../utils/api";
import { formatCertDate } from "../utils/certificatePdf";

// Public certificate check: /certificate/:number
const CertificateVerify = () => {
  const { number } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState({ for: null, data: null, error: "" });
  const [lookup, setLookup] = useState(number || "");
  const [shownNumber, setShownNumber] = useState(number);
  if (shownNumber !== number) {
    // the address changed (new search): show that number in the box
    setShownNumber(number);
    setLookup(number || "");
  }

  useEffect(() => {
    if (!number) return undefined;
    let cancelled = false;
    apiCall(`/certificates/verify/${encodeURIComponent(number.trim())}`, "GET")
      .then((data) => { if (!cancelled) setResult({ for: number, data, error: "" }); })
      .catch((err) => {
        if (cancelled) return;
        const notFound = /no certificate|not found|404/i.test(err.message || "");
        setResult({ for: number, data: null, error: notFound ? "notfound" : (err.message || "Could not check this certificate right now.") });
      });
    return () => { cancelled = true; };
  }, [number]);

  const submit = (e) => {
    e.preventDefault();
    const n = lookup.trim().toUpperCase();
    if (n) navigate(`/certificate/${encodeURIComponent(n)}`);
  };

  const loading = Boolean(number) && result.for !== number;
  const data = loading ? null : result.data;
  const error = loading ? "" : result.error;
  const valid = data?.valid;
  const revoked = data && data.status === "revoked";

  const row = (label, value) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
      <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: "white", fontSize: "15px", fontWeight: 700, textAlign: "right", overflowWrap: "anywhere", maxWidth: "100%" }}>{value || "—"}</span>
    </div>
  );

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1, padding: "160px 16px 100px", maxWidth: "720px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,106,0,0.1)", border: "1px solid rgba(255,106,0,0.25)", borderRadius: "100px", padding: "8px 18px", color: "#FF6A00", fontSize: "11px", fontWeight: 900, letterSpacing: "0.15em" }}>
              <Award size={14} /> CERTIFICATE VERIFICATION
            </div>
            <h1 style={{ fontSize: "clamp(30px, 6vw, 48px)", fontWeight: 950, margin: "20px 0 10px", letterSpacing: "-0.02em" }}>Verify a certificate</h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>
              Every AMPEX World Records certificate carries a unique number. Enter it below to confirm it is genuine.
            </p>
          </div>

          <form onSubmit={submit} style={{ display: "flex", gap: "10px", marginBottom: "28px", flexWrap: "wrap" }}>
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="AMPEX-2026-XXXXXX"
              aria-label="Certificate number"
              style={{ flex: 1, minWidth: "200px", background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "100px", padding: "14px 20px", color: "white", fontSize: "15px", outline: "none", textTransform: "uppercase" }}
            />
            <button type="submit" style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "14px 24px", fontWeight: 900, fontSize: "13px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <Search size={15} /> Check
            </button>
          </form>

          {number && (
            <div style={{ background: "#161616", border: `1px solid ${valid ? "rgba(34,197,94,0.35)" : revoked || error ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: "24px", padding: "28px 24px" }}>
              {loading ? (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", padding: "20px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Checking certificate...
                </div>
              ) : error === "notfound" ? (
                <div style={{ textAlign: "center" }}>
                  <XCircle size={44} color="#ef4444" />
                  <h2 style={{ fontSize: "22px", fontWeight: 900, margin: "12px 0 8px" }}>Certificate not found</h2>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                    No certificate with the number <b style={{ color: "white", overflowWrap: "anywhere" }}>{number.toUpperCase()}</b> has been issued by AMPEX World Records. Check the number and try again.
                  </p>
                </div>
              ) : error ? (
                <div style={{ textAlign: "center" }}>
                  <AlertTriangle size={40} color="#fbbf24" />
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "12px 0 0" }}>{error}</p>
                </div>
              ) : data ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                    {valid ? <CheckCircle2 size={44} color="#22c55e" style={{ flexShrink: 0 }} /> : <XCircle size={44} color="#ef4444" style={{ flexShrink: 0 }} />}
                    <div>
                      <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: valid ? "#22c55e" : "#ef4444" }}>
                        {valid ? "Valid certificate" : "This certificate has been revoked"}
                      </h2>
                      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: "4px 0 0" }}>
                        {valid
                          ? "Issued and verified by AMPEX World Records."
                          : `Revoked${data.revokedAt ? ` on ${formatCertDate(data.revokedAt)}` : ""}. It is no longer an official AMPEX certificate.`}
                      </p>
                    </div>
                  </div>
                  {row("Certificate number", data.certificateNumber)}
                  {row("Presented to", data.recipientName)}
                  {row("Record", data.recordTitle)}
                  {row("Official record achieved", data.recordValue)}
                  {row("Date achieved", formatCertDate(data.dateAchieved))}
                  {row("Date verified", formatCertDate(data.dateVerified))}
                  {row("Issued", formatCertDate(data.issuedAt))}
                </>
              ) : null}
            </div>
          )}

          <p style={{ textAlign: "center", marginTop: "28px", fontSize: "13px" }}>
            <Link to="/explore-records" style={{ color: "#FF6A00", fontWeight: 800, textDecoration: "none" }}>Explore verified records →</Link>
          </p>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default CertificateVerify;
