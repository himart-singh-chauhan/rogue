import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Shield, ShieldCheck, Activity, Video, Users, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

const VerificationProtocolLearnMore = () => {
  const steps = [
    { num: "Step 1", title: "Submission Received", desc: "After a competitor submits a record attempt, the system logs competitor information, record category, submission date, uploaded evidence, witness details, and timing/measurement data. A submission tracking number is generated." },
    { num: "Step 2", title: "Initial Screening", desc: "The verification team reviews the submission to confirm that required files are included, videos upload correctly, evidence is readable, and the submission follows platform guidelines. Incomplete submissions are returned." },
    { num: "Step 3", title: "AI Motion & Authenticity Analysis", desc: "Certain submissions go through advanced AI analysis. The system examines body movement tracking, motion consistency, timing sync, frame-by-frame analysis, video authenticity, editing detection, and pattern comparison." },
    { num: "Step 4", title: "Human Adjudication Review", desc: "Official adjudicators and verification staff review video evidence, timing results, measurements, rule compliance, witness documentation, and safety standards. Additional evidence may be requested." },
    { num: "Step 5", title: "Final Decision", desc: "Once review is complete, the attempt receives a final outcome: Approved (officially verified), Denied (did not meet standards), Needs Info (additional details required), or Extended Review (further technical analysis)." }
  ];

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", fontFamily: "'Inter', sans-serif", minHeight: "100vh", paddingTop: "80px", display: "flex", flexDirection: "column" }}>
        
        {/* NAVBAR */}
        <Navbar />

        {/* HERO SECTION */}
        <header style={{ position: "relative", padding: "100px 5% 60px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "radial-gradient(circle at center, rgba(255,106,0,0.05) 0%, transparent 70%)" }}>
          <div style={{ background: "rgba(255,106,0,0.1)", color: "#FF6A00", display: "inline-block", padding: "6px 16px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
            AUTHENTICATION PROTOCOL
          </div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 68px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.03em", marginBottom: "24px", lineHeight: "1.1", maxWidth: "1000px" }}>
            AMPEX World Records <span style={{ color: "#FF6A00" }}>Verification System</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", maxWidth: "750px", lineHeight: "1.7", margin: "0 auto 32px" }}>
            The VERIFICATION PROTOCOL is the official system used by AMPEX World Records to review, analyze, and authenticate world record submissions. This process helps ensure that every approved achievement is legitimate, accurately documented, and completed according to official rules and standards.
          </p>
          <Link to="/verify" style={{ textDecoration: "none" }}>
            <button style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", transition: "0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,106,0,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              START VERIFICATION NOW <ArrowRight size={16} />
            </button>
          </Link>
        </header>

        {/* DETAILS SECTION */}
        <section style={{ padding: "80px 5%", maxWidth: "1200px", margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "280px 1fr", gap: "60px" }}>
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <div style={{ position: "sticky", top: "140px", height: "fit-content" }}>
            <h4 style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "24px" }}>QUICK SECTIONS</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <a href="#what-is-it" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>1. What Is the Protocol</a>
              <a href="#why-it-matters" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>2. Why It Matters</a>
              <a href="#how-it-works" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>3. Process Steps</a>
              <a href="#standards" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>4. Evidence Standards</a>
              <a href="#fraud-prevention" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>5. Fraud Prevention</a>
              <a href="#live-verification" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>6. Live Verification</a>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT AREA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
            
            {/* WHAT IS THE PROTOCOL */}
            <div id="what-is-it" style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", background: "rgba(255,106,0,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={24} color="#FF6A00" />
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase" }}>What Is the Verification Protocol?</h3>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", marginBottom: "24px" }}>
                The Verification Protocol is a multi-layer review process that combines human expertise and advanced technology to maintain fairness, integrity, and trust across the entire AMPEX competitive ecosystem. It aggregates:
              </p>
              <ul style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingLeft: "20px", color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.6" }}>
                <li style={{ listStyleType: "square" }}>Human adjudication</li>
                <li style={{ listStyleType: "square" }}>AI-assisted motion analysis</li>
                <li style={{ listStyleType: "square" }}>Video authentication</li>
                <li style={{ listStyleType: "square" }}>Timing verification</li>
                <li style={{ listStyleType: "square" }}>Measurement review</li>
                <li style={{ listStyleType: "square" }}>Witness validation</li>
                <li style={{ listStyleType: "square" }}>Rule compliance checks</li>
              </ul>
            </div>

            {/* WHY VERIFICATION MATTERS */}
            <div id="why-it-matters" style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", background: "rgba(255,106,0,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={24} color="#FF6A00" />
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase" }}>Why Verification Matters</h3>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", marginBottom: "24px" }}>
                Without strict verification protocols, records could be inaccurate, manipulated, or fraudulent. Verification actively protects:
              </p>
              <ul style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingLeft: "20px", color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
                <li>• Competitors and fair play</li>
                <li>• Official global rankings</li>
                <li>• Integrity of records</li>
                <li>• Live championship events</li>
                <li>• Worldwide community trust</li>
                <li>• Historical accuracy</li>
              </ul>
            </div>

            {/* HOW THE PROCESS WORKS (STEPS) */}
            <div id="how-it-works" style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px" }}>
              <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase", marginBottom: "32px" }}>How the Process Works</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {steps.map((st, idx) => (
                  <div key={idx} style={{ position: "relative", paddingLeft: "36px", borderLeft: "2px solid rgba(255,106,0,0.2)" }}>
                    <div style={{ position: "absolute", left: "-9px", top: "0", width: "16px", height: "16px", borderRadius: "50%", background: "#FF6A00", border: "4px solid #161616" }}></div>
                    <span style={{ fontSize: "11px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>{st.num}</span>
                    <h4 style={{ fontSize: "16px", fontWeight: "900", color: "white", marginBottom: "8px", textTransform: "uppercase" }}>{st.title}</h4>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5" }}>{st.desc}</p>
                    
                    {idx === 2 && (
                      <div style={{ background: "linear-gradient(135deg, rgba(255,106,0,0.1) 0%, rgba(0,0,0,0) 100%)", border: "1px solid #FF6A00", borderRadius: "24px", padding: "28px", marginTop: "24px" }}>
                        <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", marginBottom: "16px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "950", letterSpacing: "0.05em", color: "#FF6A00" }}>AUTHENTICITY PROTOCOL v4.2</span>
                          <span style={{ background: "rgba(255,106,0,0.2)", color: "#FF6A00", padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "900" }}>ACTIVE ENGINE</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", lineHeight: "1.6", marginBottom: "0" }}>
                          Our advanced AI Motion Verification System analyzes over 420 unique body and movement points per second to help ensure every submission meets official AMPEX World Records standards. Using real-time motion tracking, movement pattern analysis, timing validation, and video integrity scanning, the system compares each performance against verified benchmark data.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* VIDEO & WITNESS STANDARDS */}
            <div id="standards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <Video size={20} color="#FF6A00" />
                  <h4 style={{ fontSize: "16px", fontWeight: "900", textTransform: "uppercase" }}>Video Evidence Standards</h4>
                </div>
                <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "16px", fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: "1.5" }}>
                  <li>• Show the full attempt clearly</li>
                  <li>• Include the competitor in-frame at all times</li>
                  <li>• Avoid cuts or excessive edits</li>
                  <li>• Show timers or measurements clearly</li>
                  <li>• Supported formats: MP4, MOV, YouTube</li>
                </ul>
              </div>

              <div style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <Users size={20} color="#FF6A00" />
                  <h4 style={{ fontSize: "16px", fontWeight: "900", textTransform: "uppercase" }}>Witness & Measurement</h4>
                </div>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5", marginBottom: "16px" }}>
                  Certain record categories require extra verification layers to support unedited videos:
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "16px", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                  <li>• Independent certified witnesses</li>
                  <li>• Calibrated measurement tools</li>
                  <li>• Certified judge verifications</li>
                  <li>• Event organizer confirmation details</li>
                </ul>
              </div>
            </div>

            {/* FRAUD PREVENTION SYSTEM */}
            <div id="fraud-prevention" style={{ background: "rgba(239, 68, 68, 0.03)", borderRadius: "32px", border: "1px solid rgba(239, 68, 68, 0.15)", padding: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={24} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase", color: "#ef4444" }}>Fraud Prevention System</h3>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", marginBottom: "20px" }}>
                The Verification Protocol actively works to detect edited footage, fake submissions, altered timing, false measurements, AI-generated manipulations, unauthorized assistance, or duplicate attempts.
              </p>
              <div style={{ background: "rgba(239,68,68,0.05)", borderLeft: "4px solid #ef4444", padding: "16px", borderRadius: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)", lineHeight: "1.5" }}>
                <strong>Strict Penalty Policy:</strong> Fraudulent activity will result in immediate attempt denial, total record removal, account suspensions, and permanent banning from AMPEX World Records.
              </div>
            </div>

            {/* LIVE EVENT VERIFICATION & APPEALS */}
            <div id="live-verification" style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", background: "rgba(255, 106, 0, 0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={24} color="#FF6A00" />
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase" }}>Live Event Verification</h3>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", marginBottom: "24px" }}>
                During official live spectator events, verification occurs in real-time utilizing certified judges, multi-camera recorders, timing equipment, technical measurement crews, and on-site audience validations.
              </p>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "24px", borderRadius: "20px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "900", color: "#FF6A00", marginBottom: "8px", textTransform: "uppercase" }}>Official Appeals Process</h4>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5" }}>
                  If a competitor disagrees with an outcome, they can submit an official appeal through the Appeals Department for secondary review.
                </p>
              </div>
            </div>

          </div>

          {/* COMMITMENT & FINAL MESSAGE */}
          <div style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg, rgba(255,106,0,0.1) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid #FF6A00", borderRadius: "32px", padding: "40px", textAlign: "center", marginTop: "40px" }}>
            <h3 style={{ fontSize: "28px", fontWeight: "950", textTransform: "uppercase", marginBottom: "12px", color: "#FF6A00" }}>Our Commitment</h3>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", maxWidth: "650px", margin: "0 auto 24px", lineHeight: "1.6" }}>
              AMPEX World Records is committed to fair verification, honest competition, accurate results, transparent review systems, and absolute respect for every competitor.
            </p>
            <h4 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "white", textTransform: "uppercase", marginBottom: "32px" }}>
              Verification is what turns an attempt into an official achievement. Break Limits. Make History. Become Legendary.
            </h4>
            <Link to="/verify" style={{ textDecoration: "none" }}>
              <button style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", transition: "0.3s" }}>
                RETURN TO SUBMISSION
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

export default VerificationProtocolLearnMore;
