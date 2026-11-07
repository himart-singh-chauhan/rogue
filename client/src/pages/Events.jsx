import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Eye,
  Activity,
  Clock,
  Calendar,
  MapPin,
  Users,
  Zap,
  ArrowRight,
  BarChart3,
  Edit3,
  Plus,
  Trash2,
  ArrowLeft,
  Bell,
  Share2,
  Info,
  Lock,
  ExternalLink
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { useAuth } from "../context/AuthContext";
import { apiCall } from "../utils/api";

const Countdown = ({ targetDate, status }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (status === "CANCELLED" || status?.toUpperCase() === "CANCELLED") {
      setTimeLeft("EVENT CANCELLED");
      return;
    }
    if (status === "LIVE" || status?.toUpperCase() === "LIVE") {
      setTimeLeft("EVENT IS LIVE NOW!");
      return;
    }
    if (status === "PAST" || status?.toUpperCase() === "PAST" || status?.toUpperCase() === "COMPLETED") {
      setTimeLeft("EVENT COMPLETED");
      return;
    }

    const calculate = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference <= 0) {
        setTimeLeft("EVENT HAS STARTED!");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let str = "";
      if (days > 0) str += `${days}D `;
      str += `${hours.toString().padStart(2, '0')}H ${minutes.toString().padStart(2, '0')}M ${seconds.toString().padStart(2, '0')}S`;
      setTimeLeft(str);
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate, status]);

  return (
    <div style={{
      background: "rgba(255, 106, 0, 0.08)",
      border: "1px solid rgba(255, 106, 0, 0.3)",
      padding: "16px 28px",
      borderRadius: "16px",
      display: "inline-flex",
      flexDirection: "column",
      gap: "4px",
      alignItems: "center",
      boxShadow: "0 0 20px rgba(255,106,0,0.15)",
      width: "100%",
      maxWidth: "340px"
    }}>
      <div style={{ fontSize: "9px", fontWeight: "950", color: "#FF6A00", letterSpacing: "1px", textTransform: "uppercase" }}>COUNTDOWN TO START</div>
      <div style={{ fontSize: "28px", fontWeight: "950", color: "white", fontFamily: "monospace", letterSpacing: "1px" }}>{timeLeft}</div>
    </div>
  );
};

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
    desc: "The pinnacle of raw powerlifting. The world's top heavyweight lifters battle for the absolute bench press record live.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    ticketLink: "/shop?category=tickets",
    sponsors: "Rogue Fitness, Hanger 24, Thorne Nutrition",
    rules: "1. All lifters must use certified Rogue plates.\n2. Bench shirt is prohibited (raw lifting standards apply).\n3. Elbow lock must be fully held until marshal call.",
    location: "Rogue Arena Main Stage",
    judges: "Marshal Team A",
    isPaid: true,
    ticketPrice: 49.00,
    rawDate: new Date(Date.now()).toISOString()
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
    desc: "The final game between two absolute block-stacking legends competing for the maxout 999,999 record.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    ticketLink: "/shop?category=tickets",
    sponsors: "Nintendo Classic, Retro Gaming Hub, Hyperkin",
    rules: "1. Standard NES hardware must be used.\n2. Standard score capture system is active.\n3. Matches are played to a maxout of 999,999 or killscreen.",
    location: "Retro eSports Hub",
    judges: "Adjudicator team Alpha",
    isPaid: false,
    ticketPrice: 0,
    rawDate: new Date(Date.now()).toISOString()
  },
  {
    id: "dash-final",
    status: "UPCOMING",
    title: "THE 100M DASH FINAL",
    category: "ATHLETICS",
    time: "TOMORROW 02:00 PM",
    athletes: "12 ATHLETES",
    img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1600&q=80",
    isFeatured: true,
    desc: "Speed unleashed. A line-up of the fastest sprinters on earth competing for the sub-9.6s record live from Olympic Hub.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    ticketLink: "/shop?category=tickets",
    sponsors: "Adidas Track, Seiko Timing, Gatorade",
    rules: "1. Zero tolerance for false starts.\n2. Competitors must wear certified track shoes.\n3. Automatic digital timing is final.",
    location: "Olympic Stadium Track",
    judges: "IAAF Certified Officials",
    isPaid: true,
    ticketPrice: 65.00,
    rawDate: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: "street-workout",
    status: "UPCOMING",
    title: "STREET WORKOUT FREESTYLE",
    category: "AGILITY",
    time: "TOMORROW 10:00 AM",
    athletes: "24 ATHLETES",
    img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    ticketLink: "/shop?category=tickets",
    sponsors: "Barstarzz, Calisthenics Club, Red Bull",
    rules: "1. Standard 2-minute freestyle rounds.\n2. Safety pads are voluntary but recommended.\n3. Judged based on dynamic skills, static holds, and flow.",
    location: "Shibuya Outdoor Bar Park",
    judges: "Calisthenics Judges",
    isPaid: false,
    ticketPrice: 0,
    rawDate: new Date(Date.now() + 72000000).toISOString()
  },
  {
    id: "speed-climbing",
    status: "UPCOMING",
    title: "SPEED CLIMBING QUALS",
    category: "SPEED",
    time: "SUN, OCT 22 04:00 PM",
    athletes: "18 ATHLETES",
    img: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    ticketLink: "/shop?category=tickets",
    sponsors: "Petzl, Black Diamond, The North Face",
    rules: "1. Vertical 15m climbing wall with standard holds.\n2. Automatic safety belay must be worn.\n3. Time captured automatically upon hitting touch plate.",
    location: "Vertical Arena Climb Zone",
    judges: "IFSC Certified Referees",
    isPaid: true,
    ticketPrice: 35.00,
    rawDate: new Date(Date.now() + 172800000).toISOString()
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
    desc: "A freezing duel of raw human endurance. Competitors swim a full 50 meters in near-freezing sub-zero glacial waters.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    ticketLink: "/shop?category=tickets",
    sponsors: "Speedo Ice, Glacial Swim Federation, Thorne Nutrition",
    rules: "1. Water temperature must be between 0-2 degrees Celsius.\n2. Standard textile swimwear only (no neoprene suits).\n3. Medical check required immediately after exit.",
    location: "Hokkaido Glacial Lake Hub",
    judges: "Open Water Swim Adjudicators",
    isPaid: true,
    ticketPrice: 50.00,
    rawDate: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: "reaction-test",
    status: "PAST",
    title: "LIGHT BUTTON HITS CHAMPIONSHIP",
    category: "REACTION",
    time: "COMPLETED (OCT 12)",
    athletes: "10 ATHLETES",
    img: "https://images.unsplash.com/photo-1591123720164-de1348028a82?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    ticketLink: "/shop?category=tickets",
    sponsors: "Reaction Tech, Cyber Athletics League",
    rules: "1. Dynamic lighting targets must be hit within 0.5s active time.\n2. Hands must return to baseline bar after each hit.\n3. 60-second limit per match.",
    location: "Cyber Arena Hub",
    judges: "AWR Adjudication Unit",
    isPaid: false,
    ticketPrice: 0,
    rawDate: new Date(Date.now() - 259200000).toISOString()
  }
];

