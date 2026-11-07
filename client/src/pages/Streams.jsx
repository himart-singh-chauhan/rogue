import React from "react";
import { Link } from "react-router-dom";
import { Play, Eye, Search, ArrowRight, Activity, Dumbbell, Timer, Target, Trophy, Gamepad2, Waves, Zap, Brain } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

const Streams = () => {
  const [activeFilter, setActiveFilter] = React.useState("ALL LIVE");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [localStreams, setLocalStreams] = React.useState([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('rogue_live_streams');
      if (stored) {
        setLocalStreams(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const allStreams = [
    {
      id: 1,
      title: "EXTREME CALISTHENICS WORLD RECORD ATTEMPT",
      viewers: "12.4K",
      category: "STRENGTH",
      img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
      athlete: "MARCUS VANCE"
    },
    {
      id: 2,
      title: "FASTEST 100M SAND SPRINT - LIVE FINALS",
      viewers: "8.2K",
      category: "SPEED",
      img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80",
      athlete: "JAMAL CARTER"
    },
    {
      id: 3,
      title: "PRO GAMING: RETRO TETRIS MAX SCORE RUN",
      viewers: "4.1K",
      category: "GAMING",
      img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
      athlete: "NOVA ONE"
    },
    {
      id: 4,
      title: "HEAVIEST DEADLIFT ATTEMPT - IRON ARENA",
      viewers: "15.9K",
      category: "STRENGTH",
      img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
      athlete: "THOR B."
    }
  ];

  const combinedStreams = [...localStreams, ...allStreams];

  const filteredStreams = combinedStreams.filter(stream => {
    const matchesFilter = activeFilter === "ALL LIVE" || stream.category === activeFilter;
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          stream.athlete.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterOptions = ["ALL LIVE", "STRENGTH", "SPEED", "GAMING"];

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />

        <div style={{ padding: "140px 5% 120px", maxWidth: "1400px", margin: "0 auto" }}>
          
          <header style={{ marginBottom: "60px" }}>
            <div style={{ color: "#FF6A00", fontWeight: "800", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "16px" }}>
              LIVE BROADCASTS
            </div>
            <h1 style={{ fontSize: "clamp(40px, 6vw, 80px)", fontWeight: "950", textTransform: "uppercase", marginBottom: "24px", lineHeight: "1", color: "white" }}>
              CURRENTLY STREAMING
            </h1>
            <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: "500px" }}>
                <Search size={18} style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search live streams or athletes..." 
                  style={{ width: "100%", background: "#161616", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "100px", padding: "16px 20px 16px 50px", color: "white", fontSize: "14px", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {filterOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setActiveFilter(opt)}
                    style={{ 
                      padding: "12px 24px", 
                      borderRadius: "100px", 
                      background: activeFilter === opt ? "#FF6A00" : "rgba(255,255,255,0.05)", 
                      color: activeFilter === opt ? "white" : "rgba(255,255,255,0.5)", 
                      fontSize: "11px", 
                      fontWeight: "900",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {filteredStreams.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "32px" }}>
              {filteredStreams.map(stream => (
                <Link key={stream.id} to={`/stream/${stream.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "#161616", borderRadius: "32px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", transition: "all 0.3s ease" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-10px)"; e.currentTarget.style.borderColor = "rgba(255,106,0,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}>
                    <div style={{ position: "relative", height: "240px" }}>
                      <img loading="lazy" decoding="async" src={stream.img} alt={stream.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", top: "20px", left: "20px", background: stream.streamType === 'schedule' ? "#FF5500" : "#ef4444", color: "white", padding: "6px 14px", borderRadius: "8px", fontWeight: "900", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", boxShadow: stream.streamType === 'schedule' ? "0 4px 12px rgba(255,85,0,0.4)" : "0 4px 12px rgba(239,68,68,0.4)" }}>
                        {stream.streamType === 'schedule' ? <Timer size={12} /> : <Play size={12} fill="white" />} 
                        {stream.streamType === 'schedule' ? "SCHEDULED" : "LIVE"}
                      </div>
                      
                      {stream.pricing === 'paid' && (
                        <div style={{ position: "absolute", top: "20px", right: stream.viewers ? "100px" : "20px", background: "#FFaa00", color: "#000", padding: "6px 14px", borderRadius: "8px", fontWeight: "900", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                          PAID (${stream.ticketPrice})
                        </div>
                      )}
                      
                      {stream.viewers && (
                        <div style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "white", padding: "6px 14px", borderRadius: "8px", fontWeight: "900", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Eye size={14} /> {stream.viewers}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "32px" }}>
                      <div style={{ color: "#FF6A00", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.1em" }}>{stream.category} • {stream.athlete}</div>
                      <h3 style={{ fontSize: "20px", fontWeight: "950", lineHeight: "1.3", textTransform: "uppercase" }}>{stream.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "100px 0", background: "#111", borderRadius: "32px", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "18px", color: "rgba(255,255,255,0.3)", fontWeight: "700" }}>NO LIVE STREAMS FOUND FOR THIS CATEGORY</div>
            </div>
          )}

        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Streams;
