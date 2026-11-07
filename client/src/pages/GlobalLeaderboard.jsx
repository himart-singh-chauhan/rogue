import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiCall, formatProductImage } from "../utils/api";
import { 
  Trophy, 
  Globe, 
  ArrowRight,
  TrendingUp,
  Activity,
  Flag,
  Search,
  Award,
  Crown,
  Star,
  Users,
  Filter
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { motion } from "motion/react";

const CustomSelect = ({ value, onChange, options, label }) => (
  <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>{label}</label>
    <div style={{ position: "relative" }}>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)}
        style={{ 
          width: "100%", 
          appearance: "none", 
          background: "rgba(255,255,255,0.03)", 
          border: "1px solid rgba(255,255,255,0.05)", 
          borderRadius: "12px", 
          padding: "14px 40px 14px 16px", 
          color: "white", 
          fontSize: "13px", 
          fontWeight: "800", 
          outline: "none",
          cursor: "pointer",
          transition: "all 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}
      >
        {options.map(opt => <option key={opt} value={opt} style={{ background: "#111", color: "white" }}>{opt}</option>)}
      </select>
      <div style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>▼</div>
    </div>
  </div>
);

const GlobalLeaderboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const categories = ["All Categories", "Athletics", "Strength", "Endurance", "Balance", "Skills", "Gaming", "Water Sports", "Reaction", "Mind & Memory", "Action Sports", "Other"];
  const ageGroups = ["All Ages", "Junior Champions Division (5–12)", "Teen Legends Division (13–17)", "Adult Division (18–49)", "Masters Division (50+)"];
  const countries = ["All Countries", "USA", "RUS", "GBR", "KOR", "ITA", "CHN", "JPN", "CAN", "GER", "AUS", "IND", "FRA"];
  const sortOptions = ["Highest Score", "Newest Records", "Most Records Held"];

  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [activeCountry, setActiveCountry] = useState("All Countries");
  const [activeAgeGroup, setActiveAgeGroup] = useState("All Ages");
  const [activeSort, setActiveSort] = useState("Highest Score");
  const [globalData, setGlobalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const data = await apiCall("/rankings/global", "GET");
        if (data && data.rankings) {
          const mapped = data.rankings.map(r => ({
            rank: r.global_rank ? `#${String(r.global_rank).padStart(2, '0')}` : "-",
            name: r.users?.name || "Unknown Athlete",
            points: r.total_points || 0,
            country: r.country || "N/A",
            records: r.verified_records_count || 0,
            avatar: r.users?.profile_image 
              ? (r.users.profile_image.includes('http') ? r.users.profile_image : formatProductImage(`/uploads/${r.users.profile_image}`))
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.users?.name || "Athlete")}&background=FF6A00&color=fff`,
            category: r.category_id ? "Ranked" : "Global",
            ageGroup: "All Ages", // Add age groups if stored in users later
            score: `${r.total_points || 0} Pts`, // Temporary score mapping
            date: new Date(r.updated_at || r.created_at).toLocaleDateString(),
            recordId: r.id, // Fallback, not real record ID
            profileId: r.user_id
          }));
          setGlobalData(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch global rankings:", err);
        setError("Failed to load rankings. Ensure ranking tables exist in Supabase.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRankings();
  }, []);

  const getFilteredData = () => {
    let data = [...globalData];
    
    if (activeCategory !== "All Categories") data = data.filter(d => d.category === activeCategory);
    if (activeCountry !== "All Countries") data = data.filter(d => d.country === activeCountry);
    if (activeAgeGroup !== "All Ages") data = data.filter(d => d.ageGroup === activeAgeGroup);
    
    if (searchQuery) {
      data = data.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeSort === "Highest Score") {
      data.sort((a, b) => b.points - a.points); // using points as unified score metric for mock sorting
    } else if (activeSort === "Newest Records") {
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (activeSort === "Most Records Held") {
      data.sort((a, b) => b.records - a.records);
    }

    return data;
  };

  const filteredData = getFilteredData();

  return (
    <PageTransition>
      <div style={{ background: "#050505", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />


        {/* HERO SECTION - GLOBAL VIBE */}
        <section style={{ padding: "180px 5% 100px", position: "relative", overflow: "hidden", textAlign: "center" }}>
          <div style={{ position: "absolute", top: "0", left: "50%", transform: "translateX(-50%)", width: "100%", height: "100%", background: "radial-gradient(circle at center, rgba(255,106,0,0.08) 0%, transparent 70%)", zIndex: 0 }} />
          
          <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "rgba(255,106,0,0.1)", border: "1px solid rgba(255,106,0,0.2)", padding: "8px 20px", borderRadius: "100px", marginBottom: "32px" }}
            >
              <Globe size={16} color="#FF6A00" />
              <span style={{ fontSize: "12px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.15em", textTransform: "uppercase" }}>WORLDWIDE ELITE STANDINGS</span>
            </motion.div>

            <h1 style={{ fontSize: "clamp(48px, 8vw, 120px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.95", marginBottom: "40px" }}>
              <ScrollReveal>GLOBAL</ScrollReveal><br />
              <span style={{ color: "#FF6A00" }}><ScrollReveal>LEADERBOARD</ScrollReveal></span>
            </h1>
            
            <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.5)", maxWidth: "750px", margin: "0 auto 60px", lineHeight: "1.6" }}>
              Top competitors worldwide and cross-country standings. Compare achievements across borders and track the absolute peaks of human performance across all ages and divisions.
            </p>

            {/* QUICK STATS */}
            <div style={{ display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: "900", color: "white" }}>195</div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: "4px" }}>Countries</div>
              </div>
              <div style={{ width: "1px", background: "rgba(255,255,255,0.1)", alignSelf: "stretch" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: "900", color: "white" }}>12.4K</div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: "4px" }}>Athletes</div>
              </div>
              <div style={{ width: "1px", background: "rgba(255,255,255,0.1)", alignSelf: "stretch" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: "900", color: "white" }}>$2.5M</div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginTop: "4px" }}>Prize Pool</div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN STANDINGS */}
        <section style={{ padding: "0 5% 160px" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            
            {/* FILTER BAR */}
            <div style={{ 
              display: "flex", 
              marginBottom: "48px", 
              gap: "20px",
              flexWrap: "wrap",
              background: "rgba(255,255,255,0.02)",
              padding: "24px",
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              <CustomSelect label="Category" value={activeCategory} onChange={setActiveCategory} options={categories} />
              <CustomSelect label="Country" value={activeCountry} onChange={setActiveCountry} options={countries} />
              <CustomSelect label="Age Group" value={activeAgeGroup} onChange={setActiveAgeGroup} options={ageGroups} />
              <CustomSelect label="Sort By" value={activeSort} onChange={setActiveSort} options={sortOptions} />
              
              <div style={{ position: "relative", minWidth: "250px", flex: "1" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Search Athletes</label>
                <Search style={{ position: "absolute", left: "16px", top: "36px", color: "rgba(255,255,255,0.3)" }} size={16} />
                <input 
                  type="text" 
                  placeholder="Athlete name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: "100%", 
                    background: "rgba(255,255,255,0.03)", 
                    border: "1px solid rgba(255,255,255,0.05)", 
                    borderRadius: "12px", 
                    padding: "14px 20px 14px 44px", 
                    color: "white", 
                    fontSize: "13px", 
                    fontWeight: "800", 
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "#FF6A00"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}
                />
              </div>
            </div>

            {/* STANDINGS TABLE */}
            <div style={{ background: "rgba(255,255,255,0.01)", borderRadius: "32px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
              {/* Header row */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "80px 1.5fr 150px 200px 150px 150px 120px", 
                padding: "24px 32px", 
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: "10px",
                fontWeight: "900",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.15em"
              }}>
                <div>Rank</div>
                <div>Athlete</div>
                <div>Category</div>
                <div>Division</div>
                <div>Score</div>
                <div>Date</div>
                <div style={{ textAlign: "right" }}>Points</div>
              </div>

              {loading ? (
                <div style={{ padding: "80px 40px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                  <p>Loading real rankings from database...</p>
                </div>
              ) : error ? (
                <div style={{ padding: "80px 40px", textAlign: "center", color: "#FF6A00" }}>
                  <p>{error}</p>
                </div>
              ) : filteredData.length > 0 ? (
                filteredData.map((r, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/profile/${r.profileId}`)}
                    style={{ 
                      display: "grid", 
                      gridTemplateColumns: "80px 1.5fr 150px 200px 150px 150px 120px", 
                      padding: "24px 32px", 
                      alignItems: "center", 
                      borderBottom: i === filteredData.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)",
                      background: i < 3 && activeSort === "Highest Score" ? "rgba(255,106,0,0.02)" : "transparent",
                      transition: "background 0.3s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,106,0,0.05)";
                      const scoreValEl = e.currentTarget.querySelector(".score-hover-value");
                      if (scoreValEl) scoreValEl.style.color = "#FF6A00";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = i < 3 && activeSort === "Highest Score" ? "rgba(255,106,0,0.02)" : "transparent";
                      const scoreValEl = e.currentTarget.querySelector(".score-hover-value");
                      if (scoreValEl) scoreValEl.style.color = "white";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {i === 0 && activeSort === "Highest Score" && <Crown size={16} color="#FFD700" />}
                      <div style={{ 
                        fontSize: i < 3 && activeSort === "Highest Score" ? "24px" : "18px", 
                        fontWeight: "950", 
                        color: i < 3 && activeSort === "Highest Score" ? "#FF6A00" : "rgba(255,255,255,0.2)",
                        fontStyle: i < 3 && activeSort === "Highest Score" ? "italic" : "normal"
                      }}>
                        #{String(i + 1).padStart(2, '0')}
                      </div>
                    </div>
                    
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (r.profileId) navigate(`/profile/${r.profileId}`);
                      }}
                      style={{ display: "flex", alignItems: "center", gap: "16px", cursor: "pointer" }}
                      onMouseEnter={(e) => {
                        const nameEl = e.currentTarget.querySelector(".athlete-hover-name");
                        if (nameEl) nameEl.style.color = "#FF6A00";
                      }}
                      onMouseLeave={(e) => {
                        const nameEl = e.currentTarget.querySelector(".athlete-hover-name");
                        if (nameEl) nameEl.style.color = "white";
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <img loading="lazy" decoding="async" src={r.avatar} alt={r.name} style={{ width: "48px", height: "48px", borderRadius: "12px", border: i < 3 && activeSort === "Highest Score" ? "2px solid #FF6A00" : "1px solid rgba(255,255,255,0.1)", objectFit: "cover" }} />
                        {i < 3 && activeSort === "Highest Score" && <div style={{ position: "absolute", top: -5, right: -5, background: "#FF6A00", color: "white", padding: "4px", borderRadius: "50%" }}><Star size={8} fill="white" /></div>}
                      </div>
                      <div>
                        <div className="athlete-hover-name" style={{ fontSize: "16px", fontWeight: "900", letterSpacing: "-0.02em", color: "white", transition: "color 0.2s" }}>{r.name}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontWeight: "700" }}>
                          <Flag size={10} /> {r.country}
                        </div>
                      </div>
                    </div>
 
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "rgba(255,255,255,0.8)" }}>{r.category}</div>
                    
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "800", color: "#FF6A00", background: "rgba(255,106,0,0.1)", padding: "6px 10px", borderRadius: "6px", display: "inline-block", textTransform: "uppercase" }}>
                        {r.ageGroup.split(" (")[0]}
                      </div>
                    </div>
                    
                    <div className="score-hover-value" style={{ fontSize: "15px", fontWeight: "900", color: "white", transition: "color 0.2s" }}>{r.score}</div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "rgba(255,255,255,0.5)" }}>{r.date}</div>
 
                    <div style={{ textAlign: "right", fontSize: "18px", fontWeight: "950", color: "#FF6A00" }}>
                      {r.points.toLocaleString()}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={{ padding: "80px 40px", textAlign: "center" }}>
                  <Filter size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: "16px" }} />
                  <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "8px" }}>No athletes found</h3>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", maxWidth: "400px", margin: "0 auto" }}>
                    Try adjusting your filters or searching for a different division or category.
                  </p>
                </div>
              )}
            </div>

            {/* CALL TO ACTION */}
            <div style={{ marginTop: "80px", textAlign: "center" }}>
              <Link to="/verify" style={{ textDecoration: "none" }}>
                <button style={{ 
                  background: "linear-gradient(135deg, #FF6A00, #FF3D00)", 
                  color: "white", 
                  padding: "24px 60px", 
                  borderRadius: "100px", 
                  border: "none", 
                  fontSize: "16px", 
                  fontWeight: "950", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em",
                  cursor: "pointer", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "16px",
                  boxShadow: "0 20px 50px rgba(255,106,0,0.3)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 30px 60px rgba(255,106,0,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 20px 50px rgba(255,106,0,0.3)"; }}
                >
                  START YOUR ASCENT <ArrowRight size={20} />
                </button>
              </Link>
              <p style={{ marginTop: "24px", color: "rgba(255,255,255,0.3)", fontSize: "14px", fontWeight: "600" }}>
                Every verified record earns points toward the Global Standings.
              </p>
            </div>

          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default GlobalLeaderboard;
