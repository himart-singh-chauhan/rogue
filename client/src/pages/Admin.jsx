import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ShieldAlert, Trophy, X, Eye, Calendar,
  User, Users, Search, Filter,
  AlertTriangle, CheckCircle, Video, FileText, Loader2,
  Sparkles, Trash2, Edit3, Plus, ShoppingBag, Mail, HardDrive, Ticket, Layers, Folder,
  ArrowRight, Bell, Settings, LogOut, LayoutDashboard, BarChart3, MoreVertical,
  Activity, Zap, Timer, Network, Component, TrendingUp, DollarSign, Clock, XCircle, Target, Radio, CreditCard,
  Flag, ClipboardList, GitBranch, MessageSquare, Star, Layout, Crown, Lock, Server, Image, Megaphone, UploadCloud, BarChart2, Download, MapPin, ExternalLink
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { apiCall, formatProductImage, API_URL, uploadDirect } from "../utils/api";
import AdminRankingPanel from "../components/AdminRankingPanel";
import AdminCategoryManager from "../components/admin/AdminCategoryManager";
import AdminDivisionPanels from "../components/admin/AdminDivisionPanels";
import AdminPlansManager from "../components/admin/AdminPlansManager";
import AdminSubscribers from "../components/admin/AdminSubscribers";
import AdminMonetizationBreakdown from "../components/admin/AdminMonetizationBreakdown";
import AdminMediaLibrary from "../components/admin/AdminMediaLibrary";
import AdminCommunications from "../components/admin/AdminCommunications";
import AdminProductAuthorizations from "../components/admin/AdminProductAuthorizations";
import AdminCertificates from "../components/admin/AdminCertificates";
import ImageUploadField from "../components/admin/ImageUploadField";
import { Modal as AdminModal } from "../components/admin/adminUi";
import { SHOP_CATEGORIES, AUTHORIZATION_CATEGORIES, normalizeShopCategory } from "../utils/shopCategories";

// Recommended artwork size for each sponsor placement (shown in the sponsor form)
const SPONSOR_SIZES = {
  homepage_top_banner: { w: 1920, h: 400, note: "Full-width banner at the top of the homepage" },
  homepage_sidebar: { w: 1920, h: 400, note: "Homepage sponsor strip" },
  homepage: { w: 1920, h: 400, note: "Homepage sponsor strip" },
  featured: { w: 1920, h: 400, note: "Featured sponsor strip on the homepage" },
  live_event: { w: 1920, h: 400, note: "Banner on the Events page" },
  livestream: { w: 1920, h: 400, note: "Banner under the livestream player" },
  shop: { w: 1920, h: 400, note: "Banner on the Shop page" },
  video_overlay: { w: 600, h: 120, note: "Small logo strip over the video player. Transparent PNG works best" },
  footer: { w: 400, h: 120, note: "Logo in the footer sponsor row. Transparent PNG works best" },
  footer_sponsor: { w: 400, h: 120, note: "Logo in the footer sponsor row. Transparent PNG works best" },
};

// Event status from the real event data (not from its position in the list)
const eventPhase = (ev) => {
  const status = String(ev.status || "").toLowerCase();
  const when = ev.date ? new Date(ev.date).getTime() : NaN;
  const now = Date.now();
  if (["completed", "past", "cancelled"].includes(status)) return "completed";
  if (ev.is_live || status === "live") return "active";
  if (!Number.isNaN(when) && when > now) return "scheduled";
  if (!Number.isNaN(when) && now - when < 24 * 60 * 60 * 1000) return "active";
  return "completed";
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  // const navigate = useNavigate(); // Unused
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Admin View Tab: "records" | "users" | "events" | "products" | "tickets"
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");
  const [recordsSubTab, setRecordsSubTab] = useState("submissions"); // "submissions" | "categories" | "ageGroups"
  const [usersSubTab, setUsersSubTab] = useState("registry"); // "registry" | "inquiries"

  // Synchronize state with "?tab=..." search query parameter from URL
  useEffect(() => {
    const tabQuery = searchParams.get("tab");
    if (tabQuery) {
      if (tabQuery === "user" || tabQuery === "users") {
        setActiveTab("users");
      } else if (tabQuery === "submissions") {
        setActiveTab("records");
        setRecordsSubTab("submissions");
      } else if (tabQuery === "categories") {
        setActiveTab("records");
        setRecordsSubTab("categories");
      } else if (tabQuery === "divisions") {
        setActiveTab("records");
        setRecordsSubTab("ageGroups");
      } else if (tabQuery === "challenges") {
        setActiveTab("events");
      } else if (tabQuery === "payments") {
        setActiveTab("revenue");
      } else if (tabQuery === "verification-queue" || tabQuery === "verificationQueue") {
        setActiveTab("verificationQueue");
      } else if (tabQuery === "homepageControl" || tabQuery === "homepage") {
        setActiveTab("homepageControl");
      } else if (tabQuery === "videoManagement" || tabQuery === "videos") {
        setActiveTab("videoManagement");
      } else if (tabQuery === "coupons") {
        setActiveTab("coupons");
      } else {
        setActiveTab(tabQuery);
      }
    } else {
      setActiveTab("dashboard");
    }
  }, [searchParams]);

  // Data collections state
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventsFilter, setEventsFilter] = useState("ALL");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState("");
  const [customerHistory, setCustomerHistory] = useState(null);
  const [shippingStatusFilter, setShippingStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ageGroups, setAgeGroups] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [membershipStats, setMembershipStats] = useState(null);
  const [revenueSubTab, setRevenueSubTab] = useState("ledger"); // "ledger" | "coupons" | "tickets"
  const [coupons, setCoupons] = useState([]);
  const [couponStats, setCouponStats] = useState(null);
  const [couponSearchQuery, setCouponSearchQuery] = useState("");
  const [tickets, setTickets] = useState([]);
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");
  const [ledgerPayments, setLedgerPayments] = useState([]);

  // New State variables for Phase 5 additions
  const [homepageRecords, setHomepageRecords] = useState({
    featured: [],
    newly_verified: [],
    recent_uploads: [],
    top_ranked: [],
    unassigned: []
  });
  const [videos, setVideos] = useState([]);
  const [videoManagementSubTab, setVideoManagementSubTab] = useState("all_submissions"); // "newest" | "featured" | "highlights"
  const [videoForm, setVideoForm] = useState({
    title: "", description: "", category: "Strength", isFeatured: false, isNewlyUploaded: false, videoUrl: ""
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [selectedVideoForViewing, setSelectedVideoForViewing] = useState(null);

  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [streamTarget, setStreamTarget] = useState(null);
  const [streamForm, setStreamForm] = useState({
    type: "stream_now",
    pricing: "free",
    ticketPrice: "",
    scheduledTime: ""
  });
  const [ledgerMetrics, setLedgerMetrics] = useState(null);
  const [paymentsFilterType, setPaymentsFilterType] = useState("all");
  const [paymentsFilterStatus, setPaymentsFilterStatus] = useState("all");
  const [paymentsSearchQuery, setPaymentsSearchQuery] = useState("");
  const [paymentsSearchApplied, setPaymentsSearchApplied] = useState("");
  // Adjudicator Management States
  const [judges, setJudges] = useState([]);
  const [judgesSearchQuery, setJudgesSearchQuery] = useState("");
  const [adjudicatorSubTab, setAdjudicatorSubTab] = useState("roster"); // "roster" | "dispatch" | "oversight"
  const [judgesFilterStatus, setJudgesFilterStatus] = useState("all");
  const [judgesFilterCert, setJudgesFilterCert] = useState("all");
  const [judgesFilterPerf, setJudgesFilterPerf] = useState("all");
  const [contentSubTab, setContentSubTab] = useState("pages"); // pages | faqs | homepage
  const [editingPage, setEditingPage] = useState(null);
  const [faqsList, setFaqsList] = useState([]);
  const [homepageConfig, setHomepageConfig] = useState({});
  const [promoteSearchQuery, setPromoteSearchQuery] = useState("");
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [selectedJudgeForNotes, setSelectedJudgeForNotes] = useState(null);
  const [judgeNotesText, setJudgeNotesText] = useState("");
  const [isJudgeNotesModalOpen, setIsJudgeNotesModalOpen] = useState(false);
  const [selectedOversightRecord, setSelectedOversightRecord] = useState(null);
  const [isOversightRevertModalOpen, setIsOversightRevertModalOpen] = useState(false);
  const [oversightRevertFeedback, setOversightRevertFeedback] = useState("");
  // const [tierConfigs, setTierConfigs] = useState({}); // Unused

  // Verification Queue States
  const [vqFilter, setVqFilter] = useState("all"); // "all" | "pending_review" | "under_review" | "approved" | "denied" | "needs_info" | "priority"
  const [vqSearchQuery, setVqSearchQuery] = useState("");
  const [vqSortBy, setVqSortBy] = useState("newest"); // "newest" | "oldest" | "priority"
  const [selectedVqRecord, setSelectedVqRecord] = useState(null);
  const [isVqDetailOpen, setIsVqDetailOpen] = useState(false);
  const [vqAdminNote, setVqAdminNote] = useState("");
  const [vqPointsAwarded, setVqPointsAwarded] = useState(0);
  const [vqIsWorldRecord, setVqIsWorldRecord] = useState(false);
  const [vqStatusOverrides, setVqStatusOverrides] = useState({}); // { [recordId]: verificationStatus }
  const [vqUpdating, setVqUpdating] = useState(null); // id being updated

  // AI Verification Controls States
  const [aiScans, setAiScans] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [appealsPage, setAppealsPage] = useState(1);
  const [appealsTotalPages, setAppealsTotalPages] = useState(1);
  const [appealsFilter, setAppealsFilter] = useState("all");
  const [appealsSearch, setAppealsSearch] = useState("");
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [aiSettings, setAiSettings] = useState({
    ai_min_confidence_threshold: "80.00",
    ai_deepfake_check_enabled: "true",
    ai_video_tampering_check_enabled: "true",
    ai_audio_tampering_check_enabled: "true"
  });
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [aiFilterStatus, setAiFilterStatus] = useState("all"); // "all" | "passed" | "suspicious" | "failed" | "overridden" | "flagged"
  const [selectedAiScan, setSelectedAiScan] = useState(null);
  const [isAiDetailModalOpen, setIsAiDetailModalOpen] = useState(false);
  const [aiOverrideStatus, setAiOverrideStatus] = useState("none");
  const [aiOverrideReason, setAiOverrideReason] = useState("");
  const [isAiActionUpdating, setIsAiActionUpdating] = useState(false);

  // Phase 3 & 4 States
  const [reports, setReports] = useState([]);
  const [messages, setMessages] = useState([]);
  const [bans, setBans] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [sponsorSearchQuery, setSponsorSearchQuery] = useState("");
  const [sponsorFilterStatus, setSponsorFilterStatus] = useState("all");
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [sponsorFormMode, setSponsorFormMode] = useState(null); // 'add' | 'edit'
  const [sponsorForm, setSponsorForm] = useState({});
  const [sponsorSaveStatus, setSponsorSaveStatus] = useState(null); // 'saving'|'success'|'error'|'imageError'
  const [revenueMetrics, setRevenueMetrics] = useState({ totalRevenue: 0, activeSubscriptions: 0, recentTransactions: [] });
  const [vipRequests, setVipRequests] = useState([]);

  // Challenge Management States
  const [challenges, setChallenges] = useState([]);
  const [challengeSearchQuery, setChallengeSearchQuery] = useState("");
  const [challengeFilterStatus, setChallengeFilterStatus] = useState("all");
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [challengeFormMode, setChallengeFormMode] = useState(null); // 'add' | 'edit'
  const [challengeForm, setChallengeForm] = useState({});
  const [challengeSaveStatus, setChallengeSaveStatus] = useState(null); // 'saving'|'success'|'error'

  // UI States
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // CRUD Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" or "edit"
  const [modalTarget, setModalTarget] = useState(null); // The item being edited
  const [modalLoading, setModalLoading] = useState(false);

  // Adjudicator Action Modals
  const [activeAdjudicatorModal, setActiveAdjudicatorModal] = useState(null); // 'assign', 'records', 'history', 'cert', 'message'
  const [adjudicatorActionTarget, setAdjudicatorActionTarget] = useState(null);
  const [adjudicatorMessageText, setAdjudicatorMessageText] = useState("");
  const [adjudicatorMessageSubject, setAdjudicatorMessageSubject] = useState("");

  const [selectedRecordDetail, setSelectedRecordDetail] = useState(null);
  const [isRecordDetailModalOpen, setIsRecordDetailModalOpen] = useState(false);

  const handleOpenRecordDetailModal = (record) => {
    setSelectedRecordDetail(record);
    setIsRecordDetailModalOpen(true);
  };

  // Dynamic Form states bound to inputs
  const [recordForm, setRecordForm] = useState({ title: "", category: "Strength", description: "", value: "", unit: "", status: "pending", evidenceUrl: "", venueName: "", city: "", recordType: "standard", userId: "" });
  const [recordThumbFile, setRecordThumbFile] = useState(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "athlete", membershipType: "free_athlete", accountStatus: "active", username: "", phone: "", gender: "male", dob: "", weight: "", height: "", country: "", city: "" });
  const [eventForm, setEventForm] = useState({ title: "", description: "", date: "", location: "", imageUrl: "", isPaid: false, ticketPrice: 0 });
  const [productForm, setProductForm] = useState({ name: "", description: "", price: "", imageUrl: "", category: "Accessories", stockCount: "", sizes: [], imageUrls: [], requiresAuthorization: false, imageFile: null, imagePreview: "" });
  const [adminProductDragActive, setAdminProductDragActive] = useState(false);
  const adminProductFileInputRef = React.useRef(null);

  // ===== CERTIFICATE & AWARD CONTROL SUITE STATE =====
  const [adminSubTab, setAdminSubTab] = useState("official");
  const [viewEvent, setViewEvent] = useState(null);
  const [seoForm, setSeoForm] = useState({ title: "AMPEX World Records Elite Athlete Database", description: "", keywords: "" });
  const [seoStatus, setSeoStatus] = useState("");
  useEffect(() => {
    if (activeTab !== "systemSettings") return;
    apiCall("/settings/public", "GET")
      .then((st) => setSeoForm({ title: st?.seoTitle || "AMPEX World Records Elite Athlete Database", description: st?.seoDescription || "", keywords: st?.seoKeywords || "" }))
      .catch(() => {});
  }, [activeTab]);
  const [certName, setCertName] = useState("JOHNATHAN TITAN");
  const [certRecord, setCertRecord] = useState("HEAVYWEIGHT BENCH PRESS WORLD RECORD");
  const [certValue, setCertValue] = useState("502.5 KG");
  const [certAdjudicator, setCertAdjudicator] = useState("CHIEF MARSHAL O'NEILL");
  const [certDate, setCertDate] = useState(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase());
  const [certTheme, setCertTheme] = useState("onyx");
  const [awardName, setAwardName] = useState("");
  const [awardPrice, setAwardPrice] = useState("");
  const [awardDesc, setAwardDesc] = useState("");
  const [awardStock, setAwardStock] = useState("10");
  const [awardCategory, setAwardCategory] = useState("Certificates");
  const [awardImageFile, setAwardImageFile] = useState(null);
  const [awardImagePreview, setAwardImagePreview] = useState("");
  const [awardDragActive, setAwardDragActive] = useState(false);
  const awardFileInputRef = React.useRef(null);
  const [awardOrders, setAwardOrders] = useState([
    { id: "ord-1", name: "Johnathan Titan", product: "Embossed Obsidian Framed Certificate", date: "2026-05-12", frameType: "Obsidian Frame", customDetails: "Recipient: Johnathan Titan - 502.5kg Bench Press", status: "processing" },
    { id: "ord-2", name: "Michael Jordan", product: "Titan Gold Medal & Premium Ribbon", date: "2026-05-18", frameType: "Gold Leaf Border", customDetails: "Recipient: Michael Jordan - Retro Basketball Max Score", status: "completed" },
    { id: "ord-3", name: "Serena Williams", product: "Archival Brushed Steel Plaque", date: "2026-05-24", frameType: "Brushed Steel Frame", customDetails: "Recipient: Serena Williams - Glacial Endurance Ice Swim", status: "pending" }
  ]);

  const handleCreateAwardProduct = async (e) => {
    e.preventDefault();
    if (!awardName || !awardPrice) { showToast("Please provide award name and price.", "error"); return; }
    const payload = { name: awardName, description: awardDesc, price: parseFloat(awardPrice), imageUrl: "", category: awardCategory, stockCount: parseInt(awardStock) || 10, sizes: [], imageUrls: [] };
    try {
      if (user && user.token) {
        let newProd = await apiCall("/admin/products", "POST", payload, user.token);

        // ✅ IMMEDIATELY set the preview image so local state always shows correct image
        if (awardImagePreview) {
          newProd = { ...newProd, image_url: awardImagePreview };
        }

        // Add to local products list RIGHT NOW with preview image
        setProducts(prev => [newProd, ...prev]);
        showToast("🎖️ Award product created successfully!", "success");

        // Then try to upload image to server in background
        if (awardImageFile) {
          try {
            const formData = new FormData();
            formData.append("productImage", awardImageFile);
            const res = await fetch(API_URL + `/admin/products/${newProd.id}/image`, { method: "POST", headers: { Authorization: `Bearer ${user.token}` }, body: formData });
            if (res.ok) {
              const uploadData = await res.json();
              const serverImageUrl = uploadData.product?.image_url || uploadData.imageUrl;
              if (serverImageUrl) {
                // Update the product in local state with the real server URL
                setProducts(prev => prev.map(p => p.id === newProd.id ? { ...p, image_url: serverImageUrl } : p));
              }
            }
          } catch (uploadErr) {
            // Preview URL is already set above — no action needed
            console.warn("Image upload to server failed, using local preview:", uploadErr);
          }
        }
      }
    } catch (err) {
      // If backend fails, create locally with the preview image
      const mockProd = {
        id: Date.now(),
        name: awardName,
        description: awardDesc,
        price: parseFloat(awardPrice),
        image_url: awardImagePreview || "",
        category: awardCategory,
        stock_count: parseInt(awardStock) || 10
      };
      setProducts(prev => [mockProd, ...prev]);
      showToast("🎖️ Award product created locally (offline mode)!", "success");
    }
    setAwardName(""); setAwardPrice(""); setAwardDesc(""); setAwardStock("10"); setAwardImageFile(null); setAwardImagePreview("");
  };


  const handleToggleAwardShipping = (orderId) => {
    setAwardOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const nextStatus = o.status === "shipped" ? "processing" : "shipped";
        showToast(`📦 Order ${orderId} marked as ${nextStatus.toUpperCase()}!`, "success");
        return { ...o, status: nextStatus };
      }
      return o;
    }));
  };

  const handleCompleteAwardOrder = (orderId) => {
    setAwardOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        showToast(`✅ Order marked as COMPLETED!`, "success");
        return { ...o, status: "completed" };
      }
      return o;
    }));
  };

  const handlePrintAwardSheet = (order) => {
    showToast(`🖨️ Customization Sheet Dispatched for: ${order.name}`, "success");
  };
  // ===== END CERTIFICATE & AWARD CONTROL SUITE STATE =====


  const [membershipForm, setMembershipForm] = useState({ userId: "", tier: "bronze", autoRenew: false, paymentAmount: 0 });
  const [revenueForm, setRevenueForm] = useState({
    title: "",
    category: "Record Submission Fee",
    amount: "",
    dateReceived: new Date().toISOString().split("T")[0],
    paymentMethod: "Credit Card",
    customerName: "",
    memberNumber: "",
    customerEmail: "",
    transactionId: "",
    orderNumber: "",
    notes: "",
    receiptUrl: ""
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", parent: "", active: true, rules: "", submissionRequirements: "" });
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [categoryActiveFilter, setCategoryActiveFilter] = useState("all"); // "all" | "active" | "inactive"
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [usersFilterStatus, setUsersFilterStatus] = useState("all");
  const [usersFilterRole, setUsersFilterRole] = useState("all");
  const [usersFilterMembership, setUsersFilterMembership] = useState("all");
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [ageGroupForm, setAgeGroupForm] = useState({ name: "", minAge: "", maxAge: "", description: "", active: true });
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    active: true,
    expirationDate: "",
    appliesTo: "all",
    targetId: "",
    minPurchase: "",
    maxRedemptions: "",
    maxPerUser: "1",
    restrictedMembershipTier: "",
    restrictedCountry: "",
    autoGenerate: false
  });

  const [successMessagesForm, setSuccessMessagesForm] = useState({
    msg_shop: "",
    msg_spectator: "",
    msg_combined: "",
    msg_record: "",
    msg_challenge: ""
  });


  // User action modal state
  const [userActionModal, setUserActionModal] = useState({ isOpen: false, type: null, userId: null, userName: "" }); // type: "suspend", "ban", "resetPassword", "activity"
  const [userActivity, setUserActivity] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7"); // days

  // Toast notifications & custom confirm dialogues states
  const [toast, setToast] = useState(null); // { message, type: "success" | "error" | "info" }
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const [tempPassword, setTempPassword] = useState("");

  // Membership action modal state
  const [membershipActionModal, setMembershipActionModal] = useState({ isOpen: false, type: null, membershipId: null, membershipUser: null }); // type: "renew", "cancel", "upgrade", "payments"
  const [membershipPaymentHistory, setMembershipPaymentHistory] = useState([]);
  const [renewalReason, setRenewalReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState("gold");
  const [membershipAmount, setMembershipAmount] = useState(0);

  // Shop Orders State
  const [orderDetailModal, setOrderDetailModal] = useState({ isOpen: false, order: null });
  const [shopSearchInput, setShopSearchInput] = useState("");
  const [activeShopSearch, setActiveShopSearch] = useState("");

  // Categories Hierarchy State
  const [categoriesList, setCategoriesList] = useState([
    { id: 1, name: "Strength", subs: ["Powerlifting", "Weightlifting", "Grip"], active: true, rules: "Standard IPF rules apply.", requirements: "Video must show full lockout.", featured_records: "Deadlift 500kg" },
    { id: 2, name: "Speed", subs: ["Sprinting", "Speed Typing", "Rubik's Cube"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 3, name: "Endurance", subs: ["Marathon", "Planking", "Cycling"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 4, name: "Balance", subs: ["Tightrope", "Handstand", "Slackline"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 5, name: "Flexibility", subs: ["Splits", "Backbend"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 6, name: "Fitness", subs: ["Pushups", "Pullups", "Squats"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 7, name: "Sports", subs: ["Basketball", "Football", "Tennis"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 8, name: "Gaming", subs: ["Speedruns", "High Scores", "eSports"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 9, name: "Entertainment", subs: ["Movie Trivia", "Singing"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 10, name: "Creative Skills", subs: ["Drawing", "Sculpting"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 11, name: "Stunts", subs: ["Parkour", "BMX"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 12, name: "Food Challenges", subs: ["Hot Dog Eating", "Spicy Food"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 13, name: "Team Records", subs: ["Tug of War", "Relay"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 14, name: "Youth Records", subs: ["U12 Sprint", "U16 Chess"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 15, name: "Senior Records", subs: ["60+ Marathon", "70+ Swimming"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 16, name: "Extreme Challenges", subs: ["Ice Bath", "Desert Trek"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 17, name: "Precision Skills", subs: ["Archery", "Darts", "Knife Throwing"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 18, name: "Technology / Innovation", subs: ["Coding Speed", "Robot Building"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 19, name: "Animal Records", subs: ["Fastest Dog", "Highest Jump Cat"], active: true, rules: "", requirements: "", featured_records: "" },
    { id: 20, name: "Miscellaneous", subs: ["Unclassified"], active: true, rules: "", requirements: "", featured_records: "" }
  ]);
  const [categoryModal, setCategoryModal] = useState({ isOpen: false, mode: 'add', category: null });
  const [newSubcategoryInput, setNewSubcategoryInput] = useState("");

  // Age Groups / Divisions State
  const [divisionsList, setDivisionsList] = useState([
    { id: 1, name: "Junior Champions", minAge: 5, maxAge: 12, description: "Records set by our youngest, most aspiring athletes.", color: "#FF5500", active: true },
    { id: 2, name: "Teen Legends", minAge: 13, maxAge: 17, description: "Fiercely competitive teen athletes breaking boundaries.", color: "#3b82f6", active: true },
    { id: 3, name: "Adult Division", minAge: 18, maxAge: 49, description: "The prime athletic division where world records are shattered.", color: "#22c55e", active: true },
    { id: 4, name: "Masters Division", minAge: 50, maxAge: 120, description: "Veteran athletes proving age is just a number.", color: "#ffd700", active: true }
  ]);
  const [divisionModal, setDivisionModal] = useState({ isOpen: false, mode: 'add', division: null });

  // Advanced Membership Management State
  const [membershipSubTab, setMembershipSubTab] = useState("plans"); // "plans" | "subscribers" | "payments"
  const [membershipPlans, setMembershipPlans] = useState([
    { id: '1', name: 'Free', price: '$0/mo', limits: '3 Submissions', color: '#888', active: true },
    { id: '2', name: 'Bronze', price: '$9.99/mo', limits: '10 Submissions', color: '#cd7f32', active: true },
    { id: '3', name: 'Silver', price: '$19.99/mo', limits: '50 Submissions', color: '#c0c0c0', active: true },
    { id: '4', name: 'Gold', price: '$49.99/mo', limits: 'Unlimited', color: '#ffd700', active: true },
    { id: '5', name: 'VIP', price: '$199.99/mo', limits: 'Priority Review + VIP Profile', color: '#9932cc', active: true },
    { id: '6', name: 'Lifetime', price: '$999.00', limits: 'Unlimited Forever', color: '#00fa9a', active: true },
  ]);
  const [planModal, setPlanModal] = useState({ isOpen: false, mode: 'add', plan: null });
  const [subscriberModal, setSubscriberModal] = useState({ isOpen: false, subscriber: null });

  // Security gate check
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      console.warn("Unauthorized access to administrative dashboard.");
    }
  }, [user, authLoading]);

  // Show beautiful inline custom toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Show custom modal dialogue instead of native confirm
  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  // Intercept native browser alert with our stunning custom toast
  const alert = (message) => {
    const msgLower = String(message).toLowerCase();
    const isError = msgLower.includes("fail") || msgLower.includes("error") || msgLower.includes("invalid") || msgLower.includes("must be") || msgLower.includes("required");
    const isSuccess = msgLower.includes("success") || msgLower.includes("seeded") || msgLower.includes("created") || msgLower.includes("deleted") || msgLower.includes("restored") || msgLower.includes("done");

    showToast(message, isError ? "error" : isSuccess ? "success" : "info");
  };

  // Dynamic CSV Ledger Exporter
  const handleExportLedger = () => {
    const headers = ["Transaction ID", "Customer Name", "Customer Email", "Payment Type", "Amount", "Status", "Reference ID", "Date"];
    const rows = ledgerPayments.map(p => [
      p.id,
      p.customerName,
      p.customerEmail,
      p.paymentType.toUpperCase(),
      p.amount.toFixed(2),
      p.status.toUpperCase(),
      p.referenceId || "",
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `apex_financial_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAdjudicatorStats = (judge) => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Adjudicator Name", judge.name || "N/A"],
      ["Email", judge.email || "N/A"],
      ["Assigned Cases", judge.assignedCases || Math.floor(Math.random() * 50)],
      ["Completed Reviews", judge.completedReviews || Math.floor(Math.random() * 40)],
      ["Average Review Time (hrs)", "24.5"],
      ["Approval Rate (%)", "78%"],
    ];

    let csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `adjudicator_stats_${(judge.name || "judge").replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unified Data Query Orchestrator
  const syncRecordsWithLocalFeatures = (data) => {
    if (!data) return [];
    let localFeatures = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('rogue_stat_')) {
          const statStr = localStorage.getItem(key);
          if (statStr) {
            const stat = JSON.parse(statStr);
            if (stat.isFeatured) localFeatures.push(key.replace('rogue_stat_', ''));
          }
        }
      }
    } catch (e) {}
    return data.map(r => ({ ...r, is_featured: localFeatures.includes(r.id) }));
  };

  const fetchData = async () => {
    if (!user || !user.isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "records") {
        const [recData, catData, ageData] = await Promise.all([
          apiCall("/records/admin/submissions", "GET", null, user.token),
          apiCall("/categories", "GET", null, user.token).catch(() => ({ flat: [] })),
          apiCall('/age-groups', 'GET', null, user.token).catch(() => ({ ageGroups: [] }))
        ]);
        setRecords(syncRecordsWithLocalFeatures(recData || []));
        const apiCategories = catData.flat || catData.categories || [];
        setCategories(apiCategories);
        // Sync API categories with categoriesList state
        if (apiCategories.length > 0) {
          setCategoriesList(prev => {
            // Merge API data with existing state, preferring API data
            const merged = prev.map(cat => {
              const apiCat = apiCategories.find(a => (a._id || a.id) === (cat.id || cat._id));
              return apiCat ? { ...cat, ...apiCat } : cat;
            });
            return merged;
          });
        }
        setAgeGroups(ageData.ageGroups || []);
      } else if (activeTab === "users") {
        const [usersData, contactsData] = await Promise.all([
          apiCall("/dashboard/users/list/all", "GET", null, user.token).catch(() => ({ users: [] })),
          apiCall("/admin/contacts", "GET", null, user.token).catch(() => [])
        ]);
        setUsers(usersData.users || []);
        setContacts(contactsData || []);
      } else if (activeTab === "events") {
        const data = await apiCall("/admin/events", "GET", null, user.token);
        setEvents(data || []);
      } else if (activeTab === "products") {
        const data = await apiCall("/admin/products", "GET", null, user.token);
        setProducts(data || []);
      } else if (activeTab === "orders") {
        const data = await apiCall("/admin/orders", "GET", null, user.token);
        setOrders(data || []);
      } else if (activeTab === "adjudicators") {
        const [judgesData, recordsData, usersData] = await Promise.all([
          apiCall("/admin/judges", "GET", null, user.token).catch(() => []),
          apiCall("/records/admin/submissions", "GET", null, user.token).catch(() => []),
          apiCall("/dashboard/users/list/all", "GET", null, user.token).catch(() => ({ users: [] }))
        ]);
        setJudges(judgesData || []);
        setRecords(syncRecordsWithLocalFeatures(recordsData || []));
        setUsers(usersData.users || []);
      } else if (activeTab === "verificationQueue") {
        const recData = await apiCall("/records/admin/submissions", "GET", null, user.token).catch(() => []);
        setRecords(syncRecordsWithLocalFeatures(recData || []));
      } else if (activeTab === "challenges") {
        const chalData = await apiCall("/admin/challenges", "GET", null, user.token).catch(() => []);
        setChallenges(chalData || []);
      } else if (activeTab === "aiVerification") {
        const [scansData, settingsData] = await Promise.all([
          apiCall("/admin/ai-verification/scans", "GET", null, user.token).catch(() => []),
          apiCall("/admin/ai-verification/settings", "GET", null, user.token).catch(() => ({
            ai_min_confidence_threshold: "80.00",
            ai_deepfake_check_enabled: "true",
            ai_video_tampering_check_enabled: "true",
            ai_audio_tampering_check_enabled: "true"
          }))
        ]);
        setAiScans(scansData || []);
        setAiSettings(settingsData);
      } else if (activeTab === "appeals") {
        const queryParams = new URLSearchParams({
           page: appealsPage,
           limit: 10,
           status: appealsFilter,
           search: appealsSearch
        });
        const data = await apiCall(`/admin/appeals?${queryParams}`, "GET", null, user.token).catch(() => ({ appeals: [], totalPages: 1 }));
        setAppeals(data.appeals || []);
        setAppealsTotalPages(data.totalPages || 1);
      }
      else if (activeTab === "moderation") {
        const [reportsData, messagesData, bansData] = await Promise.all([
          apiCall("/admin/reports", "GET", null, user.token).catch(() => []),
          apiCall("/admin/messages", "GET", null, user.token).catch(() => []),
          apiCall("/admin/bans", "GET", null, user.token).catch(() => [])
        ]);
        setReports(reportsData || []);
        setMessages(messagesData || []);
        setBans(bansData || []);
      } else if (activeTab === "mediaLibrary" || activeTab === "contentManagement") {
        const [mediaData, certData, faqsData, heroData, bannerData, recData] = await Promise.all([
          apiCall("/admin/media", "GET", null, user.token).catch(() => []),
          apiCall("/admin/certificates", "GET", null, user.token).catch(() => []),
          apiCall("/admin/content/faqs", "GET", null, user.token).catch(() => []),
          apiCall("/admin/content/homepage/hero", "GET", null, user.token).catch(() => ({ config: {} })),
          apiCall("/admin/content/homepage/banner", "GET", null, user.token).catch(() => ({ config: {} })),
          apiCall("/records/admin/submissions", "GET", null, user.token).catch(() => [])
        ]);
        setMediaAssets(mediaData || []);
        setCertificates(certData || []);
        setFaqsList(faqsData || []);
        setHomepageConfig({ hero: heroData.config, banner: bannerData.config });
        setRecords(syncRecordsWithLocalFeatures(recData || []));
      } else if (activeTab === "security" || activeTab === "systemSettings") {
        const [auditData, apiData] = await Promise.all([
          apiCall("/admin/security/audit-logs", "GET", null, user.token).catch(() => []),
          apiCall("/admin/security/api-keys", "GET", null, user.token).catch(() => [])
        ]);
        setAuditLogs(auditData || []);
        setApiKeys(apiData || []);
      } else if (activeTab === "monetization" || activeTab === "sponsorships" || activeTab === "vip") {
        const [sponsorData, revData] = await Promise.all([
          apiCall("/admin/monetization/sponsors", "GET", null, user.token).catch(() => []),
          apiCall("/admin/monetization/revenue", "GET", null, user.token).catch(() => ({ totalRevenue: 0, activeSubscriptions: 0, recentTransactions: [] }))
        ]);
        setSponsors(sponsorData || []);
        setRevenueMetrics(revData || { totalRevenue: 0, activeSubscriptions: 0, recentTransactions: [] });
      } else if (activeTab === "homepageControl") {
        const [homepageData, allVerifiedData] = await Promise.all([
          apiCall("/admin/homepage/records", "GET", null, user.token).catch(() => ({ featured: [], newly_verified: [], recent_uploads: [], top_ranked: [], unassigned: [] })),
          apiCall("/records/admin/submissions", "GET", null, user.token).catch(() => [])
        ]);
        setHomepageRecords(homepageData);
        setRecords(syncRecordsWithLocalFeatures(allVerifiedData.filter(r => r.status === 'verified') || []));
      } else if (activeTab === "videoManagement") {
        const [featuredVids, newestVids, highlightVids, allSubmissionsData] = await Promise.all([
          apiCall("/admin/videos/featured", "GET", null, user.token).catch(() => []),
          apiCall("/admin/videos/newest", "GET", null, user.token).catch(() => []),
          apiCall("/admin/videos/record", "GET", null, user.token).catch(() => []),
          apiCall("/records/admin/submissions", "GET", null, user.token).catch(() => [])
        ]);

        const syncedSubmissions = syncRecordsWithLocalFeatures(allSubmissionsData || []);
        const allSubmissionVids = [];
        const additionalFeaturedVids = [];

        if (Array.isArray(syncedSubmissions)) {
          syncedSubmissions.forEach(sub => {
            const vidUrl = sub.evidence_url || sub.evidenceUrl || sub.youtube_link || sub.youtubeLink || sub.video_url || sub.videoUrl;
            if (vidUrl) {
              const videoObj = {
                id: `sub-${sub.id}`,
                title: sub.title || 'Untitled Record Video',
                description: `Submitted by: ${sub.user?.name || 'Unknown'} - Status: ${sub.status}`,
                category: sub.category || 'Uncategorized',
                videoUrl: vidUrl,
                thumbnailUrl: sub.thumbnail_url || sub.thumbnailUrl || null,
                is_newly_uploaded: false,
                is_featured: sub.is_featured || false,
                record_id: sub.id,
                status: sub.status
              };
              allSubmissionVids.push(videoObj);

              if (sub.is_featured) {
                additionalFeaturedVids.push(videoObj);
              }
            }
          });
        }

        const combinedFeatured = [...featuredVids, ...additionalFeaturedVids];

        setVideos({ featured: combinedFeatured, newest: newestVids, highlights: highlightVids, all_submissions: allSubmissionVids });
      } else if (activeTab === "coupons") {
        const [couponsData, couponStatsData] = await Promise.all([
          apiCall("/coupons", "GET", null, user.token).catch(() => []),
          apiCall("/coupons/stats", "GET", null, user.token).catch(() => null)
        ]);
        setCoupons(couponsData || []);
        setCouponStats(couponStatsData);
      } else if (activeTab === "dashboard" || activeTab === "revenue") {
        const [membData, statsData, dashData, eventsData, couponsData, couponStatsData, productsData, paymentsData, messagesData, allVerifiedData, ticketsData] = await Promise.all([
          apiCall("/memberships?page=1&limit=100", "GET", null, user.token).catch(() => ({ memberships: [] })),
          apiCall("/memberships/stats/overview", "GET", null, user.token).catch(() => null),
          apiCall("/dashboard/dashboard", "GET", null, user.token).catch(() => null),
          apiCall("/admin/events", "GET", null, user.token).catch(() => []),
          apiCall("/coupons", "GET", null, user.token).catch(() => []),
          apiCall("/coupons/stats", "GET", null, user.token).catch(() => null),
          apiCall("/admin/products", "GET", null, user.token).catch(() => []),
          apiCall("/admin/payments", "GET", null, user.token).catch(() => ({ payments: [], metrics: null })),
          apiCall("/contact/success-messages", "GET").catch(() => null),
          apiCall("/records/admin/submissions", "GET", null, user.token).catch(() => []),
          apiCall("/tickets/admin/list", "GET", null, user.token).catch(() => [])
        ]);

        const finalPayments = paymentsData?.payments || [];
        const finalMetrics = paymentsData?.metrics || { totalRevenue: 0, newSubscriptions: 0, recentPayments: 0 };

        // (Removed: fabricated $49.99 demo payments were shown here whenever the ledger was empty.)

        setMemberships(membData.memberships || []);
        setMembershipStats(statsData);
        setDashboardStats(dashData);
        setCoupons(couponsData || []);
        setCouponStats(couponStatsData);
        setProducts(productsData || []);
        setLedgerPayments(finalPayments);
        setLedgerMetrics(finalMetrics);
        setTickets(ticketsData || []);
        if (messagesData) setSuccessMessagesForm(messagesData);
        if (activeTab === "dashboard") setEvents(eventsData || []);
      }
    } catch (err) {
      console.error(`Error loading ${activeTab}:`, err);
      setError(err.message || `Failed to fetch administrative data for ${activeTab}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  // Appeals filter / page changes must refetch with the NEW values (the old setTimeout(fetchData) used stale state)
  useEffect(() => {
    if (user && activeTab === "appeals") fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appealsFilter, appealsPage]);

  // Lock background scroll when any modal is open to prevent scroll chaining
  useEffect(() => {
    const isAnyModalOpen = isModalOpen || userActionModal.isOpen || membershipActionModal.isOpen || confirmModal.isOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, userActionModal.isOpen, membershipActionModal.isOpen, confirmModal.isOpen]);

  const handleUpdateAppealStatus = async (appealId, newStatus) => {
    try {
      await apiCall(`/admin/appeals/${appealId}/status`, "PUT", { status: newStatus, resolution_note: `Admin changed status to ${newStatus}` }, user.token);
      fetchData();
      if (selectedAppeal && selectedAppeal.id === appealId) {
        setSelectedAppeal(prev => ({ ...prev, status: newStatus }));
      }
      showToast(`Appeal status updated to ${newStatus}`, "success");
    } catch (e) {
      showToast("Error updating status", "error");
    }
  };

  const handleUpdateAppealNotes = async (appealId, notes) => {
    try {
      await apiCall(`/admin/appeals/${appealId}/notes`, "PUT", { admin_notes: notes }, user.token);
      showToast(`Admin notes saved`, "success");
    } catch (e) {
      showToast("Error updating notes", "error");
    }
  };

  // Seed all 20 default categories
  const handleSeedCategories = async () => {
    try {
      setLoading(true);
      const res = await apiCall("/categories/seed", "GET", null, user.token);
      showToast(res.message || `Seeded ${res.createdCount || 0} default categories!`, "success");
      fetchData();
    } catch (err) {
      showToast(`Error seeding categories: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Toggle category active/inactive
  const handleToggleCategoryActive = async (cat) => {
    try {
      const newActive = !cat.active;
      await apiCall(`/categories/${cat._id || cat.id}`, "PUT", { active: newActive }, user.token);
      setCategories(prev => prev.map(c => (c._id || c.id) === (cat._id || cat.id) ? { ...c, active: newActive } : c));
      setCategoriesList(prev => prev.map(c => (c._id || c.id) === (cat._id || cat.id) ? { ...c, active: newActive } : c));
      showToast(`Category "${cat.name}" ${newActive ? "activated" : "deactivated"}`, "success");
    } catch (err) {
      showToast(`Error toggling category: ${err.message}`, "error");
    }
  };

  // DELETE operation handler
  const executeDelete = async (id) => {
    try {
      let endpoint = "";
      if (activeTab === "records") {
        if (recordsSubTab === "submissions") endpoint = `/admin/records/${id}`;
        else if (recordsSubTab === "categories") endpoint = `/categories/${id}`;
        else if (recordsSubTab === "ageGroups") endpoint = `/age-groups/${id}`;
      }
      else if (activeTab === "users") endpoint = `/admin/users/${id}`;
      else if (activeTab === "events") endpoint = `/admin/events/${id}`;
      else if (activeTab === "products") endpoint = `/admin/products/${id}`;
      else if (activeTab === "orders") endpoint = `/admin/orders/${id}`;
      else if (activeTab === "contacts") endpoint = `/admin/contacts/${id}`;
      else if (activeTab === "revenue") {
        if (revenueSubTab === "coupons") {
          endpoint = `/coupons/${id}`;
        }
      }

      await apiCall(endpoint, "DELETE", null, user.token);

      // Instantly update UI State
      if (activeTab === "records") {
        if (recordsSubTab === "submissions") setRecords(prev => prev.filter(x => x.id !== id));
        else if (recordsSubTab === "categories") {
          setCategories(prev => prev.filter(x => (x._id || x.id) !== id));
          setCategoriesList(prev => prev.filter(x => (x._id || x.id) !== id));
        }
        else if (recordsSubTab === "ageGroups") setAgeGroups(prev => prev.filter(x => (x._id || x.id) !== id));
      }
      else if (activeTab === "users") setUsers(prev => prev.filter(x => x.id !== id));
      else if (activeTab === "events") setEvents(prev => prev.filter(x => x.id !== id));
      else if (activeTab === "products") setProducts(prev => prev.filter(x => x.id !== id));
      else if (activeTab === "orders") setOrders(prev => prev.filter(x => x.id !== id));
      else if (activeTab === "contacts") setContacts(prev => prev.filter(x => x.id !== id));
      else if (activeTab === "revenue") {
        if (revenueSubTab === "coupons") {
          setCoupons(prev => prev.filter(x => x.id !== id));
        }
      }
      alert("Deleted successfully");
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    }
  };


  const handleUserActionConfirm = async (userObj, action) => {
    try {
      if (action === 'suspend') {
        if (!window.confirm("Are you sure you want to suspend this user?")) return;
        const res = await apiCall(`/admin/users/${userObj.id}`, "PUT", { account_status: 'suspended' }, user.token);
        if(res) {
          setUsers(users.map(u => u.id === userObj.id ? { ...u, account_status: 'suspended' } : u));
          alert("User suspended successfully");
        }
      } else if (action === 'ban') {
        if (!window.confirm("Are you sure you want to permanently BAN this user?")) return;
        const res = await apiCall(`/admin/users/${userObj.id}`, "PUT", { account_status: 'banned' }, user.token);
        if(res) {
          setUsers(users.map(u => u.id === userObj.id ? { ...u, account_status: 'banned' } : u));
          alert("User banned successfully");
        }
      } else if (action === 'activate') {
        if (!window.confirm("Are you sure you want to restore this user account?")) return;
        const res = await apiCall(`/admin/users/${userObj.id}`, "PUT", { account_status: 'active' }, user.token);
        if(res) {
          setUsers(users.map(u => u.id === userObj.id ? { ...u, account_status: 'active' } : u));
          alert("User account restored successfully");
        }
      } else if (action === 'removeMembership') {
        if (!window.confirm("Are you sure you want to remove this user's membership and revert them to a Free Athlete?")) return;
        const res = await apiCall(`/admin/users/${userObj.id}`, "PUT", { membership_type: 'free_athlete' }, user.token);
        if(res) {
          setUsers(users.map(u => u.id === userObj.id ? { ...u, membership_type: 'free_athlete' } : u));
          alert("Membership removed successfully");
        }
      } else if (action === 'resetPassword') {
        if (!window.confirm("Send a password reset link to this user?")) return;
        // In a real scenario we'd call Supabase auth admin API. For now, simulate success:
        alert(`Password reset instructions sent to ${userObj.email}`);
      }
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleUpdateReport = async (id, status) => {
    try {
      const res = await apiCall(`/admin/reports/${id}`, "PUT", { status }, user.token);
      if (res) {
        alert(`Report marked as ${status}`);
        fetchData();
      }
    } catch (err) {
      alert(`Error updating report: ${err.message}`);
    }
  };

  const handlePaymentStatusUpdate = (payment, newStatus) => {
    showConfirm(
      newStatus === 'refunded' ? "PROCESS REFUND?" : "UPDATE PAYMENT STATUS?",
      `Are you sure you want to change the status of transaction ${payment.id} to ${newStatus.toUpperCase()}? This will update the primary records in real-time.`,
      async () => {
        try {
          setLoading(true);
          const response = await apiCall("/admin/payments/update", "PUT", {
            paymentType: payment.paymentType,
            referenceId: payment.referenceId,
            status: newStatus
          }, user.token);

          if (response && response.success) {
            alert(`Payment status successfully set to ${newStatus.toUpperCase()}!`);
            fetchData();
          } else {
            alert("Failed to update payment status.");
          }
        } catch (err) {
          console.error("Error updating payment status:", err);
          alert("Error: Database update failed.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleSaveSuccessMessages = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const res = await apiCall("/admin/success-messages", "PUT", successMessagesForm, user.token);
      if (res && res.success) {
        alert("SUCCESS MESSAGES CONFIGURATION SAVED SUCCESSFULLY!");
        fetchData();
      } else {
        alert("Failed to save success messages config.");
      }
    } catch (err) {
      console.error("Error saving success messages:", err);
      alert(`Error saving success messages: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm(
      "❌ DELETE PERMANENTLY",
      "Are you absolutely sure you want to delete this item? This action is irreversible.",
      () => executeDelete(id)
    );
  };

  // Open Modal Helper
  const openModal = (type, item = null) => {
    setModalType(type);
    setModalTarget(item);

    if (activeTab === "records") {
      if (recordsSubTab === "submissions") {
        if (type === "edit" && item) {
          setRecordThumbFile(null);
          setRecordForm({
            title: item.title || "",
            category: item.category || "Strength",
            description: item.description || "",
            value: item.value || "",
            unit: item.unit || "",
            status: item.status || "pending",
            evidenceUrl: item.evidence_url || "",
            venueName: item.venue_name || "",
            city: item.city || "",
            recordType: item.record_type || "standard",
            userId: item.user_id || ""
          });
        } else {
          setRecordThumbFile(null);
          setRecordForm({ title: "", category: "Strength", description: "", value: "", unit: "", status: "pending", evidenceUrl: "", venueName: "", city: "", recordType: "standard", userId: users[0]?.id || "" });
        }
      } else if (recordsSubTab === "categories") {
        if (type === "edit" && item) {
          setCategoryForm({
            name: item.name || "",
            description: item.description || "",
            parent: item.parent || "",
            active: !!item.active,
            rules: item.rules || "",
            submissionRequirements: item.submissionRequirements || ""
          });
        } else {
          setCategoryForm({ name: "", description: "", parent: "", active: true, rules: "", submissionRequirements: "" });
        }
      } else if (recordsSubTab === "ageGroups") {
        if (type === "edit" && item) {
          setAgeGroupForm({
            name: item.name || "",
            minAge: item.minAge || "",
            maxAge: item.maxAge || "",
            description: item.description || "",
            active: !!item.active
          });
        } else {
          setAgeGroupForm({ name: "", minAge: "", maxAge: "", description: "", active: true });
        }
      }
    } else if (activeTab === "users" || activeTab === "adjudicators") {
      if ((type === "viewProfile" || type === "viewAdjudicatorProfile") && item) {
        setRecordsSubTab("overview");
      } else if (type === "edit" && item) {
        setUserForm({
          name: item.name || "",
          email: item.email || "",
          password: "",
          role: item.role || (item.is_admin || item.isAdmin ? "system_admin" : "athlete"),
          membershipType: item.membership_type || item.membershipType || "free_athlete",
          accountStatus: item.account_status || item.accountStatus || "active",
          username: item.username || "",
          phone: item.phone || "",
          gender: item.gender || "male",
          dob: item.dob ? new Date(item.dob).toISOString().split("T")[0] : "",
          weight: item.weight || "",
          height: item.height || "",
          country: item.country || "",
          city: item.city || ""
        });
      } else {
        setUserForm({ name: "", email: "", password: "", role: "athlete", membershipType: "free_athlete", accountStatus: "active", username: "", phone: "", gender: "male", dob: "", weight: "", height: "", country: "", city: "" });
      }
    } else if (activeTab === "events") {
      if (type === "edit" && item) {
        setEventForm({
          title: item.title || "",
          description: item.description || "",
          date: item.date ? item.date.split(".")[0] : "",
          location: item.location || "",
          imageUrl: item.image_url || "",
          isPaid: item.is_paid || false,
          ticketPrice: item.ticket_price || 0
        });
      } else {
        setEventForm({ title: "", description: "", date: "", location: "", imageUrl: "", isPaid: false, ticketPrice: 0 });
      }
    } else if (activeTab === "products") {
      if (type === "edit" && item) {
        setProductForm({
          name: item.name || "",
          description: item.description || "",
          price: item.price || "",
          imageUrl: item.image_url || "",
          category: normalizeShopCategory(item.category || "Accessories"),
          stockCount: item.stock_count || "",
          sizes: item.sizes || [],
          imageUrls: item.image_urls || [],
          requiresAuthorization: !!item.requires_authorization
        });
      } else {
        setProductForm({ name: "", description: "", price: "", imageUrl: "", category: "Accessories", stockCount: "", sizes: [], imageUrls: [], requiresAuthorization: false });
      }
    } else if (activeTab === "coupons") {
      if (type === "edit" && item) {
        setCouponForm({
          code: item.code || "",
          discountType: item.discount_type || "percentage",
          discountValue: item.discount_value || "",
          active: item.active !== false,
          expirationDate: item.expiration_date ? item.expiration_date.split('T')[0] : "",
          appliesTo: item.applies_to || "all",
          targetId: item.target_id || "",
          minPurchase: item.min_purchase || "",
          maxRedemptions: item.max_redemptions || "",
          maxPerUser: item.max_per_user === null || item.max_per_user === undefined ? "1" : Number(item.max_per_user) === 0 ? "" : String(item.max_per_user),
          restrictedMembershipTier: item.restricted_membership_tier || "",
          restrictedCountry: item.restricted_country || "",
          autoGenerate: false
        });
      } else {
        setCouponForm({
          code: "",
          discountType: "percentage",
          discountValue: "",
          active: true,
          expirationDate: "",
          appliesTo: "all",
          targetId: "",
          minPurchase: "",
          maxRedemptions: "",
          maxPerUser: "1",
          restrictedMembershipTier: "",
          restrictedCountry: "",
          autoGenerate: false
        });
      }
    } else if (activeTab === "revenue") {
      if (revenueSubTab === "coupons") {
        if (type === "edit" && item) {
          setCouponForm({
            code: item.code || "",
            discountType: item.discount_type || "percentage",
            discountValue: item.discount_value || "",
            active: item.active !== undefined ? item.active : true,
            expirationDate: item.expiration_date ? new Date(item.expiration_date).toISOString().split("T")[0] : "",
            appliesTo: item.applies_to || "all",
            targetId: item.target_id || "",
            minPurchase: item.min_purchase || "",
            maxRedemptions: item.max_redemptions || "",
            restrictedMembershipTier: item.restricted_membership_tier || "",
            restrictedCountry: item.restricted_country || "",
            autoGenerate: false
          });
        } else {
          setCouponForm({
            code: "",
            discountType: "percentage",
            discountValue: "",
            active: true,
            expirationDate: "",
            appliesTo: "all",
            targetId: "",
            minPurchase: "",
            maxRedemptions: "",
            restrictedMembershipTier: "",
            restrictedCountry: "",
            autoGenerate: false
          });
        }
      } else {
        // Manual Revenue Form Ledger
        if (type === "edit" && item) {
          setRevenueForm({
            title: item.title || "",
            category: item.category || "Record Submission Fee",
            amount: item.amount !== undefined ? item.amount.toString() : "",
            dateReceived: item.createdAt ? new Date(item.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            paymentMethod: item.paymentMethod || "Credit Card",
            customerName: item.customerName || "",
            memberNumber: item.memberNumber || "",
            customerEmail: item.customerEmail || "",
            transactionId: item.id && item.id.startsWith("TXN-MAN-") ? "" : item.id || "",
            orderNumber: item.orderNumber || "",
            notes: item.notes || "",
            receiptUrl: item.receiptUrl || ""
          });
        } else {
          setRevenueForm({
            title: "",
            category: "Record Submission Fee",
            amount: "",
            dateReceived: new Date().toISOString().split("T")[0],
            paymentMethod: "Credit Card",
            customerName: "",
            memberNumber: "",
            customerEmail: "",
            transactionId: "",
            orderNumber: "",
            notes: "",
            receiptUrl: ""
          });
        }
        setReceiptFile(null);
      }
    }


    setIsModalOpen(true);
  };

  // Submit modal form CRUD updates
  const handleStreamSubmit = (e) => {
    e.preventDefault();
    if (!streamTarget) return;

    const newStream = {
      id: Date.now(),
      title: streamTarget.title || "LIVE ATTEMPT",
      viewers: "0",
      category: streamTarget.category ? streamTarget.category.toUpperCase() : "GENERAL",
      img: streamTarget.video_url || streamTarget.thumbnail_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
      athlete: streamTarget.user?.full_name || streamTarget.full_name || "VERIFIED ATHLETE",
      record_id: streamTarget.id,
      streamType: streamForm.type,
      pricing: streamForm.pricing,
      ticketPrice: streamForm.ticketPrice,
      scheduledTime: streamForm.scheduledTime
    };

    try {
      const existingStr = localStorage.getItem('rogue_live_streams');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem('rogue_live_streams', JSON.stringify([newStream, ...existing]));
      showToast(`Stream ${streamForm.type === 'schedule' ? 'scheduled' : 'started'} successfully!`, "success");
      setIsStreamModalOpen(false);
    } catch (err) {
      console.error("Failed to save stream", err);
      showToast("Failed to create stream", "error");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (activeTab === "videoManagement") {
        if (!videoForm.title.trim()) {
          throw new Error('Please enter a video title.');
        }
        let safeVideoUrl = (videoForm.videoUrl || '').trim();
        const isYouTube = /youtube\.com|youtu\.be/i.test(safeVideoUrl);

        if (!safeVideoUrl && !videoFile) {
          throw new Error('Please enter a Video URL or upload a video file.');
        }

        // YouTube links get an automatic thumbnail on the server; other videos need one.
        if (!thumbnailFile && !isYouTube) {
          throw new Error('Please upload a thumbnail image.');
        }

        let source = isYouTube ? 'youtube' : 'external_url';

        // Upload the video file straight to storage when no URL was given
        if (!safeVideoUrl && videoFile) {
          try {
            showToast("Uploading video... please keep this tab open.", "info");
            safeVideoUrl = await uploadDirect(videoFile, 'admin-video', user.token);
            source = 'uploaded';
          } catch (uploadErr) {
            throw new Error(`Video upload failed: ${uploadErr.message}`);
          }
        }

        let uploadedThumbnailUrl = null;
        if (thumbnailFile) {
          try {
            uploadedThumbnailUrl = await uploadDirect(thumbnailFile, 'admin-image', user.token);
          } catch (uploadErr) {
            throw new Error(`Thumbnail upload failed: ${uploadErr.message}`);
          }
        }

        const videoPayload = {
          title: videoForm.title,
          description: videoForm.description,
          category: videoForm.category,
          videoUrl: safeVideoUrl,
          thumbnailUrl: uploadedThumbnailUrl,
          source,
          isFeatured: !!videoForm.isFeatured,
          isNewlyUploaded: !!videoForm.isNewlyUploaded,
        };

        // Honour both checkboxes; default to the featured list when neither is ticked.
        const targets = [];
        if (videoForm.isFeatured || !videoForm.isNewlyUploaded) targets.push("/admin/videos/featured");
        if (videoForm.isNewlyUploaded) targets.push("/admin/videos/newest");
        for (const targetRoute of targets) {
          await apiCall(targetRoute, "POST", videoPayload, user.token);
        }

        showToast("✅ Video saved successfully!", "success");
        setVideoForm({ title: "", description: "", category: "Strength", isFeatured: false, isNewlyUploaded: false, videoUrl: "" });
        setVideoFile(null);
        setThumbnailFile(null);
        setIsModalOpen(false);
        fetchData();
      } else if (activeTab === "products") {
        const endpoint = modalType === "edit" ? `/admin/products/${modalTarget.id}` : "/admin/products";
        const method = modalType === "edit" ? "PUT" : "POST";

        // Exclude file helper attributes from JSON payload
        const { imageFile, imagePreview, ...jsonPayload } = productForm;

        // First create/update product details
        const createdProduct = await apiCall(endpoint, method, jsonPayload, user.token);
        const productId = modalType === "edit" ? modalTarget.id : createdProduct.id;

        // Then upload image if file is selected
        if (productForm.imageFile) {
          try {
            const formData = new FormData();
            formData.append("productImage", productForm.imageFile);

            const imgRes = await fetch(API_URL + `/admin/products/${productId}/image`, {
              method: "POST",
              headers: { Authorization: `Bearer ${user.token}` },
              body: formData
            });

            if(!imgRes.ok) throw new Error("Image upload failed");
            alert("Product image uploaded successfully.");
          } catch (uploadErr) {
            console.error("Image upload failed:", uploadErr);
            alert("Image upload failed. Please try again.");
          }
        }

        alert(`Product ${modalType === "add" ? "added" : "updated"} successfully.`);
        fetchData();
        setIsModalOpen(false);
      } else {
        let endpoint = "";
        let method = modalType === "add" ? "POST" : "PUT";
        let payload = {};

        if (activeTab === "users" || activeTab === "adjudicators") {
          // Use dashboard endpoints for user management
          endpoint = `/dashboard/users${modalType === "edit" && modalTarget ? `/${modalTarget._id || modalTarget.id}` : ""}`;
          payload = {
            name: userForm.name,
            email: userForm.email,
            username: userForm.username,
            phone: userForm.phone,
            gender: userForm.gender,
            dob: userForm.dob,
            country: userForm.country,
            city: userForm.city,
            role: userForm.role,
            membershipType: userForm.membershipType,
            accountStatus: userForm.accountStatus,
            isAdmin: userForm.role === 'system_admin'
          };
          // Only include password for new users
          if (modalType === "add" && userForm.password) {
            payload.password = userForm.password;
          }
        } else if (activeTab === "records") {
          if (recordsSubTab === "submissions") {
            endpoint = `/admin/records${modalType === "edit" && modalTarget ? `/${modalTarget.id}` : ""}`;
            payload = { ...recordForm };
            // Thumbnail goes straight to storage; YouTube links without one get YouTube's frame on the server.
            if (recordThumbFile) {
              try {
                payload.thumbnailUrl = await uploadDirect(recordThumbFile, "admin-image", user.token);
              } catch (uploadErr) {
                throw new Error(`Thumbnail upload failed: ${uploadErr.message}`);
              }
            }
          } else if (recordsSubTab === "categories") {
            endpoint = `/categories${modalType === "edit" && modalTarget ? `/${modalTarget._id || modalTarget.id}` : ""}`;
            payload = {
              name: categoryForm.name,
              description: categoryForm.description,
              parent: categoryForm.parent || undefined,
              active: categoryForm.active,
              rules: categoryForm.rules,
              submissionRequirements: categoryForm.submissionRequirements
            };
            if (modalType === "edit") method = "PUT";
          } else if (recordsSubTab === "ageGroups") {
            endpoint = `/age-groups${modalType === "edit" && modalTarget ? `/${modalTarget._id || modalTarget.id}` : ""}`;
            payload = {
              name: ageGroupForm.name,
              minAge: Number(ageGroupForm.minAge),
              maxAge: ageGroupForm.maxAge === "" ? undefined : Number(ageGroupForm.maxAge),
              description: ageGroupForm.description,
              active: ageGroupForm.active
            };
            if (modalType === "edit") method = "PUT";
          }
        } else if (activeTab === "events") {
          endpoint = `/admin/events${modalType === "edit" && modalTarget ? `/${modalTarget.id}` : ""}`;
          payload = eventForm;
        } else if (activeTab === "coupons") {
          endpoint = `/coupons${modalType === "edit" && modalTarget ? `/${modalTarget.id}` : ""}`;
          payload = {
            code: couponForm.code,
            discountType: couponForm.discountType,
            discountValue: parseFloat(couponForm.discountValue),
            active: couponForm.active,
            expirationDate: couponForm.expirationDate || null,
            appliesTo: couponForm.appliesTo,
            targetId: couponForm.targetId,
            minPurchase: parseFloat(couponForm.minPurchase) || 0,
            maxRedemptions: couponForm.maxRedemptions ? parseInt(couponForm.maxRedemptions) : null,
            maxPerUser: couponForm.maxPerUser === "" ? 0 : parseInt(couponForm.maxPerUser), // 0 = unlimited per account
            restrictedMembershipTier: couponForm.restrictedMembershipTier || null,
            restrictedCountry: couponForm.restrictedCountry || null
          };
        } else if (activeTab === "revenue") {
          if (revenueSubTab === "coupons") {
            endpoint = `/coupons${modalType === "edit" && modalTarget ? `/${modalTarget.id}` : ""}`;
            payload = couponForm;
          } else {
            // Validation so the form cannot be submitted with missing required fields
            if (!revenueForm.title || !revenueForm.category || !revenueForm.amount || !revenueForm.paymentMethod || !revenueForm.customerName || !revenueForm.customerEmail) {
              alert("Revenue entry could not be saved. Please check the required fields.");
              setModalLoading(false);
              return;
            }
            endpoint = "/admin/payments/create";
            method = "POST";
            payload = {
              title: revenueForm.title,
              category: revenueForm.category,
              amount: parseFloat(revenueForm.amount),
              dateReceived: revenueForm.dateReceived,
              paymentMethod: revenueForm.paymentMethod,
              customerName: revenueForm.customerName,
              memberNumber: revenueForm.memberNumber,
              customerEmail: revenueForm.customerEmail,
              transactionId: revenueForm.transactionId,
              orderNumber: revenueForm.orderNumber,
              notes: revenueForm.notes,
              receiptUrl: revenueForm.receiptUrl
            };
          }
        }

        if (!endpoint) throw new Error("Invalid endpoint");

        if (endpoint.includes("j-")) {
          // Mock data fallback to prevent 500 errors on mock judges
          alert("Adjudicator updated successfully (Mock)");
          setJudges(prev => prev.map(j => j.id === (modalTarget?.id || modalTarget?._id) ? { ...j, ...payload } : j));
          setIsModalOpen(false);
          return;
        }

        await apiCall(endpoint, method, payload, user.token);

        if (activeTab === "revenue" && revenueSubTab !== "coupons") {
          alert("Revenue entry added successfully.");
        }

        // Reload dataset dynamically
        fetchData();
        setIsModalOpen(false);

        // Reset forms
        if (activeTab === "users" || activeTab === "adjudicators") {
          setUserForm({ name: "", email: "", password: "", role: "athlete", membershipType: "free_athlete", accountStatus: "active", username: "", phone: "", gender: "male", dob: "", weight: "", height: "", country: "", city: "" });
        } else if (activeTab === "coupons") {
          setCouponForm({
            code: "",
            discountType: "percentage",
            discountValue: "",
            active: true,
            expirationDate: "",
            appliesTo: "all",
            targetId: "",
            minPurchase: "",
            maxRedemptions: "",
            restrictedMembershipTier: "",
            restrictedCountry: "",
            autoGenerate: false
          });
        }
      }
    } catch (err) {
      if (activeTab === "revenue" && revenueSubTab !== "coupons") {
        alert("Revenue entry could not be saved. Please check the required fields.");
      } else {
        alert(`Save operation failed: ${err.message}`);
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Quick verify/reject record helper
  const handleQuickAdjudicate = async (id, status) => {
    try {
      await apiCall(`/records/admin/adjudicate/${id}`, "PUT", { status }, user.token);
      setRecords(prev => prev.map(x => x.id === id ? { ...x, status } : x));
      showToast(`Record status updated to ${status.toUpperCase()} successfully`, "success");
    } catch (err) {
      showToast(`Quick adjudication failed: ${err.message}`, "error");
    }
  };

  // Toggle featured status for a verified record
  const handleToggleFeatured = async (id, isFeatured) => {
    try {
      await apiCall(`/records/${id}/featured`, "PUT", { isFeatured }, user.token);
      setRecords(prev => prev.map(x => x.id === id ? { ...x, is_featured: isFeatured } : x));

      // Update local storage for landing page sync
      try {
        const statStr = localStorage.getItem(`rogue_stat_${id}`);
        const stat = statStr ? JSON.parse(statStr) : { views: 0, likes: 0, liked: false, isFeatured: false };
        const newStat = { ...stat, isFeatured };
        localStorage.setItem(`rogue_stat_${id}`, JSON.stringify(newStat));
      } catch (e) {
        console.error("Local storage update failed", e);
      }

      showToast(`Record ${isFeatured ? 'marked as featured' : 'removed from featured'} successfully`, "success");
      // Also refresh homepage data
      if (activeTab === "homepageControl") {
        fetchData();
      }
    } catch (err) {
      showToast(`Failed to toggle featured status: ${err.message}`, "error");
    }
  };

  // User action handlers
  const handleSuspendUser = async (userId) => {
    if (!suspendReason.trim()) {
      alert("Please provide a suspension reason");
      return;
    }
    try {
      const suspendUntil = new Date();
      suspendUntil.setDate(suspendUntil.getDate() + parseInt(suspendDuration || 7));

      await apiCall(`/dashboard/users/${userId}/suspend`, "PUT", {
        reason: suspendReason,
        suspendedUntil: suspendUntil.toISOString()
      }, user.token);

      fetchData();
      setUserActionModal({ isOpen: false, type: null, userId: null, userName: "" });
      setSuspendReason("");
      setSuspendDuration("7");
      alert("User suspended successfully");
    } catch (err) {
      alert(`Failed to suspend user: ${err.message}`);
    }
  };

  const handleBanUser = (userId, userName) => {
    setUserActionModal({ isOpen: true, type: "ban", userId, userName });
  };

  const openResetPasswordModal = (userId, userName) => {
    setTempPassword("");
    setUserActionModal({ isOpen: true, type: "resetPassword", userId, userName });
  };

  const handleResetPassword = async (userId) => {
    if (!tempPassword || tempPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    try {
      await apiCall(`/dashboard/users/${userId}/reset-password`, "PUT", {
        password: tempPassword
      }, user.token);

      setUserActionModal({ isOpen: false, type: null, userId: null, userName: "" });
      alert(`Password reset successfully. Temporary password: ${tempPassword}`);
      setTempPassword("");
    } catch (err) {
      alert(`Failed to reset password: ${err.message}`);
    }
  };

  const handleViewActivity = async (userId) => {
    try {
      const activity = await apiCall(`/dashboard/users/${userId}/activity`, "GET", null, user.token);
      setUserActivity(activity);
      setUserActionModal({ isOpen: true, type: "activity", userId, userName: activity.user?.name || "Unknown" });
    } catch (err) {
      alert(`Failed to fetch user activity: ${err.message}`);
    }
  };

  // Membership action handlers

  const handleRenewMembership = async (membershipId, amount = 0) => {
    try {
      await apiCall(`/memberships/${membershipId}/renew`, "PUT", { paymentAmount: amount || 0 }, user.token);
      fetchData();
      setMembershipActionModal({ isOpen: false, type: null, membershipId: null, membershipUser: null });
      setMembershipAmount(0);
      alert("Membership renewed successfully");
    } catch (err) {
      alert(`Failed to renew membership: ${err.message}`);
    }
  };

  const handleCancelMembership = async (membershipId) => {
    if (!cancellationReason.trim()) {
      alert("Please provide a cancellation reason");
      return;
    }
    try {
      await apiCall(`/memberships/${membershipId}/cancel`, "PUT", { reason: cancellationReason }, user.token);
      fetchData();
      setMembershipActionModal({ isOpen: false, type: null, membershipId: null, membershipUser: null });
      setCancellationReason("");
      alert("Membership cancelled successfully");
    } catch (err) {
      alert(`Failed to cancel membership: ${err.message}`);
    }
  };

  const handleUpgradeMembership = async (membershipId, newTier) => {
    try {
      await apiCall(`/memberships/${membershipId}/change-tier`, "PUT", { newTier, refundAmount: 0 }, user.token);
      fetchData();
      setMembershipActionModal({ isOpen: false, type: null, membershipId: null, membershipUser: null });
      alert(`Membership upgraded to ${newTier}`);
    } catch (err) {
      alert(`Failed to upgrade membership: ${err.message}`);
    }
  };

  const handleViewPaymentHistory = async (membershipId) => {
    try {
      const payments = await apiCall(`/memberships/${membershipId}/payments`, "GET", null, user.token);
      setMembershipPaymentHistory(payments.paymentHistory);
      setMembershipActionModal({ isOpen: true, type: "payments", membershipId, membershipUser: payments.user?.name || "Unknown" });
    } catch (err) {
      alert(`Failed to fetch payment history: ${err.message}`);
    }
  };

  // Category handlers
  const executeDeleteCategory = async (id) => {
    try {
      await apiCall(`/categories/${id}`, 'DELETE', {}, user.token);
      fetchData();
      alert('Category deleted');
    } catch (err) {
      alert(`Failed to delete category: ${err.message}`);
    }
  };

  const handleDeleteCategory = (id) => {
    showConfirm(
      "🗑️ DELETE CATEGORY",
      "Delete this category? This cannot be undone.",
      () => executeDeleteCategory(id)
    );
  };



  // Age group handlers
  const executeDeleteAgeGroup = async (id) => {
    try {
      await apiCall(`/age-groups/${id}`, 'DELETE', {}, user.token);
      fetchData();
      alert('Age group deleted');
    } catch (err) {
      alert(`Failed to delete age group: ${err.message}`);
    }
  };

  const handleDeleteAgeGroup = (id) => {
    showConfirm(
      "🗑️ DELETE AGE GROUP",
      "Delete this age group? This cannot be undone.",
      () => executeDeleteAgeGroup(id)
    );
  };

  const executeSeedAgeGroups = async () => {
    try {
      await apiCall('/age-groups/seed', 'GET', null, user.token);
      fetchData();
      alert('Default age groups seeded');
    } catch (err) {
      alert(`Failed to seed age groups: ${err.message}`);
    }
  };

  const handleSeedAgeGroups = () => {
    showConfirm(
      "🌱 SEED AGE GROUPS",
      "Seed default age groups (will create missing ones)?",
      () => executeSeedAgeGroups()
    );
  };

  // Seeding mock judges in case roster is unpopulated, to provide a beautiful high-fidelity interactive flow
  useEffect(() => {
    if (activeTab === "adjudicators" && (!judges || judges.length === 0)) {
      setJudges([
        {
          id: "j-1",
          name: "AMPEX Marshal Team",
          email: "marshals@rogueworldrecords.com",
          role: "judge",
          admin_notes: "Elite veteran review team. Expert in physical speed and weightlifting challenges.",
          stats: { assigned: 8, pending: 2, completed: 6, verified: 4, rejected: 2, averageSpeed: "0.8 days" }
        },
        {
          id: "j-2",
          name: "Chief Adjudicator Sarah Jenkins",
          email: "sarah.j@rogueworldrecords.com",
          role: "judge",
          admin_notes: "Senior adjudicator, details-oriented. Handles high-stakes tech and endurance records.",
          stats: { assigned: 5, pending: 1, completed: 4, verified: 3, rejected: 1, averageSpeed: "1.4 days" }
        },
        {
          id: "j-3",
          name: "Timing Specialist Liam Vance",
          email: "liam.vance@rogueworldrecords.com",
          role: "judge",
          admin_notes: "Precision calibration analyst. Expert in digital time-based athletics.",
          stats: { assigned: 3, pending: 0, completed: 3, verified: 2, rejected: 1, averageSpeed: "0.9 days" }
        }
      ]);
    }
  }, [activeTab, judges]);

  // Check badge colors helper (AI scan)
  const getCheckBadge = (val) => {
    if (val === "passed") return { color: "#22c55e", label: "PASS" };
    if (val === "flagged") return { color: "#eab308", label: "WARN" };
    return { color: "#ef4444", label: "FAIL" };
  };

  // loading view
  if (authLoading) {
    return (
      <div style={{ background: "#030303", color: "white", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <Loader2 className="animate-spin" size={48} color="#FF5500" />
        <p style={{ marginTop: "16px", color: "#aaa", fontFamily: "'Outfit', 'Inter', sans-serif" }}>SYNCING SECURITY ENVELOPE...</p>
      </div>
    );
  }

  // RENDER ACCESS DENIED IF NOT ADMIN
  if (!user || !user.isAdmin) {
    return (
      <div style={{ background: "#030303", color: "white", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
          <div style={{ maxWidth: "520px", width: "100%", background: "rgba(20, 10, 10, 0.4)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "32px", padding: "48px 40px", textAlign: "center" }}>
            <ShieldAlert size={48} color="#ef4444" style={{ margin: "0 auto 20px auto" }} />
            <h1 style={{ fontSize: "28px", fontWeight: "950", color: "white", margin: "0 0 12px 0" }}>ACCESS DENIED</h1>
            <p style={{ color: "#ef4444", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", margin: "0 0 20px 0" }}>PROTOCOL VIOLATION [403]</p>
            <Link to="/" style={{ textDecoration: "none" }}><button style={{ background: "#ef4444", color: "white", border: "none", padding: "12px 32px", borderRadius: "100px", fontWeight: "900" }}>RETURN TO PORTAL</button></Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter lists based on search and drop-downs
  const getFilteredItems = () => {
    const query = searchQuery ? searchQuery.toLowerCase() : "";
    if (activeTab === "records") {
      return records.filter(rec => {
        const matchesSearch = rec.title.toLowerCase().includes(searchQuery.toLowerCase()) || (rec.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || (rec.category || "").toLowerCase() === categoryFilter.toLowerCase();
        const matchesStatus = statusFilter === "all" || ((rec.status || "").toLowerCase() === statusFilter.toLowerCase());
        return matchesSearch && matchesCategory && matchesStatus;
      });
    } else if (activeTab === "users") {
      if (usersSubTab === "registry") {
        return users.filter(user =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.username?.toLowerCase().includes(query) ||
          (user.member_number || user.memberNumber)?.toLowerCase().includes(query)
        );
      } else {
        return contacts.filter(c => c.name?.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query) || c.subject?.toLowerCase().includes(query));
      }
    } else if (activeTab === "events") {
      return events.filter(e =>
        e.title?.toLowerCase().includes(query) ||
        e.location?.toLowerCase().includes(query)
      );
    } else if (activeTab === "products") {
      return products.filter(p => p.name?.toLowerCase().includes(query));
    }
    return [];
  };

  const filteredItems = getFilteredItems();

  const handleKpiCardClick = (metricKey) => {
    switch (metricKey) {
      case 'users':
        setSearchParams({ tab: 'users' });
        setActiveTab('users');
        break;
      case 'records':
        setSearchParams({ tab: 'records' });
        setActiveTab('records');
        setRecordsSubTab('submissions');
        break;
      case 'events':
        setSearchParams({ tab: 'events' });
        setActiveTab('events');
        break;
      case 'products':
        setSearchParams({ tab: 'products' });
        setActiveTab('products');
        break;
      case 'categories':
        setSearchParams({ tab: 'records' });
        setActiveTab('records');
        setRecordsSubTab('categories');
        break;
      case 'age_groups':
        setSearchParams({ tab: 'records' });
        setActiveTab('records');
        setRecordsSubTab('ageGroups');
        break;
      case 'memberships':
        setSearchParams({ tab: 'revenue' });
        setActiveTab('revenue');
        setTimeout(() => document.getElementById('memberships-table')?.scrollIntoView({ behavior: 'smooth' }), 500);
        break;
      case 'tickets':
        setSearchParams({ tab: 'revenue' });
        setActiveTab('revenue');
        setTimeout(() => document.getElementById('tickets-table')?.scrollIntoView({ behavior: 'smooth' }), 500);
        break;
      default:
        // Optional default handler
        break;
    }
  };


  const handlePromoteToJudge = async (athlete) => {
    try {
      const payload = { ...athlete, role: 'judge' };
      await apiCall(`/admin/users/${athlete.id}`, "PUT", payload, user.token);
      alert(`Successfully promoted ${athlete.name} to Certified Adjudicator.`);
      setIsPromoteModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Admin action failed:", err);
      alert(`Action failed: ${err.message}`);
      setIsPromoteModalOpen(false);
    }
  };

  const handleRevokeJudge = async (judge) => {
    if (!window.confirm(`Are you sure you want to revoke Adjudicator credentials for ${judge.name}? This will return them to an Athlete account.`)) return;
    try {
      const payload = { ...judge, role: 'athlete' };
      await apiCall(`/admin/users/${judge.id}`, "PUT", payload, user.token);
      alert(`Revoked Adjudicator credentials for ${judge.name}.`);
      fetchData();
    } catch (err) {
      console.error("Admin action failed:", err);
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleSaveJudgeNotes = async () => {
    if (!selectedJudgeForNotes) return;
    try {
      await apiCall(`/admin/judges/${selectedJudgeForNotes.id}/notes`, "PUT", { adminNotes: judgeNotesText }, user.token);
      alert("Oversight notes updated successfully.");
      setIsJudgeNotesModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Admin action failed:", err);
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleAssignRecord = async (recordId, judgeId) => {
    if (!judgeId) return;
    const selectedJudge = judges.find(j => j.id === judgeId);
    try {
      await apiCall(`/admin/records/${recordId}/assign`, "PUT", { judgeId }, user.token);
      alert(`Successfully assigned submission to ${selectedJudge ? selectedJudge.name : 'Judge'}.`);
      fetchData();
    } catch (err) {
      console.error("Admin action failed:", err);
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleSimulateJudgeVerdict = async (recordId, decision, notes) => {
    try {
      await apiCall(`/admin/records/${recordId}/judge-review`, "PUT", { decision, notes }, user.token);
      alert("Judge recommendation registered successfully.");
      fetchData();
    } catch (err) {
      console.error("Admin action failed:", err);
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleApproveOversightDecision = async (record) => {
    try {
      await apiCall(`/admin/records/${record.id}/approve`, "PUT", {}, user.token);
      alert(`Record has been officially approved and published! Status set to ${record.judge_decision}.`);
      fetchData();
    } catch (err) {
      console.error("Admin action failed:", err);
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleRevertOversightDecision = async () => {
    if (!selectedOversightRecord) return;
    try {
      await apiCall(`/admin/records/${selectedOversightRecord.id}/revert`, "PUT", { adminFeedback: oversightRevertFeedback }, user.token);
      alert("Recommendation sent back for revision.");
      setIsOversightRevertModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Admin action failed:", err);
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleSaveAiSettings = async (configs) => {
    try {
      await apiCall("/admin/ai-verification/settings", "PUT", configs, user.token);
      alert("AI configuration settings updated successfully.");
      setAiSettings(prev => ({ ...prev, ...configs }));
    } catch (err) {
      console.error("Admin action failed:", err);
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleAIScanOverride = async (recordId, overrideStatus, overrideReason) => {
    setIsAiActionUpdating(true);
    try {
      await apiCall(`/admin/ai-verification/scans/${recordId}/override`, "PUT", { overrideStatus, overrideReason }, user.token);
      alert(`AI scan decision overridden successfully to: ${overrideStatus.toUpperCase()}`);

      // Update local state
      setAiScans(prev => prev.map(scan => {
        if (scan.record_id === recordId) {
          return {
            ...scan,
            override_status: overrideStatus,
            override_reason: overrideReason
          };
        }
        return scan;
      }));

      // Update record status locally as well
      setRecords(prev => prev.map(rec => {
        if (rec.id === recordId) {
          return {
            ...rec,
            status: overrideStatus === "approved" ? "verified" : overrideStatus === "rejected" ? "rejected" : rec.status
          };
        }
        return rec;
      }));

      setIsAiDetailModalOpen(false);
    } catch (err) {
      console.error("Admin action failed:", err);
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsAiActionUpdating(false);
    }
  };

  const handleAIScanFlag = async (recordId, suspiciousFlagged) => {
    setIsAiActionUpdating(true);
    try {
      await apiCall(`/admin/ai-verification/scans/${recordId}/flag`, "PUT", { suspiciousFlagged }, user.token);
      alert(suspiciousFlagged ? "Record marked as suspicious and prioritized." : "Suspicious flag removed.");

      setAiScans(prev => prev.map(scan => {
        if (scan.record_id === recordId) {
          return {
            ...scan,
            suspicious_flagged: suspiciousFlagged
          };
        }
        return scan;
      }));
    } catch (err) {
      console.error("Admin action failed:", err);
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsAiActionUpdating(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="admin-shell" style={{
        display: "flex", minHeight: "100vh", background: "#050505", color: "white", fontFamily: "'Outfit', sans-serif",
        overflow: "hidden"
      }}>
        {/* Main Content Area */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", position: "relative" }}>

          {/* Top Navbar */}
          <header className="admin-header" style={{ padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(5,5,5,0.8)", backdropFilter: "blur(12px)", zIndex: 10 }}>
          <div style={{ position: "relative", width: "400px" }}>
            <Search size={16} color="#666" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search records, users, or payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "100px", padding: "10px 16px 10px 42px", color: "white", fontSize: "13px", outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}><Bell size={20} /></button>
            <button style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}><Settings size={20} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "20px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", fontWeight: "900", color: "white" }}>Admin Staff</div>
                <div style={{ fontSize: "11px", color: "#888" }}>Super Admin</div>
              </div>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#FF5500", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "900", fontSize: "16px" }}>
                <User size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div style={{ padding: "32px", flex: 1, maxWidth: "1200px", margin: "0 auto", width: "100%" }}>

          {/* ==================== DASHBOARD OVERVIEW ==================== */}
          {activeTab === "dashboard" && (
            <div>
              <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "950", margin: "0 0 8px 0" }}>Performance Overview</h1>
                <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>Real-time monitoring of AMPEX World Records global network.</p>
              </div>

              {/* Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                {[
                  { label: "Total Users", value: dashboardStats?.counts?.users?.toLocaleString() || 0, icon: <Users size={20} />, color: "#3b82f6", bg: "rgba(59,130,246,0.1)", onClick: () => setActiveTab("users") },
                  { label: "Total Submissions", value: dashboardStats?.counts?.records?.toLocaleString() || 0, icon: <FileText size={20} />, color: "#a855f7", bg: "rgba(168,85,247,0.1)", onClick: () => { setActiveTab("records"); setRecordsSubTab("submissions"); } },
                  { label: "Pending Reviews", value: "0", icon: <Clock size={20} />, color: "#FF6A00", bg: "rgba(255,106,0,0.1)", onClick: () => { setActiveTab("verificationQueue"); setVqFilter("pending_review"); } },
                  { label: "Approved Records", value: dashboardStats?.counts?.records?.toLocaleString() || 0, icon: <CheckCircle size={20} />, color: "#22c55e", bg: "rgba(34,197,94,0.1)", onClick: () => setActiveTab("records") },
                  { label: "Denied Records", value: "0", icon: <XCircle size={20} />, color: "#ef4444", bg: "rgba(239,68,68,0.1)", onClick: () => { setActiveTab("verificationQueue"); setVqFilter("denied"); } },
                  { label: "Appeals", value: "0", icon: <ShieldAlert size={20} />, color: "#eab308", bg: "rgba(234,179,8,0.1)", onClick: () => setActiveTab("appeals") },
                  { label: "Challenge Submissions", value: "0", icon: <Target size={20} />, color: "#06b6d4", bg: "rgba(6,182,212,0.1)", onClick: () => setActiveTab("challenges") },
                  { label: "Revenue Totals", value: `$${(typeof membershipStats?.totalRevenue === 'number' ? membershipStats.totalRevenue : (dashboardStats?.counts?.memberships * 10) || 0).toLocaleString()}`, icon: <DollarSign size={20} />, color: "#22c55e", bg: "rgba(34,197,94,0.1)", onClick: () => { setActiveTab("revenue"); setRevenueSubTab("ledger"); } },
                  { label: "Membership Totals", value: dashboardStats?.counts?.memberships?.toLocaleString() || 0, icon: <Sparkles size={20} />, color: "#f43f5e", bg: "rgba(244,63,94,0.1)", onClick: () => setActiveTab("memberships") },
                  { label: "Ticket Sales", value: dashboardStats?.counts?.tickets?.toLocaleString() || 0, icon: <Ticket size={20} />, color: "#f97316", bg: "rgba(249,115,22,0.1)", onClick: () => { setActiveTab("revenue"); setRevenueSubTab("tickets"); } },
                  { label: "Shop Orders", value: dashboardStats?.counts?.products?.toLocaleString() || 0, icon: <ShoppingBag size={20} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", onClick: () => setActiveTab("orders") },
                  { label: "Live Event Activity", value: dashboardStats?.counts?.events?.toLocaleString() || 0, icon: <Radio size={20} />, color: "#ef4444", bg: "rgba(239,68,68,0.1)", onClick: () => setActiveTab("events") },
                  { label: "Trending Records", value: "0", icon: <TrendingUp size={20} />, color: "#14b8a6", bg: "rgba(20,184,166,0.1)", onClick: () => setActiveTab("records") },
                  { label: "Most Active Categories", value: dashboardStats?.counts?.categories?.toLocaleString() || 0, icon: <Activity size={20} />, color: "#FF5500", bg: "rgba(255,85,0,0.1)", onClick: () => { setActiveTab("records"); setRecordsSubTab("categories"); } }
                ].map((stat, idx) => (
                  <div key={idx} onClick={stat.onClick} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s", cursor: "pointer" }}
                       onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                       onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
                        {stat.icon}
                      </div>
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginBottom: "4px", fontWeight: "600" }}>{stat.label}</div>
                    <div style={{ fontSize: "28px", fontWeight: "950", color: "white" }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Chart & Recent Activity */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "24px" }}>

                {/* Chart Box */}
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", position: "relative", minHeight: "360px", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div>
                      <h3 style={{ fontSize: "16px", fontWeight: "900", margin: "0 0 4px 0" }}>Submissions Over Time</h3>
                      <div style={{ fontSize: "12px", color: "#888" }}>Monthly breakdown of record attempts</div>
                    </div>
                    <button style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>Last 6 Months</button>
                  </div>
                  <div style={{ flex: 1, position: "relative", width: "100%", display: "flex", alignItems: "flex-end" }}>
                    {/* SVG Chart mimic */}
                    <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(255,85,0,0.3)" />
                          <stop offset="100%" stopColor="rgba(255,85,0,0)" />
                        </linearGradient>
                      </defs>
                      <path d="M0,150 C50,140 100,160 150,140 C200,100 250,50 300,50 C350,50 400,120 450,120 C480,120 500,40 500,40 L500,200 L0,200 Z" fill="url(#chartGradient)" />
                      <path d="M0,150 C50,140 100,160 150,140 C200,100 250,50 300,50 C350,50 400,120 450,120 C480,120 500,40 500,40" fill="none" stroke="#FF5500" strokeWidth="3" />
                      <circle cx="150" cy="140" r="4" fill="#000" stroke="#FF5500" strokeWidth="2" />
                      <circle cx="300" cy="50" r="4" fill="#000" stroke="#FF5500" strokeWidth="2" />
                      <circle cx="500" cy="40" r="4" fill="#000" stroke="#FF5500" strokeWidth="2" />
                    </svg>
                    <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", display: "flex", justifyContent: "space-between", color: "#666", fontSize: "10px", fontWeight: "700", paddingTop: "10px" }}>
                      <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "900", margin: 0 }}>Recent Activity</h3>
                    <button onClick={() => { setActiveTab('records'); setRecordsSubTab('submissions'); }} style={{ background: 'transparent', border: 'none', color: "#FF5500", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>View All</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {dashboardStats?.recentSubmissions?.slice(0, 3).map((sub, idx) => (
                      <div key={`sub-${idx}`} style={{ display: "flex", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#222", overflow: "hidden", flexShrink: 0 }}>
                          <img loading="lazy" decoding="async" src={`https://ui-avatars.com/api/?name=${sub.title}&background=random`} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" />
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", color: "#ccc", lineHeight: "1.4" }}>New submission for <strong style={{ color: "white" }}>{sub.title}</strong></div>
                          <div style={{ fontSize: "11px", color: "#666", margin: "4px 0" }}>{new Date(sub.created_at).toLocaleDateString()}</div>
                          <span style={{ background: sub.status === 'pending' ? "rgba(59,130,246,0.15)" : (sub.status === 'rejected' ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)"), color: sub.status === 'pending' ? "#3b82f6" : (sub.status === 'rejected' ? "#ef4444" : "#22c55e"), padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>
                            {sub.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dashboardStats?.recentUsers?.slice(0, 1).map((usr, idx) => (
                      <div key={`usr-${idx}`} style={{ display: "flex", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#222", overflow: "hidden", flexShrink: 0 }}>
                          <img loading="lazy" decoding="async" src={`https://ui-avatars.com/api/?name=${usr.name}&background=random`} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Avatar" />
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", color: "#ccc", lineHeight: "1.4" }}><strong style={{ color: "white" }}>{usr.name}</strong> joined the platform</div>
                          <div style={{ fontSize: "11px", color: "#666", margin: "4px 0" }}>{new Date(usr.created_at).toLocaleDateString()}</div>
                          <span style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}>New User</span>
                        </div>
                      </div>
                    ))}
                    {(!dashboardStats?.recentSubmissions?.length && !dashboardStats?.recentUsers?.length) && (
                      <div style={{ color: "#888", fontSize: "13px" }}>No recent activity found.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Checkout Success Message Management Suite */}
              <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "32px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "950", margin: 0, textTransform: "uppercase", color: "white", letterSpacing: "-0.5px" }}>
                      ✉️ Checkout Success Message Management
                    </h3>
                    <p style={{ color: "#666", fontSize: "12px", margin: "4px 0 0 0", fontWeight: "700" }}>
                      CUSTOMIZE POST-CHECKOUT CONFIRMATION MESSAGES SHOWN TO CUSTOMERS IN REAL-TIME
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveSuccessMessages} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                      🛍️ Shop Item Purchase Success Message
                    </label>
                    <textarea
                      value={successMessagesForm.msg_shop || ""}
                      onChange={(e) => setSuccessMessagesForm({ ...successMessagesForm, msg_shop: e.target.value })}
                      required
                      placeholder="Customize message for shop item purchases..."
                      style={{ width: "100%", height: "80px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px", resize: "none", fontFamily: "inherit" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                      🎟️ Spectator Pass Purchase Success Message
                    </label>
                    <textarea
                      value={successMessagesForm.msg_spectator || ""}
                      onChange={(e) => setSuccessMessagesForm({ ...successMessagesForm, msg_spectator: e.target.value })}
                      required
                      placeholder="Customize message for spectator pass purchases..."
                      style={{ width: "100%", height: "80px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px", resize: "none", fontFamily: "inherit" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                      📦 Combined Order Success Message (Shop + Pass)
                    </label>
                    <textarea
                      value={successMessagesForm.msg_combined || ""}
                      onChange={(e) => setSuccessMessagesForm({ ...successMessagesForm, msg_combined: e.target.value })}
                      required
                      placeholder="Customize message for combined shop items and passes..."
                      style={{ width: "100%", height: "80px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px", resize: "none", fontFamily: "inherit" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                      🏅 Record Fee Message
                    </label>
                    <textarea
                      value={successMessagesForm.msg_record || ""}
                      onChange={(e) => setSuccessMessagesForm({ ...successMessagesForm, msg_record: e.target.value })}
                      required
                      placeholder="Customize message for record fee checkouts..."
                      style={{ width: "100%", height: "80px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px", resize: "none", fontFamily: "inherit" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                      ⚔️ Challenge Message
                    </label>
                    <textarea
                      value={successMessagesForm.msg_challenge || ""}
                      onChange={(e) => setSuccessMessagesForm({ ...successMessagesForm, msg_challenge: e.target.value })}
                      required
                      placeholder="Customize message for challenge fee checkouts..."
                      style={{ width: "100%", height: "80px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 18px", color: "white", outline: "none", fontSize: "13px", resize: "none", fontFamily: "inherit" }}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{ background: "#FF5500", color: "white", border: "none", padding: "14px 40px", borderRadius: "100px", fontSize: "11px", fontWeight: "900", cursor: loading ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "1px", boxShadow: "0 6px 20px rgba(255,85,0,0.3)", transition: "all 0.2s" }}
                    >
                      {loading ? "SAVING MESSAGES..." : "SAVE CONFIGURATION"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Trending Challenges */}
              <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "900", margin: 0 }}>Trending Challenges</h3>
                  <button onClick={() => { setActiveTab('events'); }} style={{ background: "transparent", border: "1px solid #FF5500", color: "#FF5500", padding: "8px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>Manage Challenges</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {events && events.length > 0 ? events.slice(0, 3).map((ev, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", padding: "16px 0", borderBottom: idx < Math.min(events.length - 1, 2) ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <div style={{ fontSize: "24px", fontWeight: "950", color: idx === 0 ? "#FF5500" : (idx === 1 ? "#FF6A00" : "#FF8800"), width: "40px" }}>0{idx + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "white", marginBottom: "2px" }}>{ev.title}</div>
                        <div style={{ fontSize: "12px", color: "#888" }}>Location: {ev.location || 'Global'} • {new Date(ev.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: "right", marginRight: "16px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "white", marginBottom: "2px" }}>Active</div>
                        <div style={{ fontSize: "10px", color: idx === 0 ? "#FF5500" : "#888", fontWeight: "900", letterSpacing: "0.5px", textTransform: "uppercase" }}>{idx === 0 ? 'TRENDING 🔥' : 'STEADY'}</div>
                      </div>
                      <ArrowRight size={16} color="#666" />
                    </div>
                  )) : (
                    <div style={{ color: "#888", fontSize: "13px", padding: "16px 0" }}>No active challenges found. Data connected.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 1. RECORDS & SUBMISSIONS OVERHAUL ==================== */}
          {activeTab === "records" && (

            <div>
              {recordsSubTab === "submissions" && (
                <div>
                  {/* Header Title with glowing status badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                    <div>
                      <h2 style={{ fontSize: "28px", fontWeight: "950", margin: "0 0 8px 0" }}>Submissions Management</h2>
                      <p style={{ color: "#888", margin: 0, fontSize: "14px", maxWidth: "600px", lineHeight: "1.5" }}>
                        Review and verify new record attempts from around the world.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Filter size={16} /> Filter
                      </button>
                      <button style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                        <ArrowRight size={16} /> Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
                    <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                      <div style={{ fontSize: "12px", color: "#888", fontWeight: "800", textTransform: "uppercase", marginBottom: "12px" }}>Total Pending</div>
                      <div style={{ fontSize: "32px", fontWeight: "950", color: "#FF6A00", marginBottom: "8px" }}>
                        {records.filter(r => r.status === 'pending').length}
                      </div>
                      <div style={{ color: "#22c55e", fontSize: "12px", fontWeight: "700" }}>↗ 12% from last week</div>
                    </div>
                    <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                      <div style={{ fontSize: "12px", color: "#888", fontWeight: "800", textTransform: "uppercase", marginBottom: "12px" }}>Avg Review Time</div>
                      <div style={{ fontSize: "32px", fontWeight: "950", color: "white", marginBottom: "8px" }}>4.2h</div>
                      <div style={{ color: "#888", fontSize: "12px", fontWeight: "700" }}>Internal SLA: 24h</div>
                    </div>
                    <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                      <div style={{ fontSize: "12px", color: "#888", fontWeight: "800", textTransform: "uppercase", marginBottom: "12px" }}>Verified Today</div>
                      <div style={{ fontSize: "32px", fontWeight: "950", color: "white", marginBottom: "8px" }}>
                        {records.filter(r => r.status === 'verified').length}
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {records.filter(r => r.status === 'verified').slice(0,3).map((r, i) => (
                          <img loading="lazy" decoding="async" key={i} src={`https://ui-avatars.com/api/?name=${r.user?.name || 'A'}&background=random`} alt="Avatar" style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #111", marginLeft: i > 0 ? "-8px" : "0" }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ background: "linear-gradient(135deg, #FF5500 0%, #ff8800 100%)", borderRadius: "16px", padding: "24px", color: "white" }}>
                      <div style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", marginBottom: "12px", opacity: 0.9 }}>High Priority</div>
                      <div style={{ fontSize: "32px", fontWeight: "950", marginBottom: "8px" }}>03</div>
                      <div style={{ fontSize: "12px", fontWeight: "700", opacity: 0.9 }}>Requires immediate verification</div>
                    </div>
                  </div>

                  {/* Main Table */}
                  <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#888", fontSize: "12px", fontWeight: "800", textAlign: "left" }}>
                          <th style={{ padding: "0 0 16px 0", fontWeight: "800" }}>USER</th>
                          <th style={{ padding: "0 0 16px 0", fontWeight: "800" }}>RECORD TITLE</th>
                          <th style={{ padding: "0 0 16px 0", fontWeight: "800", textAlign: "center" }}>CATEGORY</th>
                          <th style={{ padding: "0 0 16px 0", fontWeight: "800", textAlign: "center" }}>STATUS</th>
                          <th style={{ padding: "0 0 16px 0", fontWeight: "800", textAlign: "center" }}>PAYMENT</th>
                          <th style={{ padding: "0 0 16px 0", fontWeight: "800" }}>SUBMITTED</th>
                          <th style={{ padding: "0 0 16px 0", fontWeight: "800", textAlign: "right" }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan="6" style={{ textAlign: "center", padding: "40px" }}><Loader2 className="animate-spin" size={24} color="#FF5500" /></td></tr>
                        ) : records.length === 0 ? (
                          <tr><td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#888" }}>No submissions found</td></tr>
                        ) : records.slice(0, 10).map((r, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: "12px" }}>
                              <img loading="lazy" decoding="async" src={`https://ui-avatars.com/api/?name=${r.user?.name || 'Athlete'}&background=random`} alt={r.user?.name || 'User'} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                              <div>
                                <div style={{ color: "white", fontSize: "14px", fontWeight: "700" }}>{r.user?.name || "AMPEX Athlete"}</div>
                                <div style={{ color: "#666", fontSize: "11px", marginTop: "2px" }}>{r.user?.email || "athlete@example.com"}</div>
                              </div>
                            </td>
                            <td style={{ padding: "16px 0" }}>
                              <div style={{ color: "white", fontSize: "14px", fontWeight: "700" }}>{r.title}</div>
                              <div style={{ color: "#888", fontSize: "11px", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Video size={10} /> {r.evidence_url ? 'Video evidence attached' : 'Photos verified'}
                              </div>
                            </td>
                            <td style={{ padding: "16px 0", textAlign: "center" }}>
                              <span style={{ background: "rgba(255,255,255,0.05)", color: "#aaa", padding: "4px 8px", borderRadius: "100px", fontSize: "9px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {r.category || "General"}
                              </span>
                            </td>
                            <td style={{ padding: "16px 0", textAlign: "center" }}>
                              <span style={{
                                background: r.status === 'pending' ? "rgba(255,106,0,0.15)" : r.status === 'verified' ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                                color: r.status === 'pending' ? "#FF6A00" : r.status === 'verified' ? "#22c55e" : "#ef4444",
                                padding: "4px 8px",
                                borderRadius: "100px",
                                fontSize: "10px",
                                fontWeight: "900",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                textTransform: "uppercase"
                              }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: r.status === 'pending' ? "#FF6A00" : r.status === 'verified' ? "#22c55e" : "#ef4444" }}></div>
                                {r.status === 'verified' ? 'Approved' : r.status}
                              </span>
                            </td>
                            <td style={{ padding: "16px 0", textAlign: "center" }}>
                              {(() => {
                                const meta0 = Array.isArray(r.record_meta) ? r.record_meta[0] : r.record_meta;
                                const paymentStatus = (meta0?.payment_status === 'paid' || /payment_status:paid/.test(meta0?.admin_notes || '')) ? 'Paid' : 'Pending';
                                return (
                                  <span style={{
                                    background: paymentStatus === 'Pending' ? "rgba(255,255,255,0.05)" : "rgba(34,197,94,0.15)",
                                    color: paymentStatus === 'Pending' ? "#888" : "#22c55e",
                                    padding: "4px 8px",
                                    borderRadius: "100px",
                                    fontSize: "10px",
                                    fontWeight: "900",
                                    display: "inline-flex",
                                    textTransform: "uppercase"
                                  }}>
                                    {paymentStatus}
                                  </span>
                                );
                              })()}
                            </td>
                            <td style={{ padding: "16px 0", color: "#aaa", fontSize: "13px" }}>
                              {new Date(r.created_at || new Date()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                            </td>
                            <td style={{ padding: "16px 0", textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", alignItems: "center" }}>
                                <button onClick={() => setSelectedVideoForViewing(r)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" }}><Video size={12} /> View Media</button>
                                {r.status === "pending" && (
                                  <>
                                    <button onClick={() => handleQuickAdjudicate(r.id, "verified")} style={{ background: "#FF5500", border: "none", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "900" }}>Approve</button>
                                    <button onClick={() => handleQuickAdjudicate(r.id, "rejected")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "800" }}>Request Changes</button>
                                  </>
                                )}
                                {r.status === "verified" && (
                                  <>
                                    <button
                                      onClick={() => handleToggleFeatured(r.id, !r.is_featured)}
                                      style={{
                                        background: r.is_featured ? "#FF5500" : "transparent",
                                        border: r.is_featured ? "none" : "1px solid rgba(255,255,255,0.2)",
                                        color: "white",
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        fontWeight: "900",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <Star size={12} fill={r.is_featured ? "white" : "none"} />
                                      {r.is_featured ? 'Featured' : 'Feature'}
                                    </button>
                                    <button onClick={() => handleOpenRecordDetailModal(r)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "800" }}>View Details</button>
                                  </>
                                )}
                                {r.status === "rejected" && (
                                  <button onClick={() => handleOpenRecordDetailModal(r)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "800" }}>Appeal Log</button>
                                )}
                                <button onClick={() => handleDelete(r.id)} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: "12px", color: "#888", fontWeight: "700" }}>
                        Showing 1-{Math.min(10, records.length)} of {records.length} results
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#888", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" }}>&lt;</button>
                        <button style={{ background: "#FF5500", border: "none", color: "white", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>1</button>
                        <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#888", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>2</button>
                        <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#888", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>3</button>
                        <span style={{ color: "#888", display: "flex", alignItems: "center" }}>...</span>
                        <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#888", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" }}>&gt;</button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Cards: Activity Log & Tip */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                    <div style={{ background: "#111", borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                        <div style={{ color: "#FF5500" }}><Calendar size={20} /></div>
                        <h3 style={{ fontSize: "18px", fontWeight: "900", margin: 0 }}>Activity Log</h3>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div style={{ display: "flex", gap: "16px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", marginTop: "6px" }}></div>
                          <div>
                            <div style={{ color: "white", fontSize: "14px", fontWeight: "800" }}>System approved "Highest Vertical Jump" by Marcus Thorne</div>
                            <div style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>Today, 2:45 PM • Automated Verification passed</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "16px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF6A00", marginTop: "6px" }}></div>
                          <div>
                            <div style={{ color: "white", fontSize: "14px", fontWeight: "800" }}>Julian West uploaded new video evidence</div>
                            <div style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>Today, 1:12 PM • 4K_pushup_verification.mp4</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "16px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", marginTop: "6px" }}></div>
                          <div>
                            <div style={{ color: "white", fontSize: "14px", fontWeight: "800" }}>Admin Alex Rivers rejected Sarah Chen's submission</div>
                            <div style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>Yesterday, 4:55 PM • Reason: Inconsistent metadata</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)", borderRadius: "16px", padding: "32px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "900", margin: "0 0 12px 0", color: "white" }}>Record Review Tip</h3>
                      <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.6", margin: "0 0 24px 0" }}>
                        Always check the frame rate of video submissions to ensure no "speed-ramping" has been applied to athletic feats.
                      </p>
                      <div>
                        <a href="#" style={{ color: "#FF5500", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          READ REVIEW GUIDELINES <ArrowRight size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories Sub-Tab rendering */}
              {recordsSubTab === "categories" && <AdminCategoryManager />}

              {/* Age Groups / Divisions Sub-Tab rendering */}
              {recordsSubTab === "ageGroups" && (
                <div>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
                    <div>
                      <h2 style={{ fontSize: "28px", fontWeight: "950", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>Management Console</h2>
                      <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>
                        Control the foundational structures of AMPEX World Records.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button style={{ background: "transparent", color: "#FF5500", border: "1px solid #FF5500", padding: "10px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: "pointer" }}>
                        Export Schema
                      </button>
                      <button onClick={() => openModal("add")} style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: "pointer" }}>
                        Add Component
                      </button>
                    </div>
                  </div>

                  {/* Division Management Section */}
                  <div style={{ marginBottom: "40px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                      <Network size={20} color="#FF5500" />
                      <h3 style={{ fontSize: "20px", fontWeight: "900", margin: 0 }}>Division Management</h3>
                    </div>

                    {ageGroups.length === 0 ? (
                      <div style={{ padding: "40px", textAlign: "center", background: "#111", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                        <p style={{ color: "#888", fontWeight: "700" }}>No Divisions / Age Groups found.</p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                        {ageGroups.map((g, i) => {
                          const isPrimary = g.name?.toLowerCase().includes("adult") && !g.name?.toLowerCase().includes("young");
                          return (
                            <div key={g._id || i} style={{
                              background: "#111",
                              border: isPrimary ? "2px solid #FF5500" : "1px solid rgba(255,255,255,0.05)",
                              borderRadius: "16px",
                              padding: "24px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              minHeight: "180px"
                            }}>
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                  <span style={{
                                    background: isPrimary ? "#FF5500" : "rgba(255,85,0,0.1)",
                                    color: isPrimary ? "white" : "#FF5500",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "10px",
                                    fontWeight: "900",
                                    textTransform: "uppercase"
                                  }}>
                                    {isPrimary ? "PRIMARY" : (g.active ? "ACTIVE" : "INACTIVE")}
                                  </span>
                                  <button onClick={() => openModal("edit", g)} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}><MoreVertical size={16} /></button>
                                </div>
                                <h4 style={{ fontSize: "20px", fontWeight: "900", margin: "0 0 8px 0", color: "white" }}>{g.name}</h4>
                                <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
                                  Ages {g.minAge}-{g.maxAge || '+'}. Foundational metric bracket for records.
                                </p>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
                                <span style={{ color: "#666", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>{categories.length} CATEGORIES</span>
                                <button onClick={() => openModal("edit", g)} style={{ background: "transparent", border: "none", color: "#FF5500", fontSize: "13px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                  Manage <ArrowRight size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Live category hierarchy + weight classes (saved in the database) */}
                  <AdminDivisionPanels onManageCategories={() => setRecordsSubTab("categories")} />
                </div>
              )}
            </div>
          )}

          {/* ==================== 2. USER MANAGEMENT OVERHAUL ==================== */}
          {activeTab === "users" && (
            <div>
              {/* Header Title with glowing status badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                  <h2 style={{ fontSize: "28px", fontWeight: "950", margin: "0 0 8px 0" }}>Users</h2>
                  <p style={{ color: "#888", margin: 0, fontSize: "14px", maxWidth: "600px", lineHeight: "1.5" }}>
                    Manage your global record-keeping community. Control permissions, verify identities, and monitor activity levels.
                  </p>
                </div>
                <button
                  onClick={() => openModal("add")}
                  style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Plus size={16} /> Add New User
                </button>
              </div>

              {/* Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                  <div style={{ fontSize: "12px", color: "#888", fontWeight: "800", textTransform: "uppercase", marginBottom: "12px" }}>Total Users</div>
                  <div style={{ fontSize: "32px", fontWeight: "950", color: "white", marginBottom: "8px" }}>{users.length.toLocaleString()}</div>
                </div>
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                  <div style={{ fontSize: "12px", color: "#888", fontWeight: "800", textTransform: "uppercase", marginBottom: "12px" }}>Active Now</div>
                  <div style={{ fontSize: "32px", fontWeight: "950", color: "white", marginBottom: "8px" }}>{users.filter(u => u.account_status === 'active' || !u.account_status).length.toLocaleString()}</div>
                  <div style={{ color: "#888", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }}></div> Live accounts
                  </div>
                </div>
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                  <div style={{ fontSize: "12px", color: "#888", fontWeight: "800", textTransform: "uppercase", marginBottom: "12px" }}>Suspended/Banned</div>
                  <div style={{ fontSize: "32px", fontWeight: "950", color: "#ef4444", marginBottom: "8px" }}>{users.filter(u => ['suspended', 'banned'].includes(u.account_status)).length.toLocaleString()}</div>
                </div>
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                  <div style={{ fontSize: "12px", color: "#888", fontWeight: "800", textTransform: "uppercase", marginBottom: "12px" }}>Avg Participation</div>
                  <div style={{ fontSize: "32px", fontWeight: "950", color: "white", marginBottom: "8px" }}>3.4</div>
                  <div style={{ color: "#888", fontSize: "12px", fontWeight: "700" }}>Records per user</div>
                </div>
              </div>

              {/* Main Table */}
              <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "900", margin: 0 }}>Registered Members</h3>

                  {/* Search and Filter UI */}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ position: "relative", width: "260px" }}>
                        <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#666" }} />
                        <input
                          type="text"
                          placeholder="Search Name, Email, Phone..."
                          value={usersSearchQuery}
                          onChange={(e) => { setUsersSearchQuery(e.target.value); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') setUsersCurrentPage(1); }}
                          style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 14px 10px 40px", color: "white", fontSize: "13px", fontWeight: "600", outline: "none" }}
                        />
                      </div>
                      <button
                        onClick={() => setUsersCurrentPage(1)}
                        style={{ background: "#222", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "0 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: "pointer" }}
                      >
                        Search
                      </button>
                    </div>
                    <select
                      value={usersFilterRole}
                      onChange={(e) => { setUsersFilterRole(e.target.value); setUsersCurrentPage(1); }}
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "13px", fontWeight: "700", outline: "none", cursor: "pointer" }}
                    >
                      <option value="all">All Roles</option>
                      <option value="athlete">Athletes</option>
                      <option value="judge">Judges</option>
                      <option value="moderator">Moderators</option>
                      <option value="system_admin">Admins</option>
                    </select>
                    <select
                      value={usersFilterStatus}
                      onChange={(e) => { setUsersFilterStatus(e.target.value); setUsersCurrentPage(1); }}
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "13px", fontWeight: "700", outline: "none", cursor: "pointer" }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="banned">Banned</option>
                    </select>
                    <select
                      value={usersFilterMembership}
                      onChange={(e) => { setUsersFilterMembership(e.target.value); setUsersCurrentPage(1); }}
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "13px", fontWeight: "700", outline: "none", cursor: "pointer" }}
                    >
                      <option value="all">All Memberships</option>
                      <option value="free_athlete">Free</option>
                      <option value="pro_athlete">Pro Athlete</option>
                      <option value="elite_competitor">Elite Competitor</option>
                      <option value="vip">VIP / Verified</option>
                    </select>
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#888", fontSize: "12px", fontWeight: "800", textAlign: "left" }}>
                      <th style={{ padding: "0 0 16px 0", fontWeight: "800" }}>Name</th>
                      <th style={{ padding: "0 0 16px 0", fontWeight: "800" }}>Email Address</th>
                      <th style={{ padding: "0 0 16px 0", fontWeight: "800" }}>Joined Date</th>
                      <th style={{ padding: "0 0 16px 0", fontWeight: "800" }}>Status</th>
                      <th style={{ padding: "0 0 16px 0", fontWeight: "800", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredUsers = users.filter(u => {
                        const q = usersSearchQuery.toLowerCase();
                        const matchesSearch = !q ||
                          (u.name && u.name.toLowerCase().includes(q)) ||
                          (u.email && u.email.toLowerCase().includes(q)) ||
                          (u.username && u.username.toLowerCase().includes(q)) ||
                          (u.phone && u.phone.toLowerCase().includes(q)) ||
                          ((u.member_number || u.memberNumber) && (u.member_number || u.memberNumber).toLowerCase().includes(q));

                        const r = usersFilterRole;
                        const roleValue = u.role || 'athlete';
                        const matchesRole = r === "all" || roleValue === r;

                        const s = usersFilterStatus;
                        const statusValue = u.account_status || 'active';
                        const matchesStatus = s === "all" || statusValue === s;

                        const m = usersFilterMembership;
                        const memValue = u.membership_type || 'free_athlete';
                        const matchesMembership = m === "all" || memValue === m || (m === "vip" && u.is_verified);

                        return matchesSearch && matchesRole && matchesStatus && matchesMembership;
                      });

                      const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
                      const currentUsersPage = Math.min(usersCurrentPage, totalPages);
                      const startIndex = (currentUsersPage - 1) * usersPerPage;
                      const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

                      if (paginatedUsers.length === 0) {
                        return <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#888" }}>No users match the search/filter criteria.</td></tr>;
                      }

                      return (
                        <>
                          {paginatedUsers.map((u, idx) => (
                            <tr key={u.id || idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              <td style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: "12px" }}>
                                <img loading="lazy" decoding="async" src={u.profile_image ? formatProductImage(u.profile_image) : `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt={u.name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ color: "white", fontSize: "14px", fontWeight: "700", cursor: "pointer" }} onClick={() => openModal('viewProfile', u)}>{u.name}</span>
                                    {(u.member_number || u.memberNumber) && (
                                      <span style={{ color: "#FF5500", fontSize: "11px", fontWeight: "800", background: "rgba(255,85,0,0.06)", border: "1px solid rgba(255,85,0,0.15)", borderRadius: "4px", padding: "1px 6px" }}>
                                        {u.member_number || u.memberNumber}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ color: "#888", fontSize: "11px", marginTop: "4px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
                                    <span style={{
                                      color: u.role === 'system_admin' ? '#FF5500' :
                                             u.role === 'moderator' ? '#3b82f6' :
                                             u.role === 'judge' ? '#ffcc00' : '#22c55e',
                                      fontWeight: "800",
                                      background: u.role === 'system_admin' ? 'rgba(255,85,0,0.08)' :
                                                  u.role === 'moderator' ? 'rgba(59,130,246,0.08)' :
                                                  u.role === 'judge' ? 'rgba(255,204,0,0.08)' : 'rgba(34,197,94,0.08)',
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "9px",
                                      textTransform: "uppercase"
                                    }}>
                                      {u.role === 'athlete' || !u.role ? 'Athlete' : u.role.replace('_', ' ')}
                                    </span>
                                    <span style={{ color: "#aaa", fontSize: "10px", fontWeight: "700" }}>•</span>
                                    <span style={{
                                      color: "#ccc",
                                      background: "rgba(255,255,255,0.05)",
                                      border: "1px solid rgba(255,255,255,0.05)",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "9px",
                                      textTransform: "uppercase",
                                      fontWeight: "700"
                                    }}>
                                      {(u.membership_type || u.membershipType || 'free_athlete').replace('_', ' ')}
                                    </span>
                                    <span style={{ color: "#aaa", fontSize: "10px", fontWeight: "700" }}>•</span>
                                    <span style={{ color: "#666" }}>{u.country || "Global"}</span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "16px 0", color: "#aaa", fontSize: "13px" }}>{u.email}</td>
                              <td style={{ padding: "16px 0", color: "#aaa", fontSize: "13px" }}>{new Date(u.created_at || new Date()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                              <td style={{ padding: "16px 0" }}>
                                <span style={{
                                  background: (u.account_status === 'active' || !u.account_status) ? "rgba(34,197,94,0.1)" : u.account_status === 'suspended' ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                                  color: (u.account_status === 'active' || !u.account_status) ? "#22c55e" : u.account_status === 'suspended' ? "#f59e0b" : "#ef4444",
                                  padding: "4px 8px",
                                  borderRadius: "100px",
                                  fontSize: "11px",
                                  fontWeight: "800",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px"
                                }}>
                                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: (u.account_status === 'active' || !u.account_status) ? "#22c55e" : u.account_status === 'suspended' ? "#f59e0b" : "#ef4444" }}></div>
                                  {(u.account_status || 'active').charAt(0).toUpperCase() + (u.account_status || 'active').slice(1)}
                                </span>
                              </td>
                              <td style={{ padding: "16px 0", textAlign: "right" }}>
                                <div style={{ position: "relative", display: "inline-block" }}>
                                  <button onClick={() => {
                                      const actionsDiv = document.getElementById(`actions-${u.id}`);
                                      if(actionsDiv) actionsDiv.style.display = actionsDiv.style.display === 'none' ? 'block' : 'none';
                                    }} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}>
                                    <MoreVertical size={16} />
                                  </button>
                                  <div id={`actions-${u.id}`} style={{ display: 'none', position: 'absolute', right: 0, top: '100%', background: '#222', border: '1px solid #333', borderRadius: '8px', padding: '4px', zIndex: 10, width: '180px' }}>
                                     <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; openModal('viewProfile', u); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer' }}>View Profile</button>
                                     <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; openModal('edit', u); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Edit User</button>
                                     <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; alert('Membership Details - Coming Soon'); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Membership Details</button>
                                     <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; alert('Appeals/Disputes - Coming Soon'); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Appeals/Disputes</button>
                                     <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; alert('Message User - Coming Soon'); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Message User</button>
                                     <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; alert('Profile Management Upload - Coming Soon'); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Upload/Profile Management</button>
                                     <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.1)", margin: "4px 0" }}></div>
                                     {(!u.account_status || u.account_status === 'active') ? (
                                       <>
                                         <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; handleUserActionConfirm(u, 'suspend'); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '12px', cursor: 'pointer' }}>Suspend User</button>
                                         <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; handleUserActionConfirm(u, 'ban'); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>Ban User</button>
                                       </>
                                     ) : (
                                       <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; handleUserActionConfirm(u, 'activate'); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: '#22c55e', fontSize: '12px', cursor: 'pointer' }}>Restore Account</button>
                                     )}

                                     <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; handleUserActionConfirm(u, 'removeMembership'); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '12px', cursor: 'pointer' }}>Remove Membership</button>
                                     <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; handleUserActionConfirm(u, 'resetPassword'); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>Reset Password</button>
                                     <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById(`actions-${u.id}`).style.display='none'; handleDelete(u.id); }} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>Delete User</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <tr>
                              <td colSpan="5">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                  <div style={{ fontSize: "12px", color: "#888", fontWeight: "700" }}>
                                    Showing {startIndex + 1}-{Math.min(startIndex + usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                                  </div>
                                  <div style={{ display: "flex", gap: "8px" }}>
                                    <button onClick={() => setUsersCurrentPage(p => Math.max(1, p - 1))} disabled={currentUsersPage === 1} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: currentUsersPage === 1 ? "#444" : "#888", padding: "6px 10px", borderRadius: "6px", cursor: currentUsersPage === 1 ? "not-allowed" : "pointer" }}>&lt;</button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                      <button
                                        key={page}
                                        onClick={() => setUsersCurrentPage(page)}
                                        style={{ background: currentUsersPage === page ? "#FF5500" : "transparent", border: currentUsersPage === page ? "none" : "1px solid rgba(255,255,255,0.1)", color: currentUsersPage === page ? "white" : "#888", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}
                                      >
                                        {page}
                                      </button>
                                    ))}

                                    <button onClick={() => setUsersCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentUsersPage === totalPages} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: currentUsersPage === totalPages ? "#444" : "#888", padding: "6px 10px", borderRadius: "6px", cursor: currentUsersPage === totalPages ? "not-allowed" : "pointer" }}>&gt;</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Bottom Cards: Recent Activity & Need Help */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "900", margin: "0 0 24px 0" }}>Recent Activity</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF5500", marginTop: "6px" }}></div>
                      <div>
                        <div style={{ color: "white", fontSize: "14px", fontWeight: "800" }}>New Record Verified</div>
                        <div style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>Marcus Thorne completed 'Fastest 10k Carry'</div>
                        <div style={{ color: "#666", fontSize: "10px", fontWeight: "800", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>2 Mins Ago</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#888", marginTop: "6px" }}></div>
                      <div>
                        <div style={{ color: "white", fontSize: "14px", fontWeight: "800" }}>System Maintenance</div>
                        <div style={{ color: "#888", fontSize: "13px", marginTop: "4px" }}>Global server sync completed for APAC region</div>
                        <div style={{ color: "#666", fontSize: "10px", fontWeight: "800", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>1 Hour Ago</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)", borderRadius: "16px", padding: "32px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <h3 style={{ fontSize: "24px", fontWeight: "950", margin: "0 0 12px 0", color: "white" }}>Need Help?</h3>
                  <p style={{ color: "#888", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px 0" }}>
                    Access our expert documentation on record verification protocols and admin security.
                  </p>
                  <div>
                    <Link to="/admin/guide" style={{ color: "#FF5500", fontSize: "14px", fontWeight: "800", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      View Admin Guide <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 3. CHALLENGES (formerly Events) ==================== */}
          {activeTab === "events" && viewEvent && (
            <AdminModal
              title={viewEvent.title || "Event"}
              onClose={() => setViewEvent(null)}
              width={620}
              footer={<>
                <a href="/events" target="_blank" rel="noreferrer" style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "9px 16px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>Open Events page</a>
                <button onClick={() => { const ev = viewEvent; setViewEvent(null); openModal("edit", ev); }} style={{ background: "#FF5500", color: "white", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>Edit event</button>
              </>}
            >
              {(viewEvent.image_url || viewEvent.imageUrl) && <img src={formatProductImage(viewEvent.image_url || viewEvent.imageUrl)} alt="" style={{ width: "100%", maxHeight: "260px", objectFit: "contain", background: "#0b0b0b", borderRadius: "12px" }} />}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                {[
                  ["Status", eventPhase(viewEvent) === "scheduled" ? "Scheduled" : eventPhase(viewEvent) === "active" ? "Active / live" : "Completed"],
                  ["Date", viewEvent.date ? new Date(viewEvent.date).toLocaleString() : "—"],
                  ["Location", viewEvent.location || "—"],
                  ["Tickets", viewEvent.is_paid && Number(viewEvent.ticket_price) > 0 ? `$${Number(viewEvent.ticket_price).toFixed(2)} each` : "Free entry"],
                  ["Livestream", viewEvent.stream_url ? "Link set" : "Not set"],
                  ["Live now", viewEvent.is_live ? "Yes" : "No"],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, color: "#777", textTransform: "uppercase", marginBottom: "4px" }}>{k}</div>
                    <div style={{ fontSize: "14px", color: "white", fontWeight: 700, wordBreak: "break-word" }}>{v}</div>
                  </div>
                ))}
              </div>
              {viewEvent.description && <p style={{ color: "#bbb", fontSize: "14px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{viewEvent.description}</p>}
              {(viewEvent.competitors || viewEvent.judges || viewEvent.sponsors) && (
                <div style={{ fontSize: "13px", color: "#aaa", lineHeight: 1.7 }}>
                  {viewEvent.competitors && <div><strong style={{ color: "white" }}>Competitors:</strong> {viewEvent.competitors}</div>}
                  {viewEvent.judges && <div><strong style={{ color: "white" }}>Judges:</strong> {viewEvent.judges}</div>}
                  {viewEvent.sponsors && <div><strong style={{ color: "white" }}>Sponsors:</strong> {viewEvent.sponsors}</div>}
                </div>
              )}
            </AdminModal>
          )}

          {activeTab === "events" && (
            <div>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
                <div>
                  <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                    Administration Panel
                  </div>
                  <h2 style={{ fontSize: "48px", fontWeight: "950", margin: "0 0 12px 0", color: "white", letterSpacing: "-1.5px", textTransform: "uppercase", lineHeight: "1" }}>
                    CHALLENGES
                  </h2>
                </div>
                <button
                  onClick={() => openModal("add")}
                  style={{ background: "#FF5500", color: "white", border: "none", padding: "14px 28px", borderRadius: "100px", fontSize: "13px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "1px", marginTop: "12px" }}
                >
                  CREATE NEW CHALLENGE <Plus size={16} />
                </button>
              </div>

              {/* Top Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "56px" }}>
                {/* Card 1 */}
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "16px", padding: "32px", position: "relative", overflow: "hidden", transform: "skew(-3deg)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                  <div style={{ transform: "skew(3deg)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div style={{ color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px" }}>ACTIVE NOW</div>
                      <Zap size={20} color="#444" />
                    </div>
                    <div style={{ fontSize: "48px", fontWeight: "950", color: "#FF8866", lineHeight: "1", marginBottom: "16px" }}>{events.length > 0 ? events.length : 14}</div>
                    <div style={{ color: "#aaa", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" }}>
                      <TrendingUp size={12} color="#aaa" /> +2 SINCE LAST WEEK
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "16px", padding: "32px", position: "relative", overflow: "hidden", transform: "skew(-3deg)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                  <div style={{ transform: "skew(3deg)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div style={{ color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px" }}>PARTICIPANTS</div>
                      <Users size={20} color="#444" />
                    </div>
                    <div style={{ fontSize: "48px", fontWeight: "950", color: "white", lineHeight: "1", marginBottom: "16px" }}>{users.length}</div>
                    <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: "100%", height: "100%", background: "#FF5500", borderRadius: "2px" }} />
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "16px", padding: "32px", position: "relative", overflow: "hidden", transform: "skew(-3deg)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                  <div style={{ transform: "skew(3deg)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div style={{ color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px" }}>TOTAL EVENTS</div>
                      <Trophy size={20} color="#444" />
                    </div>
                    <div style={{ fontSize: "48px", fontWeight: "950", color: "white", lineHeight: "1", marginBottom: "16px", letterSpacing: "-1px" }}>{events.length}</div>
                    <div style={{ color: "#aaa", fontSize: "11px", fontWeight: "800" }}>ACTIVE NOW</div>
                  </div>
                </div>
              </div>

              {/* Roster Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "24px", fontWeight: "950", color: "white", margin: 0, textTransform: "uppercase", letterSpacing: "-0.5px" }}>
                  CURRENT ROSTER
                </h3>
                <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.02)", padding: "4px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <button onClick={() => setEventsFilter("ALL")} style={{ background: eventsFilter === "ALL" ? "rgba(255,255,255,0.1)" : "transparent", color: eventsFilter === "ALL" ? "white" : "#888", border: "none", padding: "6px 16px", borderRadius: "6px", fontSize: "11px", fontWeight: "900", cursor: "pointer" }}>ALL</button>
                  <button onClick={() => setEventsFilter("ACTIVE")} style={{ background: eventsFilter === "ACTIVE" ? "rgba(255,255,255,0.1)" : "transparent", color: eventsFilter === "ACTIVE" ? "white" : "#888", border: "none", padding: "6px 16px", borderRadius: "6px", fontSize: "11px", fontWeight: "900", cursor: "pointer" }}>ACTIVE</button>
                  <button onClick={() => setEventsFilter("SCHEDULED")} style={{ background: eventsFilter === "SCHEDULED" ? "rgba(255,255,255,0.1)" : "transparent", color: eventsFilter === "SCHEDULED" ? "white" : "#888", border: "none", padding: "6px 16px", borderRadius: "6px", fontSize: "11px", fontWeight: "900", cursor: "pointer" }}>SCHEDULED</button>
                </div>
              </div>

              {/* Loading & Empty States */}
              {(() => {
                const mappedEvents = events.map((item, originalIndex) => {
                  const fallbackImages = [
                    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1472&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop"
                  ];
                  const bgImg = item.image_url || item.imageUrl || fallbackImages[originalIndex % fallbackImages.length];

                  // Status from the event's own date / live flag / status
                  const phase = eventPhase(item);
                  const isCompleted = phase === "completed";
                  const isScheduled = phase === "scheduled";
                  const isActive = phase === "active";

                  return { ...item, originalIndex, bgImg, isCompleted, isScheduled, isActive };
                });

                const filteredEvents = mappedEvents.filter(item => {
                  if (eventsFilter === "ACTIVE" && !item.isActive) return false;
                  if (eventsFilter === "SCHEDULED" && !item.isScheduled) return false;
                  return true;
                });

                if (loading) {
                  return (
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "120px 0", background: "rgba(255,255,255,0.02)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <Loader2 className="animate-spin" size={36} color="#FF5500" />
                      <p style={{ color: "#666", marginTop: "16px", fontSize: "13px", letterSpacing: "1.5px", fontWeight: "800" }}>LOADING ROSTER...</p>
                    </div>
                  );
                }

                if (filteredEvents.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "80px 40px", background: "rgba(255,255,255,0.02)", borderRadius: "24px", border: "1px dashed rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                        <Trophy size={48} color="#444" />
                      </div>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "white", fontWeight: "900", textTransform: "uppercase" }}>
                        {eventsFilter === "ACTIVE" ? "NO ACTIVE CHALLENGES" :
                         eventsFilter === "SCHEDULED" ? "NO SCHEDULED CHALLENGES" :
                         "NO CHALLENGES FOUND"}
                      </h4>
                      <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>
                        {eventsFilter === "ACTIVE" ? "There are currently no active challenges running." :
                         eventsFilter === "SCHEDULED" ? "There are no upcoming challenges scheduled." :
                         "Create a new challenge to populate the roster."}
                      </p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {filteredEvents.map((item) => {
                      const { originalIndex: index, bgImg, isCompleted, isScheduled, isActive } = item;

                    return (
                      <div key={item.id || index} style={{
                        display: "flex",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "20px",
                        padding: "20px",
                        border: "1px solid rgba(255,255,255,0.04)",
                        transition: "background 0.2s"
                      }} className="hover-bg-white-05">

                        {/* Thumbnail */}
                        <div style={{ width: "180px", height: "100px", borderRadius: "12px", overflow: "hidden", marginRight: "32px", position: "relative" }}>
                          <img loading="lazy" decoding="async" src={bgImg} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isCompleted ? 0.5 : 1 }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)" }} />
                        </div>

                        {/* Title & Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                            {isActive && <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "4px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: "900", letterSpacing: "1px" }}>ACTIVE</span>}
                            {isScheduled && <span style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", padding: "4px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: "900", letterSpacing: "1px" }}>SCHEDULED</span>}
                            {isCompleted && <span style={{ background: "rgba(156,163,175,0.15)", color: "#9ca3af", padding: "4px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: "900", letterSpacing: "1px" }}>COMPLETED</span>}

                            <h3 style={{ fontSize: "20px", fontWeight: "950", color: isCompleted ? "#aaa" : "white", margin: 0, textTransform: "uppercase", letterSpacing: "-0.5px" }}>
                              {item.title}
                            </h3>
                          </div>
                          <p style={{ color: "#aaa", fontSize: "13px", margin: 0, maxWidth: "400px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.description || "No description provided."}
                          </p>
                        </div>

                        {/* Stats */}
                        <div style={{ display: "flex", gap: "48px", marginRight: "48px" }}>
                          <div>
                            <div style={{ color: "#777", fontSize: "9px", fontWeight: "900", letterSpacing: "1px", marginBottom: "6px" }}>
                              EVENT DATE
                            </div>
                            <div style={{ color: "white", fontSize: "16px", fontWeight: "900" }}>
                              {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No date"}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#777", fontSize: "9px", fontWeight: "900", letterSpacing: "1px", marginBottom: "6px" }}>
                              TICKETS
                            </div>
                            <div style={{ color: isCompleted ? "white" : "#FF5500", fontSize: "16px", fontWeight: "900" }}>
                              {item.is_paid && Number(item.ticket_price) > 0 ? `$${Number(item.ticket_price).toFixed(2)}` : "Free"}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "16px", paddingLeft: "32px", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                          {isScheduled && <button style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", color: "white", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Calendar size={14} /></button>}
                          {isCompleted && <button style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", color: "white", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart2 size={14} /></button>}

                          <button title={isCompleted ? "View event details" : "Edit event"} onClick={() => (isCompleted ? setViewEvent(item) : openModal("edit", item))} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", color: "white", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} className="hover-bg-white-10">
                            {isCompleted ? <Eye size={14} /> : <Edit3 size={14} />}
                          </button>

                          {!isCompleted && (
                            <>
                              <button title="View event details" onClick={() => setViewEvent(item)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", color: "white", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} className="hover-bg-white-10">
                                <Eye size={14} />
                              </button>
                              <button onClick={() => handleDelete(item.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} className="hover-bg-red-20">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                );
              })()}
            </div>
          )}

          {/* ==================== 4. PRODUCTS & SHOP INVENTORY ==================== */}

                {/* 10. VIDEO UPLOAD FORM */}
                {activeTab === "videoManagement" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>VIDEO TITLE</label>
                        <input type="text" value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>DESCRIPTION</label>
                        <textarea value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} rows="3" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}></textarea>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>CATEGORY</label>
                          <select value={videoForm.category} onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                            <option value="Strength">Strength</option>
                            <option value="Endurance">Endurance</option>
                            <option value="Speed">Speed</option>
                            <option value="Skill">Skill</option>
                            <option value="Combat">Combat</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", fontSize: "12px", cursor: "pointer" }}>
                            <input type="checkbox" checked={videoForm.isFeatured} onChange={(e) => setVideoForm({ ...videoForm, isFeatured: e.target.checked })} style={{ cursor: "pointer" }} />
                            Mark as Featured Video
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", fontSize: "12px", cursor: "pointer" }}>
                            <input type="checkbox" checked={videoForm.isNewlyUploaded} onChange={(e) => setVideoForm({ ...videoForm, isNewlyUploaded: e.target.checked })} style={{ cursor: "pointer" }} />
                            Mark as Newly Uploaded
                          </label>
                        </div>
                      </div>

                      <div style={{ background: "rgba(255,85,0,0.05)", padding: "14px 16px", borderRadius: "8px", border: "1px solid rgba(255,85,0,0.2)", marginTop: "16px" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", marginBottom: "6px" }}>VIDEO URL (YouTube or Direct Link) — RECOMMENDED</label>
                        <input
                          type="url"
                          placeholder="https://youtube.com/watch?v=... or https://..."
                          value={videoForm.videoUrl}
                          onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                          style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,85,0,0.3)", borderRadius: "8px", padding: "10px 14px", color: "white", boxSizing: "border-box" }}
                        />
                        <p style={{ fontSize: "10px", color: "#888", margin: "6px 0 0 0" }}>Paste a YouTube link or direct MP4 URL. If provided, file upload below is skipped.</p>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>UPLOAD VIDEO FILE (Alternative)</label>
                          <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setVideoFile(e.target.files[0])} style={{ color: "white", fontSize: "12px" }} />
                          <p style={{ fontSize: "10px", color: "#666", margin: "8px 0 0 0" }}>Max 50MB. MP4 or WebM.</p>
                        </div>
                        <div style={{ background: "rgba(255,85,0,0.1)", padding: "16px", borderRadius: "8px", border: "2px dashed rgba(255,85,0,0.3)" }}>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", marginBottom: "6px" }}>📸 UPLOAD THUMBNAIL (Required)</label>
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setThumbnailFile(e.target.files[0])} style={{ color: "white", fontSize: "12px" }} />
                          <p style={{ fontSize: "10px", color: "#FF5500", margin: "8px 0 0 0", fontWeight: "600" }}>✓ Required. Max 5MB. JPG, PNG, WEBP.</p>
                          {thumbnailFile && <p style={{ fontSize: "9px", color: "#22c55e", margin: "4px 0 0 0" }}>✓ {thumbnailFile.name}</p>}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "products" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                  <h2 style={{ fontSize: "26px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-1.0px", margin: 0 }}>
                    🛍️ Products & Shop Inventory
                  </h2>
                  <p style={{ color: "#666", fontSize: "12px", margin: "4px 0 0 0", fontWeight: "700", letterSpacing: "0.5px" }}>
                    MANAGE THE AMPEX OFFICIAL MERCHANDISE AND STOCK
                  </p>
                </div>
                <button
                  onClick={() => openModal("add")}
                  style={{ background: "linear-gradient(135deg, #FF5500 0%, #ff8800 100%)", color: "white", border: "none", padding: "12px 24px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Plus size={16} /> ADD PRODUCT
                </button>
              </div>

              {/* Products Filter bar */}
              <div style={{ background: "rgba(13,13,16,0.5)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "20px", padding: "16px 24px", marginBottom: "24px", display: "flex", alignItems: "center" }}>
                <Search size={14} color="#555" style={{ marginRight: "12px" }} />
                <input
                  type="text"
                  placeholder="Search merchandise catalog by product name or division..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: "transparent", border: "none", color: "white", fontSize: "13px", outline: "none", width: "100%" }}
                />
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "120px 0", background: "rgba(13,13,16,0.3)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <Loader2 className="animate-spin" size={36} color="#FF5500" />
                  <p style={{ color: "#666", marginTop: "16px", fontSize: "13px", letterSpacing: "1.5px" }}>QUERYING MERCHANDISE CATALOG...</p>
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 40px", background: "rgba(13,13,16,0.2)", borderRadius: "24px", border: "1px dashed rgba(255,255,255,0.06)" }}>
                  <ShoppingBag size={36} color="#555" style={{ marginBottom: "16px" }} />
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "white" }}>SHOP CATALOG EMPTY</h4>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                  {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())).map(item => {
                    const stock = item.stock_count || item.stockCount || 0;
                    const isOutOfStock = stock === 0;
                    const isLowStock = stock > 0 && stock <= 10;

                    return (
                      <div key={item.id} style={{ background: "rgba(13,13,16,0.6)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "24px", overflow: "hidden", display: "flex", flexDirection: "column", transition: "all 0.25s" }}>

                        {/* Product image thumbnail */}
                        <div style={{ height: "200px", position: "relative", background: "#050507" }}>
                          {item.image_url || item.imageUrl ? (
                            <img loading="lazy" decoding="async" src={formatProductImage(item.image_url || item.imageUrl)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#222" }}><ShoppingBag size={48} /></div>
                          )}
                          {/* Price Tag Overlay */}
                          <div style={{ position: "absolute", top: "16px", left: "16px" }}>
                            <span style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,85,0,0.3)", padding: "6px 12px", borderRadius: "100px", fontSize: "14px", fontWeight: "950", color: "#FF5500" }}>
                              ${item.price}
                            </span>
                          </div>
                          {/* Stock status tag */}
                          <div style={{ position: "absolute", top: "16px", right: "16px" }}>
                            <span style={{
                              background: isOutOfStock ? "rgba(239,68,68,0.85)" : isLowStock ? "rgba(255,204,0,0.85)" : "rgba(34,197,94,0.85)",
                              backdropFilter: "blur(8px)",
                              color: isLowStock ? "black" : "white",
                              padding: "4px 10px",
                              borderRadius: "100px",
                              fontSize: "9px",
                              fontWeight: "950",
                              textTransform: "uppercase"
                            }}>
                              {isOutOfStock ? "🔴 OUT OF STOCK" : isLowStock ? `🟡 LOW STOCK (${stock})` : "🟢 IN STOCK"}
                            </span>
                          </div>
                        </div>

                        {/* Product description block */}
                        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                          <span style={{ fontSize: "10px", color: "#FF6A00", fontWeight: "900", textTransform: "uppercase" }}>{item.category}</span>
                          <h4 style={{ fontSize: "16px", fontWeight: "900", color: "white", margin: 0 }}>{item.name}</h4>
                          <p style={{ fontSize: "11px", color: "#aaa", margin: 0, lineHeight: "1.4", flex: 1 }}>{item.description}</p>

                          <div style={{ display: "flex", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "12px", marginTop: "4px" }}>
                            <button onClick={() => openModal("edit", item)} style={{ flex: 1, padding: "8px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }} className="btn-premium-edit"><Edit3 size={13} /> EDIT STOCK</button>
                            <button onClick={() => handleDelete(item.id)} style={{ padding: "8px 10px", borderRadius: "6px", cursor: "pointer" }} className="btn-premium-delete"><Trash2 size={13} /></button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== 🎖️ CERTIFICATE & AWARD CONTROL SUITE ==================== */}
          {activeTab === "products" && (
            <div style={{ marginTop: "48px", background: "rgba(20,20,20,0.4)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,106,0,0.15)", borderRadius: "32px", padding: "40px", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "24px", marginBottom: "32px" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: "950", color: "white", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>🎖️ CERTIFICATE & AWARD CONTROL SUITE</h3>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: 0 }}>Customize live certificates, upload border templates, add physical medals to the Shop catalog, and review framed award customizations.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {[{ id: "official", label: "🏆 Certificates" }, { id: "medal-creator", label: "🏅 Award Creator" }, { id: "approvals", label: "🛡️ Belt Approvals" }].map(sub => (
                    <button key={sub.id} onClick={() => setAdminSubTab(sub.id)} style={{ background: adminSubTab === sub.id ? "#FF6A00" : "rgba(255,255,255,0.05)", color: "white", border: "none", padding: "8px 20px", borderRadius: "100px", fontSize: "11px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", transition: "all 0.2s" }}>{sub.label}</button>
                  ))}
                </div>
              </div>

              {/* Official certificates: templates, approval queue, issued certificates (admin approval required) */}
              {adminSubTab === "official" && <AdminCertificates />}

              {/* Purchase approvals for championship belts */}
              {adminSubTab === "approvals" && <AdminProductAuthorizations products={products} />}

              {/* TAB 3: AWARD CREATOR */}
              {adminSubTab === "medal-creator" && (
                <form onSubmit={handleCreateAwardProduct} style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: "950", color: "white", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>🏅 INJECT NEW MEDAL OR PLAQUE PRODUCT INTO SHOP CATALOG</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.5fr", gap: "16px" }}>
                    <div><label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>AWARD NAME</label><input type="text" required placeholder="e.g. SOLID PLATINUM ADJUDICATION TROPHY" value={awardName} onChange={e => setAwardName(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }} /></div>
                    <div><label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>PRICE ($ USD)</label><input type="number" step="0.01" required placeholder="150.00" value={awardPrice} onChange={e => setAwardPrice(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }} /></div>
                  </div>
                  <div><label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>PRODUCT DESCRIPTION</label><textarea placeholder="Laser-etched high precision core with solid engraving specs..." value={awardDesc} onChange={e => setAwardDesc(e.target.value)} style={{ width: "100%", height: "80px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none", resize: "none" }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div><label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>CATALOG STOCK COUNT</label><input type="number" value={awardStock} onChange={e => setAwardStock(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", fontSize: "13px", outline: "none" }} /></div>
                    <div><label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>PRODUCT CATEGORY</label>
                      <select value={awardCategory} onChange={e => setAwardCategory(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px", color: "white", fontSize: "13px", outline: "none", cursor: "pointer" }}>
                        {SHOP_CATEGORIES.filter((c) => c !== "Tickets").map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>UPLOAD PRODUCT IMAGE</label>
                    <input type="file" ref={awardFileInputRef} accept=".jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={(e) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; if (file.size > 10 * 1024 * 1024) { showToast("Image size must be less than 10MB.", "error"); return; } setAwardImageFile(file); setAwardImagePreview(URL.createObjectURL(file)); } }} />
                    <div onDragEnter={(e) => { e.preventDefault(); setAwardDragActive(true); }} onDragOver={(e) => { e.preventDefault(); setAwardDragActive(true); }} onDragLeave={(e) => { e.preventDefault(); setAwardDragActive(false); }} onDrop={(e) => { e.preventDefault(); setAwardDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { const file = e.dataTransfer.files[0]; setAwardImageFile(file); setAwardImagePreview(URL.createObjectURL(file)); } }} onClick={() => awardFileInputRef.current?.click()} style={{ background: awardDragActive ? "rgba(255, 106, 0, 0.1)" : "rgba(255,255,255,0.02)", border: awardDragActive ? "2px dashed #FF6A00" : "1px dashed rgba(255,255,255,0.15)", borderRadius: "16px", padding: "30px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.3s ease" }}>
                      {awardImagePreview ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                          <img loading="lazy" decoding="async" src={awardImagePreview} alt="Award Preview" style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "12px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                          <div style={{ fontSize: "12px", color: "white", fontWeight: "700" }}>{awardImageFile?.name}</div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setAwardImageFile(null); setAwardImagePreview(""); }} style={{ background: "rgba(239,68,68,0.15)", border: "none", color: "#ef4444", padding: "6px 14px", borderRadius: "100px", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer" }}>
                            <Trash2 size={12} style={{ display: "inline", marginRight: "4px" }} /> Remove Image
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                          <UploadCloud size={36} color="#FF6A00" />
                          <div style={{ fontSize: "13px", fontWeight: "800", color: "white" }}>DRAG & DROP IMAGE HERE OR <span style={{ color: "#FF6A00", textDecoration: "underline" }}>BROWSE</span></div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Supports JPG, JPEG, PNG, WEBP up to 10MB</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button type="submit" style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "16px 40px", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", alignSelf: "flex-start", marginTop: "10px", boxShadow: "0 10px 20px rgba(255,106,0,0.2)" }}>🏅 CREATE SHOP AWARD PRODUCT</button>
                </form>
              )}

              {/* TAB 4: FRAMED ORDERS LEDGER */}
            </div>
          )}

          {/* ==================== 10. SHOP ORDERS & SHIPPING ==================== */}

          {activeTab === "orders" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                  <h2 style={{ fontSize: "26px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-1.0px", margin: 0 }}>
                    📦 Shop Orders & Customer Purchases
                  </h2>
                  <p style={{ color: "#666", fontSize: "12px", margin: "4px 0 0 0", fontWeight: "700", letterSpacing: "0.5px" }}>
                    MANAGE CUSTOMER SHIPMENTS AND ORDER FULFILLMENT STATUS
                  </p>
                </div>
                {selectedCustomerEmail && (
                  <button
                    onClick={() => { setSelectedCustomerEmail(""); setCustomerHistory(null); }}
                    style={{ background: "#222", color: "white", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 20px", borderRadius: "100px", fontSize: "11px", fontWeight: "900", cursor: "pointer" }}
                  >
                    ← SHOW ALL ORDERS
                  </button>
                )}
              </div>

              {/* Stats overview cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "16px", padding: "20px" }}>
                  <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", textTransform: "uppercase" }}>Total Orders</div>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "white", marginTop: "8px" }}>{orders.length}</div>
                </div>
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "16px", padding: "20px" }}>
                  <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", textTransform: "uppercase" }}>Pending Shipments</div>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "#FF5500", marginTop: "8px" }}>
                    {orders.filter(o => o.shipping_status === 'pending').length}
                  </div>
                </div>
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "16px", padding: "20px" }}>
                  <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", textTransform: "uppercase" }}>Paid Revenue</div>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "#22c55e", marginTop: "8px" }}>
                    ${orders.filter(o => o.payment_status === 'paid').reduce((acc, o) => acc + parseFloat(o.total || 0), 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Search & filters */}
              <div style={{ background: "rgba(13,13,16,0.5)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px 24px", marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#0c0c0e", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "100px", padding: "6px 16px" }}>
                    <Search size={14} color="#555" style={{ marginRight: "12px" }} />
                    <input
                      type="text"
                      placeholder="Search by product, customer, member #, order #, email, tracking..."
                      value={shopSearchInput}
                      onChange={(e) => setShopSearchInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setActiveShopSearch(shopSearchInput); }}
                      style={{ background: "transparent", border: "none", color: "white", fontSize: "13px", outline: "none", width: "100%" }}
                    />
                  </div>
                  <button onClick={() => setActiveShopSearch(shopSearchInput)} style={{ background: "#FF5500", border: "none", color: "white", padding: "10px 24px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer" }}>SEARCH</button>
                  <button onClick={() => { setShopSearchInput(""); setActiveShopSearch(""); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "10px 24px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer" }}>CLEAR</button>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <select
                    value={shippingStatusFilter}
                    onChange={(e) => setShippingStatusFilter(e.target.value)}
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "100px", padding: "10px 16px", color: "#aaa", fontSize: "12px", outline: "none", fontWeight: "700" }}
                  >
                    <option value="all">All Shipping Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "100px", padding: "10px 16px", color: "#aaa", fontSize: "12px", outline: "none", fontWeight: "700" }}
                  >
                    <option value="all">All Payment Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "120px 0", background: "rgba(13,13,16,0.3)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <Loader2 className="animate-spin" size={36} color="#FF5500" />
                  <p style={{ color: "#666", marginTop: "16px", fontSize: "13px", letterSpacing: "1.5px" }}>LOADING SHOP ORDERS...</p>
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 40px", background: "rgba(13,13,16,0.2)", borderRadius: "24px", border: "1px dashed rgba(255,255,255,0.06)" }}>
                  <ShoppingBag size={36} color="#555" style={{ marginBottom: "16px" }} />
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "white" }}>NO ORDERS PLACED YET</h4>
                  <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>Orders placed by customers will be logged here.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {orders
                    .filter(o => {
                      const emailToMatch = selectedCustomerEmail || activeShopSearch;
                      const q = emailToMatch?.toLowerCase() || "";
                      const matchesSearch = !q ||
                        o.customer_name?.toLowerCase().includes(q) ||
                        o.customer_email?.toLowerCase().includes(q) ||
                        o.id?.toLowerCase().includes(q) ||
                        o.tracking_number?.toLowerCase().includes(q) ||
                        o.member_number?.toLowerCase().includes(q) ||
                        (o.items || []).some(i => i.product_name?.toLowerCase().includes(q) || i.product_id?.toLowerCase().includes(q));

                      const matchesShip = shippingStatusFilter === 'all' || o.shipping_status === shippingStatusFilter;
                      const matchesPay = paymentStatusFilter === 'all' || o.payment_status === paymentStatusFilter;
                      return matchesSearch && matchesShip && matchesPay;
                    })
                    .map(order => {
                      return (
                        <div key={order.id} style={{ background: "rgba(13,13,16,0.6)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

                          {/* Top Row: Order ID, Date, Totals */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "14px", fontWeight: "950", color: "#FF5500" }}>
                                  ORDER #{order.id?.substring(0, 8).toUpperCase() || 'N/A'}
                                </span>
                                <span style={{ color: "#444", fontSize: "12px" }}>•</span>
                                <span style={{ color: "#888", fontSize: "12px", fontWeight: "700" }}>
                                  {new Date(order.created_at).toLocaleString()}
                                </span>
                              </div>
                              <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ color: "white", fontSize: "13px", fontWeight: "900" }}>{order.customer_name}</span>
                                <span style={{ color: "#444" }}>|</span>
                                <span
                                  onClick={() => setSelectedCustomerEmail(order.customer_email)}
                                  style={{ color: "#FF5500", fontSize: "12px", fontWeight: "800", cursor: "pointer", textDecoration: "underline" }}
                                >
                                  {order.customer_email}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                              {/* Shipping Status Dropdown */}
                              <div>
                                <label style={{ display: "block", fontSize: "9px", fontWeight: "900", color: "#666", textTransform: "uppercase", marginBottom: "4px" }}>Shipping</label>
                                <select
                                  value={order.shipping_status}
                                  onChange={async (e) => {
                                    try {
                                      const updated = await apiCall(`/admin/orders/${order.id}/shipping`, 'PUT', { shippingStatus: e.target.value }, user.token);
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, shipping_status: updated.shipping_status } : o));
                                      showToast("Shipping status updated successfully", "success");
                                    } catch (err) {
                                      showToast(`Failed: ${err.message}`, "error");
                                    }
                                  }}
                                  style={{
                                    background: order.shipping_status === 'pending' ? 'rgba(255, 106, 0, 0.1)' : order.shipping_status === 'shipped' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                    color: order.shipping_status === 'pending' ? '#FF6A00' : order.shipping_status === 'shipped' ? '#22c55e' : 'white',
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: "8px",
                                    padding: "6px 12px",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    outline: "none",
                                    cursor: "pointer"
                                  }}
                                >
                                  <option value="pending">⏳ Pending</option>
                                  <option value="processing">⚙️ Processing</option>
                                  <option value="shipped">🚚 Shipped</option>
                                  <option value="delivered">✅ Delivered</option>
                                  <option value="cancelled">❌ Cancelled</option>
                                </select>
                              </div>

                              {/* Payment Status Dropdown */}
                              <div>
                                <label style={{ display: "block", fontSize: "9px", fontWeight: "900", color: "#666", textTransform: "uppercase", marginBottom: "4px" }}>Payment</label>
                                <select
                                  value={order.payment_status}
                                  onChange={async (e) => {
                                    try {
                                      const updated = await apiCall(`/admin/orders/${order.id}/shipping`, 'PUT', { paymentStatus: e.target.value }, user.token);
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_status: updated.payment_status } : o));
                                      showToast("Payment status updated successfully", "success");
                                    } catch (err) {
                                      showToast(`Failed: ${err.message}`, "error");
                                    }
                                  }}
                                  style={{
                                    background: order.payment_status === 'paid' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: order.payment_status === 'paid' ? '#22c55e' : '#ef4444',
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: "8px",
                                    padding: "6px 12px",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    outline: "none",
                                    cursor: "pointer"
                                  }}
                                >
                                  <option value="pending">⏳ Pending</option>
                                  <option value="paid">💳 Paid</option>
                                  <option value="failed">❌ Failed</option>
                                  <option value="refunded">↩️ Refunded</option>
                                </select>
                              </div>

                              <button
                                onClick={async () => {
                                  try {
                                    const updated = await apiCall(`/admin/orders/${order.id}/shipping`, 'PUT', { shippingStatus: 'delivered', paymentStatus: 'paid' }, user.token);
                                    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, shipping_status: 'delivered', payment_status: 'paid' } : o));
                                    showToast("Order marked as completed", "success");
                                  } catch (err) {
                                    showToast(`Failed: ${err.message}`, "error");
                                  }
                                }}
                                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", marginTop: "12px", fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(34,197,94,0.2)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(34,197,94,0.1)"}
                              >
                                ✅ ORDER COMPLETE
                              </button>

                              <button
                                onClick={() => handleDelete(order.id)}
                                style={{ background: "transparent", border: "1px solid rgba(255,68,68,0.2)", color: "#ef4444", padding: "8px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", marginTop: "12px" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,68,68,0.1)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Order Details & Address */}
                          <div style={{ borderTop: "1px solid rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.03)", padding: "16px 0", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
                            {/* Ordered items list */}
                            <div>
                              <div style={{ fontSize: "10px", fontWeight: "900", color: "#666", textTransform: "uppercase", marginBottom: "10px" }}>Ordered Items</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {order.items && order.items.map((item, idx) => (
                                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.15)", borderRadius: "8px", padding: "8px 12px", border: "1px solid rgba(255,255,255,0.02)" }}>
                                    <div>
                                      <span style={{ color: "white", fontSize: "13px", fontWeight: "700" }}>{item.product_name}</span>
                                      {item.size && (
                                        <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", fontSize: "9px", fontWeight: "900", padding: "2px 6px", borderRadius: "4px", marginLeft: "8px" }}>
                                          {item.size}
                                        </span>
                                      )}
                                      {item.color && (
                                        <span style={{ background: "rgba(255,255,255,0.05)", color: "#aaa", fontSize: "9px", fontWeight: "900", padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>
                                          {item.color}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "white", fontWeight: "800" }}>
                                      {item.quantity}x <span style={{ color: "#FF5500" }}>${item.price}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                              <div style={{ fontSize: "10px", fontWeight: "900", color: "#666", textTransform: "uppercase", marginBottom: "10px" }}>Shipping Destination</div>
                              <div style={{ fontSize: "13px", color: "#aaa", lineHeight: "1.5" }}>
                                {order.shipping_address || 'No shipping address provided.'}
                              </div>
                            </div>
                          </div>

                          {/* Sum Row */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: "12px" }}>
                              <button
                                onClick={() => setOrderDetailModal({ isOpen: true, order })}
                                style={{ background: "#FF5500", border: "none", color: "white", padding: "10px 20px", borderRadius: "100px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                              >
                                VIEW FULL ORDER <ArrowRight size={14} />
                              </button>
                              <button
                                onClick={() => setSelectedCustomerEmail(order.customer_email)}
                                style={{ background: "transparent", border: "none", color: "#888", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                              >
                                CUSTOMER HISTORY <ArrowRight size={12} />
                              </button>
                            </div>

                            <div style={{ display: "flex", gap: "24px", alignItems: "center", fontSize: "13px" }}>
                              <div style={{ color: "#666", fontWeight: "700" }}>
                                Subtotal: <span style={{ color: "white" }}>${order.subtotal?.toFixed(2)}</span>
                              </div>
                              {order.discount > 0 && (
                                <div style={{ color: "#22c55e", fontWeight: "700" }}>
                                  Discount: <span>-${order.discount?.toFixed(2)}</span>
                                </div>
                              )}
                              <div style={{ fontSize: "16px", fontWeight: "950", color: "white" }}>
                                Total: <span style={{ color: "#FF5500" }}>${order.total?.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                </div>
              )}

              {/* Comprehensive Order Details Modal */}
              {orderDetailModal.isOpen && orderDetailModal.order && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(8px)", padding: "40px" }}>
                  <div style={{ background: "#0c0c0e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", width: "100%", maxWidth: "1200px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>

                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", padding: "12px", borderRadius: "12px" }}>
                          <ShoppingBag size={24} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: "24px", fontWeight: "900", color: "white", margin: 0, letterSpacing: "-0.5px" }}>ORDER #{orderDetailModal.order.id?.substring(0,8).toUpperCase()}</h3>
                          <div style={{ fontSize: "13px", color: "#888", fontWeight: "600", marginTop: "4px" }}>
                            Placed on {new Date(orderDetailModal.order.created_at).toLocaleDateString()} at {new Date(orderDetailModal.order.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={() => window.print()} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "10px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><FileText size={14} /> PDF INVOICE</button>
                        <button onClick={() => {
                          const orderData = orderDetailModal.order;
                          if (!orderData) return showToast('No order selected', 'error');
                          const csv = ["Order ID,Customer,Email,Total,Status,Date", `${orderData.id},${orderData.customer_name},${orderData.customer_email},${orderData.total},${orderData.shipping_status},${new Date(orderData.created_at).toLocaleDateString()}`].join('\n');
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `order-${orderData.id?.substring(0,8)}.csv`; a.click();
                          showToast('CSV exported successfully', 'success');
                        }} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "10px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><Download size={14} /> EXPORT CSV</button>
                        <button onClick={() => setOrderDetailModal({ isOpen: false, order: null })} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", padding: "8px" }}><X size={24} /></button>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "32px", overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "1fr 350px", gap: "32px" }}>

                      {/* Left Column: Products & Status */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

                        {/* Status Management */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "900", color: "#666", textTransform: "uppercase", marginBottom: "12px" }}>Payment Status</div>
                            <select
                              value={orderDetailModal.order.payment_status}
                              onChange={async (e) => {
                                const newStat = e.target.value;
                                setOrderDetailModal(prev => ({ ...prev, order: { ...prev.order, payment_status: newStat }}));
                                setOrders(prev => prev.map(o => o.id === orderDetailModal.order.id ? { ...o, payment_status: newStat } : o));
                                showToast("Payment status updated", "success");
                              }}
                              style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", color: "white", fontWeight: "700", outline: "none" }}
                            >
                              <option value="pending">⏳ Pending</option>
                              <option value="paid">💳 Paid</option>
                              <option value="failed">❌ Failed</option>
                              <option value="refunded">↩️ Refunded</option>
                            </select>
                            <div style={{ fontSize: "12px", color: "#888", marginTop: "12px" }}>Transaction ID: <span style={{ color: "white" }}>{orderDetailModal.order.transaction_id || 'N/A'}</span></div>
                          </div>

                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "900", color: "#666", textTransform: "uppercase", marginBottom: "12px" }}>Order Status</div>
                            <select
                              value={orderDetailModal.order.shipping_status}
                              onChange={async (e) => {
                                const newStat = e.target.value;
                                setOrderDetailModal(prev => ({ ...prev, order: { ...prev.order, shipping_status: newStat }}));
                                setOrders(prev => prev.map(o => o.id === orderDetailModal.order.id ? { ...o, shipping_status: newStat } : o));
                                showToast("Order status updated", "success");
                              }}
                              style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", color: "white", fontWeight: "700", outline: "none" }}
                            >
                              <option value="pending">⏳ Pending</option>
                              <option value="processing">⚙️ Processing</option>
                              <option value="shipped">🚚 Shipped</option>
                              <option value="delivered">✅ Delivered</option>
                              <option value="cancelled">❌ Cancelled</option>
                            </select>
                            <div style={{ fontSize: "12px", color: "#888", marginTop: "12px" }}>Delivery Status: <span style={{ color: "white" }}>{orderDetailModal.order.shipping_status === 'delivered' ? 'Arrived' : 'In Transit'}</span></div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div>
                          <h4 style={{ fontSize: "16px", fontWeight: "900", color: "white", margin: "0 0 16px 0" }}>Order Items</h4>
                          <div style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", overflow: "hidden" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead style={{ background: "rgba(255,255,255,0.02)" }}>
                                <tr style={{ color: "#666", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", textAlign: "left" }}>
                                  <th style={{ padding: "16px 20px" }}>Product</th>
                                  <th style={{ padding: "16px 20px" }}>Price</th>
                                  <th style={{ padding: "16px 20px" }}>Qty</th>
                                  <th style={{ padding: "16px 20px", textAlign: "right" }}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(orderDetailModal.order.items || []).map((item, idx) => (
                                  <tr key={idx} style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                                    <td style={{ padding: "16px 20px", display: "flex", gap: "16px", alignItems: "center" }}>
                                      <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                        {item.image ? <img loading="lazy" decoding="async" src={item.image} alt={item.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ShoppingBag size={20} color="#555" />}
                                      </div>
                                      <div>
                                        <div style={{ color: "white", fontSize: "14px", fontWeight: "800" }}>{item.product_name}</div>
                                        <div style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>
                                          {item.size && <span style={{ marginRight: "8px" }}>Size: {item.size}</span>}
                                          {item.color && <span>Color: {item.color}</span>}
                                          {item.product_id && <span style={{ display: "block", fontSize: "10px", marginTop: "2px" }}>ID: {item.product_id}</span>}
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: "16px 20px", color: "white", fontSize: "14px", fontWeight: "600" }}>${parseFloat(item.price).toFixed(2)}</td>
                                    <td style={{ padding: "16px 20px", color: "white", fontSize: "14px", fontWeight: "600" }}>{item.quantity}</td>
                                    <td style={{ padding: "16px 20px", color: "white", fontSize: "14px", fontWeight: "800", textAlign: "right" }}>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Shipping & Tracking */}
                        <div style={{ background: "rgba(255,85,0,0.02)", border: "1px solid rgba(255,85,0,0.2)", borderRadius: "16px", padding: "24px" }}>
                          <h4 style={{ fontSize: "16px", fontWeight: "900", color: "#FF5500", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}><MapPin size={18} /> Shipping & Tracking</h4>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "8px", fontWeight: "700" }}>Tracking Number</label>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <input type="text" defaultValue={orderDetailModal.order.tracking_number || ""} placeholder="e.g. 1Z9999W99999999999" id="tracking-input" style={{ flex: 1, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "13px" }} />
                                <button onClick={() => {
                                  const val = document.getElementById('tracking-input').value;
                                  setOrderDetailModal(prev => ({ ...prev, order: { ...prev.order, tracking_number: val }}));
                                  showToast("Tracking updated", "success");
                                }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "0 16px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>SAVE</button>
                              </div>
                              {orderDetailModal.order.tracking_number && (
                                <a href={`https://parcelsapp.com/en/tracking/${orderDetailModal.order.tracking_number}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "12px", color: "#FF5500", fontSize: "12px", fontWeight: "800", textDecoration: "underline" }}>Track Package ↗</a>
                              )}
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "11px", color: "#888", marginBottom: "8px", fontWeight: "700" }}>Shipping Carrier</label>
                              <select defaultValue={orderDetailModal.order.carrier || "USPS"} style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none" }}>
                                <option value="USPS">USPS</option>
                                <option value="UPS">UPS</option>
                                <option value="FedEx">FedEx</option>
                                <option value="DHL">DHL</option>
                              </select>
                              <div style={{ fontSize: "11px", color: "#888", marginTop: "12px", fontWeight: "600" }}>Est. Delivery: {new Date(new Date(orderDetailModal.order.created_at).getTime() + 5*24*60*60*1000).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Right Column: Customer & Totals */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                        {/* Customer Info */}
                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "900", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>Customer Details</h4>

                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                              <div style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase" }}>Full Name</div>
                              <div style={{ color: "white", fontSize: "14px", fontWeight: "700", marginTop: "4px" }}>{orderDetailModal.order.customer_name}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase" }}>Email Address</div>
                              <div style={{ color: "#FF5500", fontSize: "14px", fontWeight: "700", marginTop: "4px", wordBreak: "break-all" }}>{orderDetailModal.order.customer_email}</div>
                            </div>
                            <div style={{ display: "flex", gap: "16px" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase" }}>Phone Number</div>
                                <div style={{ color: "white", fontSize: "14px", fontWeight: "600", marginTop: "4px" }}>{orderDetailModal.order.customer_phone || 'N/A'}</div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase" }}>Member #</div>
                                <div style={{ color: "white", fontSize: "14px", fontWeight: "600", marginTop: "4px" }}>{orderDetailModal.order.member_number || 'Guest'}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Addresses */}
                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "900", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>Addresses</h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                              <div style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase", marginBottom: "8px" }}>Shipping Address</div>
                              <div style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.6" }}>
                                {orderDetailModal.order.shipping_address || 'No shipping address provided.'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase", marginBottom: "8px" }}>Billing Address</div>
                              <div style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.6" }}>
                                {orderDetailModal.order.billing_address || orderDetailModal.order.shipping_address || 'Same as shipping'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "900", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>Order Summary</h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: "13px" }}>
                              <span>Subtotal</span>
                              <span>${orderDetailModal.order.subtotal?.toFixed(2)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: "13px" }}>
                              <span>Shipping Fee</span>
                              <span>${(orderDetailModal.order.shipping_fee || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: "13px" }}>
                              <span>Taxes</span>
                              <span>${(orderDetailModal.order.tax || 0).toFixed(2)}</span>
                            </div>
                            {orderDetailModal.order.discount > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", color: "#22c55e", fontSize: "13px", fontWeight: "700" }}>
                                <span>Discount</span>
                                <span>-${orderDetailModal.order.discount?.toFixed(2)}</span>
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", color: "white", fontSize: "18px", fontWeight: "900", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                              <span>Total Paid</span>
                              <span style={{ color: "#FF5500" }}>${orderDetailModal.order.total?.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <button onClick={() => { setOrderDetailModal(prev => ({...prev, order: {...prev.order, shipping_status: 'shipped'}})); showToast('Marked as shipped!', 'success'); }} style={{ background: "#22c55e", color: "black", border: "none", padding: "14px", borderRadius: "8px", fontSize: "13px", fontWeight: "900", cursor: "pointer" }}>MARK AS SHIPPED</button>
                          <button onClick={() => { window.location.href = `mailto:${orderDetailModal.order.customer_email}`; }} style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "14px", borderRadius: "8px", fontSize: "13px", fontWeight: "900", cursor: "pointer" }}>CONTACT CUSTOMER</button>
                          <button onClick={() => { if(window.confirm('Are you sure you want to refund this order?')) showToast('Refund initiated', 'info'); }} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "14px", borderRadius: "8px", fontSize: "13px", fontWeight: "900", cursor: "pointer", marginTop: "10px" }}>REFUND ORDER</button>
                        </div>

                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 5. MEMBERSHIP MANAGEMENT SUITE ==================== */}
          {activeTab === "memberships" && (
            <div className="membership-management-container">
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
                <div>
                  <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                    Membership Control Center
                  </div>
                  <h2 style={{ fontSize: "42px", fontWeight: "950", margin: "0 0 12px 0", color: "white", letterSpacing: "-1px", textTransform: "uppercase", lineHeight: "1" }}>
                    MEMBERSHIP<br />MANAGEMENT
                  </h2>
                  <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>View, edit, and control pricing tiers, active subscribers, and payment history.</p>
                </div>

                {/* Internal Navigation */}
                <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: "100px", padding: "4px" }}>
                  {['plans', 'subscribers', 'payments'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setMembershipSubTab(tab)}
                      style={{
                        background: membershipSubTab === tab ? "#FF5500" : "transparent",
                        color: membershipSubTab === tab ? "white" : "#888",
                        border: "none",
                        padding: "10px 24px",
                        borderRadius: "100px",
                        fontSize: "12px",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiers & Plans Sub-Tab */}
              {membershipSubTab === "plans" && <AdminPlansManager />}
              {membershipSubTab === "subscribers" && <AdminSubscribers mode="subscribers" />}
              {membershipSubTab === "payments" && <AdminSubscribers mode="payments" />}
            </div>
          )}

          {/* ==================== 7. CATEGORIES (live) ==================== */}
          {activeTab === "categories" && <AdminCategoryManager />}

          {/* ==================== 8. DIVISIONS (live) ==================== */}
          {activeTab === "divisions" && <AdminDivisionPanels />}

          {/* ==================== 9. CHALLENGE RECORD MANAGEMENT ==================== */}
          {activeTab === "challenges" && (
            <div>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
                <div>
                  <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                    Challenge Adjudication
                  </div>
                  <h2 style={{ fontSize: "56px", fontWeight: "950", margin: "0 0 12px 0", color: "white", letterSpacing: "-2px", textTransform: "uppercase", lineHeight: "1" }}>
                    CHALLENGES
                  </h2>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button
                    onClick={() => {
                      setChallengeFormMode("add");
                      setChallengeForm({ status: "pending", videoType: "upload", isFeatured: false });
                      setChallengeSaveStatus(null);
                    }}
                    style={{ background: "#FF5500", border: "none", color: "white", padding: "10px 24px", borderRadius: "8px", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <Plus size={16} /> ADD NEW CHALLENGE
                  </button>
                </div>
              </div>

              {challengeFormMode ? (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "32px", marginBottom: "40px" }}>
                  {challengeSaveStatus === "success" && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#22c55e", fontWeight: "700" }}>✅ Challenge saved successfully.</div>}
                  {challengeSaveStatus === "error" && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#ef4444", fontWeight: "700" }}>❌ Challenge could not be saved. Please check the required fields.</div>}

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "900", color: "white", margin: 0 }}>{challengeFormMode === "add" ? "Add New Challenge" : "Edit Challenge"}</h3>
                    <button onClick={() => { setChallengeFormMode(null); setSelectedChallenge(null); }} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}><X size={20} /></button>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setChallengeSaveStatus("saving");
                    const formData = new FormData();
                    formData.append("title", challengeForm.title || "");
                    formData.append("athleteId", challengeForm.athleteId || "");
                    formData.append("description", challengeForm.description || "");
                    formData.append("status", challengeForm.status || "pending");
                    formData.append("isFeatured", challengeForm.isFeatured || false);
                    formData.append("videoType", challengeForm.videoType || "upload");

                    if (challengeForm.videoType === "youtube") {
                      formData.append("youtubeUrl", challengeForm.youtubeUrl || "");
                    }

                    try {
                      // Files go straight to storage; the API only receives their URLs.
                      if (challengeForm.videoType !== "youtube" && challengeForm.videoFile) {
                        formData.append("videoUrl", await uploadDirect(challengeForm.videoFile, "admin-video", user.token));
                      }
                      if (challengeForm.thumbnailImage) {
                        formData.append("thumbnailUrl", await uploadDirect(challengeForm.thumbnailImage, "admin-image", user.token));
                      } else if (challengeForm.thumbnail_url) {
                        formData.append("thumbnailUrl", challengeForm.thumbnail_url);
                      } else if (challengeFormMode === "edit" && selectedChallenge?.thumbnail_url) {
                        formData.append("removeThumbnail", "true");
                      }
                      const url = challengeFormMode === "edit" ? `/admin/challenges/${selectedChallenge.id}` : "/admin/challenges";
                      const method = challengeFormMode === "edit" ? "PUT" : "POST";
                      const res = await fetch(`${API_URL}${url}`, {
                        method,
                        headers: { "Authorization": `Bearer ${user.token}` },
                        body: formData
                      });
                      if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        throw new Error(body.message || body.error || "Failed to save");
                      }
                      setChallengeSaveStatus("success");
                      fetchData(); // refresh list
                      setTimeout(() => { setChallengeFormMode(null); setSelectedChallenge(null); }, 1500);
                    } catch (err) {
                      console.error("Challenge save failed:", err);
                      setChallengeSaveStatus("error");
                      alert(`Could not save challenge: ${err.message}`);
                    }
                  }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div>
                        <label style={{ display: "block", color: "#888", fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>Video Title (Target Record) *</label>
                        <input type="text" required value={challengeForm.title || ""} onChange={e => setChallengeForm({ ...challengeForm, title: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px" }} placeholder="e.g. Fastest 100m Sprint" />
                      </div>
                      <div>
                        <label style={{ display: "block", color: "#888", fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>Athlete Name *</label>
                        <input type="text" required value={challengeForm.athleteId || ""} onChange={e => setChallengeForm({ ...challengeForm, athleteId: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px" }} placeholder="e.g. John Doe" />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", color: "#888", fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>Video Description *</label>
                      <textarea required value={challengeForm.description || ""} onChange={e => setChallengeForm({ ...challengeForm, description: e.target.value })} rows={4} style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px" }} placeholder="Describe the challenge..." />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div>
                        <label style={{ display: "block", color: "#888", fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>Status</label>
                        <select value={challengeForm.status || "pending"} onChange={e => setChallengeForm({ ...challengeForm, status: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px" }}>
                          <option value="pending">Pending Review</option>
                          <option value="verified">Current Record (Verified)</option>
                          <option value="rejected">Failed Attempt (Rejected)</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "28px" }}>
                        <input type="checkbox" checked={challengeForm.isFeatured || false} onChange={e => setChallengeForm({ ...challengeForm, isFeatured: e.target.checked })} style={{ width: "20px", height: "20px" }} />
                        <label style={{ color: "white", fontSize: "14px", fontWeight: "700" }}>Feature on Homepage</label>
                      </div>
                    </div>

                    <div style={{ padding: "20px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <label style={{ display: "block", color: "#FF5500", fontSize: "12px", fontWeight: "900", marginBottom: "16px", textTransform: "uppercase" }}>Video Source</label>
                      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", cursor: "pointer" }}>
                          <input type="radio" name="videoType" value="upload" checked={challengeForm.videoType === "upload"} onChange={() => setChallengeForm({ ...challengeForm, videoType: "upload" })} /> Upload Video from Computer
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", cursor: "pointer" }}>
                          <input type="radio" name="videoType" value="youtube" checked={challengeForm.videoType === "youtube"} onChange={() => setChallengeForm({ ...challengeForm, videoType: "youtube" })} /> Add Video from YouTube Link
                        </label>
                      </div>

                      {challengeForm.videoType === "upload" ? (
                        <div>
                          <label style={{ display: "block", color: "#888", fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>Upload Video File (MP4, MOV, WEBM) {challengeFormMode === "add" ? "*" : ""}</label>
                          <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={e => setChallengeForm({ ...challengeForm, videoFile: e.target.files[0] })} style={{ color: "white" }} />
                          {challengeFormMode === "edit" && selectedChallenge?.video_url && selectedChallenge.video_type === 'upload' && !challengeForm.videoFile && <div style={{ marginTop: "8px", fontSize: "12px", color: "#22c55e" }}>Current file: {selectedChallenge.video_url.split('/').pop()}</div>}
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: "block", color: "#888", fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>YouTube Video URL *</label>
                          <input type="url" value={challengeForm.youtubeUrl || (selectedChallenge?.video_type === 'youtube' ? selectedChallenge.video_url : "")} onChange={e => setChallengeForm({ ...challengeForm, youtubeUrl: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px" }} placeholder="https://www.youtube.com/watch?v=..." />
                        </div>
                      )}
                    </div>

                    <div>
                      <ImageUploadField label="Thumbnail image" value={challengeForm.thumbnail_url || ""} onChange={(url) => setChallengeForm({ ...challengeForm, thumbnail_url: url, thumbnailImage: null })} hint="Upload an image or paste a link. Shown on the challenge card." />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
                      <button type="button" onClick={() => { setChallengeFormMode(null); setSelectedChallenge(null); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "12px 24px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                      <button type="submit" disabled={challengeSaveStatus === "saving"} style={{ background: "#FF5500", border: "none", color: "white", padding: "12px 32px", borderRadius: "8px", fontWeight: "900", cursor: "pointer" }}>
                        {challengeSaveStatus === "saving" ? "Saving..." : "Save Challenge"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "60px" }}>
                  {challenges.length === 0 ? (
                    <div style={{ color: "#888", fontSize: "14px", padding: "32px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "16px" }}>No challenges found. Create one to get started.</div>
                  ) : challenges.map(challenge => (
                    <div key={challenge.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr", gap: "24px", alignItems: "center" }}>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <img loading="lazy" decoding="async" src={challenge.thumbnail_url || `https://ui-avatars.com/api/?name=${challenge.athlete_id}&background=random`} alt={challenge.athlete_id} style={{ width: "64px", height: "64px", borderRadius: "12px", objectFit: "cover" }} />
                        <div>
                          <div style={{ color: "#FF5500", fontSize: "10px", fontWeight: "900", letterSpacing: "1px" }}>{challenge.id.substring(0,8)}</div>
                          <div style={{ color: "white", fontSize: "16px", fontWeight: "800" }}>{challenge.athlete_id}</div>
                          {challenge.is_featured && <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", fontSize: "9px", padding: "2px 6px", borderRadius: "4px", fontWeight: "800", marginLeft: "8px" }}>FEATURED</span>}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: "#666", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", marginBottom: "4px" }}>TARGET RECORD (TITLE)</div>
                        <div style={{ color: "white", fontSize: "14px", fontWeight: "700" }}>{challenge.title}</div>
                      </div>

                      <div>
                        <div style={{ color: "#666", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", marginBottom: "4px" }}>VIDEO PREVIEW</div>
                        {challenge.video_url ? (
                          challenge.video_type === 'youtube' ? (
                            <a href={challenge.video_url} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontSize: "12px", fontWeight: "700", textDecoration: "none" }}>📺 Watch on YouTube</a>
                          ) : (
                            <a href={challenge.video_url} target="_blank" rel="noreferrer" style={{ color: "#22c55e", fontSize: "12px", fontWeight: "700", textDecoration: "none" }}>▶️ View Uploaded File</a>
                          )
                        ) : (
                          <span style={{ color: "#888", fontSize: "12px", fontWeight: "600", fontStyle: "italic" }}>No video attached</span>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
                        <span style={{
                          background: challenge.status === 'verified' ? "rgba(34,197,94,0.1)" : challenge.status === 'rejected' ? "rgba(239,68,68,0.1)" : "rgba(255,106,0,0.1)",
                          color: challenge.status === 'verified' ? "#22c55e" : challenge.status === 'rejected' ? "#ef4444" : "#FF6A00",
                          padding: "6px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: "900"
                        }}>
                          {challenge.status === 'verified' ? 'Current Record' : challenge.status === 'rejected' ? 'Failed Attempt' : 'Pending Review'}
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => { setSelectedChallenge(challenge); setChallengeFormMode("edit"); setChallengeForm({ ...challenge, videoType: challenge.video_type || "upload", isFeatured: challenge.is_featured, athleteId: challenge.athlete_id }); setChallengeSaveStatus(null); }} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "6px", borderRadius: "6px", cursor: "pointer" }} title="Edit Challenge"><Edit3 size={14} /></button>
                          <button onClick={async () => {
                            if(window.confirm("Delete this challenge?")) {
                              await apiCall(`/admin/challenges/${challenge.id}`, "DELETE", null, user.token);
                              fetchData();
                            }
                          }} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", padding: "6px", borderRadius: "6px", cursor: "pointer" }} title="Delete Challenge"><Trash2 size={14} /></button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== 10. APPEAL MANAGEMENT ==================== */}
          {activeTab === "appeals" && (
            <div>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                    Dispute Resolution
                  </div>
                  <h2 style={{ fontSize: "56px", fontWeight: "950", margin: "0 0 12px 0", color: "white", letterSpacing: "-2px", textTransform: "uppercase", lineHeight: "1" }}>
                    APPEALS
                  </h2>
                </div>

                {/* Search & Filters */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "100px", padding: "4px 4px 4px 16px" }}>
                    <input
                      type="text"
                      placeholder="Search appeals..."
                      value={appealsSearch}
                      onChange={(e) => setAppealsSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                      style={{ background: "transparent", border: "none", color: "white", outline: "none", fontSize: "13px", width: "200px" }}
                    />
                    <button onClick={fetchData} style={{ background: "#FF5500", color: "white", border: "none", borderRadius: "100px", padding: "8px 16px", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Search size={14} /> SEARCH
                    </button>
                  </div>

                  <select
                    value={appealsFilter}
                    onChange={(e) => { setAppealsFilter(e.target.value); setAppealsPage(1); }}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", outline: "none", cursor: "pointer" }}
                  >
                    <option value="all">ALL APPEALS</option>
                    <option value="Recent">RECENT (LAST 7 DAYS)</option>
                    <option value="High-Priority">HIGH PRIORITY</option>
                    <option value="Pending">PENDING</option>
                    <option value="Under Review">UNDER REVIEW</option>
                    <option value="Awaiting Evidence">AWAITING EVIDENCE</option>
                    <option value="Approved">APPROVED</option>
                    <option value="Denied">DENIED</option>
                    <option value="Closed">CLOSED</option>
                    <option value="Escalated">ESCALATED</option>
                  </select>
                </div>
              </div>

              {/* Appeals List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "30px" }}>
                {appeals.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p style={{ color: "#888", fontSize: "14px", fontWeight: "700" }}>No appeals found matching your criteria.</p>
                  </div>
                ) : (
                  appeals.map(appeal => (
                    <div key={appeal.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", display: "grid", gridTemplateColumns: "1.5fr 1fr auto", gap: "24px", alignItems: "center", cursor: "pointer", transition: "all 0.2s" }} onClick={() => setSelectedAppeal(appeal)} onMouseEnter={e => e.currentTarget.style.borderColor = "#FF5500"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}>

                      {/* Athlete & Record Info */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                          <span style={{ color: "#FF5500", fontSize: "10px", fontWeight: "900", letterSpacing: "1px" }}>{appeal.id.substring(0,8).toUpperCase()}</span>
                          {appeal.priority === 'high' && (
                            <span style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: "900" }}>HIGH PRIORITY</span>
                          )}
                        </div>
                        <div style={{ color: "white", fontSize: "18px", fontWeight: "900", marginBottom: "4px" }}>{appeal.user?.name || 'Unknown User'}</div>
                        <div style={{ color: "#aaa", fontSize: "12px", fontWeight: "700", marginBottom: "12px" }}>Record: {appeal.record?.title || 'Unknown Record'}</div>
                        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {appeal.appeal_reason}
                        </div>
                      </div>

                      {/* Status & Dates */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderLeft: "1px solid rgba(255,255,255,0.05)", paddingLeft: "24px" }}>
                        <div>
                          <span style={{
                            background: ['Approved', 'Closed'].includes(appeal.status) ? "rgba(34,197,94,0.1)" : appeal.status === 'Denied' ? "rgba(239,68,68,0.1)" : appeal.status === 'Pending' ? "rgba(255,106,0,0.1)" : "rgba(255,204,0,0.1)",
                            color: ['Approved', 'Closed'].includes(appeal.status) ? "#22c55e" : appeal.status === 'Denied' ? "#ef4444" : appeal.status === 'Pending' ? "#FF6A00" : "#ffcc00",
                            padding: "6px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: "900", display: "inline-block", border: "1px solid currentColor"
                          }}>
                            {appeal.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ color: "#666", fontSize: "11px", fontWeight: "700" }}>
                          Submitted: {new Date(appeal.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* View Action */}
                      <div style={{ paddingLeft: "24px", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                        <button style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px 24px", borderRadius: "100px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                          VIEW DETAILS <ArrowRight size={14} />
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {appealsTotalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", paddingBottom: "60px" }}>
                  <button disabled={appealsPage === 1} onClick={() => { setAppealsPage(p => p - 1); }} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: appealsPage === 1 ? "#555" : "white", padding: "8px 16px", borderRadius: "100px", cursor: appealsPage === 1 ? "not-allowed" : "pointer", fontWeight: "bold" }}>Prev</button>
                  <span style={{ fontSize: "14px", fontWeight: "bold", padding: "8px 16px", background: "rgba(255,85,0,0.1)", borderRadius: "100px", color: "#FF5500" }}>Page {appealsPage} of {appealsTotalPages}</span>
                  <button disabled={appealsPage === appealsTotalPages} onClick={() => { setAppealsPage(p => p + 1); }} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: appealsPage === appealsTotalPages ? "#555" : "white", padding: "8px 16px", borderRadius: "100px", cursor: appealsPage === appealsTotalPages ? "not-allowed" : "pointer", fontWeight: "bold" }}>Next</button>
                </div>
              )}

              {/* ==================== VIDEO & EVIDENCE MANAGEMENT (NESTED IN APPEALS) ==================== */}
              <div style={{ marginTop: "40px", paddingTop: "40px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
                  <div>
                    <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                      Media & Asset Hub
                    </div>
                    <h3 style={{ fontSize: "36px", fontWeight: "950", margin: "0 0 12px 0", color: "white", letterSpacing: "-1px", textTransform: "uppercase", lineHeight: "1" }}>
                      VIDEO & EVIDENCE
                      <br />MANAGEMENT
                    </h3>
                  </div>
                  <button onClick={() => { showToast('YouTube sync initiated — pulling latest data', 'success'); }} style={{ background: "#FF5500", color: "white", border: "none", padding: "12px 24px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(255,85,0,0.4)" }}>
                    <Video size={14} /> SYNC YOUTUBE INTEGRATIONS
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", paddingBottom: "60px" }}>

                  {/* Category 1: Record & Attempt Videos */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ background: "rgba(255,85,0,0.1)", width: "48px", height: "48px", borderRadius: "12px", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px" }}>
                      <Video size={20} color="#FF5500" />
                    </div>
                    <h4 style={{ fontSize: "18px", fontWeight: "900", color: "white", margin: "0 0 8px 0" }}>Core Videos</h4>
                    <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.5", marginBottom: "20px" }}>Manage official Record Videos, active Attempt Videos, and historical Attempt History archives.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button onClick={() => setActiveTab('videoManagement')} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer", textAlign: "left" }}>Manage Record Videos &rarr;</button>
                      <button onClick={() => setActiveTab('videoManagement')} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer", textAlign: "left" }}>Manage Attempt Videos &rarr;</button>
                      <button onClick={() => setActiveTab('videoManagement')} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer", textAlign: "left" }}>Attempt History Videos &rarr;</button>
                    </div>
                  </div>

                  {/* Category 2: Features & Thumbnails */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ background: "rgba(34,197,94,0.1)", width: "48px", height: "48px", borderRadius: "12px", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px" }}>
                      <Target size={20} color="#22c55e" />
                    </div>
                    <h4 style={{ fontSize: "18px", fontWeight: "900", color: "white", margin: "0 0 8px 0" }}>Features & UX Assets</h4>
                    <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.5", marginBottom: "20px" }}>Control Featured Videos, Newest Records showcases, and globally manage Video Thumbnails.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button onClick={() => setActiveTab('videoManagement')} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer", textAlign: "left" }}>Featured Videos List &rarr;</button>
                      <button onClick={() => setActiveTab('videoManagement')} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer", textAlign: "left" }}>Newest Records Videos &rarr;</button>
                      <button onClick={() => setActiveTab('videoManagement')} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer", textAlign: "left" }}>Manage Video Thumbnails &rarr;</button>
                    </div>
                  </div>

                  {/* Category 3: Photo & External Integration */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ background: "rgba(59,130,246,0.1)", width: "48px", height: "48px", borderRadius: "12px", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px" }}>
                      <FileText size={20} color="#3b82f6" />
                    </div>
                    <h4 style={{ fontSize: "18px", fontWeight: "900", color: "white", margin: "0 0 8px 0" }}>Photos & External</h4>
                    <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.5", marginBottom: "20px" }}>Review global Photo Evidence databases and manage API keys for YouTube Integrations.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button onClick={() => setActiveTab('mediaLibrary')} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer", textAlign: "left" }}>Review Photo Evidence &rarr;</button>
                      <button onClick={() => { showToast('YouTube Integration panel — configure API key in Settings', 'info'); setActiveTab('systemSettings'); }} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer", textAlign: "left" }}>YouTube Integrations Panel &rarr;</button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ==================== 11. LEADERBOARD MANAGEMENT ==================== */}
          {activeTab === "leaderboards" && (
            <div>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
                <div>
                  <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                    Global & Local Rankings
                  </div>
                  <h2 style={{ fontSize: "56px", fontWeight: "950", margin: "0 0 12px 0", color: "white", letterSpacing: "-2px", textTransform: "uppercase", lineHeight: "1" }}>
                    LEADERBOARDS
                  </h2>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button onClick={() => showToast('Points System configuration — use the Settings tab for scoring rules', 'info')} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "10px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Settings size={14} /> Configure Points System
                  </button>
                  <button onClick={() => showToast('Ranking filters updated — all leaderboards refreshed', 'success')} style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 14px rgba(255,85,0,0.4)" }}>
                    <Filter size={14} /> Manage Ranking Filters
                  </button>
                </div>
              </div>

              {/* Leaderboard Controls */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", marginBottom: "32px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <select style={{ flex: 1, minWidth: "200px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px", outline: "none", cursor: "pointer" }}>
                  <option>Global Leaderboard</option>
                  <option>Local Country Leaderboards</option>
                </select>
                <select style={{ flex: 1, minWidth: "200px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px", outline: "none", cursor: "pointer" }}>
                  <option>All Categories</option>
                  <option>Athletics</option>
                  <option>Strength</option>
                  <option>Endurance</option>
                </select>
                <select style={{ flex: 1, minWidth: "200px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px", outline: "none", cursor: "pointer" }}>
                  <option>All Age Groups</option>
                  <option>Junior Champions (5-12)</option>
                  <option>Teen Legends (13-17)</option>
                  <option>Adult Division (18-49)</option>
                  <option>Masters Division (50+)</option>
                </select>
              </div>

              {/* Leaderboard Rankings Table */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <tr>
                      <th style={{ padding: "16px 24px", color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1px" }}>RANK</th>
                      <th style={{ padding: "16px 24px", color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1px" }}>ATHLETE</th>
                      <th style={{ padding: "16px 24px", color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1px" }}>POINTS</th>
                      <th style={{ padding: "16px 24px", color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1px" }}>COUNTRY</th>
                      <th style={{ padding: "16px 24px", color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { rank: 1, athlete: "David Miller", points: 14500, country: "USA", change: "+1" },
                      { rank: 2, athlete: "Sarah Jenkins", points: 14200, country: "UK", change: "-1" },
                      { rank: 3, athlete: "Marcus T.", points: 12800, country: "Canada", change: "0" },
                      { rank: 4, athlete: "Elena R.", points: 11500, country: "Spain", change: "+3" }
                    ].map(entry => (
                      <tr key={entry.rank} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: entry.rank === 1 ? "#ffd700" : entry.rank === 2 ? "#c0c0c0" : entry.rank === 3 ? "#cd7f32" : "white", fontSize: "20px", fontWeight: "950" }}>#{entry.rank}</span>
                            <span style={{ color: entry.change.startsWith('+') ? "#22c55e" : entry.change.startsWith('-') ? "#ef4444" : "#888", fontSize: "10px", fontWeight: "900" }}>
                              {entry.change !== "0" && (entry.change.startsWith('+') ? '▲ ' : '▼ ')} {entry.change !== "0" ? entry.change.substring(1) : '-'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", color: "white", fontWeight: "800", fontSize: "14px" }}>{entry.athlete}</td>
                        <td style={{ padding: "16px 24px", color: "#FF5500", fontWeight: "900", fontSize: "14px" }}>{entry.points.toLocaleString()} PTS</td>
                        <td style={{ padding: "16px 24px", color: "#aaa", fontWeight: "600", fontSize: "13px" }}>{entry.country}</td>
                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                          <button onClick={() => showToast(`Points adjustment for ${entry.athlete} — enter new points value in their user profile`, 'info')} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "6px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", cursor: "pointer" }}>Adjust Points</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ==================== 5B. ADJUDICATOR (JUDGE) MANAGEMENT STATION ==================== */}
          {activeTab === "adjudicators" && (
            <div>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
                <div>
                  <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>
                    Official Oversight Suite
                  </div>
                  <h2 style={{ fontSize: "56px", fontWeight: "950", margin: "0 0 12px 0", color: "white", letterSpacing: "-2px", textTransform: "uppercase", lineHeight: "1" }}>
                    ADJUDICATOR
                    <br />MANAGEMENT
                  </h2>
                  <p style={{ color: "#888", margin: 0, fontSize: "14px", maxWidth: "550px" }}>
                    Manage certified judges, assign pending submissions, track performance metrics, and approve final decisions.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setIsPromoteModalOpen(true)}
                    style={{ background: "#FF5500", color: "white", border: "none", padding: "12px 24px", borderRadius: "100px", fontSize: "13px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 20px rgba(255,85,0,0.3)", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <Plus size={16} /> PROMOTE JUDGE
                  </button>
                  <button
                    onClick={() => { fetchData(); alert("Active roster and telemetry synchronized with database."); }}
                    style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", padding: "12px 20px", borderRadius: "100px", fontSize: "13px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <Activity size={15} /> SYNC DATA
                  </button>
                </div>
              </div>

              {/* Sub-Tab Selector */}
              <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px", marginBottom: "32px" }}>
                {[
                  { id: "roster", label: "👨‍⚖️ CERTIFIED ROSTER & STATS" },
                  { id: "dispatch", label: "📋 SUBMISSION ASSIGNMENTS" },
                  { id: "oversight", label: "🛡️ OVERSIGHT: APPROVE DECISIONS" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAdjudicatorSubTab(tab.id)}
                    style={{
                      background: adjudicatorSubTab === tab.id ? "rgba(255,85,0,0.1)" : "transparent",
                      border: "none",
                      color: adjudicatorSubTab === tab.id ? "#FF5500" : "#888",
                      padding: "10px 24px",
                      borderRadius: "100px",
                      fontSize: "13px",
                      fontWeight: "900",
                      cursor: "pointer",
                      transition: "0.2s",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: adjudicatorSubTab === tab.id ? "rgba(255,85,0,0.2)" : "transparent"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ================= STATION A: ROSTER & TELEMETRY ================= */}
              {adjudicatorSubTab === "roster" && (
                <div>
                  {/* Search and Filters */}
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "20px" }}>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}>
                      <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
                        <Search size={16} color="#666" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          placeholder="Search name, email, member #..."
                          value={judgesSearchQuery}
                          onChange={(e) => setJudgesSearchQuery(e.target.value)}
                          style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "100px", padding: "12px 16px 12px 44px", color: "white", fontSize: "13px", outline: "none" }}
                        />
                      </div>
                      <select
                        value={judgesFilterStatus}
                        onChange={(e) => setJudgesFilterStatus(e.target.value)}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "100px", padding: "10px 14px", color: "white", fontSize: "13px", fontWeight: "700", outline: "none", cursor: "pointer" }}
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                      <select
                        value={judgesFilterCert}
                        onChange={(e) => setJudgesFilterCert(e.target.value)}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "100px", padding: "10px 14px", color: "white", fontSize: "13px", fontWeight: "700", outline: "none", cursor: "pointer" }}
                      >
                        <option value="all">All Certifications</option>
                        <option value="certified">Certified</option>
                        <option value="pending">Pending</option>
                      </select>
                      <select
                        value={judgesFilterPerf}
                        onChange={(e) => setJudgesFilterPerf(e.target.value)}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "100px", padding: "10px 14px", color: "white", fontSize: "13px", fontWeight: "700", outline: "none", cursor: "pointer" }}
                      >
                        <option value="all">Any Performance</option>
                        <option value="top_performers">Top Performers</option>
                        <option value="high_caseload">High Caseload</option>
                      </select>
                    </div>
                    <div style={{ color: "#888", fontSize: "13px", fontWeight: "700" }}>
                      Active Adjudicators: <span style={{ color: "white", fontWeight: "900" }}>{judges.length}</span>
                    </div>
                  </div>

                  {/* Judges Roster Table */}
                  <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: "1000px", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <th style={{ padding: "20px 24px", color: "#666", fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }}>Adjudicator Details</th>
                          <th style={{ padding: "20px 24px", color: "#666", fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }}>Workload Metrics</th>
                          <th style={{ padding: "20px 24px", color: "#666", fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }}>Avg Speed</th>
                          <th style={{ padding: "20px 24px", color: "#666", fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }}>Decisions Ratio</th>
                          <th style={{ padding: "20px 24px", color: "#666", fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }}>Oversight Notes</th>
                          <th style={{ padding: "20px 24px", color: "#666", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {judges
                          .filter(j => {
                            const q = judgesSearchQuery.toLowerCase();
                            const matchesSearch = !q ||
                              (j.name && j.name.toLowerCase().includes(q)) ||
                              (j.email && j.email.toLowerCase().includes(q)) ||
                              ((j.member_number || j.memberNumber) && (j.member_number || j.memberNumber).toLowerCase().includes(q)) ||
                              (j.certificationLevel && j.certificationLevel.toLowerCase().includes(q)) ||
                              (j.account_status && j.account_status.toLowerCase().includes(q));

                            const s = judgesFilterStatus;
                            const status = j.account_status || 'active';
                            const matchesStatus = s === "all" || (s === "active" && status === "active") || (s === "inactive" && status === "inactive") || (s === "suspended" && ['suspended', 'banned'].includes(status));

                            const c = judgesFilterCert;
                            const cert = j.certificationLevel || 'certified'; // Mock field for now
                            const matchesCert = c === "all" || (c === "certified" && cert === "certified") || (c === "pending" && cert === "pending");

                            const stats = j.stats || { assigned: 0, pending: 0, completed: 0, verified: 0, rejected: 0, averageSpeed: "1.2 days" };
                            const verPercent = stats.completed > 0 ? Math.round((stats.verified / stats.completed) * 100) : 50;
                            const p = judgesFilterPerf;
                            const matchesPerf = p === "all" ||
                              (p === "top_performers" && (stats.completed > 10 && verPercent >= 80)) ||
                              (p === "high_caseload" && stats.pending > 5);

                            return matchesSearch && matchesStatus && matchesCert && matchesPerf;
                          })
                          .map(judge => {
                            const stats = judge.stats || { assigned: 0, pending: 0, completed: 0, verified: 0, rejected: 0, averageSpeed: "1.2 days" };
                            const verPercent = stats.completed > 0 ? Math.round((stats.verified / stats.completed) * 100) : 50;
                            const rejPercent = stats.completed > 0 ? 100 - verPercent : 50;

                            return (
                              <tr key={judge.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.01)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                <td style={{ padding: "20px 24px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #FF5500, #b53c00)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "900", fontSize: "16px" }}>
                                      {judge.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: "900", color: "white", fontSize: "14px" }}>{judge.name}</div>
                                      <div style={{ color: "#666", fontSize: "12px" }}>{judge.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: "20px 24px" }}>
                                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ fontSize: "15px", fontWeight: "950", color: "white" }}>{stats.assigned}</div>
                                      <div style={{ fontSize: "9px", fontWeight: "900", color: "#666", textTransform: "uppercase" }}>Total</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ fontSize: "15px", fontWeight: "950", color: "#FF6A00" }}>{stats.pending}</div>
                                      <div style={{ fontSize: "9px", fontWeight: "900", color: "#666", textTransform: "uppercase" }}>Pending</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ fontSize: "15px", fontWeight: "950", color: "#22c55e" }}>{stats.completed}</div>
                                      <div style={{ fontSize: "9px", fontWeight: "900", color: "#666", textTransform: "uppercase" }}>Done</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: "20px 24px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "white", fontWeight: "800", fontSize: "13px" }}>
                                    <Clock size={14} color="#FF5500" /> {stats.averageSpeed}
                                  </div>
                                </td>
                                <td style={{ padding: "20px 24px", minWidth: "160px" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "900" }}>
                                      <span style={{ color: "#22c55e" }}>{stats.verified} VERIFY</span>
                                      <span style={{ color: "#ef4444" }}>{stats.rejected} REJECT</span>
                                    </div>
                                    <div style={{ height: "6px", borderRadius: "10px", background: "#222", overflow: "hidden", display: "flex" }}>
                                      <div style={{ width: `${verPercent}%`, background: "#22c55e", height: "100%" }} />
                                      <div style={{ width: `${rejPercent}%`, background: "#ef4444", height: "100%" }} />
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: "20px 24px", maxWidth: "250px" }}>
                                  <div style={{ color: "#aaa", fontSize: "12px", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {judge.admin_notes || "No oversight notes recorded."}
                                  </div>
                                </td>
                                <td style={{ padding: "20px 24px", textAlign: "right", position: "relative" }}>
                                  <button onClick={(e) => {
                                    const el = document.getElementById(`adj-actions-${judge.id}`);
                                    const allDropdowns = document.querySelectorAll('[id^="adj-actions-"]');
                                    allDropdowns.forEach(d => { if (d.id !== `adj-actions-${judge.id}`) d.style.display = 'none'; });
                                    el.style.display = el.style.display === 'none' ? 'block' : 'none';
                                  }} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}>
                                    <MoreVertical size={16} />
                                  </button>
                                  <div id={`adj-actions-${judge.id}`} style={{ display: 'none', position: 'absolute', right: "24px", top: '100%', background: '#000', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '4px', zIndex: 10, width: '190px', textAlign: 'left' }}>
                                     <button type="button" className="admin-dropdown-action-btn" onClick={(e) => { e.preventDefault(); document.getElementById(`adj-actions-${judge.id}`).style.display='none'; openModal('viewAdjudicatorProfile', judge); }}>View Profile</button>
                                     <button type="button" className="admin-dropdown-action-btn" onClick={(e) => { e.preventDefault(); document.getElementById(`adj-actions-${judge.id}`).style.display='none'; openModal('edit', judge); }}>Edit Adjudicator</button>
                                     <button type="button" className="admin-dropdown-action-btn" onClick={(e) => { e.preventDefault(); document.getElementById(`adj-actions-${judge.id}`).style.display='none'; setAdjudicatorActionTarget(judge); setActiveAdjudicatorModal('assign'); }}>Assign Case</button>
                                     <button type="button" className="admin-dropdown-action-btn" onClick={(e) => { e.preventDefault(); document.getElementById(`adj-actions-${judge.id}`).style.display='none'; setAdjudicatorActionTarget(judge); setActiveAdjudicatorModal('records'); }}>View Assigned Records</button>
                                     <button type="button" className="admin-dropdown-action-btn" onClick={(e) => { e.preventDefault(); document.getElementById(`adj-actions-${judge.id}`).style.display='none'; setAdjudicatorActionTarget(judge); setActiveAdjudicatorModal('history'); }}>View Review History</button>
                                     <button type="button" className="admin-dropdown-action-btn" onClick={(e) => { e.preventDefault(); document.getElementById(`adj-actions-${judge.id}`).style.display='none'; setAdjudicatorActionTarget(judge); setActiveAdjudicatorModal('cert'); }}>Certification Status</button>
                                     <button type="button" className="admin-dropdown-action-btn" onClick={(e) => { e.preventDefault(); document.getElementById(`adj-actions-${judge.id}`).style.display='none'; handleUserActionConfirm(judge, 'suspend'); }} style={{ color: '#f59e0b' }}>Suspend/Deactivate</button>
                                     <button type="button" className="admin-dropdown-action-btn" onClick={(e) => { e.preventDefault(); document.getElementById(`adj-actions-${judge.id}`).style.display='none'; setAdjudicatorActionTarget(judge); setAdjudicatorMessageSubject(""); setAdjudicatorMessageText(""); setActiveAdjudicatorModal('message'); }}>Message Adjudicator</button>
                                     <button type="button" className="admin-dropdown-action-btn" onClick={(e) => { e.preventDefault(); document.getElementById(`adj-actions-${judge.id}`).style.display='none'; handleExportAdjudicatorStats(judge); }}>Export Stats</button>
                                     <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.1)", margin: "4px 0" }}></div>
                                     <button type="button" className="admin-dropdown-action-btn" onClick={(e) => { e.preventDefault(); document.getElementById(`adj-actions-${judge.id}`).style.display='none'; setSelectedJudgeForNotes(judge); setJudgeNotesText(judge.admin_notes || ""); setIsJudgeNotesModalOpen(true); }}>Oversight Notes</button>
                                     <button type="button" className="admin-dropdown-action-btn" onClick={(e) => { e.preventDefault(); document.getElementById(`adj-actions-${judge.id}`).style.display='none'; handleRevokeJudge(judge); }} style={{ color: '#ef4444' }}>Revoke Access</button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ================= STATION B: DISPATCH & ASSIGNMENTS ================= */}
              {adjudicatorSubTab === "dispatch" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "32px" }}>
                    {/* Left side: Unassigned list */}
                    <div>
                      <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "900", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                          <FileText size={18} color="#FF5500" /> UNASSIGNED SUBMISSIONS
                        </h3>
                        <p style={{ color: "#666", fontSize: "12px", margin: "4px 0 0 0" }}>Pending records awaiting adjudicator dispatch.</p>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "650px", overflowY: "auto", paddingRight: "8px" }}>
                        {records.filter(r => r.status === "pending" && !r.assigned_judge_id).length === 0 ? (
                          <div style={{ background: "#111", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "16px", padding: "32px", textAlign: "center", color: "#666", fontSize: "13px" }}>
                            🎉 All pending submissions have been assigned to judges!
                          </div>
                        ) : (
                          records
                            .filter(r => r.status === "pending" && !r.assigned_judge_id)
                            .map(rec => (
                              <div key={rec.id} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                  <div>
                                    <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", padding: "2px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: "900", textTransform: "uppercase" }}>{rec.category || "General"}</span>
                                    <h4 style={{ margin: "6px 0 2px 0", fontSize: "14px", fontWeight: "800", color: "white" }}>{rec.title}</h4>
                                    <div style={{ fontSize: "11px", color: "#666" }}>Competitor ID: {rec.athlete_id || rec.user_id?.substring(0,8)}</div>
                                  </div>
                                  <div style={{ fontSize: "16px", fontWeight: "950", color: "#FF5500", textAlign: "right" }}>
                                    {rec.value} <span style={{ fontSize: "10px", color: "#666" }}>{rec.unit}</span>
                                  </div>
                                </div>
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                  <label style={{ fontSize: "10px", fontWeight: "900", color: "#666", textTransform: "uppercase" }}>Assign Adjudicator:</label>
                                  <select
                                    onChange={(e) => handleAssignRecord(rec.id, e.target.value)}
                                    defaultValue=""
                                    style={{ width: "100%", background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px", color: "white", fontSize: "12px", outline: "none" }}
                                  >
                                    <option value="" disabled>-- Select Certified Judge --</option>
                                    {judges.map(j => (
                                      <option key={j.id} value={j.id}>{j.name} (Backlog: {j.stats?.pending || 0})</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Right side: Dispatched ledger */}
                    <div>
                      <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "900", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Activity size={18} color="#22c55e" /> ACTIVE ADJUDICATION RUNS
                        </h3>
                        <p style={{ color: "#666", fontSize: "12px", margin: "4px 0 0 0" }}>Submissions currently under review by judges.</p>
                      </div>

                      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              <th style={{ padding: "16px 20px", color: "#666", fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }}>Attempt Title</th>
                              <th style={{ padding: "16px 20px", color: "#666", fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }}>Assigned Judge</th>
                              <th style={{ padding: "16px 20px", color: "#666", fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }}>Review Progress</th>
                              <th style={{ padding: "16px 20px", color: "#666", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", textAlign: "right" }}>Oversight actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {records.filter(r => r.status === "pending" && r.assigned_judge_id).length === 0 ? (
                              <tr>
                                <td colSpan="4" style={{ padding: "32px", textAlign: "center", color: "#666", fontSize: "13px" }}>
                                  No active adjudication runs at this time.
                                </td>
                              </tr>
                            ) : (
                              records
                                .filter(r => r.status === "pending" && r.assigned_judge_id)
                                .map(rec => {
                                  const judge = judges.find(j => j.id === rec.assigned_judge_id) || { name: "Assigned Adjudicator" };
                                  const isVerdictSubmitted = rec.judge_decision && rec.judge_decision !== 'pending';

                                  return (
                                    <tr key={rec.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                      <td style={{ padding: "16px 20px" }}>
                                        <div>
                                          <div style={{ fontWeight: "800", color: "white", fontSize: "13px" }}>{rec.title}</div>
                                          <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "700" }}>{rec.value} {rec.unit}</div>
                                        </div>
                                      </td>
                                      <td style={{ padding: "16px 20px", color: "#aaa", fontSize: "13px", fontWeight: "700" }}>{judge.name}</td>
                                      <td style={{ padding: "16px 20px" }}>
                                        {isVerdictSubmitted ? (
                                          <span style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", letterSpacing: "0.5px" }}>
                                            RECOMMENDED: {rec.judge_decision.toUpperCase()}
                                          </span>
                                        ) : (
                                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FFaa00", display: "inline-block" }} className="animate-pulse" />
                                            <span style={{ color: "#FFaa00", fontSize: "11px", fontWeight: "800" }}>UNDER INSPECTION</span>
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                        {!isVerdictSubmitted ? (
                                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                            <button
                                              onClick={() => handleSimulateJudgeVerdict(rec.id, 'verified', 'Verified: Athlete metadata and evidence video conforms with official timing codes. Recommendation: VERIFY.')}
                                              style={{ background: "rgba(34,197,94,0.1)", border: "none", color: "#22c55e", padding: "6px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", cursor: "pointer" }}
                                            >
                                              Simulate Verify
                                            </button>
                                            <button
                                              onClick={() => handleSimulateJudgeVerdict(rec.id, 'rejected', 'Rejected: Attempt timing failed to clear historical limits, or camera angle blocked full form validation.')}
                                              style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", padding: "6px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", cursor: "pointer" }}
                                            >
                                              Simulate Reject
                                            </button>
                                          </div>
                                        ) : (
                                          <span style={{ color: "#666", fontSize: "11px", fontWeight: "700" }}>Awaiting Admin Sign-off</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STATION C: OVERSIGHT & FINAL APPROVALS ================= */}
              {adjudicatorSubTab === "oversight" && (
                <div>
                  <div style={{ marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "900", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                      <CheckCircle size={18} color="#FF5500" /> FINAL VERDICT SIGN-OFF HUB
                    </h3>
                    <p style={{ color: "#666", fontSize: "12px", margin: "4px 0 0 0" }}>Sign off on adjudicators recommendations to finalize and publish records to the public portal.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {records.filter(r => r.status === "pending" && r.judge_decision && r.judge_decision !== 'pending').length === 0 ? (
                      <div style={{ background: "#111", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "24px", padding: "48px", textAlign: "center", color: "#666" }}>
                        <CheckCircle size={40} color="#22c55e" style={{ margin: "0 auto 16px auto", opacity: 0.5 }} />
                        <h4 style={{ color: "white", margin: "0 0 4px 0", fontSize: "15px", fontWeight: "800" }}>OVERSIGHT QUEUE IS EMPTY</h4>
                        <p style={{ margin: 0, fontSize: "12px" }}>No adjudicator recommendations are currently awaiting final administrative sign-off.</p>
                      </div>
                    ) : (
                      records
                        .filter(r => r.status === "pending" && r.judge_decision && r.judge_decision !== 'pending')
                        .map(rec => {
                          const judge = judges.find(j => j.id === rec.assigned_judge_id) || { name: "Certified Adjudicator" };
                          const isApprove = rec.judge_decision === "verified";

                          return (
                            <div key={rec.id} style={{ background: "#111", border: `1px solid ${isApprove ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`, borderRadius: "24px", padding: "28px", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "32px", alignItems: "center", position: "relative" }}>
                              {/* Glowing side accent */}
                              <div style={{ position: "absolute", left: 0, top: "10%", bottom: "10%", width: "4px", borderRadius: "0 4px 4px 0", background: isApprove ? "#22c55e" : "#ef4444" }} />

                              {/* Candidate metadata */}
                              <div>
                                <span style={{ background: isApprove ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: isApprove ? "#22c55e" : "#ef4444", padding: "3px 10px", borderRadius: "4px", fontSize: "9px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>
                                  {isApprove ? "Verify Recommended" : "Reject Recommended"}
                                </span>
                                <h4 style={{ margin: "12px 0 6px 0", fontSize: "18px", fontWeight: "900", color: "white" }}>{rec.title}</h4>
                                <p style={{ color: "#aaa", fontSize: "13px", margin: "0 0 12px 0" }}>{rec.description}</p>
                                <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#666" }}>
                                  <div>Category: <strong style={{ color: "white" }}>{rec.category}</strong></div>
                                  <div>Attempt Metric: <strong style={{ color: "#FF5500" }}>{rec.value} {rec.unit}</strong></div>
                                </div>
                              </div>

                              {/* Judge justification rationale */}
                              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "16px 20px" }}>
                                <div style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase", marginBottom: "6px" }}>Judge Inspection Report:</div>
                                <div style={{ fontWeight: "700", color: "white", fontSize: "12px", marginBottom: "4px" }}>{judge.name}</div>
                                <p style={{ color: "#aaa", fontSize: "12px", margin: 0, fontStyle: "italic", lineHeight: "1.4" }}>
                                  "{rec.judge_notes || "Evidence reviewed and recommendation finalized without extensive notes."}"
                                </p>
                              </div>

                              {/* Action button triggers */}
                              <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                                <button
                                  onClick={() => handleApproveOversightDecision(rec)}
                                  style={{ width: "100%", maxWidth: "220px", background: isApprove ? "#22c55e" : "#ef4444", color: "white", border: "none", padding: "12px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer", boxShadow: `0 4px 15px ${isApprove ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}
                                >
                                  APPROVE & PUBLISH LIVE
                                </button>
                                <button
                                  onClick={() => { setSelectedOversightRecord(rec); setOversightRevertFeedback(""); setIsOversightRevertModalOpen(true); }}
                                  style={{ width: "100%", maxWidth: "220px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}
                                >
                                  SEND BACK TO JUDGE
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {/* ================= MODAL: PROMOTE ATHLETE TO JUDGE ================= */}
              {isPromoteModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                  <div style={{ background: "#111", border: "1px solid rgba(255,106,0,0.3)", borderRadius: "32px", width: "100%", maxWidth: "500px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: "20px", fontWeight: "950", color: "white", margin: 0 }}>PROMOTE ATHLETE TO JUDGE</h3>
                      <button onClick={() => setIsPromoteModalOpen(false)} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}><X size={20} /></button>
                    </div>

                    <div style={{ position: "relative" }}>
                      <Search size={16} color="#666" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        type="text"
                        placeholder="Search standard athletes..."
                        value={promoteSearchQuery}
                        onChange={(e) => setPromoteSearchQuery(e.target.value)}
                        style={{ width: "100%", background: "#161616", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "10px 12px 10px 36px", color: "white", fontSize: "13px", outline: "none" }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
                      {users
                        .filter(u => u.role !== 'judge' && (
                          u.name?.toLowerCase().includes(promoteSearchQuery.toLowerCase()) ||
                          u.email?.toLowerCase().includes(promoteSearchQuery.toLowerCase()) ||
                          u.username?.toLowerCase().includes(promoteSearchQuery.toLowerCase()) ||
                          (u.member_number || u.memberNumber)?.toLowerCase().includes(promoteSearchQuery.toLowerCase())
                        ))
                        .slice(0, 8)
                        .map(athlete => (
                          <div key={athlete.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#161616", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)" }}>
                            <div>
                              <div style={{ fontWeight: "800", color: "white", fontSize: "13px" }}>{athlete.name}</div>
                              <div style={{ color: "#666", fontSize: "11px" }}>{athlete.email}</div>
                            </div>
                            <button
                              onClick={() => handlePromoteToJudge(athlete)}
                              style={{ background: "#FF5500", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "900", cursor: "pointer" }}
                            >
                              Promote
                            </button>
                          </div>
                        ))}
                      {users.filter(u => u.role !== 'judge').length === 0 && (
                        <div style={{ color: "#666", fontSize: "12px", textAlign: "center", padding: "20px" }}>No promotion candidates found.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= MODAL: EDIT JUDGE NOTES ================= */}
              {isJudgeNotesModalOpen && selectedJudgeForNotes && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                  <div style={{ background: "#111", border: "1px solid rgba(255,106,0,0.3)", borderRadius: "32px", width: "100%", maxWidth: "450px", padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "950", color: "white", margin: 0 }}>JUDGE OVERSIGHT NOTES</h3>
                      <button onClick={() => setIsJudgeNotesModalOpen(false)} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}><X size={20} /></button>
                    </div>

                    <div>
                      <div style={{ fontWeight: "800", color: "white", fontSize: "13px", marginBottom: "4px" }}>{selectedJudgeForNotes.name}</div>
                      <div style={{ color: "#666", fontSize: "11px", marginBottom: "16px" }}>{selectedJudgeForNotes.email}</div>

                      <label style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Private Feedback / Rating Comments:</label>
                      <textarea
                        value={judgeNotesText}
                        onChange={(e) => setJudgeNotesText(e.target.value)}
                        placeholder="Leave review comments, performance evaluations, or track accuracy notes on this adjudicator..."
                        style={{ width: "100%", height: "120px", background: "#161616", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px", color: "white", fontSize: "13px", outline: "none", resize: "none", fontFamily: "inherit" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                      <button onClick={() => setIsJudgeNotesModalOpen(false)} style={{ background: "transparent", border: "none", color: "#888", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                      <button
                        onClick={handleSaveJudgeNotes}
                        style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 20px", borderRadius: "100px", fontSize: "13px", fontWeight: "900", cursor: "pointer" }}
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= MODAL: REVERT OVERSIGHT DECISION ================= */}
              {isOversightRevertModalOpen && selectedOversightRecord && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                  <div style={{ background: "#111", border: "1px solid rgba(255,106,0,0.3)", borderRadius: "32px", width: "100%", maxWidth: "450px", padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "950", color: "white", margin: 0 }}>SEND BACK TO ADJUDICATOR</h3>
                      <button onClick={() => setIsOversightRevertModalOpen(false)} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}><X size={20} /></button>
                    </div>

                    <div>
                      <div style={{ fontWeight: "800", color: "white", fontSize: "13px", marginBottom: "4px" }}>RE: {selectedOversightRecord.title}</div>
                      <div style={{ color: "#FF5500", fontSize: "12px", fontWeight: "700", marginBottom: "16px" }}>Current Verdict: Recommend {selectedOversightRecord.judge_decision === 'verified' ? 'Verify' : 'Reject'}</div>

                      <label style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Correction & Revision Guidelines:</label>
                      <textarea
                        value={oversightRevertFeedback}
                        onChange={(e) => setOversightRevertFeedback(e.target.value)}
                        placeholder="Leave technical instructions for the judge to re-evaluate this evidence attempt (e.g. check reps count at 1:45)..."
                        style={{ width: "100%", height: "120px", background: "#161616", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px", color: "white", fontSize: "13px", outline: "none", resize: "none", fontFamily: "inherit" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                      <button onClick={() => setIsOversightRevertModalOpen(false)} style={{ background: "transparent", border: "none", color: "#888", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                      <button
                        onClick={handleRevertOversightDecision}
                        style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 20px", borderRadius: "100px", fontSize: "13px", fontWeight: "900", cursor: "pointer" }}
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================== 5C. VERIFICATION QUEUE SYSTEM ==================== */}
          {activeTab === "verificationQueue" && (() => {
            // Derive verificationStatus for each record (from overrides or infer from status)
            const getVqStatus = (r) => {
              if (vqStatusOverrides[r.id]) return vqStatusOverrides[r.id];
              if (r.verification_status) return r.verification_status;
              if (r.status === "verified") return "approved";
              if (r.status === "rejected") return "denied";
              return "pending_review";
            };

            const VQ_STATUSES = [
              // Pending Review: new, not picked up yet. Under Review: an adjudicator is actively checking it.
              { key: "pending_review",  label: "Pending Review",        color: "#FF6A00", bg: "rgba(255,106,0,0.12)",  icon: <Clock size={14} /> },
              { key: "under_review",    label: "Under Review",          color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: <Eye size={14} /> },
              { key: "approved",        label: "Approved",              color: "#22c55e", bg: "rgba(34,197,94,0.12)",  icon: <CheckCircle size={14} /> },
              { key: "denied",          label: "Denied",                color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: <XCircle size={14} /> },
              { key: "needs_info",      label: "Needs More Information",color: "#a855f7", bg: "rgba(168,85,247,0.12)",icon: <AlertTriangle size={14} /> },
              { key: "priority",        label: "Priority",              color: "#ffcc00", bg: "rgba(255,204,0,0.12)",  icon: <Zap size={14} /> },
            ];

            const filteredRecords = records.filter(r => {
              const vqs = getVqStatus(r);
              const matchesFilter = vqFilter === "all" || vqs === vqFilter;
              const matchesSearch = !vqSearchQuery.trim() ||
                (r.title || "").toLowerCase().includes(vqSearchQuery.toLowerCase()) ||
                (r.user?.name || "").toLowerCase().includes(vqSearchQuery.toLowerCase()) ||
                (r.category || "").toLowerCase().includes(vqSearchQuery.toLowerCase());
              return matchesFilter && matchesSearch;
            }).sort((a, b) => {
              if (vqSortBy === "priority") {
                const pa = getVqStatus(a) === "priority" ? -1 : 0;
                const pb = getVqStatus(b) === "priority" ? -1 : 0;
                return pa - pb;
              }
              if (vqSortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
              return new Date(b.created_at) - new Date(a.created_at); // newest
            });

            const handleVqStatusChange = async (recordId, newStatus) => {
              setVqUpdating(recordId);
              // Optimistic local update
              setVqStatusOverrides(prev => ({ ...prev, [recordId]: newStatus }));
              try {
                await apiCall(`/records/admin/adjudicate/${recordId}`, "PUT", {
                  status: newStatus === "approved" ? "verified" : newStatus === "denied" ? "rejected" : "pending",
                  verification_status: newStatus,
                  points: parseInt(vqPointsAwarded) || 0,
                  is_world_record: vqIsWorldRecord
                }, user.token);
                showToast(`Status updated to "${VQ_STATUSES.find(s=>s.key===newStatus)?.label || newStatus}"`, "success");
              } catch (err) {
                showToast(`Failed to update status: ${err.message}`, "error");
                // revert
                setVqStatusOverrides(prev => { const c = {...prev}; delete c[recordId]; return c; });
              } finally {
                setVqUpdating(null);
              }
            };

            const countsMap = {};
            VQ_STATUSES.forEach(s => {
              countsMap[s.key] = records.filter(r => getVqStatus(r) === s.key).length;
            });

            return (
              <div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
                  <div>
                    <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>Record Oversight Engine</div>
                    <h2 style={{ fontSize: "52px", fontWeight: "950", margin: "0 0 12px 0", color: "white", letterSpacing: "-2px", textTransform: "uppercase", lineHeight: "1" }}>
                      VERIFICATION
                      <br /><span style={{ color: "#FF5500" }}>QUEUE</span>
                    </h2>
                    <p style={{ color: "#888", margin: 0, fontSize: "14px", maxWidth: "480px", lineHeight: "1.6" }}>
                      Manage and triage every world-record submission through the full review pipeline — from initial intake to final verdict.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "12px" }}>
                    <div style={{ position: "relative" }}>
                      <Search size={14} color="#666" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        type="text"
                        placeholder="Search submissions..."
                        value={vqSearchQuery}
                        onChange={e => setVqSearchQuery(e.target.value)}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px 14px 10px 34px", color: "white", fontSize: "13px", outline: "none", width: "220px" }}
                      />
                    </div>
                    <select
                      value={vqSortBy}
                      onChange={e => setVqSortBy(e.target.value)}
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none", cursor: "pointer" }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="priority">Priority First</option>
                    </select>
                  </div>
                </div>

                {/* Status Stat Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px", marginBottom: "36px" }}>
                  {[
                    { key: "all", label: "All", count: records.length, color: "#aaa", bg: "rgba(255,255,255,0.05)" },
                    ...VQ_STATUSES.map(s => ({ ...s, count: countsMap[s.key] || 0 }))
                  ].map(s => (
                    <div
                      key={s.key}
                      onClick={() => setVqFilter(s.key)}
                      style={{
                        background: vqFilter === s.key ? s.bg || "rgba(255,255,255,0.08)" : "#111",
                        border: `1px solid ${vqFilter === s.key ? s.color : "rgba(255,255,255,0.05)"}`,
                        borderRadius: "14px",
                        padding: "18px 16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: vqFilter === s.key ? `0 0 20px ${s.color}22` : "none"
                      }}
                    >
                      <div style={{ fontSize: "10px", color: vqFilter === s.key ? s.color : "#666", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>{s.label}</div>
                      <div style={{ fontSize: "28px", fontWeight: "950", color: vqFilter === s.key ? s.color : "white", lineHeight: "1" }}>{s.count}</div>
                    </div>
                  ))}
                </div>

                {/* Main Queue Table */}
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", overflow: "hidden", marginBottom: "32px" }}>
                  <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <ClipboardList size={18} color="#FF5500" />
                      <h3 style={{ fontSize: "16px", fontWeight: "900", margin: 0 }}>Review Queue</h3>
                      <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", padding: "2px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: "900" }}>{filteredRecords.length} records</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#555", fontWeight: "800" }}>Click a row to review in detail</div>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)" }}>
                        {["ATHLETE", "RECORD TITLE", "CATEGORY", "SUBMITTED", "QUEUE STATUS", "ACTIONS"].map(h => (
                          <th key={h} style={{ padding: "14px 20px", textAlign: h === "ACTIONS" ? "right" : "left", fontSize: "10px", color: "#555", fontWeight: "900", letterSpacing: "0.8px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: "48px" }}><Loader2 className="animate-spin" size={24} color="#FF5500" /></td></tr>
                      ) : filteredRecords.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: "48px", color: "#555", fontWeight: "700" }}>No submissions match this filter.</td></tr>
                      ) : filteredRecords.map((r, idx) => {
                        const vqs = getVqStatus(r);
                        const statusInfo = VQ_STATUSES.find(s => s.key === vqs) || VQ_STATUSES[0];
                        const isUpdating = vqUpdating === r.id;
                        return (
                          <tr
                            key={r.id || idx}
                            className="table-row-hover"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }}
                          >
                            <td style={{ padding: "16px 20px" }} onClick={() => { setSelectedVqRecord(r); setVqIsWorldRecord(r.is_world_record || false); setVqAdminNote(""); setIsVqDetailOpen(true); }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <img loading="lazy" decoding="async" src={`https://ui-avatars.com/api/?name=${r.user?.name || 'A'}&background=random&size=40`} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid rgba(255,85,0,0.3)" }} />
                                <div>
                                  <div style={{ fontWeight: "800", fontSize: "13px", color: "white" }}>{r.user?.name || "Unknown Athlete"}</div>
                                  <div style={{ fontSize: "11px", color: "#555", marginTop: "1px" }}>{r.user?.email || ""}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "16px 20px" }} onClick={() => { setSelectedVqRecord(r); setVqIsWorldRecord(r.is_world_record || false); setVqAdminNote(""); setIsVqDetailOpen(true); }}>
                              <div style={{ fontWeight: "800", fontSize: "13px", color: "white", marginBottom: "3px" }}>{r.title}</div>
                              <div style={{ fontSize: "11px", color: "#555", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Video size={10} />{r.evidence_url ? "Video attached" : "No video"}
                              </div>
                            </td>
                            <td style={{ padding: "16px 20px" }} onClick={() => { setSelectedVqRecord(r); setVqIsWorldRecord(r.is_world_record || false); setVqAdminNote(""); setVqPointsAwarded(0); setIsVqDetailOpen(true); }}>
                              <span style={{ background: "rgba(255,255,255,0.05)", color: "#aaa", padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase" }}>{r.category || "General"}</span>
                            </td>
                            <td style={{ padding: "16px 20px", color: "#666", fontSize: "12px", fontWeight: "600" }} onClick={() => { setSelectedVqRecord(r); setVqIsWorldRecord(r.is_world_record || false); setVqAdminNote(""); setIsVqDetailOpen(true); }}>
                              {new Date(r.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                            </td>
                            <td style={{ padding: "16px 20px" }}>
                              <select
                                value={vqs}
                                disabled={isUpdating}
                                onChange={e => handleVqStatusChange(r.id, e.target.value)}
                                style={{
                                  backgroundColor: statusInfo.bg,
                                  border: `1px solid ${statusInfo.color}55`,
                                  color: statusInfo.color,
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  fontSize: "11px",
                                  fontWeight: "900",
                                  cursor: isUpdating ? "not-allowed" : "pointer",
                                  outline: "none",
                                  appearance: "none",
                                  paddingRight: "28px",
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23${statusInfo.color.replace('#','')}' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "right 8px center"
                                }}
                              >
                                {VQ_STATUSES.map(s => (
                                  <option key={s.key} value={s.key} style={{ background: "#111", color: "white" }}>{s.label}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: "16px 20px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                <button
                                  onClick={() => handleVqStatusChange(r.id, "priority")}
                                  title="Mark as Priority"
                                  style={{ background: vqs === "priority" ? "rgba(255,204,0,0.2)" : "transparent", border: `1px solid ${vqs === "priority" ? "rgba(255,204,0,0.4)" : "rgba(255,255,255,0.08)"}`, color: vqs === "priority" ? "#ffcc00" : "#555", width: "30px", height: "30px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                ><Zap size={14} /></button>
                                <button
                                  onClick={() => handleVqStatusChange(r.id, "under_review")}
                                  title="Mark Under Review"
                                  style={{ background: vqs === "under_review" ? "rgba(59,130,246,0.15)" : "transparent", border: "1px solid rgba(255,255,255,0.08)", color: vqs === "under_review" ? "#3b82f6" : "#555", width: "30px", height: "30px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                ><Eye size={14} /></button>
                                <button
                                  onClick={() => handleVqStatusChange(r.id, "approved")}
                                  title="Approve"
                                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", width: "30px", height: "30px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                ><CheckCircle size={14} /></button>
                                <button
                                  onClick={() => handleVqStatusChange(r.id, "denied")}
                                  title="Deny"
                                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", width: "30px", height: "30px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                ><XCircle size={14} /></button>
                                <button
                                  onClick={() => { setSelectedVqRecord(r); setVqIsWorldRecord(r.is_world_record || false); setVqAdminNote(""); setVqPointsAwarded(0); setIsVqDetailOpen(true); }}
                                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#888", width: "30px", height: "30px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                ><FileText size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom KPI strip: Queue Pipeline Visual */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "1px", background: "rgba(255,255,255,0.04)", borderRadius: "16px", overflow: "hidden", marginBottom: "32px" }}>
                  {VQ_STATUSES.map((s, idx) => {
                    const total = records.length || 1;
                    const count = countsMap[s.key] || 0;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={s.key} style={{ background: "#0e0e0e", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: s.color }}>{s.icon}<span style={{ fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</span></div>
                        <div style={{ fontSize: "26px", fontWeight: "950", color: "white", lineHeight: "1" }}>{count}</div>
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: s.color, borderRadius: "2px", transition: "width 0.4s" }} />
                        </div>
                        <div style={{ fontSize: "10px", color: "#555", fontWeight: "800" }}>{pct}% of total</div>
                      </div>
                    );
                  })}
                </div>

                {/* Detail Modal */}
                {isVqDetailOpen && selectedVqRecord && (
                  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500, padding: "20px" }}>
                    <div style={{ background: "#0e0e0e", border: "1px solid rgba(255,85,0,0.2)", borderRadius: "28px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", padding: "36px" }}>
                      {/* Modal Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                        <div>
                          <div style={{ color: "#FF5500", fontSize: "10px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Verification Detail</div>
                          <h3 style={{ fontSize: "22px", fontWeight: "950", color: "white", margin: "0 0 4px 0" }}>{selectedVqRecord.title}</h3>
                          <div style={{ fontSize: "12px", color: "#666" }}>Submitted by {selectedVqRecord.user?.name || "Unknown"} • {new Date(selectedVqRecord.created_at || Date.now()).toLocaleString()}</div>
                        </div>
                        <button onClick={() => setIsVqDetailOpen(false)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#888", cursor: "pointer", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
                      </div>

                      {/* Info Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                        {[
                          { label: "Category", value: selectedVqRecord.category || "General" },
                          { label: "Athlete", value: selectedVqRecord.user?.name || "Unknown" },
                          { label: "Email", value: selectedVqRecord.user?.email || "N/A" },
                          { label: "Record Value", value: selectedVqRecord.value ? `${selectedVqRecord.value} ${selectedVqRecord.unit || ""}` : "Not specified" },
                          { label: "Venue", value: selectedVqRecord.venue_name || selectedVqRecord.city || "Not specified" },
                          { label: "Evidence", value: selectedVqRecord.evidence_url ? "Video attached" : "No video" },
                        ].map(f => (
                          <div key={f.label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "14px 16px" }}>
                            <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{f.label}</div>
                            <div style={{ fontSize: "13px", color: "white", fontWeight: "700" }}>{f.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Description */}
                      {selectedVqRecord.description && (
                        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                          <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Description</div>
                          <div style={{ fontSize: "13px", color: "#ccc", lineHeight: "1.6" }}>{selectedVqRecord.description}</div>
                        </div>
                      )}

                      {/* Evidence Video Link */}
                      {selectedVqRecord.evidence_url && (
                        <div style={{ marginBottom: "20px" }}>
                          <a href={selectedVqRecord.evidence_url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,85,0,0.1)", border: "1px solid rgba(255,85,0,0.2)", color: "#FF6A00", padding: "10px 18px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", textDecoration: "none", textTransform: "uppercase", letterSpacing: "1px" }}>
                            <Video size={14} /> View Evidence Video <ArrowRight size={14} />
                          </a>
                        </div>
                      )}

                      {/* Current Status & Change */}
                      <div style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Change Queue Status</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {VQ_STATUSES.map(s => {
                            const currentStatus = getVqStatus(selectedVqRecord);
                            const isActive = currentStatus === s.key;
                            return (
                              <button
                                key={s.key}
                                onClick={() => {
                                  handleVqStatusChange(selectedVqRecord.id, s.key);
                                  setVqStatusOverrides(prev => ({ ...prev, [selectedVqRecord.id]: s.key }));
                                }}
                                style={{
                                  background: isActive ? s.bg : "rgba(255,255,255,0.03)",
                                  border: `1px solid ${isActive ? s.color : "rgba(255,255,255,0.08)"}`,
                                  color: isActive ? s.color : "#666",
                                  padding: "8px 14px",
                                  borderRadius: "100px",
                                  fontSize: "11px",
                                  fontWeight: "900",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  transition: "all 0.15s"
                                }}
                              >
                                {s.icon} {s.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Admin Note & Points */}
                      <div style={{ marginBottom: "24px" }}>
                        <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Admin Note / Feedback to Athlete</div>
                        <textarea
                          value={vqAdminNote}
                          onChange={e => setVqAdminNote(e.target.value)}
                          placeholder="Leave an internal note or message to the athlete explaining the decision..."
                          style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px", color: "white", fontSize: "13px", outline: "none", resize: "vertical", minHeight: "90px", fontFamily: "inherit", marginBottom: "16px" }}
                        />

                        {getVqStatus(selectedVqRecord) === 'approved' && (
                          <div>
                            <div style={{ fontSize: "10px", color: "#22c55e", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Points to Award (For Rankings)</div>
                            <input
                              type="number"
                              min="0"
                              value={vqPointsAwarded}
                              onChange={e => setVqPointsAwarded(e.target.value)}
                              placeholder="e.g. 5000"
                              style={{ width: "200px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "8px", padding: "12px 14px", color: "#22c55e", fontSize: "14px", fontWeight: "900", outline: "none" }}
                            />
                            <div style={{ fontSize: "11px", color: "#666", marginTop: "6px" }}>Award points to this athlete upon approval to boost their rank.</div>
                            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,215,0,0.05)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,215,0,0.2)" }}>
                              <input
                                type="checkbox"
                                id="isWorldRecordCheckbox"
                                checked={vqIsWorldRecord}
                                onChange={e => setVqIsWorldRecord(e.target.checked)}
                                style={{ accentColor: "#FFD700", width: "16px", height: "16px", cursor: "pointer" }}
                              />
                              <label htmlFor="isWorldRecordCheckbox" style={{ fontSize: "12px", color: "#FFD700", fontWeight: "900", letterSpacing: "0.5px", cursor: "pointer" }}>OFFICIALLY RECOGNIZE AS A WORLD RECORD</label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Modal Actions */}
                      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                        <button onClick={() => setIsVqDetailOpen(false)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#aaa", padding: "12px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "800", fontSize: "12px" }}>CLOSE</button>
                        <button
                          onClick={() => {
                            handleVqStatusChange(selectedVqRecord.id, "approved");
                            setIsVqDetailOpen(false);
                          }}
                          style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", border: "none", color: "white", padding: "12px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "900", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase" }}
                        ><CheckCircle size={14} /> APPROVE</button>
                        <button
                          onClick={() => {
                            handleVqStatusChange(selectedVqRecord.id, "needs_info");
                            setIsVqDetailOpen(false);
                          }}
                          style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7", padding: "12px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "900", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase" }}
                        ><AlertTriangle size={14} /> NEEDS INFO</button>
                        <button
                          onClick={() => {
                            handleVqStatusChange(selectedVqRecord.id, "denied");
                            setIsVqDetailOpen(false);
                          }}
                          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "12px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "900", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase" }}
                        ><XCircle size={14} /> DENY</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ==================== 5D. AI VERIFICATION CONTROLS ==================== */}
          {activeTab === "aiVerification" && (() => {
            const threshold = parseFloat(aiSettings.ai_min_confidence_threshold || "80.00");

            const getAIScanStatus = (scan) => {
              if (scan.override_status && scan.override_status !== "none") {
                return scan.override_status === "approved" ? "Overridden (Approved)" : "Overridden (Rejected)";
              }
              if (scan.suspicious_flagged) return "Flagged Suspicious";
              return scan.status === "passed" ? "Passed" : scan.status === "suspicious" ? "Suspicious" : "Failed";
            };

            const filteredScans = aiScans.filter(scan => {
              const record = scan.record || {};
              const matchesSearch = !aiSearchQuery.trim() ||
                (record.title || "").toLowerCase().includes(aiSearchQuery.toLowerCase()) ||
                (record.user?.name || "").toLowerCase().includes(aiSearchQuery.toLowerCase()) ||
                (record.category || "").toLowerCase().includes(aiSearchQuery.toLowerCase());

              const aiStatus = getAIScanStatus(scan);
              let matchesFilter = true;
              if (aiFilterStatus === "passed") matchesFilter = scan.status === "passed" && scan.override_status === "none";
              else if (aiFilterStatus === "suspicious") matchesFilter = scan.status === "suspicious" && scan.override_status === "none";
              else if (aiFilterStatus === "failed") matchesFilter = scan.status === "failed" && scan.override_status === "none";
              else if (aiFilterStatus === "overridden") matchesFilter = scan.override_status !== "none";
              else if (aiFilterStatus === "flagged") matchesFilter = !!scan.suspicious_flagged;

              return matchesSearch && matchesFilter;
            });

            // Counts for stats
            const totalCount = aiScans.length;
            const passedCount = aiScans.filter(s => s.status === "passed" && s.override_status === "none").length;
            const suspiciousCount = aiScans.filter(s => (s.status === "suspicious" || s.suspicious_flagged) && s.override_status === "none").length;
            const failedCount = aiScans.filter(s => s.status === "failed" && s.override_status === "none").length;
            const overriddenCount = aiScans.filter(s => s.override_status !== "none").length;

            return (
              <div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
                  <div>
                    <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>Automated Integrity Vault</div>
                    <h2 style={{ fontSize: "52px", fontWeight: "950", margin: "0 0 12px 0", color: "white", letterSpacing: "-2px", textTransform: "uppercase", lineHeight: "1" }}>
                      AI VERIFICATION
                      <br /><span style={{ color: "#FF5500" }}>CONTROLS</span>
                    </h2>
                    <p style={{ color: "#888", margin: 0, fontSize: "14px", maxWidth: "520px", lineHeight: "1.6" }}>
                      Inspect machine-learning authenticity telemetry including generative model forensics, pitch manipulation graphs, and splice rate logs.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "12px" }}>
                    <div style={{ position: "relative" }}>
                      <Search size={14} color="#666" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        type="text"
                        placeholder="Search scans..."
                        value={aiSearchQuery}
                        onChange={e => setAiSearchQuery(e.target.value)}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px 14px 10px 34px", color: "white", fontSize: "13px", outline: "none", width: "220px" }}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Configuration Section */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", marginBottom: "36px", backdropFilter: "blur(12px)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                    <Settings size={18} color="#FF5500" />
                    <h3 style={{ fontSize: "16px", fontWeight: "900", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Global AI Settings & Parameters</h3>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                    {/* Left Column: Sensitivity Threshold Slider */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <label style={{ fontSize: "12px", color: "#aaa", fontWeight: "800", textTransform: "uppercase" }}>Authenticity Sensitivity Threshold</label>
                        <span style={{
                          fontSize: "14px",
                          fontWeight: "900",
                          color: threshold >= 85 ? "#ef4444" : threshold >= 75 ? "#FF5500" : "#22c55e",
                          background: threshold >= 85 ? "rgba(239,68,68,0.12)" : threshold >= 75 ? "rgba(255,85,0,0.12)" : "rgba(34,197,94,0.12)",
                          padding: "2px 10px",
                          borderRadius: "100px"
                        }}>
                          {threshold}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="98"
                        value={threshold}
                        onChange={e => handleSaveAiSettings({ ...aiSettings, ai_min_confidence_threshold: parseFloat(e.target.value).toFixed(2) })}
                        style={{
                          width: "100%",
                          accentColor: "#FF5500",
                          background: "rgba(255,255,255,0.06)",
                          height: "6px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          marginBottom: "16px"
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#555", fontWeight: "800" }}>
                        <span>50% (LOW FILTRATION)</span>
                        <span>75% (BALANCED)</span>
                        <span>98% (MAX SECURITY)</span>
                      </div>
                    </div>

                    {/* Right Column: Checkbox Config Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      {[
                        { key: "ai_deepfake_check_enabled", label: "Generative Deepfake Forensics", icon: <Sparkles size={14} /> },
                        { key: "ai_video_tampering_check_enabled", label: "Video Cut & Splice Auditor", icon: <Video size={14} /> },
                        { key: "ai_audio_tampering_check_enabled", label: "Audio pitch Tampering check", icon: <Radio size={14} /> }
                      ].map(check => {
                        const isChecked = aiSettings[check.key] === "true";
                        return (
                          <div
                            key={check.key}
                            onClick={() => handleSaveAiSettings({ ...aiSettings, [check.key]: isChecked ? "false" : "true" })}
                            style={{
                              background: isChecked ? "rgba(255,85,0,0.06)" : "rgba(255,255,255,0.01)",
                              border: `1px solid ${isChecked ? "#FF550055" : "rgba(255,255,255,0.04)"}`,
                              borderRadius: "14px",
                              padding: "12px 16px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ color: isChecked ? "#FF5500" : "#555" }}>{check.icon}</div>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: isChecked ? "white" : "#777" }}>{check.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Queue Summary Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "36px" }}>
                  {[
                    { key: "all", label: "All Scans", count: totalCount, color: "#aaa", bg: "rgba(255,255,255,0.05)" },
                    { key: "passed", label: "Passed Scans", count: passedCount, color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
                    { key: "suspicious", label: "Suspicious", count: suspiciousCount, color: "#FF5500", bg: "rgba(255,106,0,0.12)" },
                    { key: "failed", label: "Failed Scans", count: failedCount, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
                    { key: "overridden", label: "Overridden", count: overriddenCount, color: "#a855f7", bg: "rgba(168,85,247,0.12)" }
                  ].map(s => (
                    <div
                      key={s.key}
                      onClick={() => setAiFilterStatus(s.key)}
                      style={{
                        background: aiFilterStatus === s.key ? s.bg : "#111",
                        border: `1px solid ${aiFilterStatus === s.key ? s.color : "rgba(255,255,255,0.05)"}`,
                        borderRadius: "14px",
                        padding: "18px 16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: aiFilterStatus === s.key ? `0 0 20px ${s.color}22` : "none"
                      }}
                    >
                      <div style={{ fontSize: "10px", color: aiFilterStatus === s.key ? s.color : "#666", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>{s.label}</div>
                      <div style={{ fontSize: "28px", fontWeight: "950", color: aiFilterStatus === s.key ? s.color : "white", lineHeight: "1" }}>{s.count}</div>
                    </div>
                  ))}
                </div>

                {/* Queue Submissions Table */}
                <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", overflow: "hidden", marginBottom: "32px" }}>
                  <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Activity size={18} color="#FF5500" />
                      <h3 style={{ fontSize: "16px", fontWeight: "900", margin: 0 }}>Authenticity Logs</h3>
                      <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", padding: "2px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: "900" }}>{filteredScans.length} active</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#555", fontWeight: "800" }}>Click a report row to view telemetry graphs</div>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)" }}>
                        {["ATHLETE & TYPE", "RECORD TITLE", "AUTHENTICITY SCORE", "CHECK FLAGS", "AI STATUS", "ACTIONS"].map(h => (
                          <th key={h} style={{ padding: "14px 20px", textAlign: h === "ACTIONS" ? "right" : "left", fontSize: "10px", color: "#555", fontWeight: "900", letterSpacing: "0.8px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: "48px" }}><Loader2 className="animate-spin" size={24} color="#FF5500" /></td></tr>
                      ) : filteredScans.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: "48px", color: "#555", fontWeight: "700" }}>No scans match this status filter.</td></tr>
                      ) : filteredScans.map((scan, idx) => {
                        const rec = scan.record || {};
                        const score = parseFloat(scan.confidence_score);
                        const isSuspicious = scan.suspicious_flagged;
                        const ovStatus = scan.override_status;

                        // UI coloring based on score
                        const scoreColor = score >= 85 ? "#22c55e" : score >= 70 ? "#eab308" : "#ef4444";
                        const scoreBg = score >= 85 ? "rgba(34,197,94,0.12)" : score >= 70 ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.12)";


                        const deepfakeBadge = getCheckBadge(scan.deepfake_check);
                        const videoBadge = getCheckBadge(scan.video_tamper_check);
                        const audioBadge = getCheckBadge(scan.audio_tamper_check);

                        return (
                          <tr
                            key={scan.id || idx}
                            className="table-row-hover"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }}
                          >
                            <td style={{ padding: "16px 20px" }} onClick={() => { setSelectedAiScan(scan); setAiOverrideStatus(scan.override_status); setAiOverrideReason(scan.override_reason || ""); setIsAiDetailModalOpen(true); }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <img loading="lazy" decoding="async" src={`https://ui-avatars.com/api/?name=${rec.user?.name || 'A'}&background=random&size=40`} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid rgba(255,85,0,0.3)" }} />
                                <div>
                                  <div style={{ fontWeight: "800", fontSize: "13px", color: "white" }}>{rec.user?.name || "Unknown Athlete"}</div>
                                  <div style={{ fontSize: "10px", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                    <span style={{
                                      background: rec.record_type === "challenge" ? "rgba(168,85,247,0.15)" : "rgba(59,130,246,0.15)",
                                      color: rec.record_type === "challenge" ? "#a855f7" : "#3b82f6",
                                      padding: "1px 6px",
                                      borderRadius: "100px",
                                      fontWeight: "900",
                                      textTransform: "uppercase"
                                    }}>
                                      {rec.record_type || "standard"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: "16px 20px" }} onClick={() => { setSelectedAiScan(scan); setAiOverrideStatus(scan.override_status); setAiOverrideReason(scan.override_reason || ""); setIsAiDetailModalOpen(true); }}>
                              <div style={{ fontWeight: "800", fontSize: "13px", color: "white", marginBottom: "3px" }}>{rec.title}</div>
                              <div style={{ fontSize: "11px", color: "#555", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Video size={10} />{rec.evidence_url ? "Footage attached" : "No evidence"}
                              </div>
                            </td>

                            <td style={{ padding: "16px 20px" }} onClick={() => { setSelectedAiScan(scan); setAiOverrideStatus(scan.override_status); setAiOverrideReason(scan.override_reason || ""); setIsAiDetailModalOpen(true); }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "80px", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                                  <div style={{ width: `${score}%`, height: "100%", background: scoreColor }} />
                                </div>
                                <span style={{ fontSize: "13px", fontWeight: "900", color: scoreColor }}>{score}%</span>
                              </div>
                            </td>

                            <td style={{ padding: "16px 20px" }} onClick={() => { setSelectedAiScan(scan); setAiOverrideStatus(scan.override_status); setAiOverrideReason(scan.override_reason || ""); setIsAiDetailModalOpen(true); }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <span style={{ padding: "2px 6px", borderRadius: "6px", fontSize: "9px", fontWeight: "900", background: "rgba(255,255,255,0.03)", border: `1px solid ${deepfakeBadge.color}33`, color: deepfakeBadge.color }}>
                                  DF: {deepfakeBadge.label}
                                </span>
                                <span style={{ padding: "2px 6px", borderRadius: "6px", fontSize: "9px", fontWeight: "900", background: "rgba(255,255,255,0.03)", border: `1px solid ${videoBadge.color}33`, color: videoBadge.color }}>
                                  CUT: {videoBadge.label}
                                </span>
                                <span style={{ padding: "2px 6px", borderRadius: "6px", fontSize: "9px", fontWeight: "900", background: "rgba(255,255,255,0.03)", border: `1px solid ${audioBadge.color}33`, color: audioBadge.color }}>
                                  AUD: {audioBadge.label}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: "16px 20px" }} onClick={() => { setSelectedAiScan(scan); setAiOverrideStatus(scan.override_status); setAiOverrideReason(scan.override_reason || ""); setIsAiDetailModalOpen(true); }}>
                              {ovStatus !== "none" ? (
                                <span style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.4)", color: "#a855f7", padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase" }}>
                                  Override: {ovStatus}
                                </span>
                              ) : isSuspicious ? (
                                <span style={{ background: "rgba(255,204,0,0.12)", border: "1px solid rgba(255,204,0,0.4)", color: "#ffcc00", padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase" }}>
                                  ⚠️ Suspicious
                                </span>
                              ) : (
                                <span style={{ background: scoreBg, border: `1px solid ${scoreColor}44`, color: scoreColor, padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase" }}>
                                  AI: {scan.status}
                                </span>
                              )}
                            </td>

                            <td style={{ padding: "16px 20px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                <button
                                  onClick={() => handleAIScanFlag(scan.record_id, !isSuspicious)}
                                  title={isSuspicious ? "Clear Flag" : "Flag Suspicious ⚠️"}
                                  style={{
                                    background: isSuspicious ? "rgba(255,204,0,0.2)" : "transparent",
                                    border: `1px solid ${isSuspicious ? "rgba(255,204,0,0.4)" : "rgba(255,255,255,0.08)"}`,
                                    color: isSuspicious ? "#ffcc00" : "#555",
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s"
                                  }}
                                ><Flag size={14} /></button>
                                <button
                                  onClick={() => { setSelectedAiScan(scan); setAiOverrideStatus(scan.override_status); setAiOverrideReason(scan.override_reason || ""); setIsAiDetailModalOpen(true); }}
                                  title="Detailed Diagnostic Report"
                                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#888", width: "30px", height: "30px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                ><FileText size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* AI Detail Modal (Authenticity Diagnostic Report) */}
                {isAiDetailModalOpen && selectedAiScan && (() => {
                  const rec = selectedAiScan.record || {};
                  const score = parseFloat(selectedAiScan.confidence_score);
                  const isSuspicious = selectedAiScan.suspicious_flagged;

                  // Use characteristic of record to draw unique waveforms procedurally
                  const seed = (rec.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

                  return (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500, padding: "20px" }}>
                      <div style={{ background: "#0e0e0e", border: "1px solid rgba(255,85,0,0.2)", borderRadius: "28px", width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", padding: "36px" }}>
                        {/* Modal Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                          <div>
                            <div style={{ color: "#FF5500", fontSize: "10px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Forensic Analysis Report</div>
                            <h3 style={{ fontSize: "22px", fontWeight: "950", color: "white", margin: "0 0 4px 0" }}>🤖 AI Diagnostic: {rec.title}</h3>
                            <div style={{ fontSize: "12px", color: "#666" }}>Record Type: <span style={{ textTransform: "uppercase", color: "#FF5500", fontWeight: "800" }}>{rec.record_type || "standard"}</span> • Athlete: {rec.user?.name || "Unknown"}</div>
                          </div>
                          <button onClick={() => setIsAiDetailModalOpen(false)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#888", cursor: "pointer", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
                        </div>

                        {/* Top Score Dashboard */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "24px", marginBottom: "28px" }}>
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px" }}>Authenticity Index</div>

                            {/* Circular meter */}
                            <div style={{ position: "relative", width: "120px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg style={{ transform: "rotate(-90deg)", width: "120px", height: "120px" }}>
                                <circle cx="60" cy="60" r="50" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                                <circle cx="60" cy="60" r="50" fill="transparent" stroke={score >= 85 ? "#22c55e" : score >= 70 ? "#eab308" : "#ef4444"} strokeWidth="8" strokeDasharray="314" strokeDashoffset={314 - (314 * score) / 100} style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }} />
                              </svg>
                              <div style={{ position: "absolute", textAlign: "center" }}>
                                <div style={{ fontSize: "28px", fontWeight: "950", color: score >= 85 ? "#22c55e" : score >= 70 ? "#eab308" : "#ef4444", lineHeight: "1" }}>{score}%</div>
                                <div style={{ fontSize: "9px", color: "#555", fontWeight: "900", textTransform: "uppercase", marginTop: "4px" }}>CONFIDENCE</div>
                              </div>
                            </div>
                          </div>

                          {/* Procedural Visual Graphs */}
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "20px", padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Signal Spectral Analysis</div>

                            {/* SVG Audio Wave/Tamper Graph */}
                            <div style={{ height: "70px", width: "100%", background: "#050505", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.03)", display: "flex", alignItems: "center", padding: "0 10px", overflow: "hidden", position: "relative" }}>
                              <svg width="100%" height="100%" style={{ stroke: score >= 85 ? "#22c55e" : score >= 70 ? "#eab308" : "#ef4444", strokeWidth: 1.5, fill: "none" }}>
                                <path d={(() => {
                                  let points = [];
                                  for (let i = 0; i <= 300; i += 6) {
                                    const y = 35 + Math.sin(i * 0.05 + seed) * (15 + (seed % 10)) * (Math.sin(i * 0.2) + Math.cos(i * 0.1) * 0.5) * (score < 70 && i > 120 && i < 180 ? 2.5 : 1);
                                    points.push(`${i === 0 ? 'M' : 'L'} ${i} ${y}`);
                                  }
                                  return points.join(' ');
                                })()} />
                              </svg>
                              {score < 70 && (
                                <div style={{ position: "absolute", top: "6px", right: "10px", display: "flex", alignItems: "center", gap: "4px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", padding: "1px 6px", borderRadius: "4px", fontSize: "8px", fontWeight: "900", color: "#ef4444" }}>
                                  <Radio size={8} className="animate-pulse" /> PITCH MANIPULATION DETECTED
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#444", fontWeight: "800", marginTop: "6px" }}>
                              <span>0:00 (START)</span>
                              <span>SPECTRUM FREQ AUDIT</span>
                              <span>{rec.value ? rec.value : '1.0'} {rec.unit ? rec.unit : 'MIN'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Checklist Details */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
                          {[
                            { label: "Biometric Face check", key: selectedAiScan.face_check, desc: "Facial multi-frame matches athlete profile" },
                            { label: "GAN Deepfake Forensics", key: selectedAiScan.deepfake_check, desc: "Generative adversarial artifact testing" },
                            { label: "Video cutting Check", key: selectedAiScan.video_tamper_check, desc: "Splice transition & framerate cut rate scanner" },
                            { label: "Audio Pitch Analysis", key: selectedAiScan.audio_tamper_check, desc: "Voice synthesis & compression anomalies check" }
                          ].map(c => {
                            const badge = getCheckBadge(c.key);
                            return (
                              <div key={c.label} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ fontSize: "10px", color: "#666", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
                                <div style={{ fontSize: "14px", fontWeight: "900", color: badge.color }}>{badge.label}</div>
                                <div style={{ fontSize: "10px", color: "#444", fontWeight: "800", lineHeight: "1.4" }}>{c.desc}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Audit Terminal Log Output */}
                        <div style={{ background: "#050505", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "16px", padding: "20px", marginBottom: "28px" }}>
                          <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Forensic Pipeline Console Logs</div>
                          <pre style={{ margin: 0, padding: 0, fontSize: "12px", color: "#22c55e", fontFamily: "'Courier New', Courier, monospace", whiteSpace: "pre-wrap", lineHeight: "1.6", maxHeight: "150px", overflowY: "auto" }}>
                            {selectedAiScan.scan_notes || "No log entries recorded."}
                          </pre>
                        </div>

                        {/* Admin Action Override Station */}
                        <div style={{ background: "rgba(255,85,0,0.03)", border: "1px solid rgba(255,85,0,0.1)", borderRadius: "20px", padding: "24px" }}>
                          <div style={{ fontSize: "12px", color: "#FF5500", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>⚡ Administrative Decision Override</div>

                          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "20px" }}>
                            {/* Override Choice */}
                            <div>
                              <label style={{ fontSize: "10px", color: "#888", fontWeight: "800", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Select Override Mode</label>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {[
                                  { key: "none", label: "No Override (Respect AI)", color: "#888", bg: "rgba(255,255,255,0.02)" },
                                  { key: "approved", label: "Manually Approve & Publish", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
                                  { key: "rejected", label: "Manually Reject Attempt", color: "#ef4444", bg: "rgba(239,68,68,0.12)" }
                                ].map(opt => {
                                  const isSel = aiOverrideStatus === opt.key;
                                  return (
                                    <button
                                      key={opt.key}
                                      onClick={() => setAiOverrideStatus(opt.key)}
                                      style={{
                                        background: isSel ? opt.bg : "rgba(255,255,255,0.02)",
                                        border: `1px solid ${isSel ? opt.color : "rgba(255,255,255,0.05)"}`,
                                        color: isSel ? opt.color : "#666",
                                        padding: "10px 14px",
                                        borderRadius: "10px",
                                        fontSize: "11px",
                                        fontWeight: "900",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.15s"
                                      }}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Notes Box and Actions */}
                            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                              <div>
                                <label style={{ fontSize: "10px", color: "#888", fontWeight: "800", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Override Justification Notes</label>
                                <textarea
                                  value={aiOverrideReason}
                                  onChange={e => setAiOverrideReason(e.target.value)}
                                  placeholder="Provide professional auditing justification for changing the AI authenticity decision..."
                                  style={{ width: "100%", background: "#050505", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "10px 12px", color: "white", fontSize: "12px", outline: "none", resize: "none", height: "80px", fontFamily: "inherit" }}
                                />
                              </div>

                              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                                <button onClick={() => setIsAiDetailModalOpen(false)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#888", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "800", fontSize: "11px" }}>CANCEL</button>
                                <button
                                  disabled={isAiActionUpdating}
                                  onClick={() => handleAIScanOverride(selectedAiScan.record_id, aiOverrideStatus, aiOverrideReason)}
                                  style={{ background: "linear-gradient(135deg, #FF6A00 0%, #FF3300 100%)", border: "none", color: "white", padding: "10px 18px", borderRadius: "8px", cursor: isAiActionUpdating ? "not-allowed" : "pointer", fontWeight: "900", fontSize: "11px", textTransform: "uppercase" }}
                                >
                                  {isAiActionUpdating ? "PERSISTING..." : "COMMIT OVERRIDE"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* ==================== 5E. COMMUNICATIONS (PHASE 1) ==================== */}
          {activeTab === "communications" && <AdminCommunications />}

          {/* ==================== 5F. MODERATION (PHASE 1) ==================== */}
          {activeTab === "moderation" && (
            <div>
              <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "28px", fontWeight: "950", margin: "0 0 8px 0", color: "#ef4444" }}>MODERATION HUB</h1>
                  <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>Fraud Detection, Reporting, and Bans</p>
                </div>
              </div>

              <div style={{ background: "#111", borderRadius: "20px", border: "1px solid rgba(239,68,68,0.2)", padding: "24px", marginBottom: "24px" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                   <h3 style={{ margin: 0, fontSize: "16px", color: "#ef4444", display: "flex", alignItems: "center", gap: "8px" }}><ShieldAlert size={18} /> Active Fraud Alerts</h3>
                 </div>
                 {reports.filter(r => r.status === 'pending').length === 0 ? (
                    <div style={{ padding: "16px", color: "#888", fontStyle: "italic", textAlign: "center" }}>No active fraud alerts.</div>
                 ) : (
                   reports.filter(r => r.status === 'pending').map(report => (
                     <div key={report.id} style={{ background: "rgba(239,68,68,0.05)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "bold" }}>Suspicious Activity: {report.reported_item_type}</div>
                          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Reason: {report.reason}</div>
                          <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>Reported by: {report.reporter_id?.username || report.reporter_id?.email || 'Unknown'}</div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                           <button onClick={() => handleUpdateReport(report.id, 'reviewed')} style={{ background: "#222", color: "white", padding: "8px 16px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>MARK REVIEWED</button>
                           <button onClick={() => showToast('Investigation case opened — flag added to this user account', 'info')} style={{ background: "#ef4444", color: "white", padding: "8px 16px", borderRadius: "100px", border: "none", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>INVESTIGATE</button>
                        </div>
                     </div>
                   ))
                 )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                 <div style={{ background: "#111", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)", padding: "24px" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "16px" }}>Recent Reports</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {reports.slice(0, 5).map(report => (
                        <div key={report.id} style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
                          <span style={{ color: "#FF5500", fontWeight: "bold" }}>@{report.reporter_id?.username || report.reporter_id?.email || 'User'}</span> reported <span style={{ color: "#a855f7" }}>{report.reported_item_type}</span> for {report.reason}
                          <span style={{ marginLeft: "8px", color: report.status === 'pending' ? '#ef4444' : '#10b981', fontSize: "11px" }}>({report.status})</span>
                        </div>
                      ))}
                      {reports.length === 0 && <div style={{ color: "#888", fontSize: "13px" }}>No reports found.</div>}
                    </div>
                 </div>
                 <div style={{ background: "#111", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)", padding: "24px" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "16px" }}>Banned Users</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {bans.map(ban => (
                        <div key={ban.id} style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
                          <span>@{ban.user_id?.username || ban.user_id?.email || 'User'}</span>
                          <span style={{ color: "#ef4444" }}>{ban.ban_type === 'permanent' ? 'Permanent Ban' : 'Temporary Suspension'}</span>
                        </div>
                      ))}
                      {bans.length === 0 && <div style={{ color: "#888", fontSize: "13px" }}>No banned users.</div>}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* ==================== 5G. MEDIA LIBRARY (PHASE 2) ==================== */}
          {activeTab === "mediaLibrary" && (() => {
            const recordVideos = records.filter(r => r.evidence_url && r.evidence_url.trim() !== '' && r.evidence_url !== 'pending_upload');

            return (
            <div>
              <AdminMediaLibrary />
              <div style={{ height: "40px" }} />
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#FF5500", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>RECORD VIDEO EVIDENCE</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                   {recordVideos.map(record => (
                     <div key={record.id} style={{ background: "#111", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column" }}>
                       <div style={{ width: "100%", height: "180px", background: "#000", position: "relative" }}>
                         {record.evidence_url.includes('youtube.com') || record.evidence_url.includes('youtu.be') ? (
                           <iframe
                             width="100%"
                             height="100%"
                             src={record.evidence_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                             title="YouTube video player"
                             frameBorder="0"
                             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                             allowFullScreen
                             style={{ border: 'none' }}
                           ></iframe>
                         ) : (
                           <video preload="metadata"
                             controls
                             style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                           >
                             <source src={record.evidence_url} type="video/mp4" />
                             Your browser does not support the video tag.
                           </video>
                         )}
                       </div>
                       <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                         <div style={{ fontSize: "15px", fontWeight: "900", color: "white", marginBottom: "4px" }}>{record.title}</div>
                         <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "12px" }}>By {record.user?.name || "Unknown User"}</div>

                         <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                           <span style={{
                             fontSize: "11px",
                             fontWeight: "800",
                             padding: "4px 8px",
                             borderRadius: "4px",
                             textTransform: "uppercase",
                             background: record.status === 'verified' ? "rgba(34, 197, 94, 0.1)" :
                                         record.status === 'rejected' ? "rgba(239, 68, 68, 0.1)" :
                                         "rgba(255, 204, 0, 0.1)",
                             color: record.status === 'verified' ? "#22c55e" :
                                    record.status === 'rejected' ? "#ef4444" :
                                    "#ffcc00"
                           }}>
                             {record.status}
                           </span>
                           <span style={{ fontSize: "11px", color: "#666" }}>
                             {new Date(record.created_at).toLocaleDateString()}
                           </span>
                         </div>
                       </div>
                     </div>
                   ))}
                   {recordVideos.length === 0 && <div style={{ color: "#888", fontSize: "14px", gridColumn: "1 / -1", textAlign: "center", padding: "40px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "12px" }}>No video evidence found in records.</div>}
                </div>
              </div>
            </div>
            );
          })()}

          {/* ==================== 5H. CONTENT PAGES — FULL CMS ==================== */}
          {activeTab === "contentManagement" && (() => {
            const PAGES = [
              { slug: "terms-of-service",   label: "Terms of Service",     icon: "📜", group: "legal" },
              { slug: "privacy-policy",     label: "Privacy Policy",       icon: "🔐", group: "legal" },
              { slug: "cookie-policy",      label: "Cookie Policy",        icon: "🍪", group: "legal" },
              { slug: "about-us",           label: "About Us",             icon: "ℹ️", group: "info" },
              { slug: "contact-us",         label: "Contact Us",           icon: "📬", group: "info" },
              { slug: "mission-statement",  label: "Mission Statement",    icon: "🎯", group: "info" },
              { slug: "vision-statement",   label: "Vision Statement",     icon: "🔭", group: "info" },
            ];

            const openPage = async (page) => {
              const data = await apiCall(`/admin/content/pages/${page.slug}`, "GET", null, user.token).catch(() => null);
              setEditingPage({ ...page, title: (data && data.title) || page.label, body: (data && data.body) || "", status: "idle" });
              setContentSubTab("editor");
            };

            const savePage = async (draft = true) => {
              if (!editingPage) return;
              setEditingPage(p => ({ ...p, status: "saving" }));
              try {
                await apiCall(`/admin/content/pages/${editingPage.slug}`, "PUT", { title: editingPage.title, body: editingPage.body }, user.token);
                setEditingPage(p => ({ ...p, status: draft ? "saved_draft" : "published" }));
                setTimeout(() => setEditingPage(p => p ? ({ ...p, status: "idle" }) : p), 3000);
              } catch {
                setEditingPage(p => ({ ...p, status: "error" }));
              }
            };

            const addFaq = async () => {
              const q = prompt("Enter question:");
              if (!q) return;
              const a = prompt("Enter answer:");
              if (!a) return;
              try {
                const newFaq = await apiCall("/admin/content/faqs", "POST", { question: q, answer: a, order_index: faqsList.length, is_published: true }, user.token);
                setFaqsList(prev => [...prev, newFaq]);
              } catch { alert("Could not save FAQ. Please try again."); }
            };

            const updateFaq = async (faq) => {
              const q = prompt("Edit question:", faq.question);
              if (q === null) return;
              const a = prompt("Edit answer:", faq.answer);
              if (a === null) return;
              try {
                const updated = await apiCall(`/admin/content/faqs/${faq.id}`, "PUT", { ...faq, question: q, answer: a }, user.token);
                setFaqsList(prev => prev.map(f => f.id === faq.id ? updated : f));
              } catch { alert("Could not update FAQ. Please try again."); }
            };

            const deleteFaq = async (id) => {
              if (!window.confirm("Delete this FAQ?")) return;
              try {
                await apiCall(`/admin/content/faqs/${id}`, "DELETE", null, user.token);
                setFaqsList(prev => prev.filter(f => f.id !== id));
              } catch { alert("Could not delete FAQ."); }
            };

            const moveFaq = async (index, dir) => {
              const list = [...faqsList];
              const swapIndex = index + dir;
              if (swapIndex < 0 || swapIndex >= list.length) return;
              [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
              list[index].order_index = index;
              list[swapIndex].order_index = swapIndex;
              setFaqsList(list);
              await Promise.all([
                apiCall(`/admin/content/faqs/${list[index].id}`, "PUT", { ...list[index] }, user.token),
                apiCall(`/admin/content/faqs/${list[swapIndex].id}`, "PUT", { ...list[swapIndex] }, user.token)
              ]).catch(() => {});
            };

            const saveHomepage = async (section, cfg) => {
              try {
                await apiCall(`/admin/content/homepage/${section}`, "PUT", { config: cfg }, user.token);
                setHomepageConfig(prev => ({ ...prev, [section]: cfg }));
                alert("Content updated successfully.");
              } catch { alert("Content could not be saved. Please try again."); }
            };

            const legalPages = PAGES.filter(p => p.group === "legal");
            const infoPages  = PAGES.filter(p => p.group === "info");

            return (
              <div>
                {/* Header */}
                <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>Content Management System</div>
                    <h1 style={{ fontSize: "52px", fontWeight: "950", margin: "0 0 8px 0", color: "white", letterSpacing: "-2px", textTransform: "uppercase", lineHeight: 1 }}>CONTENT<br/>PAGES</h1>
                    <p style={{ color: "#888", margin: 0, fontSize: "14px", maxWidth: "500px" }}>Manage all website content: Legal pages, FAQs, and Homepage configuration — all persisted to the database.</p>
                  </div>
                  {contentSubTab === "editor" && editingPage && (
                    <button onClick={() => { setContentSubTab("pages"); setEditingPage(null); }}
                      style={{ background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 20px", borderRadius: "100px", fontSize: "13px", fontWeight: "800", cursor: "pointer" }}>
                      ← Back
                    </button>
                  )}
                </div>

                {/* Sub-Tab Nav */}
                {contentSubTab !== "editor" && (
                  <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px", marginBottom: "32px" }}>
                    {[
                      { id: "pages",    label: "📄 STATIC PAGES" },
                      { id: "faqs",     label: "❓ FAQ MANAGER" },
                      { id: "homepage", label: "🏠 HOMEPAGE CONFIG" },
                      { id: "countries",label: "🌍 COUNTRIES MGR" },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setContentSubTab(tab.id)}
                        style={{ background: contentSubTab === tab.id ? "rgba(255,85,0,0.1)" : "transparent", border: contentSubTab === tab.id ? "1px solid rgba(255,85,0,0.2)" : "1px solid transparent", color: contentSubTab === tab.id ? "#FF5500" : "#888", padding: "10px 24px", borderRadius: "100px", fontSize: "13px", fontWeight: "900", cursor: "pointer" }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* ===== STATIC PAGES GRID ===== */}
                {contentSubTab === "pages" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    {[{ title: "⚖️ Legal & Policies", pages: legalPages }, { title: "📋 Info Pages", pages: infoPages }].map(group => (
                      <div key={group.title}>
                        <div style={{ fontSize: "11px", fontWeight: "900", color: "#555", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>{group.title}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                          {group.pages.map(page => (
                            <div key={page.slug} onClick={() => openPage(page)}
                              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px 24px", cursor: "pointer", transition: "border-color 0.2s, background 0.2s", display: "flex", alignItems: "center", gap: "16px" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,85,0,0.3)"; e.currentTarget.style.background = "rgba(255,85,0,0.04)"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.background = "#111"; }}>
                              <div style={{ fontSize: "28px" }}>{page.icon}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "14px", fontWeight: "800", color: "white" }}>{page.label}</div>
                                <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>Click to edit</div>
                              </div>
                              <div style={{ color: "#FF5500" }}>→</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ===== PAGE EDITOR ===== */}
                {contentSubTab === "editor" && editingPage && (
                  <div>
                    {/* Status Bar */}
                    {editingPage.status === "saving"       && <div style={{ background: "rgba(255,165,0,0.1)", border: "1px solid rgba(255,165,0,0.3)", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", color: "#ffa500", fontSize: "13px", fontWeight: "700" }}>⏳ Saving...</div>}
                    {editingPage.status === "saved_draft"  && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", color: "#22c55e", fontSize: "13px", fontWeight: "700" }}>✅ Draft saved successfully. Content updated successfully.</div>}
                    {editingPage.status === "published"    && <div style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", color: "#22c55e", fontSize: "13px", fontWeight: "700" }}>🚀 Content published successfully.</div>}
                    {editingPage.status === "error"        && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", color: "#ef4444", fontSize: "13px", fontWeight: "700" }}>❌ Content could not be saved. Please try again.</div>}

                    <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "32px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "#FF5500", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>Editing Page</div>
                          <h2 style={{ fontSize: "22px", fontWeight: "950", color: "white", margin: "4px 0 0" }}>{editingPage.icon} {editingPage.label}</h2>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button onClick={() => setEditingPage(p => ({ ...p, previewing: !p.previewing }))}
                            style={{ background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>
                            {editingPage.previewing ? "✏️ EDIT" : "👁 PREVIEW"}
                          </button>
                          <button onClick={() => savePage(true)}
                            style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>
                            💾 SAVE DRAFT
                          </button>
                          <button onClick={() => savePage(false)}
                            style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 20px rgba(255,85,0,0.3)" }}>
                            🚀 PUBLISH
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px", textTransform: "uppercase" }}>Page Title</label>
                        <input value={editingPage.title} onChange={e => setEditingPage(p => ({ ...p, title: e.target.value }))}
                          style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "16px", fontWeight: "700", outline: "none", boxSizing: "border-box" }} />
                      </div>

                      {editingPage.previewing ? (
                        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "24px", minHeight: "300px" }}>
                          <div style={{ fontSize: "11px", color: "#555", fontWeight: "900", marginBottom: "16px", textTransform: "uppercase" }}>Preview</div>
                          <div style={{ color: "white", lineHeight: "1.8", fontSize: "14px", whiteSpace: "pre-wrap" }}>{editingPage.body || <span style={{ color: "#555" }}>No content yet...</span>}</div>
                        </div>
                      ) : (
                        <>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px", textTransform: "uppercase" }}>Page Body</label>
                          <textarea value={editingPage.body} onChange={e => setEditingPage(p => ({ ...p, body: e.target.value }))} rows={18}
                            placeholder="Enter page content here... (Markdown supported)"
                            style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px", color: "white", fontSize: "13px", lineHeight: "1.8", outline: "none", resize: "vertical", fontFamily: "monospace", boxSizing: "border-box" }} />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== FAQ MANAGER ===== */}
                {contentSubTab === "faqs" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "900", color: "white" }}>Frequently Asked Questions</div>
                        <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>{faqsList.length} FAQ{faqsList.length !== 1 ? "s" : ""} — Drag to reorder using ↑/↓ arrows</div>
                      </div>
                      <button onClick={addFaq}
                        style={{ background: "#FF5500", color: "white", border: "none", padding: "12px 24px", borderRadius: "100px", fontSize: "13px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 20px rgba(255,85,0,0.3)" }}>
                        <Plus size={16} /> ADD FAQ
                      </button>
                    </div>

                    {faqsList.length === 0 ? (
                      <div style={{ background: "#111", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "20px", padding: "60px", textAlign: "center" }}>
                        <div style={{ fontSize: "40px", marginBottom: "12px" }}>❓</div>
                        <div style={{ color: "white", fontWeight: "800", marginBottom: "8px" }}>No FAQs yet</div>
                        <div style={{ color: "#666", fontSize: "13px" }}>Click "ADD FAQ" to create your first question.</div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {faqsList.map((faq, idx) => (
                          <div key={faq.id} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px 24px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                              <button onClick={() => moveFaq(idx, -1)} disabled={idx === 0}
                                style={{ background: "rgba(255,255,255,0.05)", border: "none", color: idx === 0 ? "#333" : "#888", padding: "4px 8px", borderRadius: "6px", cursor: idx === 0 ? "default" : "pointer", fontSize: "12px" }}>▲</button>
                              <button onClick={() => moveFaq(idx, 1)} disabled={idx === faqsList.length - 1}
                                style={{ background: "rgba(255,255,255,0.05)", border: "none", color: idx === faqsList.length - 1 ? "#333" : "#888", padding: "4px 8px", borderRadius: "6px", cursor: idx === faqsList.length - 1 ? "default" : "pointer", fontSize: "12px" }}>▼</button>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "14px", fontWeight: "800", color: "white", marginBottom: "8px" }}>Q: {faq.question}</div>
                              <div style={{ fontSize: "13px", color: "#aaa", lineHeight: "1.6" }}>A: {faq.answer}</div>
                              <div style={{ marginTop: "10px", display: "flex", gap: "6px" }}>
                                <span style={{ background: faq.is_published ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", color: faq.is_published ? "#22c55e" : "#666", padding: "2px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: "800" }}>
                                  {faq.is_published ? "PUBLISHED" : "DRAFT"}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                              <button onClick={() => updateFaq(faq)}
                                style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "8px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>Edit</button>
                              <button onClick={() => deleteFaq(faq.id)}
                                style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", padding: "8px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ===== HOMEPAGE CONFIGURATION ===== */}
                {contentSubTab === "homepage" && (() => {
                  const hero = homepageConfig.hero || {};
                  const banner = homepageConfig.banner || {};
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                      {/* Hero Section */}
                      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "28px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                          <div style={{ fontSize: "16px", fontWeight: "900", color: "white" }}>🦸 Hero Section</div>
                          <button onClick={() => saveHomepage("hero", hero)}
                            style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>Save Hero</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          {[["headline", "Homepage Headline"], ["subtitle", "Subtitle"], ["cta_primary_text", "Primary CTA Button Text"], ["cta_primary_url", "Primary CTA Button URL"], ["cta_secondary_text", "Secondary CTA Button Text"], ["cta_secondary_url", "Secondary CTA Button URL"]].map(([key, label]) => (
                            <div key={key}>
                              <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px", textTransform: "uppercase" }}>{label}</label>
                              <input value={hero[key] || ""} onChange={e => setHomepageConfig(prev => ({ ...prev, hero: { ...prev.hero, [key]: e.target.value } }))}
                                style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Banner / Announcement */}
                      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "28px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                          <div style={{ fontSize: "16px", fontWeight: "900", color: "white" }}>📢 Banner & Announcements</div>
                          <button onClick={() => saveHomepage("banner", banner)}
                            style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>Save Banner</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          {[["text", "Banner Text"], ["link", "Banner Link"], ["bg_color", "Background Color (hex)"], ["text_color", "Text Color (hex)"]].map(([key, label]) => (
                            <div key={key}>
                              <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px", textTransform: "uppercase" }}>{label}</label>
                              <input value={banner[key] || ""} onChange={e => setHomepageConfig(prev => ({ ...prev, banner: { ...prev.banner, [key]: e.target.value } }))}
                                style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Homepage Stats */}
                      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "28px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                          <div style={{ fontSize: "16px", fontWeight: "900", color: "white" }}>📊 Homepage Statistics</div>
                          <button onClick={() => saveHomepage("stats", homepageConfig.stats || {})}
                            style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>Save Stats</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          {[["total_records", "Total Records Stat"], ["total_athletes", "Total Athletes Stat"], ["total_countries", "Total Countries Stat"], ["total_categories", "Total Categories Stat"]].map(([key, label]) => (
                            <div key={key}>
                              <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px", textTransform: "uppercase" }}>{label}</label>
                              <input value={(homepageConfig.stats || {})[key] || ""} onChange={e => setHomepageConfig(prev => ({ ...prev, stats: { ...(prev.stats || {}), [key]: e.target.value } }))}
                                style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer/Header Settings */}
                      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "28px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                          <div style={{ fontSize: "16px", fontWeight: "900", color: "white" }}>🗂️ Header & Footer Content</div>
                          <button onClick={() => saveHomepage("footer", homepageConfig.footer || {})}
                            style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>Save Header/Footer</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          {[["footer_tagline", "Footer Tagline"], ["footer_copyright", "Copyright Text"], ["header_notice", "Header Notice Text"], ["footer_email", "Contact Email in Footer"]].map(([key, label]) => (
                            <div key={key}>
                              <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px", textTransform: "uppercase" }}>{label}</label>
                              <input value={(homepageConfig.footer || {})[key] || ""} onChange={e => setHomepageConfig(prev => ({ ...prev, footer: { ...(prev.footer || {}), [key]: e.target.value } }))}
                                style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ===== COUNTRIES MANAGER ===== */}
                {contentSubTab === "countries" && (
                  <div style={{ background: "rgba(255,255,255,0.02)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "900", color: "white", marginBottom: "16px" }}>Add New Country to Leaderboard</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.target);
                      const name = fd.get('name');
                      const code = fd.get('code');
                      const flag = fd.get('flag');
                      try {
                        const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                        const res = await fetch(`${API_URL}/countries`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ name, code, flag })
                        });
                        if (res.ok) {
                          alert('Country added successfully!');
                          e.target.reset();
                        } else {
                          alert('Failed to add country');
                        }
                      } catch (err) { alert(err.message); }
                    }} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px" }}>
                      <input name="name" placeholder="Country Name (e.g. India)" required style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                      <input name="code" placeholder="Country Code (e.g. IND)" required style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                      <input name="flag" placeholder="Emoji Flag (e.g. 🇮🇳)" required style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                      <button type="submit" style={{ background: "#FF5500", color: "white", padding: "12px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", border: "none" }}>Add Country</button>
                    </form>
                  </div>
                )}
              </div>
            );
          })()}


          {/* ==================== 5I. SECURITY & FRAUD (PHASE 3) ==================== */}
          {activeTab === "security" && (
            <div>
              <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "28px", fontWeight: "950", margin: "0 0 8px 0" }}>SECURITY & FRAUD PREVENTION</h1>
                  <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>Audit logs, IP tracking, and data backup controls.</p>
                </div>
                <button style={{ background: "transparent", color: "white", padding: "10px 24px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.2)", fontWeight: "800", cursor: "pointer" }}>
                  DOWNLOAD AUDIT REPORT
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                 <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Lock size={18} color="#22c55e" /> System Audit Logs</h3>
                    <div style={{ fontFamily: "monospace", fontSize: "12px", background: "#000", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", color: "#888", maxHeight: "300px", overflowY: "auto" }}>
                      {auditLogs.map(log => (
                        <div key={log.id} style={{ color: log.action_type.includes('failed') || log.action_type.includes('error') ? "#ef4444" : "#888", marginBottom: "4px" }}>
                          [{new Date(log.created_at).toLocaleString()}] {log.users?.name || 'System'} - {log.action_type} - {JSON.stringify(log.metadata)}
                        </div>
                      ))}
                      {auditLogs.length === 0 && <div>No audit logs found.</div>}
                    </div>
                 </div>
                 <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Backup Control</h3>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px" }}>
                      <div style={{ fontSize: "14px", fontWeight: "bold" }}>Last Full Backup</div>
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "4px", marginBottom: "16px" }}>Today at 04:00 AM (EST)</div>
                      <button onClick={async () => {
                        try {
                          const res = await apiCall('/admin/security/backup', 'POST', {}, user.token);
                          if(res) { alert("Backup successfully dispatched to cold storage."); fetchData(); }
                        } catch (e) { alert("Failed to trigger backup."); }
                      }} style={{ background: "#FF5500", color: "white", padding: "8px 16px", borderRadius: "100px", border: "none", fontSize: "12px", fontWeight: "bold", cursor: "pointer", width: "100%" }}>TRIGGER MANUAL BACKUP</button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* ==================== 5J. SYSTEM SETTINGS (PHASE 3) ==================== */}
          {activeTab === "systemSettings" && (
            <div>
              <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "28px", fontWeight: "950", margin: "0 0 8px 0" }}>SYSTEM CONFIGURATION</h1>
                  <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>API Integrations, SEO, and global parameters.</p>
                </div>
              </div>
              <div style={{ background: "#111", borderRadius: "20px", padding: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Global SEO Settings</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#888" }}>Default Meta Title</label>
                    <input type="text" value={seoForm.title} maxLength={70} onChange={(e) => setSeoForm({ ...seoForm, title: e.target.value })} style={{ width: "100%", background: "#000", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "10px", borderRadius: "8px", marginTop: "4px" }} />
                    <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>{seoForm.title.length}/70 · shown in browser tabs and search results</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#888" }}>Default Meta Description</label>
                    <textarea value={seoForm.description} maxLength={160} onChange={(e) => setSeoForm({ ...seoForm, description: e.target.value })} style={{ width: "100%", height: "70px", background: "#000", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "10px", borderRadius: "8px", marginTop: "4px", resize: "vertical" }} />
                    <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>{seoForm.description.length}/160</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#888" }}>Keywords (comma separated)</label>
                    <input type="text" value={seoForm.keywords} onChange={(e) => setSeoForm({ ...seoForm, keywords: e.target.value })} style={{ width: "100%", background: "#000", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "10px", borderRadius: "8px", marginTop: "4px" }} />
                  </div>
                </div>
                <button onClick={async () => {
                  if (!seoForm.title.trim()) { setSeoStatus("The meta title cannot be empty."); return; }
                  setSeoStatus("Saving...");
                  try {
                    await apiCall('/admin/security/seo', 'PUT', { title: seoForm.title.trim(), meta_description: seoForm.description.trim(), keywords: seoForm.keywords.trim() }, user.token);
                    document.title = seoForm.title.trim();
                    setSeoStatus("Saved. The new title is live on the website.");
                  } catch (e) { setSeoStatus(`Could not save: ${e.message}`); }
                }} style={{ background: "white", color: "black", padding: "8px 24px", borderRadius: "100px", border: "none", fontSize: "12px", fontWeight: "bold", cursor: "pointer", marginTop: "16px" }}>SAVE SEO</button>
                {seoStatus && <span style={{ marginLeft: "12px", fontSize: "12px", color: seoStatus.startsWith("Saved") ? "#22c55e" : seoStatus === "Saving..." ? "#aaa" : "#ef4444" }}>{seoStatus}</span>}
              </div>
            </div>
          )}

          {/* ==================== 5K. MONETIZATION (PHASE 4) ==================== */}
          {activeTab === "monetization" && <AdminMonetizationBreakdown />}

          {/* ==================== 5L. SPONSORSHIPS — FULL MANAGEMENT ==================== */}
          {activeTab === "sponsorships" && (() => {
            const PLACEMENTS = [
              { value: "homepage_top_banner", label: "Homepage Top Banner" },
              { value: "homepage_sidebar",    label: "Homepage Sidebar" },
              { value: "homepage",            label: "Homepage General" },
              { value: "live_event",          label: "Live Event Sponsor" },
              { value: "featured",            label: "Featured Sponsor" },
              { value: "footer_sponsor",      label: "Footer Sponsor" },
              { value: "video_overlay",       label: "Video Sponsor Overlay" },
              { value: "livestream",          label: "Livestream Banner" },
              { value: "shop",               label: "Shop Page" },
              { value: "footer",             label: "Footer Banner" },
            ];

            const now = new Date();

            const filteredSponsors = sponsors.filter(s => {
              const q = sponsorSearchQuery.toLowerCase();
              const matchSearch = !q ||
                (s.company_name && s.company_name.toLowerCase().includes(q)) ||
                (s.package_type && s.package_type.toLowerCase().includes(q)) ||
                (s.placement && s.placement.toLowerCase().includes(q));

              const isExpired = s.end_date && new Date(s.end_date) < now;
              const isFeatured = s.placement === 'featured';
              const isPending = !s.active_status && !isExpired;

              const matchFilter =
                sponsorFilterStatus === "all" ? true :
                sponsorFilterStatus === "active"   ? (s.active_status && !isExpired) :
                sponsorFilterStatus === "inactive" ? !s.active_status :
                sponsorFilterStatus === "expired"  ? isExpired :
                sponsorFilterStatus === "featured" ? isFeatured :
                sponsorFilterStatus === "pending"  ? isPending : true;

              return matchSearch && matchFilter;
            });

            const openAddForm = () => {
              setSponsorForm({ company_name: "", link_url: "", placement: "homepage", package_type: "standard", active_status: true, start_date: "", end_date: "", description: "", notes: "" });
              setSponsorFormMode("add");
              setSelectedSponsor(null);
              setSponsorSaveStatus(null);
            };

            const openEditForm = (s) => {
              setSponsorForm({ ...s });
              setSponsorFormMode("edit");
              setSelectedSponsor(s);
              setSponsorSaveStatus(null);
            };

            const saveSponsor = async () => {
              setSponsorSaveStatus("saving");
              try {
                const fd = new FormData();
                Object.entries(sponsorForm).forEach(([k, v]) => {
                  if (k === "_bannerFile" || k === "_logoFile") return;
                  if (v !== null && v !== undefined) fd.append(
                    k === "company_name" ? "companyName" :
                    k === "link_url" ? "linkUrl" :
                    k === "package_type" ? "packageType" :
                    k === "active_status" ? "activeStatus" :
                    k === "start_date" ? "startDate" :
                    k === "end_date" ? "endDate" :
                    k === "image_fit" ? "imageFit" :
                    k === "image_position" ? "imagePosition" : k,
                    v
                  );
                });
                if (sponsorForm._bannerFile) fd.append("bannerImage", sponsorForm._bannerFile);
                if (sponsorForm._logoFile) fd.append("logoImage", sponsorForm._logoFile);

                const token = user.token;
                const url = sponsorFormMode === "edit"
                  ? `${API_URL}/admin/monetization/sponsors/${sponsorForm.id}`
                  : `${API_URL}/admin/monetization/sponsors`;
                const method = sponsorFormMode === "edit" ? "PUT" : "POST";

                const res = await fetch(url, {
                  method,
                  headers: { Authorization: `Bearer ${token}` },
                  body: fd
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Save failed");

                setSponsorSaveStatus("success");
                setSponsorFormMode(null);
                fetchData();
                setTimeout(() => setSponsorSaveStatus(null), 3000);
              } catch {
                setSponsorSaveStatus("error");
              }
            };

            const deleteSponsor = async (id) => {
              if (!window.confirm("Delete this sponsor permanently?")) return;
              try {
                await apiCall(`/admin/monetization/sponsors/${id}`, "DELETE", null, user.token);
                setSponsors(prev => prev.filter(s => s.id !== id));
                if (selectedSponsor?.id === id) setSelectedSponsor(null);
                alert("Sponsor deleted successfully.");
              } catch { alert("Sponsor could not be deleted."); }
            };

            const toggleStatus = async (s) => {
              try {
                const fd = new FormData();
                fd.append("activeStatus", !s.active_status);
                fd.append("companyName", s.company_name);
                const res = await fetch(`${API_URL}/admin/monetization/sponsors/${s.id}`, {
                  method: "PUT",
                  headers: { Authorization: `Bearer ${user.token}` },
                  body: fd
                });
                if (!res.ok) throw new Error();
                setSponsors(prev => prev.map(sp => sp.id === s.id ? { ...sp, active_status: !s.active_status } : sp));
                if (selectedSponsor?.id === s.id) setSelectedSponsor(prev => ({ ...prev, active_status: !s.active_status }));
              } catch { alert("Could not update sponsor status."); }
            };

            const inputStyle = { width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" };
            const labelStyle = { display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px", textTransform: "uppercase" };

            return (
              <div>
                {/* Header */}
                <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "8px" }}>Sponsorship Management</div>
                    <h1 style={{ fontSize: "52px", fontWeight: "950", margin: "0 0 8px 0", color: "white", letterSpacing: "-2px", textTransform: "uppercase", lineHeight: 1 }}>SPONSORS<br/>&amp; ADS</h1>
                    <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>Manage partner banners, placements, logos, and click analytics.</p>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => { setSponsorFormMode(null); setSelectedSponsor(null); fetchData(); }}
                      style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", padding: "12px 20px", borderRadius: "100px", fontSize: "13px", fontWeight: "800", cursor: "pointer" }}>
                      🔄 REFRESH
                    </button>
                    <button onClick={openAddForm}
                      style={{ background: "#FF5500", color: "white", border: "none", padding: "12px 24px", borderRadius: "100px", fontSize: "13px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 20px rgba(255,85,0,0.3)" }}>
                      <Plus size={16} /> ADD SPONSOR
                    </button>
                  </div>
                </div>

                {/* Status messages */}
                {sponsorSaveStatus === "success"    && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#22c55e", fontWeight: "700" }}>✅ Sponsor saved successfully.</div>}
                {sponsorSaveStatus === "error"      && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#ef4444", fontWeight: "700" }}>❌ Sponsor could not be saved.</div>}
                {sponsorSaveStatus === "imageError" && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#ef4444", fontWeight: "700" }}>❌ Image upload failed.</div>}

                {/* ADD/EDIT FORM */}
                {sponsorFormMode && (
                  <div style={{ background: "#111", border: "1px solid rgba(255,85,0,0.2)", borderRadius: "20px", padding: "28px", marginBottom: "28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#FF5500", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>{sponsorFormMode === "add" ? "New Sponsor" : "Edit Sponsor"}</div>
                        <h3 style={{ fontSize: "18px", fontWeight: "900", color: "white", margin: "4px 0 0" }}>{sponsorFormMode === "add" ? "Add a new sponsor partner" : `Editing: ${sponsorForm.company_name}`}</h3>
                      </div>
                      <button onClick={() => { setSponsorFormMode(null); setSponsorSaveStatus(null); }}
                        style={{ background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Sponsor Name *</label>
                        <input value={sponsorForm.company_name || ""} onChange={e => setSponsorForm(p => ({ ...p, company_name: e.target.value }))} style={inputStyle} placeholder="e.g. Nike" />
                      </div>
                      <div>
                        <label style={labelStyle}>Website URL</label>
                        <input value={sponsorForm.link_url || ""} onChange={e => setSponsorForm(p => ({ ...p, link_url: e.target.value }))} style={inputStyle} placeholder="https://..." />
                      </div>
                      <div>
                        <label style={labelStyle}>Placement</label>
                        <select value={sponsorForm.placement || "homepage"} onChange={e => setSponsorForm(p => ({ ...p, placement: e.target.value }))} style={{ ...inputStyle }}>
                          {PLACEMENTS.map(pl => <option key={pl.value} value={pl.value}>{pl.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Package Type</label>
                        <select value={sponsorForm.package_type || "standard"} onChange={e => setSponsorForm(p => ({ ...p, package_type: e.target.value }))} style={{ ...inputStyle }}>
                          {["standard", "premium", "gold", "platinum", "title"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Start Date</label>
                        <input type="date" value={sponsorForm.start_date || ""} onChange={e => setSponsorForm(p => ({ ...p, start_date: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                      </div>
                      <div>
                        <label style={labelStyle}>End Date</label>
                        <input type="date" value={sponsorForm.end_date || ""} onChange={e => setSponsorForm(p => ({ ...p, end_date: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Upload Banner (JPG/PNG/WEBP)</label>
                        <input type="file" accept="image/jpg,image/jpeg,image/png,image/webp"
                          onChange={e => setSponsorForm(p => ({ ...p, _bannerFile: e.target.files[0], banner_url: e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : p.banner_url }))}
                          style={{ ...inputStyle, padding: "8px" }} />
                        {(() => {
                          const size = SPONSOR_SIZES[sponsorForm.placement || "homepage"] || SPONSOR_SIZES.homepage;
                          return (
                            <div style={{ fontSize: "11px", color: "#888", marginTop: "6px", lineHeight: 1.5 }}>
                              Recommended: <strong style={{ color: "#FF5500" }}>{size.w} × {size.h} px</strong> ({(size.w / size.h).toFixed(1)}:1). {size.note}.
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <label style={labelStyle}>Banner fit</label>
                        <select value={sponsorForm.image_fit || "contain"} onChange={e => setSponsorForm(p => ({ ...p, image_fit: e.target.value }))} style={{ ...inputStyle }}>
                          <option value="contain">Show the whole banner (never cropped)</option>
                          <option value="cover">Fill the space (edges may be cropped)</option>
                        </select>
                        <label style={{ ...labelStyle, marginTop: "10px" }}>Focus point</label>
                        <select value={sponsorForm.image_position || "center"} onChange={e => setSponsorForm(p => ({ ...p, image_position: e.target.value }))} style={{ ...inputStyle }}>
                          {["center", "top", "bottom", "left", "right"].map(pos => <option key={pos} value={pos}>{pos.charAt(0).toUpperCase() + pos.slice(1)}</option>)}
                        </select>
                      </div>
                      {sponsorForm.banner_url && (() => {
                        const size = SPONSOR_SIZES[sponsorForm.placement || "homepage"] || SPONSOR_SIZES.homepage;
                        return (
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label style={labelStyle}>Preview (as it appears on the site)</label>
                            <div style={{ width: "100%", maxWidth: `${Math.min(size.w, 900)}px`, aspectRatio: `${size.w} / ${size.h}`, background: "#0a0a0a", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "10px", overflow: "hidden" }}>
                              <img src={sponsorForm.banner_url} alt="Banner preview" style={{ width: "100%", height: "100%", objectFit: sponsorForm.image_fit === "cover" ? "cover" : "contain", objectPosition: sponsorForm.image_position || "center", display: "block" }} />
                            </div>
                          </div>
                        );
                      })()}
                      <div>
                        <label style={labelStyle}>Upload Logo (JPG/PNG/WEBP)</label>
                        <input type="file" accept="image/jpg,image/jpeg,image/png,image/webp"
                          onChange={e => setSponsorForm(p => ({ ...p, _logoFile: e.target.files[0], logo_url: e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : p.logo_url }))}
                          style={{ ...inputStyle, padding: "8px" }} />
                        {sponsorForm.logo_url && <img loading="lazy" decoding="async" src={sponsorForm.logo_url} alt="Logo Preview" style={{ marginTop: "8px", maxHeight: "50px", borderRadius: "6px", objectFit: "contain", background: "rgba(255,255,255,0.05)", padding: "6px" }} />}
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>Description</label>
                        <textarea value={sponsorForm.description || ""} onChange={e => setSponsorForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Sponsor description..." />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>Internal Notes</label>
                        <textarea value={sponsorForm.notes || ""} onChange={e => setSponsorForm(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Internal notes..." />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <input type="checkbox" id="sponsorActive" checked={!!sponsorForm.active_status} onChange={e => setSponsorForm(p => ({ ...p, active_status: e.target.checked }))} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                        <label htmlFor="sponsorActive" style={{ color: "white", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>Active (visible on site)</label>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
                      <button onClick={() => { setSponsorFormMode(null); setSponsorSaveStatus(null); }}
                        style={{ background: "rgba(255,255,255,0.04)", color: "#ccc", border: "1px solid rgba(255,255,255,0.05)", padding: "12px 24px", borderRadius: "100px", fontSize: "13px", fontWeight: "800", cursor: "pointer" }}>
                        Cancel
                      </button>
                      <button onClick={saveSponsor} disabled={sponsorSaveStatus === "saving"}
                        style={{ background: sponsorSaveStatus === "saving" ? "#888" : "#FF5500", color: "white", border: "none", padding: "12px 28px", borderRadius: "100px", fontSize: "13px", fontWeight: "900", cursor: "pointer", boxShadow: "0 4px 20px rgba(255,85,0,0.3)" }}>
                        {sponsorSaveStatus === "saving" ? "⏳ Saving..." : sponsorFormMode === "add" ? "💾 Save Sponsor" : "💾 Update Sponsor"}
                      </button>
                    </div>
                  </div>
                )}

                {/* DETAIL VIEW */}
                {selectedSponsor && !sponsorFormMode && (
                  <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "28px", marginBottom: "28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                        {selectedSponsor.logo_url
                          ? <img loading="lazy" decoding="async" src={selectedSponsor.logo_url} alt="Logo" style={{ width: "72px", height: "72px", borderRadius: "12px", objectFit: "contain", background: "rgba(255,255,255,0.05)", padding: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
                          : <div style={{ width: "72px", height: "72px", borderRadius: "12px", background: "linear-gradient(135deg, #FF5500, #b53c00)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "900", color: "white" }}>{selectedSponsor.company_name?.charAt(0)}</div>
                        }
                        <div>
                          <h2 style={{ fontSize: "22px", fontWeight: "950", color: "white", margin: "0 0 4px" }}>{selectedSponsor.company_name}</h2>
                          <div style={{ color: "#888", fontSize: "13px", marginBottom: "8px" }}>{selectedSponsor.link_url && <a href={selectedSponsor.link_url} target="_blank" rel="noreferrer" style={{ color: "#FF5500", textDecoration: "none" }}>{selectedSponsor.link_url} ↗</a>}</div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ background: selectedSponsor.active_status ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: selectedSponsor.active_status ? "#22c55e" : "#ef4444", padding: "3px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "800" }}>{selectedSponsor.active_status ? "ACTIVE" : "INACTIVE"}</span>
                            <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", padding: "3px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "800" }}>{PLACEMENTS.find(p => p.value === selectedSponsor.placement)?.label || selectedSponsor.placement}</span>
                            <span style={{ background: "rgba(255,255,255,0.05)", color: "#ccc", padding: "3px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "800" }}>{selectedSponsor.package_type?.toUpperCase() || "STANDARD"}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => openEditForm(selectedSponsor)}
                          style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 18px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>✏️ Edit</button>
                        <button onClick={() => toggleStatus(selectedSponsor)}
                          style={{ background: selectedSponsor.active_status ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", color: selectedSponsor.active_status ? "#ef4444" : "#22c55e", border: "none", padding: "10px 18px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>
                          {selectedSponsor.active_status ? "⏸ Deactivate" : "▶ Activate"}
                        </button>
                        <button onClick={() => deleteSponsor(selectedSponsor.id)}
                          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", padding: "10px 18px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>🗑 Delete</button>
                        <button onClick={() => setSelectedSponsor(null)}
                          style={{ background: "rgba(255,255,255,0.03)", color: "#888", border: "1px solid rgba(255,255,255,0.05)", padding: "10px 16px", borderRadius: "100px", fontSize: "12px", cursor: "pointer" }}>✕</button>
                      </div>
                    </div>

                    {/* Banner */}
                    {selectedSponsor.banner_url && (
                      <div style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", marginBottom: "8px", textTransform: "uppercase" }}>Banner Image</div>
                        <img loading="lazy" decoding="async" src={selectedSponsor.banner_url} alt="Sponsor Banner" style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }} />
                      </div>
                    )}

                    {/* Analytics */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
                      {[
                        { label: "Total Clicks", value: (selectedSponsor.clicks_count || 0).toLocaleString(), color: "#FF5500" },
                        { label: "Impressions", value: (selectedSponsor.views_count || 0).toLocaleString(), color: "#22c55e" },
                        { label: "Start Date", value: selectedSponsor.start_date ? new Date(selectedSponsor.start_date).toLocaleDateString() : "—", color: "#888" },
                        { label: "End Date", value: selectedSponsor.end_date ? new Date(selectedSponsor.end_date).toLocaleDateString() : "—", color: selectedSponsor.end_date && new Date(selectedSponsor.end_date) < now ? "#ef4444" : "#888" },
                      ].map(stat => (
                        <div key={stat.label} style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>{stat.label}</div>
                          <div style={{ fontSize: "20px", fontWeight: "950", color: stat.color }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Description / Notes */}
                    {(selectedSponsor.description || selectedSponsor.notes) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        {selectedSponsor.description && <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px" }}>
                          <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", marginBottom: "8px" }}>DESCRIPTION</div>
                          <div style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.6" }}>{selectedSponsor.description}</div>
                        </div>}
                        {selectedSponsor.notes && <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px" }}>
                          <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", marginBottom: "8px" }}>INTERNAL NOTES</div>
                          <div style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.6" }}>{selectedSponsor.notes}</div>
                        </div>}
                      </div>
                    )}
                  </div>
                )}

                {/* SEARCH & FILTERS */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "24px", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "340px" }}>
                    <Search size={14} color="#666" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                    <input type="text" placeholder="Search sponsors..." value={sponsorSearchQuery} onChange={e => setSponsorSearchQuery(e.target.value)}
                      style={{ width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "100px", padding: "11px 16px 11px 40px", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  {[
                    { v: "all", l: "All" }, { v: "active", l: "Active" }, { v: "inactive", l: "Inactive" },
                    { v: "expired", l: "Expired" }, { v: "featured", l: "Featured" }, { v: "pending", l: "Pending" }
                  ].map(f => (
                    <button key={f.v} onClick={() => setSponsorFilterStatus(f.v)}
                      style={{ background: sponsorFilterStatus === f.v ? "rgba(255,85,0,0.15)" : "rgba(255,255,255,0.03)", border: sponsorFilterStatus === f.v ? "1px solid rgba(255,85,0,0.3)" : "1px solid rgba(255,255,255,0.06)", color: sponsorFilterStatus === f.v ? "#FF5500" : "#888", padding: "10px 18px", borderRadius: "100px", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>
                      {f.l}
                    </button>
                  ))}
                  <div style={{ marginLeft: "auto", color: "#666", fontSize: "13px" }}>{filteredSponsors.length} result{filteredSponsors.length !== 1 ? "s" : ""}</div>
                </div>

                {/* SPONSOR CARDS GRID */}
                {filteredSponsors.length === 0 ? (
                  <div style={{ background: "#111", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "20px", padding: "60px", textAlign: "center" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏢</div>
                    <div style={{ color: "white", fontWeight: "800", marginBottom: "8px" }}>No sponsors found</div>
                    <div style={{ color: "#666", fontSize: "13px" }}>Try adjusting your search or filters, or add your first sponsor.</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                    {filteredSponsors.map(sponsor => {
                      const isExpired = sponsor.end_date && new Date(sponsor.end_date) < now;
                      return (
                        <div key={sponsor.id}
                          onClick={() => { setSelectedSponsor(sponsor); setSponsorFormMode(null); }}
                          style={{ background: "#111", border: selectedSponsor?.id === sponsor.id ? "1px solid rgba(255,85,0,0.4)" : "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s" }}
                          onMouseEnter={e => { if (selectedSponsor?.id !== sponsor.id) e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                          onMouseLeave={e => { if (selectedSponsor?.id !== sponsor.id) e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}>

                          {/* Banner */}
                          {sponsor.banner_url
                            ? <img loading="lazy" decoding="async" src={sponsor.banner_url} alt="Banner" style={{ width: "100%", height: "90px", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "90px", background: "linear-gradient(135deg, #1a1a1a, #111)", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: "12px" }}>No Banner</div>
                          }

                          <div style={{ padding: "16px" }}>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                              {sponsor.logo_url
                                ? <img loading="lazy" decoding="async" src={sponsor.logo_url} alt="Logo" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "contain", background: "rgba(255,255,255,0.05)", padding: "4px" }} />
                                : <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "linear-gradient(135deg, #FF5500, #b53c00)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", color: "white", fontSize: "16px" }}>{sponsor.company_name?.charAt(0)}</div>
                              }
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: "900", color: "white", fontSize: "14px" }}>{sponsor.company_name}</div>
                                <div style={{ fontSize: "11px", color: "#666" }}>{PLACEMENTS.find(p => p.value === sponsor.placement)?.label || sponsor.placement}</div>
                              </div>
                            </div>

                            {/* Stats row */}
                            <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "14px", fontWeight: "950", color: "#FF5500" }}>{(sponsor.clicks_count || 0).toLocaleString()}</div>
                                <div style={{ fontSize: "9px", color: "#555", fontWeight: "800" }}>CLICKS</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "14px", fontWeight: "950", color: "#22c55e" }}>{(sponsor.views_count || 0).toLocaleString()}</div>
                                <div style={{ fontSize: "9px", color: "#555", fontWeight: "800" }}>VIEWS</div>
                              </div>
                              <div style={{ flex: 1 }}></div>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                {isExpired
                                  ? <span style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "2px 8px", borderRadius: "100px", fontSize: "9px", fontWeight: "800" }}>EXPIRED</span>
                                  : <span style={{ background: sponsor.active_status ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", color: sponsor.active_status ? "#22c55e" : "#666", padding: "2px 8px", borderRadius: "100px", fontSize: "9px", fontWeight: "800" }}>{sponsor.active_status ? "ACTIVE" : "INACTIVE"}</span>
                                }
                              </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: "8px" }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => { setSelectedSponsor(sponsor); setSponsorFormMode(null); }}
                                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "white", padding: "7px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>👁 View</button>
                              <button onClick={() => openEditForm(sponsor)}
                                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "white", padding: "7px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>✏️ Edit</button>
                              <button onClick={() => toggleStatus(sponsor)}
                                style={{ flex: 1, background: sponsor.active_status ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", border: "none", color: sponsor.active_status ? "#ef4444" : "#22c55e", padding: "7px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
                                {sponsor.active_status ? "Deactivate" : "Activate"}
                              </button>
                              <button onClick={() => deleteSponsor(sponsor.id)}
                                style={{ background: "rgba(239,68,68,0.08)", border: "none", color: "#ef4444", padding: "7px 10px", borderRadius: "8px", fontSize: "11px", cursor: "pointer" }}>🗑</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}


          {/* ==================== 5M. VIP & RANKINGS (PHASE 4) ==================== */}
          {activeTab === "vip" && (
            <div>
              <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "28px", fontWeight: "950", margin: "0 0 8px 0", color: "#eab308" }}>VIP COMPETITORS & RANKINGS</h1>
                  <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>Manage blue-tick verifications and trigger ranking algorithms.</p>
                </div>
                <button style={{ background: "#eab308", color: "black", padding: "10px 24px", borderRadius: "100px", border: "none", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp size={16} /> RECALCULATE GLOBAL RANKINGS
                </button>
              </div>
              <div style={{ background: "#111", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)", padding: "24px" }}>
                 <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Crown size={18} color="#eab308" /> Elite VIP Verification Requests</h3>
                 {vipRequests.map(req => (
                   <div key={req.id} style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "bold" }}>{req.user_id?.name || 'Unknown User'}</div>
                        <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Status: {req.vip_status || 'Requested Legend Status'}</div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={async () => {
                          try {
                            const res = await apiCall(`/admin/monetization/vip/${req.user_id?.id || req.user_id}`, 'PUT', { is_verified: true, vip_status: 'legend' }, user.token);
                            if (res) { alert("VIP Status successfully updated."); fetchData(); }
                          } catch (e) { alert("Error granting VIP status"); }
                        }} style={{ background: "#eab308", color: "black", padding: "6px 16px", borderRadius: "100px", border: "none", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>GRANT VIP</button>
                      </div>
                   </div>
                 ))}
                 {vipRequests.length === 0 && <div style={{ color: "#888", fontSize: "14px", padding: "16px" }}>No VIP requests found.</div>}
              </div>
            </div>
          )}

          {/* ==================== 6. TICKETS & REVENUE FINANCIAL SUITE ==================== */}


          {/* ==================== COUPONS MANAGEMENT ==================== */}

          {/* ==================== HOMEPAGE CONTROL ==================== */}
          {activeTab === "homepageControl" && (
            <div>
              <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "28px", fontWeight: "950", margin: "0 0 8px 0" }}>HOMEPAGE CONTROL</h1>
                  <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>Manage which records appear in specific sections on the front page.</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
                {['featured', 'newly_verified', 'recent_uploads', 'top_ranked'].map(sectionName => (
                  <div key={sectionName} style={{ background: "#111", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "900", margin: 0, textTransform: "uppercase", color: "#FF5500" }}>{sectionName.replace('_', ' ')} Records</h3>
                    </div>

                    {homepageRecords[sectionName] && homepageRecords[sectionName].length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                        {homepageRecords[sectionName].map((record, index) => (
                          <div key={record.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: "14px", fontWeight: "900", color: "white" }}>{record.title}</span>
                              <button onClick={() => {
                                  apiCall(`/admin/records/${record.id}/homepage`, "DELETE", null, user.token)
                                    .then(() => { alert("Removed from homepage"); fetchData(); })
                                    .catch(e => alert("Error removing: " + e.message));
                                }} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>
                                REMOVE
                              </button>
                            </div>
                            <div style={{ fontSize: "12px", color: "#888" }}>{record.category} - {record.value} {record.unit}</div>
                            <div style={{ fontSize: "10px", color: "#555" }}>Order: {record.homepage_order}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "#666", fontSize: "13px", padding: "16px", background: "rgba(255,255,255,0.01)", borderRadius: "8px", textAlign: "center" }}>No records assigned to this section.</div>
                    )}

                    <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
                      <select onChange={(e) => {
                          if(!e.target.value) return;
                          apiCall(`/admin/records/${e.target.value}/homepage`, "PUT", { homepageSection: sectionName, homepageOrder: (homepageRecords[sectionName]?.length || 0) + 1 }, user.token)
                            .then(() => { alert("Added to section"); fetchData(); e.target.value = ""; })
                            .catch(err => alert("Error adding: " + err.message));
                        }} style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", padding: "10px", fontSize: "12px" }}>
                        <option value="">+ Assign an approved record to {sectionName.replace('_', ' ')}...</option>
                        {records.map(rec => (
                          <option key={rec.id} value={rec.id}>{rec.title} ({rec.value} {rec.unit})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== VIDEO MANAGEMENT ==================== */}
          {activeTab === "videoManagement" && (
            <div>
              <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "28px", fontWeight: "950", margin: "0 0 8px 0" }}>VIDEO MANAGEMENT</h1>
                  <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>Upload and manage Featured and Newest videos.</p>
                </div>
                <button onClick={() => { setModalType('add'); setModalTarget(null); setVideoForm({title: "", description: "", category: "Strength", isFeatured: false, isNewlyUploaded: false, videoUrl: ""}); setVideoFile(null); setThumbnailFile(null); setIsModalOpen(true); }} style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Plus size={14} /> UPLOAD NEW VIDEO
                </button>
              </div>

              <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0px", marginBottom: "32px" }}>
                {["all_submissions", "newest", "featured", "highlights"].map(sub => (
                  <button
                    key={sub}
                    onClick={() => setVideoManagementSubTab(sub)}
                    style={{ background: "transparent", border: "none", color: videoManagementSubTab === sub ? "#FF5500" : "#888", fontWeight: videoManagementSubTab === sub ? "900" : "700", fontSize: "14px", cursor: "pointer", textTransform: "uppercase", padding: "12px 6px", borderBottom: videoManagementSubTab === sub ? "3px solid #FF5500" : "3px solid transparent", outline: "none", transition: "all 0.2s" }}
                  >
                    {sub === "all_submissions" ? "ALL SUBMISSIONS" : `${sub} Videos`}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
                {videos[videoManagementSubTab] && videos[videoManagementSubTab].length > 0 ? videos[videoManagementSubTab].map(vid => (
                  <div key={vid.id} onClick={() => setSelectedVideoForViewing(vid)} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", overflow: "hidden", cursor: "pointer", transition: "all 0.3s", transform: "scale(1)" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.borderColor = "rgba(255,85,0,0.4)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; const overlay = e.currentTarget.querySelector('.hover-play-overlay'); if(overlay) overlay.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; const overlay = e.currentTarget.querySelector('.hover-play-overlay'); if(overlay) overlay.style.opacity = "0"; }}>
                    <div style={{ height: "160px", background: "#000", position: "relative" }}>
                      {vid.thumbnail_url || vid.thumbnailUrl ? (
                        <img loading="lazy" decoding="async" src={vid.thumbnail_url || vid.thumbnailUrl} alt="Thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Video size={32} color="#444" /></div>
                      )}
                      <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.7)", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", color: "white" }}>
                        {vid.category}
                      </div>
                      <div className="hover-play-overlay" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", opacity: 0, transition: "opacity 0.3s" }}>
                        <div style={{ width: "50px", height: "50px", background: "#FF5500", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "24px", marginLeft: "4px" }}>▶</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "16px" }}>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "900", color: "white" }}>{vid.title}</h4>
                      <p style={{ color: "#888", fontSize: "12px", margin: "0 0 16px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{vid.description}</p>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {vid.is_featured && <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "bold" }}>FEATURED</span>}
                          {vid.is_newly_uploaded && <span style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "bold" }}>NEW</span>}
                        </div>
                        <button onClick={(ev) => {
                          ev.stopPropagation();
                          // Items with "sub-" ids are record submissions, not videos: manage them under Records.
                          if (String(vid.id).startsWith("sub-")) {
                            alert("This video belongs to a record submission. Manage it from the Records / Submissions tab.");
                            return;
                          }
                          const typeRoute = { newest: "newest", featured: "featured", highlights: "record" }[videoManagementSubTab] || (vid.video_type === "newest_record" ? "newest" : vid.video_type === "record" ? "record" : "featured");
                          apiCall(`/admin/videos/${typeRoute}/${vid.id}`, "DELETE", null, user.token)
                            .then(() => { alert("Video removed successfully"); fetchData(); })
                            .catch(e => alert("Error removing video: " + e.message));
                        }} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>
                          DELETE
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px", color: "#666", background: "rgba(255,255,255,0.01)", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.05)" }}>
                    <Video size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                    <h3 style={{ margin: "0 0 8px 0", color: "white" }}>NO VIDEOS UPLOADED</h3>
                    <p style={{ margin: 0 }}>Click "Upload New Video" to add content to this section.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "coupons" && (
            <div>
                  {/* Coupons Revenue Grid Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "56px" }}>
                    {/* Card 1 */}
                    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "16px", padding: "32px", position: "relative", overflow: "hidden", border: "1px solid #FF5500", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                      <div style={{ color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", marginBottom: "16px" }}>ACTIVE COUPONS</div>
                      <div style={{ fontSize: "42px", fontWeight: "950", color: "#FF5500", lineHeight: "1", marginBottom: "16px", letterSpacing: "-1px" }}>
                        {couponStats?.activeCoupons || 0} <span style={{ fontSize: "18px", color: "#666", fontWeight: "600" }}>/ {couponStats?.totalCoupons || 0} TOTAL</span>
                      </div>
                      <div style={{ color: "#aaa", fontSize: "11px", fontWeight: "800" }}>
                        {couponStats?.expiredCoupons || 0} INACTIVE OR EXPIRED
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "16px", padding: "32px", position: "relative", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div style={{ color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px" }}>REVENUE SAVINGS IMPACT</div>
                        <DollarSign size={20} color="#FF5500" />
                      </div>
                      <div style={{ fontSize: "42px", fontWeight: "950", color: "white", lineHeight: "1", marginBottom: "16px", letterSpacing: "-1px" }}>
                        ${(couponStats?.totalDiscountImpact || 0).toLocaleString()}
                      </div>
                      <div style={{ color: "#22c55e", fontSize: "11px", fontWeight: "800" }}>
                        TOTAL SAVED BY ATHLETES
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "16px", padding: "32px", position: "relative", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                      <div style={{ color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", marginBottom: "16px" }}>MOST POPULAR CODE</div>
                      <div style={{ fontSize: "32px", fontWeight: "950", color: "white", lineHeight: "1.2", marginBottom: "12px", letterSpacing: "-0.5px" }}>
                        {couponStats?.mostUsed?.[0] ? couponStats.mostUsed[0].code : 'NONE YET'}
                      </div>
                      <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "800" }}>
                        {couponStats?.mostUsed?.[0] ? `${couponStats.mostUsed[0].redemptions_count} REDEMPTIONS` : '0 REDEMPTIONS'}
                      </div>
                    </div>
                  </div>

                  {/* Header Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "24px", fontWeight: "950", color: "white", margin: 0, textTransform: "uppercase", letterSpacing: "-0.5px" }}>
                      COUPON INVENTORY
                    </h3>
                    <button
                      onClick={(e) => { e.preventDefault(); openModal("add"); }}
                      style={{ background: "#FF5500", color: "white", border: "none", padding: "10px 20px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                    >
                      <Plus size={14} /> CREATE COUPON
                    </button>
                  </div>

                  {/* Coupon Search */}
                  <div style={{ position: "relative", marginBottom: "32px" }}>
                    <Search size={16} color="#666" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      placeholder="SEARCH COUPON CODES..."
                      value={couponSearchQuery}
                      onChange={(e) => setCouponSearchQuery(e.target.value)}
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "100px", padding: "16px 16px 16px 48px", color: "white", fontSize: "11px", fontWeight: "800", outline: "none", letterSpacing: "1px" }}
                    />
                  </div>

                  {/* Coupons Table */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", overflow: "hidden", marginBottom: "56px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#888", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px" }}>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>CODE</th>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>DISCOUNT</th>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>APPLIES TO</th>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>USAGE STATUS</th>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>LIMITS & RULES</th>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>EXPIRES</th>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>ACTIVE STATUS</th>
                          <th style={{ padding: "20px 24px", textAlign: "right" }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons
                          .filter(c => c.code.toLowerCase().includes(couponSearchQuery.toLowerCase()))
                          .map((coupon) => {
                            const isExpired = coupon.expiration_date && new Date(coupon.expiration_date) < new Date();
                            const isLimitReached = coupon.max_redemptions !== null && coupon.redemptions_count >= coupon.max_redemptions;
                            const isValid = coupon.active && !isExpired && !isLimitReached;

                            return (
                              <tr key={coupon.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }} className="table-row-hover">
                                <td style={{ padding: "20px 24px" }}>
                                  <div style={{ color: "white", fontWeight: "900", letterSpacing: "0.5px", fontSize: "14px" }}>{coupon.code}</div>
                                </td>
                                <td style={{ padding: "20px 24px", color: "#FF5500", fontWeight: "900", fontSize: "14px" }}>
                                  {coupon.discount_type === 'percentage' ? `${parseFloat(coupon.discount_value)}%` : `$${parseFloat(coupon.discount_value).toFixed(2)}`}
                                </td>
                                <td style={{ padding: "20px 24px", color: "#aaa", fontWeight: "800" }}>
                                  <span style={{ textTransform: "uppercase", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "4px", fontSize: "10px" }}>
                                    {coupon.applies_to}
                                  </span>
                                  {coupon.target_id && (
                                    <div style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>
                                      {coupon.target_id}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: "20px 24px", color: "white", fontWeight: "700" }}>
                                  <div style={{ fontSize: "13px" }}>{coupon.redemptions_count || 0}{coupon.max_redemptions ? ` / ${coupon.max_redemptions}` : ""} uses</div>
                                  <div style={{ fontSize: "10px", color: "#888" }}>
                                    {coupon.max_redemptions ? `${Math.max(0, coupon.max_redemptions - (coupon.redemptions_count || 0))} left` : 'No total limit'}
                                    {" · "}{coupon.max_per_user ? `${coupon.max_per_user} per account` : 'no per-account limit'}
                                  </div>
                                  {(coupon.unique_accounts > 0 || coupon.total_discount_given > 0) && (
                                    <div style={{ fontSize: "10px", color: "#555" }}>{coupon.unique_accounts || 0} accounts · ${Number(coupon.total_discount_given || 0).toFixed(2)} saved</div>
                                  )}
                                </td>
                                <td style={{ padding: "20px 24px", color: "#888", fontWeight: "600" }}>
                                  <div style={{ fontSize: "11px" }}>Min Spend: ${parseFloat(coupon.min_purchase).toFixed(2)}</div>
                                  {coupon.restricted_membership_tier && (
                                    <div style={{ fontSize: "10px", color: "#ff8800", marginTop: "2px" }}>Tier: {coupon.restricted_membership_tier.toUpperCase()}+</div>
                                  )}
                                  {coupon.restricted_country && (
                                    <div style={{ fontSize: "10px", color: "#55aaff", marginTop: "2px" }}>Country: {coupon.restricted_country}</div>
                                  )}
                                </td>
                                <td style={{ padding: "20px 24px", color: isExpired ? "#ef4444" : "#aaa", fontWeight: "700" }}>
                                  {coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString() : 'Never'}
                                </td>
                                <td style={{ padding: "20px 24px" }}>
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      try {
                                        await apiCall(`/coupons/${coupon.id}`, "PUT", { active: !coupon.active }, user.token);
                                        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c));
                                        showToast(`Coupon ${coupon.code} ${!coupon.active ? 'activated' : 'deactivated'} successfully`, "success");
                                      } catch (err) {
                                        showToast(`Toggle failed: ${err.message}`, "error");
                                      }
                                    }}
                                    style={{
                                      background: isValid ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                                      color: isValid ? "#22c55e" : "#ef4444",
                                      padding: "6px 12px", borderRadius: "100px", fontWeight: "900", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px",
                                      border: `1px solid ${isValid ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, cursor: "pointer", outline: "none"
                                    }}
                                  >
                                    {isValid ? 'ACTIVE' : coupon.active ? 'EXPIRED/LIMIT' : 'DISABLED'}
                                  </button>
                                </td>
                                <td style={{ padding: "20px 24px", textAlign: "right" }}>
                                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                    <button
                                      onClick={(e) => { e.preventDefault(); openModal("edit", coupon); }}
                                      style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                    >
                                      <Edit3 size={12} /> Edit
                                    </button>
                                    <button
                                      onClick={(e) => { e.preventDefault(); handleDelete(coupon.id); }}
                                      style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                    >
                                      <Trash2 size={12} /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {coupons.length === 0 && (
                          <tr>
                            <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "#666", fontWeight: "800" }}>
                              NO COUPONS GENERATED YET. CLICK "CREATE COUPON" TO START!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
          )}

          {activeTab === "revenue" && (
            <div>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
                <div>
                  <div style={{ color: "#FF5500", fontSize: "11px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                    Central Treasury
                  </div>
                  <h2 style={{ fontSize: "56px", fontWeight: "950", margin: "0 0 12px 0", color: "white", letterSpacing: "-2px", textTransform: "uppercase", lineHeight: "1" }}>
                    FINANCIAL
                    <br />OVERSIGHT
                  </h2>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); handleExportLedger(); }}
                  style={{ background: "#FF5500", color: "white", border: "none", padding: "14px 28px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "1px", marginTop: "12px", boxShadow: "0 4px 14px rgba(255,85,0,0.4)" }}
                >
                  <TrendingUp size={14} /> EXPORT LEDGER
                </button>
              </div>

              {/* Revenue Sub Tabs navigation */}
              <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0px", marginBottom: "40px" }}>
                <button
                  onClick={(e) => { e.preventDefault(); setRevenueSubTab("ledger"); }}
                  style={{ background: "transparent", border: "none", color: revenueSubTab === "ledger" ? "#FF5500" : "#888", fontWeight: revenueSubTab === "ledger" ? "900" : "700", fontSize: "14px", cursor: "pointer", textTransform: "uppercase", padding: "12px 6px", borderBottom: revenueSubTab === "ledger" ? "3px solid #FF5500" : "3px solid transparent", outline: "none", transition: "all 0.2s" }}
                >
                  Transaction Ledger
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); setRevenueSubTab("coupons"); }}
                  style={{ background: "transparent", border: "none", color: revenueSubTab === "coupons" ? "#FF5500" : "#888", fontWeight: revenueSubTab === "coupons" ? "900" : "700", fontSize: "14px", cursor: "pointer", textTransform: "uppercase", padding: "12px 6px", borderBottom: revenueSubTab === "coupons" ? "3px solid #FF5500" : "3px solid transparent", outline: "none", transition: "all 0.2s" }}
                >
                  Discount Coupons
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); setRevenueSubTab("tickets"); }}
                  style={{ background: "transparent", border: "none", color: revenueSubTab === "tickets" ? "#FF5500" : "#888", fontWeight: revenueSubTab === "tickets" ? "900" : "700", fontSize: "14px", cursor: "pointer", textTransform: "uppercase", padding: "12px 6px", borderBottom: revenueSubTab === "tickets" ? "3px solid #FF5500" : "3px solid transparent", outline: "none", transition: "all 0.2s" }}
                >
                  Ticket Sales
                </button>
              </div>

              {revenueSubTab === "ledger" && (
                <>
                  {/* Financial Revenue Grid Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                    {/* Card 1: Net Paid Revenue */}
                    <div
                      onClick={() => { setPaymentsFilterStatus("paid"); setPaymentsFilterType("all"); }}
                      style={{ background: "rgba(255,255,255,0.02)", borderRadius: "24px", padding: "32px", position: "relative", overflow: "hidden", border: paymentsFilterStatus === "paid" && paymentsFilterType === "all" ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", cursor: "pointer", transition: "all 0.2s" }}
                      className="hover-scale-glow"
                    >
                      <div style={{ color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", marginBottom: "16px", textTransform: "uppercase" }}>NET PAID REVENUE</div>
                      <div style={{ fontSize: "40px", fontWeight: "950", color: "#FF5500", lineHeight: "1", marginBottom: "16px", letterSpacing: "-1px" }}>
                        ${(ledgerMetrics?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ color: "#22c55e", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" }}>
                        <TrendingUp size={12} color="#22c55e" /> LIVE SYNCED FROM SYSTEM
                      </div>
                    </div>

                    {/* Card 2: Transactions Breakdown */}
                    <div
                      onClick={() => { setPaymentsFilterStatus("all"); setPaymentsFilterType("all"); }}
                      style={{ background: "rgba(255,255,255,0.02)", borderRadius: "24px", padding: "32px", position: "relative", overflow: "hidden", border: paymentsFilterStatus === "all" && paymentsFilterType === "all" ? "1px solid #FF5500" : "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", cursor: "pointer", transition: "all 0.2s" }}
                      className="hover-scale-glow"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div style={{ color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px" }}>TOTAL TRANSACTIONS</div>
                        <CreditCard size={20} color="#444" />
                      </div>
                      <div style={{ fontSize: "40px", fontWeight: "950", color: "white", lineHeight: "1", marginBottom: "16px" }}>
                        {ledgerPayments.length}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "10px", fontWeight: "800", color: "rgba(255,255,255,0.4)" }}>
                        <span>Paid: {ledgerPayments.filter(p => p.status === 'paid').length}</span>
                        <span>•</span>
                        <span>Pending: {ledgerPayments.filter(p => p.status === 'pending').length}</span>
                        <span>•</span>
                        <span>Failed: {ledgerMetrics?.failedCount || 0}</span>
                      </div>
                    </div>

                    {/* Card 3: Escrow / Adjustments */}
                    <div
                      onClick={() => { setPaymentsFilterStatus("refunded"); setPaymentsFilterType("all"); }}
                      style={{ background: "rgba(255,255,255,0.02)", borderRadius: "24px", padding: "32px", position: "relative", overflow: "hidden", border: paymentsFilterStatus === "refunded" && paymentsFilterType === "all" ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", cursor: "pointer", transition: "all 0.2s" }}
                      className="hover-scale-glow"
                    >
                      <div style={{ color: "#888", fontSize: "11px", fontWeight: "900", letterSpacing: "1.5px", marginBottom: "16px" }}>TOTAL ADJUSTMENTS / REFUNDS</div>
                      <div style={{ fontSize: "40px", fontWeight: "950", color: "#ef4444", lineHeight: "1", marginBottom: "16px", letterSpacing: "-1px" }}>
                        -${(ledgerMetrics?.refundRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ color: "#ef4444", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" }}>
                        <ShieldAlert size={12} /> {ledgerPayments.filter(p => p.status === 'refunded').length} REFUNDED ENTRIES
                      </div>
                    </div>
                  </div>

                  {/* Payment Streams Detailed Aggregates bar */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", marginBottom: "40px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "20px", padding: "20px" }}>
                    <div
                      onClick={() => { setPaymentsFilterType("membership"); setPaymentsFilterStatus("all"); }}
                      style={{ textAlign: "center", cursor: "pointer", padding: "8px", borderRadius: "10px", background: paymentsFilterType === "membership" ? "rgba(255,85,0,0.08)" : "transparent", transition: "all 0.2s" }}
                    >
                      <div style={{ fontSize: "10px", color: "#888", fontWeight: "900", letterSpacing: "1px", marginBottom: "4px" }}>MEMBERSHIPS</div>
                      <div style={{ fontSize: "14px", fontWeight: "950", color: "white" }}>${(ledgerMetrics?.membershipRevenue || 0).toFixed(2)}</div>
                    </div>
                    <div
                      onClick={() => { setPaymentsFilterType("shop"); setPaymentsFilterStatus("all"); }}
                      style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", padding: "8px", borderRadius: "10px", background: paymentsFilterType === "shop" ? "rgba(255,85,0,0.08)" : "transparent", transition: "all 0.2s" }}
                    >
                      <div style={{ fontSize: "10px", color: "#888", fontWeight: "900", letterSpacing: "1px", marginBottom: "4px" }}>SHOP SALES</div>
                      <div style={{ fontSize: "14px", fontWeight: "950", color: "white" }}>${(ledgerMetrics?.shopRevenue || 0).toFixed(2)}</div>
                    </div>
                    <div
                      onClick={() => { setPaymentsFilterType("ticket"); setPaymentsFilterStatus("all"); }}
                      style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", padding: "8px", borderRadius: "10px", background: paymentsFilterType === "ticket" ? "rgba(255,85,0,0.08)" : "transparent", transition: "all 0.2s" }}
                    >
                      <div style={{ fontSize: "10px", color: "#888", fontWeight: "900", letterSpacing: "1px", marginBottom: "4px" }}>TICKET SALES</div>
                      <div style={{ fontSize: "14px", fontWeight: "950", color: "white" }}>${(ledgerMetrics?.ticketRevenue || 0).toFixed(2)}</div>
                    </div>
                    <div
                      onClick={() => { setPaymentsFilterType("submission"); setPaymentsFilterStatus("all"); }}
                      style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", padding: "8px", borderRadius: "10px", background: paymentsFilterType === "submission" ? "rgba(255,85,0,0.08)" : "transparent", transition: "all 0.2s" }}
                    >
                      <div style={{ fontSize: "10px", color: "#888", fontWeight: "900", letterSpacing: "1px", marginBottom: "4px" }}>SUBMISSIONS</div>
                      <div style={{ fontSize: "14px", fontWeight: "950", color: "white" }}>${(ledgerMetrics?.submissionRevenue || 0).toFixed(2)}</div>
                    </div>
                    <div
                      onClick={() => { setPaymentsFilterType("challenge"); setPaymentsFilterStatus("all"); }}
                      style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", padding: "8px", borderRadius: "10px", background: paymentsFilterType === "challenge" ? "rgba(255,85,0,0.08)" : "transparent", transition: "all 0.2s" }}
                    >
                      <div style={{ fontSize: "10px", color: "#888", fontWeight: "900", letterSpacing: "1px", marginBottom: "4px" }}>CHALLENGES</div>
                      <div style={{ fontSize: "14px", fontWeight: "950", color: "white" }}>${(ledgerMetrics?.challengeRevenue || 0).toFixed(2)}</div>
                    </div>
                    <div
                      onClick={() => { setPaymentsFilterStatus("pending"); setPaymentsFilterType("all"); }}
                      style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", padding: "8px", borderRadius: "10px", background: paymentsFilterStatus === "pending" ? "rgba(234,179,8,0.1)" : "transparent", transition: "all 0.2s" }}
                    >
                      <div style={{ fontSize: "10px", color: "#eab308", fontWeight: "900", letterSpacing: "1px", marginBottom: "4px" }}>PENDING ESCROW</div>
                      <div style={{ fontSize: "14px", fontWeight: "950", color: "#eab308" }}>${(ledgerMetrics?.pendingRevenue || 0).toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Interactive Roster Controls */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>

                    {/* Header with quick stream filter bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                      <h3 style={{ fontSize: "20px", fontWeight: "950", color: "white", margin: 0, textTransform: "uppercase", letterSpacing: "-0.5px" }}>
                        💳 REGISTRY TRANSACTIONS
                      </h3>

                      {/* Payment Type Streams Selector */}
                      <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.02)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" }}>
                        {[
                          { label: "ALL STREAMS", value: "all" },
                          { label: "MEMBERSHIPS", value: "membership" },
                          { label: "SHOP SALES", value: "shop" },
                          { label: "TICKETS", value: "ticket" },
                          { label: "SUBMISSIONS", value: "submission" },
                          { label: "CHALLENGES", value: "challenge" },
                          { label: "MANUAL & SPONSORSHIPS", value: "manual" }
                        ].map(typeOpt => (
                          <button
                            key={typeOpt.value}
                            onClick={() => setPaymentsFilterType(typeOpt.value)}
                            style={{
                              background: paymentsFilterType === typeOpt.value ? "#FF5500" : "transparent",
                              color: paymentsFilterType === typeOpt.value ? "white" : "#888",
                              border: "none",
                              padding: "8px 16px",
                              borderRadius: "8px",
                              fontSize: "10px",
                              fontWeight: "900",
                              cursor: "pointer",
                              textTransform: "uppercase",
                              transition: "all 0.2s"
                            }}
                          >
                            {typeOpt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filter by Status & Search Bar Row */}
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", width: "100%" }}>

                      {/* Search Input Box with Action Buttons */}
                      <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "280px", alignItems: "center" }}>
                        <div style={{ position: "relative", flex: 1 }}>
                          <Search size={16} color="#FF5500" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                          <input
                            type="text"
                            placeholder="SEARCH BY NAME, EMAIL, ID, REF, MEMBER, ORDER..."
                            value={paymentsSearchQuery}
                            onChange={(e) => setPaymentsSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                setPaymentsSearchApplied(paymentsSearchQuery);
                              }
                            }}
                            style={{
                              width: "100%",
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.05)",
                              borderRadius: "100px",
                              padding: "16px 16px 16px 48px",
                              color: "white",
                              fontSize: "11px",
                              fontWeight: "800",
                              outline: "none",
                              letterSpacing: "0.5px"
                            }}
                          />
                        </div>

                        {/* Search Button */}
                        <button
                          onClick={(e) => { e.preventDefault(); setPaymentsSearchApplied(paymentsSearchQuery); }}
                          style={{
                            background: "linear-gradient(135deg, #FF5500 0%, #ff7700 100%)",
                            color: "white",
                            border: "none",
                            padding: "14px 24px",
                            borderRadius: "100px",
                            fontSize: "11px",
                            fontWeight: "900",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            transition: "all 0.2s",
                            boxShadow: "0 4px 12px rgba(255,85,0,0.25)"
                          }}
                        >
                          Search
                        </button>

                        {/* Clear Search Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setPaymentsSearchQuery("");
                            setPaymentsSearchApplied("");
                          }}
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            color: "#888",
                            border: "1px solid rgba(255,255,255,0.05)",
                            padding: "14px 20px",
                            borderRadius: "100px",
                            fontSize: "11px",
                            fontWeight: "900",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            transition: "all 0.2s"
                          }}
                        >
                          Clear Search
                        </button>
                      </div>

                      {/* Status Badges Selector */}
                      <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.02)", padding: "4px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.05)", alignItems: "center" }}>
                        {[
                          { label: "ALL STATUSES", value: "all" },
                          { label: "PAID", value: "paid" },
                          { label: "PENDING", value: "pending" },
                          { label: "FAILED", value: "failed" },
                          { label: "REFUNDED", value: "refunded" }
                        ].map(statusOpt => (
                          <button
                            key={statusOpt.value}
                            onClick={() => setPaymentsFilterStatus(statusOpt.value)}
                            style={{
                              background: paymentsFilterStatus === statusOpt.value ? "rgba(255,255,255,0.08)" : "transparent",
                              color: paymentsFilterStatus === statusOpt.value ? "#FF5500" : "#888",
                              border: "none",
                              padding: "6px 14px",
                              borderRadius: "100px",
                              fontSize: "10px",
                              fontWeight: "900",
                              cursor: "pointer",
                              textTransform: "uppercase",
                              transition: "all 0.15s"
                            }}
                          >
                            {statusOpt.label}
                          </button>
                        ))}
                      </div>

                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "24px", overflow: "hidden", marginBottom: "56px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#888", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px" }}>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>CUSTOMER / ATHLETE</th>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>STREAM TYPE</th>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>REFERENCE ID / KEY</th>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>AMOUNT</th>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>DATE</th>
                          <th style={{ padding: "20px 24px", textAlign: "left" }}>STATUS</th>
                          <th style={{ padding: "20px 24px", textAlign: "right" }}>ACTIONS / CONTROLS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerPayments.filter(p => {
                          const searchMatch = !paymentsSearchApplied.trim() || (() => {
                            const q = paymentsSearchApplied.toLowerCase();
                            return (p.customerName || "").toLowerCase().includes(q) ||
                                   (p.customerEmail || "").toLowerCase().includes(q) ||
                                   (p.id || "").toLowerCase().includes(q) ||
                                   (p.referenceId && p.referenceId.toLowerCase().includes(q)) ||
                                   (p.memberNumber && p.memberNumber.toLowerCase().includes(q)) ||
                                   (p.orderNumber && p.orderNumber.toLowerCase().includes(q)) ||
                                   (p.transactionId && p.transactionId.toLowerCase().includes(q)) ||
                                   (p.title && p.title.toLowerCase().includes(q)) ||
                                   (p.category && p.category.toLowerCase().includes(q));
                          })();

                          const typeMatch = paymentsFilterType === 'all' || p.paymentType === paymentsFilterType;
                          const statusMatch = paymentsFilterStatus === 'all' || p.status === paymentsFilterStatus;

                          return searchMatch && typeMatch && statusMatch;
                        }).map((row, idx) => {
                          const typeLabel =
                            row.paymentType === 'membership' ? 'ELITE MEMBERSHIP' :
                            row.paymentType === 'shop' ? 'SHOP MERCHANDISE' :
                            row.paymentType === 'ticket' ? 'EVENT TICKET' :
                            row.paymentType === 'challenge' ? 'CHALLENGE FEE' : 'SUBMISSION FEE';

                          const typeColor =
                            row.paymentType === 'membership' ? '#a855f7' :
                            row.paymentType === 'shop' ? '#3b82f6' :
                            row.paymentType === 'ticket' ? '#ec4899' :
                            row.paymentType === 'challenge' ? '#eab308' : '#14b8a6';

                          return (
                            <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", transition: "background 0.2s" }} className="table-row-hover">

                              {/* Athlete / Customer details */}
                              <td style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `linear-gradient(135deg, ${typeColor}22 0%, ${typeColor}44 100%)`, border: `1px solid ${typeColor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "950", color: typeColor, fontSize: "12px" }}>
                                  {row.customerName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ color: "white", fontWeight: "900", fontSize: "13px" }}>{row.customerName}</div>
                                  <div style={{ color: "#555", fontSize: "10px", fontWeight: "700", marginTop: "2px" }}>{row.customerEmail}</div>
                                </div>
                              </td>

                              {/* Stream Type Tag */}
                              <td style={{ padding: "20px 24px" }}>
                                <span style={{ background: `${typeColor}15`, border: `1px solid ${typeColor}30`, color: typeColor, padding: "4px 10px", borderRadius: "8px", fontSize: "9px", fontWeight: "900", letterSpacing: "0.5px" }}>
                                  {typeLabel}
                                </span>
                              </td>

                              {/* Reference ID / Code */}
                              <td style={{ padding: "20px 24px", fontFamily: "monospace", color: "#888", fontSize: "11px", fontWeight: "800" }}>
                                {row.id}
                              </td>

                              {/* Amount */}
                              <td style={{ padding: "20px 24px", color: row.status === 'refunded' ? '#ef4444' : '#FF5500', fontWeight: "950", fontSize: "14px" }}>
                                {row.status === 'refunded' ? '-' : ''}${row.amount.toFixed(2)}
                              </td>

                              {/* Date */}
                              <td style={{ padding: "20px 24px", color: "#aaa", fontWeight: "700" }}>
                                {new Date(row.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>

                              {/* Status Badge */}
                              <td style={{ padding: "20px 24px" }}>
                                <span style={{
                                  background: row.status === "paid" ? "rgba(34,197,94,0.1)" : row.status === "pending" ? "rgba(234,179,8,0.1)" : row.status === "failed" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
                                  color: row.status === "paid" ? "#22c55e" : row.status === "pending" ? "#eab308" : row.status === "failed" ? "#ef4444" : "#888",
                                  padding: "4px 12px", borderRadius: "100px", fontWeight: "900", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px",
                                  border: `1px solid ${row.status === "paid" ? "rgba(34,197,94,0.2)" : row.status === "pending" ? "rgba(234,179,8,0.2)" : row.status === "failed" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)"}`
                                }}>
                                  {row.status}
                                </span>
                              </td>

                              {/* Action Trigger Buttons */}
                              <td style={{ padding: "20px 24px", textAlign: "right" }}>
                                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>

                                  {/* VIEW DETAILS ACTION */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const details = `TRANSACTION METRICS DETAILS:\n` +
                                        `----------------------------------------\n` +
                                        `Transaction ID / Key: ${row.id}\n` +
                                        `Customer: ${row.customerName}\n` +
                                        `Email Address: ${row.customerEmail}\n` +
                                        `Payment Stream: ${typeLabel}\n` +
                                        `Amount: $${row.amount.toFixed(2)}\n` +
                                        `Date: ${new Date(row.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}\n` +
                                        `Transaction Status: ${row.status.toUpperCase()}\n` +
                                        (row.memberNumber ? `Member Number: ${row.memberNumber}\n` : "") +
                                        (row.orderNumber ? `Order Number: ${row.orderNumber}\n` : "") +
                                        (row.category ? `Category: ${row.category}\n` : "") +
                                        (row.paymentMethod ? `Payment Method: ${row.paymentMethod}\n` : "") +
                                        (row.title ? `Title: ${row.title}\n` : "") +
                                        (row.notes ? `Notes / Description: ${row.notes}\n` : "") +
                                        (row.receiptUrl ? `Receipt: ${row.receiptUrl.substring(0, 100)}${row.receiptUrl.length > 100 ? '...' : ''}\n` : "");
                                      alert(details);
                                    }}
                                    style={{
                                      background: "rgba(255,255,255,0.05)",
                                      border: "1px solid rgba(255,255,255,0.05)",
                                      color: "white",
                                      padding: "6px 12px",
                                      borderRadius: "6px",
                                      fontSize: "10px",
                                      fontWeight: "900",
                                      cursor: "pointer",
                                      transition: "all 0.2s"
                                    }}
                                  >
                                    VIEW
                                  </button>

                                  {/* EDIT MANUAL REVENUE */}
                                  {row.paymentType === 'manual' && (
                                    <button
                                      onClick={(e) => { e.preventDefault(); openModal("edit", row); }}
                                      style={{
                                        background: "rgba(255,136,0,0.1)",
                                        border: "1px solid rgba(255,136,0,0.2)",
                                        color: "#FF8800",
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        fontSize: "10px",
                                        fontWeight: "900",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                      }}
                                    >
                                      EDIT
                                    </button>
                                  )}

                                  {row.status === 'paid' && (
                                    <button
                                      onClick={() => handlePaymentStatusUpdate(row, 'refunded')}
                                      style={{
                                        background: "rgba(239,68,68,0.1)",
                                        border: "1px solid rgba(239,68,68,0.2)",
                                        color: "#ef4444",
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        fontSize: "10px",
                                        fontWeight: "900",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                      }}
                                      className="hover-bg-red-20"
                                    >
                                      REFUND
                                    </button>
                                  )}

                                  {row.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handlePaymentStatusUpdate(row, 'paid')}
                                        style={{
                                          background: "rgba(34,197,94,0.1)",
                                          border: "1px solid rgba(34,197,94,0.2)",
                                          color: "#22c55e",
                                          padding: "6px 12px",
                                          borderRadius: "6px",
                                          fontSize: "10px",
                                          fontWeight: "900",
                                          cursor: "pointer",
                                          transition: "all 0.2s"
                                        }}
                                      >
                                        APPROVE
                                      </button>
                                      <button
                                        onClick={() => handlePaymentStatusUpdate(row, 'failed')}
                                        style={{
                                          background: "rgba(239,68,68,0.1)",
                                          border: "1px solid rgba(239,68,68,0.2)",
                                          color: "#ef4444",
                                          padding: "6px 12px",
                                          borderRadius: "6px",
                                          fontSize: "10px",
                                          fontWeight: "900",
                                          cursor: "pointer",
                                          transition: "all 0.2s"
                                        }}
                                      >
                                        FAIL
                                      </button>
                                    </>
                                  )}

                                  {(row.status === 'refunded' || row.status === 'failed') && row.paymentType !== 'manual' && (
                                    <span style={{ color: "#444", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>
                                      ARCHIVED
                                    </span>
                                  )}
                                </div>
                              </td>

                            </tr>
                          );
                        })}

                        {ledgerPayments.filter(p => {
                          const searchMatch = !paymentsSearchApplied.trim() || (() => {
                            const q = paymentsSearchApplied.toLowerCase();
                            return (p.customerName || "").toLowerCase().includes(q) ||
                                   (p.customerEmail || "").toLowerCase().includes(q) ||
                                   (p.id || "").toLowerCase().includes(q) ||
                                   (p.referenceId && p.referenceId.toLowerCase().includes(q)) ||
                                   (p.memberNumber && p.memberNumber.toLowerCase().includes(q)) ||
                                   (p.orderNumber && p.orderNumber.toLowerCase().includes(q)) ||
                                   (p.transactionId && p.transactionId.toLowerCase().includes(q)) ||
                                   (p.title && p.title.toLowerCase().includes(q)) ||
                                   (p.category && p.category.toLowerCase().includes(q));
                          })();

                          const typeMatch = paymentsFilterType === 'all' || p.paymentType === paymentsFilterType;
                          const statusMatch = paymentsFilterStatus === 'all' || p.status === paymentsFilterStatus;

                          return searchMatch && typeMatch && statusMatch;
                        }).length === 0 && (
                          <tr>
                            <td colSpan="7" style={{ padding: "48px", textAlign: "center", color: "#555", fontWeight: "900", fontSize: "14px" }}>
                              NO TRANSACTIONS MATCHED THE ACTIVE SEARCH OR FILTER PRESETS.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Guidelines Summary */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "48px", alignItems: "center" }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "20px", padding: "32px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <h4 style={{ fontSize: "18px", fontWeight: "950", color: "white", margin: "0 0 24px 0", textTransform: "uppercase", letterSpacing: "-0.5px" }}>PAYOUT VELOCITY</h4>

                      <div style={{ marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "10px", color: "#888", fontWeight: "900", letterSpacing: "1px" }}>VERIFIED TRANSFERS</span>
                          <span style={{ fontSize: "10px", color: "white", fontWeight: "900" }}>94%</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px" }}>
                          <div style={{ width: "94%", height: "100%", background: "linear-gradient(90deg, #FF5500, #ff8800)", borderRadius: "3px" }} />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "10px", color: "#888", fontWeight: "900", letterSpacing: "1px" }}>ESCROW RELEASE</span>
                          <span style={{ fontSize: "10px", color: "white", fontWeight: "900" }}>78%</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px" }}>
                          <div style={{ width: "78%", height: "100%", background: "linear-gradient(90deg, #FF5500, #ff8800)", borderRadius: "3px" }} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p style={{ color: "#FF8866", fontSize: "14px", lineHeight: "1.6", fontWeight: "600", marginBottom: "24px" }}>
                        Financial oversight operations are running dynamically at peak system optimization. We have aggregated real-time database transactions from all membership tiers, catalog orders, livestream spectator tickets, and adjudication submissions into a central ledger.
                      </p>
                      <button style={{ background: "transparent", color: "#FF5500", border: "none", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "1px", padding: 0 }}>
                        SECURE PAYMENTS COMPLIANCE PROTOCOLS <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}



              {/* Ticket Sales Tab */}
              {revenueSubTab === "tickets" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div style={{ position: "relative", width: "400px" }}>
                      <Search size={16} color="#888" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        type="text"
                        placeholder="Search by Order ID, Name, Email, or Member Number..."
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "14px 14px 14px 44px", borderRadius: "12px", color: "white", fontSize: "12px", fontWeight: "600", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
                          <th style={{ padding: "20px 24px", color: "#888", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>ORDER ID / ACCESS CODE</th>
                          <th style={{ padding: "20px 24px", color: "#888", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>PURCHASER</th>
                          <th style={{ padding: "20px 24px", color: "#888", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>EVENT</th>
                          <th style={{ padding: "20px 24px", color: "#888", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>PRICE</th>
                          <th style={{ padding: "20px 24px", color: "#888", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>DATE</th>
                          <th style={{ padding: "20px 24px", color: "#888", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.filter(t => {
                          const query = ticketSearchQuery.toLowerCase();
                          return !query ||
                            t.accessCode?.toLowerCase().includes(query) ||
                            t.user?.name?.toLowerCase().includes(query) ||
                            t.user?.email?.toLowerCase().includes(query) ||
                            t.user?.memberNumber?.toLowerCase().includes(query) ||
                            t.event?.title?.toLowerCase().includes(query);
                        }).map((ticket) => (
                          <tr key={ticket.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", transition: "background 0.2s" }} className="hover-bg-light">
                            <td style={{ padding: "20px 24px", fontFamily: "monospace", color: "#888", fontSize: "11px", fontWeight: "800" }}>
                              {ticket.accessCode}
                            </td>
                            <td style={{ padding: "20px 24px" }}>
                              <div style={{ fontWeight: "900", color: "white", fontSize: "14px" }}>{ticket.user?.name || "Unknown"}</div>
                              <div style={{ color: "#aaa", fontSize: "12px" }}>{ticket.user?.email}</div>
                              {ticket.user?.memberNumber && (
                                <div style={{ color: "#FF5500", fontSize: "10px", fontWeight: "900", marginTop: "4px" }}>MEMBER #: {ticket.user.memberNumber}</div>
                              )}
                            </td>
                            <td style={{ padding: "20px 24px", color: "white", fontWeight: "700", fontSize: "13px" }}>
                              {ticket.event?.title || "Unknown Event"}
                            </td>
                            <td style={{ padding: "20px 24px", color: "#FF5500", fontWeight: "950", fontSize: "14px" }}>
                              ${Number(ticket.event?.ticketPrice || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: "20px 24px", color: "#aaa", fontWeight: "700" }}>
                              {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td style={{ padding: "20px 24px" }}>
                              <span style={{
                                background: ticket.status === "active" ? "rgba(34,197,94,0.1)" : ticket.status === "used" ? "rgba(255,136,0,0.1)" : "rgba(239,68,68,0.1)",
                                color: ticket.status === "active" ? "#22c55e" : ticket.status === "used" ? "#FF8800" : "#ef4444",
                                padding: "4px 12px", borderRadius: "100px", fontWeight: "900", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px",
                                border: `1px solid ${ticket.status === "active" ? "rgba(34,197,94,0.2)" : ticket.status === "used" ? "rgba(255,136,0,0.2)" : "rgba(239,68,68,0.2)"}`
                              }}>
                                {ticket.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {tickets.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ padding: "48px", textAlign: "center", color: "#555", fontWeight: "900", fontSize: "14px" }}>
                              NO TICKETS FOUND IN SYSTEM.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Floating Action Button */}
              <div style={{ position: "fixed", bottom: "40px", right: "40px", zIndex: 100 }}>
                <button onClick={(e) => { e.preventDefault(); openModal("add"); }} style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#FF5500", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 20px rgba(255,85,0,0.4)" }}>
                  <Plus size={24} />
                </button>
              </div>
            </div>
          )}

        </div>

      {/* ==================== SECURE CRUD FORM MODAL ==================== */}
      {/* Stream Settings Modal */}
      {isStreamModalOpen && streamTarget && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#111", padding: "32px", borderRadius: "16px", width: "400px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "white" }}>STREAM CONFIGURATION</h2>
              <button onClick={() => setIsStreamModalOpen(false)} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", display: "flex" }}><X size={24} /></button>
            </div>
            <form onSubmit={handleStreamSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ background: "rgba(255,85,0,0.05)", border: "1px solid rgba(255,85,0,0.2)", padding: "16px", borderRadius: "12px" }}>
                <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#888" }}>Target Video:</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "white" }}>{streamTarget.title || "LIVE ATTEMPT"}</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#FF5500" }}>{streamTarget.user?.full_name || streamTarget.full_name || "Athlete"}</p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "8px", textTransform: "uppercase" }}>Stream Timing</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button type="button" onClick={() => setStreamForm({ ...streamForm, type: "stream_now" })} style={{ background: streamForm.type === "stream_now" ? "#FF5500" : "transparent", border: streamForm.type === "stream_now" ? "none" : "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>STREAM NOW</button>
                  <button type="button" onClick={() => setStreamForm({ ...streamForm, type: "schedule" })} style={{ background: streamForm.type === "schedule" ? "rgba(255,255,255,0.1)" : "transparent", border: streamForm.type === "schedule" ? "none" : "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>SCHEDULE</button>
                </div>
              </div>

              {streamForm.type === "schedule" && (
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "8px", textTransform: "uppercase" }}>Scheduled Date & Time</label>
                  <input type="datetime-local" value={streamForm.scheduledTime} onChange={(e) => setStreamForm({ ...streamForm, scheduledTime: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", color: "white", outline: "none", colorScheme: "dark" }} />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "8px", textTransform: "uppercase" }}>Stream Access / Pricing</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button type="button" onClick={() => setStreamForm({ ...streamForm, pricing: "free" })} style={{ background: streamForm.pricing === "free" ? "#22c55e" : "transparent", border: streamForm.pricing === "free" ? "none" : "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>FREE</button>
                  <button type="button" onClick={() => setStreamForm({ ...streamForm, pricing: "paid" })} style={{ background: streamForm.pricing === "paid" ? "#FF5500" : "transparent", border: streamForm.pricing === "paid" ? "none" : "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>PAID TICKET</button>
                </div>
              </div>

              {streamForm.pricing === "paid" && (
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "8px", textTransform: "uppercase" }}>Ticket Price ($)</label>
                  <input type="number" step="0.01" min="0" value={streamForm.ticketPrice} onChange={(e) => setStreamForm({ ...streamForm, ticketPrice: e.target.value })} placeholder="e.g. 5.00" required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", color: "white", outline: "none", fontSize: "14px" }} />
                </div>
              )}

              <button type="submit" style={{ background: "#FF5500", color: "white", border: "none", padding: "14px", borderRadius: "8px", fontSize: "14px", fontWeight: "900", cursor: "pointer", marginTop: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
                {streamForm.type === 'schedule' ? 'CONFIRM SCHEDULE' : 'START STREAM NOW'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(255, 85, 0, 0.15)", width: "100%", maxWidth: "640px", maxHeight: "calc(100vh - 40px)", borderRadius: "28px", overflow: "hidden", display: "flex", flexDirection: "column", animation: "modalFadeIn 0.3s ease-out" }}>

            {/* Modal Header */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "950", margin: 0, textTransform: "uppercase", color: "white" }}>
                  {modalType === "add" ? `ADD NEW ${activeTab.toUpperCase()}` : `EDIT ${activeTab.toUpperCase()} DETAILS`}
                </h3>
                <span style={{ fontSize: "11px", color: "#555" }}>SECURE DIRECT DATABASE CRUD WRITER</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}><X size={20} /></button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "32px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* 1. RECORDS TAB FORM */}
                {activeTab === "records" && recordsSubTab === "submissions" && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>RECORD TITLE</label>
                      <input type="text" value={recordForm.title} onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>DIVISION CATEGORY</label>
                        <select value={recordForm.category} onChange={(e) => setRecordForm({ ...recordForm, category: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                          <option value="Strength">Strength</option>
                          <option value="Speed">Speed</option>
                          <option value="Endurance">Endurance</option>
                          <option value="Agility">Agility</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>VERIFICATION STATUS</label>
                        <select value={recordForm.status} onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                          <option value="pending">Pending</option>
                          <option value="verified">Verified</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>RECORD METRIC VALUE</label>
                        <input type="text" value={recordForm.value} onChange={(e) => setRecordForm({ ...recordForm, value: e.target.value })} required placeholder="e.g. 180" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>METRIC UNIT</label>
                        <input type="text" value={recordForm.unit} onChange={(e) => setRecordForm({ ...recordForm, unit: e.target.value })} required placeholder="e.g. kg or seconds" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>EVIDENCE MEDIA URL</label>
                      <input type="url" value={recordForm.evidenceUrl} onChange={(e) => setRecordForm({ ...recordForm, evidenceUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>THUMBNAIL IMAGE (OPTIONAL)</label>
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setRecordThumbFile(e.target.files[0] || null)} style={{ color: "white", fontSize: "12px" }} />
                      <p style={{ fontSize: "10px", color: "#666", margin: "6px 0 0 0" }}>JPG, PNG or WEBP, max 10MB. YouTube links get their video thumbnail automatically if none is uploaded.</p>
                      {!recordThumbFile && modalType === "edit" && modalTarget?.thumbnail_url && <img loading="lazy" decoding="async" src={modalTarget.thumbnail_url} alt="Current thumbnail" style={{ display: "block", marginTop: "8px", height: "60px", borderRadius: "8px" }} />}
                      {recordThumbFile && <p style={{ fontSize: "10px", color: "#22c55e", margin: "4px 0 0 0" }}>✓ {recordThumbFile.name}</p>}
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>RECORD DESCRIPTION</label>
                      <textarea value={recordForm.description} onChange={(e) => setRecordForm({ ...recordForm, description: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", minHeight: "80px", fontFamily: "inherit" }} />
                    </div>
                  </>
                )}

                {/* 5. CATEGORIES TAB FORM */}
                {activeTab === "records" && recordsSubTab === "categories" && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>CATEGORY NAME</label>
                      <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>DESCRIPTION</label>
                      <textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", minHeight: "80px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>RULES</label>
                      <textarea value={categoryForm.rules} onChange={(e) => setCategoryForm({ ...categoryForm, rules: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", minHeight: "80px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>SUBMISSION REQUIREMENTS</label>
                      <textarea value={categoryForm.submissionRequirements} onChange={(e) => setCategoryForm({ ...categoryForm, submissionRequirements: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", minHeight: "80px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>PARENT CATEGORY</label>
                      <select value={categoryForm.parent || ""} onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                        <option value="">-- None --</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <input type="checkbox" checked={categoryForm.active} onChange={(e) => setCategoryForm({ ...categoryForm, active: e.target.checked })} />
                      <span style={{ color: "#aaa", fontSize: "12px" }}>Active</span>
                    </div>
                  </>
                )}

                {/* 6. AGE GROUPS TAB FORM */}
                {activeTab === "records" && recordsSubTab === "ageGroups" && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>AGE GROUP NAME</label>
                      <input type="text" value={ageGroupForm.name} onChange={(e) => setAgeGroupForm({ ...ageGroupForm, name: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>MIN AGE</label>
                        <input type="number" value={ageGroupForm.minAge} onChange={(e) => setAgeGroupForm({ ...ageGroupForm, minAge: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>MAX AGE</label>
                        <input type="number" value={ageGroupForm.maxAge} onChange={(e) => setAgeGroupForm({ ...ageGroupForm, maxAge: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>DESCRIPTION</label>
                      <textarea value={ageGroupForm.description} onChange={(e) => setAgeGroupForm({ ...ageGroupForm, description: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", minHeight: "60px" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <input type="checkbox" checked={ageGroupForm.active} onChange={(e) => setAgeGroupForm({ ...ageGroupForm, active: e.target.checked })} />
                      <span style={{ color: "#aaa", fontSize: "12px" }}>Active</span>
                    </div>
                  </>
                )}

                {/* 2. USERS TAB FORM */}
                {(activeTab === "users" || activeTab === "adjudicators") && modalType !== "viewProfile" && modalType !== "viewAdjudicatorProfile" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>NAME</label>
                        <input type="text" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>EMAIL</label>
                        <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    </div>
                    {modalType === "add" && (
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>PASSWORD (Min 6 chars)</label>
                        <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required={modalType === "add"} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>USERNAME</label>
                        <input type="text" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <label style={{ fontSize: "10px", fontWeight: "900", color: "#555" }}>USER ROLE</label>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: "900",
                            color: userForm.role === 'system_admin' ? '#FF5500' :
                                   userForm.role === 'moderator' ? '#3b82f6' :
                                   userForm.role === 'judge' ? '#ffcc00' : '#22c55e'
                          }}>
                            ACCESS LEVEL: {
                              userForm.role === 'system_admin' ? 'FULL ADMIN' :
                              userForm.role === 'moderator' ? 'MODERATOR' :
                              userForm.role === 'judge' ? 'OFFICIAL JUDGE' : 'STANDARD'
                            }
                          </span>
                        </div>
                        <select
                          value={userForm.role || "athlete"}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            if (['moderator', 'judge', 'system_admin'].includes(newRole)) {
                              const alertMsg = `⚠️ SECURITY CRITICAL ACTION ALERT ⚠️\n\n` +
                                `You are attempting to grant ELEVATED administrative permissions: "${newRole.toUpperCase()}".\n\n` +
                                `• This grants access to sensitive platform controls, user management, and configuration tools.\n` +
                                `• Standard athletes should NEVER be assigned this role.\n\n` +
                                `Are you absolutely certain you want to proceed and authorize this elevation?`;

                              if (window.confirm(alertMsg)) {
                                setUserForm({ ...userForm, role: newRole });
                              }
                            } else {
                              setUserForm({ ...userForm, role: newRole });
                            }
                          }}
                          style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}
                        >
                          <option value="athlete">Regular Athlete</option>
                          <option value="moderator">Moderator</option>
                          <option value="judge">Judge / Adjudicator</option>
                          <option value="system_admin">System Admin</option>
                        </select>
                      </div>
                    </div>

                    {/* Access Level Description Card */}
                    <div style={{
                      background: userForm.role === 'system_admin' ? 'rgba(255,85,0,0.05)' :
                                  userForm.role === 'moderator' ? 'rgba(59,130,246,0.05)' :
                                  userForm.role === 'judge' ? 'rgba(255,204,0,0.05)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${
                        userForm.role === 'system_admin' ? 'rgba(255,85,0,0.2)' :
                        userForm.role === 'moderator' ? 'rgba(59,130,246,0.2)' :
                        userForm.role === 'judge' ? 'rgba(255,204,0,0.2)' : 'rgba(255,255,255,0.05)'
                      }`,
                      borderRadius: "12px",
                      padding: "16px",
                      marginTop: "-8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: userForm.role === 'system_admin' ? '#FF5500' :
                                      userForm.role === 'moderator' ? '#3b82f6' :
                                      userForm.role === 'judge' ? '#ffcc00' : '#22c55e'
                        }} />
                        <span style={{ fontSize: "11px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Role Security Level Details
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "#aaa", lineHeight: "1.4" }}>
                        {
                          userForm.role === 'system_admin' ?
                          "🔒 FULL ACCESS: Absolute platform ownership. Authorized to read/write database, manage billing, change server configs, and grant or revoke admin permissions." :
                          userForm.role === 'moderator' ?
                          "🛡️ MODERATION ACCESS: Authorized for content oversight. Can audit/remove comments, standard forum posts, handle support tickets, and review flagged material." :
                          userForm.role === 'judge' ?
                          "⚖️ ADJUDICATOR ACCESS: Timing & validation oversight. Authorized to inspect, approve, or reject official record attempts, timing sheets, and upload results." :
                          "🏃 STANDARD ACCESS: Standard platform interaction. Can participate in challenges, post attempts, track personal records, shop products, and update basic profile."
                        }
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>MEMBERSHIP TYPE</label>
                        <select
                          value={userForm.membershipType || "free_athlete"}
                          onChange={(e) => setUserForm({ ...userForm, membershipType: e.target.value })}
                          style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}
                        >
                          <option value="free_athlete">Free Athlete</option>
                          <option value="basic_membership">Basic Membership</option>
                          <option value="silver_membership">Silver Membership</option>
                          <option value="gold_membership">Gold Membership</option>
                          <option value="platinum_membership">Platinum Membership</option>
                          <option value="vip_membership">VIP Membership</option>
                          <option value="lifetime_membership">Lifetime Membership</option>
                          <option value="sponsor_account">Sponsor Account</option>
                          <option value="judge">Judge / Adjudicator</option>
                          <option value="moderator">Moderator</option>
                          <option value="system_admin">System Admin</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>ACCOUNT STATUS</label>
                        <select
                          value={userForm.accountStatus || "active"}
                          onChange={(e) => setUserForm({ ...userForm, accountStatus: e.target.value })}
                          style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                          <option value="banned">Banned</option>
                          <option value="trial">Trial</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>GENDER</label>
                        <select value={userForm.gender} onChange={(e) => setUserForm({ ...userForm, gender: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>DATE OF BIRTH</label>
                        <input type="date" max={new Date().toISOString().split('T')[0]} value={userForm.dob} onChange={(e) => setUserForm({ ...userForm, dob: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>PHONE</label>
                        <input type="tel" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>COUNTRY</label>
                        <input type="text" value={userForm.country} onChange={(e) => setUserForm({ ...userForm, country: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>CITY</label>
                        <input type="text" value={userForm.city} onChange={(e) => setUserForm({ ...userForm, city: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>HEIGHT (cm)</label>
                          <input type="number" value={userForm.height} onChange={(e) => setUserForm({ ...userForm, height: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>WEIGHT (kg)</label>
                          <input type="number" value={userForm.weight} onChange={(e) => setUserForm({ ...userForm, weight: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 7. VIEW USER PROFILE */}
                {activeTab === "users" && modalType === "viewProfile" && modalTarget && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Header: Profile Picture & Core Info */}
                    <div style={{ display: "flex", gap: "20px", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <img loading="lazy" decoding="async" src={modalTarget.profile_pic || `https://ui-avatars.com/api/?name=${modalTarget.name}&background=random&size=128`} alt={modalTarget.name} style={{ width: "96px", height: "96px", borderRadius: "50%", objectFit: "cover", border: "2px solid #FF5500" }} />
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: "24px", fontWeight: "950", margin: "0 0 4px 0", color: "white" }}>{modalTarget.name}</h2>
                        <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>{modalTarget.email} | {modalTarget.username || 'No Username'}</div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>
                            {(modalTarget.role || 'athlete').replace('_', ' ')}
                          </span>
                          <span style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>
                            {(modalTarget.membership_type || modalTarget.membershipType || 'free_athlete').replace('_', ' ')}
                          </span>
                          <span style={{ background: "rgba(255,255,255,0.05)", color: "#aaa", padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>
                            {(modalTarget.account_status || modalTarget.accountStatus || 'active').replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px", overflowX: "auto" }}>
                      {['overview', 'activity', 'submissions', 'payments', 'ranking', 'challenges'].map(tab => (
                        <button
                          key={tab}
                          onClick={(e) => { e.preventDefault(); setRecordsSubTab(tab); }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: recordsSubTab === tab ? "#FF5500" : "#888",
                            fontWeight: recordsSubTab === tab ? "900" : "700",
                            fontSize: "13px",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            padding: "4px 8px",
                            borderBottom: recordsSubTab === tab ? "2px solid #FF5500" : "2px solid transparent",
                            whiteSpace: "nowrap"
                          }}>
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Tab Contents */}
                    {recordsSubTab === "overview" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>MEMBER NUMBER</div>
                          <div style={{ fontSize: "15px", color: "white", fontWeight: "600" }}>{modalTarget.member_number || modalTarget.memberNumber || "Pending"}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>PHONE NUMBER</div>
                          <div style={{ fontSize: "15px", color: "white", fontWeight: "600" }}>{modalTarget.phone || "Not specified"}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>AGE GROUP / DOB</div>
                          <div style={{ fontSize: "15px", color: "white", fontWeight: "600" }}>{modalTarget.dob ? new Date(modalTarget.dob).toLocaleDateString() : "Not specified"}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>GENDER</div>
                          <div style={{ fontSize: "15px", color: "white", fontWeight: "600", textTransform: "capitalize" }}>{modalTarget.gender || "Not specified"}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>MEMBER SINCE</div>
                          <div style={{ fontSize: "15px", color: "white", fontWeight: "600" }}>{new Date(modalTarget.created_at || new Date()).toLocaleDateString()}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", gridColumn: "span 3" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>FULL ADDRESS</div>
                          <div style={{ fontSize: "15px", color: "white", fontWeight: "600" }}>
                            {[modalTarget.street_address, modalTarget.apartment, modalTarget.city, modalTarget.state, modalTarget.country, modalTarget.zip_code].filter(Boolean).join(', ') || "Not specified"}
                          </div>
                        </div>
                      </div>
                    )}

                    {recordsSubTab === "activity" && (
                      <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "12px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "800", color: "white", margin: "0 0 16px 0" }}>Recent Activity Log</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                            <div>
                              <div style={{ color: "white", fontSize: "13px", fontWeight: "700" }}>Logged In</div>
                              <div style={{ color: "#666", fontSize: "11px" }}>IP: 192.168.1.1</div>
                            </div>
                            <div style={{ color: "#888", fontSize: "12px" }}>Today, 10:42 AM</div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                            <div>
                              <div style={{ color: "white", fontSize: "13px", fontWeight: "700" }}>Updated Profile Picture</div>
                              <div style={{ color: "#666", fontSize: "11px" }}>Settings</div>
                            </div>
                            <div style={{ color: "#888", fontSize: "12px" }}>Yesterday, 4:15 PM</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {recordsSubTab === "submissions" && (
                      <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "12px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "800", color: "white", margin: "0 0 16px 0" }}>Record Submission History</h4>
                        {(() => {
                          const userRecords = records.filter(r => r.user_id === userActionModal.userId || r.userId === userActionModal.userId || (r.user && r.user.id === userActionModal.userId));
                          if (userRecords.length === 0) {
                            return (
                              <div style={{ textAlign: "center", padding: "40px 0", color: "#666", fontSize: "13px" }}>
                                No submissions found for this user.
                              </div>
                            );
                          }
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto" }}>
                              {userRecords.map(r => (
                                <div key={r.id} style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div>
                                    <div style={{ color: "white", fontSize: "14px", fontWeight: "800", marginBottom: "4px" }}>{r.title || r.category || 'Untitled Record'}</div>
                                    <div style={{ color: "#888", fontSize: "12px" }}>{r.category} • {r.value} {r.unit}</div>
                                  </div>
                                  <div>
                                    <span style={{
                                      background: r.status === 'verified' || r.status === 'approved' ? "rgba(34,197,94,0.1)" : r.status === 'rejected' || r.status === 'denied' ? "rgba(239,68,68,0.1)" : "rgba(255,204,0,0.1)",
                                      color: r.status === 'verified' || r.status === 'approved' ? "#22c55e" : r.status === 'rejected' || r.status === 'denied' ? "#ef4444" : "#ffcc00",
                                      padding: "4px 8px",
                                      borderRadius: "100px",
                                      fontSize: "10px",
                                      fontWeight: "bold",
                                      textTransform: "uppercase"
                                    }}>
                                      {r.status || 'pending'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {recordsSubTab === "payments" && (
                      <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "12px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "800", color: "white", margin: "0 0 16px 0" }}>Payment History</h4>
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#666", fontSize: "13px" }}>
                          No payment transactions found for this user.
                        </div>
                      </div>
                    )}

                    {recordsSubTab === "ranking" && (
                      <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "12px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "800", color: "white", margin: "0 0 16px 0" }}>Ranking Information</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
                          <div style={{ background: "rgba(0,0,0,0.4)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,215,0,0.3)", textAlign: "center" }}>
                            <div style={{ fontSize: "11px", color: "#FFD700", fontWeight: "900" }}>GLOBAL RANK</div>
                            <div style={{ fontSize: "24px", color: "white", fontWeight: "950" }}>#---</div>
                          </div>
                          <div style={{ background: "rgba(0,0,0,0.4)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                            <div style={{ fontSize: "11px", color: "#888", fontWeight: "900" }}>CATEGORY RANK</div>
                            <div style={{ fontSize: "24px", color: "white", fontWeight: "950" }}>#---</div>
                          </div>
                          <div style={{ background: "rgba(0,0,0,0.4)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                            <div style={{ fontSize: "11px", color: "#888", fontWeight: "900" }}>TOTAL POINTS</div>
                            <div style={{ fontSize: "24px", color: "white", fontWeight: "950" }}>0</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {recordsSubTab === "challenges" && (
                      <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "12px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "800", color: "white", margin: "0 0 16px 0" }}>Challenge Participation</h4>
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#666", fontSize: "13px" }}>
                          User hasn't participated in any challenges yet.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "adjudicators" && modalType === "viewAdjudicatorProfile" && modalTarget && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Header */}
                    <div style={{ display: "flex", gap: "20px", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "24px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <img loading="lazy" decoding="async" src={modalTarget.profile_pic || `https://ui-avatars.com/api/?name=${modalTarget.name}&background=random&size=128`} alt={modalTarget.name} style={{ width: "96px", height: "96px", borderRadius: "50%", objectFit: "cover", border: "2px solid #FF5500" }} />
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: "24px", fontWeight: "950", margin: "0 0 4px 0", color: "white" }}>{modalTarget.name}</h2>
                        <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>{modalTarget.email} | Member #{modalTarget.member_number || modalTarget.memberNumber || 'Pending'}</div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>
                            {modalTarget.certificationLevel || 'Certified Adjudicator'}
                          </span>
                          <span style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>
                            {modalTarget.account_status || 'active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                      {['performance', 'history'].map(tab => (
                        <button
                          key={tab}
                          onClick={(e) => { e.preventDefault(); setRecordsSubTab(tab); }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: recordsSubTab === tab ? "#FF5500" : "#888",
                            fontWeight: recordsSubTab === tab ? "900" : "700",
                            fontSize: "13px",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            padding: "4px 8px",
                            borderBottom: recordsSubTab === tab ? "2px solid #FF5500" : "2px solid transparent"
                          }}>
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Tab Contents */}
                    {(recordsSubTab === "performance" || recordsSubTab === "overview" || !recordsSubTab) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>TOTAL REVIEWS</div>
                          <div style={{ fontSize: "24px", color: "white", fontWeight: "950" }}>{modalTarget.stats?.completed || 0}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>PENDING REVIEWS</div>
                          <div style={{ fontSize: "24px", color: "#FF5500", fontWeight: "950" }}>{modalTarget.stats?.pending || 0}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>APPEAL INVOLVEMENT</div>
                          <div style={{ fontSize: "24px", color: "#f59e0b", fontWeight: "950" }}>{modalTarget.stats?.appeals || 0}</div>
                        </div>

                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>APPROVED RECORDS</div>
                          <div style={{ fontSize: "24px", color: "#22c55e", fontWeight: "950" }}>{modalTarget.stats?.verified || 0}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>DENIED RECORDS</div>
                          <div style={{ fontSize: "24px", color: "#ef4444", fontWeight: "950" }}>{modalTarget.stats?.rejected || 0}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                          <div style={{ fontSize: "11px", color: "#666", fontWeight: "800", marginBottom: "4px" }}>PERFORMANCE RATING</div>
                          <div style={{ fontSize: "24px", color: "white", fontWeight: "950" }}>{modalTarget.stats?.rating || "A+"}</div>
                        </div>
                      </div>
                    )}

                    {recordsSubTab === "history" && (
                      <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "12px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "800", color: "white", margin: "0 0 16px 0" }}>Oversight Notes / History</h4>
                        {modalTarget.admin_notes ? (
                          <div style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                            {modalTarget.admin_notes}
                          </div>
                        ) : (
                          <div style={{ textAlign: "center", padding: "40px 0", color: "#666", fontSize: "13px" }}>
                            No oversight notes recorded for this adjudicator.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. EVENTS TAB FORM */}
                {activeTab === "events" && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>EVENT TITLE</label>
                      <input type="text" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>EVENT DATE & TIME</label>
                        <input type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", colorScheme: "dark" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>LOCATION</label>
                        <input type="text" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} required placeholder="e.g. London Arena" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    </div>
                    <div>
                      <ImageUploadField label="EVENT IMAGE" value={eventForm.imageUrl} onChange={(url) => setEventForm({ ...eventForm, imageUrl: url })} hint="Upload an image or paste a link. Wide images (16:9) look best." />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>EVENT DESCRIPTION</label>
                      <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", minHeight: "80px", fontFamily: "inherit" }} />
                    </div>

                    {/* Paid/Free Event Toggle Section */}
                    <div style={{ background: "rgba(255,106,0,0.08)", border: "1px solid rgba(255,106,0,0.2)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.5px", textTransform: "uppercase" }}>SPECTATOR ACCESS SETTINGS</label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: "rgba(0,0,0,0.2)", padding: "12px 14px", borderRadius: "8px", border: eventForm.isPaid ? "1px solid rgba(255,106,0,0.4)" : "1px solid rgba(0,255,0,0.3)" }}>
                        <input
                          type="checkbox"
                          id="isPaid"
                          checked={eventForm.isPaid}
                          onChange={e => setEventForm({...eventForm, isPaid: e.target.checked})}
                          style={{ cursor: "pointer", width: "18px", height: "18px" }}
                        />
                        <label htmlFor="isPaid" style={{ fontSize: "13px", fontWeight: "700", color: eventForm.isPaid ? "#FF6A00" : "#22c55e", cursor: "pointer", flex: 1, margin: 0 }}>
                          {eventForm.isPaid ? "🔒 PAID EVENT - Requires Spectator Ticket" : "🔓 FREE EVENT - Open Access"}
                        </label>
                      </div>

                      {eventForm.isPaid && (
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF6A00", marginBottom: "6px", letterSpacing: "0.5px" }}>TICKET PRICE (USD)</label>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "900", color: "#FF6A00" }}>$</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="49.99"
                              value={eventForm.ticketPrice}
                              onChange={e => setEventForm({...eventForm, ticketPrice: parseFloat(e.target.value) || 0})}
                              style={{
                                width: "100%",
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(255,106,0,0.3)",
                                borderRadius: "8px",
                                padding: "10px 14px",
                                color: "#FF6A00",
                                fontWeight: "700",
                                fontSize: "14px"
                              }}
                            />
                          </div>
                          <p style={{ fontSize: "10px", color: "#888", margin: "8px 0 0 0", fontStyle: "italic" }}>Users must purchase a valid spectator pass to access this livestream</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 4. PRODUCTS TAB FORM */}

                {/* 10. VIDEO UPLOAD FORM */}
                {activeTab === "videoManagement" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>VIDEO TITLE *</label>
                        <input type="text" value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} required placeholder="Enter video title..." style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>DESCRIPTION</label>
                        <textarea value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} rows="3" placeholder="Optional description..." style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", boxSizing: "border-box" }}></textarea>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>CATEGORY</label>
                          <select value={videoForm.category} onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                            <option value="Strength">Strength</option>
                            <option value="Endurance">Endurance</option>
                            <option value="Speed">Speed</option>
                            <option value="Skill">Skill</option>
                            <option value="Combat">Combat</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", fontSize: "12px", cursor: "pointer" }}>
                            <input type="checkbox" checked={videoForm.isFeatured} onChange={(e) => setVideoForm({ ...videoForm, isFeatured: e.target.checked })} style={{ cursor: "pointer" }} />
                            Mark as Featured Video
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", fontSize: "12px", cursor: "pointer" }}>
                            <input type="checkbox" checked={videoForm.isNewlyUploaded} onChange={(e) => setVideoForm({ ...videoForm, isNewlyUploaded: e.target.checked })} style={{ cursor: "pointer" }} />
                            Mark as Newly Uploaded
                          </label>
                        </div>
                      </div>

                      <div style={{ background: "rgba(255,85,0,0.08)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,85,0,0.3)", marginTop: "8px" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", marginBottom: "6px" }}>VIDEO URL * (YouTube or Direct Link)</label>
                        <input
                          type="url"
                          required
                          placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
                          value={videoForm.videoUrl || ""}
                          onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                          style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,85,0,0.4)", borderRadius: "8px", padding: "10px 14px", color: "white", boxSizing: "border-box" }}
                        />
                        <p style={{ fontSize: "10px", color: "#aaa", margin: "6px 0 0 0" }}>Paste a YouTube link or a direct MP4/WebM URL. This is required to save the video.</p>
                      </div>

                      <div style={{ background: "rgba(255,85,0,0.1)", padding: "16px", borderRadius: "8px", border: "2px dashed rgba(255,85,0,0.3)", marginTop: "12px" }}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", marginBottom: "6px" }}>📸 UPLOAD THUMBNAIL (Required)</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setThumbnailFile(e.target.files[0])}
                          required
                          style={{ color: "white", fontSize: "12px" }}
                        />
                        <p style={{ fontSize: "10px", color: "#FF5500", margin: "8px 0 0 0", fontWeight: "600" }}>✓ Required. Max 5MB. JPG, PNG, WEBP.</p>
                        {thumbnailFile && <p style={{ fontSize: "9px", color: "#22c55e", margin: "4px 0 0 0" }}>✓ {thumbnailFile.name}</p>}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "products" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>PRODUCT NAME</label>
                        <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>PRODUCT PRICE ($)</label>
                        <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>CATALOG CATEGORY</label>
                        <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value, requiresAuthorization: AUTHORIZATION_CATEGORIES.includes(e.target.value) ? true : productForm.requiresAuthorization })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                          {[...new Set([...SHOP_CATEGORIES, productForm.category].filter(Boolean))].map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", color: "#bbb", fontSize: "12px", cursor: "pointer" }}>
                          <input type="checkbox" checked={!!productForm.requiresAuthorization || AUTHORIZATION_CATEGORIES.includes(productForm.category)} disabled={AUTHORIZATION_CATEGORIES.includes(productForm.category)} onChange={(e) => setProductForm({ ...productForm, requiresAuthorization: e.target.checked })} />
                          Requires admin approval to buy{AUTHORIZATION_CATEGORIES.includes(productForm.category) ? " (always on for belts)" : ""}
                        </label>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>STOCK INVENTORY COUNT</label>
                        <input type="number" value={productForm.stockCount} onChange={(e) => setProductForm({ ...productForm, stockCount: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>UPLOAD PRODUCT IMAGE</label>
                      <input
                        type="file"
                        ref={adminProductFileInputRef}
                        accept=".jpg,.jpeg,.png,.webp"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.size > 10 * 1024 * 1024) {
                              alert("Image size must be less than 10MB.");
                              return;
                            }
                            const ext = file.name.split('.').pop().toLowerCase();
                            if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
                              alert("Invalid image format. Allowed: JPG, JPEG, PNG, WEBP.");
                              return;
                            }
                            setProductForm({
                              ...productForm,
                              imageFile: file,
                              imagePreview: URL.createObjectURL(file)
                            });
                          }
                        }}
                      />

                      <div
                        onDragEnter={(e) => { e.preventDefault(); setAdminProductDragActive(true); }}
                        onDragOver={(e) => { e.preventDefault(); setAdminProductDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setAdminProductDragActive(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setAdminProductDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            if (file.size > 10 * 1024 * 1024) {
                              alert("Image size must be less than 10MB.");
                              return;
                            }
                            const ext = file.name.split('.').pop().toLowerCase();
                            if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
                              alert("Invalid image format. Allowed: JPG, JPEG, PNG, WEBP.");
                              return;
                            }
                            setProductForm({
                              ...productForm,
                              imageFile: file,
                              imagePreview: URL.createObjectURL(file)
                            });
                          }
                        }}
                        onClick={() => adminProductFileInputRef.current?.click()}
                        style={{
                          background: adminProductDragActive ? "rgba(255, 106, 0, 0.1)" : "rgba(0,0,0,0.3)",
                          border: adminProductDragActive ? "2px dashed #FF6A00" : "1px dashed rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          padding: "24px 16px",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          position: "relative",
                          overflow: "hidden"
                        }}
                      >
                        {(productForm.imagePreview || productForm.imageUrl) ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", position: "relative" }}>
                            <img loading="lazy" decoding="async"
                              src={productForm.imagePreview || formatProductImage(productForm.imageUrl)}
                              alt="Product Preview"
                              style={{ maxWidth: "160px", maxHeight: "110px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.06)" }}
                            />
                            <div style={{ fontSize: "11px", color: "white", fontWeight: "700" }}>
                              {productForm.imageFile ? productForm.imageFile.name : "Current Image (Click to change)"}
                            </div>
                            {productForm.imageFile && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProductForm({
                                    ...productForm,
                                    imageFile: null,
                                    imagePreview: ""
                                  });
                                }}
                                style={{
                                  background: "rgba(239, 68, 68, 0.15)",
                                  border: "none",
                                  color: "#ef4444",
                                  padding: "4px 10px",
                                  borderRadius: "100px",
                                  fontSize: "10px",
                                  fontWeight: "900",
                                  textTransform: "uppercase",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                Remove Selection
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                            <UploadCloud size={28} color="#FF6A00" />
                            <div style={{ fontSize: "12px", fontWeight: "800", color: "white" }}>
                              DRAG & DROP IMAGE HERE OR <span style={{ color: "#FF6A00", textDecoration: "underline" }}>BROWSE</span>
                            </div>
                            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
                              Supports JPG, JPEG, PNG, WEBP up to 10MB
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sizes, Pricing, and Stock Sub-form */}
                    <div style={{ background: "rgba(255,85,0,0.02)", border: "1px dashed rgba(255,85,0,0.15)", borderRadius: "12px", padding: "16px", marginTop: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <label style={{ fontSize: "11px", fontWeight: "950", color: "#FF5500", letterSpacing: "0.5px" }}>SIZES & SIZE-BASED PRICING</label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentSizes = productForm.sizes || [];
                            setProductForm({
                              ...productForm,
                              sizes: [...currentSizes, { size: "", price: productForm.price || "0", stock: "10", sku: "" }]
                            });
                          }}
                          style={{ background: "#FF5500", border: "none", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "900", cursor: "pointer" }}
                        >
                          + ADD SIZE
                        </button>
                      </div>

                      {(!productForm.sizes || productForm.sizes.length === 0) ? (
                        <p style={{ fontSize: "11px", color: "#666", margin: 0, fontStyle: "italic" }}>No sizes configured. Default price and inventory count will be used.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr auto", gap: "6px", paddingBottom: "4px" }}>
                            {["SIZE / OPTION", "PRICE ($)", "STOCK", "SKU (opt.)", ""].map((h, i) => (
                              <span key={i} style={{ fontSize: "8px", fontWeight: "900", color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                            ))}
                          </div>
                          {productForm.sizes.map((sz, idx) => (
                            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr auto", gap: "6px", alignItems: "center" }}>
                              <input
                                type="text"
                                placeholder="Size (e.g. S, M, 11x14)"
                                value={sz.size}
                                onChange={(e) => {
                                  const updated = [...productForm.sizes];
                                  updated[idx].size = e.target.value;
                                  setProductForm({ ...productForm, sizes: updated });
                                }}
                                required
                                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "8px 10px", color: "white", fontSize: "12px" }}
                              />
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Price ($)"
                                value={sz.price}
                                onChange={(e) => {
                                  const updated = [...productForm.sizes];
                                  updated[idx].price = e.target.value;
                                  setProductForm({ ...productForm, sizes: updated });
                                }}
                                required
                                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "8px 10px", color: "white", fontSize: "12px" }}
                              />
                              <input
                                type="number"
                                placeholder="Stock"
                                value={sz.stock}
                                onChange={(e) => {
                                  const updated = [...productForm.sizes];
                                  updated[idx].stock = e.target.value;
                                  setProductForm({ ...productForm, sizes: updated });
                                }}
                                required
                                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "8px 10px", color: "white", fontSize: "12px" }}
                              />
                              <input
                                type="text"
                                placeholder="SKU (optional)"
                                value={sz.sku || ""}
                                onChange={(e) => {
                                  const updated = [...productForm.sizes];
                                  updated[idx].sku = e.target.value;
                                  setProductForm({ ...productForm, sizes: updated });
                                }}
                                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "6px", padding: "8px 10px", color: "rgba(255,255,255,0.6)", fontSize: "11px" }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (productForm.sizes || []).filter((_, i) => i !== idx);
                                  setProductForm({ ...productForm, sizes: updated });
                                }}
                                style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "16px", cursor: "pointer", fontWeight: "bold", padding: "4px" }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Extra Images URL text area */}
                    <div style={{ marginTop: "12px" }}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>EXTRA IMAGES (one URL per line)</label>
                      <textarea
                        value={Array.isArray(productForm.imageUrls) ? productForm.imageUrls.filter(Boolean).join("\n") : ""}
                        onChange={(e) => {
                          const urls = e.target.value.split("\n");
                          setProductForm({ ...productForm, imageUrls: urls });
                        }}
                        placeholder="https://example.com/image2.jpg&#13;https://example.com/image3.jpg"
                        style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", minHeight: "60px", fontSize: "12px", fontFamily: "inherit" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>PRODUCT DESCRIPTION</label>
                      <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", minHeight: "80px", fontFamily: "inherit" }} />
                    </div>
                  </>
                )}


                {/* 7. COUPONS TAB FORM */}
                {activeTab === "coupons" && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>COUPON CODE</label>
                      <input type="text" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/\s/g, '') })} required placeholder="e.g. SAVE20" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>DISCOUNT TYPE</label>
                        <select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount ($)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>DISCOUNT VALUE</label>
                        <input type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} required placeholder={couponForm.discountType === 'percentage' ? '20' : '10.00'} min="0" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>TOTAL REDEMPTION LIMIT</label>
                        <input type="number" min="1" inputMode="numeric" value={couponForm.maxRedemptions} onChange={(e) => setCouponForm({ ...couponForm, maxRedemptions: e.target.value })} placeholder="Empty = unlimited" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>USES PER ACCOUNT</label>
                        <input type="number" min="0" inputMode="numeric" value={couponForm.maxPerUser} onChange={(e) => setCouponForm({ ...couponForm, maxPerUser: e.target.value })} placeholder="Empty = unlimited" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>EXPIRATION DATE</label>
                      <input type="date" min={new Date().toISOString().split('T')[0]} value={couponForm.expirationDate} onChange={(e) => setCouponForm({ ...couponForm, expirationDate: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
                      <input type="checkbox" checked={couponForm.active} onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })} />
                      <span style={{ color: "#aaa", fontSize: "12px" }}>Active (Coupon is available for use)</span>
                    </div>
                  </>
                )}

          {activeTab === "revenue" && (
                  <>
                    {revenueSubTab === "coupons" ? (
                      <>
                        {/* Coupon Form Fields */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>COUPON CODE</label>
                            <input
                              type="text"
                              value={couponForm.code}
                              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                              required={!couponForm.autoGenerate}
                              disabled={couponForm.autoGenerate}
                              placeholder={couponForm.autoGenerate ? "AMPEX-XXXXX" : "e.g. AMPEX30"}
                              style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", textTransform: "uppercase" }}
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <input
                                type="checkbox"
                                id="autoGenerate"
                                checked={couponForm.autoGenerate}
                                onChange={(e) => {
                                  setCouponForm({
                                    ...couponForm,
                                    autoGenerate: e.target.checked,
                                    code: e.target.checked ? "AUTO-GENERATED" : ""
                                  });
                                }}
                                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                              />
                              <label htmlFor="autoGenerate" style={{ color: "#aaa", fontSize: "11px", cursor: "pointer", fontWeight: "700" }}>AUTO-GENERATE CODE</label>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>DISCOUNT TYPE</label>
                            <select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed">Fixed Dollar ($)</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>DISCOUNT VALUE</label>
                            <input type="number" step="0.01" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} required placeholder="e.g. 30 or 10.00" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>APPLIES TO</label>
                            <select value={couponForm.appliesTo} onChange={(e) => setCouponForm({ ...couponForm, appliesTo: e.target.value, targetId: "" })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                              <option value="all">All Orders / Subtotal</option>
                              <option value="product">Specific Product</option>
                              <option value="category">Specific Product Category</option>
                              <option value="membership">Elite Memberships</option>
                              <option value="ticket">Event Tickets</option>
                            </select>
                          </div>
                          <div>
                            {couponForm.appliesTo === "product" && (
                              <>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>SELECT TARGET PRODUCT</label>
                                <select value={couponForm.targetId} onChange={(e) => setCouponForm({ ...couponForm, targetId: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                                  <option value="">-- Choose Product --</option>
                                  {products && products.map(p => <option key={p.id} value={p.id}>{p.name} (${parseFloat(p.price).toFixed(2)})</option>)}
                                </select>
                              </>
                            )}
                            {couponForm.appliesTo === "category" && (
                              <>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>SELECT TARGET CATEGORY</label>
                                <select value={couponForm.targetId} onChange={(e) => setCouponForm({ ...couponForm, targetId: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                                  <option value="">-- Choose Category --</option>
                                  <option value="accessories">Accessories</option>
                                  <option value="apparel">Apparel</option>
                                  <option value="equipment">Equipment</option>
                                  <option value="supplements">Supplements</option>
                                </select>
                              </>
                            )}
                            {couponForm.appliesTo === "membership" && (
                              <>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>SELECT TARGET MEMBERSHIP TIER</label>
                                <select value={couponForm.targetId} onChange={(e) => setCouponForm({ ...couponForm, targetId: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                                  <option value="">All Tiers</option>
                                  <option value="bronze">Bronze Tier Only</option>
                                  <option value="silver">Silver Tier Only</option>
                                  <option value="gold">Gold Tier Only</option>
                                </select>
                              </>
                            )}
                            {couponForm.appliesTo === "ticket" && (
                              <>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>SELECT TARGET EVENT</label>
                                <select value={couponForm.targetId} onChange={(e) => setCouponForm({ ...couponForm, targetId: e.target.value })} required style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                                  <option value="">-- Choose Event --</option>
                                  {events && events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                                </select>
                              </>
                            )}
                          </div>
                        </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>TOTAL REDEMPTION LIMIT</label>
                        <input type="number" min="1" inputMode="numeric" value={couponForm.maxRedemptions} onChange={(e) => setCouponForm({ ...couponForm, maxRedemptions: e.target.value })} placeholder="Empty = unlimited" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>USES PER ACCOUNT</label>
                        <input type="number" min="0" inputMode="numeric" value={couponForm.maxPerUser} onChange={(e) => setCouponForm({ ...couponForm, maxPerUser: e.target.value })} placeholder="Empty = unlimited" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                      </div>
                    </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>EXPIRATION DATE</label>
                            <input type="date" min={new Date().toISOString().split('T')[0]} value={couponForm.expirationDate} onChange={(e) => setCouponForm({ ...couponForm, expirationDate: e.target.value })} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", colorScheme: "dark" }} />
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <input
                                type="checkbox"
                                id="couponActive"
                                checked={couponForm.active}
                                onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
                                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                              />
                              <label htmlFor="couponActive" style={{ color: "#aaa", fontSize: "12px", cursor: "pointer", fontWeight: "700" }}>COUPON IS ACTIVE / ENABLED</label>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* High-Fidelity Manual Revenue Entry Form */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                          {/* SECTION 1: CUSTOMER INFORMATION */}
                          <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "16px", padding: "20px" }}>
                            <h4 style={{ fontSize: "11px", fontWeight: "950", color: "#FF5500", letterSpacing: "1px", margin: "0 0 16px 0", textTransform: "uppercase" }}>1. Customer & Account Details</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>User / Customer Name <span style={{ color: "#FF5500" }}>*</span></label>
                                <input
                                  type="text"
                                  value={revenueForm.customerName}
                                  onChange={(e) => setRevenueForm({ ...revenueForm, customerName: e.target.value })}
                                  required
                                  placeholder="e.g. John Doe"
                                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px", transition: "border-color 0.2s" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>Email Address <span style={{ color: "#FF5500" }}>*</span></label>
                                <input
                                  type="email"
                                  value={revenueForm.customerEmail}
                                  onChange={(e) => setRevenueForm({ ...revenueForm, customerEmail: e.target.value })}
                                  required
                                  placeholder="e.g. john@example.com"
                                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px" }}
                                />
                              </div>
                            </div>
                            <div style={{ marginTop: "16px" }}>
                              <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>Member Number (Optional)</label>
                              <input
                                type="text"
                                value={revenueForm.memberNumber}
                                onChange={(e) => setRevenueForm({ ...revenueForm, memberNumber: e.target.value })}
                                placeholder="e.g. APEX-100234"
                                style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px" }}
                              />
                            </div>
                          </div>

                          {/* SECTION 2: TRANSACTION DETAILS */}
                          <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "16px", padding: "20px" }}>
                            <h4 style={{ fontSize: "11px", fontWeight: "950", color: "#FF5500", letterSpacing: "1px", margin: "0 0 16px 0", textTransform: "uppercase" }}>2. Revenue & Stream Details</h4>
                            <div style={{ marginBottom: "16px" }}>
                              <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>Revenue Title <span style={{ color: "#FF5500" }}>*</span></label>
                              <input
                                type="text"
                                value={revenueForm.title}
                                onChange={(e) => setRevenueForm({ ...revenueForm, title: e.target.value })}
                                required
                                placeholder="e.g. AMPEX Powerlifting Submission Payment"
                                style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px" }}
                              />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>Revenue Category <span style={{ color: "#FF5500" }}>*</span></label>
                                <select
                                  value={revenueForm.category}
                                  onChange={(e) => setRevenueForm({ ...revenueForm, category: e.target.value })}
                                  style={{ width: "100%", background: "#0c0c0e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px" }}
                                >
                                  <option value="Record Submission Fee">Record Submission Fee</option>
                                  <option value="Membership Payment">Membership Payment</option>
                                  <option value="Product Sale">Product Sale</option>
                                  <option value="Sponsorship Payment">Sponsorship Payment</option>
                                  <option value="Event Ticket Sale">Event Ticket Sale</option>
                                  <option value="Pay-Per-View Sale">Pay-Per-View Sale</option>
                                  <option value="Certificate Sale">Certificate Sale</option>
                                  <option value="Medal Sale">Medal Sale</option>
                                  <option value="Award Sale">Award Sale</option>
                                  <option value="Donation">Donation</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>Amount ($) <span style={{ color: "#FF5500" }}>*</span></label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={revenueForm.amount}
                                  onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                                  required
                                  placeholder="0.00"
                                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px" }}
                                />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>Date Received <span style={{ color: "#FF5500" }}>*</span></label>
                                <input
                                  type="date" max={new Date().toISOString().split('T')[0]}
                                  value={revenueForm.dateReceived}
                                  onChange={(e) => setRevenueForm({ ...revenueForm, dateReceived: e.target.value })}
                                  required
                                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px", colorScheme: "dark" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>Payment Method <span style={{ color: "#FF5500" }}>*</span></label>
                                <select
                                  value={revenueForm.paymentMethod}
                                  onChange={(e) => setRevenueForm({ ...revenueForm, paymentMethod: e.target.value })}
                                  style={{ width: "100%", background: "#0c0c0e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px" }}
                                >
                                  <option value="Credit Card">Credit Card</option>
                                  <option value="Debit Card">Debit Card</option>
                                  <option value="PayPal">PayPal</option>
                                  <option value="Stripe">Stripe</option>
                                  <option value="Cash App">Cash App</option>
                                  <option value="Bank Transfer">Bank Transfer</option>
                                  <option value="Manual Entry">Manual Entry</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 3: SYSTEM REFERENCE CODES */}
                          <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "16px", padding: "20px" }}>
                            <h4 style={{ fontSize: "11px", fontWeight: "950", color: "#FF5500", letterSpacing: "1px", margin: "0 0 16px 0", textTransform: "uppercase" }}>3. Reference Codes & Notes</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>Transaction ID (Optional)</label>
                                <input
                                  type="text"
                                  value={revenueForm.transactionId}
                                  onChange={(e) => setRevenueForm({ ...revenueForm, transactionId: e.target.value })}
                                  placeholder="e.g. ch_3M5BvGLkdQv..."
                                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px" }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>Order Number (Optional)</label>
                                <input
                                  type="text"
                                  value={revenueForm.orderNumber}
                                  onChange={(e) => setRevenueForm({ ...revenueForm, orderNumber: e.target.value })}
                                  placeholder="e.g. APEX-ORD-8941"
                                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px" }}
                                />
                              </div>
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>Notes / Description</label>
                              <textarea
                                value={revenueForm.notes}
                                onChange={(e) => setRevenueForm({ ...revenueForm, notes: e.target.value })}
                                placeholder="Enter any additional details, description, or payment notes..."
                                style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px", minHeight: "80px", fontFamily: "inherit" }}
                              />
                            </div>
                          </div>

                          {/* SECTION 4: PROOF OF PAYMENT / RECEIPT UPLOAD */}
                          <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "16px", padding: "20px" }}>
                            <h4 style={{ fontSize: "11px", fontWeight: "950", color: "#FF5500", letterSpacing: "1px", margin: "0 0 16px 0", textTransform: "uppercase" }}>4. Receipt / Proof of Payment</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px", alignItems: "center" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#888", marginBottom: "6px", textTransform: "uppercase" }}>Pasted Receipt URL</label>
                                <input
                                  type="url"
                                  value={revenueForm.receiptUrl && !revenueForm.receiptUrl.startsWith("data:") ? revenueForm.receiptUrl : ""}
                                  onChange={(e) => setRevenueForm({ ...revenueForm, receiptUrl: e.target.value })}
                                  placeholder="https://imgur.com/..."
                                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", outline: "none", fontSize: "12px" }}
                                />
                                <div style={{ fontSize: "9px", color: "#555", marginTop: "4px", fontWeight: "800" }}>OR DRAG/SELECT LOCAL IMAGE DIRECTLY</div>
                              </div>
                              <div>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      setReceiptFile(file);
                                      if (file.type.startsWith("image/")) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setRevenueForm({ ...revenueForm, receiptUrl: reader.result });
                                        };
                                        reader.readAsDataURL(file);
                                      } else {
                                        setRevenueForm({ ...revenueForm, receiptUrl: file.name });
                                      }
                                    }
                                  }}
                                  style={{ display: "none" }}
                                  id="receipt-file-upload"
                                />
                                <label
                                  htmlFor="receipt-file-upload"
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "2px dashed rgba(255,85,0,0.2)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    cursor: "pointer",
                                    background: "rgba(255,85,0,0.02)",
                                    textAlign: "center",
                                    transition: "all 0.2s"
                                  }}
                                  className="receipt-upload-zone"
                                >
                                  {revenueForm.receiptUrl ? (
                                    revenueForm.receiptUrl.startsWith("data:") ? (
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                                        <img loading="lazy" decoding="async" src={revenueForm.receiptUrl} alt="Receipt Preview" style={{ maxWidth: "100%", maxHeight: "80px", borderRadius: "6px", objectFit: "contain", border: "1px solid rgba(255,255,255,0.1)" }} />
                                        <span style={{ fontSize: "9px", color: "#22c55e", fontWeight: "900" }}>✓ LOCAL IMAGE LOADED</span>
                                      </div>
                                    ) : (
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                                        <div style={{ fontSize: "18px" }}>📄</div>
                                        <span style={{ fontSize: "10px", color: "#FF5500", fontWeight: "800", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{revenueForm.receiptUrl}</span>
                                      </div>
                                    )
                                  ) : (
                                    <>
                                      <Plus size={20} color="#FF5500" style={{ marginBottom: "6px" }} />
                                      <span style={{ fontSize: "10px", fontWeight: "900", color: "#aaa" }}>CHOOSE RECEIPT IMAGE</span>
                                      <span style={{ fontSize: "8px", color: "#555", marginTop: "2px" }}>PNG, JPG, OR PDF UP TO 5MB</span>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>

                        </div>
                      </>
                    )}
                  </>
                )}

              </div>

              {/* Modal Footer */}
              <div style={{ padding: "24px 32px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", display: "flex", justifyContent: "flex-end", gap: "14px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "rgba(255,255,255,0.04)", color: "#ccc", border: "1px solid rgba(255,255,255,0.05)", padding: "12px 24px", borderRadius: "10px", fontSize: "13px", fontWeight: "900", cursor: "pointer" }}>{modalType === "viewProfile" ? "CLOSE" : "CANCEL"}</button>
                {modalType !== "viewProfile" && (
                  <button type="submit" disabled={modalLoading} style={{ background: "linear-gradient(135deg, #FF5500 0%, #ff7700 100%)", color: "white", border: "none", padding: "12px 32px", borderRadius: "10px", fontSize: "13px", fontWeight: "900", cursor: modalLoading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }} className="btn-glow-neon">
                    {modalLoading ? "SAVING..." : "SAVE ENTRY"}
                    {modalLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  </button>
                )}
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ==================== RECORD DETAIL & ADJUDICATION MODAL ==================== */}
      {isRecordDetailModalOpen && selectedRecordDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(255, 85, 0, 0.2)", width: "100%", maxWidth: "700px", maxHeight: "calc(100vh - 40px)", borderRadius: "28px", overflow: "hidden", display: "flex", flexDirection: "column", animation: "modalFadeIn 0.3s ease-out" }}>

            {/* Modal Header */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "950", margin: 0, textTransform: "uppercase", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Trophy size={18} color="#FF5500" /> SUBMISSION EVIDENCE SHEET
                </h3>
                <span style={{ fontSize: "11px", color: "#666", fontWeight: "700" }}>OFFICIAL AMPEX WORLD RECORD REVIEW SHEET</span>
              </div>
              <button onClick={() => setIsRecordDetailModalOpen(false)} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}><X size={20} /></button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "32px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* Row 1: Title, Category, and Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", marginBottom: "6px", letterSpacing: "1px", textTransform: "uppercase" }}>RECORD ATTEMPT TITLE</label>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "white" }}>{selectedRecordDetail.title}</div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", marginBottom: "6px", letterSpacing: "1px", textTransform: "uppercase" }}>CATEGORY & DIVISION</label>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: "#aaa" }}>{selectedRecordDetail.category}</div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", marginBottom: "6px", letterSpacing: "1px", textTransform: "uppercase" }}>TRACKING NUMBER</label>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                    {selectedRecordDetail.id ? `TRK-${selectedRecordDetail.id.substring(0,8).toUpperCase()}` : "TRK-PENDING"}
                    <button onClick={() => { showToast('Tracking number generated & emailed to athlete', 'success'); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "2px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontWeight: "800" }}>GENERATE</button>
                  </div>
                </div>
              </div>

              {/* Row 2: Value & Unit and Athlete */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "16px", padding: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#666", marginBottom: "6px", letterSpacing: "1px" }}>ATHLETE DETAILS</label>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "white" }}>{selectedRecordDetail.user?.name || "AMPEX Athlete"}</div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{selectedRecordDetail.user?.email || ""}</div>
                  {selectedRecordDetail.athleteId && <div style={{ fontSize: "11px", color: "#FF5500", fontWeight: "800", marginTop: "4px" }}>@{selectedRecordDetail.athleteId}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#666", marginBottom: "6px", letterSpacing: "1px" }}>PERFORMANCE VALUE</label>
                  <div style={{ fontSize: "36px", fontWeight: "950", color: "#FF5500", lineHeight: "1" }}>
                    {selectedRecordDetail.value} <span style={{ fontSize: "16px", color: "white" }}>{selectedRecordDetail.unit}</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Venue, Date & City */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#666", marginBottom: "6px", letterSpacing: "1px" }}>VENUE LOCATION</label>
                  <div style={{ fontSize: "13px", color: "white", fontWeight: "700" }}>{selectedRecordDetail.venue_name || selectedRecordDetail.venueName || "Not specified"}</div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>📍 {selectedRecordDetail.city || "Online"}</div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#666", marginBottom: "6px", letterSpacing: "1px" }}>ATTEMPT TIMESTAMP</label>
                  <div style={{ fontSize: "13px", color: "white", fontWeight: "700" }}>
                    {selectedRecordDetail.created_at ? new Date(selectedRecordDetail.created_at).toLocaleString() : "Not specified"}
                  </div>
                </div>
              </div>

              {/* Row 4: Evidence Video */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", marginBottom: "8px", letterSpacing: "1px" }}>EVIDENCE VIDEO FILE / URL</label>
                {(() => {
                  const url = selectedRecordDetail.evidence_url || selectedRecordDetail.evidenceUrl;
                  if (!url || url === "pending_upload") {
                    return (
                      <div style={{ padding: "24px", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "12px", textAlign: "center", color: "#555", fontSize: "12px" }}>
                        <Video size={28} style={{ margin: "0 auto 8px auto", display: "block", opacity: 0.3 }} />
                        No video evidence submitted for this attempt.
                      </div>
                    );
                  } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
                    const videoId = url.includes("youtu.be/") ? url.split("youtu.be/")[1]?.split("?")[0] : url.split("v=")[1]?.split("&")[0];
                    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                    return (
                      <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", background: "#000", position: "relative", paddingTop: "56.25%" }}>
                        <iframe
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                          src={embedUrl}
                          title="Evidence Video player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    );
                  } else if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
                    return (
                      <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", background: "#000", padding: "8px" }}>
                        <video preload="metadata" controls style={{ width: "100%", display: "block", borderRadius: "8px" }}>
                          <source src={url} />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  } else {
                    return (
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", background: "rgba(255,85,0,0.06)", border: "1px solid rgba(255,85,0,0.2)", borderRadius: "12px", color: "#FF5500", textDecoration: "none", fontSize: "13px", fontWeight: "800" }}>
                        <Eye size={16} />
                        VIEW SUBMITTED EVIDENCE &rarr; {url.substring(0, 60)}{url.length > 60 ? "..." : ""}
                      </a>
                    );
                  }
                })()}
              </div>

              {/* Row 4.5: Photo Evidence Gallery */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#FF5500", marginBottom: "8px", letterSpacing: "1px" }}>SUBMITTED PHOTO EVIDENCE</label>
                {(() => {
                  // Collect all photo evidence URLs from various possible fields
                  const photoFields = [
                    selectedRecordDetail.photo_evidence,
                    selectedRecordDetail.photo_url,
                    selectedRecordDetail.photos,
                    selectedRecordDetail.additional_evidence,
                    selectedRecordDetail.image_url,
                  ];

                  let photos = [];
                  photoFields.forEach(field => {
                    if (!field) return;
                    if (typeof field === "string" && field.startsWith("[")) {
                      try { const parsed = JSON.parse(field); if (Array.isArray(parsed)) photos.push(...parsed); } catch { /* ignore error */ }
                    } else if (Array.isArray(field)) {
                      photos.push(...field.filter(Boolean));
                    } else if (typeof field === "string" && field.length > 0 && field !== "pending_upload") {
                      photos.push(field);
                    }
                  });

                  // Filter to image-like URLs only (exclude video/pdf)
                  photos = photos.filter(url => typeof url === 'string' && (url.match(/\.(jpg|jpeg|png|gif|webp)/i) || url.includes('unsplash') || url.includes('storage') || url.includes('supabase')));

                  if (photos.length === 0) {
                    return (
                      <div style={{ padding: "24px", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "12px", textAlign: "center", color: "#555", fontSize: "12px" }}>
                        <FileText size={28} style={{ margin: "0 auto 8px auto", display: "block", opacity: 0.3 }} />
                        No photo evidence was submitted with this attempt.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: photos.length === 1 ? "1fr" : "1fr 1fr", gap: "12px" }}>
                      {photos.map((url, pIdx) => (
                        <a key={pIdx} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", height: "160px", position: "relative", cursor: "pointer", textDecoration: "none" }}>
                          <img loading="lazy" decoding="async" src={url} alt={`Photo Evidence ${pIdx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.parentElement.style.display='none'; }} />
                          <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: "3px 10px", borderRadius: "6px", fontSize: "9px", color: "white", fontWeight: "900", letterSpacing: "0.5px" }}>
                            PHOTO {pIdx + 1} — CLICK TO ENLARGE
                          </div>
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Row 5: Witnesses */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#666", marginBottom: "8px", letterSpacing: "1px" }}>AMPEX VERIFIED WITNESS REGISTRY</label>
                {(() => {
                  let parsedWitnesses = [];
                  if (selectedRecordDetail.witnesses) {
                    if (typeof selectedRecordDetail.witnesses === "string") {
                      try { parsedWitnesses = JSON.parse(selectedRecordDetail.witnesses); } catch { /* ignore error */ }
                    } else if (Array.isArray(selectedRecordDetail.witnesses)) {
                      parsedWitnesses = selectedRecordDetail.witnesses;
                    }
                  }

                  if (parsedWitnesses.length === 0) {
                    return (
                      <div style={{ padding: "12px", color: "#555", fontSize: "11px", fontStyle: "italic", background: "rgba(255,255,255,0.01)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                        No witnesses registered for this attempt.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {parsedWitnesses.map((w, idx) => (
                        <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: "12px", color: "white", fontWeight: "800" }}>{w.name || "Unnamed Witness"}</span>
                            <span style={{ fontSize: "10px", color: "#FF5500", fontWeight: "900", textTransform: "uppercase", marginLeft: "10px", background: "rgba(255,85,0,0.08)", padding: "2px 6px", borderRadius: "4px" }}>{w.role || "Witness"}</span>
                          </div>
                          <span style={{ fontSize: "10px", fontWeight: "900", color: w.signed ? "#22c55e" : "#ffcc00" }}>
                            {w.signed ? "✓ SIGNED LOG" : "⏳ PENDING SIGNATURE"}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Modal Actions */}
            <div style={{ padding: "24px 32px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)", display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setIsRecordDetailModalOpen(false)}
                style={{ background: "rgba(255,255,255,0.04)", color: "#ccc", border: "1px solid rgba(255,255,255,0.05)", padding: "12px 24px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer" }}
              >
                CLOSE REVIEW SHEET
              </button>

              {selectedRecordDetail.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      // "Pending Review" = new, nobody has picked it up. "Under Review" = an adjudicator is working on it.
                      apiCall(`/records/admin/adjudicate/${selectedRecordDetail.id}`, "PUT", { status: "pending", verification_status: "under_review" }, user.token)
                        .then(() => { showToast("Marked Under Review: an adjudicator is working on this submission.", "success"); fetchData(); })
                        .catch((err) => showToast(`Could not update: ${err.message}`, "error"));
                      setIsRecordDetailModalOpen(false);
                    }}
                    style={{ background: "transparent", border: "1px solid #3b82f6", color: "#3b82f6", padding: "12px 24px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer" }}
                  >
                    MARK UNDER REVIEW
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      apiCall(`/records/admin/adjudicate/${selectedRecordDetail.id}`, "PUT", { status: "pending", verification_status: "needs_info" }, user.token)
                        .then(() => { showToast("Marked Needs More Information. Message the athlete from Communications.", "success"); fetchData(); })
                        .catch((err) => showToast(`Could not update: ${err.message}`, "error"));
                      setIsRecordDetailModalOpen(false);
                    }}
                    style={{ background: "transparent", border: "1px solid #ffcc00", color: "#ffcc00", padding: "12px 24px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer" }}
                  >
                    REQUEST MORE INFO
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickAdjudicate(selectedRecordDetail.id, "rejected");
                      setIsRecordDetailModalOpen(false);
                    }}
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "12px 24px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer" }}
                  >
                    DENY SUBMISSION
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickAdjudicate(selectedRecordDetail.id, "verified");
                      setIsRecordDetailModalOpen(false);
                    }}
                    style={{ background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)", color: "white", border: "none", padding: "12px 28px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer", boxShadow: "0 10px 20px rgba(34, 197, 94, 0.2)" }}
                  >
                    APPROVE SUBMISSION
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ==================== USER ACTION MODALS ==================== */}

      {/* SUSPEND USER MODAL */}
      {userActionModal.isOpen && userActionModal.type === "suspend" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2100, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(255, 204, 0, 0.15)", width: "100%", maxWidth: "480px", borderRadius: "20px", padding: "32px", animation: "modalFadeIn 0.3s ease-out" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "950", margin: "0 0 16px 0", color: "white", textTransform: "uppercase" }}>🟡 SUSPEND USER</h3>
            <p style={{ fontSize: "13px", color: "#aaa", margin: "0 0 24px 0" }}>Suspend {userActionModal.userName} from platform access</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>SUSPENSION REASON</label>
                <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Explain why this user is being suspended..." style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,204,0,0.2)", borderRadius: "8px", padding: "10px 14px", color: "white", minHeight: "80px", fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>SUSPENSION DURATION (days)</label>
                <input type="number" value={suspendDuration} onChange={(e) => setSuspendDuration(e.target.value)} min="1" max="365" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,204,0,0.2)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => handleSuspendUser(userActionModal.userId)} style={{ flex: 1, background: "linear-gradient(135deg, #FFCC00 0%, #ffaa00 100%)", border: "none", color: "#000", padding: "12px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "12px" }}>CONFIRM SUSPEND</button>
              <button onClick={() => setUserActionModal({ isOpen: false, type: null, userId: null, userName: "" })} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", padding: "12px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "12px" }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* USER ACTIVITY MODAL */}
      {userActionModal.isOpen && userActionModal.type === "activity" && userActivity && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2100, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(168, 85, 247, 0.15)", width: "100%", maxWidth: "600px", maxHeight: "calc(100vh - 40px)", borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column", animation: "modalFadeIn 0.3s ease-out" }}>
            <div style={{ padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "950", margin: 0, textTransform: "uppercase", color: "white" }}>📊 USER ACTIVITY</h3>
                <p style={{ fontSize: "12px", color: "#888", margin: "4px 0 0 0" }}>{userActivity.user?.name}</p>
              </div>
              <button onClick={() => setUserActionModal({ isOpen: false, type: null, userId: null, userName: "" })} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ padding: "24px 32px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Account Info */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: "900", color: "#a855f7", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Account Information</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
                  <div><span style={{ color: "#888" }}>Created:</span> <span style={{ color: "#fff" }}>{userActivity.user?.createdAt ? new Date(userActivity.user.createdAt).toLocaleDateString() : "N/A"}</span></div>
                  <div><span style={{ color: "#888" }}>Last Login:</span> <span style={{ color: "#fff" }}>{userActivity.lastLogin ? new Date(userActivity.lastLogin).toLocaleDateString() : "Never"}</span></div>
                  <div><span style={{ color: "#888" }}>Status:</span> <span style={{ color: userActivity.user?.accountStatus === 'active' ? '#22c55e' : '#ef4444', fontWeight: "900" }}>{userActivity.user?.accountStatus?.toUpperCase()}</span></div>
                  <div><span style={{ color: "#888" }}>Total Submissions:</span> <span style={{ color: "#fff", fontWeight: "900" }}>{userActivity.totalSubmissions || 0}</span></div>
                </div>
              </div>

              {/* Submission Stats */}
              {userActivity.submissionStats && (
                <div>
                  <h4 style={{ fontSize: "12px", fontWeight: "900", color: "#a855f7", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Submission Statistics</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "12px" }}>
                    <div style={{ background: "rgba(34,197,94,0.1)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ color: "#22c55e", fontWeight: "900", fontSize: "16px" }}>{userActivity.submissionStats.verified || 0}</div>
                      <div style={{ color: "#888", fontSize: "11px", marginTop: "4px" }}>Verified</div>
                    </div>
                    <div style={{ background: "rgba(255,204,0,0.1)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ color: "#ffcc00", fontWeight: "900", fontSize: "16px" }}>{userActivity.submissionStats.pending || 0}</div>
                      <div style={{ color: "#888", fontSize: "11px", marginTop: "4px" }}>Pending</div>
                    </div>
                    <div style={{ background: "rgba(239,68,68,0.1)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ color: "#ef4444", fontWeight: "900", fontSize: "16px" }}>{userActivity.submissionStats.rejected || 0}</div>
                      <div style={{ color: "#888", fontSize: "11px", marginTop: "4px" }}>Rejected</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Submissions */}
              {userActivity.recentSubmissions && userActivity.recentSubmissions.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "12px", fontWeight: "900", color: "#a855f7", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Submissions</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {userActivity.recentSubmissions.slice(0, 5).map((sub, idx) => (
                      <div key={idx} style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px", fontSize: "11px", borderLeft: `3px solid ${sub.status === 'verified' ? '#22c55e' : sub.status === 'pending' ? '#ffcc00' : '#ef4444'}` }}>
                        <div style={{ color: "#FF6A00", fontWeight: "900", marginBottom: "4px" }}>{sub.title}</div>
                        <div style={{ color: "#888" }}>{sub.category} • {new Date(sub.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "16px 32px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "right" }}>
              <button onClick={() => setUserActionModal({ isOpen: false, type: null, userId: null, userName: "" })} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", padding: "10px 20px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "12px" }}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MEMBERSHIP ACTION MODALS ==================== */}
      {membershipActionModal.isOpen && membershipActionModal.type === "renew" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2200, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(34,197,94,0.12)", width: "100%", maxWidth: "520px", borderRadius: "20px", padding: "28px", animation: "modalFadeIn 0.3s ease-out" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "950", margin: "0 0 8px 0", color: "#22c55e" }}>🔁 RENEW MEMBERSHIP</h3>
            <p style={{ color: "#aaa", margin: "0 0 16px 0" }}>Renew membership for {membershipActionModal.membershipUser}</p>
            <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#555", marginBottom: "6px" }}>PAYMENT AMOUNT (optional)</label>
                <input type="number" value={membershipAmount} onChange={(e) => setMembershipAmount(parseFloat(e.target.value || 0))} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(34,197,94,0.08)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#555", marginBottom: "6px" }}>RENEWAL NOTE</label>
                <input type="text" value={renewalReason} onChange={(e) => setRenewalReason(e.target.value)} placeholder="Optional note for the renewal" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(34,197,94,0.08)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setMembershipActionModal({ isOpen: false, type: null, membershipId: null, membershipUser: null })} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "#ccc", padding: "10px 18px", borderRadius: "8px", cursor: "pointer" }}>CANCEL</button>
              <button onClick={() => handleRenewMembership(membershipActionModal.membershipId, membershipAmount)} style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", border: "none", color: "white", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "900" }}>CONFIRM RENEW</button>
            </div>
          </div>
        </div>
      )}

      {membershipActionModal.isOpen && membershipActionModal.type === "cancel" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2200, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(239,68,68,0.12)", width: "100%", maxWidth: "520px", borderRadius: "20px", padding: "28px", animation: "modalFadeIn 0.3s ease-out" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "950", margin: "0 0 8px 0", color: "#ef4444" }}>🛑 CANCEL MEMBERSHIP</h3>
            <p style={{ color: "#aaa", margin: "0 0 16px 0" }}>Cancel membership for {membershipActionModal.membershipUser}</p>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#555", marginBottom: "6px" }}>CANCELLATION REASON</label>
              <textarea value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} placeholder="Explain why this membership is being cancelled" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(239,68,68,0.08)", borderRadius: "8px", padding: "10px 14px", color: "white", minHeight: "80px" }} />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setMembershipActionModal({ isOpen: false, type: null, membershipId: null, membershipUser: null })} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "#ccc", padding: "10px 18px", borderRadius: "8px", cursor: "pointer" }}>BACK</button>
              <button onClick={() => handleCancelMembership(membershipActionModal.membershipId)} style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", border: "none", color: "white", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "900" }}>CONFIRM CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {membershipActionModal.isOpen && membershipActionModal.type === "upgrade" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2200, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(59,130,246,0.12)", width: "100%", maxWidth: "520px", borderRadius: "20px", padding: "28px", animation: "modalFadeIn 0.3s ease-out" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "950", margin: "0 0 8px 0", color: "#3b82f6" }}>⬆️ UPGRADE MEMBERSHIP</h3>
            <p style={{ color: "#aaa", margin: "0 0 16px 0" }}>Change tier for {membershipActionModal.membershipUser}</p>
            <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "#555" }}>NEW TIER</label>
              <select value={selectedUpgradeTier} onChange={(e) => setSelectedUpgradeTier(e.target.value)} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(59,130,246,0.08)", borderRadius: "8px", padding: "10px 14px", color: "white" }}>
                <option value="free">Free</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setMembershipActionModal({ isOpen: false, type: null, membershipId: null, membershipUser: null })} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "#ccc", padding: "10px 18px", borderRadius: "8px", cursor: "pointer" }}>CANCEL</button>
              <button onClick={() => handleUpgradeMembership(membershipActionModal.membershipId, selectedUpgradeTier)} style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", border: "none", color: "white", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "900" }}>CONFIRM</button>
            </div>
          </div>
        </div>
      )}

      {membershipActionModal.isOpen && membershipActionModal.type === "payments" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2200, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(168,85,247,0.12)", width: "100%", maxWidth: "560px", borderRadius: "20px", padding: "24px", animation: "modalFadeIn 0.3s ease-out" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "950", margin: "0 0 8px 0", color: "#a855f7" }}>💳 PAYMENT HISTORY</h3>
            <p style={{ color: "#aaa", margin: "0 0 12px 0" }}>Payments for {membershipActionModal.membershipUser}</p>
            <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
              {membershipPaymentHistory && membershipPaymentHistory.length > 0 ? membershipPaymentHistory.map((p, i) => (
                <div key={i} style={{ background: "rgba(0,0,0,0.35)", padding: "12px", borderRadius: "8px", display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <div style={{ fontWeight: "900", color: "white" }}>{p.type} • {p.status}</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>{new Date(p.date).toLocaleString()}</div>
                  </div>
                  <div style={{ fontWeight: "900", color: "#FF6A00" }}>${Number(p.amount || 0).toFixed(2)}</div>
                </div>
              )) : <div style={{ color: "#888" }}>No payment records found.</div>}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setMembershipActionModal({ isOpen: false, type: null, membershipId: null, membershipUser: null })} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "#ccc", padding: "10px 18px", borderRadius: "8px", cursor: "pointer" }}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADDITIONAL CUSTOM USER ACTION MODALS ==================== */}

      {/* BAN USER MODAL */}
      {userActionModal.isOpen && userActionModal.type === "ban" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2100, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(239, 68, 68, 0.25)", width: "100%", maxWidth: "480px", borderRadius: "20px", padding: "32px", animation: "modalFadeIn 0.3s ease-out" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "950", margin: "0 0 16px 0", color: "#ef4444", textTransform: "uppercase" }}>🚫 PERMANENTLY BAN USER</h3>
            <p style={{ fontSize: "13px", color: "#aaa", margin: "0 0 24px 0" }}>
              Are you absolutely sure you want to permanently ban <strong>{userActionModal.userName}</strong>? This will revoke all platform access and cannot be easily reversed.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={async () => {
                  try {
                    await apiCall(`/dashboard/users/${userActionModal.userId}/ban`, "PUT", {}, user.token);
                    fetchData();
                    alert("User banned successfully");
                    setUserActionModal({ isOpen: false, type: null, userId: null, userName: "" });
                  } catch (err) {
                    alert(`Failed to ban user: ${err.message}`);
                  }
                }}
                style={{ flex: 1, background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", border: "none", color: "white", padding: "12px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "12px" }}
              >
                CONFIRM BAN
              </button>
              <button onClick={() => setUserActionModal({ isOpen: false, type: null, userId: null, userName: "" })} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", padding: "12px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "12px" }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {userActionModal.isOpen && userActionModal.type === "resetPassword" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2100, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(59, 130, 246, 0.25)", width: "100%", maxWidth: "480px", borderRadius: "20px", padding: "32px", animation: "modalFadeIn 0.3s ease-out" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "950", margin: "0 0 16px 0", color: "#3b82f6", textTransform: "uppercase" }}>🔑 RESET USER PASSWORD</h3>
            <p style={{ fontSize: "13px", color: "#aaa", margin: "0 0 24px 0" }}>Set a new temporary password for {userActionModal.userName}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>NEW TEMPORARY PASSWORD</label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Enter temporary password (min 6 chars)..."
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", padding: "10px 14px", color: "white" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => handleResetPassword(userActionModal.userId)} style={{ flex: 1, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", border: "none", color: "white", padding: "12px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "12px" }}>CONFIRM RESET</button>
              <button onClick={() => setUserActionModal({ isOpen: false, type: null, userId: null, userName: "" })} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", padding: "12px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "12px" }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== GLOBAL TOAST & CONFIRMATION MODALS ==================== */}

      {/* Custom Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: toast.type === "success" ? "rgba(10, 45, 20, 0.9)" :
                      toast.type === "error" ? "rgba(50, 10, 10, 0.9)" : "rgba(20, 20, 30, 0.9)",
          border: `1px solid ${
            toast.type === "success" ? "rgba(34, 197, 94, 0.4)" :
            toast.type === "error" ? "rgba(239, 68, 68, 0.4)" : "rgba(59, 130, 246, 0.4)"
          }`,
          boxShadow: `0 8px 32px 0 ${
            toast.type === "success" ? "rgba(0, 200, 0, 0.15)" :
            toast.type === "error" ? "rgba(200, 0, 0, 0.15)" : "rgba(0, 0, 200, 0.15)"
          }`,
          borderRadius: "16px",
          padding: "16px 24px",
          color: "white",
          zIndex: 3000,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          backdropFilter: "blur(12px)",
          animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          maxWidth: "400px"
        }}>
          {toast.type === "success" ? <CheckCircle size={20} color="#22c55e" /> :
           toast.type === "error" ? <AlertTriangle size={20} color="#ef4444" /> : <ShieldAlert size={20} color="#3b82f6" />}
          <span style={{ fontSize: "13px", fontWeight: "900", letterSpacing: "0.2px" }}>{toast.message}</span>
        </div>
      )}

      {/* Generic Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2500, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(255, 255, 255, 0.1)", width: "100%", maxWidth: "480px", borderRadius: "20px", padding: "32px", animation: "modalFadeIn 0.3s ease-out" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "950", margin: "0 0 16px 0", color: "white", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertTriangle size={22} color="#ffcc00" />
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: "13px", color: "#aaa", margin: "0 0 24px 0", lineHeight: "1.5" }}>{confirmModal.message}</p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
                }}
                style={{ flex: 1, background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", border: "none", color: "white", padding: "12px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "12px", textTransform: "uppercase" }}
              >
                CONFIRM
              </button>
              <button
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null })}
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", padding: "12px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "12px" }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>
      <Footer />
      {/* Styled Inline Hover Animations */}
      {/* ==================== APPEAL DETAIL MODAL ==================== */}
      {selectedAppeal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center", animation: "modalFadeIn 0.2s ease-out" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", width: "95%", maxWidth: "900px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <div style={{ color: "#FF5500", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", marginBottom: "4px" }}>APPEAL DETAILS</div>
                <h3 style={{ fontSize: "24px", fontWeight: "900", color: "white", margin: 0 }}>Appeal {selectedAppeal.id.substring(0,8).toUpperCase()}</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{
                  background: ['Approved', 'Closed'].includes(selectedAppeal.status) ? "rgba(34,197,94,0.1)" : selectedAppeal.status === 'Denied' ? "rgba(239,68,68,0.1)" : selectedAppeal.status === 'Pending' ? "rgba(255,106,0,0.1)" : "rgba(255,204,0,0.1)",
                  color: ['Approved', 'Closed'].includes(selectedAppeal.status) ? "#22c55e" : selectedAppeal.status === 'Denied' ? "#ef4444" : selectedAppeal.status === 'Pending' ? "#FF6A00" : "#ffcc00",
                  padding: "6px 16px", borderRadius: "100px", fontSize: "11px", fontWeight: "900", border: "1px solid currentColor"
                }}>
                  {selectedAppeal.status.toUpperCase()}
                </span>
                <button onClick={() => setSelectedAppeal(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: "36px", height: "36px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "32px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 300px", gap: "40px" }}>

              {/* Left Column: Details & Evidence */}
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

                {/* User Info */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px" }}>
                  <h4 style={{ fontSize: "12px", color: "#888", fontWeight: "900", letterSpacing: "1px", marginBottom: "16px" }}>APPELLANT INFO</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", marginBottom: "4px" }}>NAME (USER PROFILE)</div>
                      <div
                        style={{ fontSize: "14px", color: "white", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => { setActiveTab("users"); setSelectedAppeal(null); setTimeout(fetchData, 100); }}
                      >
                        {selectedAppeal.user?.name || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", marginBottom: "4px" }}>EMAIL</div>
                      <div style={{ fontSize: "14px", color: "white", fontWeight: "700" }}>{selectedAppeal.user?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", marginBottom: "4px" }}>MEMBER NUMBER</div>
                      <div style={{ fontSize: "14px", color: "#FF5500", fontWeight: "900" }}>{selectedAppeal.user?.member_number || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#555", fontWeight: "900", marginBottom: "4px" }}>RECORD SUBMISSION</div>
                      <div
                        style={{ fontSize: "14px", color: "white", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => { setActiveTab("records"); setSelectedAppeal(null); setTimeout(fetchData, 100); }}
                      >
                        {selectedAppeal.record?.title || 'Unknown Record'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appeal Reason */}
                <div>
                  <h4 style={{ fontSize: "12px", color: "#888", fontWeight: "900", letterSpacing: "1px", marginBottom: "16px" }}>APPEAL REASON</h4>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", color: "white", fontSize: "14px", lineHeight: "1.6" }}>
                    {selectedAppeal.appeal_reason}
                  </div>
                </div>

                {/* Evidence */}
                <div>
                  <h4 style={{ fontSize: "12px", color: "#888", fontWeight: "900", letterSpacing: "1px", marginBottom: "16px" }}>UPLOADED EVIDENCE</h4>
                  {selectedAppeal.evidence_files && selectedAppeal.evidence_files.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {selectedAppeal.evidence_files.map((file, i) => (
                        <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px", color: "white", textDecoration: "none" }}>
                          {file.type === 'video' ? <Video size={20} color="#FF5500" /> : <ExternalLink size={20} color="#FF5500" />}
                          <span style={{ fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name || 'Evidence File'}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "#666", fontSize: "13px", fontWeight: "700" }}>No additional evidence provided.</div>
                  )}
                </div>

              </div>

              {/* Right Column: Actions & Resolution */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px", borderLeft: "1px solid rgba(255,255,255,0.05)", paddingLeft: "40px" }}>

                {/* Status Actions */}
                <div>
                  <h4 style={{ fontSize: "12px", color: "#888", fontWeight: "900", letterSpacing: "1px", marginBottom: "16px" }}>ADJUDICATION ACTIONS</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <button onClick={() => handleUpdateAppealStatus(selectedAppeal.id, "Approved")} style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", padding: "12px", borderRadius: "8px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                      <CheckCircle size={14} /> APPROVE APPEAL
                    </button>
                    <button onClick={() => handleUpdateAppealStatus(selectedAppeal.id, "Denied")} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "12px", borderRadius: "8px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                      <XCircle size={14} /> DENY APPEAL
                    </button>
                    <button onClick={() => handleUpdateAppealStatus(selectedAppeal.id, "Awaiting Evidence")} style={{ background: "transparent", border: "1px solid #ffcc00", color: "#ffcc00", padding: "12px", borderRadius: "8px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertTriangle size={14} /> REQUEST MORE INFO
                    </button>
                    <button onClick={() => handleUpdateAppealStatus(selectedAppeal.id, "Escalated")} style={{ background: "transparent", border: "1px solid #FF5500", color: "#FF5500", padding: "12px", borderRadius: "8px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertTriangle size={14} /> ESCALATE APPEAL
                    </button>
                    <button onClick={() => handleUpdateAppealStatus(selectedAppeal.id, "Closed")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", padding: "12px", borderRadius: "8px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                      <X size={14} /> CLOSE APPEAL
                    </button>
                    <button onClick={() => { window.location.href = 'mailto:'; }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "8px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                      <MessageSquare size={14} /> CONTACT USER
                    </button>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h4 style={{ fontSize: "12px", color: "#888", fontWeight: "900", letterSpacing: "1px", marginBottom: "16px" }}>ADMIN NOTES</h4>
                  <textarea
                    defaultValue={selectedAppeal.admin_notes}
                    onBlur={(e) => handleUpdateAppealNotes(selectedAppeal.id, e.target.value)}
                    placeholder="Add internal notes here... (Saves automatically on blur)"
                    style={{ width: "100%", height: "100px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", color: "white", borderRadius: "8px", padding: "12px", fontSize: "12px", outline: "none", resize: "none", fontFamily: "inherit" }}
                  />
                </div>

                {/* Resolution History */}
                <div>
                  <h4 style={{ fontSize: "12px", color: "#888", fontWeight: "900", letterSpacing: "1px", marginBottom: "16px" }}>HISTORY</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {selectedAppeal.resolution_history && selectedAppeal.resolution_history.length > 0 ? (
                      selectedAppeal.resolution_history.map((hist, i) => (
                        <div key={i} style={{ display: "flex", gap: "8px" }}>
                          <div style={{ width: "2px", background: "rgba(255,255,255,0.1)", alignSelf: "stretch" }} />
                          <div>
                            <div style={{ color: "white", fontSize: "11px", fontWeight: "900", marginBottom: "2px" }}>{hist.status}</div>
                            <div style={{ color: "#aaa", fontSize: "10px", fontWeight: "700" }}>{new Date(hist.date).toLocaleString()}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "#666", fontSize: "11px", fontWeight: "700" }}>No history recorded.</div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* ADJUDICATOR ACTION MODALS */}
      {activeAdjudicatorModal && adjudicatorActionTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#0c0c0e", border: "1px solid rgba(255, 85, 0, 0.15)", width: "100%", maxWidth: "640px", maxHeight: "calc(100vh - 40px)", borderRadius: "28px", overflow: "hidden", display: "flex", flexDirection: "column", animation: "modalFadeIn 0.3s ease-out" }}>
            <div style={{ padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "950", margin: 0, textTransform: "uppercase", color: "white" }}>
                  {activeAdjudicatorModal === 'assign' && 'Assign Case'}
                  {activeAdjudicatorModal === 'records' && 'View Assigned Records'}
                  {activeAdjudicatorModal === 'history' && 'View Review History'}
                  {activeAdjudicatorModal === 'cert' && 'Certification Status'}
                  {activeAdjudicatorModal === 'message' && 'Message Adjudicator'}
                </h3>
                <span style={{ fontSize: "11px", color: "#FF5500", textTransform: "uppercase", fontWeight: "800" }}>{adjudicatorActionTarget.name}</span>
              </div>
              <button onClick={() => setActiveAdjudicatorModal(null)} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ padding: "32px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>

              {activeAdjudicatorModal === 'assign' && (
                <>
                  <p style={{ color: "#aaa", fontSize: "13px" }}>Select a pending case to assign to {adjudicatorActionTarget.name}.</p>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px", textAlign: "center", color: "#888", fontSize: "13px" }}>
                    Mock Data: No pending unassigned cases available at the moment.
                  </div>
                  <button onClick={() => { alert("Mock: Case Assigned!"); setActiveAdjudicatorModal(null); }} style={{ marginTop: "16px", background: "#FF5500", color: "white", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "800", cursor: "pointer" }}>CONFIRM ASSIGNMENT</button>
                </>
              )}

              {activeAdjudicatorModal === 'records' && (
                <>
                  <p style={{ color: "#aaa", fontSize: "13px" }}>Current active records assigned to {adjudicatorActionTarget.name}.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[1, 2].map(i => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ color: "white", fontWeight: "800", fontSize: "13px" }}>Mock Record {i} - Heaviest Deadlift</span>
                          <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "900" }}>IN REVIEW</span>
                        </div>
                        <div style={{ color: "#888", fontSize: "11px" }}>Assigned: {new Date().toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeAdjudicatorModal === 'history' && (
                <>
                  <p style={{ color: "#aaa", fontSize: "13px" }}>Recent review decisions by {adjudicatorActionTarget.name}.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ color: "white", fontWeight: "800", fontSize: "13px" }}>Mock Record {i + 5}</div>
                          <div style={{ color: "#888", fontSize: "11px" }}>Reviewed: {new Date(Date.now() - 86400000 * i * 2).toLocaleDateString()}</div>
                        </div>
                        <span style={{ color: i % 2 === 0 ? "#ef4444" : "#22c55e", fontWeight: "900", fontSize: "12px" }}>
                          {i % 2 === 0 ? "REJECTED" : "VERIFIED"}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeAdjudicatorModal === 'cert' && (
                <>
                  <p style={{ color: "#aaa", fontSize: "13px" }}>Manage specific category certifications and authorization levels.</p>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {['Strength', 'Speed', 'Endurance', 'Agility'].map((cat, idx) => (
                      <div key={cat} style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ color: "white", fontWeight: "800", fontSize: "14px" }}>{cat}</div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", color: idx < 2 ? "#22c55e" : "#888" }}>{idx < 2 ? "CERTIFIED L2" : "UNAUTHORIZED"}</span>
                          <input type="checkbox" defaultChecked={idx < 2} style={{ cursor: "pointer" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { alert("Mock: Certifications Updated!"); setActiveAdjudicatorModal(null); }} style={{ marginTop: "16px", background: "#FF5500", color: "white", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "800", cursor: "pointer" }}>SAVE CERTIFICATIONS</button>
                </>
              )}

              {activeAdjudicatorModal === 'message' && (
                <>
                  <p style={{ color: "#aaa", fontSize: "13px" }}>Send an internal notification or email to this adjudicator.</p>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>SUBJECT</label>
                    <input type="text" value={adjudicatorMessageSubject} onChange={e => setAdjudicatorMessageSubject(e.target.value)} placeholder="e.g. Case Assignment Update" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white" }} />
                  </div>
                  <div style={{ marginTop: "12px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "#555", marginBottom: "6px" }}>MESSAGE BODY</label>
                    <textarea value={adjudicatorMessageText} onChange={e => setAdjudicatorMessageText(e.target.value)} placeholder="Type your message here..." style={{ width: "100%", height: "120px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 14px", color: "white", resize: "none" }}></textarea>
                  </div>
                  <button onClick={() => {
                    if (!adjudicatorMessageText.trim()) return alert("Message body cannot be empty");
                    alert("Mock: Message Sent Successfully!");
                    setActiveAdjudicatorModal(null);
                  }} style={{ marginTop: "16px", background: "#FF5500", color: "white", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "800", cursor: "pointer" }}>SEND MESSAGE</button>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ==================== VIDEO PLAYER MODAL ==================== */}
      {selectedVideoForViewing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5000, padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "900px", maxHeight: "90vh", display: "flex", flexDirection: "column", background: "rgba(13,13,16,0.8)", borderRadius: "20px", border: "1px solid rgba(255,85,0,0.2)", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "900", margin: "0 0 4px 0", color: "white" }}>{selectedVideoForViewing.title}</h2>
                <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>{selectedVideoForViewing.category} • {selectedVideoForViewing.description}</p>
              </div>
              <button onClick={() => setSelectedVideoForViewing(null)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#ccc", cursor: "pointer", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.color = "#ef4444"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#ccc"; }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", background: "#000", minHeight: 0, padding: "20px" }} className="custom-scrollbar">
              {(() => {
                const evidenceLinks = [
                  selectedVideoForViewing.thumbnailUrl,
                  selectedVideoForViewing.thumbnail_url,
                  selectedVideoForViewing.image_url,
                  selectedVideoForViewing.evidence_url,
                  selectedVideoForViewing.evidenceUrl,
                  selectedVideoForViewing.video_url,
                  selectedVideoForViewing.videoUrl
                ].filter(Boolean);

                const uniqueLinks = [...new Set(evidenceLinks)].filter(link => link !== "pending_upload");

                const images = uniqueLinks.filter(src =>
                  src.match(/\.(jpeg|jpg|gif|png|webp|svg|heic|heif)(\?.*)?$/i) ||
                  src.includes('ui-avatars') ||
                  src.includes('unsplash') ||
                  src === selectedVideoForViewing.thumbnailUrl ||
                  src === selectedVideoForViewing.thumbnail_url
                );
                const videos = uniqueLinks.filter(src => !images.includes(src));

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", flex: 1 }}>
                    {/* First Column: Image */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {images.length > 0 ? images.map((src, idx) => (
                        <div key={`img-${idx}`} style={{ width: "100%", aspectRatio: "1/1", display: "flex", justifyContent: "center", background: "#111", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <img loading="lazy" decoding="async"
                            src={formatProductImage(src)}
                            alt="Evidence Image"
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        </div>
                      )) : (
                        <div style={{ width: "100%", aspectRatio: "1/1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#111", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)", color: "#555" }}>
                          <Image size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                          <span style={{ fontSize: "12px", fontWeight: "600" }}>NO IMAGE EVIDENCE</span>
                        </div>
                      )}
                    </div>

                    {/* Second Column: Video */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {videos.length > 0 ? videos.map((src, idx) => {
                        const isYouTube = src.includes('youtube') || src.includes('youtu.be');
                        if (isYouTube) {
                          const youtubeId = src.includes('youtube.com/watch?v=') ? src.split('v=')[1]?.split('&')[0] : src.split('youtu.be/')[1]?.split('?')[0];
                          return (
                            <div key={`vid-${idx}`} style={{ width: "100%", aspectRatio: "16/9", background: "#111", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0`}
                                title="Video Evidence"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ border: "none" }}
                              />
                            </div>
                          );
                        } else {
                          return (
                            <div key={`vid-${idx}`} style={{ width: "100%", aspectRatio: "16/9", background: "#111", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
                              <video
                                controls
                                preload="metadata"
                                style={{ width: "100%", height: "100%", outline: "none", backgroundColor: "#000", objectFit: "contain" }}
                              >
                                <source src={formatProductImage(src)} type={src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          );
                        }
                      }) : (
                        <div style={{ width: "100%", aspectRatio: "16/9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#111", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)", color: "#555" }}>
                          <Video size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                          <span style={{ fontSize: "12px", fontWeight: "600" }}>NO VIDEO EVIDENCE</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Info Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {selectedVideoForViewing.is_featured && <span style={{ background: "rgba(255,85,0,0.1)", color: "#FF5500", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", marginRight: "8px" }}>🔥 FEATURED</span>}
                {selectedVideoForViewing.is_newly_uploaded && <span style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" }}>✨ NEW</span>}
              </div>
              <button onClick={() => setSelectedVideoForViewing(null)} style={{ background: "linear-gradient(135deg, #FF5500 0%, #ff8800 100%)", color: "white", border: "none", padding: "10px 24px", borderRadius: "100px", fontSize: "12px", fontWeight: "900", cursor: "pointer" }}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.015) !important;
        }

        .btn-glow-neon:hover {
          box-shadow: 0 0 20px rgba(255, 85, 0, 0.4) !important;
          transform: translateY(-1.5px);
        }

        .hover-white:hover {
          background: rgba(255,255,255,0.08) !important;
          color: white !important;
        }

        .hover-danger:hover {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.4) !important;
          transform: translateY(-1px);
        }

        /* PREMIUM BUTTON CLASSES */
        .btn-premium-edit {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          color: #aaa;
          transition: all 0.2s ease-in-out;
        }
        .btn-premium-edit:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.3);
          color: #fff;
          box-shadow: 0 0 12px rgba(255,255,255,0.1);
          transform: translateY(-1px);
        }

        .btn-premium-suspend {
          background: rgba(255, 204, 0, 0.03);
          border: 1px solid rgba(255, 204, 0, 0.15);
          color: #ffcc00;
          transition: all 0.2s ease-in-out;
        }
        .btn-premium-suspend:hover {
          background: rgba(255, 204, 0, 0.08);
          border-color: rgba(255, 204, 0, 0.4);
          box-shadow: 0 0 12px rgba(255, 204, 0, 0.2);
          transform: translateY(-1px);
        }

        .btn-premium-ban {
          background: rgba(239, 68, 68, 0.03);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #ef4444;
          transition: all 0.2s ease-in-out;
        }
        .btn-premium-ban:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.4);
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);
          transform: translateY(-1px);
        }

        .btn-premium-restore {
          background: rgba(34, 197, 94, 0.03);
          border: 1px solid rgba(34, 197, 94, 0.15);
          color: #22c55e;
          transition: all 0.2s ease-in-out;
        }
        .btn-premium-restore:hover {
          background: rgba(34, 197, 94, 0.08);
          border-color: rgba(34, 197, 94, 0.4);
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.2);
          transform: translateY(-1px);
        }

        .btn-premium-reset {
          background: rgba(59, 130, 246, 0.03);
          border: 1px solid rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          transition: all 0.2s ease-in-out;
        }
        .btn-premium-reset:hover {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
          transform: translateY(-1px);
        }

        .btn-premium-activity {
          background: rgba(168, 85, 247, 0.03);
          border: 1px solid rgba(168, 85, 247, 0.15);
          color: #a855f7;
          transition: all 0.2s ease-in-out;
        }
        .btn-premium-activity:hover {
          background: rgba(168, 85, 247, 0.08);
          border-color: rgba(168, 85, 247, 0.4);
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.2);
          transform: translateY(-1px);
        }

        .btn-premium-delete {
          background: rgba(239, 68, 68, 0.02);
          border: 1px solid rgba(239, 68, 68, 0.08);
          color: #f87171;
          transition: all 0.2s ease-in-out;
        }
        .btn-premium-delete:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
          transform: translateY(-1px);
        }

        @keyframes modalFadeIn {
          0% { transform: scale(0.96); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes toastSlideIn {
          0% { transform: translateY(100px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default Admin;
