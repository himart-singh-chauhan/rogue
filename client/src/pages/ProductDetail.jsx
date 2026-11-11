import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingBag, Plus, Minus, Check, Star, AlertCircle } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { apiCall, formatProductImage } from "../utils/api";
import { normalizeShopCategory } from "../utils/shopCategories";
import { useAuth } from "../context/AuthContext";
import "../styles/shop.css";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dbProduct, setDbProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (id && id.length > 8) { // DB UUIDs are long
          const data = await apiCall(`/shop/${id}`, "GET");
          setDbProduct(data);
        }
      } catch (err) {
        console.error("Failed to query product from database:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const hardcodedProducts = [

    {
      id: 5,
      title: "LIVE EVENT SPECTATOR PASS",
      price: "$15.00",
      desc: "Digital entry pass to witness live records. Includes live chat, backstage footage access, and multi-cam viewing.",
      img: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80",
      badge: "LIVE TICKETS",
      category: "TICKETS",
      fullDesc: "Gain front-row access to the most high-stakes, adrenaline-fueled record attempts on the planet. The Live Event Spectator Pass grants you full high-definition video access, live chat participation with fans and competitors worldwide, exclusive pre-show and post-show interviews, and selectable multi-camera angles. Do not miss a single second of history in the making.",
      sizes: ["Regular Pass", "VIP Backstage Pass (+ $10)"],
      colors: []
    },
    {
      id: 1,
      title: "OFFICIAL RECORD CERTIFICATE",
      price: "$45.00",
      desc: "Personalized heavy stock parchment with embossed authentication seal and archival ink.",
      img: "/images/athlete-certificate.webp",
      badge: "AUTHENTICATED",
      category: "CERTIFICATES",
      fullDesc: "Commemorate your historic achievement with our premium, high-quality Official Record Certificate. Crafted using heavy-stock archival linen parchment, this document features a high-density embossed authentication seal, customized calligraphic lettering, and official signatures of AMPEX network adjudicators. Perfect for framing and high-end showcases.",
      sizes: ["8.5\" x 11\"", "11\" x 14\" (+ $15)"],
      colors: []
    },
    {
      id: 2,
      title: "BRUSHED STEEL PLAQUE",
      price: "$120.00",
      desc: "Laser etched industrial grade steel with custom event details and mounting hardware.",
      img: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=600&q=80",
      badge: "ELITE LEVEL",
      category: "HARDWARE",
      fullDesc: "For the absolute highest tier of recognition, the Brushed Steel Plaque is built to last a lifetime. Laser etched on heavy-duty industrial-grade brushed stainless steel and mounted on a solid matte-black backing, this plaque displays your record category, authenticated parameters, and completion dates. Premium heavy-duty wall mounting brackets are included.",
      sizes: ["Small (6\"x8\")", "Large (9\"x12\") (+ $40)"],
      colors: []
    },
    {
      id: 3,
      title: "ARENA OVERSIZED HOODIE",
      price: "$85.00",
      desc: "Heavyweight 500gsm french terry cotton with high-density silicone logo print.",
      img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80",
      badge: "APPAREL",
      category: "APPAREL",
      fullDesc: "Exclusively designed for AMPEX athletes and elite supporters. Crafted from ultra-dense 500gsm French Terry cotton, the Arena Oversized Hoodie offers unparalleled comfort, warmth, and structure. Featuring a drop-shoulder cut, lined double-hood, and a sleek matte high-density silicone chest print, it is the ultimate streetwear-inspired athletic statement.",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      colors: ["Matte Black", "Off-White", "AMPEX Orange"]
    },
    {
      id: 4,
      title: "TITAN RECORD MEDAL",
      price: "$150.00",
      desc: "Solid brass core with silk gunplating. Custom engraved finish with woven rib.",
      img: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80",
      badge: "LEGENDARY",
      category: "LIMITED DROP",
      fullDesc: "Handcrafted in limited batches, the Titan Record Medal represents the pinnacle of AMPEX prestige. Each medal features a solid brass core with a premium sandblasted finish, heavy-plated satin gunmetal framing, and custom engraved reverse-side detailing. Suspended from a premium heavyweight woven neck ribbon with high-strength clips.",
      sizes: ["Standard Edition"],
      colors: []
    },
  ];

  const product = dbProduct
    ? {
        id: dbProduct.id,
        title: dbProduct.name,
        price: dbProduct.price,
        desc: dbProduct.description,
        img: formatProductImage(dbProduct.image_url),
        badge: normalizeShopCategory(dbProduct.category),
        category: normalizeShopCategory(dbProduct.category),
        requiresAuthorization: !!dbProduct.requires_authorization,
        fullDesc: dbProduct.description,
        sizes: Array.isArray(dbProduct.sizes) ? dbProduct.sizes.map(sz => sz.size) : [],
        dbSizes: dbProduct.sizes || [],
        imageUrls: dbProduct.image_urls || [],
        colors: []
      }
    : (hardcodedProducts.find(p => String(p.id) === String(id)) || hardcodedProducts[0]);


  const allImages = product ? [product.img, ...(product.imageUrls || [])].filter(Boolean).map(url => url.startsWith('http') ? url : formatProductImage(url)) : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [added, setAdded] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");

  // Championship belts etc.: per-competitor approval
  const { user } = useAuth();
  const [authStatus, setAuthStatus] = useState("none");
  const [authNote, setAuthNote] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  useEffect(() => {
    if (!user?.token || !id || String(id).length < 30) return;
    apiCall(`/shop/${id}/authorization`, "GET", null, user.token)
      .then((a) => { setAuthStatus(a.status || "none"); setAuthNote(a.adminNote || ""); })
      .catch(() => {});
  }, [id, user?.token]);
  const requestApproval = async () => {
    setAuthBusy(true);
    try {
      const a = await apiCall(`/shop/${id}/authorization`, "POST", {}, user.token);
      setAuthStatus(a.status || "pending");
    } catch (err) {
      alert(err.message);
    } finally {
      setAuthBusy(false);
    }
  };
  const [sizeError, setSizeError] = useState("");

  useEffect(() => {
    if (product) {
      // Only auto-select if exactly one size option — force deliberate choice for multi-size
      if (product.sizes.length === 1) {
        setSelectedSize(product.sizes[0]);
      } else {
        setSelectedSize("");
      }
      setSelectedColor(product.colors[0] || "");
    }
  }, [product?.id]);

  const incrementQty = () => setQuantity(q => q + 1);
  const decrementQty = () => setQuantity(q => q > 1 ? q - 1 : 1);

  const getCalculatedPrice = () => {
    if (!product) return 0;

    // If database product sizes exist, read the size-based price directly
    if (product.dbSizes && Array.isArray(product.dbSizes) && product.dbSizes.length > 0) {
      const foundSize = product.dbSizes.find(sz => sz.size === selectedSize);
      if (foundSize) {
        return parseFloat(foundSize.price || product.price);
      }
    }

    // Fallback for hardcoded products
    let basePrice = typeof product.price === 'number' ? product.price : parseFloat(String(product.price).replace(/[^0-9.]/g, ""));
    if (selectedSize) {
      const match = selectedSize.match(/\(\+\s*\$(\d+(\.\d+)?)\)/);

      if (match) {
        basePrice += parseFloat(match[1]);
      }
    }
    return basePrice;
  };

  const handleAddToCart = () => {
    if (product.requiresAuthorization && authStatus !== "approved") {
      document.getElementById("authorization-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // Required size guard — block if sizes exist but none selected
    if (product.sizes.length > 0 && !selectedSize) {
      setSizeError("Please select an award size before adding to cart.");
      document.getElementById("size-selector-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSizeError("");

    const numericPrice = getCalculatedPrice();
    const cartItem = {
      id: product.id,
      title: product.title,
      price: numericPrice,
      img: product.img,
      qty: quantity,
      size: selectedSize,
      color: selectedColor,
      notes: orderNotes.trim()
    };

    let currentCart = [];
    try {
      const stored = localStorage.getItem("rogue_cart_items");
      if (stored) {
        currentCart = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse cart items from localStorage:", e);
    }

    const existingIndex = currentCart.findIndex(
      item => item.id === product.id && item.size === selectedSize && item.color === selectedColor && (item.notes || "") === orderNotes.trim()
    );

    if (existingIndex > -1) {
      currentCart[existingIndex].qty += quantity;
    } else {
      currentCart.push(cartItem);
    }

    localStorage.setItem("rogue_cart_items", JSON.stringify(currentCart));

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      navigate("/cart");
    }, 1500);
  };

  if (loading && id && id.length > 8) {
    return (
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />
        <div style={{ width: "50px", height: "50px", border: "4px solid rgba(255,106,0,0.1)", borderTop: "4px solid #FF6A00", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "20px", color: "#666", letterSpacing: "1px", fontSize: "12px", fontWeight: "bold" }}>LOADING PRODUCT DETAILS...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <PageTransition>

      <div style={{ background: "#0A0A0A", color: "white", fontFamily: "'Inter', sans-serif", minHeight: "100vh", paddingTop: "80px", display: "flex", flexDirection: "column" }}>

        {/* NAVBAR */}
        <Navbar />

        {/* DETAIL CONTAINER */}
        <div style={{ flex: 1, padding: "60px 5% 120px", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>

          {/* BACK BREADCRUMBS */}
          <div style={{ marginBottom: "40px" }}>
            <Link to="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "12px", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            >
              <ArrowLeft size={16} /> BACK TO SHOP
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "64px", alignItems: "start" }}>

            {/* LEFT COLUMN: IMAGE DISPLAY */}
            {/* LEFT COLUMN: IMAGE DISPLAY (CAROUSEL) */}
            <div className={`pd-gallery${allImages.length > 1 ? " has-thumbs" : ""}`}>
              <style>{`
                .pd-gallery.has-thumbs { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 16px; align-items: start; }
                .pd-gallery .pd-thumbs { display: flex; flex-direction: column; gap: 12px; grid-row: 1; grid-column: 1; max-height: min(550px, 90vw); overflow-y: auto; }
                .pd-gallery .pd-main { grid-row: 1; grid-column: 2; min-width: 0; }
                @media (max-width: 900px) {
                  .pd-gallery.has-thumbs { display: flex; flex-direction: column; }
                  .pd-gallery .pd-thumbs { flex-direction: row; order: 2; overflow-x: auto; overflow-y: hidden; max-height: none; }
                }
              `}</style>
              <div className="pd-main" style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", position: "relative", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
                <img loading="lazy" decoding="async" src={allImages[currentImageIndex] || product.img} alt={product.title} style={{ width: "100%", height: "min(550px, 90vw)", objectFit: "contain", objectPosition: "center", background: "#0d0d0d", padding: "16px", boxSizing: "border-box", transition: "opacity 0.3s ease-in-out" }} />
                <div style={{ position: "absolute", top: "24px", right: "24px", background: "#FF6A00", color: "white", padding: "6px 16px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", letterSpacing: "0.05em", zIndex: 10 }}>
                  {product.badge}
                </div>

                {allImages.length > 1 && (
                  <>
                    <button onClick={prevImage} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", color: "white", width: "40px", height: "40px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", backdropFilter: "blur(4px)", zIndex: 10 }}>
                      <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextImage} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", color: "white", width: "40px", height: "40px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", backdropFilter: "blur(4px)", zIndex: 10 }}>
                      <ChevronRight size={24} />
                    </button>
                    <div style={{ position: "absolute", bottom: "24px", left: "0", right: "0", display: "flex", justifyContent: "center", gap: "8px", zIndex: 10 }}>
                      {allImages.map((_, idx) => (
                        <div key={idx} onClick={() => setCurrentImageIndex(idx)} style={{ width: "8px", height: "8px", borderRadius: "50%", background: currentImageIndex === idx ? "#FF6A00" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.2s" }} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Side pictures: a column beside the main picture (a row under it on phones) */}
              {allImages.length > 1 && (
                <div className="pd-thumbs custom-scrollbar" role="tablist" aria-label="Product pictures">
                  {allImages.map((imgUrl, idx) => (
                    <button type="button" key={idx} onClick={() => setCurrentImageIndex(idx)} aria-label={`Picture ${idx + 1}`} aria-selected={currentImageIndex === idx}
                      style={{ width: "88px", height: "88px", padding: 0, borderRadius: "12px", border: currentImageIndex === idx ? "2px solid #FF6A00" : "2px solid rgba(255,255,255,0.06)", overflow: "hidden", cursor: "pointer", flexShrink: 0, opacity: currentImageIndex === idx ? 1 : 0.65, transition: "all 0.2s", background: "#0d0d0d" }}>
                      <img loading="lazy" decoding="async" src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", background: "#0d0d0d", display: "block" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: INFORMATION & SELECTION */}
            <div>
              <ScrollReveal>
                <div style={{ background: "rgba(255,106,0,0.1)", color: "#FF6A00", display: "inline-block", padding: "6px 14px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
                  {product.category}
                </div>

                <h1 style={{ fontSize: "clamp(28px, 3.4vw, 44px)", fontWeight: "900", textTransform: "none", letterSpacing: "-0.01em", marginBottom: "16px", lineHeight: "1.15" }}>
                  {product.title}
                </h1>

                <div style={{ fontSize: "28px", fontWeight: "950", color: "#FF6A00", marginBottom: "24px" }}>
                  ${getCalculatedPrice().toFixed(2)}
                </div>

                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", lineHeight: "1.7", marginBottom: "32px", textTransform: "none", whiteSpace: "pre-line" }}>
                  {product.fullDesc}
                </p>

                <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.05)", marginBottom: "32px" }} />

                {/* SIZES / OPTIONS */}
                {product.sizes.length > 0 && (
                  <div id="size-selector-section" style={{ marginBottom: "28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>SELECT OPTION / SIZE</label>
                      {product.sizes.length > 1 && (
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.08em" }}>REQUIRED</span>
                      )}
                    </div>

                    {sizeError && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "12px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", fontWeight: "700", color: "#ef4444" }}>
                        <AlertCircle size={14} />
                        {sizeError}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {product.sizes.map((size, idx) => {
                        const isSelected = selectedSize === size;
                        // For DB products, find matching size data for price/stock
                        const dbSizeData = product.dbSizes?.find(sz => sz.size === size);
                        const sizePrice = dbSizeData ? parseFloat(dbSizeData.price || 0).toFixed(2) : null;
                        const sizeStock = dbSizeData ? (dbSizeData.stock ?? dbSizeData.stockCount ?? null) : null;
                        return (
                          <button
                            key={size}
                            onClick={() => { setSelectedSize(size); setSizeError(""); }}
                            style={{
                              padding: sizePrice ? "10px 20px" : "12px 24px",
                              borderRadius: "16px",
                              background: isSelected ? "linear-gradient(135deg, #FF6A00, #FF8C00)" : "rgba(255,255,255,0.03)",
                              color: isSelected ? "white" : "rgba(255,255,255,0.65)",
                              border: isSelected ? "2px solid #FF6A00" : "1px solid rgba(255,255,255,0.08)",
                              fontSize: "12px",
                              fontWeight: "900",
                              cursor: "pointer",
                              transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "2px",
                              boxShadow: isSelected ? "0 6px 20px rgba(255,106,0,0.35), 0 0 0 3px rgba(255,106,0,0.15)" : "none",
                              transform: isSelected ? "scale(1.04)" : "scale(1)",
                              minWidth: "80px"
                            }}
                            onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,106,0,0.1)"; e.currentTarget.style.borderColor = "rgba(255,106,0,0.4)"; e.currentTarget.style.color = "#FF6A00"; } }}
                            onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; } }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              {isSelected && <Check size={11} />}
                              {size}
                            </span>
                            {sizePrice && (
                              <span style={{ fontSize: "10px", fontWeight: "700", opacity: 0.85 }}>${sizePrice}</span>
                            )}
                            {sizeStock !== null && (
                              <span style={{ fontSize: "9px", fontWeight: "600", opacity: 0.6 }}>{sizeStock} in stock</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* COLORS */}
                {product.colors.length > 0 && (
                  <div style={{ marginBottom: "28px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>SELECT COLOR</label>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {product.colors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          style={{
                            padding: "12px 24px",
                            borderRadius: "100px",
                            background: selectedColor === color ? "#FF6A00" : "rgba(255, 255, 255, 0.03)",
                            color: selectedColor === color ? "white" : "rgba(255, 255, 255, 0.6)",
                            border: selectedColor === color ? "1px solid #FF6A00" : "1px solid rgba(255, 255, 255, 0.05)",
                            fontSize: "12px",
                            fontWeight: "800",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* QUANTITY SELECTOR */}
                <div style={{ marginBottom: "40px" }}>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>QUANTITY</label>
                  <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "100px", padding: "6px" }}>
                    <button
                      onClick={decrementQty}
                      style={{ background: "transparent", border: "none", color: "white", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="text"
                      value={quantity}
                      readOnly
                      style={{ background: "transparent", border: "none", color: "white", width: "48px", textAlign: "center", fontSize: "14px", fontWeight: "900", outline: "none" }}
                    />
                    <button
                      onClick={incrementQty}
                      style={{ background: "transparent", border: "none", color: "white", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* SELECTED SIZE BADGE (shows selected variation above CTA) */}
                {selectedSize && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", padding: "10px 16px", background: "rgba(255,106,0,0.06)", border: "1px solid rgba(255,106,0,0.2)", borderRadius: "12px" }}>
                    <Check size={13} color="#FF6A00" />
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Selected:</span>
                    <span style={{ fontSize: "12px", fontWeight: "900", color: "#FF6A00" }}>{selectedSize}</span>
                    <span style={{ marginLeft: "auto", fontSize: "13px", fontWeight: "950", color: "white" }}>${getCalculatedPrice().toFixed(2)}</span>
                  </div>
                )}

                {product.requiresAuthorization && (
                  <div id="authorization-panel" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "16px", padding: "18px 20px", marginBottom: "20px" }}>
                    <div style={{ color: "#fbbf24", fontWeight: 800, fontSize: "13px", marginBottom: "6px" }}>Approval required</div>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: 1.6, margin: "0 0 12px 0" }}>
                      {product.title} can only be purchased by a competitor an administrator has approved for this item.
                    </p>
                    {!user ? (
                      <Link to="/login" style={{ color: "#FF6A00", fontWeight: 800, fontSize: "13px" }}>Log in to request approval</Link>
                    ) : authStatus === "approved" ? (
                      <div style={{ color: "#22c55e", fontWeight: 800, fontSize: "13px" }}>✓ You are approved to purchase this item.</div>
                    ) : authStatus === "pending" ? (
                      <div style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: "13px" }}>Your request is waiting for an administrator's decision.</div>
                    ) : authStatus === "denied" || authStatus === "revoked" ? (
                      <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "13px" }}>Your request was not approved.{authNote ? ` Note: ${authNote}` : ""}</div>
                    ) : authStatus === "fulfilled" ? (
                      <div style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: "13px" }}>You have already purchased this item.</div>
                    ) : (
                      <button
                        onClick={requestApproval}
                        disabled={authBusy}
                        style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "10px 20px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}
                      >
                        {authBusy ? "Sending..." : "Request purchase approval"}
                      </button>
                    )}
                  </div>
                )}

                {/* ORDER COMMENT BOX: e.g. the name, record and date to print on an ordered certificate */}
                <div style={{ marginBottom: "24px" }}>
                  <label htmlFor="order-notes" style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
                    Comments for this item (optional)
                  </label>
                  <textarea
                    id="order-notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value.slice(0, 2000))}
                    rows={4}
                    placeholder={/certificate|plaque|award|medal|trophy|belt/i.test(`${product.title} ${product.category}`)
                      ? "Tell us what to put on it: full name, record title, result, date achieved, certificate number…"
                      : "Anything we should know about this item (size notes, personalisation, delivery)…"}
                    style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "14px 16px", color: "white", fontSize: "14px", lineHeight: 1.5, fontFamily: "inherit", resize: "vertical", outline: "none" }}
                  />
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "6px", textAlign: "right" }}>{orderNotes.length}/2000</div>
                </div>

                {/* ADD TO CART ACTION BUTTON */}
                <button
                  id="add-to-cart-btn"
                  onClick={handleAddToCart}
                  style={{
                    width: "100%",
                    background: added ? "#22c55e" : "#FF6A00",
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
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: added ? "0 10px 30px rgba(34,197,94,0.3)" : "0 10px 30px rgba(255,106,0,0.3)"
                  }}
                  onMouseEnter={e => {
                    if (!added) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 15px 35px rgba(255,106,0,0.4)";
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = added ? "0 10px 30px rgba(34,197,94,0.3)" : "0 10px 30px rgba(255,106,0,0.3)";
                  }}
                >
                  {added ? (
                    <>
                      ADDED SUCCESSFULLY <Check size={18} />
                    </>
                  ) : (
                    <>
                      ADD TO CART <ShoppingBag size={18} />
                    </>
                  )}
                </button>

              </ScrollReveal>
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <Footer />

      </div>
    </PageTransition>
  );
};

export default ProductDetail;
