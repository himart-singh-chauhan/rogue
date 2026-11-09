import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Play, Eye, Users, MessageSquare, Share2, Shield, Activity, Zap, Trash2, Ban } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

import { apiCall } from "../utils/api";
import SponsorBanner from "../components/SponsorBanner";
import { addTicketToCart, isRealEventId } from "../utils/ticketCart";

const CountdownBox = ({ value, label }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      padding: "12px",
      minWidth: "70px",
      fontSize: "24px",
      fontWeight: "950",
      color: "white",
      marginBottom: "8px"
    }}>
      {value}
    </div>
    <div style={{ fontSize: "9px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.1em" }}>{label}</div>
  </div>
);

const eventsData = [
  {
    id: "summit-lift",
    status: "LIVE",
    title: "THE SUMMIT LIFT: FINALS",
    category: "STRENGTH",
    time: "LIVE NOW",
    athletes: "12 ATHLETES",
    viewers: "34,285",
    img: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1600&q=80",
    isFeatured: true,
    isFreeStream: false,
    desc: "The pinnacle of raw powerlifting. The world's top heavyweight lifters battle for the absolute bench press record live."
  },
  {
    id: "tetris-showdown",
    status: "LIVE",
    title: "RETRO TETRIS WORLD FINAL",
    category: "GAMING",
    time: "LIVE NOW",
    athletes: "2 PLAYERS",
    viewers: "18,490",
    img: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80",
    isFreeStream: true,
    desc: "The final game between two absolute block-stacking legends competing for the maxout 999,999 record."
  },
  {
    id: "dash-final",
    status: "UPCOMING",
    title: "THE 100M DASH FINAL",
    category: "ATHLETICS",
    time: "IN 18 HRS (TOMORROW 02:00 PM)",
    athletes: "12 ATHLETES",
    img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1600&q=80",
    isFeatured: true,
    desc: "Speed unleashed. A line-up of the fastest sprinters on earth competing for the sub-9.6s record live from Olympic Hub."
  },
  {
    id: "street-workout",
    status: "UPCOMING",
    title: "STREET WORKOUT FREESTYLE",
    category: "AGILITY",
    time: "TOMORROW 10:00 AM",
    athletes: "24 ATHLETES",
    img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "speed-climbing",
    status: "UPCOMING",
    title: "SPEED CLIMBING QUALS",
    category: "SPEED",
    time: "SUN, OCT 22 04:00 PM",
    athletes: "18 ATHLETES",
    img: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "water-swim-final",
    status: "PAST",
    title: "50M ICE WATER SWIM CHAMPIONSHIP",
    category: "WATER SPORTS",
    time: "COMPLETED (OCT 15)",
    athletes: "8 SWIMMERS",
    img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
    isFeatured: true,
    desc: "A freezing duel of raw human endurance. Competitors swim a full 50 meters in near-freezing sub-zero glacial waters."
  },
  {
    id: "reaction-test",
    status: "PAST",
    title: "LIGHT BUTTON HITS CHAMPIONSHIP",
    category: "REACTION",
    time: "COMPLETED (OCT 12)",
    athletes: "10 ATHLETES",
    img: "https://images.unsplash.com/photo-1591123720164-de1348028a82?auto=format&fit=crop&w=800&q=80"
  }
];

const StreamDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = React.useState({
    hours: "02",
    minutes: "45",
    seconds: "12"
  });

  // Dynamic ticket spectator passes and stream access
  const [hasTicket, setHasTicket] = React.useState(false);
  const [canWatch, setCanWatch] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const [event, setEvent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [ticketPrice, setTicketPrice] = React.useState(49);
  const [eventIsPaid, setEventIsPaid] = React.useState(false);

  // Admin controls hooks
  const [isAdminEditing, setIsAdminEditing] = React.useState(false);
  const [adminFields, setAdminFields] = React.useState({
    title: "",
    description: "",
    imageUrl: "",
    streamUrl: "",
    isPaid: false,
    ticketPrice: "49.00",
    competitors: "",
    judges: "",
    category: "WORLD RECORD",
    isLive: false,
    isFeatured: false
  });

  // Dynamic Chat & Moderation hooks
  const [chatMessages, setChatMessages] = React.useState([
    { id: 1, user: "IronMike", msg: "This is insane! 500kg incoming?", userId: "user-iron-mike" },
    { id: 2, user: "AmpexMarshal", msg: "Welcome to the finals everyone.", color: "#FF6A00", userId: "user-rogue-marshal" },
    { id: 3, user: "LiftLover", msg: "Thor looks ready today.", userId: "user-lift-lover" },
    { id: 4, user: "GymRat99", msg: "Let's goooooooo!", userId: "user-gym-rat-99" },
    { id: 5, user: "Sarah_Lift", msg: "The atmosphere in Tokyo is electric.", userId: "user-sarah-lift" },
  ]);
  const [chatInput, setChatInput] = React.useState("");
  const [blockedUsers, setBlockedUsers] = React.useState([]);
  const [purchaseCode, setPurchaseCode] = React.useState("");
  const [showRedeemModal, setShowRedeemModal] = React.useState(false);
  const [redeemCodeInput, setRedeemCodeInput] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) val = val.substring(0, 16);
    let formatted = "";
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += " ";
      formatted += val[i];
    }
    setCardNumber(formatted);
  };


  const isCurrentUserKicked = user && blockedUsers.includes(user.id || user._id);

  // Fetch event and verify ticket access
  const fetchEventAndVerifyAccess = async () => {
    setLoading(true);
    try {
      const eventData = await apiCall(`/events/${id}`, 'GET', null, user?.token);
      setEvent(eventData);

      if (eventData) {
        setEventIsPaid(eventData.isPaid || false);
        setTicketPrice(Number(eventData.ticketPrice) || 0);

        if (user) {
          const ticketVerification = await apiCall(`/tickets/verify/${id}`, 'GET', null, user.token);
          setCanWatch(ticketVerification.canWatch);
          setHasTicket(ticketVerification.hasTicket);
        } else {
          setCanWatch(!eventData.isPaid);
          setHasTicket(false);
        }

        setAdminFields({
          title: eventData.title || "",
          description: eventData.description || "",
          imageUrl: eventData.imageUrl || eventData.image || "",
          streamUrl: eventData.streamUrl || "",
          isPaid: eventData.isPaid || false,
          ticketPrice: eventData.ticketPrice ? Number(eventData.ticketPrice).toFixed(2) : "0.00",
          competitors: eventData.competitors || "",
          judges: eventData.judges || "",
          category: eventData.category || "WORLD RECORD",
          isLive: eventData.isLive || false,
          isFeatured: eventData.isFeatured || false
        });
      }
    } catch (error) {
      console.error("Failed to fetch event details", error);
      const mockEvent = eventsData.find(e => e.id === id);
      if (mockEvent) {
        setEventIsPaid(mockEvent.isFreeStream === false);
        setTicketPrice(49);
      }
      setCanWatch(false);
      setHasTicket(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAndVerifyAccess();
  }, [id, user]);

  const currentEvent = event || eventsData.find(e => e.id === id) || eventsData[0];
  const requiresTicket = event ? eventIsPaid : (currentEvent.isFreeStream === false);
  const isLocked = !loading && currentEvent && requiresTicket && !canWatch;

  const handleWatchClick = () => {
    if (isCurrentUserKicked) return;
    if (isLocked) {
      setShowModal(true);
      return;
    }

    setIsPlaying(prev => !prev);
    if (!isPlaying) {
      showToast(currentEvent.status === "PAST" ? "▶️ Playing completed event playback!" : "🔴 Live HD Stream Loaded Successfully!");
    } else {
      showToast(isPlaying ? "🔴 Stream paused." : "");
    }
  };

  const purchaseTicket = async () => {
    if (!user) {
      navigate("/login", { state: { message: "Please log in to buy a spectator pass. Tickets are linked to your account." } });
      return;
    }
    const ev = event ? { ...event, id: event.id || event._id || id } : { id, title: currentEvent?.title, ticketPrice, img: currentEvent?.img };
    const res = addTicketToCart({ ...ev, ticketPrice: ev.ticketPrice || ticketPrice });
    if (!res.ok) {
      showToast(res.reason);
      return;
    }
    setShowModal(false);
    navigate("/cart");
  };

  const handleSaveAdminChanges = async (e) => {
    e.preventDefault();
    if (!user || !user.token) return;

    try {
      setLoading(true);
      const payload = {
        title: adminFields.title,
        description: adminFields.description,
        imageUrl: adminFields.imageUrl,
        streamUrl: adminFields.streamUrl,
        isPaid: adminFields.isPaid,
        ticketPrice: adminFields.isPaid ? parseFloat(adminFields.ticketPrice) : 0,
        competitors: adminFields.competitors,
        judges: adminFields.judges,
        category: adminFields.category,
        isLive: adminFields.isLive,
        isFeatured: adminFields.isFeatured
      };

      const res = await apiCall(`/events/${id}`, 'PUT', payload, user.token);
      setEvent(res.event);
      setEventIsPaid(res.event.isPaid || false);
      setTicketPrice(Number(res.event.ticketPrice) || 0);

      const ticketVerification = await apiCall(`/tickets/verify/${id}`, 'GET', null, user.token);
      setCanWatch(ticketVerification.canWatch);
      setHasTicket(ticketVerification.hasTicket);

      setIsAdminEditing(false);
      showToast("⚡ Livestream Settings & Controls Updated!");
    } catch (err) {
      showToast(`Error: ${err.message || "Failed to update stream configuration"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      if (!chatInput.trim()) return;

      if (user && blockedUsers.includes(user.id || user._id)) {
        showToast("🚫 Message blocked! You are banned from this chat.");
        return;
      }

      const newMessage = {
        id: Date.now(),
        user: user ? user.name : "AnonymousSpectator",
        msg: chatInput,
        color: user && user.isAdmin ? "#FF6A00" : undefined,
        userId: user ? user.id || user._id : "anonymous"
      };

      setChatMessages(prev => [...prev, newMessage]);
      setChatInput("");
    }
  };

  const handleDeleteChatMessage = (messageId) => {
    setChatMessages(prev => prev.filter(m => m.id !== messageId));
    showToast("🗑️ Message Deleted by Moderator.");
  };

  const handleBanChatter = (userId, userName) => {
    if (userId === "anonymous" || !userId) {
      showToast("Cannot ban anonymous participants.");
      return;
    }
    setBlockedUsers(prev => [...prev, userId]);
    showToast(`🚫 Chatter ${userName} has been banned & kicked!`);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(23, 59, 59);

      const diff = target - now;

      if (diff > 0) {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({
          hours: h.toString().padStart(2, "0"),
          minutes: m.toString().padStart(2, "0"),
          seconds: s.toString().padStart(2, "0")
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingTop: "120px" }}>
        <Navbar />

        {/* CSS KEYFRAMES */}
        <style>{`
          @keyframes slideIn {
            from { transform: translateY(-20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.4); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

        {/* TOAST ALERT */}
        {toast && (
          <div style={{
            position: "fixed",
            top: "140px",
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
            gap: "12px",
            animation: "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{ width: "8px", height: "8px", background: "#FF6A00", borderRadius: "50%", animation: "pulse 1s infinite" }}></div>
            {toast}
          </div>
        )}

        {/* SPECTATOR PASS LOCK MODAL */}
        {showModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(15px)",
            animation: "fadeIn 0.25s ease-out"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #161616 0%, #0c0c0c 100%)",
              border: "1px solid rgba(255, 106, 0, 0.25)",
              borderRadius: "32px",
              padding: "48px",
              maxWidth: "520px",
              width: "90%",
              boxShadow: "0 30px 60px rgba(255, 106, 0, 0.15)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ position: "absolute", width: "150px", height: "150px", background: "#FF6A00", filter: "blur(100px)", opacity: 0.15, top: "-30px", right: "-30px" }} />

              <div style={{ display: "inline-flex", padding: "16px", background: "rgba(255, 106, 0, 0.1)", borderRadius: "50%", marginBottom: "24px", color: "#FF6A00" }}>
                <Play size={36} fill="#FF6A00" style={{ marginLeft: "4px" }} />
              </div>

              <h3 style={{ fontSize: "28px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "-0.02em" }}>
                SPECTATOR PASS <span style={{ color: "#FF6A00" }}>REQUIRED</span>
              </h3>

              <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "14px", lineHeight: "1.6", marginBottom: "32px" }}>
                This exclusive live world record attempt requires a Spectator Pass. Secure your premium ticket now to unlock full live coverage, high-definition playbacks, and live chat features!
              </p>

              {purchaseCode ? (
                <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "16px", padding: "32px", marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "900", color: "#22c55e", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "0.1em" }}>YOUR ACCESS CODE</h4>
                  <div style={{ fontSize: "36px", fontWeight: "950", color: "white", letterSpacing: "0.1em", marginBottom: "20px", background: "rgba(0,0,0,0.4)", padding: "12px", borderRadius: "12px" }}>
                    {purchaseCode}
                  </div>
                  <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "13px", lineHeight: "1.5" }}>
                    Please copy this code and use the <strong>REDEEM ACCESS CODE</strong> button on the stream player to unlock the event.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "rgba(255,255,255,0.4)" }}>SINGLE PASS PRICE</span>
                    <span style={{ fontSize: "24px", fontWeight: "950", color: "#FF6A00" }}>${ticketPrice.toFixed(2)} USD</span>
                  </div>

                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: "24px" }}>
                    {isRealEventId(event?.id || event?._id || id)
                      ? "Your pass is added to your cart. Pay at checkout and it is linked to your account, which unlocks this stream."
                      : "Spectator passes for this event are not on sale yet."}
                  </p>
                  <div style={{ display: "none" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>Card Details</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <input type="text" placeholder="Cardholder Name" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none" }} />
                      <input type="text" placeholder="Card Number" maxLength="19" value={cardNumber} onChange={handleCardNumberChange} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none", letterSpacing: "2px" }} />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input type="text" placeholder="MM/YY" maxLength="5" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none" }} />
                        <input type="text" placeholder="CVC" maxLength="4" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 16px", color: "white", fontSize: "14px", outline: "none" }} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {!purchaseCode ? (
                  <button
                    onClick={purchaseTicket}
                    disabled={loading}
                    style={{
                      background: loading ? "rgba(255,106,0,0.5)" : "#FF6A00",
                      color: "white",
                      border: "none",
                      borderRadius: "100px",
                      padding: "18px 36px",
                      fontSize: "13px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: "0 10px 20px rgba(255,106,0,0.2)",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "#e55e00"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                    onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = "#FF6A00"; e.currentTarget.style.transform = "translateY(0)"; } }}
                  >
                    {loading ? "LOADING..." : "ADD PASS TO CART"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(purchaseCode).catch(() => console.log("Clipboard write failed"));
                      setHasTicket(true);
                      setCanWatch(true);
                      setIsPlaying(true);
                      setShowModal(false);
                      showToast("✅ Code copied and Stream Unlocked!");
                    }}
                    style={{
                      background: "#22c55e",
                      color: "white",
                      border: "none",
                      borderRadius: "100px",
                      padding: "18px 36px",
                      fontSize: "13px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      boxShadow: "0 10px 20px rgba(34, 197, 94, 0.2)",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#22c55e"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    COPY CODE & WATCH
                  </button>
                )}

                <button
                  onClick={() => { setShowModal(false); setPurchaseCode(""); }}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "rgba(255, 255, 255, 0.6)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "100px",
                    padding: "16px 36px",
                    fontSize: "13px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                >
                  {purchaseCode ? "CLOSE" : "CANCEL"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REDEEM ACCESS CODE MODAL */}
        {showRedeemModal && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(15px)", animation: "fadeIn 0.25s ease-out"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #161616 0%, #0c0c0c 100%)", border: "1px solid rgba(255, 106, 0, 0.25)",
              borderRadius: "32px", padding: "48px", maxWidth: "480px", width: "90%", boxShadow: "0 30px 60px rgba(255, 106, 0, 0.15)",
              textAlign: "center", position: "relative", overflow: "hidden"
            }}>
              <h3 style={{ fontSize: "24px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "-0.02em" }}>
                REDEEM <span style={{ color: "#FF6A00" }}>ACCESS CODE</span>
              </h3>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                Enter the access code from your spectator pass to unlock the live stream.
              </p>

              <input
                type="text"
                value={redeemCodeInput}
                onChange={e => setRedeemCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. TKT-XXXXXXXX"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px 20px", color: "white", fontSize: "18px", fontWeight: "900", letterSpacing: "0.1em", outline: "none", textAlign: "center", textTransform: "uppercase", marginBottom: "24px" }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={async () => {
                    // Tickets belong to the buyer's account: the server confirms access (no codes are stored in the page).
                    if (!user?.token) {
                      showToast("Please log in with the account that bought the ticket.");
                      return;
                    }
                    try {
                      const check = await apiCall(`/tickets/verify/${id}`, 'GET', null, user.token);
                      if (check?.hasTicket) {
                        setHasTicket(true);
                        setIsPlaying(true);
                        setShowRedeemModal(false);
                        setRedeemCodeInput("");
                        showToast("✅ Ticket confirmed! Enjoy the livestream.");
                      } else {
                        showToast("❌ No valid ticket for this event was found on your account.");
                      }
                    } catch {
                      showToast("❌ Could not check your ticket right now. Please try again.");
                    }
                  }}
                  style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "16px 36px", fontSize: "13px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  UNLOCK STREAM
                </button>
                <button
                  onClick={() => { setShowRedeemModal(false); setRedeemCodeInput(""); }}
                  style={{ background: "rgba(255, 255, 255, 0.05)", color: "rgba(255, 255, 255, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "100px", padding: "16px 36px", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STREAM AREA */}
        <section style={{ padding: "40px 5% 40px", maxWidth: "1600px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gridTemplateRows: "auto auto", gap: "24px" }}>

            {/* VIDEO PLAYER */}
            <div style={{ position: "relative", height: "600px", background: "#000", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
              {/* Video sponsor overlay (Admin → Sponsorships → "Video Sponsor Overlay") */}
              <SponsorBanner variant="overlay" placements={["video_overlay"]} />
              {isCurrentUserKicked ? (
                /* RECTIVE EJECTION SCREEN FOR BANNED USERS */
                <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.95)", padding: "20px" }}>
                  <Shield size={64} color="#EF4444" style={{ marginBottom: "20px", opacity: 0.9, filter: "drop-shadow(0 0 20px rgba(239,68,68,0.5))" }} />
                  <h3 style={{ fontSize: "24px", fontWeight: "950", marginBottom: "12px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em", color: "#EF4444" }}>🚫 ACCESS REVOKED</h3>
                  <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", marginBottom: "32px", textAlign: "center", maxWidth: "480px", lineHeight: "1.6" }}>
                    You have been kicked from this livestream. An administrator has terminated your viewing session due to chat or safety policy violations.
                  </p>
                  <button onClick={() => window.location.href = '/'} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "14px 32px", borderRadius: "100px", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>
                    RETURN HOME
                  </button>
                </div>
              ) : isLocked ? (
                <>
                  <img loading="lazy" decoding="async"
                    src={currentEvent.img || "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1600&q=80"}
                    alt="Stream locked"
                    style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(16px)", opacity: 0.4 }}
                  />
                  <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", padding: "20px" }}>
                    <Shield size={56} color="#FF6A00" style={{ marginBottom: "20px", opacity: 0.9 }} />
                    <h3 style={{ fontSize: "22px", fontWeight: "950", marginBottom: "12px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em" }}>THIS LIVESTREAM REQUIRES A VALID EVENT TICKET TO ACCESS</h3>
                    <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", marginBottom: "32px", textAlign: "center", maxWidth: "480px", lineHeight: "1.6" }}>
                      You need to {user ? "purchase a spectator pass" : "log in and purchase a spectator pass"} to unlock this premium live event.
                    </p>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                      {!user && (
                        <Link to="/login" style={{ textDecoration: "none" }}>
                          <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "14px 32px", borderRadius: "100px", fontWeight: "800", fontSize: "13px", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            LOGIN
                          </button>
                        </Link>
                      )}
                      <button onClick={() => { if (!user) { window.location.href = '/login'; return; } setShowModal(true); }} style={{ background: "#FF6A00", border: "none", color: "white", padding: "14px 32px", borderRadius: "100px", fontWeight: "900", fontSize: "13px", cursor: "pointer", boxShadow: "0 10px 20px rgba(255,106,0,0.25)", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                        PURCHASE TICKET
                      </button>
                      <button
                        onClick={() => setShowRedeemModal(true)}
                        style={{ background: "transparent", border: "none", color: "#FF6A00", padding: "14px 32px", borderRadius: "100px", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}
                      >
                        REDEEM ACCESS CODE
                      </button>
                    </div>
                  </div>
                </>
              ) : isPlaying ? (
                <div style={{ width: "100%", height: "100%", position: "relative", background: "#0c0c0c" }}>
                  <img loading="lazy" decoding="async"
                    src={currentEvent.img || "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1600&q=80"}
                    alt="Stream playing"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(255, 106, 0, 0.05)", pointerEvents: "none" }} />

                  <div style={{ position: "absolute", bottom: "30px", left: "30px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.7)", padding: "10px 20px", borderRadius: "100px", backdropFilter: "blur(10px)" }}>
                    <div style={{ width: "8px", height: "8px", background: "#EF4444", borderRadius: "50%", animation: "pulse 1s infinite" }}></div>
                    <span style={{ fontSize: "12px", fontWeight: "900", color: "white", letterSpacing: "0.05em" }}>LIVE HD FEED</span>
                  </div>

                  <div
                    style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.23s", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    onClick={handleWatchClick}
                  >
                    <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#FF6A00", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="4" y="4" width="4" height="16" rx="1" /><rect x="16" y="4" width="4" height="16" rx="1" /></svg>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <img loading="lazy" decoding="async"
                    src={currentEvent.img || "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1600&q=80"}
                    alt="Stream"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
                  />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={handleWatchClick}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#FF6A00", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 30px rgba(255,106,0,0.3)" }}>
                      <Play fill="white" size={32} />
                    </div>
                  </div>
                </>
              )}

              {/* Overlay Info */}
              <div style={{ position: "absolute", top: "24px", left: "24px", display: "flex", gap: "12px", zIndex: 10 }}>
                <div style={{ background: isPlaying ? "#EF4444" : "#FF6A00", padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "900", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.3s" }}>
                  <div style={{ width: "6px", height: "6px", background: "white", borderRadius: "50%" }}></div> {!eventIsPaid ? "FREE STREAM" : isPlaying ? "LIVE FEED" : "LIVE"}
                </div>
                <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "900", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Eye size={14} /> 34.2K VIEWERS
                </div>
              </div>
            </div>

            {/* CHAT SIDE - Matches Video Height */}
            <div style={{ background: "#161616", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", overflow: "hidden", height: "600px" }}>
              <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "0.1em" }}>LIVE CHAT</span>
                <Users size={18} color="rgba(255,255,255,0.3)" />
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
                {chatMessages.map((m) => (
                  <div key={m.id} style={{ fontSize: "13px", lineHeight: "1.5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: "900", color: m.color || "rgba(255,255,255,0.4)", marginRight: "8px" }}>{m.user}:</span>
                      <span style={{ fontWeight: "500" }}>{m.msg}</span>
                    </div>

                    {/* MODERATOR CHAT ACTIONS */}
                    {user && user.isAdmin && (
                      <div style={{ display: "flex", gap: "8px", marginLeft: "12px" }}>
                        <button
                          onClick={() => handleDeleteChatMessage(m.id)}
                          title="Delete message"
                          style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                        >
                          <Trash2 size={12} />
                        </button>
                        {m.userId && m.userId !== "anonymous" && !blockedUsers.includes(m.userId) && (
                          <button
                            onClick={() => handleBanChatter(m.userId, m.user)}
                            title="Ban and eject user"
                            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                          >
                            <Ban size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div style={{ padding: "24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={handleSendChatMessage}
                    placeholder="Send a message..."
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "100px", padding: "14px 20px 14px 20px", color: "white", fontSize: "13px", outline: "none" }}
                  />
                  <button onClick={handleSendChatMessage} style={{ background: "transparent", border: "none", position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Title & Info - Below Video */}
            <div style={{ background: "#161616", padding: "32px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h1 style={{ fontSize: "32px", fontWeight: "950", textTransform: "uppercase", marginBottom: "8px" }}>{currentEvent.title}</h1>
                  <div style={{ display: "flex", gap: "20px", color: "rgba(255,255,255,0.4)", fontSize: "14px", fontWeight: "700" }}>
                    <span style={{ color: "#FF6A00" }}>#{currentEvent.category}</span>
                    <span>• Tokyo Hub</span>
                    <span>• {currentEvent.competitors || currentEvent.athletes || "CONTESTANTS SELECTED"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>

                  {/* INLINE ADMIN CONTROLS SWITCH */}
                  {user && user.isAdmin && event && (
                    <button
                      onClick={() => setIsAdminEditing(prev => !prev)}
                      style={{ background: "rgba(255,106,0,0.1)", border: "1px solid rgba(255,106,0,0.3)", color: "#FF6A00", padding: "12px 24px", borderRadius: "100px", fontWeight: "800", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <Zap size={14} fill="#FF6A00" /> {isAdminEditing ? "CLOSE SETTINGS" : "⚡ EDIT STREAM"}
                    </button>
                  )}

                  <button style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "12px 24px", borderRadius: "100px", fontWeight: "800", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Share2 size={16} /> SHARE
                  </button>

                  <button
                    onClick={handleWatchClick}
                    style={{
                      background: isPlaying ? "#EF4444" : "#FF6A00",
                      border: "none",
                      color: "white",
                      padding: "12px 28px",
                      borderRadius: "100px",
                      fontWeight: "900",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: isPlaying ? "0 10px 20px rgba(239,68,68,0.2)" : "0 10px 20px rgba(255,106,0,0.2)",
                      transition: "all 0.3s",
                      textTransform: "uppercase"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    {isLocked ? (
                      <>
                        <Shield size={14} fill="white" /> UNLOCK STREAM
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="white" /> {isPlaying ? (currentEvent.status === "PAST" ? "PAUSE PLAYBACK" : "PAUSE FEED") : (currentEvent.status === "PAST" ? "WATCH PLAYBACK" : hasTicket ? "WATCH STREAM" : "WATCH LIVE")}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* DYNAMIC COMPETITORS AND JUDGES METADATA TILES */}
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "16px", padding: "20px", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>OFFICIAL COMPETITORS</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Users size={16} color="#FF6A00" /> {currentEvent.competitors || currentEvent.athletes || "CONTESTANTS SELECTED"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>VERIFIED ADJUDICATORS & JUDGES</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Shield size={16} color="#FF6A00" /> {currentEvent.judges || "AMPEX OFFICIAL ADJUDICATION TEAM"}
                  </div>
                </div>
              </div>

              <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: "1.6", fontSize: "15px", margin: 0 }}>
                {currentEvent.desc || "The final stage of the AMPEX World Series. Competitors battle live for the absolute title record, officially adjudicated."}
              </p>

              {/* INLINE ADMIN EDITING SUITE */}
              <AnimatePresence>
                {isAdminEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: "32px", padding: "32px", background: "rgba(255, 106, 0, 0.04)", border: "1px solid rgba(255, 106, 0, 0.2)", borderRadius: "20px", overflow: "hidden" }}
                  >
                    <h3 style={{ fontSize: "15px", fontWeight: "950", color: "white", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "20px" }}>
                      ⚡ ADMIN LIVESTREAM LOCK & TICKET PRICING CONTROLS
                    </h3>

                    <form onSubmit={handleSaveAdminChanges} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>STREAM TITLE</label>
                          <input
                            type="text"
                            required
                            value={adminFields.title}
                            onChange={e => setAdminFields({...adminFields, title: e.target.value})}
                            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>BANNER / THUMBNAIL URL</label>
                          <input
                            type="text"
                            value={adminFields.imageUrl}
                            onChange={e => setAdminFields({...adminFields, imageUrl: e.target.value})}
                            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>STREAM DESCRIPTION</label>
                        <textarea
                          value={adminFields.description}
                          onChange={e => setAdminFields({...adminFields, description: e.target.value})}
                          style={{ width: "100%", height: "60px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none", resize: "none" }}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>COMPETITORS</label>
                          <input
                            type="text"
                            value={adminFields.competitors}
                            onChange={e => setAdminFields({...adminFields, competitors: e.target.value})}
                            placeholder="e.g. 12 ATHLETES"
                            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>JUDGING OFFICIALS</label>
                          <input
                            type="text"
                            value={adminFields.judges}
                            onChange={e => setAdminFields({...adminFields, judges: e.target.value})}
                            placeholder="e.g. Adjudicated by AMPEX Marshals"
                            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 1fr", gap: "16px", alignItems: "center" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>STREAM VIDEO SOURCE URL</label>
                          <input
                            type="text"
                            value={adminFields.streamUrl}
                            onChange={e => setAdminFields({...adminFields, streamUrl: e.target.value})}
                            placeholder="e.g. https://..."
                            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none" }}
                          />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
                          <input
                            type="checkbox"
                            id="adminIsPaid"
                            checked={adminFields.isPaid}
                            onChange={e => setAdminFields({...adminFields, isPaid: e.target.checked})}
                            style={{ accentColor: "#FF6A00", width: "16px", height: "16px", cursor: "pointer" }}
                          />
                          <label htmlFor="adminIsPaid" style={{ fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>PAID SPECTATOR PASS</label>
                        </div>

                        {adminFields.isPaid && (
                          <div>
                            <label style={{ display: "block", fontSize: "9px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "4px" }}>PASS PRICE ($ USD)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={adminFields.ticketPrice}
                              onChange={e => setAdminFields({...adminFields, ticketPrice: e.target.value})}
                              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* LIVESTREAM STATUS & HOMEPAGE FEATURE CONTROLS */}
                      <div style={{ display: "flex", gap: "24px", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="checkbox"
                            id="adminIsLive"
                            checked={adminFields.isLive}
                            onChange={e => setAdminFields({...adminFields, isLive: e.target.checked})}
                            style={{ accentColor: "#FF6A00", width: "16px", height: "16px", cursor: "pointer" }}
                          />
                          <label htmlFor="adminIsLive" style={{ fontSize: "12px", fontWeight: "800", cursor: "pointer", color: adminFields.isLive ? "#EF4444" : "white" }}>
                            {adminFields.isLive ? "🔴 STREAM IS LIVE NOW" : "⚪ STREAM IS ENDED (PLAYBACK)"}
                          </label>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="checkbox"
                            id="adminIsFeatured"
                            checked={adminFields.isFeatured}
                            onChange={e => setAdminFields({...adminFields, isFeatured: e.target.checked})}
                            style={{ accentColor: "#FF6A00", width: "16px", height: "16px", cursor: "pointer" }}
                          />
                          <label htmlFor="adminIsFeatured" style={{ fontSize: "12px", fontWeight: "800", cursor: "pointer", color: adminFields.isFeatured ? "#FF6A00" : "white" }}>
                            ⭐ FEATURE THIS LIVESTREAM ON HOMEPAGE
                          </label>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                        <button
                          type="submit"
                          style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "12px 32px", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer" }}
                        >
                          💾 SAVE CHANGES
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAdminEditing(false)}
                          style={{ background: "rgba(255, 255, 255, 0.05)", color: "rgba(255, 255, 255, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "100px", padding: "12px 32px", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", cursor: "pointer" }}
                        >
                          CANCEL
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>
        </section>

        {/* Livestream sponsors (Admin → Sponsorships → "Livestream Banner") */}
        <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "0 5%" }}>
          <SponsorBanner placements={["livestream"]} style={{ padding: "8px 0 24px" }} />
        </div>

        {/* PURCHASE TICKETS SECTION - Conditionally Rendered */}
        {currentEvent.status !== "PAST" && (
          <section style={{ margin: "0 auto 0", padding: "40px 5% 100px", maxWidth: "1400px" }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(255,106,0,0.1) 0%, rgba(255,106,0,0.02) 100%)",
              border: "1px solid rgba(255,106,0,0.2)",
              borderRadius: "40px",
              padding: "60px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ position: "absolute", right: "-50px", bottom: "-50px", opacity: 0.05 }}>
                <Shield size={300} color="#FF6A00" />
              </div>

              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#FF6A00", marginBottom: "20px" }}>
                  <Zap size={20} fill="#FF6A00" />
                  <span style={{ fontSize: "12px", fontWeight: "900", letterSpacing: "0.2em", textTransform: "uppercase" }}>FRONT-ROW EXPERIENCE</span>
                </div>
                <h2 style={{ fontSize: "56px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: "1", marginBottom: "24px" }}>
                  PURCHASE <br /> <span style={{ color: "#FF6A00" }}>TICKETS NOW</span>
                </h2>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", maxWidth: "500px", lineHeight: "1.6", marginBottom: "24px" }}>
                  Want to witness history in person? Secure your exclusive spectator pass now to watch the live world record attempts from the absolute front row.
                </p>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#EF4444", padding: "6px 16px", borderRadius: "100px", fontSize: "11px", fontWeight: "900", letterSpacing: "0.05em" }}>
                    🔥 92% TICKETS SOLD OUT
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "white" }}>
                    FROM <span style={{ color: "#FF6A00" }}>${ticketPrice.toFixed(2)}</span> / PASS
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right", position: "relative", zIndex: 2 }}>
                <div style={{ marginBottom: "32px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>EVENT STARTS IN</div>
                  <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end" }}>
                    <CountdownBox value={timeLeft.hours} label="HOURS" />
                    <CountdownBox value={timeLeft.minutes} label="MINS" />
                    <CountdownBox value={timeLeft.seconds} label="SECS" />
                  </div>
                </div>

                <button onClick={() => { if (!user) { window.location.href = '/login'; return; } setShowModal(true); }} style={{
                  background: "#FF6A00",
                  color: "white",
                  border: "none",
                  borderRadius: "100px",
                  padding: "20px 48px",
                  fontSize: "14px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  boxShadow: "0 20px 40px rgba(255, 106, 0, 0.3)",
                  transition: "transform 0.3s"
                }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                  GET YOUR PASSES <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>

    </PageTransition>
  );
};

export default StreamDetail;
