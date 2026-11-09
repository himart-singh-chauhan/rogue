import React, { useState } from "react";
import { 
  Shield, 
  Eye, 
  Lock, 
  UserCircle, 
  ArrowRight, 
  Download, 
  Trash2, 
  Search,
  CheckCircle,
  Activity,
  Database,
  Mail,
  RefreshCw,
  Globe,
  FileText
} from "lucide-react";
import { motion } from "motion/react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

const Privacy = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const sections = [
    {
      id: "01",
      title: "1. Information We Collect",
      scope: "01 / COLLECTION",
      icon: <Database size={24} color="#FF6A00" />,
      content: "We collect various types of information including Personal Information (Name, email, phone, DOB, address, ID), Account Information (Credentials, history, rankings), Submission Information (Videos, photos, timing/measurement docs), and Technical Information (IP address, browser type, device info, cookies).",
      fullWidth: true
    },
    {
      id: "02",
      title: "2. How We Use Information",
      scope: "02 / PROCESSING",
      icon: <Activity size={24} color="#FF6A00" />,
      content: "Information is used to manage accounts, verify record submissions, process memberships, provide support, improve performance, communicate updates, and prevent fraud. We also display approved public records and promote achievements.",
    },
    {
      id: "03",
      title: "3. Public Information",
      scope: "03 / VISIBILITY",
      icon: <Eye size={24} color="#FF6A00" />,
      content: "When records are approved, certain info becomes public: username, record title, result, and associated media. Users may have options to control certain public profile settings.",
    },
    {
      id: "04",
      title: "4. Cookies & Tracking",
      scope: "04 / ANALYTICS",
      icon: <RefreshCw size={24} color="#FF6A00" />,
      content: "We use cookies to improve experience, save preferences, analyze traffic, and enhance security. You can disable cookies in your browser settings, though some features may be limited.",
    },
    {
      id: "05",
      title: "5. Data Protection",
      scope: "05 / SECURITY",
      icon: <Lock size={24} color="#FF6A00" />,
      content: "We implement reasonable security measures to protect data from unauthorized access, breaches, or misuse. Note that no internet system is 100% secure.",
    },
    {
      id: "06",
      title: "6. Sharing Information",
      scope: "06 / DISTRIBUTION",
      icon: <Globe size={24} color="#FF6A00" />,
      content: "We do not sell personal info. Data is shared only with verification staff, payment providers, trusted service partners, or when legally required to protect platform integrity.",
    },
    {
      id: "07",
      title: "7. Children’s Privacy",
      scope: "07 / PROTECTION",
      icon: <Shield size={24} color="#FF6A00" />,
      content: "Users under 18 require parental or guardian consent for certain services. We encourage parents to supervise online activity and manage their child's participation.",
    },
    {
      id: "08",
      title: "8. User Rights",
      scope: "08 / CONTROL",
      icon: <UserCircle size={24} color="#FF6A00" />,
      content: "You may have rights to access, correct, delete, or withdraw consent for your data. Requests can be submitted through our customer support channels.",
    },
    {
      id: "09",
      title: "9. Retention of Data",
      scope: "09 / ARCHIVAL",
      icon: <Database size={24} color="#FF6A00" />,
      content: "We retain data for verification records, legal compliance, security, and historical rankings. Retention periods vary based on the type of information and operational needs.",
    },
    {
      id: "10",
      title: "10. Third-Party Services",
      scope: "10 / EXTERNAL",
      icon: <RefreshCw size={24} color="#FF6A00" />,
      content: "Our platform may link to third-party services. We are not responsible for their privacy practices. Please review third-party policies independently.",
    },
    {
      id: "11",
      title: "11. Media & Promotion",
      scope: "11 / MARKETING",
      icon: <Activity size={24} color="#FF6A00" />,
      content: "By submitting records, you grant permission for promotional use of approved content in social media, marketing campaigns, and event coverage.",
    },
    {
      id: "12",
      title: "12. Fraud Prevention",
      scope: "12 / INTEGRITY",
      icon: <Shield size={24} color="#FF6A00" />,
      content: "We review submissions and activity to detect fraud, prevent cheating, and enforce rules. Fraudulent activity results in account suspension or permanent removal.",
    },
    {
      id: "13",
      title: "13. International Users",
      scope: "13 / GLOBAL",
      icon: <Globe size={24} color="#FF6A00" />,
      content: "Users outside the U.S. understand that information may be processed and stored in different jurisdictions with varying data protection laws.",
    },
    {
      id: "14",
      title: "14. Changes to This Privacy Policy",
      scope: "14 / UPDATES",
      icon: <RefreshCw size={24} color="#FF6A00" />,
      content: "We reserve the right to update this policy at any time. Changes will be posted with revised effective dates. Continued use constitutes acceptance.",
      fullWidth: true
    },
    {
      id: "15",
      title: "15. Contact Us",
      scope: "15 / SUPPORT",
      icon: <Mail size={24} color="#FF6A00" />,
      content: "Privacy: privacy@rogueworldrecords.com | Support: support@rogueworldrecords.com. We are committed to a trusted and fair environment.",
      fullWidth: true
    }
  ];

  const filteredSections = sections.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
        
        <Navbar />

        <div style={{ padding: "180px 5% 120px", flex: 1 }}>
        
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "80px", maxWidth: "1200px", margin: "0 auto 80px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "rgba(255,106,0,0.1)", padding: "8px 20px", borderRadius: "100px", border: "1px solid rgba(255,106,0,0.2)", marginBottom: "20px" }}>
                <Shield size={16} color="#FF6A00" />
                <span style={{ fontSize: "11px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.2em", textTransform: "uppercase" }}>Privacy Center</span>
              </div>
              <h1 style={{ fontSize: "clamp(40px, 8vw, 100px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.8" }}>
                <ScrollReveal>PRIVACY POLICY</ScrollReveal>
              </h1>
              <p style={{ marginTop: "32px", fontSize: "14px", color: "rgba(255,255,255,0.4)", fontWeight: "600" }}>
                Effective Date: May 14, 2026
              </p>
            </div>
            <div style={{ position: "relative", width: "400px" }}>
              <Search style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)" }} size={18} />
              <input 
                type="text" 
                placeholder="SEARCH POLICY SECTIONS..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "100px", padding: "18px 20px 18px 54px", color: "white", fontSize: "13px", fontWeight: "700", outline: "none", transition: "0.3s" }}
              />
            </div>
          </div>

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
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "100px", background: "rgba(255,255,255,0.01)", borderRadius: "32px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                <Search size={48} color="rgba(255,255,255,0.1)" style={{ margin: "0 auto 24px" }} />
                <h3 style={{ fontSize: "20px", fontWeight: "900", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>No matching policy sections found</h3>
              </div>
            )}
          </div>

          {/* FINAL STATEMENT CTA */}
          <div style={{ marginTop: "100px", textAlign: "center" }}>
            <ScrollReveal>
              <div className="orange-cta" style={{ maxWidth: "1200px", margin: "0 auto", borderRadius: "40px" }}>
                <div className="orange-cta-bg" />
                <div className="orange-cta-grid" />
                <div className="orange-cta-glow" />

                <div className="orange-cta-content" style={{ textAlign: "center", padding: "80px 40px" }}>
                  <h2 className="orange-cta-title" style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: "950", textTransform: "uppercase", marginBottom: "24px", color: "white" }}>
                    TRUST & <span className="orange-cta-highlight">INTEGRITY</span>
                  </h2>
                  <p className="orange-cta-subtitle" style={{ maxWidth: "800px", margin: "0 auto 40px", fontSize: "18px", color: "rgba(255,255,255,0.9)", lineHeight: "1.6" }}>
                    AMPEX World Records is committed to building a trusted, secure, and fair environment for competitors worldwide. Your privacy and trust are our highest priorities.
                  </p>
                  <div style={{ fontSize: "20px", fontWeight: "950", color: "white", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Break Limits. Make History. Become Legendary.
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Privacy;
