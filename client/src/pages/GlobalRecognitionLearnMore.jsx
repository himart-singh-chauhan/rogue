import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Globe, Trophy, Award, Compass, Eye, ShieldAlert, Star } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

const GlobalRecognitionLearnMore = () => {
  const sections = [
    {
      id: "what-it-means",
      icon: <Award size={24} color="#FF6A00" />,
      title: "What Global Recognition Means",
      subtitle: "Verified record holders receive public acknowledgment for their achievements on AMPEX World Records.",
      points: [
        "Official, shareable record holder profile page.",
        "Permanent placement on record category listings.",
        "Rankings on regional and global leaderboards.",
        "Embossed digital certificate with cryptographic verification.",
        "Printable premium stock parchment certificate option.",
        "Exclusive athlete spotlight feature on the home page.",
        "Official social media recognition and PR backing.",
        "National, age group, and category specific rankings.",
        "Automatic eligibility for championship competitions and live events."
      ]
    },
    {
      id: "how-you-earn-it",
      icon: <Trophy size={24} color="#FF6A00" />,
      title: "How You Earn Global Recognition",
      subtitle: "To earn elite recognition status, athletes must pass our strict adjudication pipeline:",
      steps: [
        { label: "1. Create an Account", text: "Register your competitor profile with precise demographic information." },
        { label: "2. Submit a Record Attempt", text: "Propose or challenge a specific category through the secure intake portal." },
        { label: "3. Upload Supporting Evidence", text: "Provide primary unedited video, timers, photos, and witness details." },
        { label: "4. Adhere to Category Rules", text: "Ensure exact guidelines and equipment specs are met 100%." },
        { label: "5. Pass Verification Check", text: "Expert adjudicators analyze frames, audio, and witness integrity." },
        { label: "6. Official Approval", text: "Receive the authenticated status and enter the official registry database." }
      ]
    },
    {
      id: "where-it-appears",
      icon: <Eye size={24} color="#FF6A00" />,
      title: "Where Your Record May Appear",
      subtitle: "Approved achievements receive maximum exposure across our network:",
      points: [
        "The Global Leaderboard displaying the world's finest athletes.",
        "Category specific boards (Strength, Endurance, Gaming, etc.).",
        "Targeted record and subcategory video catalog pages.",
        "Personalized competitor and team profile cards.",
        "Featured Record Holder showcases on landing pages.",
        "AMPEX World Records official social channels and YouTube highlights.",
        "Promotional material for ticketed Live Spectator Events.",
        "Dedicated verification certificate archives."
      ]
    },
    {
      id: "why-it-matters",
      icon: <Compass size={24} color="#FF6A00" />,
      title: "Why Global Recognition Matters",
      subtitle: "Taking your place on the world stage unlocks immediate benefits:",
      points: [
        "Build a solid brand and reputation as a verified record-breaker.",
        "Prove your elite performance is certified and authentic.",
        "Compare and compete with the best athletes globally.",
        "Inspire other fitness enthusiasts, creators, and competitors.",
        "Gain sponsor exposure and commercial partnership opportunities.",
        "Secure absolute top-tier bragging rights in your division."
      ]
    }
  ];

  const levels = [
    { name: "Category Recognition", desc: "Verifiable rank within a targeted record discipline." },
    { name: "Country Recognition", desc: "Top status as the leading competitor in your home nation." },
    { name: "Age Division", desc: "Top placement inside Youth, Teen, Adult, or Masters brackets." },
    { name: "Global Recognition", desc: "Ultimate crown spanning the full AMPEX World Records leaderboard." }
  ];

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", fontFamily: "'Inter', sans-serif", minHeight: "100vh", paddingTop: "80px", display: "flex", flexDirection: "column" }}>
        
        {/* NAVBAR */}
        <Navbar />

        {/* HERO SECTION */}
        <header style={{ position: "relative", padding: "100px 5% 60px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "radial-gradient(circle at center, rgba(255,106,0,0.05) 0%, transparent 70%)" }}>
          <div style={{ background: "rgba(255,106,0,0.1)", color: "#FF6A00", display: "inline-block", padding: "6px 16px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
            ELITE STATUS GUIDE
          </div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 68px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.03em", marginBottom: "24px", lineHeight: "1.1", maxWidth: "900px" }}>
            Become Recognized <span style={{ color: "#FF6A00" }}>Worldwide</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", maxWidth: "750px", lineHeight: "1.7", margin: "0 auto 32px" }}>
            Global Recognition is where verified record holders receive public acknowledgment for their official achievements on AMPEX World Records. Once a record is approved, the competitor can be featured across the platform and recognized as part of the worldwide AMPEX record-breaking community.
          </p>
          <Link to="/leaderboard" style={{ textDecoration: "none" }}>
            <button style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", transition: "0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,106,0,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              EXPLORE LEADERBOARDS <ArrowRight size={16} />
            </button>
          </Link>
        </header>

        {/* DETAILS SECTION */}
        <section style={{ padding: "80px 5%", maxWidth: "1200px", margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "280px 1fr", gap: "60px" }}>
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <div style={{ position: "sticky", top: "140px", height: "fit-content" }}>
            <h4 style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "24px" }}>QUICK SECTIONS</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <a href="#what-it-means" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>1. What it Means</a>
              <a href="#how-you-earn-it" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>2. How You Earn It</a>
              <a href="#where-it-appears" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>3. Where It Appears</a>
              <a href="#why-it-matters" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>4. Why It Matters</a>
              <a href="#recognition-levels" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>5. Recognition Levels</a>
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

                {sec.steps && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {sec.steps.map((st, idx) => (
                      <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "20px", borderRadius: "16px" }}>
                        <strong style={{ color: "#FF6A00", fontSize: "14px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>{st.label}</strong>
                        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{st.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* RECOGNITION DIVISION BRACKETS */}
            <div id="recognition-levels" style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", background: "rgba(255, 106, 0, 0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Star size={24} color="#FF6A00" />
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase" }}>Recognition Brackets</h3>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", marginBottom: "24px" }}>
                AMPEX record breakers are categorized into hierarchical tiers:
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {levels.map((lvl, idx) => (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "24px", borderRadius: "20px" }}>
                    <h5 style={{ fontSize: "15px", fontWeight: "900", color: "white", marginBottom: "8px", textTransform: "uppercase" }}>{lvl.name}</h5>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.4" }}>{lvl.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* FINAL REMINDER */}
          <div style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg, rgba(255,106,0,0.1) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid #FF6A00", borderRadius: "32px", padding: "40px", textAlign: "center", marginTop: "40px" }}>
            <h3 style={{ fontSize: "28px", fontWeight: "950", textTransform: "uppercase", marginBottom: "12px", color: "#FF6A00" }}>Final Message</h3>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", maxWidth: "650px", margin: "0 auto 24px", lineHeight: "1.6" }}>
              Every verified record tells a story of discipline, effort, and determination. AMPEX World Records gives competitors a place to be seen, respected, and remembered.
            </p>
            <h4 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "white", textTransform: "uppercase", marginBottom: "32px" }}>
              Break Limits. Make History. Become Legendary.
            </h4>
            <Link to="/signup" style={{ textDecoration: "none" }}>
              <button style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", transition: "0.3s" }}>
                REGISTER PROFILE
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

export default GlobalRecognitionLearnMore;
