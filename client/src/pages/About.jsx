import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Camera, ShieldCheck, Zap, Quote, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import GlowCard from "../components/GlowCard";

const About = () => {

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
        
        {/* NAVBAR */}
        <Navbar />

        {/* HERO SECTION */}
        <header style={{ position: "relative", height: "90vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingTop: "80px" }}>
          <img loading="lazy" decoding="async" 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80" 
            alt="Athlete Lifting" 
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4, filter: "grayscale(100%) brightness(0.7)" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, #0A0A0A)" }} />
          
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", width: "90%", maxWidth: "900px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ color: "#FF6A00", fontWeight: "800", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.4em", marginBottom: "20px" }}>
              WELCOME TO
            </motion.div>
            <h1 style={{ fontSize: "clamp(36px, 6vw, 70px)", fontWeight: "950", lineHeight: "0.9", textTransform: "uppercase", letterSpacing: "-0.04em", marginBottom: "24px" }}>
              <ScrollReveal>AMPEX WORLD</ScrollReveal> <br />
              <span style={{ color: "#FF6A00" }}><ScrollReveal>RECORDS</ScrollReveal></span>
            </h1>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", maxWidth: "700px", margin: "0 auto 40px", lineHeight: "1.7" }}>
              At AMPEX World Records, we believe greatness belongs to everyone — not just professional athletes, celebrities, or people with millions of followers. Our mission is to give everyday people from around the world the opportunity to push limits, break barriers, and earn recognition for extraordinary achievements.
              <br/><br/>
              We were created for the dreamers, the grinders, the risk-takers, and the people willing to step outside their comfort zones to make history. Whether you are breaking a strength record, endurance challenge, gaming achievement, stunt performance, reaction challenge, balance record, or creating an entirely new category, AMPEX World Records is built to showcase human potential at every level.
            </motion.div>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.6 }} style={{ width: "80px", height: "4px", background: "#FF6A00", margin: "0 auto" }}></motion.div>
          </div>
        </header>

        {/* MISSION & VISION */}
        <main style={{ padding: "120px 5%", maxWidth: "1400px", margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "32px", marginBottom: "80px" }}>
              {/* OUR MISSION CARD */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6 }} 
                viewport={{ once: true }} 
                style={{ 
                  background: "rgba(255,255,255,0.02)", 
                  padding: "60px", 
                  borderRadius: "40px", 
                  border: "1px solid rgba(255,255,255,0.05)",
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '150px', fontWeight: '950', color: 'rgba(255,106,0,0.03)', userSelect: 'none', pointerEvents: 'none' }}>MISSION</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ background: '#FF6A00', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(255,106,0,0.2)' }}>
                    <Zap size={24} color="white" />
                  </div>
                  <h2 style={{ fontSize: "32px", fontWeight: "950", textTransform: "uppercase", letterSpacing: '-0.02em' }}>
                    OUR <span style={{ color: "#FF6A00" }}>MISSION</span>
                  </h2>
                </div>
                
                <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", lineHeight: "1.7", marginBottom: "32px" }}>
                  To create a fair, exciting, and accessible platform where anyone can become a world record holder.
                </p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {[
                    "Encouraging positive competition",
                    "Celebrating human achievement",
                    "Providing transparent verification",
                    "Building a worldwide community",
                    "Inspiring mental and physical growth"
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6A00' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* WHAT MAKES US DIFFERENT CARD */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, delay: 0.2 }} 
                viewport={{ once: true }} 
                style={{ 
                  background: "rgba(255,255,255,0.02)", 
                  padding: "60px", 
                  borderRadius: "40px", 
                  border: "1px solid rgba(255,255,255,0.05)",
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '150px', fontWeight: '950', color: 'rgba(255,106,0,0.03)', userSelect: 'none', pointerEvents: 'none' }}>UNIQUE</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ background: '#FF6A00', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(255,106,0,0.2)' }}>
                    <ShieldCheck size={24} color="white" />
                  </div>
                  <h2 style={{ fontSize: "32px", fontWeight: "950", textTransform: "uppercase", letterSpacing: '-0.02em' }}>
                    WHY <span style={{ color: "#FF6A00" }}>AMPEX?</span>
                  </h2>
                </div>
                
                <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", lineHeight: "1.7", marginBottom: "32px" }}>
                  We focus on accessibility and community engagement, offering innovative ways to track and celebrate success.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    "Global Accessibility",
                    "Video Verification",
                    "Live Competitions",
                    "Community Stats",
                    "Direct Challenges",
                    "Member Rewards"
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#FF6A00' }}>
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </ScrollReveal>
        </main>

        {/* VERIFICATION STANDARD */}
        <section style={{ padding: "100px 5%", background: "#0F0F0F", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <ScrollReveal>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <div style={{ marginBottom: "60px", textAlign: "center" }}>
                <h2 style={{ fontSize: "40px", fontWeight: "950", textTransform: "uppercase", marginBottom: "8px", color: "white" }}>
                  VERIFICATION PROCESS
                </h2>
                <p style={{ color: "#FF6A00", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "12px" }}>
                  INTEGRITY MATTERS.
                </p>
                <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: "700px", margin: "20px auto 0", fontSize: "14px", lineHeight: "1.6" }}>
                  Every record submission goes through a detailed verification process to help ensure fairness and authenticity. Depending on the challenge, submissions may require:
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", alignItems: "stretch" }}>
                {[
                  { 
                    icon: <Camera size={24} />, 
                    title: "VIDEO EVIDENCE", 
                    desc: "Uncut, continuous video footage to document the attempt." 
                  },
                  { 
                    icon: <Zap size={24} />, 
                    title: "MEASUREMENT & TIMING", 
                    desc: "Official timing and verified measurements using standard equipment." 
                  },
                  { 
                    icon: <ShieldCheck size={24} />, 
                    title: "JUDGE APPROVAL & WITNESSES", 
                    desc: "Witness statements, safety compliance reviews, and official judge approval." 
                  }
                ].map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.1 }} viewport={{ once: true }} style={{ display: 'flex' }}>
                    <GlowCard glowColor="orange" className="about-glow-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: "#FF6A00", color: "white", width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px", flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "16px", textTransform: "uppercase" }}>{item.title}</h3>
                        <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: "1.6", fontSize: "14px", flexGrow: 1 }}>{item.desc}</p>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))}
              </div>
              <p style={{ textAlign: "center", marginTop: "40px", fontSize: "16px", fontWeight: "bold", color: "white" }}>
                Our goal is to create a trusted system that competitors and fans can respect.
              </p>
            </div>
          </ScrollReveal>
        </section>

        {/* RECORD CATEGORIES */}
        <section style={{ padding: "120px 5%", background: "#0A0A0A" }}>
          <ScrollReveal>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <h2 style={{ fontSize: "36px", fontWeight: "950", textTransform: "uppercase", marginBottom: "30px", color: "white", textAlign: "center" }}>
                RECORD <span style={{ color: "#FF6A00" }}>CATEGORIES</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", maxWidth: "800px", margin: "0 auto 40px", fontSize: "16px" }}>
                Our growing list of achievements includes:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", maxWidth: "1000px", margin: "0 auto" }}>
                {[
                  { name: "Athletics", tabIdx: 0 },
                  { name: "Strength", tabIdx: 1 },
                  { name: "Endurance", tabIdx: 2 },
                  { name: "Balance", tabIdx: 3 },
                  { name: "Skills", tabIdx: 4 },
                  { name: "Gaming", tabIdx: 5 },
                  { name: "Water Sports", tabIdx: 6 },
                  { name: "Reaction", tabIdx: 7 },
                  { name: "Mind & Memory", tabIdx: 8 },
                  { name: "Action Sports", tabIdx: 9 },
                  { name: "Other", tabIdx: 13 }
                ].map((cat, idx) => (
                  <Link key={idx} to="/categories" state={{ activeTab: cat.tabIdx }} style={{ textDecoration: "none" }}>
                    <motion.div 
                      whileHover={{ scale: 1.05, background: "rgba(255,106,0,0.1)", borderColor: "#FF6A00", color: "#FF6A00" }}
                      style={{ 
                        background: "rgba(255,255,255,0.03)", 
                        padding: "14px 28px", 
                        borderRadius: "100px", 
                        border: "1px solid rgba(255,255,255,0.1)", 
                        fontSize: "14px", 
                        fontWeight: "700",
                        color: "white",
                        cursor: "pointer",
                        transition: "all 0.3s ease"
                      }}
                    >
                      {cat.name}
                    </motion.div>
                  </Link>
                ))}
              </div>
              <p style={{ textAlign: "center", marginTop: "40px", fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                We also allow users to submit proposals for entirely new world record categories.
              </p>
            </div>
          </ScrollReveal>
        </section>

        {/* OUR VISION */}
        <section style={{ padding: "100px 5%", maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }} style={{ background: "#161616", padding: "60px", borderRadius: "40px", display: "flex", alignItems: "center", gap: "60px", flexWrap: "wrap", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ position: "relative", flexShrink: 0, margin: "0 auto" }}>
              <div style={{ background: "rgba(255, 106, 0, 0.1)", width: "140px", height: "140px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "4px solid #FF6A00" }}>
                <Zap size={50} color="#FF6A00" />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <h3 style={{ fontSize: "28px", fontWeight: "900", lineHeight: "1.3", marginBottom: "20px", textTransform: "uppercase" }}>
                OUR <span style={{ color: "#FF6A00" }}>VISION</span>
              </h3>
              <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: "1.7", marginBottom: "20px", fontSize: "14px" }}>
                We envision AMPEX World Records becoming one of the world’s leading competitive achievement platforms — bringing together athletes, creators, gamers, entertainers, and innovators from across the globe.
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: "1.7", marginBottom: "16px", fontSize: "14px", fontWeight: "bold" }}>
                We want to inspire future generations to:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
                {["Dream bigger", "Push harder", "Stay disciplined", "Compete with integrity", "Believe in themselves"].map((vision, idx) => (
                  <div key={idx} style={{ background: "#0A0A0A", padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", fontSize: "13px", fontWeight: "700", color: "#FF6A00" }}>
                    {vision}
                  </div>
                ))}
              </div>
              <p style={{ color: "white", fontSize: "16px", fontWeight: "bold", fontStyle: "italic" }}>
                "Because sometimes one moment… one challenge… one victory… can change a person’s life forever."
              </p>
            </div>
          </motion.div>
        </section>

        {/* ══════════════════ IMPROVED CTA SECTION ══════════════════ */}
        <section className="orange-cta-section" style={{ padding: "80px 5% 120px" }}>
          <div className="orange-cta" style={{ maxWidth: "1200px", margin: "0 auto", borderRadius: "40px" }}>
            {/* Dynamic backgrounds matching landing page */}
            <div className="orange-cta-bg" />
            <div className="orange-cta-grid" />
            <div className="orange-cta-glow" />

            <div className="orange-cta-content" style={{ textAlign: "center" }}>
              <span className="orange-cta-badge" style={{ marginBottom: "24px" }}>Join the Movement</span>
              <h2 className="orange-cta-title" style={{ fontSize: "clamp(36px, 6vw, 70px)", marginBottom: "20px" }}>
                READY TO <span className="orange-cta-highlight">CHALLENGE</span> YOURSELF?
              </h2>
              <p className="orange-cta-subtitle" style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px", maxWidth: "700px", margin: "0 auto 40px", lineHeight: "1.6" }}>
                If you are ready to challenge yourself, inspire others, and become part of a growing worldwide community of record breakers, we invite you to join AMPEX World Records.
                <br/><br/>
                <strong style={{ fontSize: "20px", textTransform: "uppercase", letterSpacing: "0.05em", color: "white" }}>Break Limits. Make History. Become Legendary.</strong>
              </p>
              
              <div className="orange-cta-btns" style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", position: "relative", zIndex: 5 }}>
                <Link to="/elite" style={{ textDecoration: "none" }}>
                  <button className="btn-v2 btn-v2-dark" style={{ 
                    background: "#111", 
                    color: "white", 
                    padding: "18px 40px", 
                    borderRadius: "100px", 
                    fontWeight: "900", 
                    textTransform: "uppercase", 
                    fontSize: "14px", 
                    border: "none", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                    transition: "all 0.3s ease"
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow = "0 30px 60px rgba(0,0,0,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.2)";
                    }}
                  >
                    APPLY FOR MEMBERSHIP <ArrowRight size={18} />
                  </button>
                </Link>
                <Link to="/rules" style={{ textDecoration: "none" }}>
                  <button className="btn-v2" style={{ 
                    background: "#FFFFFF", 
                    color: "#FF6A00", 
                    padding: "18px 40px", 
                    borderRadius: "100px", 
                    fontWeight: "900", 
                    textTransform: "uppercase", 
                    fontSize: "14px", 
                    border: "1px solid #FFFFFF", 
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.3s ease",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.color = "#FFFFFF";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#FFFFFF";
                      e.currentTarget.style.color = "#FF6A00";
                      e.currentTarget.style.borderColor = "#FFFFFF";
                    }}
                  >
                    VIEW THE RULES <ChevronRight size={18} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <Footer />

      </div>
    </PageTransition>
  );
};

export default About;
