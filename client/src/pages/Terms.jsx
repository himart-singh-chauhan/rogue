import React from "react";
import { motion } from "motion/react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { Shield, Book, Scale, Lock, RefreshCw, Mail } from "lucide-react";

const Terms = () => {
  const sections = [
    {
      id: "acceptance",
      icon: <Shield size={24} />,
      title: "1. Acceptance of Terms",
      content: "By using AMPEX World Records, you confirm that:\n• You are at least 18 years old or have parental/guardian permission.\n• You understand and accept these Terms of Service.\n• You agree to follow all rules, policies, and guidelines established by the organization.\nIf you do not agree with these terms, you should not use the platform."
    },
    {
      id: "services",
      icon: <RefreshCw size={24} />,
      title: "2. Services Provided",
      content: "AMPEX World Records provides services including but not limited to:\n• World record submissions\n• Verification services\n• Membership programs\n• Online competitions\n• Live events\n• Rankings and statistics\n• Award and certificate programs\n• Community engagement tools\n• Digital content and media\nWe reserve the right to modify, suspend, or discontinue services at any time."
    },
    {
      id: "accounts",
      icon: <Lock size={24} />,
      title: "3. User Accounts",
      content: "Users may be required to create an account to access certain features.\nYou agree to:\n• Provide accurate and truthful information\n• Maintain the security of your account\n• Keep login credentials confidential\n• Accept responsibility for activity under your account\nWe reserve the right to suspend or terminate accounts that violate these terms."
    },
    {
      id: "memberships",
      icon: <Scale size={24} />,
      title: "4. Memberships & Fees",
      content: "Certain services or competitions may require paid memberships or fees.\nBy purchasing a membership or service:\n• You agree to all pricing and billing terms.\n• Fees may be non-refundable unless otherwise stated.\n• Membership benefits may change over time.\nFailure to make required payments may result in suspension of services or membership access."
    },
    {
      id: "submission-rules",
      icon: <Book size={24} />,
      title: "5. Record Submission Rules",
      content: "All submissions must:\n• Follow official category rules\n• Include accurate evidence\n• Be truthful and authentic\n• Meet safety standards\n• Avoid cheating, manipulation, or fraud\nAMPEX World Records reserves the right to deny or revoke records at any time if violations are discovered."
    },
    {
      id: "judging",
      icon: <Shield size={24} />,
      title: "6. Verification & Judging Authority",
      content: "All verification decisions are made by the official review and judging team.\nWe reserve the right to:\n• Request additional evidence\n• Deny incomplete submissions\n• Reject unsafe or inappropriate challenges\n• Modify verification procedures when necessary\nOfficial decisions may be considered final unless an approved appeal process is available."
    },
    {
      id: "conduct",
      icon: <Lock size={24} />,
      title: "7. User Conduct",
      content: "Users agree NOT to:\n• Upload fraudulent evidence\n• Harass or threaten staff or other users\n• Violate laws or regulations\n• Submit dangerous or illegal challenges\n• Impersonate another person\n• Interfere with platform operations\n• Use abusive, hateful, or discriminatory language\nViolation of these rules may result in: Account suspension, Permanent bans, Record removal, Legal action if necessary."
    },
    {
      id: "safety",
      icon: <Shield size={24} />,
      title: "8. Safety Disclaimer",
      content: "Participation in physical activities, challenges, or competitions involves risk.\nBy participating, users acknowledge:\n• They voluntarily assume all risks.\n• They are responsible for their own safety.\n• They should seek medical advice before attempting strenuous activities.\n• AMPEX World Records is not responsible for injuries, accidents, or damages resulting from participation.\nNever attempt dangerous or unsafe stunts."
    },
    {
      id: "intellectual",
      icon: <Scale size={24} />,
      title: "9. Intellectual Property",
      content: "All website content, branding, graphics, logos, videos, text, and materials associated with AMPEX World Records are protected by intellectual property laws.\nUsers may not:\n• Copy website content without permission\n• Reproduce branding or logos\n• Sell or distribute protected content\n• Use company materials for unauthorized commercial purposes"
    },
    {
      id: "user-content",
      icon: <Book size={24} />,
      title: "10. User-Submitted Content",
      content: "By submitting videos, photos, or content, you grant AMPEX World Records permission to:\n• Review submitted content\n• Display approved submissions publicly\n• Share achievements on social media\n• Use content for promotional or marketing purposes\nUsers confirm they own or have permission to use all submitted materials."
    },
    {
      id: "privacy",
      icon: <Lock size={24} />,
      title: "11. Privacy",
      content: "Your use of the platform is also governed by our Privacy Policy.\nWe are committed to protecting user information while maintaining platform security and integrity."
    },
    {
      id: "third-party",
      icon: <RefreshCw size={24} />,
      title: "12. Third-Party Services",
      content: "The platform may contain links or integrations with third-party services, sponsors, or payment processors.\nAMPEX World Records is not responsible for third-party content, policies, or services."
    },
    {
      id: "liability",
      icon: <Scale size={24} />,
      title: "13. Limitation of Liability",
      content: "To the maximum extent permitted by law:\n• AMPEX World Records shall not be liable for indirect, incidental, or consequential damages.\n• Participation is at the user's own risk.\n• We do not guarantee uninterrupted access or error-free services."
    },
    {
      id: "termination",
      icon: <Shield size={24} />,
      title: "14. Termination of Access",
      content: "We reserve the right to suspend, restrict, or terminate access to any user who violates these Terms of Service or harms the platform or community."
    },
    {
      id: "appeals",
      icon: <RefreshCw size={24} />,
      title: "15. Appeals & Disputes",
      content: "Users may submit appeals through the official appeals process if they disagree with verification decisions or disciplinary actions.\nWe reserve the right to determine final outcomes regarding disputes and enforcement."
    },
    {
      id: "changes",
      icon: <RefreshCw size={24} />,
      title: "16. Changes to Terms",
      content: "AMPEX World Records may update these Terms of Service at any time.\nContinued use of the platform after updates constitutes acceptance of the revised terms."
    },
    {
      id: "law",
      icon: <Scale size={24} />,
      title: "17. Governing Law",
      content: "These Terms of Service shall be governed by and interpreted under applicable laws and regulations in the jurisdiction where the organization operates."
    },
    {
      id: "contact-info",
      icon: <Mail size={24} />,
      title: "18. Contact Information",
      content: "For questions regarding these Terms of Service, please contact:\nGeneral Support\nsupport@rogueworldrecords.com"
    }
  ];

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />

        {/* HERO HEADER */}
        <section style={{ 
          padding: "180px 5% 100px", 
          background: "linear-gradient(180deg, #111 0%, #0A0A0A 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decorative Background Elements */}
          <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(255,106,0,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(255,106,0,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "rgba(255,106,0,0.1)", padding: "8px 20px", borderRadius: "100px", border: "1px solid rgba(255,106,0,0.2)", marginBottom: "32px" }}>
                <Shield size={16} color="#FF6A00" />
                <span style={{ fontSize: "12px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.2em", textTransform: "uppercase" }}>Legal Document</span>
              </div>
              <h1 style={{ fontSize: "clamp(40px, 8vw, 80px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.9", marginBottom: "32px" }}>
                Terms of <br/>
                <span style={{ color: "#FF6A00" }}>Service</span>
              </h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
                Please read these terms carefully before using our platform. Your use of AMPEX World Records indicates your agreement to these terms.
              </p>
              <div style={{ marginTop: "40px", fontSize: "14px", color: "rgba(255,255,255,0.3)" }}>
                Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CONTENT SECTION */}
        <section style={{ padding: "100px 5%", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "60px" }}>
            {sections.map((section, idx) => (
              <ScrollReveal key={section.id}>
                <div style={{ 
                  background: "rgba(255,255,255,0.02)", 
                  padding: "48px", 
                  borderRadius: "32px", 
                  border: "1px solid rgba(255,255,255,0.05)",
                  position: "relative",
                  transition: "transform 0.3s ease, background 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.transform = "translateY(-5px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}>
                  <div style={{ 
                    position: "absolute", 
                    top: "40px", 
                    right: "48px", 
                    fontSize: "60px", 
                    fontWeight: "950", 
                    color: "rgba(255,255,255,0.03)", 
                    lineHeight: "1",
                    pointerEvents: "none"
                  }}>
                    {idx + 1}
                  </div>
                  
                  <div style={{ display: "flex", gap: "32px", alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ 
                      width: "60px", 
                      height: "60px", 
                      background: "linear-gradient(135deg, #FF6A00 0%, #E65100 100%)", 
                      borderRadius: "18px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      boxShadow: "0 10px 20px rgba(255,106,0,0.2)",
                      flexShrink: 0
                    }}>
                      {React.cloneElement(section.icon, { color: "white" })}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: "300px" }}>
                      <h2 style={{ fontSize: "28px", fontWeight: "900", color: "white", textTransform: "uppercase", marginBottom: "20px", letterSpacing: "-0.01em" }}>
                        {section.title}
                      </h2>
                      <div style={{ fontSize: "16px", lineHeight: "1.8", color: "rgba(255,255,255,0.7)" }}>
                        {section.content.split('\n').map((para, i) => (
                          <p key={i} style={{ marginBottom: i < section.content.split('\n').length - 1 ? "16px" : 0 }}>
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* FINAL CTA */}
          <div style={{ marginTop: "120px", textAlign: "center" }}>
            <ScrollReveal>
              <div style={{ 
                background: "linear-gradient(135deg, #FF6A00 0%, #E65100 100%)", 
                padding: "80px 40px", 
                borderRadius: "40px",
                boxShadow: "0 40px 80px rgba(255,106,0,0.15)"
              }}>
                <h3 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "24px", color: "white" }}>HAVE QUESTIONS?</h3>
                <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "18px", marginBottom: "40px", maxWidth: "600px", margin: "0 auto 40px" }}>
                  Our legal and compliance team is here to help you understand your rights and responsibilities on the platform.
                </p>
                <a href="mailto:legal@rogueworldrecords.com" style={{ 
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "white", 
                  color: "#FF6A00", 
                  padding: "18px 40px", 
                  borderRadius: "100px", 
                  fontWeight: "900", 
                  textDecoration: "none",
                  textTransform: "uppercase",
                  fontSize: "14px",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                  <Mail size={18} /> CONTACT LEGAL TEAM
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Terms;
