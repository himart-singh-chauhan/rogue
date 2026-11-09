import React from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, 
  Camera, 
  Zap, 
  ArrowRight,
  ChevronRight,
  Shield,
  Search,
  CheckCircle2,
  Trophy,
  History,
  Lightbulb,
  Layers,
  HelpCircle,
  FileText
} from "lucide-react";
import { motion } from "motion/react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import GlowCard from "../components/GlowCard";

const VerificationProcess = () => {
  const steps = [
    { step: "01", title: "Create Account", desc: "Before submitting a record attempt, competitors must create an official account on the AMPEX World Records platform. Your account allows you to submit attempts, upload evidence, and track verification progress." },
    { step: "02", title: "Choose Category", desc: "Applicants must select the correct category for their attempt (Athletics, Strength, Gaming, etc.). If a category does not exist, users may request approval for a new world record category." },
    { step: "03", title: "Review Official Rules", desc: "Before attempting a record, competitors must carefully read all official rules including time limits, equipment requirements, safety standards, and witness requirements." },
    { step: "04", title: "Complete Attempt", desc: "The competitor performs the challenge while following all required rules and safety guidelines. Attempts may require continuous video recording, independent witnesses, and official timers." },
    { step: "05", title: "Record Evidence", desc: "Evidence is the most important part. Collect high-quality video footage, clear photographs, witness statements, and official measurements or timing documentation." },
    { step: "06", title: "Submit Attempt", desc: "Upload all required materials through the official portal. Submissions include the form, videos, photos, and supporting docs (MP4, MOV, JPG, PNG, PDF)." },
    { step: "07", title: "Initial Review", desc: "The verification team performs an initial inspection to ensure all required materials were submitted, videos function properly, and evidence is clear and readable." },
    { step: "08", title: "Official Review", desc: "After the initial review, staff analyze footage frame-by-frame, confirm measurements and timing, review witness statements, and consult category specialists." },
    { step: "09", title: "Decision Outcome", desc: "After review, decisions are issued as Approved (verified), Denied (did not meet requirements), Pending Info (missing evidence), or Under Extended Review." },
    { step: "10", title: "Recognition", desc: "Approved record holders receive official digital and printed certificates, public listing on the website, ranking placement, and a verification badge." }
  ];

  const recordTypes = [
    "Strength", "Endurance", "Gaming", "Athletics", "Balance", 
    "Skills", "Mind & Memory", "Entertainment", "Action Sports", "Creative Challenges"
  ];

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />

        {/* HERO SECTION */}
        <section style={{ position: "relative", padding: "180px 5% 100px", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "1000px", height: "1000px", background: "radial-gradient(circle, rgba(255,106,0,0.1) 0%, transparent 70%)", zIndex: 0 }} />
          
          <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <ScrollReveal>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
                <ShieldCheck size={20} color="#FF6A00" />
                <span style={{ fontSize: "14px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.2em", textTransform: "uppercase" }}>Official Protocol</span>
              </div>
              <h1 style={{ fontSize: "clamp(40px, 7vw, 90px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "1", marginBottom: "32px", color: "white" }}>
                AMPEX WORLD <br /> <span style={{ color: "#FF6A00" }}>VERIFICATION</span>
              </h1>
              <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.5)", maxWidth: "800px", lineHeight: "1.6", margin: "0 auto 48px" }}>
                At AMPEX World Records, every world record attempt goes through a detailed verification process designed to maintain fairness, accuracy, safety, and integrity.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* PROCESS GRID */}
        <section style={{ padding: "0 5% 120px", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {steps.map((step, idx) => (
              <ScrollReveal key={idx}>
                <div style={{ 
                  background: "rgba(255,255,255,0.02)", 
                  border: "1px solid rgba(255,255,255,0.05)", 
                  borderRadius: "24px", 
                  padding: "40px",
                  position: "relative",
                  height: "100%",
                  overflow: "hidden"
                }}>
                  <div style={{ position: "absolute", right: "-10px", top: "-10px", fontSize: "80px", fontWeight: "950", color: "rgba(255,106,0,0.04)", userSelect: "none" }}>{step.step}</div>
                  <div style={{ fontSize: "12px", fontWeight: "900", color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px", position: "relative", zIndex: 2 }}>STEP {step.step}</div>
                  <h3 style={{ fontSize: "22px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px", position: "relative", zIndex: 2 }}>{step.title}</h3>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", lineHeight: "1.7", position: "relative", zIndex: 2 }}>
                    {step.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* TYPES OF RECORDS & PROPOSALS */}
        <section style={{ padding: "100px 5%", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "40px" }}>
              
              {/* Types of Records */}
              <ScrollReveal>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "40px", padding: "60px", height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
                    <Layers size={32} color="#FF6A00" />
                    <h2 style={{ fontSize: "32px", fontWeight: "950", textTransform: "uppercase" }}>TYPES OF RECORDS</h2>
                  </div>
                  <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", lineHeight: "1.7", marginBottom: "32px" }}>
                    You can attempt records in a wide variety of official disciplines. Our categories include:
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {recordTypes.map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "700" }}>
                        <CheckCircle2 size={16} color="#FF6A00" /> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Proposals & New Categories */}
              <ScrollReveal>
                <div style={{ background: "rgba(255,106,0,0.05)", border: "1px solid rgba(255,106,0,0.1)", borderRadius: "40px", padding: "60px", height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
                    <Lightbulb size={32} color="#FF6A00" />
                    <h2 style={{ fontSize: "32px", fontWeight: "950", textTransform: "uppercase" }}>NEW PROPOSALS</h2>
                  </div>
                  <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", lineHeight: "1.7", marginBottom: "24px" }}>
                    Have a unique idea that doesn't fit our current categories? We allow users to submit proposals for entirely new world record categories.
                  </p>
                  <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", lineHeight: "1.7", marginBottom: "32px" }}>
                    Every proposal is reviewed by our category development team to ensure it meets our standards for measurability, consistency, and fairness.
                  </p>
                  <Link to="/contact" style={{ textDecoration: "none" }}>
                    <button style={{ background: "#FF6A00", color: "white", padding: "16px 32px", borderRadius: "100px", border: "none", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
                      SUBMIT A PROPOSAL <ArrowRight size={18} />
                    </button>
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* SPECIAL POLICIES */}
        <section style={{ padding: "100px 5%", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "40px" }}>
              
              {/* Live Event Verification */}
              <ScrollReveal>
                <div style={{ background: "rgba(255,106,0,0.05)", border: "1px solid rgba(255,106,0,0.1)", borderRadius: "40px", padding: "60px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
                    <Search size={32} color="#FF6A00" />
                    <h2 style={{ fontSize: "32px", fontWeight: "950", textTransform: "uppercase" }}>LIVE EVENT VERIFICATION</h2>
                  </div>
                  <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", lineHeight: "1.7", marginBottom: "24px" }}>
                    Certain competitions include official on-site judges and live verification teams. This includes:
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {["Certified Judges", "Official Timers", "Real-time Measurements", "Audience Verification", "Live Video Documentation"].map(item => (
                      <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "700" }}>
                        <CheckCircle2 size={16} color="#FF6A00" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>

              {/* Safety & Fairness */}
              <ScrollReveal>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "40px", padding: "60px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
                    <Shield size={32} color="#FF6A00" />
                    <h2 style={{ fontSize: "32px", fontWeight: "950", textTransform: "uppercase" }}>SAFETY & FAIRNESS</h2>
                  </div>
                  <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", lineHeight: "1.7", marginBottom: "24px" }}>
                    AMPEX World Records prioritizes safety and fairness above all else. Immediate disqualification results from:
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {["Dangerous Behavior", "Fraudulent Evidence", "Edited Footage", "Rule Violations", "Unsportsmanlike Conduct", "Unsafe Environments"].map(item => (
                      <span key={item} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", textTransform: "uppercase" }}>{item}</span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Processing Times & Appeals */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", marginTop: "40px" }}>
               <ScrollReveal>
                 <div style={{ padding: "40px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", height: "100%" }}>
                   <h3 style={{ fontSize: "18px", fontWeight: "900", textTransform: "uppercase", marginBottom: "16px", color: "#FF6A00" }}>Processing Times</h3>
                   <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>
                     Verification times vary depending on complexity, evidence volume, and category. Some reviewed in days, others require extended periods.
                   </p>
                 </div>
               </ScrollReveal>
               <ScrollReveal>
                 <div style={{ padding: "40px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", height: "100%" }}>
                   <h3 style={{ fontSize: "18px", fontWeight: "900", textTransform: "uppercase", marginBottom: "16px", color: "#FF6A00" }}>Appeals Process</h3>
                   <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>
                     If a submission is denied, competitors may have the right to file an official appeal for secondary review through the Appeals Department.
                   </p>
                 </div>
               </ScrollReveal>
               <ScrollReveal>
                 <div style={{ padding: "40px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", height: "100%" }}>
                   <h3 style={{ fontSize: "18px", fontWeight: "900", textTransform: "uppercase", marginBottom: "16px", color: "#FF6A00" }}>Our Commitment</h3>
                   <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>
                     We are committed to Transparency, Accuracy, Fair Competition, Professional Verification, and Respect for all competitors.
                   </p>
                 </div>
               </ScrollReveal>
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section style={{ padding: "120px 5% 160px" }}>
          <div className="orange-cta" style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 40px", borderRadius: "40px" }}>
            <div className="orange-cta-bg" />
            <div className="orange-cta-grid" />
            <div className="orange-cta-glow" />

            <div className="orange-cta-content" style={{ textAlign: "center" }}>
              <h2 className="orange-cta-title" style={{ fontSize: "64px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "-0.03em" }}>
                Break Limits. <span className="orange-cta-highlight">Make History.</span>
              </h2>
              <p className="orange-cta-subtitle" style={{ maxWidth: "600px", margin: "0 auto 40px", fontSize: "18px", color: "rgba(255,255,255,0.8)" }}>
                Become Legendary. Every verified achievement represents dedication, discipline, and determination — and we take that responsibility seriously.
              </p>
              
              <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
                <Link to="/verify" style={{ textDecoration: "none" }}>
                  <button style={{ 
                    background: "#FFFFFF", 
                    color: "#FF6A00", 
                    border: "none", 
                    borderRadius: "100px", 
                    padding: "20px 48px", 
                    fontSize: "15px", 
                    fontWeight: "900", 
                    textTransform: "uppercase", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                    position: "relative",
                    zIndex: 5
                  }}>
                    START YOUR SUBMISSION <ArrowRight size={20} />
                  </button>
                </Link>

                <Link to="/appeals" style={{ textDecoration: "none" }}>
                  <button style={{ 
                    background: "transparent", 
                    color: "white", 
                    border: "1px solid rgba(255,255,255,0.2)", 
                    borderRadius: "100px", 
                    padding: "20px 48px", 
                    fontSize: "15px", 
                    fontWeight: "900", 
                    textTransform: "uppercase", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px",
                    position: "relative",
                    zIndex: 5
                  }}>
                    APPEAL A DECISION <FileText size={20} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default VerificationProcess;
