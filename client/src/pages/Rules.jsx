import React, { useState } from "react";
import { 
  Shield, 
  Gavel, 
  Scale, 
  Video, 
  Camera, 
  Users, 
  Timer, 
  AlertTriangle, 
  Globe, 
  Settings, 
  Slash, 
  UserCheck, 
  XCircle, 
  RotateCcw, 
  CheckCircle2,
  Search,
  ArrowRight,
  Mail,
  Activity,
  Zap,
  Info
} from "lucide-react";
import { motion } from "motion/react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

const Rules = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const sections = [
    {
      id: "01",
      title: "1. Purpose of Adjudication",
      scope: "01 / MISSION",
      icon: <Gavel size={24} color="#FF6A00" />,
      content: "Adjudication is the official judging and verification process used to determine whether a record attempt meets all required standards. It ensures fair competition, accurate measurements, rule compliance, authentic evidence, competitor safety, and the integrity of all global records.",
      fullWidth: true
    },
    {
      id: "02",
      title: "2. Official Authority",
      scope: "02 / GOVERNANCE",
      icon: <Shield size={24} color="#FF6A00" />,
      content: "Only authorized representatives of Rogue World Records may officially verify or adjudicate records. This includes certified adjudicators, senior verification staff, official judges, event referees, technical reviewers, and category specialists.",
    },
    {
      id: "03",
      title: "3. General Rules",
      scope: "03 / CORE STANDARDS",
      icon: <CheckCircle2 size={24} color="#FF6A00" />,
      content: "All record attempts must follow official category rules, be completed honestly and fairly, avoid cheating or manipulation, be safely conducted, use approved equipment, and be fully documented with verifiable evidence.",
    },
    {
      id: "04",
      title: "4. Evidence Requirements",
      scope: "04 / DOCUMENTATION",
      icon: <Camera size={24} color="#FF6A00" />,
      content: "Competitors must provide continuous video footage, high-resolution photographs, witness statements, official timing documentation, and measurement verification. The adjudication team may request additional evidence at any time to verify integrity.",
    },
    {
      id: "05",
      title: "5. Video Recording Standards",
      scope: "05 / VISUAL PROOF",
      icon: <Video size={24} color="#FF6A00" />,
      content: "Video evidence should clearly show the competitor, capture the full attempt without obstruction, include start and finish points, and avoid excessive editing or cuts. Edited or manipulated footage results in immediate rejection.",
    },
    {
      id: "06",
      title: "6. Witness Requirements",
      scope: "06 / VERIFICATION",
      icon: <Users size={24} color="#FF6A00" />,
      content: "Independent witnesses should be adults with no direct conflict of interest. They must observe the full attempt and sign official witness statements truthfully. False statements result in permanent platform bans.",
    },
    {
      id: "07",
      title: "7. Timing & Measurement",
      scope: "07 / PRECISION",
      icon: <Timer size={24} color="#FF6A00" />,
      content: "Official timing and measurements must use accurate tools, follow category-specific guidelines, and be visible in video evidence. The team reserves the right to recalculate measurements independently using biometric software.",
    },
    {
      id: "08",
      title: "8. Safety Rules",
      scope: "08 / PROTOCOL",
      icon: <AlertTriangle size={24} color="#FF6A00" />,
      content: "Safety is mandatory. Attempts may be denied if unsafe conditions exist, illegal activities are involved, or public safety is at risk. Rogue World Records may reject any challenge considered excessively dangerous.",
      fullWidth: true
    },
    {
      id: "09",
      title: "9. Live Event Adjudication",
      scope: "09 / ON-SITE",
      icon: <Activity size={24} color="#FF6A00" />,
      content: "During live events, official judges oversee attempts in person. Decisions made by event staff are considered official. Live adjudication may include audience verification, multiple camera angles, and certified timing systems.",
    },
    {
      id: "10",
      title: "10. Equipment Rules",
      scope: "10 / TECHNICAL",
      icon: <Settings size={24} color="#FF6A00" />,
      content: "Equipment must not provide unfair advantages, must comply with safety standards, and may be inspected or calibrated before and after attempts. Unauthorized modifications result in immediate disqualification.",
    },
    {
      id: "11",
      title: "11. Fraud & Cheating Policy",
      scope: "11 / INTEGRITY",
      icon: <Slash size={24} color="#FF6A00" />,
      content: "Edited evidence, altered timing, hidden assistance, and impersonation are strictly prohibited. Fraudulent activity results in immediate disqualification, record removal, and permanent account bans.",
      fullWidth: true
    },
    {
      id: "12",
      title: "12. Judge Conduct",
      scope: "12 / ETHICS",
      icon: <UserCheck size={24} color="#FF6A00" />,
      content: "Official judges and adjudicators must remain professional, unbiased, and apply rules fairly. They are expected to avoid conflicts of interest and prioritize competitor safety above all else.",
    },
    {
      id: "13",
      title: "13. Disqualification Rules",
      scope: "13 / ENFORCEMENT",
      icon: <XCircle size={24} color="#FF6A00" />,
      content: "Disqualification may occur for rule violations, incomplete attempts, dangerous behavior, or unsportsmanlike conduct. Decisions may be reviewed through the official appeals process.",
    },
    {
      id: "14",
      title: "14. Appeals Process",
      scope: "14 / RECONSIDERATION",
      icon: <RotateCcw size={24} color="#FF6A00" />,
      content: "Competitors may submit appeals if they believe a judging error occurred or evidence was overlooked. Appeals must follow official submission procedures and strict deadlines for secondary review.",
    },
    {
      id: "15",
      title: "15. Final Decision Authority",
      scope: "15 / BINDING",
      icon: <Zap size={24} color="#FF6A00" />,
      content: "Rogue World Records reserves the right to approve or deny submissions, modify procedures, and revoke records if violations are discovered. Final decisions made after appeal are considered binding.",
    },
    {
      id: "16",
      title: "16. Sportsmanship",
      scope: "16 / COMMUNITY",
      icon: <Users size={24} color="#FF6A00" />,
      content: "Competitors are expected to respect staff, fellow athletes, and promote positive competition. Harassment, threats, or abusive behavior result in immediate termination of account access.",
      fullWidth: true
    },
    {
      id: "17",
      title: "17. Processing Time",
      scope: "17 / LOGISTICS",
      icon: <Info size={24} color="#FF6A00" />,
      content: "Review times vary based on category complexity, evidence volume, and the number of active submissions. Complex cases involving technical measurement may require extended review periods.",
      fullWidth: true
    }
  ];

  const filteredSections = sections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.scope.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />

        {/* HERO SECTION */}
        <section style={{ padding: "220px 5% 100px", position: "relative", overflow: "hidden" }}>
          {/* Background Decorative Elements */}
          <div style={{ position: "absolute", top: "10%", right: "5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(255,106,0,0.08) 0%, transparent 70%)", zIndex: 0 }}></div>
          <div style={{ position: "absolute", bottom: "0", left: "0", width: "100%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }}></div>

          <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: "40px" }} style={{ height: "2px", background: "#FF6A00" }} />
              <span style={{ fontSize: "14px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.2em", textTransform: "uppercase" }}>ADJUDICATION PROTOCOLS</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "40px" }}>
              <div style={{ flex: "1", minWidth: "300px" }}>
                <h1 style={{ fontSize: "clamp(40px, 8vw, 100px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.8" }}>
                  <ScrollReveal>ADJUDICATION</ScrollReveal><br />
                  <span style={{ color: "#FF6A00" }}><ScrollReveal>RULES</ScrollReveal></span>
                </h1>
                <p style={{ marginTop: "40px", fontSize: "18px", color: "rgba(255,255,255,0.5)", maxWidth: "600px", lineHeight: "1.6" }}>
                  The official judging and verification standards of Rogue World Records. Ensuring every achievement is authenticated with absolute integrity.
                </p>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px", minWidth: "300px" }}>
                <div style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>JUDGING STATUS</div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "8px", height: "8px", background: "#FF6A00", borderRadius: "50%", boxShadow: "0 0 10px #FF6A00" }}></div>
                  <span style={{ fontSize: "16px", fontWeight: "800" }}>LIVE STANDARDS</span>
                </div>
                <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>LAST REVISION</div>
                  <div style={{ fontSize: "14px", fontWeight: "700" }}>MAY 2026 / V4.0</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH BAR */}
        <section style={{ padding: "0 5% 60px", position: "relative", zIndex: 10 }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: "24px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} size={20} />
              <input 
                type="text" 
                placeholder="SEARCH JUDGING STANDARDS..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: "100%", 
                  background: "rgba(255,255,255,0.03)", 
                  border: "1px solid rgba(255,255,255,0.08)", 
                  borderRadius: "100px", 
                  padding: "24px 24px 24px 64px", 
                  color: "white", 
                  fontSize: "14px", 
                  fontWeight: "700",
                  outline: "none",
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#FF6A00"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
          </div>
        </section>

        {/* CONTENT GRID */}
        <section style={{ padding: "60px 5% 120px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
            
            {filteredSections.map((section) => (
              <ScrollReveal key={section.id}>
                <div style={{ 
                  gridColumn: section.fullWidth ? "1 / -1" : "auto", 
                  background: "rgba(255,255,255,0.02)", 
                  border: "1px solid rgba(255,255,255,0.05)", 
                  borderRadius: "32px", 
                  padding: "48px",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                  height: "100%"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "rgba(255,106,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                }}>
                  <div style={{ position: "absolute", top: "-20px", right: "-20px", fontSize: "120px", fontWeight: "950", color: "rgba(255,106,0,0.03)", pointerEvents: "none", select: "none" }}>{section.id}</div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: "11px", fontWeight: "900", color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.2em" }}>{section.scope}</div>
                    {section.icon}
                  </div>
                  
                  <h2 style={{ fontSize: "28px", fontWeight: "950", textTransform: "uppercase", marginBottom: "20px", position: "relative", zIndex: 1 }}>{section.title}</h2>
                  <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.6)", lineHeight: "1.8", position: "relative", zIndex: 1 }}>
                    {section.content}
                  </p>
                </div>
              </ScrollReveal>
            ))}

            {filteredSections.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "100px 0" }}>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.4)" }}>NO JUDGING CRITERIA MATCHING YOUR SEARCH.</p>
              </div>
            )}
          </div>
        </section>

        {/* TRUST CTA */}
        <section style={{ padding: "0 5% 120px" }}>
          <ScrollReveal>
            <div className="orange-cta" style={{ maxWidth: "1200px", margin: "0 auto", borderRadius: "48px" }}>
              <div className="orange-cta-bg" />
              <div className="orange-cta-grid" />
              <div className="orange-cta-glow" />

              <div className="orange-cta-content" style={{ textAlign: "center", padding: "80px 40px" }}>
                <Scale size={64} color="white" style={{ marginBottom: "32px", margin: "0 auto 32px", opacity: 0.8 }} />
                <h2 className="orange-cta-title" style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: "950", textTransform: "uppercase", marginBottom: "24px", color: "white" }}>
                  INTEGRITY IN <br /><span className="orange-cta-highlight">EVERY ATTEMPT</span>
                </h2>
                <p className="orange-cta-subtitle" style={{ maxWidth: "800px", margin: "0 auto 40px", fontSize: "18px", color: "rgba(255,255,255,0.9)", lineHeight: "1.6" }}>
                  Rogue World Records is committed to creating a fair, transparent, exciting, and respected platform where competitors earns official recognition for their achievements.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap", marginBottom: "48px" }}>
                  <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "100px", padding: "12px 28px", fontSize: "11px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    FAIRNESS
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "100px", padding: "12px 28px", fontSize: "11px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    ACCURACY
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "100px", padding: "12px 28px", fontSize: "11px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    INTEGRITY
                  </div>
                </div>
                
                <div style={{ fontSize: "20px", fontWeight: "950", color: "white", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Break Limits. Make History. Become Legendary.
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Rules;
