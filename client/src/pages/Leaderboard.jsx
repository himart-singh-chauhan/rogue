import React from "react";
import { Link } from "react-router-dom";
import { 
  Trophy, 
  Globe, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  Compass
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { motion } from "motion/react";

const Leaderboard = () => {
  const rankingPortals = [
    {
      title: "Local Leaderboards",
      slug: "/local-leaderboards",
      badge: "National Divisions",
      desc: "United States, Canada, United Kingdom, and more. Compete against top athletes in your country, province, or state to claim your local throne.",
      accent: "#FF6A00",
      icon: <MapPin size={32} color="#FF6A00" />,
      features: ["Filter by Country/State", "Real-Time Local refresh", "Regional Champions"]
    },
    {
      title: "Global Rankings",
      slug: "/global-rankings",
      badge: "competitor points index",
      desc: "Worldwide competitor point listings. Competitors earn point allocations by breaking verified world records, completing challenges, and keeping streaks alive.",
      accent: "#FF6A00",
      icon: <Trophy size={32} color="#FF6A00" />,
      features: ["Grand Champion Tiers", "Worldwide point ledger", "Tier-based standings"]
    },
    {
      title: "Global Leaderboard",
      slug: "/global-leaderboard",
      badge: "worldwide elite",
      desc: "The pinnacle of world record-breaking. See the ultimate top 100 competitors worldwide, all-time record rankings, and cross-country standing tables.",
      accent: "#FF6A00",
      icon: <Globe size={32} color="#FF6A00" />,
      features: ["Top 100 Worldwide Elite", "Cross-Country standings", "All-time greatest record counts"]
    }
  ];

  return (
    <PageTransition>
      <div style={{ background: "#050505", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />


        {/* HERO SECTION */}
        <section style={{ padding: "180px 5% 80px", position: "relative", overflow: "hidden", textAlign: "center" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", height: "100%", background: "radial-gradient(circle at center, rgba(255,106,0,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
          
          <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "rgba(255,106,0,0.08)", border: "1px solid rgba(255,106,0,0.2)", padding: "8px 24px", borderRadius: "100px", marginBottom: "32px" }}>
              <Compass size={16} color="#FF6A00" />
              <span style={{ fontSize: "11px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.2em", textTransform: "uppercase" }}>AMPEX LEADERBOARD PORTAL</span>
            </div>

            <h1 style={{ fontSize: "clamp(44px, 7vw, 100px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.95", marginBottom: "32px" }}>
              CHOOSE YOUR<br />
              <span style={{ color: "#FF6A00" }}>DIVISION</span>
            </h1>
            
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6", maxWidth: "600px", margin: "0 auto" }}>
              Welcome to the central ranking portal. Filter records locally, compete in the worldwide competitor points ledger, or view the worldwide all-time leaderboard.
            </p>
          </div>
        </section>

        {/* CARD SYSTEM SECTOR */}
        <section style={{ padding: "0 5% 160px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "32px" }}>
              {rankingPortals.map((portal, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "32px",
                    padding: "48px 40px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    const btn = e.currentTarget.querySelector(".portal-btn");
                    if (btn) {
                      btn.style.background = portal.accent;
                      btn.style.color = "white";
                      btn.style.boxShadow = `0 10px 30px ${portal.accent}33`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    const btn = e.currentTarget.querySelector(".portal-btn");
                    if (btn) {
                      btn.style.background = "transparent";
                      btn.style.color = "white";
                      btn.style.boxShadow = "none";
                    }
                  }}
                >
                  <div>
                    {/* Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "900",
                        color: portal.accent,
                        background: `${portal.accent}15`,
                        padding: "6px 16px",
                        borderRadius: "100px",
                        textTransform: "uppercase",
                        letterSpacing: "0.15em"
                      }}>
                        {portal.badge}
                      </span>
                      {portal.icon}
                    </div>

                    {/* Headline */}
                    <h3 style={{ fontSize: "28px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "-0.01em" }}>
                      {portal.title}
                    </h3>

                    {/* Description */}
                    <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", lineHeight: "1.7", marginBottom: "40px" }}>
                      {portal.desc}
                    </p>

                    {/* Features list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "60px" }}>
                      {portal.features.map((feat, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                          <ShieldCheck size={16} color={portal.accent} />
                          {feat}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic CTA Button */}
                  <Link to={portal.slug} style={{ textDecoration: "none" }}>
                    <button
                      className="portal-btn"
                      style={{
                        width: "100%",
                        padding: "16px 24px",
                        background: "transparent",
                        color: "white",
                        border: `1.5px solid ${portal.accent}`,
                        borderRadius: "100px",
                        fontSize: "14px",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        cursor: "pointer",
                        transition: "all 0.3s"
                      }}
                    >
                      ENTER STANDINGS <ArrowRight size={14} />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Leaderboard;
