import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Play, Lock, Unlock, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { apiCall } from "../utils/api";

const Challenges = () => {
  const [categories, setCategories] = useState(["ALL"]);
  const [challengeCards, setChallengeCards] = useState([]);
  const [featuredChallenge, setFeaturedChallenge] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await apiCall('/records', 'GET');
        const mappedRecords = data.map(record => ({
          id: record.id,
          title: record.title || "Unknown Record",
          holder: record.user?.name || "Unknown Holder",
          cat: (record.category || "UNCATEGORIZED").toUpperCase(),
          subcat: record.subcategory || "General",
          score: record.unit_of_measurement ? `${record.performance_metrics} ${record.unit_of_measurement}` : (record.performance_metrics || "N/A"),
          dateVerified: record.date_of_attempt ? new Date(record.date_of_attempt).toLocaleDateString() : "Unknown",
          description: record.description || "No description provided.",
          rules: record.rules ? record.rules.split("\n") : ["Official rules apply.", "Must provide uncut video evidence.", "Follow all safety guidelines."],
          videoUrl: record.evidence_url || record.video_url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          participants: Math.floor(Math.random() * 1000) + 100,
          difficulty: "HARD",
          img: record.thumbnail_url || record.image_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
          status: record.status
        }));
        
        setChallengeCards(mappedRecords);
        const uniqueCats = ["ALL", ...new Set(mappedRecords.map(r => r.cat))];
        setCategories(uniqueCats);
        
        const localStatsStr = localStorage.getItem("rogue_local_stats");
        let featuredId = null;
        if (localStatsStr) {
           const localStats = JSON.parse(localStatsStr);
           const featuredKeys = Object.keys(localStats).filter(k => localStats[k].isFeatured);
           if (featuredKeys.length > 0) {
             featuredId = featuredKeys[0].replace('rogue_stat_', '');
           }
        }
        
        const featured = featuredId ? mappedRecords.find(r => r.id === featuredId) : mappedRecords[0];
        if (featured) setFeaturedChallenge(featured);
      } catch (error) {
        console.error("Failed to fetch challenges:", error);
      }
    };
    fetchRecords();
  }, []);

  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [hasWatched, setHasWatched] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  const challengeScrollRef = useRef(null);

  const scrollChallengeAttempts = (direction) => {
    if (challengeScrollRef.current) {
      const scrollAmount = 300;
      challengeScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (selectedChallenge || selectedAttempt || showAllAttempts) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedChallenge, selectedAttempt, showAllAttempts]);

  const filteredChallenges = activeTab === "ALL" 
    ? challengeCards 
    : challengeCards.filter(c => c.cat === activeTab);

  const handleVideoTimeUpdate = (e) => {
    if (e.target.currentTime > 2 && !hasWatched) {
      setHasWatched(true);
    }
  };

  const handleVideoPlay = () => {
    setHasWatched(true);
  };

  const handleVideoEnded = () => {
    setHasWatched(true);
  };

  const getMockAttempts = (challenge) => {
    const attempts = [
      { id: 1, name: "James Walker", value: "35 Bounces", date: "May 16, 2026", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
      { id: 2, name: "Alex Rodriguez", value: "34 Bounces", date: "May 15, 2026", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
      { id: 3, name: "Liam Thompson", value: "35 Bounces", date: "May 14, 2026", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
      { id: 4, name: "Daniel Kim", value: "36 Bounces", date: "May 12, 2026", status: "PENDING REVIEW", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
      { id: 5, name: challenge ? challenge.holder : "Pavol Durdik", value: challenge ? challenge.score : "36 Bounces", date: "May 12, 2026", status: "CURRENT RECORD", img: challenge ? challenge.img : "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=400&q=80", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", videoUrl: challenge ? challenge.videoUrl : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
      { id: 6, name: "Ethan Hunt", value: "32 Bounces", date: "May 18, 2026", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
      { id: 7, name: "Sarah Connor", value: "30 Bounces", date: "May 19, 2026", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
      { id: 8, name: "Marcus Johnson", value: "31 Bounces", date: "May 20, 2026", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
      { id: 9, name: "David Chen", value: "Disqualified", date: "May 21, 2026", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" }
    ];

    const getStatusPriority = (status) => {
      if (!status) return 99;
      const s = status.toUpperCase();
      if (s.includes("CURRENT")) return 1;
      if (s.includes("PENDING")) return 2;
      if (s.includes("APPROVED") || s.includes("BROKEN")) return 3;
      if (s.includes("FAILED")) return 4;
      return 99;
    };

    return attempts.sort((a, b) => {
      const pA = getStatusPriority(a.status);
      const pB = getStatusPriority(b.status);
      if (pA !== pB) return pA - pB;
      const dA = new Date(a.date).getTime() || 0;
      const dB = new Date(b.date).getTime() || 0;
      return dB - dA;
    });
  };

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", fontFamily: "'Inter', sans-serif", minHeight: "100vh", paddingTop: "0", display: "flex", flexDirection: "column" }}>
        
        {/* NAVBAR */}
        <Navbar />
        <PageNav breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Challenges' }]} />

        {/* TOP HEADER - ACTIVE CHALLENGES */}
        <div style={{ padding: "40px 5% 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "900", textTransform: "uppercase", color: "#FF6A00", letterSpacing: "0.1em" }}>ACTIVE CHALLENGES</h2>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: "700" }}>{filteredChallenges.length} AVAILABLE</span>
        </div>

        {/* MINI CHALLENGE CARDS */}
        <div style={{ padding: "0 5% 60px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {[
            { title: "1000M ROW SPRINT", tag: "ELITE STATUS", progress: "40%" },
            { title: "ROGUE PLANK HOLD", tag: "TIME TRIAL", progress: "75%" }
          ].map((c, idx) => (
            <div key={idx} style={{ background: "#161616", padding: "20px 24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", width: "240px" }}>
              <div style={{ fontSize: "9px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>{c.tag}</div>
              <div style={{ fontSize: "14px", fontWeight: "800", marginBottom: "16px" }}>{c.title}</div>
              <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px" }}>
                <div style={{ width: c.progress, height: "100%", background: "#FF6A00", borderRadius: "2px" }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* HERO SECTION - FEATURED CHALLENGE */}
        {featuredChallenge && (
          <div style={{ position: "relative", height: "600px", margin: "0 5%", borderRadius: "40px", overflow: "hidden", display: "flex", alignItems: "center" }}>
            <img loading="lazy" decoding="async" 
              src={featuredChallenge.img} 
              alt="Featured Challenge" 
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6)" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,10,10,0.9), transparent)" }} />
            
            <div style={{ position: "relative", zIndex: 2, padding: "0 80px" }}>
              <div style={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: "16px", letterSpacing: "0.1em" }}>
                CHALLENGE OF THE MONTH
              </div>
              <h1 style={{ fontSize: "clamp(48px, 8vw, 96px)", fontWeight: "950", textTransform: "uppercase", lineHeight: "0.9", letterSpacing: "-0.04em", marginBottom: "20px" }}>
                <ScrollReveal>{featuredChallenge.title.split(' ')[0]}</ScrollReveal> <br />
                <span style={{ color: "#FF6A00" }}><ScrollReveal>{featuredChallenge.title.split(' ').slice(1).join(' ')}</ScrollReveal></span>
              </h1>
              
              <div style={{ display: "flex", gap: "40px", marginBottom: "40px" }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>PARTICIPANTS</div>
                  <div style={{ fontSize: "18px", fontWeight: "900" }}>{featuredChallenge.participants}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>DIFFICULTY</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#FF6A00" }}>{featuredChallenge.difficulty}</div>
                </div>
              </div>
  
              <button 
                onClick={() => { setSelectedChallenge(featuredChallenge); setHasWatched(false); }}
                style={{
                  background: "#FF6A00",
                  color: "white",
                  border: "none",
                  borderRadius: "100px",
                  padding: "20px 48px",
                  fontSize: "15px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  boxShadow: "0 10px 30px rgba(255,106,0,0.4)",
                  transition: "all 0.3s"
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                CHALLENGE RECORD <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div style={{ padding: "80px 5% 40px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{ 
                padding: "10px 24px", 
                borderRadius: "100px", 
                background: activeTab === cat ? "#FF6A00" : "rgba(255, 255, 255, 0.05)", 
                color: activeTab === cat ? "white" : "rgba(255, 255, 255, 0.5)", 
                border: "none", 
                fontSize: "11px", 
                fontWeight: "900", 
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* CHALLENGE GRID */}
        <div style={{ padding: "0 5% 100px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(500px, 1fr))", gap: "32px" }}>
          {filteredChallenges.map((card) => (
            <div 
              key={card.id} 
              onClick={() => { setSelectedChallenge(card); setHasWatched(false); }}
              style={{ position: "relative", height: "300px", borderRadius: "24px", overflow: "hidden", cursor: "pointer" }}
            >
              <img loading="lazy" decoding="async" src={card.img} alt={card.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,10,0.9), transparent)" }} />
              
              <div style={{ position: "absolute", top: "16px", left: "16px", display: "flex", gap: "8px" }}>
                <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "4px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: "900" }}>{card.difficulty} LEVEL</div>
                <div style={{ background: "rgba(255,106,0,0.2)", color: "#FF6A00", padding: "4px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: "900" }}>{card.participants} PARTICIPATING</div>
              </div>

              <div style={{ position: "absolute", bottom: "32px", left: "32px", right: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <h3 style={{ fontSize: "28px", fontWeight: "900", textTransform: "uppercase" }}>{card.title}</h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedChallenge(card);
                    setHasWatched(false);
                  }}
                  style={{
                    background: "#FF6A00",
                    color: "white",
                    border: "none",
                    borderRadius: "100px",
                    padding: "12px 28px",
                    fontSize: "11px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 5px 15px rgba(255,106,0,0.3)",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  CHALLENGE RECORD <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* DETAILED CHALLENGE OVERLAY MODAL */}
        {selectedChallenge && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.95)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "40px"
          }}>
            <div style={{
              background: "#121212",
              border: "1px solid rgba(255, 106, 0, 0.2)",
              borderRadius: "40px",
              width: "100%",
              maxWidth: "1150px",
              height: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 50px 100px rgba(0,0,0,0.8)"
            }}>
              {/* Close Button */}
              <button 
                onClick={() => {
                  setSelectedChallenge(null);
                  setHasWatched(false);
                }}
                style={{
                  position: "absolute",
                  top: "24px",
                  right: "24px",
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                  zIndex: 10,
                  fontSize: "18px",
                  fontWeight: "bold"
                }}
              >
                ✕
              </button>

              {/* Content Top Part */}
              <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
                {/* Video Player Side */}
                <div style={{ flex: "1.2", background: "black", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", overflow: "hidden" }}>
                {(() => {
                  const src = selectedChallenge.videoUrl || '';
                  const isYouTube = src.includes('youtube') || src.includes('youtu.be');
                  if (isYouTube) {
                    const youtubeId = src.includes('youtube.com/watch?v=') 
                      ? src.split('v=')[1]?.split('&')[0] 
                      : (src.includes('youtu.be/') ? src.split('youtu.be/')[1]?.split('?')[0] : null);
                    
                    return (
                      <iframe 
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen 
                        style={{ width: "100%", height: "100%", objectFit: "cover", border: "none" }}
                        onLoad={() => {
                          setTimeout(() => setHasWatched(true), 3000);
                        }}
                      />
                    );
                  }
                  
                  return (
                    <video
                      src={src}
                      controls
                      autoPlay
                      onPlay={handleVideoPlay}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onEnded={handleVideoEnded}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  );
                })()}
                {!hasWatched && (
                  <div style={{
                    position: "absolute",
                    top: "24px",
                    left: "24px",
                    background: "rgba(0,0,0,0.75)",
                    border: "1px solid #FF6A00",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: "900",
                    color: "#FF6A00",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <Lock size={12} /> Watch video to unlock challenge
                  </div>
                )}
                {hasWatched && (
                  <div style={{
                    position: "absolute",
                    top: "24px",
                    left: "24px",
                    background: "rgba(34, 197, 94, 0.95)",
                    border: "1px solid #22c55e",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: "900",
                    color: "white",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <CheckCircle2 size={12} /> Record Watched - Challenge Unlocked
                  </div>
                )}
              </div>

                {/* Record Metadata Side */}
                <div style={{ flex: "1", overflowY: "auto", height: "100%" }}>
                  <div style={{ padding: "40px 50px", display: "flex", flexDirection: "column", gap: "28px", textAlign: "left" }}>
                    <div>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                        <span style={{ background: "rgba(255,106,0,0.1)", color: "#FF6A00", fontSize: "10px", fontWeight: "900", padding: "4px 12px", borderRadius: "100px", textTransform: "uppercase" }}>{selectedChallenge.cat}</span>
                        <span style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", fontSize: "10px", fontWeight: "900", padding: "4px 12px", borderRadius: "100px" }}>{selectedChallenge.subcat}</span>
                      </div>
                      <h2 style={{ fontSize: "36px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.02em", color: "white", lineHeight: "1.1" }}>{selectedChallenge.title}</h2>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", marginTop: "8px" }}>Record Holder: <strong style={{ color: "white" }}>{selectedChallenge.holder}</strong></p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "20px", borderRadius: "16px" }}>
                      <div>
                        <div style={{ fontSize: "9px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Official Score</div>
                        <div style={{ fontSize: "18px", fontWeight: "950", color: "#FF6A00" }}>{selectedChallenge.score}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "9px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Date Verified</div>
                        <div style={{ fontSize: "16px", fontWeight: "800", color: "white" }}>{selectedChallenge.dateVerified}</div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>DESCRIPTION</h4>
                      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>{selectedChallenge.description}</p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>OFFICIAL RULES</h4>
                      <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {selectedChallenge.rules.map((rule, idx) => (
                          <li key={idx} style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.5" }}>{rule}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ marginTop: "auto", paddingTop: "20px" }}>
                      {hasWatched ? (
                        <Link to="/challenge-verify" style={{ textDecoration: "none" }}>
                          <button style={{
                            width: "100%",
                            background: "#FF6A00",
                            color: "white",
                            border: "none",
                            borderRadius: "100px",
                            padding: "20px",
                            fontSize: "14px",
                            fontWeight: "900",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            boxShadow: "0 10px 20px rgba(255,106,0,0.3)",
                            transition: "0.3s"
                          }}>
                            CHALLENGE THIS RECORD <ArrowRight size={18} />
                          </button>
                        </Link>
                      ) : (
                        <button 
                          disabled
                          style={{
                            width: "100%",
                            background: "rgba(255,255,255,0.03)",
                            color: "rgba(255,255,255,0.25)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: "100px",
                            padding: "20px",
                            fontSize: "14px",
                            fontWeight: "900",
                            textTransform: "uppercase",
                            cursor: "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px"
                          }}
                        >
                          <Lock size={14} /> WATCH RECORD VIDEO TO CHALLENGE
                        </button>
                      )}
                    </div>
                  </div>
                </div>
            </div>            {/* ATTEMPT HISTORY SECTION */}
            <div style={{ background: "#080808", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "24px 40px", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>ATTEMPT HISTORY</h3>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>See how other members have attempted to break this record.</p>
                </div>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAllAttempts(true); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6A00", fontSize: "11px", fontWeight: "800", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>
                  VIEW ALL ATTEMPTS {">"}
                </button>
              </div>

              <div className="attempt-history-container">
                <style>{`
                  .attempt-history-scroll::-webkit-scrollbar {
                    display: none;
                  }
                  .attempt-history-scroll {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                  }
                  .attempt-history-container {
                    position: relative;
                    padding: 0 44px;
                    transition: padding 0.3s ease;
                  }
                  .attempt-nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(0, 0, 0, 0.75);
                    border: 1px solid rgba(255, 106, 0, 0.3);
                    color: white;
                    border-radius: 50%;
                    width: 38px;
                    height: 38px;
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                    cursor: pointer;
                    zIndex: 2;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    transition: all 0.2s ease-in-out;
                  }
                  .attempt-nav-btn:hover {
                    transform: translateY(-50%) scale(1.1);
                    border-color: #FF6A00;
                    box-shadow: 0 0 12px rgba(255, 106, 0, 0.5);
                  }
                  .attempt-nav-btn:active {
                    transform: translateY(-50%) scale(0.95);
                  }
                  .attempt-nav-btn.left {
                    left: 0;
                  }
                  .attempt-nav-btn.right {
                    right: 0;
                  }

                  @media (max-width: 768px) {
                    .attempt-history-container {
                      padding: 0 32px;
                    }
                    .attempt-nav-btn {
                      width: 32px;
                      height: 32px;
                    }
                  }
                  @media (max-width: 480px) {
                    .attempt-history-container {
                      padding: 0 24px;
                    }
                    .attempt-nav-btn {
                      width: 28px;
                      height: 28px;
                    }
                  }
                `}</style>

                {/* Left Navigation Arrow */}
                <button 
                  type="button"
                  onClick={() => scrollChallengeAttempts('left')}
                  className="attempt-nav-btn left"
                  aria-label="Previous Attempt"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Right Navigation Arrow */}
                <button 
                  type="button"
                  onClick={() => scrollChallengeAttempts('right')}
                  className="attempt-nav-btn right"
                  aria-label="Next Attempt"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Attempt horizontal scroll list */}
                <div 
                  ref={challengeScrollRef}
                  className="attempt-history-scroll" 
                  style={{ 
                    display: "flex", 
                    gap: "16px", 
                    overflowX: "auto", 
                    paddingBottom: "12px",
                    scrollBehavior: "smooth",
                    WebkitOverflowScrolling: "touch"
                  }}
                >
                  
                  {getMockAttempts(selectedChallenge).map(attempt => {
                    const isSelected = selectedAttempt?.id === attempt.id;
                    return (
                      <div key={attempt.id} 
                        onClick={(e) => { e.stopPropagation(); setSelectedAttempt(attempt); }}
                        style={{ 
                          flex: "0 0 200px", 
                          width: "200px",
                          background: "#161616", 
                          borderRadius: "12px", 
                          overflow: "hidden", 
                          border: isSelected ? "2px solid #FF6A00" : (attempt.status === "CURRENT RECORD" ? "1px solid #10B981" : "1px solid rgba(255,255,255,0.05)"),
                          boxShadow: isSelected ? "0 0 15px rgba(255,106,0,0.3)" : "none",
                          transform: isSelected ? "translateY(-2px)" : "translateY(0)",
                          cursor: "pointer",
                          transition: "all 0.25s ease"
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.borderColor = "rgba(255, 106, 0, 0.4)";
                            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.4)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.borderColor = attempt.status === "CURRENT RECORD" ? "#10B981" : "rgba(255,255,255,0.05)";
                            e.currentTarget.style.boxShadow = "none";
                          }
                        }}
                      >
                        {/* Thumbnail */}
                        <div style={{ position: "relative", height: "100px" }}>
                          <img loading="lazy" decoding="async" src={attempt.img} alt={attempt.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
                              <Play fill="white" size={12} />
                            </div>
                          </div>
                          <div style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.8)", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "700" }}>
                            0:00
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div style={{ padding: "12px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "800", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textTransform: "uppercase" }}>{attempt.name}</div>
                          <div style={{ fontSize: "11px", color: "#FF6A00", fontWeight: "700", marginBottom: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{attempt.value}</div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: "600" }}>{attempt.date}</div>
                            <div style={{ fontSize: "8px", fontWeight: "900", padding: "3px 6px", borderRadius: "4px", background: attempt.bg, color: attempt.color, textTransform: "uppercase" }}>
                              {attempt.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

        {/* ALL ATTEMPTS OVERLAY */}
        {showAllAttempts && selectedChallenge && (
          <div data-lenis-prevent="true" style={{
            position: "fixed",
            inset: 0,
            background: "#0A0A0A",
            zIndex: 10000,
            overflowY: "auto",
            padding: "80px 5%"
          }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAllAttempts(false); }} 
                style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FF6A00", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "800", textTransform: "uppercase", marginBottom: "40px" }}>
                <ArrowLeft size={16} /> BACK TO CHALLENGE DETAIL
              </button>

              <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px", color: "white" }}>
                ALL ATTEMPTS: <span style={{ color: "#FF6A00" }}>{selectedChallenge.title}</span>
              </h1>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", marginBottom: "40px" }}>Browse all verification attempts submitted by members for this specific record.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "32px" }}>
                {getMockAttempts(selectedChallenge).map(attempt => (
                  <div key={attempt.id} 
                    onClick={(e) => { e.stopPropagation(); setSelectedAttempt(attempt); }}
                    style={{ 
                      background: "#161616", 
                      borderRadius: "16px", 
                      overflow: "hidden", 
                      border: attempt.status === "CURRENT RECORD" ? "1px solid #10B981" : "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    >
                    {/* Thumbnail */}
                    <div style={{ position: "relative", height: "180px" }}>
                      <img loading="lazy" decoding="async" src={attempt.img} alt={attempt.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
                          <Play fill="white" size={24} />
                        </div>
                      </div>
                      <div style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(0,0,0,0.8)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "700" }}>
                        0:00
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div style={{ padding: "24px" }}>
                      <div style={{ fontSize: "18px", fontWeight: "900", marginBottom: "8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textTransform: "uppercase", color: "white" }}>{attempt.name}</div>
                      <div style={{ fontSize: "16px", color: "#FF6A00", fontWeight: "800", marginBottom: "16px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{attempt.value}</div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: "700" }}>{attempt.date}</div>
                        <div style={{ fontSize: "10px", fontWeight: "900", padding: "6px 10px", borderRadius: "4px", background: attempt.bg, color: attempt.color, textTransform: "uppercase" }}>
                          {attempt.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <Footer />

        {/* ATTEMPT VIDEO MODAL */}
        {selectedAttempt && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.95)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
            padding: "40px"
          }}>
            <div style={{
              background: "#121212",
              border: `1px solid ${selectedAttempt.color || '#FF6A00'}`,
              borderRadius: "40px",
              width: "100%",
              maxWidth: "1150px",
              height: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 50px 100px rgba(0,0,0,0.8)"
            }}>
              <button 
                onClick={() => setSelectedAttempt(null)}
                style={{
                  position: "absolute",
                  top: "24px",
                  right: "24px",
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                  zIndex: 10,
                  fontSize: "18px",
                  fontWeight: "bold"
                }}
              >✕</button>
              <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
                <div style={{ flex: "1.2", background: "black", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", overflow: "hidden" }}>
                  <video
                    key={selectedAttempt.id}
                    src={selectedAttempt.videoUrl}
                    controls
                    autoPlay
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
                <div data-lenis-prevent="true" style={{ flex: "1", overflowY: "auto", height: "100%", background: "#161616" }}>
                  <div style={{ padding: "40px 50px", display: "flex", flexDirection: "column", gap: "28px", textAlign: "left" }}>
                    <div>
                      <span style={{ background: selectedAttempt.bg, color: selectedAttempt.color, fontSize: "12px", fontWeight: "900", padding: "6px 16px", borderRadius: "100px", textTransform: "uppercase" }}>{selectedAttempt.status}</span>
                      <h2 style={{ fontSize: "32px", fontWeight: "950", textTransform: "uppercase", color: "white", lineHeight: "1.1", marginTop: "24px", marginBottom: "8px" }}>{selectedAttempt.name}</h2>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", fontWeight: "600" }}>Attempt Date: <strong style={{ color: "white" }}>{selectedAttempt.date}</strong></p>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "24px", borderRadius: "16px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Recorded Score / Result</div>
                      <div style={{ fontSize: "24px", fontWeight: "950", color: selectedAttempt.color }}>{selectedAttempt.value}</div>
                    </div>

                    {selectedAttempt.img && (
                      <div>
                        <h4 style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>ATTEMPT THUMBNAIL</h4>
                        <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <img loading="lazy" decoding="async" src={selectedAttempt.img} alt={selectedAttempt.name} style={{ width: "100%", height: "auto", display: "block" }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Challenges;
