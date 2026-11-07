import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiCall, formatProductImage } from "../utils/api";
import { 
  Trophy, 
  MapPin, 
  Search,
  Flag,
  ArrowRight,
  ChevronRight,
  Star,
  Globe2,
  TrendingUp,
  Award
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { motion, AnimatePresence } from "motion/react";

const CustomSelect = ({ value, onChange, options, label }) => (
  <div style={{ position: "relative", flex: "1", minWidth: "180px" }}>
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
          padding: "12px 40px 12px 16px", 
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

const LocalLeaderboards = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Athletics");
  const [activeAgeGroup, setActiveAgeGroup] = useState("All Ages");
  const [activeSort, setActiveSort] = useState("Highest Score");

  const ageGroups = ["All Ages", "Junior Champions Division (5–12)", "Teen Legends Division (13–17)", "Adult Division (18–49)", "Masters Division (50+)"];
  const sortOptions = ["Highest Score", "Newest Records"];

  const [countries, setCountries] = useState([
    { name: "United States", code: "USA", flag: "🇺🇸", competitors: "4,820" },
    { name: "Canada", code: "CAN", flag: "🇨🇦", competitors: "1,940" },
    { name: "United Kingdom", code: "GBR", flag: "🇬🇧", competitors: "2,410" },
    { name: "Australia", code: "AUS", flag: "🇦🇺", competitors: "1,150" },
    { name: "Germany", code: "GER", flag: "🇩🇪", competitors: "980" }
  ]);

  useEffect(() => {
    apiCall('/countries', 'GET')
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          setCountries(data);
        }
      })
      .catch(err => console.error("Error fetching countries:", err));
  }, []);

  const categories = [
    "Athletics", 
    "Strength", 
    "Endurance", 
    "Balance", 
    "Skills", 
    "Gaming", 
    "Water Sports", 
    "Reaction", 
    "Mind & Memory", 
    "Action Sports", 
    "Other"
  ];

  // Using a flat array here so we can filter by country, category, and age division dynamically
  const mockLocalData = [
    { name: "Marcus Vance", country: "United States", category: "Strength", value: "355 KG", scoreNumeric: 355, date: "2026-05-18", event: "Bench Press", state: "Illinois", avatar: "https://randomuser.me/api/portraits/men/85.jpg", ageGroup: "Adult Division (18–49)", recordId: "bench-press", profileId: "leo-vance" },
    { name: "Ryan Reynolds", country: "United States", category: "Strength", value: "310 KG", scoreNumeric: 310, date: "2026-05-10", event: "Bench Press", state: "California", avatar: "https://randomuser.me/api/portraits/men/14.jpg", ageGroup: "Adult Division (18–49)", recordId: "bench-press", profileId: "leo-vance" },
    { name: "Jessica Alba", country: "United States", category: "Strength", value: "195 KG", scoreNumeric: 195, date: "2026-04-22", event: "Squat Hold", state: "Texas", avatar: "https://randomuser.me/api/portraits/women/45.jpg", ageGroup: "Teen Legends Division (13–17)", recordId: "bench-press", profileId: "jamal-carter" },
    { name: "Tyler Durden", country: "United States", category: "Strength", value: "290 KG", scoreNumeric: 290, date: "2026-03-10", event: "Deadlift", state: "New York", avatar: "https://randomuser.me/api/portraits/men/22.jpg", ageGroup: "Adult Division (18–49)", recordId: "deadlifts", profileId: "leo-vance" },
    { name: "David Goggins", country: "United States", category: "Endurance", value: "17h 45m", scoreNumeric: 1745, date: "2026-05-01", event: "100 Mile Trail Run", state: "Indiana", avatar: "https://randomuser.me/api/portraits/men/33.jpg", ageGroup: "Masters Division (50+)", recordId: "plank-holds", profileId: "jamal-carter" },
    { name: "Rich Roll", country: "United States", category: "Endurance", value: "19h 12m", scoreNumeric: 1912, date: "2026-02-14", event: "Ultra Tri-distance", state: "Hawaii", avatar: "https://randomuser.me/api/portraits/men/64.jpg", ageGroup: "Masters Division (50+)", recordId: "plank-holds", profileId: "leo-vance" },
    { name: "Max Park", country: "United States", category: "Gaming", value: "3.13 Sec", scoreNumeric: 313, date: "2026-05-19", event: "3x3 Rubik Solve", state: "California", avatar: "https://randomuser.me/api/portraits/men/90.jpg", ageGroup: "Adult Division (18–49)", recordId: "rubik-s-cube", profileId: "jamal-carter" },
    { name: "Christian Coleman", country: "United States", category: "Athletics", value: "9.76 Sec", scoreNumeric: 976, date: "2026-01-22", event: "100m Sprint", state: "Georgia", avatar: "https://randomuser.me/api/portraits/men/4.jpg", ageGroup: "Adult Division (18–49)", recordId: "sprinting", profileId: "jamal-carter" },
    
    { name: "Mitchell Hooper", country: "Canada", category: "Strength", value: "440 KG", scoreNumeric: 440, date: "2026-04-18", event: "Max Deadlift", state: "Ontario", avatar: "https://randomuser.me/api/portraits/men/55.jpg", ageGroup: "Adult Division (18–49)", recordId: "deadlifts", profileId: "leo-vance" },
    { name: "Jean-Francois", country: "Canada", category: "Strength", value: "410 KG", scoreNumeric: 410, date: "2026-03-05", event: "Atlas Stones", state: "Quebec", avatar: "https://randomuser.me/api/portraits/men/71.jpg", ageGroup: "Adult Division (18–49)", recordId: "bench-press", profileId: "leo-vance" },
    { name: "Lionel Sanders", country: "Canada", category: "Endurance", value: "7h 44m", scoreNumeric: 744, date: "2026-05-11", event: "Ironman distance", state: "Ontario", avatar: "https://randomuser.me/api/portraits/men/11.jpg", ageGroup: "Adult Division (18–49)", recordId: "plank-holds", profileId: "jamal-carter" },
    
    { name: "Eddie Hall", country: "United Kingdom", category: "Strength", value: "500 KG", scoreNumeric: 500, date: "2026-02-18", event: "Deadlift Max", state: "Staffordshire", avatar: "https://randomuser.me/api/portraits/men/12.jpg", ageGroup: "Adult Division (18–49)", recordId: "deadlifts", profileId: "leo-vance" },
    { name: "Tom Stoltman", country: "United Kingdom", category: "Strength", value: "286 KG", scoreNumeric: 286, date: "2026-05-01", event: "Atlas Stones", state: "Scotland", avatar: "https://randomuser.me/api/portraits/men/47.jpg", ageGroup: "Adult Division (18–49)", recordId: "bench-press", profileId: "leo-vance" },
    { name: "Alistair Brownlee", country: "United Kingdom", category: "Endurance", value: "1h 45m", scoreNumeric: 145, date: "2026-03-12", event: "Olympic Triathlon", state: "Yorkshire", avatar: "https://randomuser.me/api/portraits/men/29.jpg", ageGroup: "Adult Division (18–49)", recordId: "plank-holds", profileId: "leo-vance" },
    { name: "Timmy Jenkins", country: "United Kingdom", category: "Gaming", value: "12,500 Pts", scoreNumeric: 12500, date: "2026-05-18", event: "Arcade High Score", state: "London", avatar: "https://randomuser.me/api/portraits/men/19.jpg", ageGroup: "Junior Champions Division (5–12)", recordId: "rubik-s-cube", profileId: "jamal-carter" }
  ];

  const [recordsData, setRecordsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocalRecords = async () => {
      try {
        setLoading(true);
        // Using the main records endpoint to get all verified records
        const data = await apiCall('/records', 'GET');
        
        if (data && Array.isArray(data)) {
          const mapped = data.map(r => ({
            name: r.user?.name || r.user?.username || "Unknown Athlete",
            country: "United States", // Defaulting since we don't store country on user table
            category: r.category || "General",
            value: `${r.value} ${r.unit}`,
            scoreNumeric: parseFloat(r.value) || 0,
            date: r.date_set ? new Date(r.date_set).toISOString().split('T')[0] : "2026-05-18",
            event: r.title || "Record Event",
            state: r.city || "Local Area", // Using city as fallback
            avatar: r.user?.profile_image 
              ? (r.user.profile_image.includes('http') ? r.user.profile_image : formatProductImage(`/uploads/${r.user.profile_image}`))
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user?.name || "Athlete")}&background=FF6A00&color=fff`,
            ageGroup: "Adult Division (18–49)", // Defaulting
            recordId: r.id,
            profileId: r.user_id
          }));
          setRecordsData(mapped);
        }
      } catch (err) {
        console.error("Error fetching local records:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocalRecords();
  }, []);

  const getRankings = () => {
    let list = recordsData.filter(item => item.country === selectedCountry && item.category === activeCategory);
    
    if (activeAgeGroup !== "All Ages") {
      list = list.filter(item => item.ageGroup === activeAgeGroup);
    }
    
    if (searchQuery) {
      list = list.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.state.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeSort === "Highest Score") {
      list.sort((a, b) => b.scoreNumeric - a.scoreNumeric);
    } else if (activeSort === "Newest Records") {
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return list.map((item, index) => ({ ...item, rank: index + 1 }));
  };

  const currentRankings = getRankings();

  return (
    <PageTransition>
      <div style={{ background: "#050505", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />


        {/* HERO SECTION */}
        <section style={{ padding: "180px 5% 60px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "400px", background: "linear-gradient(to bottom, rgba(255,106,0,0.05) 0%, transparent 100%)", pointerEvents: "none" }} />
          
          <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span style={{ fontSize: "11px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.2em", textTransform: "uppercase" }}>National & Local Divisions</span>
            </div>
            
            <h1 style={{ fontSize: "clamp(44px, 7vw, 90px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.95", marginBottom: "32px" }}>
              LOCAL<br />
              <span style={{ color: "#FF6A00" }}>LEADERBOARDS</span>
            </h1>
            
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.5)", maxWidth: "650px", lineHeight: "1.6" }}>
              Compete on your home turf. Filter by country, division, and age group to find top local record breakers and assert your local dominance.
            </p>
          </div>
        </section>

        {/* COUNTRY SELECTOR */}
        <section style={{ padding: "0 5% 40px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "24px", marginBottom: "60px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontSize: "16px", fontWeight: "900", color: "white" }}>Select Region:</div>
              <CustomSelect 
                label="Country" 
                value={selectedCountry} 
                onChange={setSelectedCountry} 
                options={countries.map(c => c.name)} 
              />
            </div>
          </div>
        </section>

        {/* DETAILS SECTION */}
        <section style={{ padding: "0 5% 120px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "48px", alignItems: "start" }}>
              
              {/* Left Sidebar Category selectors */}
              <aside style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "20px" }}>
                <h4 style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", padding: "0 12px 16px" }}>DISCIPLINE</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        background: activeCategory === cat ? "rgba(255,106,0,0.1)" : "transparent",
                        color: activeCategory === cat ? "#FF6A00" : "white",
                        border: "none",
                        padding: "12px 20px",
                        borderRadius: "14px",
                        fontWeight: "800",
                        fontSize: "13px",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => {
                        if(activeCategory !== cat) e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                      }}
                      onMouseLeave={e => {
                        if(activeCategory !== cat) e.currentTarget.style.background = "transparent"
                      }}
                    >
                      {cat}
                      <ChevronRight size={14} style={{ opacity: activeCategory === cat ? 1 : 0 }} />
                    </button>
                  ))}
                </div>
              </aside>

              {/* Right Main Table */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "20px" }}>
                  <h2 style={{ fontSize: "28px", fontWeight: "950", textTransform: "uppercase", lineHeight: "1.2" }}>
                    {selectedCountry} — {activeCategory}
                  </h2>
                </div>

                {/* Local Filters */}
                <div style={{ 
                  display: "flex", 
                  marginBottom: "32px", 
                  gap: "16px",
                  flexWrap: "wrap",
                  background: "rgba(255,255,255,0.02)",
                  padding: "16px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}>
                  <CustomSelect label="Age Group" value={activeAgeGroup} onChange={setActiveAgeGroup} options={ageGroups} />
                  <CustomSelect label="Sort By" value={activeSort} onChange={setActiveSort} options={sortOptions} />
                  
                  <div style={{ position: "relative", minWidth: "200px", flex: "1" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Search Local</label>
                    <Search style={{ position: "absolute", left: "16px", top: "35px", color: "rgba(255,255,255,0.3)" }} size={16} />
                    <input
                      type="text"
                      placeholder="Athlete or Event..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "12px",
                        padding: "12px 20px 12px 40px",
                        fontSize: "13px",
                        fontWeight: "800",
                        outline: "none",
                        color: "white",
                        transition: "all 0.2s"
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = "#FF6A00"}
                      onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}
                    />
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.01)", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", minHeight: "200px", position: "relative" }}>
                  {loading ? (
                    <div style={{ padding: "80px 40px", textAlign: "center" }}>
                      <div className="loader" style={{ margin: "0 auto 16px", border: "2px solid rgba(255,106,0,0.2)", borderTop: "2px solid #FF6A00", borderRadius: "50%", width: "30px", height: "30px", animation: "spin 1s linear infinite" }}></div>
                      <h3 style={{ fontSize: "16px", fontWeight: "800", color: "rgba(255,255,255,0.7)" }}>Loading local athletes...</h3>
                    </div>
                  ) : currentRankings.length > 0 ? (
                    currentRankings.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => navigate(`/profile/${r.profileId}`)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "80px 1.5fr 200px 150px",
                          padding: "24px 32px",
                          alignItems: "center",
                          borderBottom: i === currentRankings.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)",
                          background: i === 0 && activeSort === "Highest Score" ? "rgba(255,106,0,0.02)" : "transparent",
                          transition: "background 0.3s ease",
                          cursor: "pointer"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,106,0,0.05)";
                          const recordValEl = e.currentTarget.querySelector(".record-hover-value");
                          if (recordValEl) recordValEl.style.color = "#FF6A00";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = i === 0 && activeSort === "Highest Score" ? "rgba(255,106,0,0.02)" : "transparent";
                          const recordValEl = e.currentTarget.querySelector(".record-hover-value");
                          if (recordValEl) recordValEl.style.color = "white";
                        }}
                      >
                        <div style={{ fontSize: "24px", fontWeight: "950", color: i === 0 && activeSort === "Highest Score" ? "#FF6A00" : "rgba(255,255,255,0.2)" }}>
                          #{r.rank}
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (r.profileId) navigate(`/profile/${r.profileId}`);
                          }}
                          style={{
                            background: "transparent", border: "none", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", padding: 0 }}
                          onMouseEnter={(e) => {
                            const nameEl = e.currentTarget.querySelector(".athlete-hover-name");
                            if (nameEl) nameEl.style.color = "#FF6A00";
                          }}
                          onMouseLeave={(e) => {
                            const nameEl = e.currentTarget.querySelector(".athlete-hover-name");
                            if (nameEl) nameEl.style.color = "white";
                          }}
                        >
                          <img loading="lazy" decoding="async" src={r.avatar} alt={r.name} style={{ width: "48px", height: "48px", borderRadius: "14px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                          <div>
                            <div className="athlete-hover-name" style={{ fontSize: "16px", fontWeight: "800", transition: "color 0.2s", textAlign: "left" }}>{r.name}</div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                              <MapPin size={10} color="#FF6A00" /> {r.state}
                            </div>
                          </div>
                        </button>
 
                        <div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>{r.event}</div>
                          <div style={{ fontSize: "11px", fontWeight: "800", color: "#FF6A00", background: "rgba(255,106,0,0.1)", padding: "4px 8px", borderRadius: "6px", display: "inline-block", textTransform: "uppercase" }}>
                            {r.ageGroup.split(" (")[0]}
                          </div>
                        </div>
 
                        <div style={{ textAlign: "right" }}>
                          <div className="record-hover-value" style={{ fontSize: "20px", fontWeight: "950", color: "white", transition: "color 0.2s" }}>{r.value}</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: "700" }}>{r.date}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "80px 40px", textAlign: "center" }}>
                      <Trophy size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: "16px" }} />
                      <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "8px" }}>No rankings recorded yet</h3>
                      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", maxWidth: "400px", margin: "0 auto 24px" }}>
                        Be the pioneer in your region! Record your athletic evidence and hold the prime spot in the {selectedCountry} leaderboard.
                      </p>
                      <Link to="/verify" style={{ textDecoration: "none" }}>
                        <button style={{ background: "#FF6A00", color: "white", padding: "14px 32px", borderRadius: "100px", border: "none", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>
                          Claim Prime Rank
                        </button>
                      </Link>
                    </div>
                  )}
                </div>

                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", marginTop: "24px", textAlign: "center" }}>
                  * Local leaderboards are refreshed in real-time under multi-stage regional IP audits.
                </p>
              </div>

            </div>
          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default LocalLeaderboards;
