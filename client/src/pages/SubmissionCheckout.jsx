import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { apiCall } from "../utils/api";

const SubmissionCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { submissionData } = location.state || {};
  const { user } = useAuth();
  
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [cardholderName, setCardholderName] = useState(
    submissionData ? (submissionData.athleteName || submissionData.athleteId || (user ? user.name : "")) : ""
  );
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [billingZip, setBillingZip] = useState("");

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


  const [successMessages, setSuccessMessages] = useState({
    msg_record: 'Thank you! Your order has been processed securely. Our adjudication team will get back to you with the results using the email you provided.',
    msg_challenge: 'Thank you! Your challenge registration fee has been securely processed. Prepare to compete and claim your record!'
  });

  React.useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await apiCall("/contact/success-messages", "GET");
        if (res) {
          setSuccessMessages(prev => ({
            ...prev,
            ...res
          }));
        }
      } catch (err) {
        console.error("Error fetching success messages:", err);
      }
    };
    fetchMessages();
  }, []);

  const [trackingNumber, setTrackingNumber] = useState("");

  const baseFee = 3.50;
  const finalFee = Math.max(0, baseFee - discount);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      setCouponMessage("Validating coupon...");
      const response = await apiCall("/coupons/validate", "POST", {
        code: coupon,
        subtotal: baseFee,
        checkoutType: "ticket", // Fits processing fees / tickets category rules
        targetId: submissionData.id,
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
      console.error("Error applying submission coupon:", err);
      setAppliedCoupon(null);
      setDiscount(0);
      setCouponMessage(`✗ ${err.message && err.message !== "Something went wrong" ? err.message : "Could not validate this coupon right now."}`);
    }
  };

  const handlePayment = async () => {
    setError("");
    const validationError = validateCardDetails();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      if (!submissionData.id || submissionData.id === 'TEMP') {
        throw new Error("Invalid submission ID. Please try submitting again.");
      }
      
      const response = await apiCall(`/records/${submissionData.id}/checkout`, 'POST', {
        couponCode: appliedCoupon?.code || null,
        discountAmount: discount,
        finalAmount: finalFee
      }, user?.token);
      
      setTrackingNumber(response.trackingNumber || `RWR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
      setSuccess(true);
    } catch (e) {
      console.error("Checkout failed:", e);
      setError(e.message || "Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!submissionData) {
    return (
      <div style={{ padding: "200px 20px", textAlign: "center", color: "white", background: "#0A0A0A", minHeight: "100vh" }}>
        <h2>NO SUBMISSION DATA FOUND</h2>
        <button onClick={() => navigate(-1)} style={{ padding: "10px 20px", background: "#FF6A00", border: "none", color: "white", borderRadius: "100px", marginTop: "20px", cursor: "pointer", fontWeight: "900" }}>GO BACK</button>
      </div>
    );
  }

  if (success) {
    return (
      <PageTransition>
        <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "white", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
          <Navbar />
          <div style={{ padding: "180px 5% 120px", flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ textAlign: "center", maxWidth: "600px" }}>
              <div style={{ width: "120px", height: "120px", background: "rgba(74, 222, 128, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 40px", border: "2px solid #4ADE80" }}>
                <CheckCircle2 size={60} color="#4ADE80" />
              </div>
              <h1 style={{ fontSize: "40px", fontWeight: "950", textTransform: "uppercase", marginBottom: "20px" }}>PAYMENT <span style={{ color: "#FF6A00" }}>SUCCESSFUL</span></h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", marginBottom: "40px", lineHeight: "1.6" }}>
                {submissionData.recordType === 'challenge' 
                  ? successMessages.msg_challenge 
                  : successMessages.msg_record}
              </p>
              
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "30px", marginBottom: "40px", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <h3 style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: "900", letterSpacing: "0.1em", marginBottom: "8px" }}>OFFICIAL TRACKING NUMBER</h3>
                <div style={{ fontSize: "28px", fontWeight: "950", color: "#FF6A00", letterSpacing: "2px" }}>{trackingNumber}</div>
              </div>
              
              <button onClick={() => navigate("/")} style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 20px 40px rgba(255,106,0,0.2)" }}>
                RETURN TO HOME BASE
              </button>
            </div>
          </div>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "white", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ padding: "180px 5% 120px", flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: "1000px", width: "100%" }}>
            <div style={{ marginBottom: "40px" }}>
              <h1 style={{ fontSize: "40px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px" }}>SECURE <span style={{ color: "#FF6A00" }}>CHECKOUT</span></h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>Complete the mandatory $3.50 processing fee to officially submit your application.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px" }}>
              {/* Desktop layout: we use flex or grid to split. Let's use flex wrap for responsiveness */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "40px" }}>
                
                {/* Payment Info */}
                <div style={{ flex: "1 1 500px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "900", textTransform: "uppercase", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <CreditCard color="#FF6A00" /> PAYMENT METHOD
                  </h3>
                  
                  {error && (
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #EF4444", color: "#EF4444", padding: "12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                    <input 
                      type="text" 
                      placeholder="CARDHOLDER NAME" 
                      value={cardholderName} 
                      onChange={(e) => setCardholderName(e.target.value.replace(/[^a-zA-Z\s.-]/g, ""))} 
                      style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", color: "white", outline: "none" }} 
                    />
                    <input 
                      type="text" 
                      placeholder="CARD NUMBER" 
                      value={cardNumber} 
                      onChange={handleCardNumberChange} 
                      style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", color: "white", outline: "none" }} 
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        value={expiryDate} 
                        onChange={handleExpiryDateChange} 
                        style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", color: "white", outline: "none" }} 
                      />
                      <input 
                        type="text" 
                        placeholder="CVV/CVC" 
                        value={cvv} 
                        onChange={handleCvvChange} 
                        style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", color: "white", outline: "none" }} 
                      />
                      <input 
                        type="text" 
                        placeholder="ZIP CODE" 
                        value={billingZip} 
                        onChange={handleBillingZipChange} 
                        style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", color: "white", outline: "none" }} 
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handlePayment} 
                    disabled={loading}
                    style={{ width: "100%", background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: "0 10px 20px rgba(255,106,0,0.2)", opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> PROCESSING...</> : `PAY $${finalFee.toFixed(2)} & SUBMIT`}
                  </button>
                </div>

                {/* Order Summary */}
                <div style={{ flex: "1 1 300px" }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "900", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "20px" }}>ORDER SUMMARY</h3>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "14px" }}>
                      <span style={{ color: "rgba(255,255,255,0.8)" }}>Submission Type:</span>
                      <span style={{ fontWeight: "700" }}>{submissionData.recordType === 'challenge' ? 'Challenge Record' : 'Submit Record'}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "14px" }}>
                      <span style={{ color: "rgba(255,255,255,0.8)" }}>Applicant:</span>
                      <span style={{ fontWeight: "700", textAlign: "right" }}>{submissionData.athleteName || submissionData.athleteId || (user ? user.name : "Applicant")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", fontSize: "14px" }}>
                      <span style={{ color: "rgba(255,255,255,0.8)" }}>Record Title:</span>
                      <span style={{ fontWeight: "700", textAlign: "right", maxWidth: "60%" }}>{submissionData.title}</span>
                    </div>
                    
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", marginBottom: "20px" }}></div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", color: "rgba(255,255,255,0.6)", marginBottom: "12px" }}>
                      <span>PROCESSING FEE</span>
                      <span>$3.50</span>
                    </div>
                    {discount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", color: "#22c55e", fontWeight: "700", marginBottom: "12px" }}>
                        <span>DISCOUNT {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", marginBottom: "20px" }}></div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "18px", fontWeight: "900" }}>
                      <span>TOTAL FEE</span>
                      <span style={{ color: "#FF6A00" }}>${finalFee.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Coupon Redeem Box */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "24px", marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                      Redeem Coupon Code
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input 
                        type="text" 
                        placeholder="e.g. ELITE20" 
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none", fontWeight: "700" }}
                      />
                      <button 
                        type="button"
                        onClick={applyCoupon}
                        style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "12px", padding: "12px 24px", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer" }}
                      >
                        REDEEM
                      </button>
                    </div>
                    {couponMessage && (
                      <div style={{ marginTop: "10px", fontSize: "11px", fontWeight: "800", color: couponMessage.includes("Invalid") || couponMessage.includes("failed") || couponMessage.includes("restricted") || couponMessage.includes("not valid") ? "#ef4444" : "#22c55e", textTransform: "uppercase" }}>
                        {couponMessage}
                      </div>
                    )}
                  </div>
                  
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", lineHeight: "1.5", textAlign: "center" }}>
                    By completing this payment, you agree that this submission fee is non-refundable regardless of the adjudication outcome.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default SubmissionCheckout;
