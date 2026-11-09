import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Trophy, Calendar, MapPin, User, ShieldCheck, Share2, Play, ChevronLeft, ChevronRight } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { apiCall, formatProductImage, API_URL } from "../utils/api";

const RecordDetail = () => {
  const { id } = useParams();
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [isPlayingMain, setIsPlayingMain] = useState(false);
  const [showAllAttempts, setShowAllAttempts] = useState(false);
  const scrollRef = useRef(null);
  const videoPlayerRef = useRef(null);

  const scrollAttempts = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Scroll video player into view when playing
  useEffect(() => {
    if (isPlayingMain && videoPlayerRef.current) {
      setTimeout(() => {
        videoPlayerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isPlayingMain]);

  useEffect(() => {
    if (showAllAttempts) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAllAttempts]);

  const [recordData, setRecordData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const data = await apiCall(`/records/${id}`);
        setRecordData(data);
      } catch (err) {
        console.error("Failed to fetch record", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchRecord();
    }
  }, [id]);

  if (loading) {
    return (
      <PageTransition>
        <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "900", color: "#FF6A00", letterSpacing: "2px" }}>LOADING RECORD...</div>
        </div>
      </PageTransition>
    );
  }

  if (!recordData) {
    return (
      <PageTransition>
        <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px" }}>
          <div style={{ fontSize: "24px", fontWeight: "900", color: "#EF4444", letterSpacing: "2px" }}>RECORD NOT FOUND</div>
          <Link to="/explore" style={{ color: "#FF6A00", textDecoration: "none", fontWeight: "800", fontSize: "14px" }}>RETURN TO EXPLORE</Link>
        </div>
      </PageTransition>
    );
  }

  const record = {
    id: recordData.id,
    title: recordData.title || "Untitled",
    value: `${recordData.value || ""} ${recordData.unit || ""}`.trim(),
    athlete: recordData.user?.name || recordData.user?.display_name || "Unknown Athlete",
    memberNumber: recordData.athlete_id || "",
    date: recordData.date_set ? new Date(recordData.date_set).toLocaleDateString() : (recordData.created_at ? new Date(recordData.created_at).toLocaleDateString() : ""),
    location: [recordData.venue_name, recordData.city].filter(Boolean).join(", ") || "Unknown Location",
    cat: recordData.category || "General",
    img: recordData.thumbnail_url && recordData.thumbnail_url !== "pending_upload" ? formatProductImage(recordData.thumbnail_url) : "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    desc: recordData.description || "No description provided.",
    evidenceUrl: recordData.video_url || recordData.evidence_url,
    status: recordData.status || "pending"
  };

  const getStatusPriority = (status) => {
    if (!status) return 99;
    const s = status.toUpperCase();
    if (s.includes("CURRENT") || s.includes("VERIFIED")) return 1;
    if (s.includes("PENDING")) return 2;
    if (s.includes("APPROVED") || s.includes("BROKEN")) return 3;
    if (s.includes("FAILED")) return 4;
    return 99;
  };

  // Mock attempts history based on current record
  const mockAttempts = [
    { id: 1, name: record.athlete, memberNumber: record.memberNumber, value: record.value, date: record.date, status: "CURRENT RECORD", img: record.img, color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { id: 2, name: "Daniel Kim", memberNumber: "AWR-883920", value: "Pending Verification", date: "May 12, 2024", status: "PENDING REVIEW", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
    { id: 3, name: "Liam Thompson", memberNumber: "AWR-293810", value: "Failed - Rule 3B", date: "May 14, 2024", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
    { id: 4, name: "Alex Rodriguez", memberNumber: "AWR-192837", value: "Failed - Time Limit", date: "May 13, 2024", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
    { id: 5, name: "James Walker", memberNumber: "AWR-485920", value: "Broken (Previous)", date: "May 10, 2024", status: "BROKEN", img: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=400&q=80", color: "#9CA3AF", bg: "rgba(156, 163, 175, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
    { id: 6, name: "Ethan Hunt", memberNumber: "AWR-007007", value: "Failed - Form Violation", date: "May 15, 2024", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
    { id: 7, name: "Sarah Connor", memberNumber: "AWR-800101", value: "Failed - Equipment Issue", date: "May 16, 2024", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { id: 8, name: "Marcus Johnson", memberNumber: "AWR-384910", value: "Failed - Incomplete Rep", date: "May 18, 2024", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
    { id: 9, name: "David Chen", memberNumber: "AWR-902182", value: "Failed - Disqualified", date: "May 19, 2024", status: "FAILED ATTEMPT", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" }
  ];

  const attempts = mockAttempts.sort((a, b) => {
    const pA = getStatusPriority(a.status);
    const pB = getStatusPriority(b.status);
    if (pA !== pB) return pA - pB;
    const dA = new Date(a.date).getTime() || 0;
    const dB = new Date(b.date).getTime() || 0;
    return dB - dA;
  });

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingTop: "80px" }}>
        <Navbar />


        {/* HERO SECTION */}
        <section style={{ position: "relative", height: "70vh", minHeight: "500px", overflow: "hidden" }}>
          <img loading="lazy" decoding="async" src={record.img} alt={record.title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,10,10,0.4) 0%, #0A0A0A 100%)" }} />
          
          <div style={{ position: "absolute", bottom: "60px", left: "5%", right: "5%", maxWidth: "1400px", margin: "0 auto" }}>
            
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              <span style={{ background: "#FF6A00", color: "white", padding: "4px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase" }}>{record.cat}</span>
              <span style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", color: "white", padding: "4px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase" }}>OFFICIALLY VERIFIED</span>
            </div>

            <h1 style={{ fontSize: "clamp(40px, 6vw, 80px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "1.0", marginBottom: "24px" }}>
              <ScrollReveal>{record.title}</ScrollReveal>
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "40px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FF6A00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "900" }}>{record.athlete ? record.athlete[0] : ""}</div>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "800" }}>ATHLETE</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "18px", fontWeight: "900" }}>{record.athlete}</div>
                    {record.memberNumber && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.03)", padding: "3px 10px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize: "8px", color: "#FF5500", fontWeight: "900", letterSpacing: "0.5px", textTransform: "uppercase" }}>MID:</span>
                        <span style={{ fontSize: "10px", color: "#fff", fontWeight: "800", letterSpacing: "0.5px" }}>{record.memberNumber}</span>
                        <div style={{ display: "inline-flex", background: "rgba(34, 197, 94, 0.15)", borderRadius: "50%", padding: "1.5px", border: "1px solid rgba(34, 197, 94, 0.3)" }} title="Verified Member">
                          <svg viewBox="0 0 24 24" width="8" height="8" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(record.memberNumber);
                            alert(`Member ID (${record.memberNumber}) copied to clipboard!`);
                          }}
                          style={{ background: "none", border: "none", color: "#FF5500", padding: 0, margin: "0 0 0 2px", cursor: "pointer", display: "flex", alignItems: "center" }}
                          title="Copy Member Number"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "800" }}>RECORD VALUE</div>
                <div style={{ fontSize: "32px", fontWeight: "950", color: "#FF6A00" }}>{record.value}</div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT GRID */}
        <section style={{ padding: "120px 5% 80px 5%", maxWidth: "1400px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "60px" }}>
          
          {/* LEFT: DETAILS & VIDEO */}
          <div style={{ minWidth: 0 }}>
            <div style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "48px", marginBottom: "40px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "950", textTransform: "uppercase", marginBottom: "24px" }}>RECORD STORY</h2>
              <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.8", marginBottom: "40px" }}>
                {record.desc}
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <Calendar size={24} color="#FF6A00" />
                  <div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "800" }}>DATE ACHIEVED</div>
                    <div style={{ fontSize: "16px", fontWeight: "800" }}>{record.date}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <MapPin size={24} color="#FF6A00" />
                  <div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "800" }}>LOCATION</div>
                    <div style={{ fontSize: "16px", fontWeight: "800" }}>{record.location}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* VIDEO PLAYER */}
            <div ref={videoPlayerRef} style={{ position: "relative", borderRadius: "32px", overflow: "hidden", aspectRatio: "16/9", background: "#111", border: "1px solid rgba(255,255,255,0.05)", scrollMarginTop: "200px" }}>
              {!isPlayingMain ? (
                <>
                  <img loading="lazy" decoding="async" src={record.img} alt="Video Thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div 
                      onClick={() => setIsPlayingMain(true)}
                      style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#FF6A00", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 0 40px rgba(255,106,0,0.4)" }}>
                      <Play fill="white" size={32} />
                    </div>
                    <span style={{ marginTop: "20px", fontSize: "12px", fontWeight: "900", letterSpacing: "0.2em" }}>WATCH ATTEMPT FOOTAGE</span>
                  </div>
                </>
              ) : (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <button
                    onClick={() => setIsPlayingMain(false)}
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      zIndex: 10,
                      background: "rgba(0,0,0,0.6)",
                      border: "none",
                      color: "white",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "20px",
                      fontWeight: "bold"
                    }}
                  >✕</button>
                  {(() => {
                    const url = record.evidenceUrl;
                    if (!url || url === "pending_upload") {
                      return <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'rgba(255,255,255,0.5)', gap: '20px', padding: '40px'}}>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>Video Evidence Not Available</div>
                        <div style={{ fontSize: '14px', opacity: 0.7 }}>This record is pending video verification</div>
                      </div>;
                    }
                    
                    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
                    if (ytMatch) {
                      return (
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ border: 'none', width: '100%', height: '100%' }}
                        ></iframe>
                      );
                    }
                    
                    // Handle local uploaded videos
                    let videoUrl = url;
                    if (!url.startsWith('http')) {
                      const backendUrl = API_URL.replace('/api', '');
                      videoUrl = `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
                    }
                    
                    return (
                      <video 
                        src={videoUrl} 
                        controls 
                        autoPlay 
                        style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                        onError={(e) => {
                          console.error('Video failed to load:', videoUrl);
                          e.target.parentElement.innerHTML = '<div style="display: flex; height: 100%; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); flex-direction: column; gap: 20px; padding: 40px;"><div style="font-size: 18px; font-weight: 700;">Video Failed to Load</div><div style="font-size: 12px; opacity: 0.7; word-break: break-all;">' + videoUrl + '</div></div>';
                        }}
                      />
                    );
                  })()}
                </div>
              )}
            </div>

            {/* ATTEMPT HISTORY SECTION */}
            <div style={{ marginTop: "40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>ATTEMPT HISTORY</h3>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>See how other members have attempted to break this record.</p>
                </div>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAllAttempts(true); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6A00", fontSize: "12px", fontWeight: "800", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>
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
                  onClick={() => scrollAttempts('left')}
                  className="attempt-nav-btn left"
                  aria-label="Previous Attempt"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Right Navigation Arrow */}
                <button 
                  type="button"
                  onClick={() => scrollAttempts('right')}
                  className="attempt-nav-btn right"
                  aria-label="Next Attempt"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Attempt horizontal scroll list */}
                <div 
                  ref={scrollRef}
                  className="attempt-history-scroll" 
                  style={{ 
                    display: "flex", 
                    gap: "16px", 
                    overflowX: "auto", 
                    paddingBottom: "20px",
                    scrollBehavior: "smooth",
                    WebkitOverflowScrolling: "touch"
                  }}
                >
                
                {attempts.map(attempt => {
                  const isSelected = selectedAttempt?.id === attempt.id;
                  return (
                    <div key={attempt.id} 
                      onClick={(e) => { e.stopPropagation(); setSelectedAttempt(attempt); }}
                      style={{ 
                        flex: "0 0 240px", 
                        background: "#161616", 
                        borderRadius: "16px", 
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
                      <div style={{ position: "relative", height: "135px" }}>
                        <img loading="lazy" decoding="async" src={attempt.img} alt={attempt.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
                            <Play fill="white" size={16} />
                          </div>
                        </div>
                        <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.8)", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                          0:00
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div style={{ padding: "16px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "800", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{attempt.name}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{attempt.value}</div>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "600" }}>{attempt.date}</div>
                          <div style={{ fontSize: "9px", fontWeight: "900", padding: "4px 8px", borderRadius: "4px", background: attempt.bg, color: attempt.color, textTransform: "uppercase" }}>
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

          {/* RIGHT: VERIFICATION & STATS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* VERIFICATION CARD */}
            <div style={{ background: "linear-gradient(135deg, #FF6A00, #FF3D00)", borderRadius: "32px", padding: "40px", color: "white" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <ShieldCheck size={32} />
                <h3 style={{ fontSize: "20px", fontWeight: "950", textTransform: "uppercase" }}>AMPEX VERIFIED</h3>
              </div>
              <p style={{ fontSize: "14px", fontWeight: "600", lineHeight: "1.6", opacity: 0.9, marginBottom: "32px" }}>
                This record has passed the AMPEX World Records multi-stage verification protocol, including AI biometric analysis and environment validation.
              </p>
              <div style={{ background: "rgba(0,0,0,0.1)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: "900", opacity: 0.7, marginBottom: "12px" }}>VERIFICATION ID</div>
                <div style={{ fontSize: "16px", fontWeight: "900", letterSpacing: "0.1em" }}>RWR-992384-ELITE</div>
              </div>
            </div>

            {/* PERFORMANCE METRICS */}
            <div style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "950", textTransform: "uppercase", marginBottom: "24px", color: "rgba(255,255,255,0.4)" }}>PERFORMANCE METRICS</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                  { label: "Heart Rate (Peak)", val: "182 BPM" },
                  { label: "Execution Time", val: record.value },
                  { label: "Adjudication Score", val: "9.8/10" }
                ].map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.4)" }}>{m.label}</span>
                    <span style={{ fontSize: "14px", fontWeight: "900" }}>{m.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CHALLENGE CARD */}
            <div style={{ 
              background: "rgba(255, 106, 0, 0.03)", 
              border: "2px dashed rgba(255, 106, 0, 0.3)", 
              borderRadius: "32px", 
              padding: "40px", 
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <Trophy size={48} color="#FF6A00" style={{ marginBottom: "20px" }} />
              <h3 style={{ fontSize: "20px", fontWeight: "950", textTransform: "uppercase", marginBottom: "12px" }}>BEAT THIS RECORD?</h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", marginBottom: "28px" }}>
                Think you have what it takes to break this world record? Submit your attempt and enter the global hall of fame.
              </p>
              <Link to={`/challenge-verify?recordId=${encodeURIComponent(record.id)}&record=${encodeURIComponent(record.title)}`} style={{ textDecoration: "none", width: "100%" }}>
                <button style={{ 
                  background: "#FF6A00", 
                  color: "white", 
                  width: "100%",
                  padding: "18px 32px", 
                  borderRadius: "100px", 
                  border: "none", 
                  fontSize: "14px", 
                  fontWeight: "900", 
                  textTransform: "uppercase", 
                  cursor: "pointer",
                  transition: "all 0.3s",
                  boxShadow: "0 10px 20px rgba(255,106,0,0.2)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e55e00";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#FF6A00";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                >
                  CHALLENGE THIS RECORD
                </button>
              </Link>
            </div>

          </div>
        </section>

        <Footer />

        {/* ALL ATTEMPTS OVERLAY */}
        {showAllAttempts && (
          <div data-lenis-prevent="true" style={{
            position: "fixed",
            inset: 0,
            background: "#0A0A0A",
            zIndex: 9900,
            overflowY: "auto",
            padding: "80px 5%"
          }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAllAttempts(false); }} 
                style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FF6A00", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "800", textTransform: "uppercase", marginBottom: "40px" }}>
                <ArrowLeft size={16} /> BACK TO RECORD DETAIL
              </button>

              <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px", color: "white" }}>
                ALL ATTEMPTS: <span style={{ color: "#FF6A00" }}>{record.title}</span>
              </h1>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", marginBottom: "40px" }}>Browse all verification attempts submitted by members for this specific record.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "32px" }}>
                {attempts.map(attempt => (
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
            zIndex: 10000,
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
                      
                      {selectedAttempt.memberNumber && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.03)", padding: "4px 12px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "12px" }}>
                          <span style={{ fontSize: "9px", color: "#FF5500", fontWeight: "900", letterSpacing: "0.5px", textTransform: "uppercase" }}>MID:</span>
                          <span style={{ fontSize: "11px", color: "#fff", fontWeight: "800", letterSpacing: "0.5px" }}>{selectedAttempt.memberNumber}</span>
                          <div style={{ display: "inline-flex", background: "rgba(34, 197, 94, 0.15)", borderRadius: "50%", padding: "2px", border: "1px solid rgba(34, 197, 94, 0.3)" }} title="Verified Member">
                            <svg viewBox="0 0 24 24" width="10" height="10" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(selectedAttempt.memberNumber);
                              alert(`Member ID (${selectedAttempt.memberNumber}) copied to clipboard!`);
                            }}
                            style={{ background: "none", border: "none", color: "#FF5500", padding: 0, margin: "0 0 0 4px", cursor: "pointer", display: "flex", alignItems: "center" }}
                            title="Copy Member Number"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          </button>
                        </div>
                      )}

                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", fontWeight: "600", marginTop: selectedAttempt.memberNumber ? "0px" : "8px" }}>Attempt Date: <strong style={{ color: "white" }}>{selectedAttempt.date}</strong></p>
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

export default RecordDetail;
