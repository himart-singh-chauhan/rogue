import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  HelpCircle, 
  Settings, 
  Grid, 
  Globe, 
  MousePointer, 
  Database, 
  RefreshCw, 
  Mail,
  Search,
  ArrowRight,
  ChevronRight,
  Eye,
  Lock,
  Zap
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

const Cookies = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const sections = [
    {
      id: "01",
      title: "1. What Are Cookies?",
      scope: "01 / DEFINITION",
      icon: <HelpCircle size={24} color="#FF6A00" />,
      content: "Cookies are small text files stored on your computer, smartphone, tablet, or device when you visit a website. Cookies help websites remember user preferences, improve performance, enhance security, analyze website traffic, and personalize user experiences. Cookies do not usually contain personally identifiable information by themselves, but they may be linked to account information.",
      fullWidth: true
    },
    {
      id: "02",
      title: "2. How We Use Cookies",
      scope: "02 / USAGE",
      icon: <Settings size={24} color="#FF6A00" />,
      content: "AMPEX World Records uses cookies to keep users logged into accounts, remember user settings and preferences, improve website speed and functionality, analyze visitor activity and traffic, protect against fraud and unauthorized access, track competition participation and sessions, personalize content and recommendations, and improve customer experience.",
    },
    {
      id: "03",
      title: "3. Types of Cookies We Use",
      scope: "03 / CATEGORIES",
      icon: <Grid size={24} color="#FF6A00" />,
      content: "We use Essential Cookies (necessary for the website to function properly), Performance & Analytics Cookies (help us understand how visitors use the platform), Functional Cookies (remember user preferences such as language and region), and Marketing & Advertising Cookies (used to display relevant advertisements and measure marketing performance).",
    },
    {
      id: "04",
      title: "4. Third-Party Cookies",
      scope: "04 / EXTERNAL",
      icon: <Globe size={24} color="#FF6A00" />,
      content: "Some cookies may be placed by third-party services integrated into the platform, including payment processors, social media platforms, video hosting services, analytics providers, and advertising networks. AMPEX World Records does not control third-party cookies and recommends reviewing their individual privacy and cookie policies.",
    },
    {
      id: "05",
      title: "5. Managing Cookies",
      scope: "05 / CONTROL",
      icon: <MousePointer size={24} color="#FF6A00" />,
      content: "Users may control or disable cookies through browser settings. Most browsers allow users to delete, block, or restrict certain cookie types, and receive notifications when cookies are used. Please note: Disabling cookies may affect website functionality and certain features may not operate correctly.",
    },
    {
      id: "06",
      title: "6. Data Collected Through Cookies",
      scope: "06 / DATA POINTS",
      icon: <Database size={24} color="#FF6A00" />,
      content: "Cookies may collect: IP address, browser type, device information, website usage behavior, login session details, referral sources, and interaction history. This information is generally used for operational, security, and analytical purposes.",
    },
    {
      id: "07",
      title: "7. Security & Fraud Prevention",
      scope: "07 / PROTECTION",
      icon: <Shield size={24} color="#FF6A00" />,
      content: "Cookies may help us detect suspicious activity, prevent unauthorized account access, maintain platform integrity, and protect user accounts and submissions.",
    },
    {
      id: "08",
      title: "8. Changes to This Cookie Policy",
      scope: "08 / UPDATES",
      icon: <RefreshCw size={24} color="#FF6A00" />,
      content: "AMPEX World Records reserves the right to update this Cookie Policy at any time. Updated versions will be posted on the platform with revised effective dates. Continued use of the platform after updates constitutes acceptance of the revised policy.",
      fullWidth: true
    },
    {
      id: "09",
      title: "9. Contact Information",
      scope: "09 / SUPPORT",
      icon: <Mail size={24} color="#FF6A00" />,
      content: "For questions regarding this Cookie Policy, please contact: Privacy & Compliance Department at ampexworldrecords@gmail.com or General Support at ampexworldrecords@gmail.com.",
      fullWidth: true
    }
  ];

  const filteredSections = sections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />

        {/* HERO SECTION */}
        <section style={{ padding: "220px 5% 100px", position: "relative", overflow: "hidden" }}>
          {/* Background Elements */}
          <div style={{ position: "absolute", top: "0", right: "0", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(255,106,0,0.05) 0%, transparent 70%)", zIndex: 0 }}></div>
          <div style={{ position: "absolute", top: "20%", left: "-10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(255,106,0,0.03) 0%, transparent 70%)", zIndex: 0 }}></div>

          <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "40px" }}
                style={{ height: "2px", background: "#FF6A00" }}
              />
              <span style={{ fontSize: "14px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.2em", textTransform: "uppercase" }}>PRIVACY & TRANSPARENCY</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "40px" }}>
              <div style={{ flex: "1", minWidth: "300px" }}>
                <h1 style={{ fontSize: "clamp(40px, 8vw, 100px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.8" }}>
                  <ScrollReveal>COOKIE</ScrollReveal><br />
                  <span style={{ color: "#FF6A00" }}><ScrollReveal>POLICY</ScrollReveal></span>
                </h1>
                <p style={{ marginTop: "40px", fontSize: "18px", color: "rgba(255,255,255,0.5)", maxWidth: "500px", lineHeight: "1.6" }}>
                  AMPEX World Records uses cookies to optimize your experience, maintain security, and analyze platform performance.
                </p>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px", minWidth: "300px" }}>
                <div style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>DOCUMENT STATUS</div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "8px", height: "8px", background: "#4ADE80", borderRadius: "50%", boxShadow: "0 0 10px #4ADE80" }}></div>
                  <span style={{ fontSize: "16px", fontWeight: "800" }}>ACTIVE PROTOCOL</span>
                </div>
                <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>EFFECTIVE DATE</div>
                  <div style={{ fontSize: "14px", fontWeight: "700" }}>MAY 14, 2026</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH & FILTERS */}
        <section style={{ padding: "0 5% 60px", position: "relative", zIndex: 10 }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: "24px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} size={20} />
              <input 
                type="text" 
                placeholder="SEARCH COOKIE PROTOCOLS..." 
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
            
            {filteredSections.map((section, idx) => (
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
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.4)" }}>NO PROTOCOLS MATCHING YOUR SEARCH.</p>
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
                <Shield size={64} color="white" style={{ marginBottom: "32px", margin: "0 auto 32px", opacity: 0.8 }} />
                <h2 className="orange-cta-title" style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: "950", textTransform: "uppercase", marginBottom: "24px", color: "white" }}>
                  YOUR SECURITY IS <br /><span className="orange-cta-highlight">OUR COMMITMENT</span>
                </h2>
                <p className="orange-cta-subtitle" style={{ maxWidth: "800px", margin: "0 auto 40px", fontSize: "18px", color: "rgba(255,255,255,0.9)", lineHeight: "1.6" }}>
                  AMPEX World Records is committed to transparency, security, and providing users with a safe and reliable online experience.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap", marginBottom: "48px" }}>
                  <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "100px", padding: "12px 28px", fontSize: "11px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    TRANSPARENCY
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "100px", padding: "12px 28px", fontSize: "11px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    SECURITY
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "100px", padding: "12px 28px", fontSize: "11px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    RELIABILITY
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

export default Cookies;
