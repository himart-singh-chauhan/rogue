import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Scale, ShieldAlert, Eye, Cpu, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

const ExpertAdjudicationLearnMore = () => {
  const sections = [
    {
      id: "what-is-adjudication",
      icon: <Scale size={24} color="#FF6A00" />,
      title: "What Is Expert Adjudication?",
      subtitle: "Trained reviewers, judges, and verification specialists analyze record submissions to ensure absolute legitimacy.",
      points: [
        "Rigorous Frame-by-Frame Video analysis to inspect cuts or edits.",
        "Precision Timing verification utilizing calibrated milliseconds trackers.",
        "Calibrated Measurement verification for exact distance, height, and weight metrics.",
        "Comprehensive Rule compliance review against specific category regulations.",
        "Witness validation and direct background statement integrity checks.",
        "Equipment inspection to confirm standardized and certified tools.",
        "Safety review ensuring absolute athlete well-being during attempts.",
        "AI-assisted authenticity scan for pixel/integrity verification."
      ]
    },
    {
      id: "why-it-matters",
      icon: <ShieldAlert size={24} color="#FF6A00" />,
      title: "Why Expert Adjudication Matters",
      subtitle: "Professional review creates the standard for competitive record breaking. It protects:",
      points: [
        "Competitor fairness — keeping the playing field level for all athletes.",
        "Record accuracy — ensuring the certified metrics are 100% correct.",
        "Platform integrity — protecting the leaderboard from manipulation.",
        "Community trust — providing verifiable proof the public can rely on.",
        "Official rankings — certifying who is truly number one worldwide.",
        "Historical record legitimacy — honoring efforts with everlasting validity."
      ],
      footerText: "Without proper adjudication, records could be inaccurate, manipulated, or fraudulent."
    },
    {
      id: "what-we-review",
      icon: <Eye size={24} color="#FF6A00" />,
      title: "What Our Adjudicators Review",
      subtitle: "Submissions are audited across four core evidentiary pillars:",
      categories: [
        { title: "Video Evidence", desc: "Full attempt visibility, clear start and finish frames, unedited camera files, multiple angles, and timer readability." },
        { title: "Measurement Evidence", desc: "Verifiable distance markings, certified weight plate indicators, height measurements, repetition logs, speed, and scoring sheets." },
        { title: "Rule Compliance", desc: "Execution of proper physical techniques, utilization of approved equipment categories, category rules, and safety setups." },
        { title: "Witness Verification", desc: "Independent expert observer confirmations, certified judge statements, and official event organizer verification records." }
      ]
    },
    {
      id: "ai-verification",
      icon: <Cpu size={24} color="#FF6A00" />,
      title: "AI Verification Technology",
      subtitle: "Certain high-stakes submissions undergo state-of-the-art AI authenticity scanning.",
      points: [
        "Automated motion analysis to verify biomechanical performance.",
        "Audio/video timing synchronization audits.",
        "Object and tool tracking to verify dimensions.",
        "Movement pattern consistency and speed comparisons.",
        "File integrity scanning to flag pixel manipulation or deepfakes."
      ],
      footerText: "This custom technology strengthens the fairness, speed, and absolute reliability of our review queue."
    },
    {
      id: "live-adjudication",
      icon: <Sparkles size={24} color="#FF6A00" />,
      title: "Live Event Adjudication",
      subtitle: "At officially sanctioned live spectator matches, expert adjudicators judge attempts in real time.",
      points: [
        "Certified in-person judges tracking reps and form.",
        "High-frequency official timers and synchronized timing displays.",
        "On-site measurement staff utilizing laser and weight calibrations.",
        "Multi-camera streaming systems for instant review.",
        "Audience and independent arena witness oversight.",
        "On-site medical and safety marshals supervising attempts."
      ]
    }
  ];

  const outcomes = [
    { label: "Approved", color: "#22c55e", text: "The attempt meets all criteria and the record is officially verified." },
    { label: "Denied", color: "#ef4444", text: "The submission did not meet official standards or category specs." },
    { label: "Needs Info", color: "#f59e0b", text: "Adjudicators require additional evidence or metric clarifications." },
    { label: "Extended Review", color: "#a855f7", text: "Requires technical analysis, AI scans, or witness verification." }
  ];

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", fontFamily: "'Inter', sans-serif", minHeight: "100vh", paddingTop: "80px", display: "flex", flexDirection: "column" }}>
        
        {/* NAVBAR */}
        <Navbar />

        {/* HERO SECTION */}
        <header style={{ position: "relative", padding: "100px 5% 60px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "radial-gradient(circle at center, rgba(255,106,0,0.05) 0%, transparent 70%)" }}>
          <div style={{ background: "rgba(255,106,0,0.1)", color: "#FF6A00", display: "inline-block", padding: "6px 16px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
            VERIFICATION MANUAL
          </div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 68px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.03em", marginBottom: "24px", lineHeight: "1.1", maxWidth: "900px" }}>
            Professional Verification <span style={{ color: "#FF6A00" }}>You Can Trust</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", maxWidth: "750px", lineHeight: "1.7", margin: "0 auto 32px" }}>
            At AMPEX World Records, Expert Adjudication is the official judging and verification system used to review world record attempts with fairness, accuracy, professionalism, and integrity. Our adjudication process is designed to help ensure that every approved record is legitimate, properly documented, and completed according to official rules and standards.
          </p>
          <Link to="/appeals" style={{ textDecoration: "none" }}>
            <button style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", transition: "0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,106,0,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              FILE AN APPEAL <ArrowRight size={16} />
            </button>
          </Link>
        </header>

        {/* DETAILS SECTION */}
        <section style={{ padding: "80px 5%", maxWidth: "1200px", margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "280px 1fr", gap: "60px" }}>
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <div style={{ position: "sticky", top: "140px", height: "fit-content" }}>
            <h4 style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "24px" }}>QUICK SECTIONS</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <a href="#what-is-adjudication" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>1. What is Adjudication</a>
              <a href="#why-it-matters" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>2. Why It Matters</a>
              <a href="#what-we-review" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>3. What We Review</a>
              <a href="#ai-verification" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>4. AI Verification</a>
              <a href="#live-adjudication" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>5. Live Adjudication</a>
              <a href="#review-outcomes" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>6. Outcomes & Appeals</a>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT AREA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
            
            {/* CONTENT BLOCKS */}
            {sections.map((sec) => (
              <div id={sec.id} key={sec.id} style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px", transition: "all 0.3s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ width: "48px", height: "48px", background: "rgba(255,106,0,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {sec.icon}
                  </div>
                  <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase" }}>{sec.title}</h3>
                </div>
                
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", marginBottom: "24px" }}>
                  {sec.subtitle}
                </p>

                {sec.points && (
                  <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "20px", color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.6" }}>
                    {sec.points.map((pt, idx) => (
                      <li key={idx} style={{ listStyleType: "square", paddingLeft: "4px" }}>{pt}</li>
                    ))}
                  </ul>
                )}

                {sec.categories && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {sec.categories.map((c, idx) => (
                      <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "24px", borderRadius: "20px" }}>
                        <h5 style={{ fontSize: "15px", fontWeight: "900", color: "#FF6A00", marginBottom: "8px", textTransform: "uppercase" }}>{c.title}</h5>
                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.4" }}>{c.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {sec.footerText && (
                  <div style={{ fontSize: "12px", fontWeight: "800", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px", marginTop: "24px" }}>
                    {sec.footerText}
                  </div>
                )}
              </div>
            ))}

            {/* POSSIBLE REVIEW OUTCOMES & APPEALS */}
            <div id="review-outcomes" style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", background: "rgba(255, 106, 0, 0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Scale size={24} color="#FF6A00" />
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase" }}>Review Outcomes</h3>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", marginBottom: "24px" }}>
                Following adjudication sweeps, submissions receive one of the following decisions:
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
                {outcomes.map((ot, idx) => (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "20px", borderRadius: "16px" }}>
                    <strong style={{ color: ot.color, fontSize: "14px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>{ot.label}</strong>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{ot.text}</span>
                  </div>
                ))}
              </div>

              {/* APPEALS DETAILS */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "32px", borderRadius: "24px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: "900", textTransform: "uppercase", marginBottom: "12px", color: "#FF6A00", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={18} /> Official Appeals Process
                </h4>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: "1.6" }}>
                  Competitors who disagree with a decision may submit an official appeal for secondary review through the Appeals Department. Every appeal is inspected by a secondary tier of high-court adjudicators to ensure total fairness.
                </p>
              </div>
            </div>

          </div>

          {/* COMMITMENT & FINAL MESSAGE */}
          <div style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg, rgba(255,106,0,0.1) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid #FF6A00", borderRadius: "32px", padding: "40px", textAlign: "center", marginTop: "40px" }}>
            <h3 style={{ fontSize: "28px", fontWeight: "950", textTransform: "uppercase", marginBottom: "12px", color: "#FF6A00" }}>Our Commitment</h3>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", maxWidth: "650px", margin: "0 auto 24px", lineHeight: "1.6" }}>
              The Expert Adjudication system is built to provide fair competition, accurate verification, honest review processes, transparent standards, and absolute respect for all competitors. Every approved record represents real effort, real skill, and real achievement.
            </p>
            <h4 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "white", textTransform: "uppercase", marginBottom: "32px" }}>
              Records deserve professional verification. Break Limits. Make History. Become Legendary.
            </h4>
            <Link to="/verify" style={{ textDecoration: "none" }}>
              <button style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", transition: "0.3s" }}>
                SUBMIT RECORD FOR REVIEW
              </button>
            </Link>
          </div>

        </section>

        {/* FOOTER */}
        <Footer />

      </div>
    </PageTransition>
  );
};

export default ExpertAdjudicationLearnMore;
