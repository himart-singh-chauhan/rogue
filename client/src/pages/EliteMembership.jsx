import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { formatCardNumber, formatExpiry, formatCvv, validateCard, CARD_INPUT_PROPS, EXPIRY_INPUT_PROPS, CVV_INPUT_PROPS } from "../utils/cardInput";

const PLAN_ICONS = { free: User, bronze: Award, silver: Gem, gold: Crown, diamond: Star, vip_package: Rocket };
const periodLabel = (interval) => (interval === "year" ? "/year" : interval === "one_time" ? " one-time" : "/month");
const money = (n) => (Number(n) % 1 === 0 ? `$${Number(n)}` : `$${Number(n).toFixed(2)}`);

// Plan from the database (Admin → Memberships → Plans) -> pricing card
const planToTier = (p) => {
  const Icon = PLAN_ICONS[p.slug] || Shield;
  return {
    name: p.name,
    id: p.slug,
    cost: Number(p.price) > 0 ? money(p.price) : "FREE",
    price: Number(p.price) || 0,
    period: Number(p.price) > 0 ? periodLabel(p.billingInterval) : "",
    billingInterval: p.billingInterval,
    limit: p.submissionLimit == null ? "Unlimited Submissions" : `${p.submissionLimit} Submissions / Month`,
    submissionLimit: p.submissionLimit,
    priorityReview: !!p.priorityReview,
    vipProfile: !!p.vipProfile,
    color: p.color || "#FF6A00",
    icon: <Icon size={32} />,
    perfectFor: p.description || "",
    includes: Array.isArray(p.features) ? p.features : [],
    popular: p.slug === "silver",
  };
};

