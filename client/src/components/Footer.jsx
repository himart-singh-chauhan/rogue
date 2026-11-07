import React from "react";
import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <footer className="footer" style={{ 
      background: isHomePage ? "" : "#000",
    }}>
      <div style={{ width: "100%" }}>
        <div className="footer-inner" style={{ alignItems: 'flex-start' }}>

          {/* Brand */}
          <div className="footer-brand">
            <div style={{ marginBottom: 5, marginTop: -30 }}>
              <img loading="lazy" decoding="async" src="/images/logo-light.webp" alt="ROGUE Logo" width={450} height={300} style={{ height: 150, width: "auto", display: 'block', mixBlendMode: 'screen' }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: "1.6", marginBottom: "24px", maxWidth: "260px" }}>
              Structured divisions ensure fairness, increase participation, and scale record categories globally.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { name: "X", url: "https://x.com/rogueworldrecords" },
                { name: "IG", url: "https://instagram.com/rogueworldrecords" },
                { name: "YT", url: "https://youtube.com/rogueworldrecords" },
                { name: "FB", url: "https://facebook.com/rogueworldrecords" }
              ].map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div className="social-btn">{s.name}</div>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="footer-links-grid">
            {[
              { t: "PLATFORM", ls: ["Explore Records", "Submit a Record", "Challenge a Record", "Leaderboard"] },
              { t: "INFO", ls: ["About Us", "Contact Us", "Verification Process", "Support / FAQs", "Appeal a Decision"] },
              { t: "LEGAL", ls: ["Terms of Service", "Privacy Policy", "Cookie Policy", "Adjudication Rules"] },
            ].map(col => (
              <div key={col.t}>
                <div className="footer-col-title" style={{ marginBottom: '20px', fontSize: '10px' }}>{col.t}</div>
                <ul className="footer-links" style={{ gap: '12px' }}>
                  {col.ls.map(l => {
                    let path = "#";
                    if (l === "About Us") path = "/about";
                    if (l === "Contact Us") path = "/contact";
                    if (l === "Explore Records") path = "/explore";
                    if (l === "Submit a Record") path = "/verify";
                    if (l === "Verification Process") path = "/process";
                    if (l === "Challenge a Record") path = "/challenge";
                    if (l === "Leaderboard") path = "/leaderboard";
                    if (l === "Support / FAQs") path = "/faq";
                    if (l === "Appeal a Decision") path = "/appeals";
                    if (l === "Privacy Policy") path = "/privacy";
                    if (l === "Terms of Service") path = "/terms";
                    if (l === "Cookie Policy") path = "/cookies";
                    if (l === "Adjudication Rules") path = "/rules";
                    
                    return (
                      <li key={l}>
                        <Link to={path} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "13px", fontWeight: "500", transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}>{l}</Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Large Branding Image - Positioned at bottom right, partially off-screen for cool effect */}
        <img loading="lazy" decoding="async" 
          src="/images/athlete-certificate.webp" 
          alt="Rogue Branding"
          width={467}
          height={700}
          style={{
            position: 'absolute', 
            right: "0", 
            bottom: "0",
            width: 'auto', 
            height: '350px', 
            pointerEvents: 'none',
            zIndex: 1,
            borderRadius: '12px',
            opacity: 1,
            transform: 'scaleX(-1)'
          }} 
        />

        {/* Bottom bar */}
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Rogue World Records. All rights reserved.</span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
