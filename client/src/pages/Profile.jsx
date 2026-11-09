import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Trophy, MapPin, Calendar, Activity, Zap, Timer,
  CheckCircle2, Share2, User, Mail, LogOut, Plus, ShieldCheck,
  Flame, Loader2, AlertCircle, Eye, RefreshCw, BarChart2, Shield,
  Award, TrendingUp, Compass, ChevronRight, HardDrive, Bell, Settings,
  Scale, Ruler, Heart, Phone, Sparkles, X, Edit3, Image, Search, Download, ExternalLink
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { apiCall, apiUpload, formatProductImage } from "../utils/api";
import { downloadCertificatePdf, formatCertDate } from "../utils/certificatePdf";

// ---------- My Certificates (issued by an administrator) ----------
const MyCertificates = ({ state, token }) => {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const download = async (cert) => {
    setBusy(cert.certificateNumber);
    setError("");
    try {
      // the server returns the certificate with its template (and counts the download)
      const full = await apiCall(`/certificates/${encodeURIComponent(cert.certificateNumber)}/download`, "GET", null, token);
      await downloadCertificatePdf(full, full.template || cert.template);
    } catch (err) {
      setError(err.message || "Could not create the PDF.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px", margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "10px" }}>
        <Award size={22} color="#FF5500" /> MY CERTIFICATES
      </h2>
      <p style={{ color: "#666", fontSize: "13px", margin: "0 0 24px 0" }}>Official AMPEX certificates approved for your verified records</p>
      {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: "12px", padding: "12px 14px", fontSize: "13px", fontWeight: 700, marginBottom: "16px" }}>{error}</div>}
      {!state.loaded ? (
        <div style={{ color: "#666", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading certificates...</div>
      ) : state.error ? (
        <div style={{ color: "#f87171", fontSize: "14px" }}>{state.error}</div>
      ) : state.list.length === 0 ? (
        <div style={{ background: "rgba(13,13,16,0.5)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "24px", padding: "40px 24px", textAlign: "center", color: "#777", fontSize: "14px", lineHeight: 1.6 }}>
          No certificates yet. When an administrator approves a certificate for one of your verified records, it will appear here ready to download.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {state.list.map((c) => (
            <div key={c.id} style={{ background: "rgba(13,13,16,0.5)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "20px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,85,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Award size={22} color="#FF5500" />
              </div>
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: "15px", color: "white", overflowWrap: "anywhere" }}>{c.recordTitle}</div>
                <div style={{ color: "#888", fontSize: "12px", marginTop: "4px", lineHeight: 1.6, overflowWrap: "anywhere" }}>
                  {c.recordValue ? `${c.recordValue} · ` : ""}Verified {formatCertDate(c.dateVerified) || "—"}<br />
                  <span style={{ color: "#FF5500", fontWeight: 800 }}>{c.certificateNumber}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => download(c)}
                  disabled={busy === c.certificateNumber}
                  style={{ background: "#FF5500", color: "white", border: "none", borderRadius: "100px", padding: "10px 16px", fontSize: "12px", fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", opacity: busy === c.certificateNumber ? 0.6 : 1 }}
                >
                  {busy === c.certificateNumber ? <Loader2 size={13} /> : <Download size={13} />} {busy === c.certificateNumber ? "PREPARING..." : "DOWNLOAD PDF"}
                </button>
                <Link to={`/certificate/${c.certificateNumber}`} style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#ccc", borderRadius: "100px", padding: "10px 16px", fontSize: "12px", fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <ExternalLink size={13} /> VERIFY
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Messages from AMPEX (Admin → Communications) ----------
const Inbox = ({ state, token, onRead }) => {
  const [openId, setOpenId] = useState(null);
  const open = (m) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.is_read) {
      onRead(m.id);
      apiCall(`/messages/${m.id}/read`, "PUT", {}, token).catch(() => {});
    }
  };
  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px", margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "10px" }}>
        <Mail size={22} color="#FF5500" /> MESSAGES
      </h2>
      <p style={{ color: "#666", fontSize: "13px", margin: "0 0 24px 0" }}>Notices and replies from the AMPEX World Records team</p>
      {!state.loaded ? (
        <div style={{ color: "#666", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading messages...</div>
      ) : state.error ? (
        <div style={{ color: "#f87171", fontSize: "14px" }}>{state.error}</div>
      ) : state.list.length === 0 ? (
        <div style={{ background: "rgba(13,13,16,0.5)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "24px", padding: "40px 24px", textAlign: "center", color: "#777", fontSize: "14px" }}>
          Your inbox is empty.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {state.list.map((m) => {
            const isOpen = openId === m.id;
            return (
              <div key={m.id} style={{ background: "rgba(13,13,16,0.5)", border: `1px solid ${m.is_read ? "rgba(255,255,255,0.05)" : "rgba(255,85,0,0.35)"}`, borderRadius: "18px", overflow: "hidden" }}>
                <button
                  onClick={() => open(m)}
                  aria-expanded={isOpen}
                  style={{ width: "100%", background: "none", border: "none", color: "white", textAlign: "left", padding: "16px 18px", cursor: "pointer", display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: m.is_read ? "transparent" : "#FF5500", flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: m.is_read ? 700 : 900, fontSize: "14px", overflowWrap: "anywhere" }}>{m.subject || "(no subject)"}</span>
                    <span style={{ display: "block", color: "#777", fontSize: "12px", marginTop: "3px" }}>
                      {m.sender?.name || "AMPEX World Records"} · {formatCertDate(m.created_at)}
                    </span>
                  </span>
                  <ChevronRight size={16} color="#666" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                </button>
                {isOpen && (
                  <div style={{ padding: "0 18px 18px 38px", color: "rgba(255,255,255,0.75)", fontSize: "14px", lineHeight: 1.7, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
                    {m.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ATHLETES = {
  "leo-vance": {
    name: "Leo Vance",
    username: "leo_vance_02",
    memberNumber: "AWR-000245",
    rank: "02",
    img: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=700&q=80",
    cover: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80",
    cat: "STRENGTH",
    location: "London, UK",
    since: "2022",
    records: "4",
    bio: "Strength specialist focused on deadlift and overhead press records. Dedicated to pushing human limits in powerlifting.",
    gender: "Male",
    dob: "1994-06-12",
    weight: "95",
    weightUnit: "kg",
    height: "188",
    heightUnit: "cm",
    phone: "+44 7911 123456",
    country: "United Kingdom",
    city: "London",
    stats: [
      { label: "Total Records", value: "4", sub: "Strength Div" },
      { label: "Power Rank", value: "A+", sub: "Global" },
      { label: "Verified", value: "100%", sub: "Audit Pass" }
    ],
    recordList: [
      { title: "Heaviest Deadlift (One Hand)", category: "Strength", value: "185kg", date: "Jan 2024" },
      { title: "Most Pushups in 10 Minutes", category: "Endurance", value: "542", date: "Mar 2024" }
    ]
  },
  "jamal-carter": {
    name: "Jamal Carter",
    username: "jamal_sprinter",
    memberNumber: "AWR-100001",
    rank: "01",
    img: "https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&w=800&q=80",
    cover: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80",
    cat: "SPEED",
    location: "New York, USA",
    since: "2021",
    records: "7",
    bio: "Fastest man on sand and hurdles. Record breaker in multiple track categories across three continents.",
    gender: "Male",
    dob: "1996-03-24",
    weight: "78",
    weightUnit: "kg",
    height: "182",
    heightUnit: "cm",
    phone: "+1 (555) 321-7654",
    country: "United States",
    city: "New York, NY",
    stats: [
      { label: "Total Records", value: "7", sub: "Speed Div" },
      { label: "Agility Rank", value: "S", sub: "World Rank" },
      { label: "Verified", value: "100%", sub: "Audit Pass" }
    ],
    recordList: [
      { title: "Fastest 100m Sand Sprint", category: "Speed", value: "10.4s", date: "Oct 2023" },
      { title: "Most Hurdles Jumped in 30s", category: "Agility", value: "28", date: "Dec 2023" }
    ]
  }
};

const Profile = () => {
  const { id } = useParams();
  const { user, logout, updateProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !id;
  const [myRecords, setMyRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [errorRecords, setErrorRecords] = useState(null);
  const [activeTab, setActiveTab] = useState("submissions"); // submissions, biometrics, certificates, messages
  const [certState, setCertState] = useState({ loaded: false, list: [], error: "" });
  const [inboxState, setInboxState] = useState({ loaded: false, list: [], error: "" });
  const unreadCount = inboxState.list.filter((m) => !m.is_read).length;
  const [searchQuery, setSearchQuery] = useState("");

  // Edit profile state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    phone: "",
    gender: "",
    dob: "",
    weight: "",
    weightUnit: "kg",
    height: "",
    heightUnit: "cm",
    country: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    ethnicity: "",
    profileImage: ""
  });

  // Redirect if trying to view private profile without auth
  useEffect(() => {
    if (isOwnProfile && !authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, isOwnProfile, navigate]);

  // Fetch logged in user's submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (isOwnProfile && user) {
        setLoadingRecords(true);
        setErrorRecords(null);
        try {
          const data = await apiCall("/records/my-submissions", "GET", null, user.token);
          setMyRecords(data || []);
        } catch (err) {
          console.error("Error fetching my submissions:", err);
          setErrorRecords(err.message || "Failed to load submitted records.");
        } finally {
          setLoadingRecords(false);
        }
      }
    };

    fetchSubmissions();
  }, [user, isOwnProfile]);

  // Own profile: issued certificates + inbox
  useEffect(() => {
    if (!isOwnProfile || !user?.token) return undefined;
    let cancelled = false;
    apiCall("/certificates/mine", "GET", null, user.token)
      .then((list) => { if (!cancelled) setCertState({ loaded: true, list: Array.isArray(list) ? list : [], error: "" }); })
      .catch((err) => { if (!cancelled) setCertState({ loaded: true, list: [], error: err.message || "Could not load certificates." }); });
    apiCall("/messages", "GET", null, user.token)
      .then((list) => { if (!cancelled) setInboxState({ loaded: true, list: Array.isArray(list) ? list : [], error: "" }); })
      .catch((err) => { if (!cancelled) setInboxState({ loaded: true, list: [], error: err.message || "Could not load messages." }); });
    return () => { cancelled = true; };
  }, [isOwnProfile, user?.token]);

  const markReadLocally = (messageId) =>
    setInboxState((s) => ({ ...s, list: s.list.map((m) => (m.id === messageId ? { ...m, is_read: true } : m)) }));

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isEditModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isEditModalOpen]);

  // Sync edit form with current user details
  const openEditModal = () => {
    if (user) {
      setEditForm({
        name: user.name || "",
        username: user.username || "",
        phone: user.phone || "",
        gender: user.gender || "",
        dob: user.dob ? user.dob.split("T")[0] : "",
        weight: user.weight || "",
        weightUnit: user.weightUnit || "kg",
        height: user.height || "",
        heightUnit: user.heightUnit || "cm",
        country: user.country || "",
        streetAddress: user.streetAddress || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        ethnicity: user.ethnicity || "",
        profileImage: user.profileImage || ""
      });
      setEditError("");
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);
    try {
      await updateProfile(editForm);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Update profile error:", err);
      setEditError(err.message || "Failed to update registry details.");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Loading Auth State
  if (authLoading || (isOwnProfile && !user)) {
    return (
      <div style={{ background: "#030303", color: "white", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <Loader2 className="animate-spin" size={48} color="#FF5500" />
        <p style={{ marginTop: "16px", color: "#aaa", fontFamily: "'Outfit', 'Inter', sans-serif", letterSpacing: "1px" }}>SYNCING WITH AMPEX NETWORK...</p>
      </div>
    );
  }

  // Load public athlete or fall back to user profile variables
  const athlete = !isOwnProfile ? (ATHLETES[id] || ATHLETES["jamal-carter"]) : null;

  // Calculate user initials for dynamic avatar
  const getInitials = (name) => {
    if (!name) return "R";
    const parts = name.split(" ");
    return parts.map(p => p[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <div style={{
      background: "#030303",
      color: "white",
      minHeight: "100vh",
      fontFamily: "'Outfit', 'Inter', sans-serif",
      backgroundImage: `
        radial-gradient(circle at 50% -10%, rgba(255, 85, 0, 0.12) 0%, transparent 60%),
        radial-gradient(circle at 10% 40%, rgba(162, 0, 255, 0.05) 0%, transparent 40%),
        linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
      `,
      backgroundSize: "100% 100%, 100% 100%, 45px 45px, 45px 45px",
      overflowX: "hidden",
      paddingTop: "80px"
    }}>
      <Navbar />

      {/* 1. Cover Photo Section */}
      <section style={{ position: "relative", height: "300px", width: "100%", overflow: "hidden" }}>
        <img loading="lazy" decoding="async"
          src={isOwnProfile
            ? "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80"
            : athlete.cover
          }
          alt="Cover Background"
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.25, filter: "grayscale(20%) brightness(0.9)" }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 20%, rgba(3, 3, 3, 0.8) 80%, #030303 100%)",
        }} />
      </section>

      {/* 2. Floating Profile Header Card */}
      <section className="container" style={{ position: "relative", zIndex: 10, marginTop: "-120px", paddingBottom: "20px" }}>
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "36px",
          flexWrap: "wrap",
          background: "rgba(10, 10, 12, 0.4)",
          backdropFilter: "blur(20px)",
          borderRadius: "32px",
          padding: "36px",
          border: "1px solid rgba(255, 255, 255, 0.03)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9)"
        }}>

          {/* Avatar block with rotating neon border */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              position: "absolute",
              inset: "-8px",
              borderRadius: "32px",
              background: "linear-gradient(135deg, #FF5500 0%, #a200ff 100%)",
              opacity: 0.7,
              zIndex: -1,
              filter: "blur(6px)"
            }} />

            {isOwnProfile ? (
              user.profileImage ? (
                <img loading="lazy" decoding="async"
                  src={formatProductImage(user.profileImage)}
                  alt="User Avatar"
                  style={{ width: "160px", height: "160px", borderRadius: "24px", border: "4px solid #030303", objectFit: "cover", background: "#111" }}
                />
              ) : (
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: "160px",
                    height: "160px",
                    borderRadius: "24px",
                    border: "4px solid #030303",
                    background: "linear-gradient(135deg, #FF5500 0%, #7000ff 100%)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "48px",
                    fontWeight: "900",
                    color: "white",
                    textShadow: "0 4px 10px rgba(0,0,0,0.3)"
                  }}>
                    {getInitials(user.name)}
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    style={{
                      position: "absolute",
                      bottom: "-10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#FF5500",
                      color: "white",
                      border: "2px solid #030303",
                      borderRadius: "12px",
                      padding: "6px 12px",
                      fontSize: "10px",
                      fontWeight: "900",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: "0 4px 10px rgba(255,85,0,0.4)"
                    }}
                  >
                    ADD PHOTO
                  </button>
                </div>
              )
            ) : (
              athlete.img ? (
                <img loading="lazy" decoding="async"
                  src={formatProductImage(athlete.img)}
                  alt="Athlete Avatar"
                  style={{ width: "160px", height: "160px", borderRadius: "24px", border: "4px solid #030303", objectFit: "cover", background: "#111" }}
                />
              ) : (
                <div style={{ width: "160px", height: "160px", borderRadius: "24px", border: "4px solid #030303", background: "#111" }} />
              )
            )}

            {/* Dynamic online ping badge */}
            <div style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#22c55e",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              border: "3px solid #030303",
              boxShadow: "0 0 15px #22c55e"
            }}>
              <div style={{
                position: "absolute",
                inset: "-4px",
                borderRadius: "50%",
                border: "2px solid #22c55e",
                animation: "radarPulse 1.8s infinite ease-out"
              }} />
            </div>

            <div style={{
              position: "absolute",
              bottom: "-10px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(to right, #FF5500, #ff8800)",
              color: "white",
              padding: "4px 14px",
              borderRadius: "100px",
              fontWeight: "900",
              fontSize: "11px",
              letterSpacing: "1px",
              border: "3px solid #0a0a0c",
              boxShadow: "0 5px 15px rgba(255, 85, 0, 0.4)",
              whiteSpace: "nowrap"
            }}>
              {isOwnProfile ? "NEW CHALLENGER" : `RANK #${athlete.rank}`}
            </div>
          </div>

          {/* Core Name Meta block */}
          <div style={{ flex: 1, minWidth: "280px" }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
              <span style={{
                background: "linear-gradient(90deg, rgba(255,85,0,0.2) 0%, rgba(255,85,0,0.05) 100%)",
                color: "#FF5500",
                padding: "4px 14px",
                borderRadius: "100px",
                fontSize: "10px",
                fontWeight: "950",
                letterSpacing: "1.5px",
                border: "1px solid rgba(255, 85, 0, 0.35)",
                boxShadow: "0 0 10px rgba(255, 85, 0, 0.1)"
              }}>
                {isOwnProfile ? "TIER-01 DIVISION" : "ELITE CLASS"}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.03)", padding: "4px 12px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <ShieldCheck size={14} color="#a200ff" />
                <span style={{ fontSize: "11px", color: "#ccc", fontWeight: "600", letterSpacing: "0.5px" }}>
                  {isOwnProfile ? `@${user.username || "athlete"}` : `@${athlete.username}`}
                </span>
              </div>

              {(isOwnProfile ? user.memberNumber : athlete.memberNumber) && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.03)", padding: "4px 12px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "9px", color: "#FF5500", fontWeight: "900", letterSpacing: "0.5px", textTransform: "uppercase" }}>MID:</span>
                  <span style={{ fontSize: "11px", color: "#fff", fontWeight: "800", letterSpacing: "0.5px" }}>
                    {isOwnProfile ? user.memberNumber : athlete.memberNumber}
                  </span>
                  <div style={{ display: "inline-flex", background: "rgba(34, 197, 94, 0.15)", borderRadius: "50%", padding: "2px", border: "1px solid rgba(34, 197, 94, 0.3)" }} title="Verified Member">
                    <svg viewBox="0 0 24 24" width="10" height="10" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(isOwnProfile ? user.memberNumber : athlete.memberNumber);
                      alert(`Member ID (${isOwnProfile ? user.memberNumber : athlete.memberNumber}) copied to clipboard!`);
                    }}
                    style={{ background: "none", border: "none", color: "#FF5500", padding: 0, margin: "0 0 0 4px", cursor: "pointer", display: "flex", alignItems: "center" }}
                    title="Copy Member Number"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                </div>
              )}
            </div>

            <h1 style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: "950",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "-1.5px",
              lineHeight: 1.1,
              color: "white"
            }}>
              {isOwnProfile ? user.name : athlete.name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "14px", color: "#888", fontSize: "13px", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "500" }}>
                <MapPin size={15} color="#FF5500" />
                {isOwnProfile
                  ? (user.city && user.country ? `${user.city}, ${user.country}` : "AMPEX Network Node")
                  : athlete.location
                }
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "500" }}><Calendar size={15} color="#FF5500" /> Registered May 2026</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Main Content Dashboard Grid */}
      <section className="container" style={{ padding: "20px 0 80px 0", display: "grid", gridTemplateColumns: "1fr 360px", gap: "48px" }}>

        {/* Left Column: Interactive Tab Dashboard */}
        <div>
          {isOwnProfile ? (
            /* ================== DYNAMIC USER PORTAL ================== */
            <div>
              {/* Futuristic Cyber Tab Navigation */}
              <div style={{
                display: "flex",
                background: "rgba(255,255,255,0.02)",
                padding: "6px",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.05)",
                marginBottom: "36px",
                gap: "6px",
                flexWrap: "wrap"
              }}>
                <button
                  onClick={() => setActiveTab("submissions")}
                  style={{
                    flex: "1 1 150px",
                    background: activeTab === "submissions" ? "linear-gradient(135deg, #FF5500 0%, #ff7733 100%)" : "transparent",
                    border: "none",
                    color: activeTab === "submissions" ? "white" : "#888",
                    padding: "14px 20px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: "900",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    transition: "all 0.25s",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: activeTab === "submissions" ? "0 10px 25px rgba(255, 85, 0, 0.25)" : "none"
                  }}
                >
                  <Trophy size={15} /> SUBMISSIONS ({myRecords.length})
                </button>
                <button
                  onClick={() => setActiveTab("biometrics")}
                  style={{
                    flex: "1 1 150px",
                    background: activeTab === "biometrics" ? "linear-gradient(135deg, #FF5500 0%, #ff7733 100%)" : "transparent",
                    border: "none",
                    color: activeTab === "biometrics" ? "white" : "#888",
                    padding: "14px 20px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: "900",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    transition: "all 0.25s",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: activeTab === "biometrics" ? "0 10px 25px rgba(255, 85, 0, 0.25)" : "none"
                  }}
                >
                  <Activity size={15} /> COCKPIT STATS
                </button>
                <button
                  onClick={() => setActiveTab("certificates")}
                  style={{
                    flex: "1 1 150px",
                    background: activeTab === "certificates" ? "linear-gradient(135deg, #FF5500 0%, #ff7733 100%)" : "transparent",
                    border: "none",
                    color: activeTab === "certificates" ? "white" : "#888",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: "900",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    transition: "all 0.25s",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: activeTab === "certificates" ? "0 10px 25px rgba(255, 85, 0, 0.25)" : "none"
                  }}
                >
                  <Award size={15} /> CERTIFICATES ({certState.list.length})
                </button>
                <button
                  onClick={() => setActiveTab("messages")}
                  style={{
                    flex: "1 1 150px",
                    background: activeTab === "messages" ? "linear-gradient(135deg, #FF5500 0%, #ff7733 100%)" : "transparent",
                    border: "none",
                    color: activeTab === "messages" ? "white" : "#888",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: "900",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    transition: "all 0.25s",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: activeTab === "messages" ? "0 10px 25px rgba(255, 85, 0, 0.25)" : "none"
                  }}
                >
                  <Mail size={15} /> MESSAGES {unreadCount > 0 && <span style={{ background: activeTab === "messages" ? "white" : "#FF5500", color: activeTab === "messages" ? "#FF5500" : "white", borderRadius: "100px", fontSize: "10px", padding: "2px 7px", letterSpacing: 0 }}>{unreadCount}</span>}
                </button>
              </div>

              {/* TAB 1: Real-time Record Submissions list */}
              {activeTab === "submissions" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                    <div>
                      <h2 style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px", margin: 0, color: "white" }}>
                        RECORD LEDGER
                      </h2>
                      <p style={{ color: "#666", fontSize: "13px", margin: "4px 0 0 0" }}>Chronological record of athletic verifications</p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ position: "relative" }}>
                        <Search size={14} color="#666" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          placeholder="Search records..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "8px 12px 8px 32px", borderRadius: "100px", fontSize: "12px", outline: "none", width: "200px" }}
                        />
                      </div>
                      <Link to="/verify" style={{ textDecoration: "none" }}>
                        <button style={{
                          background: "rgba(255, 85, 0, 0.1)",
                          color: "#FF5500",
                          border: "1px solid rgba(255, 85, 0, 0.3)",
                          padding: "10px 20px",
                          borderRadius: "100px",
                          fontSize: "12px",
                          fontWeight: "900",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          letterSpacing: "0.5px",
                          transition: "all 0.25s"
                        }} className="btn-glow-neon">
                          <Plus size={15} /> NEW ATTEMPT
                        </button>
                      </Link>
                    </div>
                  </div>

                  {loadingRecords ? (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: "80px 0",
                      background: "rgba(13,13,16,0.6)",
                      borderRadius: "24px",
                      border: "1px solid rgba(255, 255, 255, 0.04)"
                    }}>
                      <Loader2 className="animate-spin" size={36} color="#FF5500" />
                      <p style={{ color: "#888", marginTop: "16px", fontSize: "14px", letterSpacing: "1px" }}>QUERYING SUPABASE METADATA...</p>
                    </div>
                  ) : errorRecords ? (
                    <div style={{
                      display: "flex",
                      padding: "24px",
                      gap: "16px",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.15)",
                      borderRadius: "20px",
                      color: "#f87171"
                    }}>
                      <AlertCircle size={24} style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: "900", fontSize: "16px", letterSpacing: "-0.5px" }}>LEDGER SYNC FAILURE</div>
                        <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>{errorRecords}</div>
                      </div>
                    </div>
                  ) : myRecords.length === 0 ? (
                    <div style={{
                      textAlign: "center",
                      padding: "80px 40px",
                      background: "rgba(13,13,16,0.3)",
                      borderRadius: "24px",
                      border: "1px dashed rgba(255,255,255,0.08)"
                    }}>
                      <div style={{
                        width: "72px",
                        height: "72px",
                        background: "rgba(255, 85, 0, 0.04)",
                        borderRadius: "50%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        margin: "0 auto 20px auto",
                        border: "1px solid rgba(255, 85, 0, 0.1)"
                      }}>
                        <Trophy size={32} color="#FF5500" style={{ opacity: 0.8 }} />
                      </div>
                      <h3 style={{ fontSize: "18px", fontWeight: "900", margin: "0 0 10px 0", letterSpacing: "-0.5px", color: "white" }}>LEDGER SECURE & VACANT</h3>
                      <p style={{ color: "#777", fontSize: "13px", maxWidth: "440px", margin: "0 auto 24px auto", lineHeight: 1.6 }}>
                        Your verified performance ledger is empty. Upload your evidence and get authenticated by our expert panel!
                      </p>
                      <Link to="/verify" style={{ textDecoration: "none" }}>
                        <button style={{
                          background: "linear-gradient(135deg, #FF5500 0%, #ff8800 100%)",
                          color: "white",
                          border: "none",
                          padding: "13px 32px",
                          borderRadius: "100px",
                          fontSize: "13px",
                          fontWeight: "900",
                          letterSpacing: "0.5px",
                          cursor: "pointer",
                          boxShadow: "0 10px 25px rgba(255, 85, 0, 0.35)",
                          transition: "all 0.2s"
                        }} className="btn-glow-neon">
                          SUBMIT RECORD ATTEMPT
                        </button>
                      </Link>
                    </div>
                  ) : (
                    /* Timeline style Submissions Feed */
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {myRecords.filter(r => !searchQuery || r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.category?.toLowerCase().includes(searchQuery.toLowerCase())).map((record) => {
                        const statusColors = {
                          pending: { bg: "rgba(255, 204, 0, 0.04)", text: "#ffcc00", border: "rgba(255, 204, 0, 0.12)", iconColor: "#ffcc00" },
                          verified: { bg: "rgba(34, 197, 94, 0.04)", text: "#22c55e", border: "rgba(34, 197, 94, 0.12)", iconColor: "#22c55e" },
                          rejected: { bg: "rgba(239, 68, 68, 0.04)", text: "#ef4444", border: "rgba(239, 68, 68, 0.12)", iconColor: "#ef4444" }
                        };
                        const status = record.status || "pending";
                        const colors = statusColors[status] || statusColors.pending;

                        return (
                          <div
                            key={record.id}
                            onClick={() => navigate(`/record/${record.id}`)}
                            style={{
                              background: "rgba(13, 13, 16, 0.5)",
                              padding: "24px",
                              borderRadius: "20px",
                              border: "1px solid rgba(255, 255, 255, 0.03)",
                              backdropFilter: "blur(20px)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              position: "relative",
                              overflow: "hidden",
                              transition: "all 0.25s",
                              cursor: "pointer"
                            }}
                            className="quest-card"
                          >
                            {/* Scanning indicator trace line */}
                            {status === "pending" && (
                              <div style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: "3px",
                                background: "linear-gradient(to bottom, #ffcc00, transparent)",
                                animation: "timelineScan 2.5s infinite linear"
                              }} />
                            )}

                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                <span style={{
                                  color: "#FF5500",
                                  fontSize: "10px",
                                  fontWeight: "900",
                                  textTransform: "uppercase",
                                  letterSpacing: "1.5px",
                                  background: "rgba(255, 85, 0, 0.06)",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid rgba(255, 85, 0, 0.12)"
                                }}>
                                  {record.category}
                                </span>
                                <span style={{
                                  background: colors.bg,
                                  color: colors.text,
                                  border: `1px solid ${colors.border}`,
                                  fontSize: "10px",
                                  fontWeight: "900",
                                  padding: "2px 8px",
                                  borderRadius: "100px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px"
                                }}>
                                  <span style={{
                                    width: "5px",
                                    height: "5px",
                                    borderRadius: "50%",
                                    background: colors.iconColor,
                                    boxShadow: `0 0 6px ${colors.iconColor}`,
                                    display: "inline-block"
                                  }} />
                                  {status}
                                </span>
                              </div>

                              <h3 style={{ fontSize: "19px", fontWeight: "800", margin: "0 0 6px 0", color: "white", letterSpacing: "-0.5px" }}>
                                {record.title}
                              </h3>

                              <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "#555", fontSize: "12px" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <Calendar size={12} /> {new Date(record.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                                <span>•</span>
                                <span>ID: #{record.id.substring(0, 8).toUpperCase()}</span>
                              </div>
                            </div>

                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "26px", fontWeight: "900", color: "white", letterSpacing: "-1px" }}>
                                {record.value} <span style={{ fontSize: "14px", fontWeight: "600", color: "#888" }}>{record.unit}</span>
                              </div>
                              <span style={{ fontSize: "10px", color: "#555", fontWeight: "800", letterSpacing: "1px" }}>
                                {record.record_type ? record.record_type.toUpperCase() : "STANDARD"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Athletic Cockpit telemetry */}
              {activeTab === "biometrics" && (
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px", marginBottom: "28px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Activity size={22} color="#FF5500" /> COCKPIT TELEMETRY
                  </h2>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>

                    {/* Power Gauge */}
                    <div style={{
                      background: "rgba(13,13,16,0.5)",
                      padding: "26px",
                      borderRadius: "24px",
                      border: "1px solid rgba(255,255,255,0.03)",
                      backdropFilter: "blur(20px)"
                    }}>
                      <div style={{ display: "flex", justifycontent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <span style={{ color: "#777", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                          POWER CAPACITY
                        </span>
                        <Flame size={15} color="#FF5500" />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "38px", fontWeight: "900", color: "white", letterSpacing: "-1px" }}>78%</div>
                        <div style={{ background: "rgba(255,85,0,0.08)", color: "#FF5500", fontSize: "10px", fontWeight: "900", padding: "2px 6px", borderRadius: "4px" }}>
                          S-TIER
                        </div>
                      </div>

                      <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", marginTop: "16px", overflow: "hidden" }}>
                        <div style={{ width: "78%", height: "100%", background: "linear-gradient(to right, #FF5500, #ff8800)", borderRadius: "10px", boxShadow: "0 0 10px #FF5500" }} />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", color: "#444", fontSize: "10px", fontWeight: "700" }}>
                        <span>LIMIT: 100</span>
                        <span>ACTUAL: 78.4</span>
                      </div>
                    </div>

                    {/* Agility Gauge */}
                    <div style={{
                      background: "rgba(13,13,16,0.5)",
                      padding: "26px",
                      borderRadius: "24px",
                      border: "1px solid rgba(255,255,255,0.03)",
                      backdropFilter: "blur(20px)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <span style={{ color: "#777", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                          AGILITY AGGREGATE
                        </span>
                        <Zap size={15} color="#a200ff" />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "38px", fontWeight: "900", color: "white", letterSpacing: "-1px" }}>84%</div>
                        <div style={{ background: "rgba(162,0,255,0.08)", color: "#a200ff", fontSize: "10px", fontWeight: "900", padding: "2px 6px", borderRadius: "4px" }}>
                          PRO-GRADE
                        </div>
                      </div>

                      <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", marginTop: "16px", overflow: "hidden" }}>
                        <div style={{ width: "84%", height: "100%", background: "linear-gradient(to right, #a200ff, #d900ff)", borderRadius: "10px", boxShadow: "0 0 10px #a200ff" }} />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", color: "#444", fontSize: "10px", fontWeight: "700" }}>
                        <span>LIMIT: 100</span>
                        <span>ACTUAL: 84.1</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: Certificates issued by an administrator */}
              {activeTab === "certificates" && <MyCertificates state={certState} token={user?.token} />}

              {/* TAB 4: Inbox */}
              {activeTab === "messages" && <Inbox state={inboxState} token={user?.token} onRead={markReadLocally} />}
            </div>
          ) : (
            /* ================== PUBLIC PRO ATHLETE VIEW ================== */
            <div>
              <div style={{ marginBottom: "40px" }}>
                <h2 style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px", marginBottom: "20px", color: "white", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Activity color="#FF5500" size={22} /> BIOMETRIC RATINGS
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  {athlete.stats.map((stat, i) => (
                    <div key={i} style={{
                      background: "rgba(13,13,16,0.5)",
                      padding: "24px",
                      borderRadius: "20px",
                      border: "1px solid rgba(255,255,255,0.03)",
                      backdropFilter: "blur(20px)"
                    }}>
                      <div style={{ color: "#777", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>{stat.label}</div>
                      <div style={{ fontSize: "28px", fontWeight: "900", color: "#FF5500", letterSpacing: "-1px" }}>{stat.value}</div>
                      <div style={{ color: "#555", fontSize: "11px", marginTop: "4px", fontWeight: "600" }}>{stat.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px", marginBottom: "20px", color: "white", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Trophy color="#FF5500" size={22} /> RECORD LEDGER
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {athlete.recordList.map((record, i) => (
                    <div key={i} style={{
                      background: "rgba(13, 13, 16, 0.5)",
                      padding: "24px",
                      borderRadius: "20px",
                      border: "1px solid rgba(255, 255, 255, 0.03)",
                      backdropFilter: "blur(20px)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.25s"
                    }} className="quest-card">
                      <div>
                        <div style={{ color: "#FF5500", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "4px" }}>{record.category}</div>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "white", letterSpacing: "-0.5px" }}>{record.title}</div>
                        <div style={{ color: "#555", fontSize: "12px", marginTop: "4px", fontWeight: "550" }}>Verified audit on {record.date}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "24px", fontWeight: "900", color: "white", letterSpacing: "-1px" }}>{record.value}</div>
                        <div style={{ color: "#FF5500", fontSize: "10px", fontWeight: "900", letterSpacing: "0.5px" }}>WORLD RECORD</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Side Dashboard Cards & Quick CTA Portals */}
        <div>
          <div style={{ position: "sticky", top: "110px", display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Dynamic Athlete Registry Dossier Card */}
            <div style={{
              background: "rgba(13, 13, 16, 0.5)",
              padding: "32px 24px",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(25px)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{
                  fontSize: "13px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  margin: 0,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <Award size={15} color="#FF5500" />
                  ATHLETE DOSSIER
                </h3>

                {isOwnProfile && (
                  <button
                    onClick={openEditModal}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#FF5500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: "900",
                      letterSpacing: "0.5px"
                    }}
                    className="hover-opacity"
                  >
                    <Edit3 size={12} /> EDIT
                  </button>
                )}
              </div>

              {isOwnProfile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                  {/* Name detail row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ background: "rgba(255, 85, 0, 0.06)", color: "#FF5500", padding: "8px", borderRadius: "8px", border: "1px solid rgba(255, 85, 0, 0.12)" }}><User size={14} /></div>
                    <div>
                      <div style={{ color: "#555", fontSize: "9px", fontWeight: "900", letterSpacing: "1px" }}>CREDENTIAL NAME</div>
                      <div style={{ fontSize: "13px", fontWeight: "800", color: "white", letterSpacing: "-0.3px" }}>{user.name}</div>
                    </div>
                  </div>

                  {/* Username row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ background: "rgba(255, 85, 0, 0.06)", color: "#FF5500", padding: "8px", borderRadius: "8px", border: "1px solid rgba(255, 85, 0, 0.12)" }}><ShieldCheck size={14} /></div>
                    <div>
                      <div style={{ color: "#555", fontSize: "9px", fontWeight: "900", letterSpacing: "1px" }}>REGISTRY USERNAME</div>
                      <div style={{ fontSize: "13px", fontWeight: "800", color: "white", letterSpacing: "-0.3px" }}>@{user.username || "not_set"}</div>
                    </div>
                  </div>

                  {/* Email detail row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ background: "rgba(255, 85, 0, 0.06)", color: "#FF5500", padding: "8px", borderRadius: "8px", border: "1px solid rgba(255, 85, 0, 0.12)" }}><Mail size={14} /></div>
                    <div style={{ overflow: "hidden", width: "100%" }}>
                      <div style={{ color: "#555", fontSize: "9px", fontWeight: "900", letterSpacing: "1px" }}>EMAIL ADRESS</div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: "white", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{user.email}</div>
                    </div>
                  </div>

                  {/* Phone row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ background: "rgba(255, 85, 0, 0.06)", color: "#FF5500", padding: "8px", borderRadius: "8px", border: "1px solid rgba(255, 85, 0, 0.12)" }}><Phone size={14} /></div>
                    <div>
                      <div style={{ color: "#555", fontSize: "9px", fontWeight: "900", letterSpacing: "1px" }}>PHONE NUMBER</div>
                      <div style={{ fontSize: "13px", fontWeight: "800", color: "white", letterSpacing: "-0.3px" }}>{user.phone || "Not Specified"}</div>
                    </div>
                  </div>

                  {/* Gender and Ethnicity double column */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px" }}>
                    <div>
                      <span style={{ color: "#555", fontSize: "9px", fontWeight: "900", letterSpacing: "1px", display: "block" }}>GENDER</span>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "white", textTransform: "capitalize" }}>{user.gender || "Not Set"}</span>
                    </div>
                    <div>
                      <span style={{ color: "#555", fontSize: "9px", fontWeight: "900", letterSpacing: "1px", display: "block" }}>RACE / ETHNICITY</span>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "white", textTransform: "capitalize" }}>{user.ethnicity || "Not Set"}</span>
                    </div>
                  </div>

                  {/* DOB standalone or paired with something else */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px" }}>
                    <div>
                      <span style={{ color: "#555", fontSize: "9px", fontWeight: "900", letterSpacing: "1px", display: "block" }}>BIRTH DATE</span>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "white" }}>
                        {user.dob ? new Date(user.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "Not Set"}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px" }}>
                    <div style={{ background: "rgba(255, 85, 0, 0.06)", color: "#FF5500", padding: "8px", borderRadius: "8px", border: "1px solid rgba(255, 85, 0, 0.12)" }}><MapPin size={14} /></div>
                    <div>
                      <div style={{ color: "#555", fontSize: "9px", fontWeight: "900", letterSpacing: "1px" }}>ADDRESS</div>
                      <div style={{ fontSize: "13px", fontWeight: "800", color: "white", letterSpacing: "-0.3px" }}>
                        {user.streetAddress || user.city || user.state || user.zipCode ?
                          [user.streetAddress, user.city, user.state, user.zipCode].filter(Boolean).join(", ")
                          : "Not Specified"}
                      </div>
                    </div>
                  </div>

                  {/* Weight and Height details */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Scale size={14} color="#FF5500" />
                      <div>
                        <span style={{ color: "#555", fontSize: "9px", fontWeight: "900", letterSpacing: "0.5px", display: "block" }}>WEIGHT</span>
                        <span style={{ fontSize: "13px", fontWeight: "800", color: "white" }}>
                          {user.weight ? `${user.weight} ${user.weightUnit || 'kg'}` : "Not Set"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Ruler size={14} color="#FF5500" />
                      <div>
                        <span style={{ color: "#555", fontSize: "9px", fontWeight: "900", letterSpacing: "0.5px", display: "block" }}>HEIGHT</span>
                        <span style={{ fontSize: "13px", fontWeight: "800", color: "white" }}>
                          {user.height ? `${user.height} ${user.heightUnit === 'cm' ? 'cm' : ''}` : "Not Set"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#555", fontSize: "11px", fontWeight: "600" }}>Registry Status</span>
                    <span style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", padding: "3px 10px", borderRadius: "100px", fontSize: "9px", fontWeight: "900", border: "1px solid rgba(34,197,94,0.15)" }}>ACTIVE LEDGER</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.7", margin: "0 0 20px 0", fontWeight: "500" }}>
                    {athlete.bio}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#555", fontSize: "12px", fontWeight: "600" }}>Class Division</span>
                      <span style={{ fontWeight: "800", color: "white", fontSize: "13px" }}>Mastery</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#555", fontSize: "12px", fontWeight: "600" }}>AMPEX Status</span>
                      <span style={{ fontWeight: "800", color: "#FF5500", fontSize: "13px" }}>Grandmaster</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#555", fontSize: "12px", fontWeight: "600" }}>Gender</span>
                      <span style={{ fontWeight: "800", color: "white", fontSize: "13px" }}>{athlete.gender}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#555", fontSize: "12px", fontWeight: "600" }}>Specs</span>
                      <span style={{ fontWeight: "800", color: "white", fontSize: "13px" }}>
                        {athlete.height}cm / {athlete.weight}kg
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            {isOwnProfile && (
              <div style={{
                background: "linear-gradient(135deg, rgba(255,85,0,0.04) 0%, rgba(112,0,255,0.04) 100%)",
                padding: "24px",
                borderRadius: "24px",
                border: "1px solid rgba(255, 85, 0, 0.2)",
                boxShadow: "0 15px 35px rgba(255, 85, 0, 0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                position: "relative",
                overflow: "hidden"
              }}>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "900", color: "white", letterSpacing: "1.5px" }}>ACTION PORTAL</h4>

                <Link to="/verify" style={{ textDecoration: "none" }}>
                  <button style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #FF5500 0%, #ff7700 100%)",
                    color: "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "900",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.25s",
                    boxShadow: "0 5px 15px rgba(255, 85, 0, 0.25)"
                  }} className="btn-glow-neon">
                    <Plus size={16} /> SUBMIT ATTEMPT
                  </button>
                </Link>

                <Link to="/leaderboard" style={{ textDecoration: "none" }}>
                  <button style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.05)",
                    padding: "12px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "900",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s"
                  }} className="btn-secondary-hover">
                    <BarChart2 size={16} color="#FF5500" /> GLOBAL STANDINGS
                  </button>
                </Link>

                <button
                  onClick={logout}
                  style={{
                    width: "100%",
                    background: "rgba(239, 68, 68, 0.06)",
                    color: "#f87171",
                    border: "1px solid rgba(239, 68, 68, 0.12)",
                    padding: "12px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "900",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                    marginTop: "4px"
                  }}
                  className="btn-danger-hover"
                >
                  <LogOut size={16} /> TERMINATE SESSION
                </button>
              </div>
            )}

            {/* Bronze Gold Pro Membership Card */}
            <div style={{
              background: "linear-gradient(135deg, #130f0a 0%, #291c07 100%)",
              borderRadius: "24px",
              padding: "24px",
              border: "1px solid rgba(212, 163, 89, 0.2)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div style={{
                  background: "rgba(212, 163, 89, 0.08)",
                  color: "#D4A359",
                  padding: "6px",
                  borderRadius: "8px",
                  border: "1px solid rgba(212, 163, 89, 0.15)"
                }}>
                  <Shield size={18} />
                </div>
                <span style={{ color: "#D4A359", fontSize: "9px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase" }}>
                  PRO UPGRADE
                </span>
              </div>

              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "900", color: "white", letterSpacing: "-0.5px" }}>
                ELITE VERIFICATION
              </h4>
              <p style={{ color: "#bda888", fontSize: "11px", margin: "0 0 16px 0", lineHeight: 1.5, fontWeight: "500" }}>
                Priority physical adjudicator tracking, expedited auditing, and custom physical certificates.
              </p>

              <Link to="/elite" style={{ textDecoration: "none" }}>
                <button style={{
                  width: "100%",
                  background: "#D4A359",
                  color: "#16110a",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: "900",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "6px",
                  transition: "opacity 0.2s"
                }} className="gold-btn-hover">
                  UPGRADE ACCESS <ChevronRight size={12} />
                </button>
              </Link>
            </div>

          </div>
        </div>

      </section>

      {/* ================= EDIT REGISTRY DETAILS MODAL ================= */}
      {isEditModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(10px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000,
          padding: "20px"
        }}>
          {/* Modal Container */}
          <div style={{
            background: "#0c0c0e",
            border: "1px solid rgba(255, 85, 0, 0.15)",
            width: "100%",
            maxWidth: "900px",
            borderRadius: "32px",
            boxShadow: "0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(255, 85, 0, 0.05)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "modalFadeIn 0.3s ease-out"
          }}>

            {/* Modal Header */}
            <div style={{
              padding: "24px 32px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h3 style={{ fontSize: "26px", fontWeight: "900", margin: 0, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: "12px", color: "white" }}>
                  <Settings size={20} color="#FF5500" /> EDIT ATHLETE REGISTRY
                </h3>
                <p style={{ color: "#555", fontSize: "14px", margin: "6px 0 0 0", fontWeight: "600", letterSpacing: "0.5px" }}>UPDATE PHYSICAL DOSSIER & SECURITY KEYS</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: "rgba(255,255,255,0.03)", border: "none", color: "#888", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}
                className="hover-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ padding: "32px", overflowY: "auto", maxHeight: "60vh", display: "flex", flexDirection: "column", gap: "20px", scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}>

                {editError && (
                  <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "12px", color: "#f87171", padding: "16px 20px", fontSize: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                    <AlertCircle size={16} />
                    <span>{editError}</span>
                  </div>
                )}

                {/* Section: Profile Image Upload */}
                <div>
                  <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>PROFILE IMAGE (UPLOAD)</label>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", width: "48px", height: "48px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", flexShrink: 0 }}>
                      {isUploading ? (
                        <Loader2 size={20} className="animate-spin" color="#FF5500" />
                      ) : editForm.profileImage ? (
                        <img loading="lazy" decoding="async" src={formatProductImage(editForm.profileImage)} alt="Avatar Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <Image size={20} color="#555" />
                      )}
                    </div>
                    <label style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px", cursor: isUploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.3s", opacity: isUploading ? 0.5 : 1 }} className={!isUploading ? "hover-white" : ""}>
                      <span>{isUploading ? "UPLOADING..." : editForm.profileImage ? "CHANGE UPLOADED IMAGE" : "UPLOAD NEW PICTURE"}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        style={{ display: "none" }}
                        disabled={isUploading}
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              setEditError("Image size must be less than 2MB.");
                              return;
                            }
                            setIsUploading(true);
                            setEditError("");
                            try {
                              const formData = new FormData();
                              formData.append('image', file);
                              const data = await apiUpload('/records/upload/image', formData, user.token);
                              setEditForm({ ...editForm, profileImage: data.url });
                              setEditError("Profile picture uploaded successfully (will save when you submit form).");
                            } catch (err) {
                              setEditError("Profile picture upload failed. Please try again.");
                              console.error(err);
                            } finally {
                              setIsUploading(false);
                            }
                          }
                        }}
                      />
                    </label>
                    {editForm.profileImage && (
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, profileImage: "" })}
                        disabled={isUploading}
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          borderRadius: "10px",
                          padding: "16px 20px",
                          fontSize: "11px",
                          fontWeight: "900",
                          cursor: isUploading ? "not-allowed" : "pointer",
                          opacity: isUploading ? 0.5 : 1
                        }}
                      >
                        REMOVE PHOTO
                      </button>
                    )}
                  </div>
                </div>

                {/* Row: Name & Username */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>FULL CREDENTIAL NAME</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>REGISTRY USERNAME</label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      required
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    />
                  </div>
                </div>

                {/* Row: Phone & Birth Date */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>PHONE NUMBER</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>DATE OF BIRTH</label>
                    <input
                      type="date" max={new Date().toISOString().split('T')[0]}
                      value={editForm.dob}
                      onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px", colorScheme: "dark" }}
                    />
                  </div>
                </div>

                {/* Row: Gender & Country */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>GENDER</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    >
                      <option value="" style={{ background: "#0c0c0e" }}>Select Gender</option>
                      <option value="male" style={{ background: "#0c0c0e" }}>Male</option>
                      <option value="female" style={{ background: "#0c0c0e" }}>Female</option>
                      <option value="other" style={{ background: "#0c0c0e" }}>Other</option>
                      <option value="prefer_not_to_say" style={{ background: "#0c0c0e" }}>Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>RACE / ETHNICITY</label>
                    <select
                      value={editForm.ethnicity}
                      onChange={(e) => setEditForm({ ...editForm, ethnicity: e.target.value })}
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    >
                      <option value="" style={{ background: "#0c0c0e" }}>Select Ethnicity</option>
                      <option value="White" style={{ background: "#0c0c0e" }}>White</option>
                      <option value="Black" style={{ background: "#0c0c0e" }}>Black</option>
                      <option value="Spanish/Hispanic" style={{ background: "#0c0c0e" }}>Spanish / Hispanic</option>
                      <option value="Asian" style={{ background: "#0c0c0e" }}>Asian</option>
                      <option value="Other" style={{ background: "#0c0c0e" }}>Other</option>
                      <option value="Prefer not to say" style={{ background: "#0c0c0e" }}>Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>COUNTRY</label>
                    <input
                      type="text"
                      placeholder="e.g. United States"
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    />
                  </div>
                </div>

                {/* Row: Address */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>STREET ADDRESS</label>
                    <input
                      type="text"
                      placeholder="e.g. 123 Main St"
                      value={editForm.streetAddress}
                      onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value })}
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>CITY</label>
                    <input
                      type="text"
                      placeholder="e.g. New York"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>STATE / PROVINCE</label>
                    <input
                      type="text"
                      placeholder="e.g. NY"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>ZIP / POSTAL CODE</label>
                    <input
                      type="text"
                      placeholder="e.g. 10001"
                      value={editForm.zipCode}
                      onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    />
                  </div>
                </div>

                {/* Row: Weight & Height */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <label style={{ fontSize: "16px", fontWeight: "900", color: "#555", letterSpacing: "1px" }}>WEIGHT</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button type="button" onClick={() => setEditForm({ ...editForm, weightUnit: "kg" })} style={{ background: "transparent", border: "none", color: editForm.weightUnit === "kg" ? "#FF5500" : "#555", fontSize: "16px", fontWeight: "900", cursor: "pointer" }}>KG</button>
                        <button type="button" onClick={() => setEditForm({ ...editForm, weightUnit: "lbs" })} style={{ background: "transparent", border: "none", color: editForm.weightUnit === "lbs" ? "#FF5500" : "#555", fontSize: "16px", fontWeight: "900", cursor: "pointer" }}>LBS</button>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={editForm.weight}
                      onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                      placeholder={editForm.weightUnit === "kg" ? "75" : "165"}
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <label style={{ fontSize: "16px", fontWeight: "900", color: "#555", letterSpacing: "1px" }}>HEIGHT ({editForm.heightUnit.toUpperCase()})</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button type="button" onClick={() => setEditForm({ ...editForm, heightUnit: "cm" })} style={{ background: "transparent", border: "none", color: editForm.heightUnit === "cm" ? "#FF5500" : "#555", fontSize: "16px", fontWeight: "900", cursor: "pointer" }}>CM</button>
                        <button type="button" onClick={() => setEditForm({ ...editForm, heightUnit: "ft_in" })} style={{ background: "transparent", border: "none", color: editForm.heightUnit === "ft_in" ? "#FF5500" : "#555", fontSize: "16px", fontWeight: "900", cursor: "pointer" }}>FT/IN</button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editForm.height}
                      onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                      placeholder={editForm.heightUnit === "cm" ? "180" : "5'11\""}
                      style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label style={{ display: "block", fontSize: "16px", fontWeight: "900", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>CITY / REGION</label>
                  <input
                    type="text"
                    placeholder="e.g. Los Angeles, CA"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "16px 20px", color: "white", outline: "none", fontSize: "16px" }}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: "24px 32px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.01)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "14px"
              }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "#ccc",
                    border: "1px solid rgba(255,255,255,0.05)",
                    padding: "12px 24px",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "900",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  className="hover-gray"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{
                    background: "linear-gradient(135deg, #FF5500 0%, #ff7700 100%)",
                    color: "white",
                    border: "none",
                    padding: "12px 32px",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "900",
                    cursor: editLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                    boxShadow: "0 10px 20px rgba(255, 85, 0, 0.25)"
                  }}
                  className="btn-glow-neon"
                >
                  {editLoading ? "SAVING CHANGES..." : "SAVE REGISTRY"}
                  {editLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      <Footer />

      {/* Extreme UI Styling & Keyframe Animations */}
      <style>{`
        @keyframes radarPulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes timelineScan {
          0% { transform: translateY(-100%); opacity: 0.1; }
          50% { opacity: 0.9; }
          100% { transform: translateY(350%); opacity: 0.1; }
        }
        @keyframes modalFadeIn {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .quest-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 85, 0, 0.25) !important;
          box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.6),
            0 0 20px rgba(255, 85, 0, 0.04) !important;
          background: rgba(18, 18, 22, 0.8) !important;
        }

        .btn-glow-neon:hover {
          opacity: 0.95;
          box-shadow: 0 0 20px rgba(255, 85, 0, 0.4) !important;
          transform: translateY(-2px);
        }

        .btn-secondary-hover:hover {
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255, 85, 0, 0.15) !important;
          transform: translateY(-2px);
        }

        .btn-danger-hover:hover {
          background: rgba(239, 68, 68, 0.12) !important;
          border-color: rgba(239, 68, 68, 0.25) !important;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(239, 68, 68, 0.08) !important;
        }

        .gold-btn-hover:hover {
          opacity: 0.9;
          box-shadow: 0 5px 15px rgba(212, 163, 89, 0.25) !important;
        }

        .hover-white:hover {
          background: rgba(255,255,255,0.08) !important;
          color: white !important;
        }

        .hover-gray:hover {
          background: rgba(255,255,255,0.08) !important;
        }
      `}</style>
    </div>
  );
};

export default Profile;