const EliteMembership = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [plans, setPlans] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  React.useEffect(() => {
    apiCall("/membership-plans", "GET")
      .then((res) => setPlans(Array.isArray(res) ? res : res?.plans || []))
      .catch(() => setPlans([]));
  }, []);

  // Esc closes the checkout
  React.useEffect(() => {
    if (!showCheckout) return undefined;
    const onKey = (e) => { if (e.key === "Escape") closeCheckout(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function closeCheckout() {
    setShowCheckout(false);
    setIsSuccess(false);
    setIsProcessing(false);
    setFormError("");
  }

  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryDateChange = (e) => {
    setExpiryDate(formatExpiry(e.target.value));
  };

  const handleCvvChange = (e) => {
    setCvv(formatCvv(e.target.value, cardNumber));
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

    const cardError = validateCard({ number: cardNumber, expiry: expiryDate, cvv });
    if (cardError) return cardError;

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
        targetId: checkoutItem.slug || checkoutItem.name.toLowerCase().replace(" membership", ""),
        userId: user?.id || null,
        customerEmail: user?.email || email || null
      }, user?.token);

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

  const fallbackTiers = [
    {
      name: "Free",
      id: "free",
      cost: "FREE",
      limit: "3 Submissions / Month",
      color: "#94A3B8",
      icon: <User size={32} />,
      perfectFor: "New users exploring the platform and casual competitors.",
      includes: [
        "Create an official account",
        "Browse all world records",
        "View public leaderboards",
        "3 standard record submissions monthly",
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
      cost: "$10.99",
      limit: "10 Submissions / Month",
      color: "#CD7F32",
      icon: <Award size={32} />,
      perfectFor: "Competitors beginning their journey and wanting more platform access.",
      includes: [
        "Everything in Free Membership",
        "10 monthly record submissions",
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
      cost: "$20",
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
      cost: "$50",
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

  const tiers = plans.length
    ? plans.map(planToTier)
    : fallbackTiers.map((t) => ({ ...t, price: parseFloat(String(t.cost).replace("$", "")) || 0, period: t.id === "free" ? "" : "/month", billingInterval: "month" }));


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
                <span style={{ fontSize: "12px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.2em", textTransform: "uppercase" }}>AMPEX MEMBERSHIPS</span>
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
            gridTemplateColumns: windowWidth > 1100 ? "repeat(3, 1fr)" : windowWidth > 700 ? "repeat(2, 1fr)" : "1fr",
            gap: "24px"
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
                      borderRadius: "36px",
                      padding: windowWidth > 700 ? "44px 36px" : "36px 24px",
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
                      {tier.cost}{tier.period && <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)", fontWeight: "600" }}>{tier.period}</span>}
                    </div>
                    <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", padding: "6px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", color: "#FF6A00", marginBottom: "32px", width: "fit-content" }}>
                      {tier.limit}
                    </div>

                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6", marginBottom: "32px", minHeight: "45px" }}>
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
                        if (!tier.price) {
                          setCheckoutItem({ name: `${tier.name.toUpperCase()} MEMBERSHIP`, slug: tier.id, price: "$0", kind: "plan" });
                          setSuccessMessage("Every account starts on the Free plan, so there is nothing to pay. You can upgrade at any time.");
                          setIsSuccess(true);
                          setShowCheckout(true);
                          return;
                        }
                        // Upgrades are linked to an account, so log in first
                        if (!user) {
                          navigate("/login", { state: { from: "/elite", message: "Please log in or create an account to upgrade your membership." } });
                          return;
                        }
                        setSuccessMessage("");
                        setIsSuccess(false);
                        setFormError("");
                        setCheckoutItem({
                          name: `${tier.name.toUpperCase()} MEMBERSHIP`,
                          slug: tier.id,
                          price: money(tier.price),
                          period: tier.period,
                          kind: "plan"
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
                      {!tier.price ? "FREE PLAN" : `GET ${tier.name.toUpperCase()}`} <ArrowRight size={18} />
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
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "860px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <th style={{ padding: "28px 24px", textAlign: "left", fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>FEATURES</th>
                      {tiers.map((t) => (
                        <th key={t.id} style={{ padding: "28px 16px", textAlign: "center", fontSize: "14px", fontWeight: "900", color: t.color, textTransform: "uppercase" }}>{t.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Price", value: (t) => (t.price ? `${t.cost}${t.period}` : "Free") },
                      { feature: "Record Submissions", value: (t) => (t.submissionLimit == null && t.id !== "free" && /unlimited/i.test(t.limit) ? "Unlimited" : t.limit.replace(" Submissions", "")) },
                      { feature: "Priority Review", value: (t) => (t.priorityReview ? "Yes" : "No") },
                      { feature: "VIP Profile", value: (t) => (t.vipProfile ? "Yes" : "No") },
                    ].map((row, i, rows) => (
                      <tr key={row.feature} style={{ borderBottom: i === rows.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "22px 24px", fontSize: "15px", fontWeight: "700" }}>{row.feature}</td>
                        {tiers.map((t) => {
                          const v = row.value(t);
                          return (
                            <td key={t.id} style={{ padding: "22px 16px", textAlign: "center", fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>
                              {v === "No" ? <XCircle size={16} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto" }} /> : v === "Yes" ? <Check size={16} color={t.color} style={{ margin: "0 auto" }} /> : v}
                            </td>
                          );
                        })}
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
                          setSuccessMessage("");
                          setIsSuccess(false);
                          setFormError("");
                          setCheckoutItem({
                            name: pack.count,
                            price: pack.price,
                            kind: "pack"
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
          <div
            onClick={(e) => { if (e.target === e.currentTarget && !isProcessing) closeCheckout(); }}
            data-lenis-prevent
            style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
            overflowY: "auto"
          }}>
            <div role="dialog" aria-modal="true" aria-label="Membership checkout" style={{
              background: "#161616",
              border: "1px solid rgba(255, 106, 0, 0.2)",
              borderRadius: "32px",
              width: "100%",
              maxWidth: "540px",
              margin: "auto",
              padding: windowWidth > 600 ? "40px" : "28px 20px",
              position: "relative",
              boxShadow: "0 30px 60px rgba(0, 0, 0, 0.8), 0 0 100px rgba(255, 106, 0, 0.05)",
              color: "white"
            }}>
              {/* BACK + CLOSE */}
              <button
                type="button"
                onClick={closeCheckout}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: "13px", fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: "18px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                ← Back to plans
              </button>
              <button
                type="button"
                aria-label="Close checkout"
                onClick={closeCheckout}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  zIndex: 2,
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
                  <h3 style={{ fontSize: "24px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px" }}>{checkoutItem.price === "$0" ? "You're all set" : "Request received"}</h3>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", lineHeight: "1.6", marginBottom: "32px" }}>
                    {successMessage || <>Thank you! Your request for <strong style={{ color: "#FF6A00" }}>{checkoutItem.name}</strong> has been saved.</>}
                  </p>
                  <button
                    type="button"
                    onClick={closeCheckout}
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
                  <h3 style={{ fontSize: "20px", fontWeight: "900", textTransform: "uppercase", marginBottom: "12px" }}>Sending your request...</h3>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Saving your upgrade request securely.</p>
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

                      if (checkoutItem.kind === "pack") {
                        // Extra submission packs are sold through Stripe Checkout once it is connected.
                        setSuccessMessage("Extra submission packs can be bought as soon as online card payments go live. Nothing has been charged. Please check back soon.");
                        setIsProcessing(false);
                        setIsSuccess(true);
                        return;
                      }

                      const res = await apiCall("/memberships/request", "POST", {
                        tier: checkoutItem.slug,
                        paymentAmount: finalPrice,
                        couponCode: appliedCoupon?.code || null,
                        applicationData: { fullName, email, phone, address }
                      }, user?.token);

                      setSuccessMessage(res?.message || "");
                      setIsProcessing(false);
                      setIsSuccess(true);
                    } catch (err) {
                      setIsProcessing(false);
                      setFormError(/token|authorized/i.test(err.message || "") ? "Your session has expired. Please log in again, then choose your plan." : (err.message || "There was a problem submitting your request. Please try again."));
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
                              <div style={{ fontSize: "16px", fontWeight: "800", color: "white" }}>{checkoutItem.price}{checkoutItem.period ? <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>{checkoutItem.period}</span> : null}</div>
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
                    <div style={{ display: "grid", gridTemplateColumns: windowWidth > 600 ? "1fr 1fr" : "1fr", gap: "16px" }}>
                      <div style={{ textAlign: "left" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>FULL NAME</label>
                        <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>EMAIL ADDRESS</label>
                        <input type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: windowWidth > 600 ? "1fr 1fr" : "1fr", gap: "16px" }}>
                      <div style={{ textAlign: "left" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>PHONE NUMBER</label>
                        <input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>FULL ADDRESS</label>
                        <input type="text" placeholder="123 Main St, City, ST" value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
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
                      <input type="text" {...CARD_INPUT_PROPS} placeholder="•••• •••• •••• ••••" value={cardNumber} onChange={handleCardNumberChange} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: windowWidth > 420 ? "1fr 1fr 1fr" : "1fr 1fr", gap: "16px", textAlign: "left" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>EXPIRY DATE</label>
                        <input type="text" {...EXPIRY_INPUT_PROPS} placeholder="MM/YY" value={expiryDate} onChange={handleExpiryDateChange} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>CVV</label>
                        <input type="text" {...CVV_INPUT_PROPS} placeholder="•••" value={cvv} onChange={handleCvvChange} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase" }}>ZIP CODE</label>
                        <input type="text" inputMode="numeric" autoComplete="postal-code" placeholder="10001" value={billingZip} onChange={handleBillingZipChange} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px" }} />
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
                    <span>{checkoutItem.kind === "pack" ? "CONTINUE" : "REQUEST UPGRADE"} · ${(() => {
                      const originalPrice = parseFloat(checkoutItem.price.replace("$", "")) || 0;
                      return Math.max(0, originalPrice - discount).toFixed(2);
                    })()}</span> <Shield size={16} />
                  </button>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.5, margin: "-8px 0 0" }}>
                    Your card is not charged yet. Online payments open soon; our team confirms your upgrade by email.
                  </p>
                  <button type="button" onClick={closeCheckout} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", borderRadius: "100px", padding: "14px", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>
                    Cancel
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
