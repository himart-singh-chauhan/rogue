import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Star, 
  ShieldCheck, 
  Zap, 
  Crown, 
  ArrowRight, 
  Check, 
  Trophy, 
  Activity, 
  Shield, 
  Globe, 
  User, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Gem,
  Rocket,
  AlertCircle
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { motion } from "motion/react";
import { apiCall } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const EliteMembership = () => {
  const { user } = useAuth();
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [activeTab, setActiveTab] = useState("MONTHLY");
  const [selectedTier, setSelectedTier] = useState("silver");
  const [selectedPack, setSelectedPack] = useState(1);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [billingZip, setBillingZip] = useState("");
  const [formError, setFormError] = useState("");
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const formatAmex = (digits) => {
    let formatted = "";
    if (digits.length > 0) formatted += digits.substring(0, 4);
    if (digits.length > 4) formatted += " " + digits.substring(4, 10);
    if (digits.length > 10) formatted += " " + digits.substring(10, 15);
    return formatted;
  };

  const formatStandard = (digits) => {
    let parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.substring(i, i + 4));
    }
    return parts.join(" ");
  };

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const isAmex = raw.startsWith("34") || raw.startsWith("37");
    const isStandard = raw.startsWith("4") || 
                       /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(raw) || 
                       /^(6011|622|64[4-9]|65)/.test(raw);
    const maxLength = isAmex ? 15 : (isStandard ? 16 : 19);
    const limited = raw.substring(0, maxLength);
    
    if (isAmex) {
      setCardNumber(formatAmex(limited));
    } else {
      setCardNumber(formatStandard(limited));
    }
  };

  const handleExpiryDateChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const limited = raw.substring(0, 4);
    let formatted = "";
    if (limited.length > 2) {
      formatted = `${limited.substring(0, 2)}/${limited.substring(2)}`;
    } else {
      formatted = limited;
    }
    setExpiryDate(formatted);
  };

  const handleCvvChange = (e) => {
    const cleanCard = cardNumber.replace(/\s/g, "");
    const isAmex = cleanCard.startsWith("34") || cleanCard.startsWith("37");
    const raw = e.target.value.replace(/\D/g, "");
    const limited = raw.substring(0, isAmex ? 4 : 3);
    setCvv(limited);
  };

  const handleBillingZipChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const limited = raw.substring(0, 6);
    setBillingZip(limited);
  };

  const validateCardDetails = () => {
    if (!cardholderName.trim()) {
      return "Name on card is required.";
    }
    if (/[^a-zA-Z\s.-]/.test(cardholderName)) {
      return "Name on card can only contain letters, spaces, hyphens, and periods.";
    }

    const cleanCard = cardNumber.replace(/\s/g, "");
    if (!cleanCard) {
      return "Please enter a valid card number.";
    }
    if (/[^\d]/.test(cleanCard)) {
      return "Card number must contain numbers only.";
    }

    const isAmex = cleanCard.startsWith("34") || cleanCard.startsWith("37");
    const isStandard = cleanCard.startsWith("4") || 
                       /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(cleanCard) || 
                       /^(6011|622|64[4-9]|65)/.test(cleanCard);

    if (isAmex) {
      if (cleanCard.length < 15) return "Card number is incomplete.";
      if (cleanCard.length > 15) return "Card number is too long.";
    } else if (isStandard) {
      if (cleanCard.length < 16) return "Card number is incomplete.";
      if (cleanCard.length > 16) return "Card number is too long.";
    } else {
      if (cleanCard.length < 12) return "Card number is incomplete.";
      if (cleanCard.length > 19) return "Card number is too long.";
    }

    if (!expiryDate) {
      return "Expiration date is required.";
    }
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return "Expiration date must be in MM/YY format.";
    }
    const [mmStr, yyStr] = expiryDate.split("/");
    const mm = parseInt(mmStr, 10);
    const yy = parseInt(yyStr, 10);
    if (mm < 1 || mm > 12) {
      return "Please enter a valid expiration month (01-12).";
    }
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
      return "Expiration date must be a valid future date.";
    }

    const rawCvv = cvv.replace(/\s/g, "");
    if (!rawCvv) {
      return "CVV/CVC is required.";
    }
    if (/[^\d]/.test(rawCvv)) {
      return "CVV/CVC must contain numbers only.";
    }
    const requiredCvvLength = isAmex ? 4 : 3;
    if (rawCvv.length !== requiredCvvLength) {
      return `CVV/CVC must be exactly ${requiredCvvLength} digits.`;
    }

    const rawZip = billingZip.replace(/\s/g, "");
    if (!rawZip) {
      return "Billing zip code is required.";
    }
    if (/[^\d]/.test(rawZip)) {
      return "Billing zip code must contain numbers only.";
    }
    if (rawZip.length < 5 || rawZip.length > 6) {
      return "Billing zip code must be 5 or 6 digits.";
    }

    return null;
  };

  const applyCoupon = async () => {
    if (!coupon.trim() || !checkoutItem) return;
    const originalPrice = parseFloat(checkoutItem.price.replace("$", "")) || 0;
    try {
      setCouponMessage("Validating coupon...");
      const response = await apiCall("/coupons/validate", "POST", {
        code: coupon,
        subtotal: originalPrice,
        checkoutType: "membership",
        targetId: checkoutItem.name.toLowerCase().replace(" membership", ""), // e.g. "silver" or "gold" or "bronze"
        userId: user?.id || null
      });

      if (response && response.valid) {
        setAppliedCoupon(response);
        setDiscount(parseFloat(response.discountAmount) || 0);
        setCouponMessage(`✓ ${response.code} APPLIED! Saved $${parseFloat(response.discountAmount).toFixed(2)}`);
      } else {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponMessage(`✗ ${response?.message || "Invalid coupon code."}`);
      }
    } catch (err) {
      console.error("Error applying membership coupon:", err);
      setAppliedCoupon(null);
      setDiscount(0);
      setCouponMessage(`✗ ${err.message && err.message !== "Something went wrong" ? err.message : "Could not validate this coupon right now."}`);
    }
  };

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tiers = [
    {
      name: "Free",
      id: "free",
      cost: "FREE",
      limit: "2 Submissions / Month",
      color: "#94A3B8",
      icon: <User size={32} />,
      perfectFor: "New users exploring the platform and casual competitors.",
      includes: [
        "Create an official account",
        "Browse all world records",
        "View public leaderboards",
        "2 standard record submissions monthly",
        "Access to community forums",
        "Digital participation badges",
        "Basic profile customization",
        "Follow competitors and categories"
      ],
      notIncluded: [
        "No priority verification",
        "No premium competitions",
        "No cash-prize event access",
        "No elite status badges"
      ]
    },
    {
      name: "Bronze",
      id: "bronze",
      cost: "$9.99",
      limit: "5 Submissions / Month",
      color: "#CD7F32",
      icon: <Award size={32} />,
      perfectFor: "Competitors beginning their journey and wanting more platform access.",
      includes: [
        "Everything in Free Membership",
        "5 monthly record submissions",
        "Bronze Member verification badge",
        "Faster support response times",
        "Access to member-only challenges",
        "Eligibility for select prize events",
        "Basic analytics & stats tracking",
        "Discounted event entry fees"
      ],
      popular: false
    },
    {
      name: "Silver",
      id: "silver",
      cost: "$19.99",
      limit: "15 Submissions / Month",
      color: "#C0C0C0",
      icon: <Gem size={32} />,
      perfectFor: "Serious competitors aiming to grow their rankings and recognition.",
      includes: [
        "Everything in Bronze Membership",
        "15 monthly record submissions",
        "Priority submission review",
        "Silver verified profile badge",
        "Advanced statistics dashboard",
        "Access to premium competitions",
        "Silver achievement certificates",
        "Featured competitor opportunities"
      ],
      popular: true
    },
    {
      name: "Gold",
      id: "gold",
      cost: "$39.99",
      limit: "Unlimited Submissions",
      color: "#FFD700",
      icon: <Crown size={32} />,
      perfectFor: "Elite competitors, professionals, influencers, and top-ranked challengers.",
      includes: [
        "Everything in Silver Membership",
        "Unlimited record submissions",
        "Highest priority verification (VIP)",
        "Gold verified elite member badge",
        "VIP support access (24/7)",
        "Entry into elite championships",
        "Front-page profile promotion",
        "Official printable Gold certificates"
      ],
      popular: false
    }
  ];

  const comparisonData = [
    { feature: "Record Submissions", free: "2 / Month", bronze: "5 / Month", silver: "15 / Month", gold: "Unlimited" },
    { feature: "Verification Priority", free: "Standard", bronze: "Basic", silver: "Priority", gold: "VIP Priority" },
    { feature: "Competition Access", free: "Limited", bronze: "Expanded", silver: "Premium", gold: "Elite" },
    { feature: "Cash Prize Eligibility", free: "No", bronze: "Select Events", silver: "Yes", gold: "Yes" },
    { feature: "Member Badge", free: "Basic", bronze: "Bronze", silver: "Silver", gold: "Gold" },
    { feature: "VIP Support", free: "No", bronze: "No", silver: "No", gold: "Yes (Direct)" },
    { feature: "Global Ranking Priority", free: "No", bronze: "Limited", silver: "Expanded", gold: "Premium" },
    { feature: "Exclusive Events", free: "No", bronze: "No", silver: "Limited", gold: "Yes" },
  ];

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />

        {/* HERO SECTION */}
        <section style={{ padding: "220px 5% 100px", position: "relative", overflow: "hidden" }}>
          {/* Decorative Elements */}
          <div style={{ position: "absolute", top: "0", right: "0", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(255,106,0,0.06) 0%, transparent 70%)", zIndex: 0 }} />
          
          <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
            <ScrollReveal>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "rgba(255,106,0,0.1)", padding: "8px 24px", borderRadius: "100px", border: "1px solid rgba(255,106,0,0.2)", marginBottom: "32px" }}>
                <Gem size={16} color="#FF6A00" />
                <span style={{ fontSize: "12px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.2em", textTransform: "uppercase" }}>ROGUE MEMBERSHIPS</span>
              </div>
              <h1 style={{ fontSize: "clamp(40px, 9vw, 110px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.85", marginBottom: "40px" }}>
                CHOOSE YOUR <br />
                <span style={{ color: "#FF6A00" }}>PATH TO GREATNESS</span>
              </h1>
              <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.5)", maxWidth: "800px", margin: "0 auto", lineHeight: "1.6" }}>
                Whether you are just getting started or planning to compete at the highest level, our membership tiers provide the recognition and tools you need to succeed.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* PRICING CARDS */}
        <section style={{ padding: "0 5% 120px" }}>
          <div style={{ 
            maxWidth: "1200px", 
            margin: "0 auto", 
            display: "grid", 
            gridTemplateColumns: windowWidth > 1024 ? "repeat(2, 1fr)" : "1fr", 
            gap: "32px" 
          }}>
            {tiers.map((tier) => {
              const isSelected = selectedTier === tier.id;
              return (
                <ScrollReveal key={tier.id}>
                  <div 
                    onClick={() => setSelectedTier(tier.id)}
                    style={{ 
                      background: isSelected ? "linear-gradient(135deg, rgba(255,106,0,0.06) 0%, rgba(10,10,10,0.95) 100%)" : "rgba(255,255,255,0.02)", 
                      border: isSelected ? "2px solid #FF6A00" : "1px solid rgba(255,255,255,0.05)", 
                      borderRadius: "48px", 
                      padding: "60px",
                      height: "100%",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      transform: isSelected ? "translateY(-6px)" : "translateY(0)",
                      boxShadow: isSelected ? "0 20px 40px rgba(255,106,0,0.15)" : "none",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.border = "1px solid rgba(255, 106, 0, 0.35)";
                        e.currentTarget.style.transform = "translateY(-6px)";
                        e.currentTarget.style.boxShadow = "0 15px 30px rgba(255, 106, 0, 0.05)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.05)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                  >
                    {tier.popular && (
                      <div style={{ position: "absolute", top: "24px", right: "48px", background: "#FF6A00", color: "white", padding: "6px 16px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase" }}>
                        MOST POPULAR
                      </div>
                    )}
                    
                    <div style={{ color: isSelected ? "#FF6A00" : tier.color, marginBottom: "24px", transition: "color 0.3s" }}>{tier.icon}</div>
                    <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase", marginBottom: "8px" }}>{tier.name}</h3>
                    <div style={{ fontSize: "40px", fontWeight: "950", marginBottom: "8px", color: isSelected ? "#FF6A00" : tier.name === "Free" ? "white" : tier.color, transition: "color 0.3s" }}>
                      {tier.cost}{tier.name !== "Free" && <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)", fontWeight: "600" }}>/month</span>}
                    </div>
                    <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", padding: "6px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", color: "#FF6A00", marginBottom: "32px", width: "fit-content" }}>
                      {tier.limit}
                    </div>

                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6", marginBottom: "40px", height: "45px" }}>
                      {tier.perfectFor}
                    </p>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px" }}>WHAT'S INCLUDED</div>
                      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "14px", marginBottom: "40px" }}>
                        {tier.includes.map((item, i) => (
                          <li key={i} style={{ display: "flex", gap: "12px", fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
                            <Check size={16} color={isSelected ? "#FF6A00" : tier.color} style={{ flexShrink: 0, marginTop: "2px" }} /> {item}
                          </li>
                        ))}
                        {tier.notIncluded && tier.notIncluded.map((item, i) => (
                          <li key={i} style={{ display: "flex", gap: "12px", fontSize: "14px", color: "rgba(255,255,255,0.2)" }}>
                            <XCircle size={16} color="rgba(255,255,255,0.1)" style={{ flexShrink: 0, marginTop: "2px" }} /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button 
                      onClick={() => {
                        setCheckoutItem({
                          name: `${tier.name.toUpperCase()} MEMBERSHIP`,
                          price: tier.cost
                        });
                        setCardholderName("");
                        setCardNumber("");
                        setExpiryDate("");
                        setCvv("");
                        setCoupon("");
                        setCouponMessage("");
                        setAppliedCoupon(null);
                        setDiscount(0);
                        setShowCheckout(true);
                      }}
                      style={{ 
                        width: "100%", 
                        background: isSelected ? "#FF6A00" : "rgba(255,255,255,0.05)", 
                        color: isSelected ? "white" : "rgba(255,255,255,0.6)",
                        border: isSelected ? "none" : "1px solid rgba(255,255,255,0.1)",
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
                        boxShadow: isSelected ? "0 10px 20px rgba(255,106,0,0.2)" : "none",
                        transition: "all 0.3s"
                      }}
                    >
                      {tier.name === "Free" ? "JOIN FOR FREE" : `GET ${tier.name.toUpperCase()}`} <ArrowRight size={18} />
                    </button>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section style={{ padding: "0 5% 120px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <ScrollReveal>
              <h2 style={{ fontSize: "40px", fontWeight: "950", textTransform: "uppercase", textAlign: "center", marginBottom: "60px" }}>FULL COMPARISON</h2>
              <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "40px", border: "1px solid rgba(255,255,255,0.05)", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <th style={{ padding: "32px", textAlign: "left", fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>FEATURES</th>
                      <th style={{ padding: "32px", textAlign: "center", fontSize: "14px", fontWeight: "900" }}>FREE</th>
                      <th style={{ padding: "32px", textAlign: "center", fontSize: "14px", fontWeight: "900", color: "#CD7F32" }}>BRONZE</th>
                      <th style={{ padding: "32px", textAlign: "center", fontSize: "14px", fontWeight: "900", color: "#C0C0C0" }}>SILVER</th>
                      <th style={{ padding: "32px", textAlign: "center", fontSize: "14px", fontWeight: "900", color: "#FFD700" }}>GOLD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, i) => (
                      <tr key={i} style={{ borderBottom: i === comparisonData.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "24px 32px", fontSize: "15px", fontWeight: "700" }}>{row.feature}</td>
                        <td style={{ padding: "24px 32px", textAlign: "center", fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>{row.free === "No" ? <XCircle size={16} color="rgba(255,255,255,0.1)" style={{ margin: "0 auto" }} /> : row.free}</td>
                        <td style={{ padding: "24px 32px", textAlign: "center", fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>{row.bronze === "No" ? <XCircle size={16} color="rgba(255,255,255,0.1)" style={{ margin: "0 auto" }} /> : row.bronze}</td>
                        <td style={{ padding: "24px 32px", textAlign: "center", fontSize: "14px", color: "white" }}>{row.silver}</td>
                        <td style={{ padding: "24px 32px", textAlign: "center", fontSize: "14px", color: "#FFD700", fontWeight: "800" }}>{row.gold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ADD-ON PACKS */}
        <section style={{ padding: "100px 5%", background: "rgba(255,106,0,0.03)", borderTop: "1px solid rgba(255,106,0,0.1)", borderBottom: "1px solid rgba(255,106,0,0.1)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
            <ScrollReveal>
              <h2 style={{ fontSize: "48px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px" }}>EXTRA SUBMISSION PACKS</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "18px", marginBottom: "60px" }}>Need just one more shot at history? Unlock additional submission slots instantly.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                {[
                  { count: "1 EXTRA SUBMISSION", price: "$4.99", icon: <Zap size={24} /> },
                  { count: "5 EXTRA SUBMISSIONS", price: "$14.99", icon: <Activity size={24} />, popular: true },
                  { count: "10 EXTRA SUBMISSIONS", price: "$24.99", icon: <Trophy size={24} /> }
                ].map((pack, i) => {
                  const isSelected = selectedPack === i;
                  return (
                    <div 
                      key={i} 
                      onClick={() => setSelectedPack(i)}
                      style={{ 
                        background: "#0A0A0A", 
                        borderRadius: "32px", 
                        padding: "40px", 
                        border: isSelected ? "2px solid #FF6A00" : "1px solid rgba(255,255,255,0.05)", 
                        position: "relative",
                        cursor: "pointer",
                        transform: isSelected ? "translateY(-8px)" : "translateY(0)",
                        boxShadow: isSelected ? "0 20px 40px rgba(255, 106, 0, 0.15)" : "none",
                        transition: "all 0.3s ease"
                      }}
                    >
                      {pack.popular && <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#FF6A00", color: "white", padding: "4px 16px", borderRadius: "100px", fontSize: "10px", fontWeight: "900" }}>BEST VALUE</div>}
                      <div style={{ color: "#FF6A00", marginBottom: "20px", display: "flex", justifyContent: "center" }}>{pack.icon}</div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>{pack.count}</div>
                      <div style={{ fontSize: "40px", fontWeight: "950", color: "white", marginBottom: "32px" }}>{pack.price}</div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPack(i);
                          setCheckoutItem({
                            name: pack.count,
                            price: pack.price
                          });
                          setCardholderName("");
                          setCardNumber("");
                          setExpiryDate("");
                          setCvv("");
                          setCoupon("");
                          setCouponMessage("");
                          setAppliedCoupon(null);
                          setDiscount(0);
                          setShowCheckout(true);
                        }}
                        style={{ 
                          width: "100%", 
                          background: isSelected ? "#FF6A00" : "rgba(255,255,255,0.05)", 
                          color: "white", 
                          border: isSelected ? "none" : "1px solid rgba(255,255,255,0.1)", 
                          borderRadius: "100px", 
                          padding: "18px", 
                          fontSize: "14px", 
                          fontWeight: "900", 
                          cursor: "pointer", 
                          transition: "all 0.3s ease",
                          boxShadow: isSelected ? "0 10px 20px rgba(255, 106, 0, 0.3)" : "none"
                        }} 
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.background = "rgba(255, 106, 0, 0.2)";
                        }} 
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        }}
                      >
                        PURCHASE PACK
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* WHY BECOME A MEMBER */}
        <section style={{ padding: "120px 5%" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "80px", alignItems: "center" }}>
              <ScrollReveal>
                <h2 style={{ fontSize: "56px", fontWeight: "950", textTransform: "uppercase", lineHeight: "0.95", marginBottom: "32px" }}>
                  WHY BECOME <br /><span style={{ color: "#FF6A00" }}>A MEMBER?</span>
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {[
                    "Gain recognition faster with priority verification reviews.",
                    "Access exclusive competitions and cash-prize tournaments.",
                    "Build your worldwide reputation with verified status badges.",
                    "Unlock advanced analytics and competitor tracking tools.",
                    "Join an elite community of record breakers globally."
                  ].map((text, i) => (
                    <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                      <div style={{ width: "24px", height: "24px", background: "rgba(255,106,0,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check size={14} color="#FF6A00" />
                      </div>
                      <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5" }}>{text}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "40px", padding: "60px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                  <Rocket size={64} color="#FF6A00" style={{ marginBottom: "32px" }} />
                  <h3 style={{ fontSize: "32px", fontWeight: "950", textTransform: "uppercase", marginBottom: "20px" }}>READY TO SCALE?</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "18px", marginBottom: "40px" }}>
                    Members can upgrade or cancel their memberships at any time through their account dashboard.
                  </p>
                  <Link to="/signup" style={{ textDecoration: "none" }}>
                    <button style={{ background: "#FF6A00", color: "white", padding: "20px 48px", borderRadius: "100px", border: "none", fontSize: "15px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "12px" }}>
                      UPGRADE NOW <ArrowRight size={20} />
                    </button>
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* FINAL MESSAGE */}
        <section style={{ padding: "0 5% 120px" }}>
          <ScrollReveal>
            <div className="orange-cta" style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 40px", borderRadius: "40px" }}>
              <div className="orange-cta-bg" />
              <div className="orange-cta-grid" />
              <div className="orange-cta-glow" />

              <div className="orange-cta-content" style={{ textAlign: "center" }}>
                <Trophy size={64} color="white" style={{ marginBottom: "32px", opacity: 0.8 }} />
                <h2 className="orange-cta-title" style={{ fontSize: "clamp(32px, 5vw, 64px)", fontWeight: "950", textTransform: "uppercase", marginBottom: "24px", color: "white" }}>
                  CHAMPIONS <br /><span className="orange-cta-highlight">START HERE</span>
                </h2>
                <p className="orange-cta-subtitle" style={{ maxWidth: "700px", margin: "0 auto 48px", fontSize: "18px", color: "rgba(255,255,255,0.9)", lineHeight: "1.6" }}>
                  No matter where you begin, every champion starts somewhere. Your journey toward greatness starts with one decision to push beyond limits.
                </p>
                <div style={{ fontSize: "20px", fontWeight: "950", color: "white", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Break Limits. Make History. Become Legendary.
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* SECURE CHECKOUT MODAL OVERLAY */}
        {showCheckout && checkoutItem && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}>
            <div style={{
              background: "#161616",
              border: "1px solid rgba(255, 106, 0, 0.2)",
              borderRadius: "32px",
              width: "100%",
              maxWidth: "500px",
              padding: "40px",
              position: "relative",
              boxShadow: "0 30px 60px rgba(0, 0, 0, 0.8), 0 0 100px rgba(255, 106, 0, 0.05)",
              color: "white"
            }}>
              {/* CLOSE BUTTON */}
              <button 
                type="button"
                onClick={() => {
                  setShowCheckout(false);
                  setIsSuccess(false);
                  setIsProcessing(false);
                }}
                style={{
                  position: "absolute",
                  top: "24px",
                  right: "24px",
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "16px"
                }}
              >
                ✕
              </button>

              {isSuccess ? (
                /* SUCCESS SCREEN */
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    background: "rgba(255, 106, 0, 0.1)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    border: "2px solid #FF6A00"
                  }}>
                    <CheckCircle2 size={48} color="#FF6A00" />
                  </div>
                  <h3 style={{ fontSize: "28px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px" }}>Membership Application Submitted Successfully.</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", marginBottom: "32px" }}>
                    Thank you! Your purchase of <strong style={{ color: "#FF6A00" }}>{checkoutItem.name}</strong> was processed securely. Your application is now saved.
                  </p>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCheckout(false);
                      setIsSuccess(false);
                    }}
                    style={{
                      background: "#FF6A00",
                      color: "white",
                      border: "none",
                      borderRadius: "100px",
                      padding: "16px 36px",
                      fontSize: "14px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      boxShadow: "0 10px 20px rgba(255,106,0,0.3)"
                    }}
                  >
                    CONTINUE
                  </button>
                </div>
              ) : isProcessing ? (
                /* PROCESSING LOADER */
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{
                    width: "50px",
                    height: "50px",
                    border: "4px solid rgba(255,106,0,0.1)",
                    borderTop: "4px solid #FF6A00",
                    borderRadius: "50%",
                    margin: "0 auto 24px",
                    animation: "spin 1s linear infinite"
                  }} />
                  <h3 style={{ fontSize: "20px", fontWeight: "900", textTransform: "uppercase", marginBottom: "12px" }}>Processing Membership Application...</h3>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Verifying application details and securely saving to system...</p>
                </div>
              ) : (
                /* CHECKOUT CARD FORM FLOW */
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setFormError("");

                    if (!fullName.trim() || !email.trim() || !phone.trim() || !address.trim()) {
                      setFormError("Full Name, Email, Phone, and Address are required.");
                      return;
                    }

                    const validationErr = validateCardDetails();
                    if (validationErr) {
                      setFormError(validationErr);
                      return;
                    }

                    setIsProcessing(true);
                    
                    try {
                      const originalPrice = parseFloat(checkoutItem.price.replace("$", "")) || 0;
                      const finalPrice = Math.max(0, originalPrice - discount);

                      const applicationData = {
                        fullName,
                        email,
                        phone,
                        address,
                        memberNumber: user?.member_number || "PENDING",
                        cardholderName,
                        billingZip
                      };

                      await apiCall("/memberships", "POST", {
                        userId: user?.id,
                        tier: checkoutItem.name.toLowerCase().replace(" membership", "").trim(),
                        autoRenew: true,
                        paymentAmount: finalPrice,
                        applicationData: applicationData
                      });

                      setIsProcessing(false);
                      setIsSuccess(true);
                    } catch (err) {
                      setIsProcessing(false);
                      setFormError(err.message || "There was a problem submitting your application. Please try again.");
                    }
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "24px" }}
                >
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.1em", textTransform: "uppercase" }}>SECURE CHECKOUT</span>
                    <h3 style={{ fontSize: "24px", fontWeight: "950", textTransform: "uppercase", marginTop: "4px" }}>ORDER SUMMARY</h3>
                  </div>

                  {formError && (
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #EF4444", color: "#EF4444", padding: "12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", textAlign: "left" }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} /> <span>{formError}</span>
                    </div>
                  )}

                  {/* ITEM SUMMARY BOX */}
                  {(() => {
                    const originalPrice = parseFloat(checkoutItem.price.replace("$", "")) || 0;
                    const finalPrice = Math.max(0, originalPrice - discount);
                    
                    return (
                      <>
                        <div style={{
                          background: "rgba(255, 106, 0, 0.05)",
                          border: "1px dashed rgba(255, 106, 0, 0.2)",
                          borderRadius: "16px",
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ textAlign: "left" }}>
                              <div style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.4)" }}>ITEM</div>
                              <div style={{ fontSize: "16px", fontWeight: "800", color: "white" }}>{checkoutItem.name}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.4)" }}>BASE PRICE</div>
                              <div style={{ fontSize: "16px", fontWeight: "800", color: "white" }}>{checkoutItem.price}</div>
                            </div>
                          </div>

                          {discount > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: "11px", fontWeight: "900", color: "#22c55e" }}>DISCOUNT {appliedCoupon ? `(${appliedCoupon.code})` : ''}</div>
                              <div style={{ fontSize: "16px", fontWeight: "800", color: "#22c55e" }}>-${discount.toFixed(2)}</div>
                            </div>
                          )}

                          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.4)" }}>TOTAL DUE</div>
                            <div style={{ fontSize: "20px", fontWeight: "950", color: "#FF6A00" }}>${finalPrice.toFixed(2)}</div>
                          </div>
                        </div>

                        {/* COUPON REDEEM SECTION */}
                        {originalPrice > 0 && (
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "16px", textAlign: "left" }}>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                              Redeem Coupon Code
                            </label>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <input 
                                type="text" 
                                placeholder="e.g. ELITE20" 
                                value={coupon}
                                onChange={(e) => setCoupon(e.target.value)}
                                style={{ flex: 1, background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "12px", outline: "none", fontWeight: "700" }}
                              />
                              <button 
                                type="button"
                                onClick={applyCoupon}
                                style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer" }}
                              >
                                REDEEM
                              </button>
                            </div>
                            {couponMessage && (
                              <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: "800", color: couponMessage.includes("Invalid") || couponMessage.includes("failed") || couponMessage.includes("offline") || couponMessage.includes("restricted") || couponMessage.includes("not valid") ? "#ef4444" : "#22c55e", textTransform: "uppercase" }}>
                                {couponMessage}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* APPLICATION DETAILS FORM */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div style={{ textAlign: "left" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>FULL NAME</label>
                        <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>EMAIL ADDRESS</label>
                        <input type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div style={{ textAlign: "left" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>PHONE NUMBER</label>
                        <input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>FULL ADDRESS</label>
                        <input type="text" placeholder="123 Rogue St, City, ST" value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                    </div>
                  </div>

                  {/* CARD DETAILS FORM */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ textAlign: "left" }}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>CARDHOLDER NAME</label>
                      <input type="text" placeholder="John Doe" value={cardholderName} onChange={(e) => setCardholderName(e.target.value.replace(/[^a-zA-Z\s.-]/g, ""))} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>CARD NUMBER</label>
                      <input type="text" placeholder="•••• •••• •••• ••••" value={cardNumber} onChange={handleCardNumberChange} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", textAlign: "left" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>EXPIRY DATE</label>
                        <input type="text" placeholder="MM/YY" value={expiryDate} onChange={handleExpiryDateChange} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>CVV</label>
                        <input type="text" placeholder="•••" value={cvv} onChange={handleCvvChange} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>ZIP CODE</label>
                        <input type="text" placeholder="10001" value={billingZip} onChange={handleBillingZipChange} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    style={{
                      background: "#FF6A00",
                      color: "white",
                      border: "none",
                      borderRadius: "100px",
                      padding: "18px",
                      fontSize: "14px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      boxShadow: "0 10px 20px rgba(255,106,0,0.3)",
                      marginTop: "8px"
                    }}
                  >
                    <span>SECURELY PAY ${(() => {
                      const originalPrice = parseFloat(checkoutItem.price.replace("$", "")) || 0;
                      return Math.max(0, originalPrice - discount).toFixed(2);
                    })()}</span> <Shield size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <Footer />
      </div>
    </PageTransition>
  );
};

export default EliteMembership;
