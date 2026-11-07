import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Activity, 
  Dumbbell, 
  Target, 
  Trophy, 
  Gamepad2, 
  Waves, 
  Zap, 
  Brain, 
  ArrowRight, 
  ChevronRight, 
  Star, 
  Baby,
  Music,
  Gamepad,
  Palette,
  Bike,
  Timer as ClockIcon,
  Shield,
  Search,
  LayoutGrid,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

const Categories = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (location.state && typeof location.state.activeTab === "number") {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const allCategories = [
    { 
      name: "Athletics", 
      icon: <Activity />, 
      count: "142 Records", 
      desc: "Classic track and field events. Speed, agility, and pure athleticism.",
      subcategories: [
        { name: "Running", items: ["Sprinting", "Long Distance", "Relay Races", "Obstacle Running", "Backwards Running"] },
        { name: "Jumping", items: ["High Jump", "Long Jump", "Vertical Jump", "Standing Broad Jump"] },
        { name: "Throwing", items: ["Javelin Throw", "Discus Throw", "Shot Put", "Accuracy Throws"] },
        { name: "Speed Challenges", items: ["Fastest Mile", "Fastest Shuttle Run", "Stair Sprinting", "Cone Drills"] },
        { name: "Agility", items: ["Ladder Drills", "Footwork Challenges", "Speed Course Runs"] }
      ]
    },
    { 
      name: "Strength", 
      icon: <Dumbbell />, 
      count: "89 Records", 
      desc: "Lift more than anyone on the planet. Pure power, zero excuses.",
      subcategories: [
        { name: "Upper Body", items: ["Bench Press", "Push-Ups", "Pull-Ups", "Arm Wrestling", "Grip Strength"] },
        { name: "Lower Body", items: ["Squats", "Leg Press", "Wall Sits", "Lunges"] },
        { name: "Full Body", items: ["Deadlifts", "Tire Flips", "Atlas Stone Lifts", "Weighted Carries"] },
        { name: "Functional", items: ["Rope Pulling", "Object Carrying", "Vehicle Pulls", "Sandbag Challenges"] },
        { name: "Power", items: ["Punch Strength", "Kicking Power", "Sledgehammer Challenges"] }
      ]
    },
    { 
      name: "Endurance", 
      icon: <ClockIcon />, 
      count: "64 Records", 
      desc: "Go the distance. Push the absolute limits of human stamina.",
      subcategories: [
        { name: "Cardio", items: ["Cycling", "Treadmill Challenges", "Stair Climbing", "Continuous Running"] },
        { name: "Strength Endurance", items: ["Push-Up Marathons", "Pull-Up Endurance", "Plank Holds", "Squat Reps"] },
        { name: "Mental & Env.", items: ["Sleep Deprivation", "Cold Exposure", "Heat Challenges", "Survival"] },
        { name: "Multi-Day", items: ["Longest Duration", "Continuous Exercise Records"] }
      ]
    },
    { 
      name: "Balance", 
      icon: <Target />, 
      count: "32 Records", 
      desc: "Steady hands and focus. Mastery of equilibrium in any situation.",
      subcategories: [
        { name: "Static Balance", items: ["One-Leg Stands", "Handstands", "Headstands", "Balance Beam Holds"] },
        { name: "Object Balancing", items: ["Chair Balancing", "Pole Balancing", "Stack Balancing"] },
        { name: "Dynamic Balance", items: ["Slackline Walking", "Tightrope Challenges", "Rolling Balance"] },
        { name: "Extreme", items: ["Elevated Challenges", "Moving Surface Balancing"] }
      ]
    },
    { 
      name: "Skills", 
      icon: <Trophy />, 
      count: "112 Records", 
      desc: "Precision, technique, mastery. Show the world what you can do.",
      subcategories: [
        { name: "Precision", items: ["Card Throwing", "Trick Shots", "Accuracy Challenges", "Dart Challenges"] },
        { name: "Coordination", items: ["Juggling", "Cup Stacking", "Hand-Eye Coordination"] },
        { name: "Speed Skills", items: ["Puzzle Solving", "Rubik’s Cube", "Typing Speed"] },
        { name: "Object Manipulation", items: ["Yo-Yo Tricks", "Pen Spinning", "Coin Tricks"] }
      ]
    },
    { 
      name: "Gaming", 
      icon: <Gamepad2 />, 
      count: "256 Records", 
      desc: "From speedruns to high scores. Digital dominance, verified.",
      subcategories: [
        { name: "Speedrunning", items: ["Fastest Completion", "Category Speedruns"] },
        { name: "Score Challenges", items: ["Highest Scores", "Kill Records", "Combo Records"] },
        { name: "Competitive", items: ["Tournament Streaks", "Ranked Challenges"] },
        { name: "Emerging Tech", items: ["VR Challenges", "Mobile High Scores", "Retro/Arcade Records"] }
      ]
    },
    { 
      name: "Water Sports", 
      icon: <Waves />, 
      count: "45 Records", 
      desc: "Dominate the waves. Swimming, surfing, and aquatic achievements.",
      subcategories: [
        { name: "Swimming & Diving", items: ["Sprint/Distance", "Underwater", "High Diving", "Trick Diving"] },
        { name: "Surfing & Paddle", items: ["Longest Ride", "Biggest Wave", "Kayaking", "Canoeing", "Paddle Boarding"] },
        { name: "Water Tricks", items: ["Water Skiing", "Wakeboarding", "Jet Ski Challenges", "Floating Endurance"] }
      ]
    },
    { 
      name: "Reaction", 
      icon: <Zap />, 
      count: "78 Records", 
      desc: "Fastest on two feet or four wheels. Every millisecond counts.",
      subcategories: [
        { name: "Reflex Speed", items: ["Light Reaction", "Sound Reaction", "Catching Challenges"] },
        { name: "Combat & Gaming", items: ["Dodge Challenges", "Punch Reaction", "Aim Speed Challenges"] },
        { name: "Multi-Target", items: ["Rapid Response", "Split Decision Challenges"] }
      ]
    },
    { 
      name: "Mind & Memory", 
      icon: <Brain />, 
      count: "39 Records", 
      desc: "Cognitive greatness. Rubik's cubes, memory feats, and logic.",
      subcategories: [
        { name: "Memory & Math", items: ["Number/Card Memorization", "Name Recall", "Mental Math", "Fast Calc"] },
        { name: "Logic & Focus", items: ["Puzzle Completion", "Focus Duration", "Meditation Challenges"] },
        { name: "Strategy", items: ["Chess", "Strategy Games", "Planning Challenges"] }
      ]
    },
    { 
      name: "Action Sports", 
      icon: <Bike />, 
      count: "92 Records", 
      desc: "X-Games style adrenaline. Skating, BMX, and extreme feats.",
      subcategories: [
        { name: "Wheels", items: ["Skate Trick Records", "BMX Rotation", "Scooter Air Time", "Bike Wheelies"] },
        { name: "Parkour & Arts", items: ["Wall Runs", "Vault Challenges", "Board Breaking", "Kick Height"] },
        { name: "Extreme", items: ["Base Jumping", "Stunt Challenges", "Freestyle Challenges"] }
      ]
    },
    { 
      name: "Entertainment", 
      icon: <Star />, 
      count: "56 Records", 
      desc: "Show-stopping performances. Magic, stunts, and stage records.",
      subcategories: [
        { name: "Performance", items: ["Magic Tricks", "Stunt Records", "Stage Achievements", "Comedic Feats"] },
        { name: "Artistic", items: ["Live Drawing", "Artistic Speed Challenges", "Unique Creations"] }
      ]
    },
    { 
      name: "Creative Challenges", 
      icon: <Palette />, 
      count: "28 Records", 
      desc: "Art, design, and unique creations. Breaking boundaries through creativity.",
      subcategories: [
        { name: "Design", items: ["Architectural Challenges", "Digital Art", "Crafting Speed"] },
        { name: "Innovation", items: ["Unique Problem Solving", "Prototype Records"] }
      ]
    },
    { 
      name: "Youth Category", 
      icon: <Baby />, 
      count: "New Section", 
      desc: "Just for the next generation. Safe, fun, and highly competitive.",
      isYouth: true,
      subcategories: [
        { name: "Core Skills", items: ["Fastest Cup Stacking", "Longest Hula Hoop", "Basketball Shots (1 Min)", "Fastest Puzzle"] },
        { name: "Play & Game", items: ["Jump Rope", "Balloon Balancing", "Toy Building", "Memory Games", "Beginner Gaming"] }
      ]
    },
    { 
      name: "Other", 
      icon: <Sparkles />, 
      count: "Growing Section", 
      desc: "Unique talents and miscellaneous achievements that defy standard classification.",
      subcategories: [
        { name: "Miscellaneous", items: ["Collections", "Mass Participation", "Large Constructions", "Oddities"] },
        { name: "New Proposals", items: ["Emerging Talents", "Unusual Feats"] }
      ]
    }
  ];

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
                        <span style={{ fontSize: "14px", fontWeight: "900", color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.1em" }}>{currentCat.count} OFFICIAL RECORDS</span>
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
                              to={`/explore?category=${encodeURIComponent(currentCat.name)}&q=${encodeURIComponent(sub.name)}`}
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
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {sub.items.map((item, iIdx) => {
                              return (
                                <Link 
                                  to={`/explore?category=${encodeURIComponent(currentCat.name)}&q=${encodeURIComponent(item)}`} 
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
                    Innovation is at the heart of Rogue World Records. If you have a unique talent that doesn't fit our current index, you can submit a proposal for a new category.
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
