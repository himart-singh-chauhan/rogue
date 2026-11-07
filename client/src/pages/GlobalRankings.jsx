import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Trophy, 
  Globe, 
  Search,
  Flag,
  ArrowRight,
  TrendingUp,
  Award,
  Crown,
  Activity,
  Star
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { motion } from "motion/react";

const GlobalRankings = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState("All Tiers");

  const tiers = [
    { name: "All Tiers", minPoints: 0 },
    { name: "Grand Champion", minPoints: 20000 },
    { name: "Elite Master", minPoints: 15000 },
    { name: "Pro Competitor", minPoints: 10000 },
    { name: "Challenger", minPoints: 5000 }
  ];

  const competitors = [
    { rank: 1, name: "Leo Vance", points: 24850, country: "USA", records: 12, tier: "Grand Champion", avatar: "https://randomuser.me/api/portraits/men/32.jpg", change: "+1", profileId: "leo-vance" },
    { rank: 2, name: "Elena Petrov", points: 22410, country: "RUS", records: 10, tier: "Grand Champion", avatar: "https://randomuser.me/api/portraits/women/44.jpg", change: "-1", profileId: "leo-vance" },
    { rank: 3, name: "Jamal Carter", points: 21900, country: "GBR", records: 15, tier: "Grand Champion", avatar: "https://randomuser.me/api/portraits/men/85.jpg", change: "Stable", profileId: "jamal-carter" },
    { rank: 4, name: "Sarah Kim", points: 19540, country: "KOR", records: 8, tier: "Elite Master", avatar: "https://randomuser.me/api/portraits/women/15.jpg", change: "+4", profileId: "jamal-carter" },
    { rank: 5, name: "Marcus Rossi", points: 18210, country: "ITA", records: 9, tier: "Elite Master", avatar: "https://randomuser.me/api/portraits/men/12.jpg", change: "Stable", profileId: "leo-vance" },
    { rank: 6, name: "Chen Wei", points: 17800, country: "CHN", records: 11, tier: "Elite Master", avatar: "https://randomuser.me/api/portraits/men/45.jpg", change: "-2", profileId: "jamal-carter" },
    { rank: 7, name: "Mina Chen", points: 16950, country: "JPN", records: 7, tier: "Elite Master", avatar: "https://randomuser.me/api/portraits/women/22.jpg", change: "+1", profileId: "jamal-carter" },
    { rank: 8, name: "David Lu", points: 14200, country: "CAN", records: 6, tier: "Pro Competitor", avatar: "https://randomuser.me/api/portraits/men/76.jpg", change: "+2", profileId: "jamal-carter" },
    { rank: 9, name: "Lucas Silva", points: 11950, country: "BRA", records: 5, tier: "Pro Competitor", avatar: "https://randomuser.me/api/portraits/men/3.jpg", change: "-1", profileId: "leo-vance" }
  ];

  const getFilteredCompetitors = () => {
    let list = [...competitors];
    
    if (selectedTier !== "All Tiers") {
      list = list.filter(c => c.tier === selectedTier);
    }

    if (searchQuery) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return list;
  };

  const filteredCompetitors = getFilteredCompetitors();

  return (
    <PageTransition>
      <div style={{ background: "#050505", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />

        {/* HERO SECTION */}
        <section style={{ padding: "180px 5% 100px", position: "relative", overflow: "hidden", textAlign: "center" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", height: "100%", background: "radial-gradient(circle at center, rgba(255,106,0,0.06) 0%, transparent 60%)", zIndex: 0 }} />
          
          <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "rgba(255,106,0,0.08)", border: "1px solid rgba(255,106,0,0.2)", padding: "8px 24px", borderRadius: "100px", marginBottom: "32px" }}
            >
              <Globe size={16} color="#FF6A00" />
              <span style={{ fontSize: "11px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.15em", textTransform: "uppercase" }}>Worldwide Competitor Points</span>
            </motion.div>

            <h1 style={{ fontSize: "clamp(48px, 8vw, 110px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.9", marginBottom: "40px" }}>
              GLOBAL<br />
              <span style={{ color: "#FF6A00" }}>RANKINGS</span>
            </h1>
            
            <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.5)", maxWidth: "700px", margin: "0 auto 60px", lineHeight: "1.6" }}>
              Worldwide competitor point indices. Elite points are earned from verified world records, monthly challenge submissions, and global streaks.
            </p>

            {/* LEVEL CRITERIA CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              {[
                { tier: "Grand Champion", points: "20K+ PTS", desc: "Top 0.1% Worldwide", color: "#FF6A00" },
                { tier: "Elite Master", points: "15K+ PTS", desc: "International Legend", color: "#F59E0B" },
                { tier: "Pro Competitor", points: "10K+ PTS", desc: "Professional Rank", color: "#E65F00" },
                { tier: "Challenger", points: "5K+ PTS", desc: "Active Contender", color: "#FF8A3D" }
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "24px", borderRadius: "20px" }}>
                  <span style={{ color: item.color, fontSize: "12px", fontWeight: "900", textTransform: "uppercase" }}>{item.tier}</span>
                  <div style={{ fontSize: "24px", fontWeight: "950", margin: "8px 0 4px" }}>{item.points}</div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RANKINGS GRID SECTION */}
        <section style={{ padding: "0 5% 140px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            
            {/* TIER FILTER BAR */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "40px", 
              gap: "24px",
              flexWrap: "wrap",
              background: "rgba(255,255,255,0.02)",
              padding: "10px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
                {tiers.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTier(t.name)}
                    style={{
                      background: selectedTier === t.name ? "#FF6A00" : "transparent",
                      color: selectedTier === t.name ? "white" : "rgba(255,255,255,0.5)",
                      border: "none",
                      padding: "12px 20px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: "800",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s"
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              <div style={{ position: "relative", minWidth: "300px", flex: 1 }}>
                <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} size={16} />
                <input
                  type="text"
                  placeholder="Filter by athlete or country..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "14px",
                    padding: "14px 20px 14px 44px",
                    color: "white",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {/* TABLE */}
            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", overflow: "hidden" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr 180px 180px 150px",
                padding: "24px 48px",
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: "11px",
                fontWeight: "900",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.15em"
              }}>
                <div>Rank</div>
                <div>Athlete</div>
                <div style={{ textAlign: "right" }}>Tier</div>
                <div style={{ textAlign: "right" }}>Records Broken</div>
                <div style={{ textAlign: "right" }}>Global Points</div>
              </div>

              {filteredCompetitors.length > 0 ? (
                filteredCompetitors.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/profile/${c.profileId}`)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "100px 1fr 180px 180px 150px",
                      padding: "32px 48px",
                      alignItems: "center",
                      borderBottom: i === filteredCompetitors.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)",
                      background: c.rank <= 3 ? "rgba(255,106,0,0.02)" : "transparent",
                      cursor: "pointer",
                      transition: "background 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,106,0,0.05)";
                      const nameEl = e.currentTarget.querySelector(".athlete-hover-name");
                      if (nameEl) nameEl.style.color = "#FF6A00";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = c.rank <= 3 ? "rgba(255,106,0,0.02)" : "transparent";
                      const nameEl = e.currentTarget.querySelector(".athlete-hover-name");
                      if (nameEl) nameEl.style.color = "white";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {c.rank === 1 && <Crown size={14} color="#FFD700" />}
                      <div style={{ fontSize: "20px", fontWeight: "950", color: c.rank <= 3 ? "#FF6A00" : "rgba(255,255,255,0.2)" }}>
                        #{String(c.rank).padStart(2, '0')}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <img loading="lazy" decoding="async" src={c.avatar} alt={c.name} style={{ width: "48px", height: "48px", borderRadius: "14px", border: c.rank <= 3 ? "1.5px solid #FF6A00" : "1px solid rgba(255,255,255,0.1)", objectFit: "cover" }} />
                      <div>
                        <div className="athlete-hover-name" style={{ fontSize: "16px", fontWeight: "800", color: "white", transition: "color 0.2s" }}>{c.name}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                          <Flag size={10} /> {c.country}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: "900",
                        color: c.tier.includes("Grand") ? "#FF6A00" : c.tier.includes("Elite") ? "#F59E0B" : "#FF8A3D",
                        background: "rgba(255,255,255,0.03)",
                        padding: "6px 14px",
                        borderRadius: "100px",
                        textTransform: "uppercase"
                      }}>
                        {c.tier}
                      </span>
                    </div>

                    <div style={{ textAlign: "right", fontSize: "18px", fontWeight: "900" }}>
                      {c.records}
                    </div>

                    <div style={{ textAlign: "right", fontSize: "20px", fontWeight: "950", color: "#FF6A00" }}>
                      {c.points.toLocaleString()} PTS
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "80px", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                  No competitors found matching criteria.
                </div>
              )}
            </div>

          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default GlobalRankings;
