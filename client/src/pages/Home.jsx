import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Play, Check, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Menu, X, Dumbbell, Zap, Timer, Gamepad2, Target, Infinity, Trophy, LayoutGrid, Activity, Waves, Settings, Brain, Gamepad, Search, Eye, Volume2, Maximize, Bike, Star, Palette, Baby, Globe } from "lucide-react";
import { apiCall, formatProductImage } from "../utils/api";
import SponsorBanner from "../components/SponsorBanner";
import InfiniteSlider from "../components/InfiniteSlider";
import FlowingMenu from "../components/FlowingMenu";
import StackingSteps from "../components/StackingSteps";
import DecryptedText from "../components/DecryptedText";
import ScrollReveal from "../components/ScrollReveal";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ─────────────────────────────────────────────────────────
   REUSABLE SUB-COMPONENTS
───────────────────────────────────────────────────────── */

const NewestCard = ({ img, cat, title, avatar, name, value, slug }) => {
  const cardSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return (
    <Link to={`/record/${cardSlug}`} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
      <div
        className="holder-card"
        style={{
          width: '100%',
          height: '360px',
          cursor: 'pointer',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(255,106,0,0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <img loading="lazy" decoding="async" src={img} alt={title} className="holder-card-img" />
        <div className="holder-card-gradient" />
        <div className="holder-side-strip" />
        <div className="holder-card-top">
          <span className="holder-badge-pill">{cat}</span>
          <span className="holder-rank-num">NEW</span>
        </div>
        <div className="holder-card-bottom">
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '12px', lineHeight: '1.2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img loading="lazy" decoding="async" src={avatar} alt={name} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #FF6A00' }} />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>{name}</span>
            </div>
            <div style={{ color: '#FF6A00', fontWeight: '900', fontSize: '15px' }}>{value}</div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const RecCard = ({ img, cat, title, by }) => (
  <div className="rec-card">
    <img loading="lazy" decoding="async" src={img} alt={title} className="rec-card-img" />
    <div className="rec-card-overlay" />
    <div className="rec-card-top">
      <span className="rec-card-cat">{cat}</span>
      <span className="rec-card-new">NEW</span>
    </div>
    <div className="rec-card-bottom">
      <div className="rec-card-title">{title}</div>
      <div className="rec-card-by">by {by}</div>
    </div>
  </div>
);

const HolderCard = ({ img, badge, name, records, rank, slug, username }) => {
  const recordSlug = slug || "stair-climbing";
  return (
    <div className="holder-card" style={{ position: "relative" }}>
      {/* Full-card background image */}
      <img loading="lazy" decoding="async" src={img} alt={name} className="holder-card-img" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", zIndex: 0 }} />

      {/* Full-card dark gradient overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.30) 70%, rgba(0,0,0,0.10) 100%)",
        zIndex: 1,
        pointerEvents: "none"
      }} />

      {/* Play button overlay (clickable) */}
      <Link to={`/record/${recordSlug}`} style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          className="play-icon-circle"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.65)",
            border: "1.5px solid rgba(255,255,255,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FF6A00",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.15)";
            e.currentTarget.style.boxShadow = "0 0 25px rgba(255,106,0,0.6)";
            e.currentTarget.style.borderColor = "#FF6A00";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
          }}
        >
          <Play size={16} fill="#FF6A00" style={{ marginLeft: "2px" }} />
        </div>
      </Link>

      {/* Side orange accent strip */}
      <div className="holder-side-strip" style={{ zIndex: 3 }} />

      {/* Badge + Rank */}
      <div className="holder-card-top" style={{ zIndex: 3 }}>
        <span className="holder-badge-pill">{badge}</span>
        <span className="holder-rank-num">#{String(rank).padStart(2, "0")}</span>
      </div>

      {/* Bottom text panel with explicit dark background */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 18px 18px",
          background: "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.90) 55%, rgba(0,0,0,0.0) 100%)",
          borderTop: "1.5px solid rgba(255,106,0,0.4)",
          zIndex: 3,
          boxSizing: "border-box"
        }}
      >
        <div style={{ fontSize: "17px", fontWeight: "900", color: "#ffffff", marginBottom: "3px", textShadow: "0 1px 8px rgba(0,0,0,0.9)", letterSpacing: "-0.01em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{records}</div>
        <div style={{ fontSize: "13px", color: "#FF6A00", marginBottom: "10px", fontWeight: "700" }}>By {name}</div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
          <Link to={`/profile/${username || name.toLowerCase().replace(/\s+/g, '-')}`} style={{ textDecoration: "none" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "800", color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.08em", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#FF6A00"}
            >
              Profile <ArrowRight style={{ width: 10, height: 10 }} />
            </div>
          </Link>
          <Link to={`/record/${recordSlug}`} style={{ textDecoration: "none" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "800", color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.08em", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#FF6A00"}
            >
              Watch Record <Play size={10} fill="#FF6A00" style={{ display: "inline-block" }} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};



const AnimatedStat = ({ end, suffix, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isVisible) return;
    let timer;
    let animationFrame;

    // Check if loading screen is still present to delay the count up
    const checkLoadingAndStart = () => {
      // Find element with zIndex 9999 that App.jsx uses for loading screen
      const isLoading = Array.from(document.querySelectorAll('div')).some(el => el.style.zIndex === '9999');
      if (isLoading) {
        timer = setTimeout(checkLoadingAndStart, 200);
      } else {
        startAnimation();
      }
    };

    const startAnimation = () => {
      let startTime = null;
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        setCount(Math.floor(easeOutQuad * end));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(step);
        }
      };
      animationFrame = requestAnimationFrame(step);
    };

    // A small buffer to avoid jitter right when it unmounts
    timer = setTimeout(checkLoadingAndStart, 100);

    return () => {
      clearTimeout(timer);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isVisible, end, duration]);

  return (
    <div ref={ref} className="hero-v3-mini-num">
      {count}{suffix}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */

// Removed dummy data - only real database records will be shown
const STATIC_NEWEST = [];

const STATIC_FEATURED = [
  { img: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=700&q=80", badge: "Strength", name: "Leo Vance", records: "4", rank: 2, slug: "deadlifts" },
  { img: "https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&w=800&q=80", badge: "Speed", name: "Jamal Carter", records: "7", rank: 1, slug: "sprinting" },
  { img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=700&q=80", badge: "Endurance", name: "Elena Petrov", records: "2", rank: 4, slug: "plank-holds" },
  { img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=700&q=80", badge: "Gym", name: "Iron K.", records: "5", rank: 3, slug: "bench-press" },
  { img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80", badge: "Track", name: "Marcus S.", records: "3", rank: 5, slug: "stair-climbing" }
];


// "https://youtu.be/ID?si=..", "watch?v=ID", "/embed/ID", "/shorts/ID", "/live/ID" -> ID
const youtubeIdFrom = (url = "") => {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

const Home = () => {
  const navigate = useNavigate();
  const [showAllCats, setShowAllCats] = useState(false);
  const [showCats, setShowCats] = useState(true);
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const [featuredStream, setFeaturedStream] = useState(null);

  // Live homepage data from admin controls
  const [newestRecords, setNewestRecords] = useState(STATIC_NEWEST);
  const [featuredHolders, setFeaturedHolders] = useState(STATIC_FEATURED);
  // Sidebar: admin "Featured videos" win; otherwise featured records. Kept apart so the two
  // requests can't overwrite each other (the list used to switch depending on which finished last).
  const [adminSidebarVideos, setAdminSidebarVideos] = useState([]);
  const [recordSidebarVideos, setRecordSidebarVideos] = useState([]);
  const sidebarVideos = adminSidebarVideos.length ? adminSidebarVideos : recordSidebarVideos;
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => {
    // Fetch live homepage records from admin controls
    const fetchHomepageData = async () => {
      try {
        const sections = await apiCall("/records/explore/homepage-sections", "GET");
        if (sections) {
          // Newest / Newly Verified records - limit to 10, sorted by newest
          const newlyVerified = sections.newly_verified || [];
          const recentUploads = sections.recent_uploads || [];
          const combinedNewest = [...newlyVerified, ...recentUploads]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10);
          if (combinedNewest.length > 0) {
            setNewestRecords(combinedNewest.map((r, i) => ({
              img: r.thumbnail_url !== "pending_upload" ? formatProductImage(r.thumbnail_url) : "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
              cat: (r.category || "RECORD").toUpperCase(),
              title: r.title,
              avatar: r.user?.profile_image ? (r.user.profile_image.includes('http') ? r.user.profile_image : formatProductImage(`/uploads/${r.user.profile_image}`)) : "https://ui-avatars.com/api/?name=" + encodeURIComponent(r.user?.name || "Athlete") + "&background=FF6A00&color=fff",
              name: r.user?.display_name || r.user?.name || "Verified Athlete",
              username: r.user?.username || r.user?.name,
              value: `${r.value} ${r.unit}`,
              slug: r.id
            })));
          }

          // Featured + Top Ranked records
          let locallyFeaturedIds = [];
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('rogue_stat_')) {
                const stat = JSON.parse(localStorage.getItem(key));
                if (stat && stat.isFeatured) {
                  locallyFeaturedIds.push(key.replace('rogue_stat_', ''));
                }
              }
            }
          } catch (e) {}

          let finalFeaturedRecords = [];

          if (locallyFeaturedIds.length > 0) {
            try {
              const allData = await apiCall('/records/explore/all', 'GET');
              if (allData && allData.records) {
                finalFeaturedRecords = allData.records.filter(r => locallyFeaturedIds.includes(r.id));
              }
            } catch (e) {
              console.error("Failed to fetch all records for featured filtering", e);
            }
          }

          if (finalFeaturedRecords.length === 0) {
            const featuredRecs = sections.featured || [];
            const topRanked = sections.top_ranked || [];
            const seen = new Set();
            finalFeaturedRecords = [...featuredRecs, ...topRanked].filter((r) => {
              if (!r || seen.has(r.id)) return false;
              seen.add(r.id);
              return true;
            });
          }

          if (finalFeaturedRecords.length > 0) {
            setFeaturedHolders(finalFeaturedRecords.map((r, i) => ({
              img: r.thumbnail_url !== "pending_upload" ? formatProductImage(r.thumbnail_url) : (STATIC_FEATURED[i % STATIC_FEATURED.length]?.img || "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=700&q=80"),
              badge: r.category || "Record",
              name: r.user?.display_name || r.user?.name || "Athlete",
              username: r.user?.username || r.user?.name,
              records: r.title, // Use title instead of value for display
              rank: i + 1,
              slug: r.id
            })));

            // Sidebar fallback: real records (used only when no admin featured videos exist)
            setRecordSidebarVideos(finalFeaturedRecords.slice(0, 6).map(r => ({
              time: "1:00", // Default time
              img: r.thumbnail_url !== "pending_upload" ? formatProductImage(r.thumbnail_url) : "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=400&q=80",
              title: r.title || r.name,
              slug: r.id || r.slug
            })));
          }
        }
      } catch (error) {
        // Silently fall back to static data
        console.log("Using static homepage data (admin controls not configured)");
      }
    };

    // Fetch featured videos for sidebar
    const fetchFeaturedVideos = async () => {
      try {
        const videos = await apiCall("/videos/featured", "GET");
        if (videos && videos.length > 0) {
          setAdminSidebarVideos(videos.slice(0, 6).map(v => ({
            isAdminVideo: true,
            source: v.source,
            youtubeId: v.youtube_video_id || youtubeIdFrom(v.video_url),
            time: v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, '0')}` : "0:30",
            img: v.thumbnail_url && v.thumbnail_url !== "pending_upload" ? formatProductImage(v.thumbnail_url) : "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=400&q=80",
            videoUrl: v.video_url,
            title: v.title,
            slug: v.id
          })));
        }
      } catch (error) {
        // Use static sidebar videos
      }
    };

    const fetchFeaturedStream = async () => {
      try {
        const events = await apiCall("/events", "GET");
        if (events && events.length > 0) {
          const featured = events.find(e => e.isLive && e.isFeatured);
          const fallbackFeatured = featured || events.find(e => e.isFeatured);
          if (fallbackFeatured) {
            setFeaturedStream(fallbackFeatured);
          }
        }
      } catch (error) {
        console.error("Failed to load featured stream on homepage:", error);
      }
    };

    fetchHomepageData();
    fetchFeaturedVideos(); // public list (route order fixed on the server)
    fetchFeaturedStream();
  }, []);

  const handleHomeSearch = (e) => {
    e.preventDefault();
    if (homeSearchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(homeSearchQuery.trim())}`);
    }
  };

  const videoRef = React.useRef(null);
  const videoContainerRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration, setDuration] = useState("00:00");
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (videoContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      } else if (videoContainerRef.current.webkitRequestFullscreen) {
        videoContainerRef.current.webkitRequestFullscreen();
      }
    }
  };

  const toggleSpeed = () => {
    if (videoRef.current) {
      const newSpeed = playbackSpeed >= 2 ? 0.5 : playbackSpeed + 0.5;
      videoRef.current.playbackRate = newSpeed;
      setPlaybackSpeed(newSpeed);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);

      const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      setCurrentTime(formatTime(current));
      setDuration(formatTime(total));
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newProgress = clickX / rect.width;
      videoRef.current.currentTime = newProgress * videoRef.current.duration;
      setProgress(newProgress * 100);
    }
  };

  return (
    <div style={{ background: "#FFF8F5", color: "#111", fontFamily: "'Inter', sans-serif", paddingTop: "80px" }}>

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <Navbar />

      {/* 90% width line added just below the navbar */}
      <hr style={{ width: "90%", margin: "0 auto", border: "none", borderTop: "1px solid #ccc" }} />

      {/* ══════════════════ HERO ══════════════════ */}
      <header className="hero hero-v3">
        {/* Dark block behind bottom of image */}
        <div className="hero-v3-bg-block" style={{ background: "#111", height: "320px" }} />

        <div className="container hero-v3-inner" style={{ marginTop: "-40px" }}>

          {/* ── LEFT SIDEBAR (Explore Categories) ── */}
          <aside
            className="hero-v3-sidebar-left"
            style={{ display: "flex", flexDirection: "column", position: "relative", marginTop: "80px" }}
          >
            <div
              onClick={() => navigate("/categories")}
              style={{
                background: "white",
                color: "#111",
                padding: "16px",
                borderRadius: "12px",
                fontWeight: "700",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                border: "1px solid #f0f0f0",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <LayoutGrid style={{ width: 20, height: 20, color: "#FF6A00" }} />
                <span style={{ fontSize: "15px" }}>Explore Categories</span>
              </div>
            </div>

            {showCats && (
              <div style={{
                background: "white",
                padding: "16px",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                marginTop: "12px",
                border: "1px solid #f0f0f0",
                width: "100%",
                zIndex: 10
              }}>
                <nav style={{ display: "flex", flexDirection: "column" }}>
                  {[
                    { name: "Athletics", icon: <Activity style={{ width: 18, height: 18, color: "#FF6A00" }} /> },
                    { name: "Strength", icon: <Dumbbell style={{ width: 18, height: 18, color: "#FF6A00" }} /> },
                    { name: "Endurance", icon: <Timer style={{ width: 18, height: 18, color: "#FF6A00" }} /> },
                    { name: "Balance", icon: <Target style={{ width: 18, height: 18, color: "#FF6A00" }} /> },
                    { name: "Skills", icon: <Trophy style={{ width: 18, height: 18, color: "#FF6A00" }} /> },
                    { name: "Gaming", icon: <Gamepad2 style={{ width: 18, height: 18, color: "#FF6A00" }} /> },
                    { name: "Water Sports", icon: <Waves style={{ width: 18, height: 18, color: "#FF6A00" }} /> },
                    { name: "Reaction", icon: <Zap style={{ width: 18, height: 18, color: "#FF6A00" }} /> },
                    { name: "Mind & Memory", icon: <Brain style={{ width: 18, height: 18, color: "#FF6A00" }} /> },
                    { name: "Action Sports", icon: <Bike style={{ width: 18, height: 18, color: "#FF6A00" }} /> }
                  ].map((cat, i, arr) => (
                    <div key={cat.name} onClick={() => navigate("/categories", { state: { activeTab: i } })} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 8px", cursor: "pointer", borderBottom: i === arr.length - 1 ? "none" : "1px solid #f0f0f0", fontSize: "14px", color: "#111", fontWeight: "600", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#fff8f5"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {cat.icon}
                        <span>{cat.name}</span>
                      </div>
                      <ChevronRight style={{ width: 14, height: 14, color: "#ccc" }} />
                    </div>
                  ))}
                  <div style={{ textAlign: "center", marginTop: "16px", paddingBottom: "8px", borderTop: "1px solid #f0f0f0", paddingTop: "12px" }}>
                    <Link to="/categories" style={{ textDecoration: "none" }}>
                      <span style={{ color: "#FF6A00", fontSize: "14px", fontWeight: "800", cursor: "pointer" }}>View All Categories &gt;</span>
                    </Link>
                  </div>
                </nav>
              </div>
            )}
          </aside>

      {/* Pop-up player for admin featured videos (YouTube or uploaded file) */}
      {playingVideo && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={playingVideo.title || "Video"}
          onClick={() => setPlayingVideo(null)}
          style={{ position: "fixed", inset: 0, zIndex: 100000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: "960px" }}>
            <button
              onClick={() => setPlayingVideo(null)}
              aria-label="Close video"
              style={{ position: "absolute", top: "-44px", right: 0, background: "transparent", border: "none", color: "white", fontSize: "28px", lineHeight: 1, cursor: "pointer", padding: "4px 8px" }}
            >
              ×
            </button>
            <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#000", borderRadius: "12px", overflow: "hidden" }}>
              {playingVideo.youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${playingVideo.youtubeId}?autoplay=1&rel=0&playsinline=1`}
                  title={playingVideo.title || "Video"}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                />
              ) : (
                <video src={playingVideo.videoUrl} controls autoPlay playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
              )}
            </div>
            {playingVideo.title && <div style={{ color: "white", fontWeight: 800, fontSize: "16px", marginTop: "12px" }}>{playingVideo.title}</div>}
          </div>
        </div>,
        document.body
      )}

          {/* ── CENTER HERO CONTENT ── */}
          <main className="hero-v3-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>

            {/* Top: Headline Only */}
            <div className="hero-v3-header" style={{ marginBottom: "32px", width: "100%" }}>
              <h1 className="hero-title hero-v3-title" style={{ fontSize: "clamp(16px, 2.4vw, 32px)", margin: "0 auto", lineHeight: 1.1, letterSpacing: "-0.01em", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontWeight: "900", textTransform: "uppercase" }}>
                <span style={{ color: "#FF6A00" }}>
                  <DecryptedText text="SET" animateOn="inViewHover" speed={75} maxIterations={14} />
                </span>
                <span style={{ color: "#000" }}>
                  <DecryptedText text="RECORD," animateOn="inViewHover" speed={75} maxIterations={14} />
                </span>
                <span style={{ color: "#FF6A00", marginLeft: "4px" }}>
                  <DecryptedText text="BREAK" animateOn="inViewHover" speed={75} maxIterations={14} />
                </span>
                <span style={{ color: "#000" }}>
                  <DecryptedText text="RECORD," animateOn="inViewHover" speed={75} maxIterations={14} />
                </span>
                <span style={{ color: "#FF6A00", marginLeft: "4px" }}>
                  <DecryptedText text="GO" animateOn="inViewHover" speed={75} maxIterations={14} />
                </span>
                <span style={{ color: "#000" }}>
                  <DecryptedText text="LIVE." animateOn="inViewHover" speed={75} maxIterations={14} />
                </span>
              </h1>
            </div>

            {/* Middle: Video Frame */}
            <article ref={videoContainerRef} style={{ width: "100%", height: "550px", marginBottom: "32px", position: "relative", borderRadius: "20px", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", background: "#000" }}>
              <video preload="none"
                ref={videoRef}
                src="https://www.w3schools.com/html/mov_bbb.mp4"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer", opacity: isPlaying ? 1 : 0, transition: "opacity 0.3s ease" }}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                loop
                playsInline
              />

              {!isPlaying && (
                <img loading="lazy" decoding="async"
                  src={featuredStream ? (featuredStream.imageUrl || featuredStream.image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80") : "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80"}
                  alt="Video Thumbnail"
                  onClick={togglePlay}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "pointer", zIndex: 1 }}
                />
              )}

              {/* Left gradient for text readability */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 50%, transparent 100%)", pointerEvents: "none", zIndex: 2 }} />
              {/* Bottom gradient for controls */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)", pointerEvents: "none", zIndex: 2 }} />

              {/* LIVE badge + viewers — top left */}
              <div style={{ position: "absolute", top: 20, left: 20, display: "flex", gap: 12, alignItems: "center", zIndex: 3 }}>
                <div style={{ background: featuredStream && featuredStream.isLive ? "#ef4444" : "#FF6A00", color: "white", padding: "5px 12px", borderRadius: "6px", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.08em", boxShadow: "0 2px 12px rgba(239,68,68,0.5)" }}>
                  <Play size={10} fill="white" /> {featuredStream && featuredStream.isLive ? "LIVE NOW" : "FEATURED EVENT"}
                </div>
                <div style={{ color: "white", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                  <Eye size={15} /> {featuredStream && featuredStream.isLive ? "34.2K VIEWERS" : "SPECTATORS ACTIVE"}
                </div>
              </div>

              {/* Text + Buttons overlay — left center */}
              <div style={{ position: "absolute", left: 48, top: "50%", transform: "translateY(-50%)", maxWidth: 500, textAlign: "left", zIndex: 3 }}>
                <h2 style={{ fontSize: "clamp(30px, 4.5vw, 64px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em", color: "white", marginBottom: 20, textTransform: "uppercase" }}>
                  {featuredStream ? featuredStream.title : (
                    <>
                      Break Limits.<br />
                      <span style={{ color: "#FF6A00" }}>Make History.</span>
                    </>
                  )}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.65, marginBottom: 36 }}>
                  {featuredStream ? featuredStream.description : "The ultimate platform for record breakers, champions, and legends."}
                </p>
                <div style={{ display: "flex", gap: 14 }}>
                  {featuredStream ? (
                    <Link to={`/stream/${featuredStream.id || featuredStream._id}`} style={{ textDecoration: "none" }}>
                      <button
                        style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "12px", padding: "15px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(255,106,0,0.4)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(255,106,0,0.5)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,106,0,0.4)"; }}
                      >
                        <Play size={16} fill="white" /> WATCH LIVE STREAM
                      </button>
                    </Link>
                  ) : (
                    <Link to="/verify" style={{ textDecoration: "none" }}>
                      <button
                        style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "12px", padding: "15px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", boxShadow: "0 4px 20px rgba(255,106,0,0.4)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(255,106,0,0.5)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,106,0,0.4)"; }}
                      >
                        Submit Record
                      </button>
                    </Link>
                  )}
                  <Link to="/explore" style={{ textDecoration: "none" }}>
                    <button
                      style={{ background: "transparent", color: "white", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: "12px", padding: "15px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, backdropFilter: "blur(6px)", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
                    >
                      <Search size={17} /> Explore Records
                    </button>
                  </Link>
                </div>
              </div>

              {/* Bottom Video Controls Bar */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 28px", display: "flex", alignItems: "center", gap: 20, color: "white", zIndex: 10 }}>
                <div onClick={togglePlay} style={{ cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center" }}>
                  {isPlaying ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                  ) : (
                    <Play size={22} fill="white" />
                  )}
                </div>

                <div onClick={toggleMute} style={{ cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center" }}>
                  {isMuted ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                  ) : (
                    <Volume2 size={20} />
                  )}
                </div>

                {/* Progress Bar */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.9, whiteSpace: "nowrap", width: "40px", textAlign: "right" }}>{currentTime}</span>
                  <div onClick={handleProgressClick} style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.25)", borderRadius: 3, position: "relative", cursor: "pointer" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progress}%`, background: "#FF6A00", borderRadius: 3, transition: "width 0.1s linear" }} />
                    <div style={{ position: "absolute", left: `${progress}%`, top: "50%", transform: "translate(-50%, -50%)", width: 14, height: 14, background: "#fff", borderRadius: "50%", boxShadow: "0 0 8px rgba(0,0,0,0.5)", transition: "left 0.1s linear" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.5, whiteSpace: "nowrap", width: "40px" }}>{duration}</span>
                </div>

                <div onClick={toggleSpeed} style={{ cursor: "pointer", opacity: 0.9, flexShrink: 0, display: "flex", alignItems: "center", fontSize: "14px", fontWeight: "700" }}>
                  {playbackSpeed}x
                </div>

                <Maximize onClick={toggleFullscreen} size={18} style={{ cursor: "pointer", opacity: 0.9, flexShrink: 0 }} />
              </div>
            </article>

          </main>

          {/* ── RIGHT SIDEBAR (Live Videos) ── */}
          <aside className="hero-v3-sidebar-right" style={{ display: "flex", flexDirection: "column", height: "600px", marginTop: "80px" }}>
            <div style={{ textAlign: "right", marginBottom: "8px", flexShrink: 0 }}>
              <Link to="/streams" style={{ textDecoration: "none" }}>
                <span style={{ color: "#FF6A00", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>View All Streams &gt;</span>
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", flex: 1 }}>
              {sidebarVideos.map((video, idx) => {
                const recordSlug = video.slug || "deadlifts";
                return (
                  <Link
                    to={`/record/${recordSlug}`}
                    key={video.slug || idx}
                    onClick={(e) => {
                      if (video.isAdminVideo) {
                        e.preventDefault();
                        setPlayingVideo(video);
                      }
                    }}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{ position: "relative", borderRadius: "12px", overflow: "hidden", height: "78px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", cursor: "pointer", flexShrink: 0, transition: "all 0.3s ease" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,106,0,0.4)";
                        const overlay = e.currentTarget.querySelector('.video-overlay');
                        if(overlay) overlay.style.background = "rgba(0,0,0,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                        const overlay = e.currentTarget.querySelector('.video-overlay');
                        if(overlay) overlay.style.background = "rgba(0,0,0,0.3)";
                      }}
                    >
                      <img loading="lazy" decoding="async" src={video.img} alt={video.title || "Live Stream"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <div className="video-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", transition: "background 0.3s ease" }} />
                      <div style={{ position: "absolute", bottom: "8px", left: "12px", color: "white", fontSize: "12px", fontWeight: "700" }}>{video.time}</div>
                      <Play style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#FF6A00", fill: "#FF6A00", width: 40, height: 40, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>

        </div>

        {/* ── FULL-WIDTH FOOTER: Stats + Headline ── */}
        <footer style={{ background: "#111", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 40, padding: "50px 5% 50px", position: "relative", display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px", alignItems: "center" }}>

          {/* Left: Headline & Info */}
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "#FF6A00", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 16 }}>
              The Future of Records
            </div>
            <h2 style={{ fontSize: "clamp(40px, 4vw, 68px)", fontWeight: 900, color: "white", lineHeight: 1.0, marginBottom: 20, letterSpacing: "-0.03em" }}>
              Join the global<br />platform.
            </h2>
            <p style={{ color: "#999", fontSize: 16, lineHeight: 1.6, maxWidth: 420, marginBottom: 24 }}>
              For world record creators and challengers. Prove your greatness to the world and claim your place in history.
            </p>
            <Link to="/global-leaderboard" style={{ textDecoration: "none" }}>
              <button className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "13px" }}>
                View Global Rankings <Globe style={{ width: 14, height: 14 }} />
              </button>
            </Link>
          </div>

          {/* Right: Stats Boxes */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { label: "Records Set", value: 1, suffix: " k+", icon: <Trophy style={{ width: 16, height: 16 }} />, bg: "/assets/stats/records_set_bg.webp" },
              { label: "Countries", value: 1, suffix: "+", icon: <Target style={{ width: 16, height: 16 }} />, bg: "/assets/stats/countries_bg.webp" },
              { label: "Categories", value: 20, suffix: "+", icon: <Zap style={{ width: 16, height: 16 }} />, bg: "/assets/stats/categories_bg.webp" }
            ].map((stat, idx) => (
              <div key={idx} style={{
                background: "#222",
                border: "1.5px solid #FF6A00",
                padding: "20px",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 15px rgba(255,106,0,0.1)",
                aspectRatio: "1 / 1",
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Background Image with low opacity */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${stat.bg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.5,
                  mixBlendMode: 'luminosity',
                  zIndex: 0
                }} />

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ background: "#333", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#FF6A00" }}>
                    {stat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                      <AnimatedStat end={stat.value} suffix={stat.suffix} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", opacity: 1, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Global Leaderboard — absolute bottom right */}
          <Link to="/global-leaderboard" style={{ position: "absolute", bottom: 16, right: 16, textDecoration: "none" }}>
            <div style={{ background: "#FF6A00", padding: "8px 16px", borderRadius: "8px", color: "white", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
              <Activity style={{ width: 14, height: 14 }} /> Global Leaderboard
            </div>
          </Link>
        </footer>

      </header>

      {/* Sponsors from Admin → Sponsorships (renders nothing when none are active) */}
      <SponsorBanner placements={["homepage_top_banner", "homepage", "homepage_sidebar", "featured"]} />

      {/* ══════════════════ NEWEST RECORDS ACHIEVERS ══════════════════ */}
      <section className="section newest-section">
        <div className="container">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
            <div className="section-header-left">
              <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#111", letterSpacing: "-0.5px", display: "flex", alignItems: "center" }}>
                <ScrollReveal>Newest Records</ScrollReveal>
                <span style={{ background: "#FF6A00", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", marginLeft: "12px", verticalAlign: "middle", fontWeight: "bold" }}>NEW</span>
              </h2>
              <p className="section-subtitle" style={{ marginTop: 8, color: '#555', fontSize: '16px' }}>
                <ScrollReveal>Check out the latest records broken around the world.</ScrollReveal>
              </p>
            </div>
            <Link to="/explore" style={{ color: '#FF6A00', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: '15px' }}>
              View All Records <ChevronRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </div>

        <div className="newest-slider-wrap" style={{ marginTop: "20px", position: "relative", width: "100%", overflow: "hidden" }}>
          {/* White gradients at the start and end */}
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "150px", background: "linear-gradient(to right, rgba(255,255,255,0.9) 0%, transparent 100%)", zIndex: 5, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "150px", background: "linear-gradient(to left, rgba(255,255,255,0.9) 0%, transparent 100%)", zIndex: 5, pointerEvents: "none" }} />

          <InfiniteSlider speed={32} gap={24} cardWidth="300px">
            {newestRecords.map((rec, idx) => (
              <NewestCard key={idx} {...rec} />
            ))}
          </InfiniteSlider>
        </div>
      </section>

      {/* ══════════════════ CATEGORIES ══════════════════ */}
      <section className="cat-section" style={{ paddingBottom: "80px" }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div className="section-header-left">
              <h2 className="section-title" style={{ color: "#FF6A00", marginBottom: 8, textAlign: "left" }}><ScrollReveal>Record Categories</ScrollReveal></h2>
              <p className="section-subtitle" style={{ color: "white", textAlign: "left" }}><ScrollReveal>Find your niche. Dominate your field.</ScrollReveal></p>
            </div>
            <span
              onClick={() => setShowAllCats(!showAllCats)}
              style={{
                color: "white",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textTransform: "uppercase",
                transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#FF6A00"}
              onMouseLeave={(e) => e.currentTarget.style.color = "white"}
            >
              {showAllCats ? "Show Fewer" : "See All Categories"} {showAllCats ? <ChevronUp size={14} /> : <ArrowRight size={14} />}
            </span>
          </div>
        </div>

        <div className="container cat-grid-wrap">
          <div className="cat-grid">
            {[
              { i: <Activity />, n: "Athletics", d: "Classic track and field events. Speed, agility, and pure athleticism." },
              { i: <Dumbbell />, n: "Strength", d: "Lift more than anyone on the planet. Pure power, zero excuses." },
              { i: <Timer />, n: "Endurance", d: "Go the distance. Push the absolute limits of human stamina." },
              { i: <Target />, n: "Balance", d: "Steady hands and focus. Mastery of equilibrium in any situation." },
              { i: <Trophy />, n: "Skills", d: "Precision, technique, mastery. Show the world what you can do." },
              { i: <Gamepad2 />, n: "Gaming", d: "From speedruns to high scores. Digital dominance, verified." },
              { i: <Waves />, n: "Water Sports", d: "Dominate the waves. Swimming, surfing, and aquatic achievements." },
              { i: <Zap />, n: "Reaction", d: "Fastest on two feet or four wheels. Every millisecond counts." },
              { i: <Brain />, n: "Mind & Memory", d: "Solve the impossible. Mental feats that defy logic and speed." },
              { i: <Bike />, n: "Action Sports", d: "High-octane performance. Adrenaline-fueled records on the edge." },
              { i: <Star />, n: "Entertainment", d: "Show-stopping performances. Magic, stunts, and stage records." },
              { i: <Palette />, n: "Creative", d: "Art, design, and unique creations. Breaking boundaries through creativity." },
              { i: <Baby />, n: "Youth", d: "Just for the next generation. Safe, fun, and highly competitive." }
            ].slice(0, showAllCats ? 13 : 8).map((cat, i) => (
              <div
                key={i}
                className="cat-cell"
                role="button"
                tabIndex={0}
                onClick={() => navigate('/categories', { state: { activeTab: i } })}
                style={{ cursor: "pointer" }}
              >
                <div className="cat-cell-top">
                  <div className="cat-cell-icon">{cat.i}</div>
                  <h3 className="cat-cell-name">{cat.n}</h3>
                </div>
                <p className="cat-cell-desc" style={{ marginBottom: "20px" }}>{cat.d}</p>
                <div style={{
                  color: "#FF6A00",
                  fontSize: "12px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "auto"
                }}>
                  Learn More <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURED RECORD HOLDERS ══════════════════ */}
      <section className="section holders-section">
        <div className="holders-bg-word"><ScrollReveal>CHAMPIONS</ScrollReveal></div>
        <div className="container">
          <div className="holders-header">
            <div className="holders-header-left">
              <span className="holders-label"><Trophy style={{ width: 14, height: 14 }} /> Top Athletes</span>
              <h2 className="holders-title"><ScrollReveal>Featured Record Holders</ScrollReveal></h2>
              <p className="holders-subtitle"><ScrollReveal>The athletes rewriting history, one record at a time.</ScrollReveal></p>
            </div>
            <Link to="/leaderboard" className="holders-cta">
              View Leaderboard <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>
        </div>
        <div className="slider-wrapper holders-slider-wrapper">
          <InfiniteSlider gap={12} speed={32} reverse={true} cardWidth="260px">
            {featuredHolders.map((holder, idx) => (
              <HolderCard key={idx} {...holder} />
            ))}
          </InfiniteSlider>
        </div>
      </section>

      {/* ══════════════════ COMPETE IN YOUR DIVISION ══════════════════ */}
      <section className="division-flowing">
        <div className="container">
          <div className="section-header center" style={{ marginBottom: 0, paddingBottom: 56 }}>
            <h2 className="section-title" style={{ color: "white" }}><ScrollReveal>Compete in Your Division</ScrollReveal></h2>
            <p className="section-subtitle" style={{ color: "white" }}><ScrollReveal>Age is just a number. But divisions keep it fair.</ScrollReveal></p>
          </div>
        </div>
        <div style={{ height: 600 }}>
          <FlowingMenu
            speed={12}
            items={[
              {
                link: "/leaderboard", text: "2–9", label: "Youth",
                images: [
                  "https://static.vecteezy.com/system/resources/thumbnails/076/981/260/small/young-asian-boy-with-glasses-studying-at-his-desk-for-back-to-school-free-photo.jpeg",
                  "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?auto=format&fit=crop&w=400&q=80",
                  {
                    backgroundImage: "url('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }
                ]
              },
              {
                link: "/leaderboard", text: "10–12", label: "Pre-Teen",
                images: [
                  "https://media.istockphoto.com/id/498211233/photo/young-children-with-bikes-and-scooters-in-park.jpg?s=612x612&w=0&k=20&c=3XXhIYQ3-BeBbcpGLyoWz6JugQUrrR6LmTDisAM78sM=",
                  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=400&q=80",
                  "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=400&q=80"
                ]
              },
              {
                link: "/leaderboard", text: "13–17", label: "Teen",
                images: [
                  "https://media.istockphoto.com/id/2165383037/photo/diverse-group-of-friends-enjoying-summer-outdoors-multicultural-family-bonding-on-wooden.jpg?s=612x612&w=0&k=20&c=yjTbwaD6NBGw30-Gw5sxlKQmFAMswEgs4reo-mY-uDA=",
                  "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=400&q=80",
                  "https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?auto=format&fit=crop&w=400&q=80"
                ]
              },
              {
                link: "/leaderboard", text: "18–35", label: "Young Adult",
                images: [
                  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80",
                  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80",
                  "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=400&q=80"
                ]
              },
              {
                link: "/leaderboard", text: "36–50", label: "Adult",
                images: [
                  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80",
                  "https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&w=400&q=80",
                  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80"
                ]
              },
              {
                link: "/leaderboard", text: "51+", label: "Senior",
                images: [
                  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80",
                  "https://images.unsplash.com/photo-1441123100240-f9f3f77ed41b?auto=format&fit=crop&w=400&q=80",
                  "https://images.unsplash.com/photo-1447005497901-b3e9ee359928?auto=format&fit=crop&w=400&q=80"
                ]
              },
            ]}
          />
        </div>
      </section>

      {/* ══════════════════ PATH TO GLORY — Stacking Cards ══════════════════ */}
      <StackingSteps />

      {/* ══════════════════ DARK CTA ══════════════════ */}
      <section className="section" style={{ background: "#FFF8F5" }}>
        <div className="container">
          <div className="dark-cta">
            <div className="dark-cta-bg">
              <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80" alt="" />
            </div>
            <div className="dark-cta-overlay" />

            {/* Left */}
            <div className="dark-cta-left">
              <div style={{ color: "#FF6A00", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 20 }}>
                Challenge a Record
              </div>
              <h2 style={{ fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 900, color: "white", lineHeight: 1, marginBottom: 24 }}>
                Think you have<br />what it takes?
              </h2>
              <p style={{ color: "#999", fontSize: 17, lineHeight: 1.7, maxWidth: 380, marginBottom: 36 }}>
                <ScrollReveal>Browse our current active records across 20+ categories. Find your niche, submit your evidence, and claim your place in history.</ScrollReveal>
              </p>
              <Link to="/verify" style={{ textDecoration: "none" }}>
                <button className="btn btn-primary" style={{ fontSize: 15, padding: "16px 32px" }}>
                  Submit a Record <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </Link>
            </div>

            {/* Right: Search Bar */}
            <div className="dark-cta-right" style={{ flex: "1" }}>
              <form onSubmit={handleHomeSearch} style={{ position: "relative", maxWidth: "500px" }}>
                <p style={{ color: "#FF6A00", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20 }}>
                  Search Trending Topics
                </p>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Search style={{ position: "absolute", left: 20, color: "#888", width: 20, height: 20 }} />
                  <input
                    type="text"
                    placeholder="Search records, categories, or athletes..."
                    value={homeSearchQuery}
                    onChange={(e) => setHomeSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "16px",
                      padding: "20px 20px 20px 60px",
                      color: "white",
                      fontSize: "16px",
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#FF6A00";
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.boxShadow = "0 10px 40px rgba(255,106,0,0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      position: "absolute",
                      right: 10,
                      background: "#FF6A00",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px 20px",
                      color: "white",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#e65f00"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#FF6A00"}
                  >
                    Find
                  </button>
                </div>
              </form>
              <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span style={{ color: "#666", fontSize: 13 }}>Popular:</span>
                {["#Endurance", "#Strength", "#Speed", "#Gaming"].map(tag => (
                  <span
                    key={tag}
                    onClick={() => navigate(`/explore?q=${encodeURIComponent(tag.replace("#", ""))}`)}
                    style={{ color: "#aaa", fontSize: 13, cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#FF6A00"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#aaa"}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════ ENHANCED ORANGE CTA ══════════════════ */}
      <section className="orange-cta-section">
        <div className="orange-cta">
          {/* Dynamic backgrounds */}
          <div className="orange-cta-bg" />
          <div className="orange-cta-grid" />
          <div className="orange-cta-glow" />

          <div className="orange-cta-content">
            <span className="orange-cta-badge">Join the Elite</span>
            <h2 className="orange-cta-title">
              <ScrollReveal>Ready to make </ScrollReveal><span className="orange-cta-highlight"><ScrollReveal>history?</ScrollReveal></span>
            </h2>
            <p className="orange-cta-subtitle">
              <ScrollReveal>Step up, pass the official verification process, break a record, and prove you belong among the best.</ScrollReveal>
            </p>
            <div className="orange-cta-btns">
              <Link to="/verify" style={{ textDecoration: "none" }}>
                <button className="btn-v2 btn-v2-dark" style={{ background: "#111", color: "white", padding: "14px 28px", borderRadius: "100px", fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px", border: "none", cursor: "pointer", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
                  Submit a Record <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </Link>
              <Link to="/categories" style={{ textDecoration: "none" }}>
                <button
                  className="btn-v2"
                  style={{
                    background: "#FFFFFF",
                    color: "#FF6A00",
                    border: "1px solid #FFFFFF",
                    padding: "14px 28px",
                    borderRadius: "100px",
                    fontSize: "15px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "#FFFFFF";
                    e.currentTarget.style.backdropFilter = "blur(10px)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.color = "#FF6A00";
                    e.currentTarget.style.backdropFilter = "none";
                    e.currentTarget.style.borderColor = "#FFFFFF";
                  }}
                >
                  Explore Categories
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <Footer />

    </div>
  );
};

export default Home;
