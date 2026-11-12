import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { apiCall } from "../utils/api";
import { goToCheckout, readPaymentReturn, clearPaymentReturn, checkPayment, cancelPayment } from "../utils/payments";

// The submission being paid for is kept for the trip to Stripe and back (the page state is lost on the way).
const STORE_KEY = "ampex_submission_checkout";
const loadStored = () => { try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || "null"); } catch { return null; } };

const SubmissionCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentReturn] = useState(() => readPaymentReturn());
  const [submissionData, setSubmissionData] = useState(() => (location.state && location.state.submissionData) || (paymentReturn.status ? loadStored() : null));
  const [confirming, setConfirming] = useState(paymentReturn.status === "success" && !!paymentReturn.sessionId);
  useEffect(() => {
    if (submissionData) { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(submissionData)); } catch { /* ignore */ } }
  }, [submissionData]);

  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");



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

  // Back from Stripe
  useEffect(() => {
    if (!paymentReturn.status) return;
    clearPaymentReturn();
    if (paymentReturn.status === "cancelled") {
      cancelPayment(paymentReturn.ref, user?.token);
      setError("Payment cancelled. Nothing was charged. You can pay whenever you are ready.");
      return;
    }
    if (!paymentReturn.sessionId) return;
    checkPayment(paymentReturn.sessionId, user?.token)
      .then((r) => {
        if (r?.record) setSubmissionData((d) => ({ ...(d || {}), id: r.record.id, title: d?.title || r.record.title, recordType: r.record.recordType }));
        if (r?.payment?.status === "paid") {
          setTrackingNumber(r.trackingNumber || "");
          setSuccess(true);
          try { sessionStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
        } else {
          setError(r?.payment?.status === "pending" ? "Your payment is still being confirmed. We will message you with your tracking number." : "The payment did not go through. Nothing was charged.");
        }
      })
      .catch((e) => setError(e.message || "We could not confirm the payment. Please check Profile → Messages."))
      .finally(() => setConfirming(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fee set in Admin → System Settings → Fees (record submission or challenge); the server charges the same amount
  const [fees, setFees] = useState(null);
  useEffect(() => { apiCall("/settings/public", "GET").then(setFees).catch(() => {}); }, []);
  const isChallenge = submissionData?.recordType === "challenge";
  const baseFee = fees ? Number(isChallenge ? fees.challengeFee : fees.submissionFee) || 0 : 3.50;
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

      if (response.checkoutUrl) {
        goToCheckout(response.checkoutUrl); // pay on Stripe; Stripe sends the member back here
        return;
      }
      setTrackingNumber(response.trackingNumber || "");
      setSuccess(true);
      try { sessionStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    } catch (e) {
      console.error("Checkout failed:", e);
      setError(e.message || "Payment processing failed. Please try again.");
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <div style={{ padding: "200px 20px", textAlign: "center", color: "white", background: "#0A0A0A", minHeight: "100vh" }}>
        <Loader2 size={40} className="animate-spin" color="#FF6A00" style={{ margin: "0 auto 20px" }} />
        <h2 style={{ textTransform: "uppercase" }}>Confirming your payment…</h2>
      </div>
    );
  }

  if (!submissionData && !success) {
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
                {submissionData?.recordType === 'challenge'
                  ? successMessages.msg_challenge
                  : successMessages.msg_record}
              </p>

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "30px", marginBottom: "40px", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <h3 style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: "900", letterSpacing: "0.1em", marginBottom: "8px" }}>OFFICIAL TRACKING NUMBER</h3>
                <div style={{ fontSize: "28px", fontWeight: "950", color: "#FF6A00", letterSpacing: "2px" }}>{trackingNumber}</div>
              </div>

              <button onClick={() => navigate("/")} style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 20px 40px rgba(255,106,0,0.2)" }}>
                BACK TO HOMEPAGE
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
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>Complete the {isChallenge ? "challenge" : "processing"} fee of ${baseFee.toFixed(2)} to officially submit your application.</p>
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

                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: 1.6, margin: "0 0 28px 0" }}>
                    You'll pay on Stripe's secure payment page (card, Apple Pay or Google Pay) and come straight back here for your tracking number. Your card details are never stored on our site.
                  </p>

                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    style={{ width: "100%", background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: "0 10px 20px rgba(255,106,0,0.2)", opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> PROCESSING...</> : finalFee > 0 ? `CONTINUE TO SECURE PAYMENT · $${finalFee.toFixed(2)}` : "SUBMIT"}
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
                      <span>${baseFee.toFixed(2)}</span>
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
