import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { apiCall, formatProductImage } from "../utils/api";
import SponsorBanner from "../components/SponsorBanner";
import { useAuth } from "../context/AuthContext";

const Shop = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("ALL ITEMS");
  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiCall("/shop", "GET");
        setDbProducts(data || []);
      } catch (err) {
        console.error("Failed to load products from database:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setActiveTab(cat.toUpperCase());
    } else {
      setActiveTab("ALL ITEMS");
    }
  }, [searchParams]);

  const categories = ["ALL ITEMS", "TICKETS", "CERTIFICATE", "AWARD", "MEDAL", "TROPHY", "APPAREL"];

  const hardcodedProducts = [

    {
      id: 5,
      title: "LIVE EVENT SPECTATOR PASS",
      price: "$15.00",
      desc: "Digital entry pass to witness live records. Includes live chat, backstage footage access, and multi-cam viewing.",
      img: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80",
      badge: "LIVE TICKETS",
      category: "TICKETS"
    },
    {
      id: 1,
      title: "OFFICIAL RECORD CERTIFICATE",
      price: "$45.00",
      desc: "Personalized heavy stock parchment with embossed authentication seal and archival ink.",
      img: "/images/athlete-certificate.webp",
      badge: "AUTHENTICATED",
      category: "CERTIFICATE"
    },
    {
      id: 2,
      title: "BRUSHED STEEL PLAQUE",
      price: "$120.00",
      desc: "Laser etched industrial grade steel with custom event details and mounting hardware.",
      img: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=600&q=80",
      badge: "ELITE LEVEL",
      category: "HARDWARE"
    },
    {
      id: 3,
      title: "ARENA OVERSIZED HOODIE",
      price: "$85.00",
      desc: "Heavyweight 500gsm french terry cotton with high-density silicone logo print.",
      img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80",
      badge: "APPAREL",
      category: "APPAREL"
    },
    {
      id: 4,
      title: "TITAN RECORD MEDAL",
      price: "$150.00",
      desc: "Solid brass core with silk gunplating. Custom engraved finish with woven rib.",
      img: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80",
      badge: "LEGENDARY",
      category: "LIMITED DROP"
    },
  ];

  const products = dbProducts.length > 0
    ? dbProducts.map(p => ({
        id: p.id,
        title: p.name,
        price: `$${parseFloat(p.price).toFixed(2)}`,
        desc: p.description,
        img: formatProductImage(p.image_url),
        badge: p.category?.toUpperCase() || "GEAR",
        category: p.category?.toUpperCase() || "APPAREL"
      }))
    : hardcodedProducts;

  const buttonHover = {

    onMouseEnter: (e) => {
      e.currentTarget.style.transform = "scale(1.05)";
      e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,106,0,0.3)";
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.boxShadow = "none";
    },
    onMouseDown: (e) => {
      e.currentTarget.style.transform = "scale(0.95)";
    },
    onMouseUp: (e) => {
      e.currentTarget.style.transform = "scale(1.05)";
    }
  };

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", fontFamily: "'Inter', sans-serif", minHeight: "100vh", paddingTop: "80px", display: "flex", flexDirection: "column" }}>

        {/* NAVBAR */}
        <Navbar />

        {/* HERO SECTION */}
        <header style={{ position: "relative", height: "60vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", margin: "20px 2.5%", borderRadius: "40px", marginTop: "20px" }}>
          <img loading="lazy" decoding="async"
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80"
            alt="Rogue Gear Shop"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, rgba(10,10,10,0.8))" }} />

          <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
            <div style={{ background: "#FF6A00", color: "white", display: "inline-block", padding: "4px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", marginBottom: "16px" }}>
              OFFICIAL GEAR
            </div>
            <h1 style={{ fontSize: "clamp(48px, 10vw, 100px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", marginBottom: "16px", lineHeight: "1.0" }}>
              <ScrollReveal>ROGUE GEAR &</ScrollReveal> <br />
              <span style={{ color: "#FF6A00" }}><ScrollReveal>CERTIFICATES</ScrollReveal></span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
              Commemorate your achievements with official verification hardware and elite-tier performance apparel.
            </p>
          </div>
        </header>

        {/* CATEGORY TABS */}
        <div style={{ padding: "0 5%", marginBottom: "40px", marginTop: "40px" }}>
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-start", flexWrap: "wrap", maxWidth: "1400px", margin: "0 auto" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveTab(cat);
                  if (cat === "ALL ITEMS") {
                    searchParams.delete("category");
                  } else {
                    searchParams.set("category", cat.toLowerCase());
                  }
                  setSearchParams(searchParams);
                }}
                style={{
                  padding: "10px 24px",
                  borderRadius: "100px",
                  background: activeTab === cat ? "#FF6A00" : "rgba(255, 255, 255, 0.05)",
                  color: activeTab === cat ? "white" : "rgba(255, 255, 255, 0.5)",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: "900",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textTransform: "uppercase"
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* TOAST NOTIFICATION CONTAINER */}
        {toast && (
          <div style={{
            position: "fixed",
            top: "120px",
            right: "5%",
            zIndex: 9999,
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
            gap: "12px"
          }}>
            <div style={{ width: "8px", height: "8px", background: "#FF6A00", borderRadius: "50%" }}></div>
            {toast}
          </div>
        )}


        {/* PRODUCT GRID */}
        <SponsorBanner placements={["shop"]} />
        <section style={{ padding: "0 5% 100px", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {products
              .filter(p => activeTab === "ALL ITEMS" || p.category === activeTab)
              .map((product) => (
                <div 
                  key={product.id} 
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{ 
                    background: "#161616", 
                    borderRadius: "32px", 
                    overflow: "hidden", 
                    border: "1px solid rgba(255,255,255,0.05)", 
                    display: "flex", 
                    flexDirection: "column",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#FF6A00";
                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(255, 106, 0, 0.15)";
                    e.currentTarget.style.transform = "translateY(-8px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ position: "relative", height: "220px" }}>
                    <img loading="lazy" decoding="async" src={product.img} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", top: "16px", right: "16px", background: "#FF6A00", color: "white", padding: "4px 12px", borderRadius: "8px", fontSize: "9px", fontWeight: "900" }}>
                      {product.badge}
                    </div>
                  </div>
                  <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "900", textTransform: "uppercase", width: "70%", lineHeight: "1.2" }}>{product.title}</h3>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#FF6A00" }}>{product.price}</div>
                    </div>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", lineHeight: "1.6", marginBottom: "24px" }}>{product.desc}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${product.id}`);
                      }}
                      {...buttonHover}
                      style={{
                        marginTop: "auto",
                        background: "#FF6A00",
                        color: "white",
                        border: "none",
                        borderRadius: "100px",
                        padding: "16px",
                        fontSize: "12px",
                        fontWeight: "900",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    >
                      VIEW DETAILS <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* PREMIUM ELITE CTA */}
        <section style={{ padding: "0 2.5% 120px" }}>
          <div style={{ 
            position: "relative", 
            borderRadius: "40px", 
            overflow: "hidden", 
            minHeight: "500px", 
            display: "flex", 
            alignItems: "center",
            boxShadow: "0 40px 80px rgba(0,0,0,0.8)"
          }}>
            {/* Background Image - Using a placeholder until the final asset is added to the repo */}
            <img loading="lazy" decoding="async" 
              src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1600&q=80" 
              alt="Elite Member" 
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} 
            />
            {/* Dark gradient fade from left to right */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.8) 40%, transparent 100%)" }} />

            <div style={{ position: "relative", zIndex: 10, padding: "80px", maxWidth: "800px", textAlign: "left" }}>
              <span style={{ 
                border: "1px solid #FF6A00", 
                color: "#FF6A00", 
                padding: "8px 20px", 
                borderRadius: "100px", 
                fontSize: "11px", 
                fontWeight: "900", 
                letterSpacing: "0.1em",
                display: "inline-block",
                marginBottom: "24px"
              }}>
                LEVEL UP YOUR STATUS
              </span>
              
              <h2 style={{ 
                fontSize: "clamp(60px, 8vw, 100px)", 
                fontWeight: "950", 
                marginBottom: "16px", 
                lineHeight: "0.9", 
                textTransform: "uppercase" 
              }}>
                <ScrollReveal>UNLOCKED</ScrollReveal><br/>
                <span style={{ color: "#FF6A00" }}><ScrollReveal>ACCESS</ScrollReveal></span>
              </h2>
              
              <p style={{ 
                color: "white", 
                fontSize: "18px", 
                maxWidth: "450px", 
                marginBottom: "40px", 
                lineHeight: "1.6",
                fontWeight: "500"
              }}>
                <ScrollReveal>Join the world's ultimate platform for record breakers, elite athletes, and unforgettable achievements.</ScrollReveal>
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <button
                  onClick={() => navigate('/elite')}
                  style={{
                    background: "#FF6A00",
                    color: "white",
                    border: "none",
                    borderRadius: "100px",
                    padding: "16px 32px",
                    fontSize: "14px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 10px 20px rgba(255,106,0,0.3)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  JOIN THE ELITE <Star size={16} fill="white" />
                </button>
                <button
                  onClick={() => navigate('/process')}
                  style={{
                    background: "transparent",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: "100px",
                    padding: "16px 32px",
                    fontSize: "14px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  LEARN MORE <ArrowRight size={16} />
                </button>
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

export default Shop;