const Events = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("LIVE");
  const [dbEvents, setDbEvents] = useState([]);
  const [toast, setToast] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create"); // "create" | "edit"
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [viewingEvent, setViewingEvent] = useState(null);

  const [reminders, setReminders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("awr_event_reminders") || "[]");
    } catch {
      return [];
    }
  });

  const toggleReminder = (eventId) => {
    let updated;
    if (reminders.includes(eventId)) {
      updated = reminders.filter(id => id !== eventId);
      showToast("🔔 Reminder removed for this event.");
    } else {
      updated = [...reminders, eventId];
      showToast("🔔 Reminder set! We will notify you before the event starts.");
    }
    setReminders(updated);
    localStorage.setItem("awr_event_reminders", JSON.stringify(updated));
  };

  // Form Fields
  const [formFields, setFormFields] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    imageUrl: "",
    isLive: false,
    streamUrl: "",
    isPaid: false,
    ticketPrice: "49.00",
    competitors: "",
    judges: "",
    category: "WORLD RECORD",
    isFeatured: false,
    videoUrl: "",
    ticketLink: "",
    sponsors: "",
    rules: "",
    status: "upcoming"
  });

  // Ticket Scanning Station States
  const [adminTickets, setAdminTickets] = useState([]);
  const [selectedAdminTicket, setSelectedAdminTicket] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState(null); // { type: 'success' | 'vip' | 'duplicate' | 'error', message: string, user?: object, event?: object, lastScanned?: string }
  const [scanTelemetry, setScanTelemetry] = useState({ totalScanned: 0, vipVerified: 0, duplicateBlocks: 0 });
  const [scanHistoryLogs, setScanHistoryLogs] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const fetchAdminTickets = async () => {
    if (!user || !user.isAdmin || !user.token) return;
    setTicketsLoading(true);
    try {
      const data = await apiCall("/tickets/admin/list", "GET", null, user.token);
      if (data && data.length > 0) {
        setAdminTickets(data);
        if (!selectedAdminTicket) {
          setSelectedAdminTicket(data[0]);
        }
      } else {
        throw new Error("No tickets returned");
      }
    } catch (err) {
      console.warn("Failed to load live tickets list. Using rich mock tickets list.", err);
      // Pre-seed high-fidelity mock tickets for simulation
      const mockTickets = [
        { id: "tick-1", accessCode: "usr-1-evt-1-98247", ticketType: "vip", status: "active", user: { name: "John Doe", email: "john@rogue.com" }, event: { title: "THE SUMMIT LIFT: FINALS" } },
        { id: "tick-2", accessCode: "usr-2-evt-1-84729", ticketType: "spectator", status: "active", user: { name: "Jane Smith", email: "jane@rogue.com" }, event: { title: "THE SUMMIT LIFT: FINALS" } },
        { id: "tick-3", accessCode: "usr-3-evt-2-72648", ticketType: "vip", status: "active", user: { name: "LeBron James", email: "lebron@lakers.com" }, event: { title: "RETRO TETRIS WORLD FINAL" } },
        { id: "tick-4", accessCode: "usr-4-evt-1-10294", ticketType: "spectator", status: "used", scan_count: 1, last_scanned_at: new Date(Date.now() - 3600000).toISOString(), user: { name: "Bob Miller", email: "bob@miller.com" }, event: { title: "THE SUMMIT LIFT: FINALS" } },
        { id: "tick-5", accessCode: "usr-5-evt-3-46294", ticketType: "spectator", status: "revoked", user: { name: "Spammy McSpam", email: "spam@bot.com" }, event: { title: "THE 100M DASH FINAL" } }
      ];
      setAdminTickets(mockTickets);
      if (!selectedAdminTicket) {
        setSelectedAdminTicket(mockTickets[0]);
      }
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleScanTicket = async (accessCodeToScan) => {
    const code = (accessCodeToScan || "").trim();
    if (!code) {
      showToast("Please enter or select a ticket code to scan.");
      return;
    }

    setScannerActive(true);
    setScanResult(null);

    // Simulate scanning delay for high-fidelity laser visuals
    setTimeout(async () => {
      try {
        let res;
        // Offline / Simulation Fallback Check
        const mockTicket = adminTickets.find(t => t.accessCode === code);
        if (!user || !user.token) {
          // No logged-in token (offline simulation sandbox mode)
          if (!mockTicket) {
            throw new Error("Invalid ticket access code - Access Denied");
          }
          res = mockTicket;
        } else {
          // Try backend verification API
          try {
            res = await apiCall("/tickets/scan", "POST", { accessCode: code }, user.token);
          } catch (apiErr) {
            console.warn("Backend scanning API unavailable. Using robust frontend simulator.", apiErr);
            if (!mockTicket) {
              throw new Error("Invalid ticket access code - Access Denied");
            }
            res = mockTicket;
          }
        }

        // Processing scan results
        if (res.duplicate || res.status === "used" || (res.ticket && res.ticket.status === "used")) {
          const t = res.ticket || mockTicket;
          setScanResult({
            type: "duplicate",
            message: "DUPLICATE SCAN ATTEMPT - TICKET ALREADY SCANNED!",
            user: t.user || { name: "Unknown", email: "n/a" },
            event: t.event || { title: "Unknown Event" },
            lastScanned: res.scannedAt || t.last_scanned_at || new Date().toISOString()
          });
          setScanTelemetry(prev => ({ ...prev, duplicateBlocks: prev.duplicateBlocks + 1 }));
          addScanLog(t.user?.name || "Unknown", code, "DUPLICATE", t.ticketType || "spectator");
          showToast("🚫 DUPLICATE SCAN DETECTED - ADMISSION DENIED!");
        } else if (res.status === "revoked" || res.revoked) {
          setScanResult({
            type: "error",
            message: "TICKET REVOKED - ACCESS DENIED!",
            user: res.user || { name: "Purged Account", email: "n/a" }
          });
          addScanLog(res.user?.name || "Banned Chatter", code, "REVOKED", "spectator");
          showToast("❌ BANNED/REVOKED TICKET!");
        } else {
          // Success scan (verify VIP access)
          const ticketObj = res.ticket || res;
          const isVip = ticketObj.ticketType === "vip";

          setScanResult({
            type: isVip ? "vip" : "success",
            message: isVip ? "⭐ VIP PASS VERIFIED - ACCESS GRANTED!" : "🎫 PASS VERIFIED - ADMISSION GRANTED!",
            user: ticketObj.user || { name: "Spectator", email: "n/a" },
            event: ticketObj.event || { title: "Live Event" }
          });

          setScanTelemetry(prev => ({
            ...prev,
            totalScanned: prev.totalScanned + 1,
            vipVerified: prev.vipVerified + (isVip ? 1 : 0)
          }));

          // Mark standard local state mock ticket as used so next scans of same code triggers duplication block!
          setAdminTickets(prev => prev.map(t => t.accessCode === code ? { ...t, status: "used", last_scanned_at: new Date().toISOString() } : t));

          addScanLog(ticketObj.user?.name || "Spectator", code, isVip ? "VIP APPROVED" : "APPROVED", ticketObj.ticketType || "spectator");
          showToast(isVip ? "🌟 VIP PASS ACCESS GRANTED!" : "✅ TICKET SCANNED & ADMITTED!");
        }
      } catch (err) {
        setScanResult({
          type: "error",
          message: err.message || "Invalid ticket access code - Access Denied"
        });
        addScanLog("Guest", code, "INVALID CODE", "spectator");
        showToast("❌ INVALID TICKET CODE!");
      } finally {
        setScannerActive(false);
      }
    }, 1500);
  };

  const handleResetTicket = async (ticket) => {
    if (!user || !user.token) {
      // Local state simulation reset
      setAdminTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: "active", last_scanned_at: null, scan_count: 0 } : t));
      showToast("🔄 Ticket scanning state reset locally!");
      return;
    }

    try {
      await apiCall(`/tickets/${ticket.id}/reset`, "PUT", null, user.token);
      showToast("🔄 Ticket scanning state reset successfully!");
      fetchAdminTickets();
    } catch (err) {
      console.warn("Failed to reset ticket in database, resetting locally.", err);
      setAdminTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: "active", last_scanned_at: null, scan_count: 0 } : t));
      showToast("🔄 Ticket scanning state reset locally!");
    }
  };

  const addScanLog = (name, code, status, tier) => {
    const newLog = {
      id: Date.now(),
      name,
      code,
      time: new Date().toLocaleTimeString(),
      status,
      tier
    };
    setScanHistoryLogs(prev => [newLog, ...prev.slice(0, 4)]);
  };

  const fetchEvents = async () => {
    try {
      const data = await apiCall("/events", "GET", null, user?.token);
      if (data && data.length > 0) {
        const formatted = data.map(item => {
          const isPast = new Date(item.date) < new Date();
          let status = "UPCOMING";
          if (item.status?.toUpperCase() === "CANCELLED" || item.rawStatus?.toUpperCase() === "CANCELLED") {
            status = "CANCELLED";
          } else if (item.isLive || item.is_live || item.status?.toUpperCase() === "LIVE") {
            status = "LIVE";
          } else if (isPast || item.status?.toUpperCase() === "PAST" || item.status?.toUpperCase() === "COMPLETED") {
            status = "PAST";
          } else {
            status = "UPCOMING";
          }

          return {
            id: item.id || item._id,
            status,
            title: item.title,
            category: item.category || "WORLD RECORD",
            time: status === "LIVE" ? "LIVE NOW" : new Date(item.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }).toUpperCase(),
            athletes: item.competitors || "CONTESTANTS SELECTED",
            judges: item.judges || "Rogue Marshal Team",
            viewers: "24,850+",
            img: item.imageUrl || item.image || "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1600&q=80",
            desc: item.description,
            isFeatured: item.isFeatured !== undefined ? item.isFeatured : true,
            isPaid: item.isPaid,
            ticketPrice: item.ticketPrice,
            streamUrl: item.streamUrl,
            rawDate: item.date,
            location: item.location,
            videoUrl: item.videoUrl || item.video_url || "",
            ticketLink: item.ticketLink || item.ticket_link || "",
            sponsors: item.sponsors || "",
            rules: item.rules || "",
            rawStatus: item.status || "upcoming"
          };
        });
        setDbEvents(formatted);
      } else {
        setDbEvents([]);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (user && user.isAdmin) {
      fetchAdminTickets();
    }
  }, [user]);

  const finalEvents = dbEvents.length > 0 ? dbEvents : eventsData;
  const filteredEvents = finalEvents.filter(event => {
    if (activeTab === "LIVE") return event.status === "LIVE";
    if (activeTab === "PAST") return event.status === "PAST" || event.status === "COMPLETED";
    if (activeTab === "UPCOMING") return event.status === "UPCOMING" || event.status === "CANCELLED";
    return event.status === activeTab;
  });
  const featuredEvent = filteredEvents.find(e => e.isFeatured) || filteredEvents[0];
  const otherEvents = filteredEvents.filter(e => e.id !== (featuredEvent?.id || ""));

  const openModal = (type, event = null) => {
    setModalType(type);
    if (type === "edit" && event) {
      setSelectedEventId(event.id);

      // Convert rawDate to datetime-local format
      let formattedDate = "";
      if (event.rawDate) {
        const d = new Date(event.rawDate);
        const pad = (num) => num.toString().padStart(2, '0');
        formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }

      setFormFields({
        title: event.title || "",
        description: event.desc || "",
        date: formattedDate,
        location: event.location || "",
        imageUrl: event.img || "",
        isLive: event.status === "LIVE",
        streamUrl: event.streamUrl || "",
        isPaid: event.isPaid || false,
        ticketPrice: event.ticketPrice ? event.ticketPrice.toString() : "49.00",
        competitors: event.athletes === "CONTESTANTS SELECTED" ? "" : event.athletes,
        judges: event.judges === "Rogue Marshal Team" ? "" : event.judges,
        category: event.category || "WORLD RECORD",
        isFeatured: event.isFeatured || false,
        videoUrl: event.videoUrl || "",
        ticketLink: event.ticketLink || "",
        sponsors: event.sponsors || "",
        rules: event.rules || "",
        status: event.rawStatus || "upcoming"
      });
    } else {
      setSelectedEventId(null);
      setFormFields({
        title: "",
        description: "",
        date: "",
        location: "",
        imageUrl: "",
        isLive: activeTab === "LIVE",
        streamUrl: "",
        isPaid: false,
        ticketPrice: "49.00",
        competitors: "",
        judges: "",
        category: "WORLD RECORD",
        isFeatured: false,
        videoUrl: "",
        ticketLink: "",
        sponsors: "",
        rules: "",
        status: "upcoming"
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!user || !user.token) return;

    try {
      const payload = {
        title: formFields.title,
        description: formFields.description,
        date: new Date(formFields.date).toISOString(),
        location: formFields.location,
        imageUrl: formFields.imageUrl,
        isLive: formFields.isLive,
        streamUrl: formFields.streamUrl,
        isPaid: formFields.isPaid,
        ticketPrice: formFields.isPaid ? parseFloat(formFields.ticketPrice) : 0,
        competitors: formFields.competitors,
        judges: formFields.judges,
        category: formFields.category,
        isFeatured: formFields.isFeatured,
        videoUrl: formFields.videoUrl,
        ticketLink: formFields.ticketLink,
        sponsors: formFields.sponsors,
        rules: formFields.rules,
        status: formFields.status
      };

      if (modalType === "create") {
        await apiCall("/events", "POST", payload, user.token);
        showToast("🌟 Live Event Created Successfully!");
      } else {
        await apiCall(`/events/${selectedEventId}`, "PUT", payload, user.token);
        showToast("⚡ Live Event Settings Updated!");
      }

      setIsModalOpen(false);
      fetchEvents();
      if (viewingEvent && viewingEvent.id === selectedEventId) {
        setViewingEvent(prev => ({ ...prev, ...payload, img: payload.imageUrl, desc: payload.description }));
      }
    } catch (err) {
      showToast(`Error: ${err.message || "Failed to save event"}`);
    }
  };

  const handleDelete = async (eventId) => {
    if (!user || !user.token) return;
    if (!window.confirm("Are you sure you want to permanently delete this event? This action is irreversible.")) return;

    try {
      await apiCall(`/events/${eventId}`, "DELETE", null, user.token);
      showToast("🗑️ Live Event Deleted Successfully!");
      fetchEvents();
    } catch (err) {
      showToast(`Error: ${err.message || "Failed to delete event"}`);
    }
  };

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", fontFamily: "'Inter', sans-serif", minHeight: "100vh", paddingTop: "120px", display: "flex", flexDirection: "column" }}>

        {/* NAVBAR */}
        <Navbar />

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

        {/* DYNAMIC EDIT / CREATE EVENT MODAL */}
        {isModalOpen && (
          <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(15px)",
            padding: "20px"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #161616 0%, #0c0c0c 100%)",
              border: "1px solid rgba(255, 106, 0, 0.25)",
              borderRadius: "32px",
              padding: "40px",
              maxWidth: "680px",
              width: "100%",
              boxShadow: "0 30px 60px rgba(255, 106, 0, 0.15)",
              position: "relative",
              overflowY: "auto",
              maxHeight: "90vh"
            }}>
              <h3 style={{ fontSize: "24px", fontWeight: "950", textTransform: "uppercase", marginBottom: "24px", letterSpacing: "-0.02em" }}>
                {modalType === "create" ? "CREATE NEW LIVE EVENT" : "EDIT EVENT DETAILS"}
              </h3>

              <form onSubmit={handleSaveEvent} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>EVENT TITLE</label>
                    <input
                      type="text"
                      required
                      value={formFields.title}
                      onChange={e => setFormFields({...formFields, title: e.target.value})}
                      placeholder="e.g. THE SUMMIT LIFT: FINALS"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>EVENT CATEGORY</label>
                    <input
                      type="text"
                      value={formFields.category}
                      onChange={e => setFormFields({...formFields, category: e.target.value})}
                      placeholder="e.g. STRENGTH"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>DESCRIPTION</label>
                  <textarea
                    required
                    value={formFields.description}
                    onChange={e => setFormFields({...formFields, description: e.target.value})}
                    placeholder="Enter event highlights and description..."
                    style={{ width: "100%", height: "80px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none", resize: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>DATE & START TIME</label>
                    <input
                      type="datetime-local"
                      required
                      value={formFields.date}
                      onChange={e => setFormFields({...formFields, date: e.target.value})}
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>LOCATION</label>
                    <input
                      type="text"
                      required
                      value={formFields.location}
                      onChange={e => setFormFields({...formFields, location: e.target.value})}
                      placeholder="e.g. Olympic Hub, CA"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>COMPETITORS SUMMARY</label>
                    <input
                      type="text"
                      value={formFields.competitors}
                      onChange={e => setFormFields({...formFields, competitors: e.target.value})}
                      placeholder="e.g. 12 HEAVYWEIGHT ATHLETES"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>JUDGING OFFICIALS</label>
                    <input
                      type="text"
                      value={formFields.judges}
                      onChange={e => setFormFields({...formFields, judges: e.target.value})}
                      placeholder="e.g. Rogue Official Marshal Team"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>BANNER / THUMBNAIL URL</label>
                    <input
                      type="text"
                      value={formFields.imageUrl}
                      onChange={e => setFormFields({...formFields, imageUrl: e.target.value})}
                      placeholder="https://images.unsplash.com/..."
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>STREAM VIDEO SOURCE URL</label>
                    <input
                      type="text"
                      value={formFields.streamUrl}
                      onChange={e => setFormFields({...formFields, streamUrl: e.target.value})}
                      placeholder="e.g. https://example.com/stream"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>TEASER / PROMO VIDEO URL</label>
                    <input
                      type="text"
                      value={formFields.videoUrl}
                      onChange={e => setFormFields({...formFields, videoUrl: e.target.value})}
                      placeholder="e.g. https://example.com/teaser.mp4"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>EXTERNAL TICKET PURCHASE LINK</label>
                    <input
                      type="text"
                      value={formFields.ticketLink}
                      onChange={e => setFormFields({...formFields, ticketLink: e.target.value})}
                      placeholder="e.g. https://tickets.example.com"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>EVENT SPONSORS (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      value={formFields.sponsors}
                      onChange={e => setFormFields({...formFields, sponsors: e.target.value})}
                      placeholder="e.g. Rogue Fitness, Thorne Nutrition, Red Bull"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>EVENT STATUS OVERRIDE</label>
                    <select
                      value={formFields.status}
                      onChange={e => setFormFields({...formFields, status: e.target.value})}
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none", cursor: "pointer" }}
                    >
                      <option value="upcoming" style={{ background: "#161616" }}>UPCOMING (AUTO DATE CHECKS)</option>
                      <option value="live" style={{ background: "#161616" }}>LIVE NOW</option>
                      <option value="completed" style={{ background: "#161616" }}>COMPLETED</option>
                      <option value="cancelled" style={{ background: "#161616" }}>CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>OFFICIAL EVENT RULES & RULES (NEWLINES OK)</label>
                  <textarea
                    value={formFields.rules}
                    onChange={e => setFormFields({...formFields, rules: e.target.value})}
                    placeholder="Enter official rules or guidelines, one per line..."
                    style={{ width: "100%", height: "80px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none", resize: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      id="isLive"
                      checked={formFields.isLive}
                      onChange={e => setFormFields({...formFields, isLive: e.target.checked})}
                      style={{ accentColor: "#FF6A00", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="isLive" style={{ fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>EVENT IS LIVE NOW</label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={formFields.isPaid}
                      onChange={e => setFormFields({...formFields, isPaid: e.target.checked})}
                      style={{ accentColor: "#FF6A00", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="isPaid" style={{ fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>PAID SPECTATOR PASS</label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formFields.isFeatured}
                      onChange={e => setFormFields({...formFields, isFeatured: e.target.checked})}
                      style={{ accentColor: "#FF6A00", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="isFeatured" style={{ fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>FEATURE ON EVENTS HUB</label>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                  {formFields.isPaid && (
                    <div>
                      <label style={{ display: "block", fontSize: "9px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "4px" }}>TICKET PRICE ($ USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        required={formFields.isPaid}
                        value={formFields.ticketPrice}
                        onChange={e => setFormFields({...formFields, ticketPrice: e.target.value})}
                        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none" }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                  <button
                    type="submit"
                    style={{ flex: 1, background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "16px 36px", fontSize: "13px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer" }}
                  >
                    ⚡ SAVE CONFIGURATION
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: "rgba(255, 255, 255, 0.05)", color: "rgba(255, 255, 255, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "100px", padding: "16px 36px", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", cursor: "pointer" }}
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DYNAMIC PREMIUM EVENT DETAILS POPUP MODAL */}
        {viewingEvent && (
          <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(20px)",
            padding: "20px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingEvent(null);
          }}
          >
            <div style={{
              background: "linear-gradient(135deg, #121212 0%, #070707 100%)",
              border: "1px solid rgba(255, 106, 0, 0.3)",
              borderRadius: "32px",
              padding: "40px",
              maxWidth: "1000px",
              width: "100%",
              boxShadow: "0 30px 80px rgba(255, 106, 0, 0.2)",
              position: "relative",
              overflowY: "auto",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              gap: "28px"
            }}>
              {/* HEADER SECTION WITH CLOSE BUTTON */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
                <div>
                  <span style={{ color: "#FF6A00", fontSize: "11px", fontWeight: "950", letterSpacing: "2px", textTransform: "uppercase" }}>
                    {viewingEvent.category} • {viewingEvent.athletes}
                  </span>
                  <h2 style={{ fontSize: "clamp(24px, 4vw, 42px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.02em", color: "white", marginTop: "4px", marginBottom: "8px" }}>
                    {viewingEvent.title}
                  </h2>
                  {/* Status Pills */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{
                      background: viewingEvent.status === "LIVE" ? "rgba(239, 68, 68, 0.15)" : viewingEvent.status === "CANCELLED" ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 106, 0, 0.15)",
                      border: viewingEvent.status === "LIVE" ? "1px solid rgba(239, 68, 68, 0.4)" : viewingEvent.status === "CANCELLED" ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(255, 106, 0, 0.3)",
                      color: viewingEvent.status === "LIVE" ? "#EF4444" : viewingEvent.status === "CANCELLED" ? "#EF4444" : "#FF6A00",
                      padding: "4px 12px",
                      borderRadius: "100px",
                      fontSize: "10px",
                      fontWeight: "950",
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      {viewingEvent.status === "LIVE" && <span style={{ width: "6px", height: "6px", background: "#EF4444", borderRadius: "50%", animation: "pulse 1s infinite" }}></span>}
                      {viewingEvent.status === "LIVE" ? "LIVE NOW" : viewingEvent.status}
                    </span>
                    {viewingEvent.isPaid ? (
                      <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "4px 12px", borderRadius: "100px", fontSize: "10px", fontWeight: "900" }}>
                        🎫 SPECTATOR PASS REQUIRED - ${viewingEvent.ticketPrice}
                      </span>
                    ) : (
                      <span style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", color: "#22C55E", padding: "4px 12px", borderRadius: "100px", fontSize: "10px", fontWeight: "900" }}>
                        🎉 COMPLIMENTARY ACCESS
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingEvent(null)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    width: "44px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "16px",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                >
                  ✕
                </button>
              </div>

              {/* TWO-COLUMN GRID */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "32px",
                width: "100%"
              }}
              className="event-popup-grid"
              >
                {/* LEFT COLUMN: BANNER, COUNTDOWN, VIDEO */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* BANNER POSTER */}
                  <div style={{
                    position: "relative",
                    width: "100%",
                    height: "220px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                  }}>
                    <img loading="lazy" decoding="async" src={viewingEvent.img} alt={viewingEvent.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }} />
                  </div>

                  {/* COUNTDOWN WIDGET */}
                  <div style={{ width: "100%" }}>
                    <Countdown targetDate={viewingEvent.rawDate} status={viewingEvent.status} />
                  </div>

                  {/* VIDEO PLAYER TRAILER */}
                  <div style={{ width: "100%" }}>
                    <div style={{ fontSize: "11px", fontWeight: "950", color: "#FF6A00", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Play size={12} fill="#FF6A00" /> EVENT TEASER & HIGHLIGHT TRAILER
                    </div>
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255, 106, 0, 0.3)", background: "#000", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
                      <video preload="metadata"
                        src={viewingEvent.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"}
                        controls
                        playsInline
                        webkit-playsinline="true"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: HIGHLIGHTS, DETAILS, RULES, SPONSORS, SHARING & ACTIONS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* DESCRIPTION */}
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: "950", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>EVENT HIGHLIGHTS</div>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: "1.6", margin: 0 }}>
                      {viewingEvent.desc || "No description provided. Experience a legendary showcase of record-breaking skill and power live at Apex World Records!"}
                    </p>
                  </div>

                  {/* SCHEDULING DETAILS CARD */}
                  <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "20px",
                    padding: "20px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px"
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: "950", color: "#FF6A00", textTransform: "uppercase", marginBottom: "4px" }}>
                        <Calendar size={12} /> DATE & TIME
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: "900", color: "white" }}>
                        {new Date(viewingEvent.rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                        {new Date(viewingEvent.rawDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: "950", color: "#FF6A00", textTransform: "uppercase", marginBottom: "4px" }}>
                        <MapPin size={12} /> VENUE LOCATION
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: "900", color: "white" }}>
                        {viewingEvent.location || "Apex Arena Hub"}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                        Official Verified Stage
                      </div>
                    </div>
                  </div>

                  {/* RULES & REGULATION */}
                  {viewingEvent.rules && (
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: "950", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>OFFICIAL RULES & REGULATIONS</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {viewingEvent.rules.split("\n").filter(r => r.trim()).map((rule, idx) => (
                          <div key={idx} style={{ display: "flex", gap: "10px", fontSize: "12px", color: "rgba(255,255,255,0.8)", lineHeight: "1.4" }}>
                            <span style={{ color: "#FF6A00", fontWeight: "950" }}>{idx + 1}.</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EVENT SPONSORS */}
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: "950", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>EVENT SPONSORS</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {viewingEvent.sponsors ? (
                        viewingEvent.sponsors.split(",").map((s, idx) => (
                          <span key={idx} style={{
                            background: "rgba(255, 106, 0, 0.08)",
                            border: "1px solid rgba(255, 106, 0, 0.25)",
                            color: "#FF6A00",
                            padding: "6px 14px",
                            borderRadius: "100px",
                            fontSize: "11px",
                            fontWeight: "800"
                          }}>
                            {s.trim()}
                          </span>
                        ))
                      ) : (
                        ["AWR Gold Club", "Rogue Fitness", "Seiko Timing", "Red Bull"].map((s, idx) => (
                          <span key={idx} style={{
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            color: "rgba(255,255,255,0.6)",
                            padding: "6px 14px",
                            borderRadius: "100px",
                            fontSize: "11px",
                            fontWeight: "800"
                          }}>
                            {s}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* STREAM & PASS BUTTONS */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      {viewingEvent.status === "LIVE" ? (
                        <Link to={`/stream/${viewingEvent.id}`} style={{ textDecoration: "none", flex: 1 }}>
                          <button style={{ width: "100%", background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "16px 28px", fontSize: "13px", fontWeight: "950", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 10px 20px rgba(255,106,0,0.3)" }}>
                            WATCH LIVESTREAM <Play size={14} fill="white" />
                          </button>
                        </Link>
                      ) : viewingEvent.isPaid ? (
                        <a href={viewingEvent.ticketLink || "/shop?category=tickets"} target={viewingEvent.ticketLink ? "_blank" : "_self"} rel="noopener noreferrer" style={{ textDecoration: "none", flex: 1 }}>
                          <button style={{ width: "100%", background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "16px 28px", fontSize: "13px", fontWeight: "950", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 10px 20px rgba(255,106,0,0.3)" }}>
                            SECURE ACCESS TICKET (${viewingEvent.ticketPrice || "49.00"}) <ExternalLink size={14} />
                          </button>
                        </a>
                      ) : (
                        <button disabled style={{ flex: 1, background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#22C55E", borderRadius: "100px", padding: "16px 28px", fontSize: "13px", fontWeight: "950", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          FREE PUBLIC ACCESS PASS ✅
                        </button>
                      )}

                      {/* NOTIFY/REMINDER TOGGLER */}
                      {(viewingEvent.status === "UPCOMING" || viewingEvent.status === "CANCELLED") && (
                        <button
                          onClick={() => toggleReminder(viewingEvent.id)}
                          style={{
                            background: reminders.includes(viewingEvent.id) ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
                            border: reminders.includes(viewingEvent.id) ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(255, 255, 255, 0.15)",
                            color: reminders.includes(viewingEvent.id) ? "#22C55E" : "white",
                            borderRadius: "100px",
                            padding: "16px 24px",
                            fontSize: "12px",
                            fontWeight: "900",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={e => {
                            if (!reminders.includes(viewingEvent.id)) {
                              e.currentTarget.style.background = "rgba(255, 106, 0, 0.1)";
                              e.currentTarget.style.borderColor = "#FF6A00";
                            }
                          }}
                          onMouseLeave={e => {
                            if (!reminders.includes(viewingEvent.id)) {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                            }
                          }}
                        >
                          <Bell size={14} fill={reminders.includes(viewingEvent.id) ? "#22C55E" : "none"} />
                          {reminders.includes(viewingEvent.id) ? "NOTIFY SET ✓" : "NOTIFY ME"}
                        </button>
                      )}
                    </div>

                    {/* SOCIAL NETWORKS SHARING ROW */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
                      <div style={{ fontSize: "10px", fontWeight: "950", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>SHARE SHOWDOWN WITH FRIENDS</div>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {/* Facebook */}
                        <button
                          onClick={() => {
                            const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
                            window.open(fbUrl, "_blank", "width=600,height=400");
                          }}
                          style={{ flex: 1, minWidth: "100px", background: "#1877F2", border: "none", color: "white", padding: "10px 14px", borderRadius: "12px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        >
                          Facebook
                        </button>

                        {/* Twitter */}
                        <button
                          onClick={() => {
                            const tweetText = `AWR Showcase: Check out this dynamic showdown event! ${viewingEvent.title}`;
                            const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(window.location.href)}`;
                            window.open(xUrl, "_blank", "width=600,height=400");
                          }}
                          style={{ flex: 1, minWidth: "100px", background: "#000", border: "1px solid rgba(255,255,255,0.15)", color: "white", padding: "10px 14px", borderRadius: "12px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        >
                          X/Twitter
                        </button>

                        {/* Instagram */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast("📸 Link copied! Share it on your Instagram Story or Bio!");
                          }}
                          style={{ flex: 1, minWidth: "100px", background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)", border: "none", color: "white", padding: "10px 14px", borderRadius: "12px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        >
                          Instagram
                        </button>

                        {/* TikTok */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast("🎵 Link copied! Highlight this event in your TikTok video bio!");
                          }}
                          style={{ flex: 1, minWidth: "100px", background: "#000000", border: "1px solid #00f2fe", color: "white", padding: "10px 14px", borderRadius: "12px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        >
                          TikTok
                        </button>

                        {/* YouTube */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast("🎥 Link copied! Drop the link in your video descriptions!");
                          }}
                          style={{ flex: 1, minWidth: "100px", background: "#FF0000", border: "none", color: "white", padding: "10px 14px", borderRadius: "12px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        >
                          YouTube
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: "60px 5% 60px", flex: 1 }}>

        {/* HEADER */}
        <div style={{ marginBottom: "60px", maxWidth: "1400px", margin: "0 auto 60px" }}>
          <h1 style={{ fontSize: "clamp(40px, 8vw, 80px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.8", marginBottom: "32px" }}>
            <ScrollReveal>LIVE EVENTS</ScrollReveal>
          </h1>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {["LIVE", "UPCOMING", "PAST"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "100px",
                  background: activeTab === tab ? "#FF6A00" : "rgba(255, 255, 255, 0.05)",
                  color: activeTab === tab ? "white" : "rgba(255, 255, 255, 0.5)",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: "900",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "all 0.2s"
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* INLINE ADMIN EVENT CONTROLS */}
        {user && user.isAdmin && (
          <div style={{
            background: "rgba(255, 106, 0, 0.06)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 106, 0, 0.2)",
            borderRadius: "24px",
            padding: "24px 32px",
            marginBottom: "40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1200px",
            width: "100%",
            margin: "0 auto 40px"
          }}>
            <div>
              <h4 style={{ fontSize: "16px", fontWeight: "950", color: "white", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                ⚡ ADMIN EVENT CONTROLS
              </h4>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                Manage live spectator cards, competitors, and livestream schedules instantly from the page.
              </p>
            </div>
            <button
              onClick={() => openModal("create")}
              style={{
                background: "#FF6A00",
                color: "white",
                border: "none",
                borderRadius: "100px",
                padding: "12px 28px",
                fontSize: "12px",
                fontWeight: "900",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 10px 20px rgba(255,106,0,0.2)"
              }}
            >
              <Plus size={16} /> CREATE LIVE EVENT
            </button>
          </div>
        )}

        {/* TICKET SCANNING & VERIFICATION STATION */}
        {user && user.isAdmin && (
          <div style={{
            background: "rgba(20, 20, 20, 0.4)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 106, 0, 0.15)",
            borderRadius: "32px",
            padding: "40px",
            marginBottom: "60px",
            maxWidth: "1200px",
            width: "100%",
            margin: "0 auto 60px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.4)"
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "24px", marginBottom: "32px" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: "950", color: "white", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                  🎟️ TICKET SCANNING & VERIFICATION STATION
                </h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                  Generate attendee passes, simulate high-definition scanner camera laser checks, detect duplicate scans, and verify VIP seating.
                </p>
              </div>
              <div style={{ background: "rgba(255, 106, 0, 0.1)", border: "1px solid rgba(255, 106, 0, 0.3)", color: "#FF6A00", padding: "6px 16px", borderRadius: "100px", fontSize: "11px", fontWeight: "900", letterSpacing: "0.05em" }}>
                🔴 SECURE VERIFICATION MODE
              </div>
            </div>

            {/* Split Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "32px" }}>

              {/* Left Pane: Holographic Laser Scanner Simulator */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Select Attendee Ticket Widget */}
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>SELECT ATTENDEE PASS FOR SIMULATION</label>
                  <select
                    value={selectedAdminTicket ? selectedAdminTicket.id : ""}
                    onChange={e => {
                      const t = adminTickets.find(x => x.id === e.target.value);
                      if (t) setSelectedAdminTicket(t);
                    }}
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px", color: "white", fontSize: "13px", outline: "none", cursor: "pointer" }}
                  >
                    {ticketsLoading ? (
                      <option>Loading passes...</option>
                    ) : (
                      adminTickets.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.user?.name || "Unknown"} ({t.ticketType?.toUpperCase()}) - {t.status?.toUpperCase()}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Simulated Scanner Device viewport */}
                <div style={{
                  position: "relative",
                  height: "260px",
                  background: "#000",
                  borderRadius: "24px",
                  border: "2px solid rgba(255, 106, 0, 0.3)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: scannerActive ? "0 0 30px rgba(255, 106, 0, 0.25)" : "none",
                  transition: "all 0.3s"
                }}>
                  {/* Grid overlay for camera matrix look */}
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "16px 16px", pointerEvents: "none" }} />

                  {/* Corner Targets */}
                  <div style={{ position: "absolute", top: "16px", left: "16px", width: "16px", height: "16px", borderTop: "2px solid #FF6A00", borderLeft: "2px solid #FF6A00" }} />
                  <div style={{ position: "absolute", top: "16px", right: "16px", width: "16px", height: "16px", borderTop: "2px solid #FF6A00", borderRight: "2px solid #FF6A00" }} />
                  <div style={{ position: "absolute", bottom: "16px", left: "16px", width: "16px", height: "16px", borderBottom: "2px solid #FF6A00", borderLeft: "2px solid #FF6A00" }} />
                  <div style={{ position: "absolute", bottom: "16px", right: "16px", width: "16px", height: "16px", borderBottom: "2px solid #FF6A00", borderRight: "2px solid #FF6A00" }} />

                  {/* Interactive Laser Scanning Line */}
                  {scannerActive && (
                    <div style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: "3px",
                      background: "linear-gradient(90deg, transparent, #FF6A00, #ff8c3b, #FF6A00, transparent)",
                      boxShadow: "0 0 15px #FF6A00",
                      animation: "laserMove 1.5s infinite ease-in-out",
                      zIndex: 3
                    }} />
                  )}

                  {/* Visual SVG QR Pass Generator Mockup */}
                  {selectedAdminTicket ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", zIndex: 2, transition: "opacity 0.2s", opacity: scannerActive ? 0.6 : 1 }}>
                      <svg width="120" height="120" viewBox="0 0 120 120" style={{ background: "white", padding: "8px", borderRadius: "12px", boxShadow: "0 10px 20px rgba(0,0,0,0.5)" }}>
                        <rect x="0" y="0" width="30" height="30" fill="black" />
                        <rect x="5" y="5" width="20" height="20" fill="white" />
                        <rect x="10" y="10" width="10" height="10" fill="black" />

                        <rect x="90" y="0" width="30" height="30" fill="black" />
                        <rect x="95" y="5" width="20" height="20" fill="white" />
                        <rect x="100" y="10" width="10" height="10" fill="black" />

                        <rect x="0" y="90" width="30" height="30" fill="black" />
                        <rect x="5" y="95" width="20" height="20" fill="white" />
                        <rect x="10" y="100" width="10" height="10" fill="black" />

                        {Array.from({ length: 12 }).map((_, i) => (
                          <rect
                            key={i}
                            x={40 + (i % 4) * 12}
                            y={40 + Math.floor(i / 4) * 16}
                            width={(selectedAdminTicket.accessCode.charCodeAt(i % selectedAdminTicket.accessCode.length) % 2 === 0) ? "8" : "4"}
                            height={(selectedAdminTicket.accessCode.charCodeAt((i + 2) % selectedAdminTicket.accessCode.length) % 2 === 0) ? "8" : "4"}
                            fill="black"
                          />
                        ))}

                        <rect x="90" y="90" width="15" height="15" fill="black" />
                        <rect x="105" y="105" width="15" height="15" fill="black" />
                      </svg>
                      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", letterSpacing: "1px" }}>
                        {selectedAdminTicket.accessCode}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center" }}>
                      No pass generated.<br />Select a user above.
                    </div>
                  )}
                </div>

                {/* Device Actions */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => handleScanTicket(selectedAdminTicket ? selectedAdminTicket.accessCode : "")}
                    disabled={scannerActive || !selectedAdminTicket}
                    style={{
                      flex: 1,
                      background: "#FF6A00",
                      color: "white",
                      border: "none",
                      borderRadius: "100px",
                      padding: "14px 20px",
                      fontSize: "12px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 10px 20px rgba(255,106,0,0.2)",
                      opacity: (scannerActive || !selectedAdminTicket) ? 0.6 : 1,
                      transition: "transform 0.2s"
                    }}
                    onMouseEnter={e => !scannerActive && (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={e => !scannerActive && (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    {scannerActive ? "SCANNING PASSPORT..." : "⚡ SCAN PRESENTED QR PASS"}
                  </button>

                  {selectedAdminTicket && (
                    <button
                      onClick={() => handleResetTicket(selectedAdminTicket)}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                        borderRadius: "50%",
                        width: "45px",
                        height: "45px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "16px"
                      }}
                      title="Reset scan state for testing duplicate alerts"
                    >
                      🔄
                    </button>
                  )}
                </div>

              </div>

              {/* Right & Center Pane: Scan Verification Engine & Logs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Manual Code entry panel */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value)}
                      placeholder="Paste or type access code (e.g. usr-1-evt-1-98247)"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "100px", padding: "14px 24px", color: "white", fontSize: "13px", outline: "none" }}
                    />
                  </div>
                  <button
                    onClick={() => handleScanTicket(manualCode)}
                    disabled={scannerActive}
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", borderRadius: "100px", padding: "0 28px", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer" }}
                  >
                    VERIFY CODE
                  </button>
                </div>

                {/* Telemetry Counter Widgets */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "16px" }}>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>TOTAL SCANS</div>
                    <div style={{ fontSize: "24px", fontWeight: "950", color: "#FF6A00" }}>{scanTelemetry.totalScanned}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "16px" }}>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>VIP VERIFIED</div>
                    <div style={{ fontSize: "24px", fontWeight: "950", color: "#a855f7" }}>{scanTelemetry.vipVerified}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "16px" }}>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>DUPLICATE BLOCKS</div>
                    <div style={{ fontSize: "24px", fontWeight: "950", color: "#EF4444" }}>{scanTelemetry.duplicateBlocks}</div>
                  </div>
                </div>

                {/* Outcome Display card */}
                <div style={{ minHeight: "130px", display: "flex", alignItems: "stretch" }}>
                  {scanResult ? (
                    <div
                      style={{
                        flex: 1,
                        borderRadius: "20px",
                        padding: "24px",
                        display: "flex",
                        gap: "20px",
                        alignItems: "center",
                        background:
                          scanResult.type === "success" ? "rgba(34, 197, 94, 0.05)" :
                          scanResult.type === "vip" ? "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%)" :
                          scanResult.type === "duplicate" ? "rgba(239, 68, 68, 0.05)" :
                          "rgba(255, 255, 255, 0.03)",
                        border:
                          scanResult.type === "success" ? "1px solid rgba(34, 197, 94, 0.3)" :
                          scanResult.type === "vip" ? "1px solid rgba(168, 85, 247, 0.4)" :
                          scanResult.type === "duplicate" ? "1px solid rgba(239, 68, 68, 0.4)" :
                          "1px solid rgba(255, 255, 255, 0.1)",
                        boxShadow:
                          scanResult.type === "success" ? "0 0 20px rgba(34, 197, 94, 0.1)" :
                          scanResult.type === "vip" ? "0 0 25px rgba(168, 85, 247, 0.2)" :
                          scanResult.type === "duplicate" ? "0 0 20px rgba(239, 68, 68, 0.1)" :
                          "none"
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        background:
                          scanResult.type === "success" ? "rgba(34, 197, 94, 0.15)" :
                          scanResult.type === "vip" ? "rgba(168, 85, 247, 0.25)" :
                          scanResult.type === "duplicate" ? "rgba(239, 68, 68, 0.15)" :
                          "rgba(255, 255, 255, 0.05)",
                        color:
                          scanResult.type === "success" ? "#22C55E" :
                          scanResult.type === "vip" ? "#c084fc" :
                          scanResult.type === "duplicate" ? "#EF4444" :
                          "white"
                      }}>
                        {scanResult.type === "success" && "✓"}
                        {scanResult.type === "vip" && "👑"}
                        {scanResult.type === "duplicate" && "🚫"}
                        {scanResult.type === "error" && "❌"}
                      </div>

                      {/* Metadata */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: "12px",
                          fontWeight: "900",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          color:
                            scanResult.type === "success" ? "#22C55E" :
                            scanResult.type === "vip" ? "#d8b4fe" :
                            scanResult.type === "duplicate" ? "#F87171" :
                            "#9CA3AF",
                          marginBottom: "4px"
                        }}>
                          {scanResult.message}
                        </div>
                        {scanResult.user && (
                          <div style={{ fontSize: "16px", fontWeight: "900", color: "white" }}>
                            {scanResult.user.name} <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: "500" }}>({scanResult.user.email})</span>
                          </div>
                        )}
                        {scanResult.event && (
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px", fontWeight: "600" }}>
                            Event: <span style={{ color: "white" }}>{scanResult.event.title}</span>
                          </div>
                        )}
                        {scanResult.lastScanned && (
                          <div style={{ fontSize: "11px", color: "#EF4444", marginTop: "6px", fontWeight: "700" }}>
                            Original Scan: {new Date(scanResult.lastScanned).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      flex: 1,
                      border: "1px dashed rgba(255,255,255,0.1)",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.25)",
                      fontSize: "13px",
                      fontWeight: "600",
                      textAlign: "center"
                    }}>
                      [ Awaiting device scan input or manual code validation... ]
                    </div>
                  )}
                </div>

                {/* Audit Ledger */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                    LIVE AUDIT LOGS (LAST 5 TRANSACTIONS)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {scanHistoryLogs.length > 0 ? (
                      scanHistoryLogs.map((log) => (
                        <div key={log.id} style={{
                          background: "rgba(255,255,255,0.01)",
                          border: "1px solid rgba(255,255,255,0.03)",
                          borderRadius: "10px",
                          padding: "10px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontWeight: "800", color: "white" }}>{log.name}</span>
                            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{log.code}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontWeight: "700" }}>{log.time}</span>
                            <span style={{
                              fontSize: "9px",
                              fontWeight: "900",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background:
                                log.status.includes("APPROVED") ? "rgba(34, 197, 94, 0.15)" :
                                log.status.includes("DUPLICATE") ? "rgba(239, 68, 68, 0.15)" :
                                "rgba(255,255,255,0.08)",
                              color:
                                log.status.includes("APPROVED") ? "#22C55E" :
                                log.status.includes("DUPLICATE") ? "#EF4444" :
                                "white"
                            }}>
                              {log.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", fontStyle: "italic", textAlign: "center", padding: "16px" }}>
                        No scan transactions logged in this session.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* DYNAMIC EVENTS CONTENT SECTION */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: "1200px", margin: "0 auto 60px", width: "100%" }}
          >
            {/* FEATURED EVENT */}
            {featuredEvent && (
              <div
                onClick={(e) => {
                  if (e.target.closest("button") || e.target.closest("a")) return;
                  setViewingEvent(featuredEvent);
                }}
                style={{
                  position: "relative",
                  width: "100%",
                  height: "550px",
                  borderRadius: "32px",
                  overflow: "hidden",
                  marginBottom: "60px",
                  boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  transition: "all 0.3s ease-in-out"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 106, 0, 0.5)";
                  e.currentTarget.style.boxShadow = "0 40px 80px rgba(255, 106, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.boxShadow = "0 40px 80px rgba(0,0,0,0.5)";
                }}
              >
                <img loading="lazy" decoding="async" src={featuredEvent.img} alt={featuredEvent.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.65)" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 60%)" }}></div>

                {/* Status Badge */}
                <div style={{ position: "absolute", left: "32px", top: "32px" }}>
                  <div style={{
                    background: featuredEvent.status === "LIVE" ? "rgba(255, 106, 0, 0.15)" : "rgba(255, 255, 255, 0.08)",
                    border: featuredEvent.status === "LIVE" ? "1px solid rgba(255, 106, 0, 0.3)" : "1px solid rgba(255, 255, 255, 0.15)",
                    color: featuredEvent.status === "LIVE" ? "#FF6A00" : "white",
                    padding: "8px 20px",
                    borderRadius: "100px",
                    fontWeight: "900",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backdropFilter: "blur(10px)",
                    textTransform: "uppercase"
                  }}>
                    {featuredEvent.status === "LIVE" && (
                      <div style={{ width: "8px", height: "8px", background: "#FF6A00", borderRadius: "50%", animation: "pulse 1s infinite" }}></div>
                    )}
                    {featuredEvent.status === "LIVE" ? "LIVE NOW" : `${featuredEvent.status} EVENT`}
                  </div>
                </div>

                {/* Top Right stats */}
                <div style={{ position: "absolute", right: "32px", top: "32px", textAlign: "right" }}>
                  {featuredEvent.status === "LIVE" ? (
                    <>
                      <div style={{ fontSize: "9px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.1em" }}>VIEWERS</div>
                      <div style={{ fontSize: "20px", fontWeight: "950", color: "white" }}>{featuredEvent.viewers || "10K+"}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: "9px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.1em" }}>WHEN</div>
                      <div style={{ fontSize: "14px", fontWeight: "900", color: "white" }}>{featuredEvent.time}</div>
                    </>
                  )}
                </div>

                {/* Content bottom */}
                <div style={{ position: "absolute", left: "48px", bottom: "48px", right: "48px" }}>
                  <div style={{ color: "#FF6A00", fontSize: "11px", fontWeight: "900", letterSpacing: "0.15em", marginBottom: "12px", textTransform: "uppercase" }}>
                    {featuredEvent.category} • {featuredEvent.athletes}
                  </div>
                  <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: "950", textTransform: "uppercase", lineHeight: "1.0", marginBottom: "20px", letterSpacing: "-0.03em" }}>
                    {featuredEvent.title}
                  </h2>
                  {featuredEvent.desc && (
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", maxWidth: "600px", marginBottom: "24px" }}>
                      {featuredEvent.desc}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    {featuredEvent.status === "LIVE" ? (
                      <div style={{ display: "flex", gap: "12px" }}>
                        <Link to={`/stream/${featuredEvent.id}`} style={{ textDecoration: "none" }}>
                          <button style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "16px 36px", fontSize: "13px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 20px 40px rgba(255, 106, 0, 0.3)", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                            WATCH STREAM <Play size={16} fill="white" />
                          </button>
                        </Link>
                        <button
                          onClick={() => setViewingEvent(featuredEvent)}
                          style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "white", borderRadius: "100px", padding: "16px 36px", fontSize: "13px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                        >
                          READ MORE <Info size={16} />
                        </button>
                      </div>
                    ) : featuredEvent.status === "UPCOMING" || featuredEvent.status === "CANCELLED" ? (
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={() => setViewingEvent(featuredEvent)}
                          style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "16px 36px", fontSize: "13px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 20px 40px rgba(255, 106, 0, 0.3)" }}
                        >
                          WATCH PROMO <Play size={16} fill="white" />
                        </button>
                        <button
                          onClick={() => setViewingEvent(featuredEvent)}
                          style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "white", borderRadius: "100px", padding: "16px 36px", fontSize: "13px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                        >
                          READ MORE <Info size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setViewingEvent(featuredEvent)}
                        style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "white", borderRadius: "100px", padding: "16px 36px", fontSize: "13px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                      >
                        VIEW RECAP / DETAILS <Info size={16} />
                      </button>
                    )}

                    {/* ADMIN ACTION TOGGLES FOR FEATURED */}
                    {user && user.isAdmin && dbEvents.length > 0 && (
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={() => openModal("edit", featuredEvent)}
                          style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "100px", padding: "14px 28px", fontSize: "12px", fontWeight: "900", color: "white", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                        >
                          <Edit3 size={14} /> EDIT EVENT
                        </button>
                        <button
                          onClick={() => handleDelete(featuredEvent.id)}
                          style={{ background: "rgba(239, 68, 68, 0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "100px", padding: "14px 28px", fontSize: "12px", fontWeight: "900", color: "#EF4444", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                        >
                          <Trash2 size={14} /> DELETE
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* OTHERS LIST / GRID */}
            {otherEvents.length > 0 ? (
              <div>
                <h3 style={{ fontSize: "24px", fontWeight: "950", textTransform: "uppercase", marginBottom: "28px", letterSpacing: "-0.02em" }}>
                  MORE {activeTab} BATTLES
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
                  {otherEvents.map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        if (e.target.closest("button") || e.target.closest("a")) return;
                        setViewingEvent(item);
                      }}
                      style={{
                        position: "relative",
                        borderRadius: "24px",
                        overflow: "hidden",
                        height: "260px",
                        border: "1px solid rgba(255,255,255,0.05)",
                        cursor: "pointer",
                        transition: "all 0.3s ease-in-out"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 106, 0, 0.6)";
                        e.currentTarget.style.boxShadow = "0 10px 30px rgba(255, 106, 0, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <img loading="lazy" decoding="async" src={item.img} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95), transparent 70%)" }} />

                      {/* ADMIN ROW CONTROL DOTS ON OTHER CARDS */}
                      {user && user.isAdmin && dbEvents.length > 0 && (
                        <div style={{ position: "absolute", top: "16px", right: "16px", display: "flex", gap: "8px", zIndex: 10 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal("edit", item);
                            }}
                            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            style={{ background: "rgba(239,68,68,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#EF4444" }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}

                      <div style={{ position: "absolute", left: "24px", bottom: "24px", right: "24px" }}>
                        <div style={{ color: "#FF6A00", fontSize: "10px", fontWeight: "900", marginBottom: "8px", textTransform: "uppercase" }}>
                          {item.category}
                        </div>
                        <h4 style={{ fontSize: "20px", fontWeight: "950", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </h4>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                          <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: "700" }}>
                            <span>{item.time}</span>
                            <span>•</span>
                            <span>{item.athletes}</span>
                          </div>
                          {item.status === "LIVE" ? (
                            <Link to={`/stream/${item.id}`} style={{ textDecoration: "none" }}>
                              <button style={{ background: "#FF6A00", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}>
                                <Play size={14} fill="white" style={{ marginLeft: "2px" }} />
                              </button>
                            </Link>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingEvent(item);
                              }}
                              style={{
                                background: "rgba(255, 106, 0, 0.1)",
                                border: "1px solid rgba(255, 106, 0, 0.3)",
                                borderRadius: "100px",
                                padding: "6px 14px",
                                fontSize: "9px",
                                fontWeight: "950",
                                color: "#FF6A00",
                                cursor: "pointer",
                                textTransform: "uppercase",
                                transition: "all 0.2s"
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = "#FF6A00";
                                e.currentTarget.style.color = "white";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = "rgba(255, 106, 0, 0.1)";
                                e.currentTarget.style.color = "#FF6A00";
                              }}
                            >
                              READ MORE
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !featuredEvent ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.4)" }}>
                <Activity size={48} style={{ marginBottom: "20px", opacity: 0.5, color: "#FF6A00" }} />
                <h3 style={{ fontSize: "20px", fontWeight: "800", textTransform: "uppercase" }}>NO {activeTab} EVENTS</h3>
                <p style={{ fontSize: "14px", marginTop: "8px" }}>Check back later for fresh and exciting world record showdowns!</p>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {/* BOTTOM SECTION */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", width: "100%" }}>
          {/* TREND CHART */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", padding: "40px", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>EVENT RECORD TREND</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: "900", color: "#FF6A00" }}>
                <Activity size={14} /> +12.4% YEARLY GROWTH
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", height: "160px", marginBottom: "32px", position: "relative" }}>
               {/* Vertical grid lines */}
               <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "space-between", pointerEvents: "none", opacity: 0.1 }}>
                 {[1,2,3,4,5,6].map(i => <div key={i} style={{ width: "1px", height: "100%", background: "white" }} />)}
               </div>

               {[30, 45, 35, 55, 40, 95, 65].map((h, idx) => (
                <div key={idx} style={{ flex: 1, position: "relative" }}>
                   <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    style={{
                      background: idx === 5 ? "linear-gradient(to top, #FF6A00, #FF8C3B)" : "rgba(255,255,255,0.05)",
                      borderRadius: "8px 8px 0 0",
                      width: "100%",
                      boxShadow: idx === 5 ? "0 0 30px rgba(255, 106, 0, 0.4)" : "none"
                    }}
                   />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.2)", fontSize: "10px", fontWeight: "900" }}>
              <span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span style={{ color: "rgba(255,255,255,0.4)" }}>AUG (NOW)</span><span>OCT</span><span>DEC</span>
            </div>
          </div>

          {/* SPECTATOR PASS CARD */}
          <div style={{
            background: "linear-gradient(135deg, #FF6A00 0%, #FF8C3B 100%)",
            borderRadius: "32px",
            padding: "48px",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 30px 60px rgba(255, 106, 0, 0.3)"
          }}>
            <div style={{ position: "absolute", right: "-20px", top: "-20px", opacity: 0.1 }}>
              <Zap size={200} fill="white" />
            </div>
            <h4 style={{ fontSize: "40px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px", lineHeight: "1", position: "relative", zIndex: 2 }}>SPECTATOR <br /> PASS</h4>
            <p style={{ fontSize: "15px", fontWeight: "600", color: "rgba(255,255,255,0.9)", lineHeight: "1.6", marginBottom: "40px", maxWidth: "320px", position: "relative", zIndex: 2 }}>
              Live events are spectator and ticketed events between contestants already selected. Secure your seat to witness history.
            </p>
            <Link to="/shop?category=tickets" style={{ textDecoration: "none", width: "fit-content", position: "relative", zIndex: 2 }}>
              <button style={{ background: "#000", color: "white", border: "none", borderRadius: "100px", padding: "18px 40px", fontSize: "13px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                Purchase Your Ticket Now <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .event-popup-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateY(-20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes laserMove {
            0% { top: 0%; }
            50% { top: 98%; }
            100% { top: 0%; }
          }
        `}</style>

    </div>
    <Footer />
    </div>
    </PageTransition>
  );
};

export default Events;
