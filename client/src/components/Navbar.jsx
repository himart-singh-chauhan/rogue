import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X, User, LogOut, ChevronDown, BarChart3, Users, FileText, Settings, DollarSign, CreditCard, Layers, Target, Shield, ClipboardList, Sparkles, MessageSquare, ShieldAlert, Image, Layout, Lock, Server, TrendingUp, Megaphone, Crown, Home, Video, Tag } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [logoutToast, setLogoutToast] = useState("");
  const location = useLocation();
  const { user, logout } = useAuth();

  React.useEffect(() => {
    const toastMsg = sessionStorage.getItem('awr_logout_message');
    if (toastMsg) {
      setLogoutToast(toastMsg);
      sessionStorage.removeItem('awr_logout_message');
      const timer = setTimeout(() => setLogoutToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Records", to: "/explore-records" },
    { label: "Rankings", to: "/leaderboard" },
    { label: "Challenge", to: "/challenge" },
    { label: "Submit", to: "/verify" },
    { label: "Live Events", to: "/events" },
    { label: "Shop", to: "/shop" },
  ];

  const adminMenuItems = [
    { label: "Dashboard", icon: <BarChart3 size={16} />, to: "/admin?tab=dashboard" },
    { label: "Homepage Control", icon: <Home size={16} />, to: "/admin?tab=homepageControl" },
    { label: "User", icon: <Users size={16} />, to: "/admin?tab=user" },
    { label: "Submissions", icon: <FileText size={16} />, to: "/admin?tab=submissions" },
    { label: "Adjudicators", icon: <Shield size={16} />, to: "/admin?tab=adjudicators" },
    { label: "Verification Queue", icon: <ClipboardList size={16} />, to: "/admin?tab=verification-queue" },
    { label: "AI Controls", icon: <Sparkles size={16} />, to: "/admin?tab=aiVerification" },
    { label: "Communications", icon: <MessageSquare size={16} />, to: "/admin?tab=communications" },
    { label: "Moderation", icon: <ShieldAlert size={16} />, to: "/admin?tab=moderation" },
    { label: "Media Library", icon: <Image size={16} />, to: "/admin?tab=mediaLibrary" },
    { label: "Video Management", icon: <Video size={16} />, to: "/admin?tab=videoManagement" },
    { label: "Content Pages", icon: <Layout size={16} />, to: "/admin?tab=contentManagement" },
    { label: "Security & Logs", icon: <Lock size={16} />, to: "/admin?tab=security" },
    { label: "System Settings", icon: <Server size={16} />, to: "/admin?tab=systemSettings" },
    { label: "Monetization", icon: <TrendingUp size={16} />, to: "/admin?tab=monetization" },
    { label: "Sponsorships", icon: <Megaphone size={16} />, to: "/admin?tab=sponsorships" },
    { label: "VIP Competitors", icon: <Crown size={16} />, to: "/admin?tab=vip" },
    { label: "Challenges", icon: <Settings size={16} />, to: "/admin?tab=challenges" },
    { label: "Payments", icon: <DollarSign size={16} />, to: "/admin?tab=payments" },
    { label: "Coupons", icon: <Tag size={16} />, to: "/admin?tab=coupons" },
    { label: "Memberships", icon: <CreditCard size={16} />, to: "/admin?tab=memberships" },
    { label: "Shop Catalog", icon: <Layers size={16} />, to: "/admin?tab=products" },
    { label: "Shop Orders", icon: <CreditCard size={16} />, to: "/admin?tab=orders" },
    { label: "Categories", icon: <Layers size={16} />, to: "/admin?tab=categories" },
    { label: "Divisions", icon: <Target size={16} />, to: "/admin?tab=divisions" },
    { label: "Appeals", icon: <FileText size={16} />, to: "/admin?tab=appeals" },
    { label: "Leaderboards", icon: <BarChart3 size={16} />, to: "/admin?tab=leaderboards" },
  ];


  const isActive = (path) => {
    if (path === "/leaderboard") {
      return (
        location.pathname === "/leaderboard" ||
        location.pathname === "/local-leaderboards" ||
        location.pathname === "/global-rankings" ||
        location.pathname === "/global-leaderboard"
      );
    }
    return location.pathname === path;
  };

  return (
    <nav className="navbar" style={{ 
      background: location.pathname === "/" ? "rgba(255, 248, 245, 0.85)" : "#000",
      borderColor: location.pathname === "/" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
    }}>
      <div className="navbar-inner">
        {/* Logo - Left aligned */}
        <div className="nav-logo-wrap">
          <Link to="/" className="nav-logo-link-main">
            <img 
              src={location.pathname === "/" ? "/images/logo-dark.webp" : "/images/logo-light.webp"} 
              alt="ROGUE Logo"
              width={450}
              height={300}
              fetchPriority="high"
              className="nav-logo-img"
            />
          </Link>
        </div>

        {/* Desktop nav pill - Center aligned */}
        <div className="nav-pill" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {navLinks.map((l) => (
            <Link 
              key={l.label} 
              to={l.to} 
              className="nav-pill-item"
              style={{ 
                color: isActive(l.to) ? "white" : (location.pathname === "/" ? "#111" : "white"),
                fontWeight: isActive(l.to) ? "900" : "600",
                background: isActive(l.to) ? "#FF6A00" : "transparent",
                borderRadius: "100px",
                padding: "8px 20px"
              }}
            >
              {l.label}
            </Link>
          ))}

          {/* Admin Dropdown */}
          {user && user.isAdmin && (
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                style={{ 
                  color: location.pathname === "/" ? "#111" : "white",
                  fontWeight: isActive("/admin") ? "900" : "600",
                  background: isActive("/admin") ? "#FF6A00" : "transparent",
                  borderRadius: "100px",
                  padding: "8px 16px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px"
                }}
              >
                Admin <ChevronDown size={16} style={{ transform: adminDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }} />
              </button>

              {/* Admin Dropdown Menu */}
              {adminDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  marginTop: "8px",
                  background: "#161616",
                  border: "1px solid rgba(255,106,0,0.3)",
                  borderRadius: "12px",
                  minWidth: "440px",
                  zIndex: 1000,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  overflow: "hidden",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                }}>
                  {adminMenuItems.map((item, idx) => (
                    <Link 
                      key={idx}
                      to={item.to}
                      onClick={() => setAdminDropdownOpen(false)}
                      style={{ textDecoration: "none" }}
                    >
                      <div style={{
                        padding: "12px 16px",
                        color: "#FF6A00",
                        fontSize: "13px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        borderRight: idx % 2 === 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        background: "transparent"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,106,0,0.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {item.icon}
                        {item.label}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buttons - Right aligned */}
        <div className="nav-btns-wrap">
          {user ? (
            <>
              <Link to="/profile" className="desktop-only" style={{ textDecoration: 'none' }}>
                <button className="btn-nav-cta" style={{ color: location.pathname === "/" ? "#111" : "white" }}>
                  Profile
                  <span className="btn-nav-cta-circle"><User style={{ width: 14, height: 14 }} /></span>
                </button>
              </Link>
              <button onClick={logout} className="desktop-only btn-nav-cta" style={{ color: location.pathname === "/" ? "#111" : "white", background: 'transparent', border: 'none' }}>
                Logout
                <span className="btn-nav-cta-circle"><LogOut style={{ width: 14, height: 14 }} /></span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="desktop-only">
                <button className="btn-nav-cta" style={{ color: location.pathname === "/" ? "#111" : "white" }}>
                  Login
                  <span className="btn-nav-cta-circle"><ArrowRight style={{ width: 14, height: 14 }} /></span>
                </button>
              </Link>
              <Link to="/signup" className="desktop-only">
                <button className="btn-nav-cta" style={{ color: location.pathname === "/" ? "#111" : "white" }}>
                  Sign Up
                  <span className="btn-nav-cta-circle"><ArrowRight style={{ width: 14, height: 14 }} /></span>
                </button>
              </Link>
            </>
          )}
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="hamburger-btn"
            style={{ color: location.pathname === "/" ? "#111" : "white" }}
          >
            {mobileOpen ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu" style={{ background: location.pathname === "/" ? "#FFF8F5" : "#0A0A0A" }}>
          {navLinks.map(l => (
            <Link 
              key={l.label} 
              to={l.to} 
              onClick={() => setMobileOpen(false)} 
              className="mobile-nav-link"
              style={{ color: location.pathname === "/" ? "#111" : "white" }}
            >
              {l.label}
            </Link>
          ))}

          {/* Admin Mobile Menu */}
          {user && user.isAdmin && (
            <>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "10px", marginTop: "10px" }}>
                <div style={{ color: "#FF6A00", fontSize: "12px", fontWeight: "900", padding: "10px 16px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Admin Panel
                </div>
                {adminMenuItems.map((item, idx) => (
                  <Link 
                    key={idx}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="mobile-nav-link"
                    style={{ color: location.pathname === "/" ? "#111" : "white", paddingLeft: "32px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="mobile-menu-footer" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none" }}>
                  <button className="btn-nav-cta" style={{ width: "100%", justifyContent: "center", color: location.pathname === "/" ? "#111" : "white" }}>
                    Profile <span className="btn-nav-cta-circle"><User style={{ width: 14, height: 14 }} /></span>
                  </button>
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="btn-nav-cta" style={{ width: "100%", justifyContent: "center", color: location.pathname === "/" ? "#111" : "white", background: 'transparent', border: 'none' }}>
                  Logout <span className="btn-nav-cta-circle"><LogOut style={{ width: 14, height: 14 }} /></span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none" }}>
                  <button className="btn-nav-cta" style={{ width: "100%", justifyContent: "center", color: location.pathname === "/" ? "#111" : "white" }}>
                    Login <span className="btn-nav-cta-circle"><ArrowRight style={{ width: 14, height: 14 }} /></span>
                  </button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none" }}>
                  <button className="btn-nav-cta" style={{ width: "100%", justifyContent: "center", color: location.pathname === "/" ? "#111" : "white" }}>
                    Sign Up <span className="btn-nav-cta-circle"><ArrowRight style={{ width: 14, height: 14 }} /></span>
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      {logoutToast && (
        <div style={{
          position: "fixed",
          top: "120px",
          right: "5%",
          zIndex: 99999,
          background: "rgba(255, 106, 0, 0.15)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 106, 0, 0.4)",
          padding: "16px 28px",
          borderRadius: "16px",
          color: "white",
          fontSize: "14px",
          fontWeight: "800",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          animation: "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <div style={{ width: "8px", height: "8px", background: "#FF6A00", borderRadius: "50%", animation: "pulse 1s infinite" }}></div>
          {logoutToast}
          <style>{`
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.5); opacity: 0.5; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes slideIn {
              from { transform: translateY(-20px) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
