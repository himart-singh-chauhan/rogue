import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronRight, Shield, Search, LayoutGrid, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { useCategories, categoryMeta, recordTotal } from "../utils/categoryMeta";

const Categories = () => {
  const location = useLocation();
  const { tree } = useCategories();

  const allCategories = tree.map((c) => {
    const meta = categoryMeta(c.name);
    const Icon = meta.Icon;
    // Real subcategories saved in the admin panel come first, then example disciplines
    const official = (c.children || []).map((child) => {
      const childMeta = categoryMeta(child.name);
      return {
        name: child.name,
        categoryName: child.name,
        href: `/explore?category=${encodeURIComponent(child.name)}`,
        desc: child.description || childMeta.desc,
        items: childMeta.subs.flatMap((sub) => sub.items).slice(0, 6),
      };
    });
    return {
      id: c.id,
      name: c.name,
      childNames: (c.children || []).map((child) => child.name.toLowerCase()),
      icon: <Icon />,
      total: recordTotal(c),
      desc: c.description || meta.desc || `Official ${c.name} world records.`,
      subcategories: [...official, ...meta.subs],
    };
  });

  // Links from the homepage pass { category: "Name" } (older links pass { activeTab: index }).
  // A click on the sidebar wins until the next navigation.
  const [picked, setPicked] = useState({ key: null, idx: 0 });
  const wanted = location.state?.category ? String(location.state.category).toLowerCase() : null;
  const linkedIdx = wanted
    ? allCategories.findIndex((c) => c.name.toLowerCase() === wanted || c.childNames.includes(wanted))
    : typeof location.state?.activeTab === "number" ? location.state.activeTab : -1;
  const rawTab = picked.key === location.key ? picked.idx : linkedIdx >= 0 ? linkedIdx : 0;
  const activeTab = Math.min(Math.max(rawTab, 0), Math.max(allCategories.length - 1, 0));
  const setActiveTab = (idx) => setPicked({ key: location.key, idx });

  const currentCat = allCategories[activeTab];

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />

        {/* HERO HEADER */}
        <section style={{ padding: "180px 5% 60px", background: "linear-gradient(180deg, #111 0%, #0A0A0A 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(255,106,0,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <ScrollReveal>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#FF6A00", marginBottom: "20px" }}>
                <LayoutGrid size={20} />
                <span style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "0.2em", textTransform: "uppercase" }}>Master Index</span>
              </div>
              <h1 style={{ fontSize: "clamp(40px, 8vw, 90px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.9", marginBottom: "32px" }}>
                WORLD RECORD <br /> <span style={{ color: "#FF6A00" }}>DISCIPLINES</span>
              </h1>
            </ScrollReveal>
          </div>
        </section>

        {/* INTERACTIVE EXPLORER */}
        <section style={{ padding: "0 5% 120px", maxWidth: "1440px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "40px", alignItems: "start" }}>

            {/* SIDEBAR NAVIGATION */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "32px",
              padding: "20px",
              position: "sticky",
              top: "120px"
            }}>
              <div style={{ padding: "10px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Select Category</h3>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "calc(100vh - 350px)",
                  overflowY: "auto",
                  paddingRight: "10px",
                  overscrollBehavior: "none",
                  touchAction: "pan-y",
                  position: "relative",
                  zIndex: 10
                }}
                className="custom-scrollbar"
                onWheel={(e) => e.stopPropagation()}
              >
                {allCategories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px 20px",
                      background: activeTab === idx ? "rgba(255,106,0,0.1)" : "transparent",
                      border: "1px solid",
                      borderColor: activeTab === idx ? "rgba(255,106,0,0.2)" : "transparent",
                      borderRadius: "16px",
                      color: activeTab === idx ? "#FF6A00" : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      textAlign: "left"
                    }}
                  >
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: activeTab === idx ? "#FF6A00" : "rgba(255,255,255,0.05)",
                      color: activeTab === idx ? "black" : "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "0.3s"
                    }}>
                      {React.cloneElement(cat.icon, { size: 18 })}
                    </div>
                    <span style={{ fontWeight: "800", fontSize: "15px", textTransform: "uppercase" }}>{cat.name}</span>
                    {activeTab === idx && <motion.div layoutId="indicator" style={{ marginLeft: "auto" }}><ChevronRight size={18} /></motion.div>}
                  </button>
                ))}
              </div>
            </div>

            {/* CONTENT AREA */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "48px",
                  padding: "60px",
                  minHeight: "700px",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Background Decoration */}
                <div style={{ position: "absolute", top: "-100px", right: "-100px", fontSize: "400px", color: "rgba(255,106,0,0.03)", pointerEvents: "none" }}>
                  {currentCat.icon}
                </div>

                <div style={{ position: "relative", zIndex: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      <div style={{ width: "80px", height: "80px", background: "#FF6A00", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", color: "black", boxShadow: "0 20px 40px rgba(255,106,0,0.2)" }}>
                        {React.cloneElement(currentCat.icon, { size: 40 })}
                      </div>
                      <div>
                        <h2 style={{ fontSize: "48px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.02em" }}>{currentCat.name}</h2>
                        <span style={{ fontSize: "14px", fontWeight: "900", color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.1em" }}>{currentCat.total !== null ? `${currentCat.total.toLocaleString()} ` : ""}OFFICIAL RECORDS</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", marginBottom: "60px", maxWidth: "800px" }}>
                    {currentCat.desc}
                  </p>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "60px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
                      <Sparkles size={20} color="#FF6A00" />
                      <h3 style={{ fontSize: "18px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em" }}>Explore Subcategories</h3>
                    </div>                     <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
                      {currentCat.subcategories.map((sub, sIdx) => (
                        <div key={sIdx} style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: "24px",
                          padding: "32px",
                          transition: "0.3s",
                          cursor: "default"
                        }}>
                          <h4 style={{ fontSize: "16px", fontWeight: "900", color: "white", textTransform: "uppercase", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <Link
                              to={sub.href || `/explore?category=${encodeURIComponent(currentCat.name)}&q=${encodeURIComponent(sub.name)}`}
                              style={{
                                textDecoration: "none",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                cursor: "pointer",
                                transition: "color 0.2s"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = "#FF6A00"}
                              onMouseLeave={(e) => e.currentTarget.style.color = "white"}
                            >
                              <ChevronRight size={18} color="#FF6A00" /> {sub.name}
                            </Link>
                          </h4>
                          {sub.desc && (
                            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "-8px 0 16px" }}>{sub.desc}</p>
                          )}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {sub.items.map((item, iIdx) => {
                              return (
                                <Link
                                  to={`/explore?category=${encodeURIComponent(sub.categoryName || currentCat.name)}&q=${encodeURIComponent(item)}`} 
                                  key={iIdx}
                                  style={{ textDecoration: "none" }}
                                >
                                  <span style={{
                                    fontSize: "12px",
                                    color: "#FF6A00",
                                    background: "rgba(255, 106, 0, 0.05)",
                                    padding: "8px 16px",
                                    borderRadius: "10px",
                                    fontWeight: "700",
                                    border: "1px solid rgba(255, 106, 0, 0.2)",
                                    transition: "all 0.3s ease",
                                    cursor: "pointer",
                                    display: "inline-block"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#FF6A00";
                                    e.currentTarget.style.color = "white";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 6px 15px rgba(255,106,0,0.3)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(255, 106, 0, 0.05)";
                                    e.currentTarget.style.color = "#FF6A00";
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "none";
                                  }}
                                  >
                                    {item}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: "80px", display: "flex", gap: "20px" }}>
                    <Link to="/verify" style={{ textDecoration: "none" }}>
                      <button style={{
                        background: "#FF6A00",
                        color: "white",
                        padding: "20px 40px",
                        borderRadius: "100px",
                        border: "none",
                        fontSize: "15px",
                        fontWeight: "900",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        boxShadow: "0 20px 40px rgba(255,106,0,0.2)"
                      }}>
                        START AN ATTEMPT <ArrowRight size={20} />
                      </button>
                    </Link>
                    <Link to="/rules" style={{ textDecoration: "none" }}>
                      <button style={{
                        background: "transparent",
                        color: "white",
                        padding: "20px 40px",
                        borderRadius: "100px",
                        border: "1px solid rgba(255,255,255,0.2)",
                        fontSize: "15px",
                        fontWeight: "900",
                        textTransform: "uppercase",
                        cursor: "pointer"
                      }}>
                        READ RULES
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* HELP SECTION */}
        <section style={{ padding: "100px 5% 160px", background: "#0F0F0F" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
              <ScrollReveal>
                <div style={{ background: "rgba(255,106,0,0.05)", border: "1px solid rgba(255,106,0,0.1)", borderRadius: "40px", padding: "60px" }}>
                  <Shield size={48} color="#FF6A00" style={{ marginBottom: "32px" }} />
                  <h2 style={{ fontSize: "36px", fontWeight: "950", textTransform: "uppercase", marginBottom: "20px" }}>OFFICIAL VERIFICATION</h2>
                  <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", lineHeight: "1.7", marginBottom: "32px" }}>
                    Every record category is governed by official adjudication standards. Our team of experts ensures that every attempt is measured, timed, and verified with absolute precision.
                  </p>
                  <Link to="/rules" style={{ color: "#FF6A00", fontWeight: "900", textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                    LEARN ABOUT ADJUDICATION <ArrowRight size={18} />
                  </Link>
                </div>
              </ScrollReveal>
              <ScrollReveal>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "40px", padding: "60px" }}>
                  <Search size={48} color="#FF6A00" style={{ marginBottom: "32px" }} />
                  <h2 style={{ fontSize: "36px", fontWeight: "950", textTransform: "uppercase", marginBottom: "20px" }}>CAN'T FIND A CATEGORY?</h2>
                  <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", lineHeight: "1.7", marginBottom: "32px" }}>
                    Innovation is at the heart of AMPEX World Records. If you have a unique talent that doesn't fit our current index, you can submit a proposal for a new category.
                  </p>
                  <Link to="/contact" style={{ color: "#FF6A00", fontWeight: "900", textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                    PROPOSE NEW CATEGORY <ArrowRight size={18} />
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <Footer />

        <style>{`
          .custom-scrollbar {
            overscroll-behavior: none;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.1) transparent;
            -ms-overflow-style: none;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.01);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #FF6A00;
          }
        `}</style>
      </div>
    </PageTransition>
  );
};

export default Categories;
