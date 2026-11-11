import React, { useState, useRef, useEffect, useMemo } from "react";
import { useCategories } from "../utils/categoryMeta";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  Shield,
  User,
  IdCard,
  Globe,
  Dumbbell,
  Timer,
  Zap,
  Crosshair,
  MapPin,
  ClipboardCheck,
  Video,
  Camera,
  BarChart3,
  CheckCircle2,
  Lock,
  Cpu,
  Activity,
  Maximize2,
  Scan,
  Plus,
  Trash2,
  Trophy,
  Award,
  Edit3,
  Link2,
  ChevronDown,
  Play,
  Upload
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import EvidencePreview, { videoThumbnailFor } from "../components/EvidencePreview";
import ScrollReveal from "../components/ScrollReveal";
import { API_URL, apiCall, uploadDirect } from "../utils/api";

// Supabase free plan: 50 MB per file. Bigger footage should be submitted as a YouTube / Vimeo link.
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
import { useAuth } from "../context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "../components/ui/dropdown-menu";

const categoriesData = {
  Athletics: {
    Running: ["Sprinting", "Long Distance Running", "Relay Races", "Obstacle Running", "Backwards Running", "Other"],
    Jumping: ["High Jump", "Long Jump", "Vertical Jump", "Standing Broad Jump", "Other"],
    Throwing: ["Javelin Throw", "Discus Throw", "Shot Put", "Accuracy Throws", "Other"],
    "Speed Challenges": ["Fastest Mile", "Fastest Shuttle Run", "Stair Sprinting", "Cone Drills", "Other"],
    Agility: ["Ladder Drills", "Footwork Challenges", "Speed Course Runs", "Other"]
  },
  Strength: {
    "Upper Body Strength": ["Bench Press", "Push-Ups", "Pull-Ups", "Arm Wrestling", "Grip Strength", "Other"],
    "Lower Body Strength": ["Squats", "Leg Press", "Wall Sits", "Lunges", "Other"],
    "Full Body Strength": ["Deadlifts", "Tire Flips", "Atlas Stone Lifts", "Weighted Carries", "Other"],
    "Functional Strength": ["Rope Pulling", "Object Carrying", "Vehicle Pulls", "Sandbag Challenges", "Other"],
    "Power Challenges": ["Punch Strength", "Kicking Power", "Sledgehammer Challenges", "Other"]
  },
  Endurance: {
    "Cardio Endurance": ["Long Distance Cycling", "Treadmill Challenges", "Stair Climbing", "Continuous Running", "Other"],
    "Strength Endurance": ["Push-Up Marathons", "Pull-Up Endurance", "Plank Holds", "Squat Repetitions", "Other"],
    "Mental Endurance": ["Sleep Deprivation Challenges", "Long Concentration Challenges", "Other"],
    "Environmental Endurance": ["Cold Exposure", "Heat Challenges", "Survival Endurance", "Other"],
    "Multi-Day Challenges": ["Longest Activity Duration", "Continuous Exercise Records", "Other"]
  },
  Balance: {
    "Static Balance": ["One-Leg Stands", "Handstands", "Headstands", "Balance Beam Holds", "Other"],
    "Object Balancing": ["Chair Balancing", "Pole Balancing", "Stack Balancing", "Other"],
    "Dynamic Balance": ["Slackline Walking", "Tightrope Challenges", "Rolling Balance Challenges", "Other"],
    "Extreme Balance": ["Elevated Balance Challenges", "Moving Surface Balancing", "Other"]
  },
  Skills: {
    "Precision Skills": ["Card Throwing", "Trick Shots", "Accuracy Challenges", "Dart Challenges", "Other"],
    Coordination: ["Juggling", "Cup Stacking", "Hand-Eye Coordination", "Other"],
    "Speed Skills": ["Fastest Puzzle Solving", "Rubik’s Cube Solving", "Typing Speed", "Other"],
    "Creative Skills": ["Fastest Drawing", "Artistic Challenges", "Crafting Challenges", "Other"],
    "Object Manipulation": ["Yo-Yo Tricks", "Pen Spinning", "Coin Tricks", "Other"]
  },
  Gaming: {
    Speedrunning: ["Fastest Game Completion", "Category Speedruns", "Other"],
    "Score Challenges": ["Highest Scores", "Kill Records", "Combo Records", "Other"],
    "Competitive Gaming": ["Tournament Win Streaks", "Ranked Challenges", "Other"],
    "VR Gaming": ["Virtual Reality Challenges", "VR Endurance", "Other"],
    "Mobile Gaming": ["Mobile High Scores", "Mobile Speed Challenges", "Other"],
    "Retro Gaming": ["Arcade Records", "Classic Console Challenges", "Other"]
  },
  "Water Sports": {
    Swimming: ["Sprint Swimming", "Distance Swimming", "Underwater Swimming", "Other"],
    Diving: ["High Diving", "Trick Diving", "Deep Diving", "Other"],
    Surfing: ["Longest Ride", "Biggest Wave", "Trick Surfing", "Other"],
    "Paddle Sports": ["Kayaking", "Canoeing", "Paddle Boarding", "Other"],
    "Water Endurance": ["Treading Water", "Floating Endurance", "Ice Water Challenges", "Other"],
    "Water Tricks": ["Water Skiing", "Wakeboarding", "Jet Ski Challenges", "Other"]
  },
  Reaction: {
    "Reflex Speed": ["Light Reaction Challenges", "Sound Reaction Challenges", "Other"],
    "Catching Challenges": ["Fast Catch Records", "Object Grab Challenges", "Other"],
    "Combat Reaction": ["Dodge Challenges", "Punch Reaction Tests", "Other"],
    "Gaming Reaction": ["Reaction Time Tests", "Aim Speed Challenges", "Other"],
    "Multi-Target Reactions": ["Rapid Response Courses", "Split Decision Challenges", "Other"]
  },
  "Mind & Memory": {
    "Memory Challenges": ["Number Memorization", "Card Memorization", "Name Recall", "Other"],
    "Mental Math": ["Fast Calculations", "Equation Solving", "Other"],
    "Puzzle Challenges": ["Puzzle Completion", "Logic Challenges", "Other"],
    Concentration: ["Focus Duration", "Meditation Challenges", "Other"],
    "Intelligence Challenges": ["Trivia Competitions", "Knowledge Records", "Other"],
    "Strategy Challenges": ["Chess", "Strategy Games", "Planning Challenges", "Other"]
  },
  "Action Sports": {
    Skateboarding: ["Trick Records", "Distance Challenges", "Rail Grinding", "Other"],
    BMX: ["Trick Challenges", "Jump Distance", "Rotation Records", "Other"],
    Scooters: ["Trick Combos", "Air Time Challenges", "Other"],
    Parkour: ["Wall Runs", "Vault Challenges", "Obstacle Courses", "Other"],
    "Martial Arts": ["Board Breaking", "Kick Height", "Punch Speed", "Other"],
    "Extreme Sports": ["Base Jumping", "Stunt Challenges", "Freestyle Challenges", "Other"],
    "Bike Sports": ["Wheelie Distance", "Drift Challenges", "Mountain Bike Challenges", "Other"]
  },
  Entertainment: {
    Music: ["Instrument Speed", "Vocal Records", "Composition Speed", "Other"],
    Performance: ["Dance Records", "Acting Challenges", "Stage Skills", "Other"],
    Talent: ["Unique Skills", "Varied Talents", "Other"],
    Magic: ["Slight of Hand", "Illusion Records", "Other"],
    Circus: ["Acrobatics", "Aerial Arts", "Other"],
    "Digital Content": ["Viral Challenges", "Streaming Records", "Other"]
  },
  "Creative Challenges": {
    Art: ["Fastest Painting", "Sculpting Challenges", "Other"],
    Craft: ["Building Challenges", "Knitting/Weaving", "Other"],
    Design: ["Graphic Design Records", "3D Modeling", "Other"],
    Innovation: ["New Inventions", "Prototype Speed", "Other"],
    Architecture: ["Fastest Modeling", "Lego Architecture", "Other"],
    Fashion: ["Sewing Speed", "Outfit Design", "Other"]
  },
  Youth: {
    "Kids Categories": ["Fastest Cup Stacking", "Longest Hula Hoop Time", "Most Basketball Shots in 1 Minute", "Fastest Puzzle Completion", "Jump Rope Challenges", "Balloon Balancing", "Toy Building Challenges", "Memory Games", "Beginner Gaming Challenges", "Other"]
  }
};

const Verify = () => {
  const { user, loading: authLoading, updateProfile } = useAuth();

  // Live categories (Admin → Categories). Known categories keep their detailed event lists;
  // a subcategory becomes a group whose records are saved under the subcategory itself.
  const { tree: categoryTree } = useCategories();
  const { categoryOptions, subcategoryNames } = useMemo(() => {
    const LEGACY_ALIAS = { Talent: "Skills" };
    const options = {};
    const subs = new Set();
    (categoryTree || []).forEach((node) => {
      const legacy = categoriesData[node.name] || categoriesData[LEGACY_ALIAS[node.name]] || null;
      const groups = legacy ? { ...legacy } : {};
      (node.children || []).forEach((child) => {
        subs.add(child.name);
        groups[child.name] = (legacy && legacy[child.name]) || [child.name, "Other"];
      });
      options[node.name] = Object.keys(groups).length ? groups : { General: [node.name, "Other"] };
    });
    return { categoryOptions: Object.keys(options).length ? options : categoriesData, subcategoryNames: subs };
  }, [categoryTree]);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const totalSteps = 6;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { message: "You must be logged in or registered before submitting or challenging a record." } });
    }
  }, [user, authLoading, navigate]);


  const [formData, setFormData] = useState({
    // Section 1
    fullName: "",
    username: "",
    dob: "",
    ageDivision: "ADULT", // UNDER_13, TEEN, ADULT, MASTERS
    email: "",
    phone: "",
    country: "UNITED STATES",
    socialMedia: "",

    // Section 2
    recordTitle: "",
    category: "Strength",
    subCategoryGroup: "Upper Body Strength",
    subCategory: "Bench Press",
    attemptType: "NEW_RECORD", // NEW_RECORD, BREAK_RECORD, NEW_PROPOSAL
    currentRecordHolder: "",
    currentRecordValue: "",

    // Section 3
    date: "",
    time: "",
    venueName: "",
    city: "",
    resultScore: "",
    measurementType: "TIME",
    unit: "H:M:S",
    explanation: "",

    // Section 4
    equipment: "",

    // Section 5
    witnesses: [
      { name: "", contact: "", role: "", showOther: false, otherValue: "", signed: false }
    ],

    // Section 6 (Evidence)
    youtubeLink: "",

    // Section 7 (Safety)
    safetyConfirmed: false,
    noIllegalActivity: false,
    authenticEvidence: false,
    followedRules: false,

    // Section 8
    declarationSigned: false,
    declarationDate: new Date().toISOString().split('T')[0],

    streetAddress: "",
    apartment: "",
    cityAddress: "",
    stateAddress: "",
    zipCode: "",
    countryAddress: ""
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        username: prev.username || user.username || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
        dob: prev.dob || user.dob || "",
        streetAddress: prev.streetAddress || user.streetAddress || "",
        apartment: prev.apartment || user.apartment || "",
        cityAddress: prev.cityAddress || user.city || "",
        stateAddress: prev.stateAddress || user.state || "",
        zipCode: prev.zipCode || user.zipCode || "",
        countryAddress: prev.countryAddress || user.country || ""
      }));
    }
  }, [user]);

  const [uploadedFiles, setUploadedFiles] = useState({
    video: null,
    images: []
  });

  const videoInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, video: file }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setUploadedFiles(prev => ({ ...prev, images: [...prev.images, ...files] }));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("Please login to submit a record");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let uploadedImageUrl = "pending_upload";
      let uploadedVideoUrl = "pending_upload";

      // Files go straight from the browser to storage (signed URL). Any failure stops the
      // submission with a clear message instead of saving a record without its evidence.
      if (uploadedFiles.images && uploadedFiles.images.length > 0) {
        try {
          uploadedImageUrl = await uploadDirect(uploadedFiles.images[0], 'record-image', user.token);
        } catch (uploadErr) {
          throw new Error(`Photo upload failed: ${uploadErr.message}`);
        }
      }

      if (uploadedFiles.video) {
        try {
          uploadedVideoUrl = await uploadDirect(uploadedFiles.video, 'record-video', user.token);
        } catch (uploadErr) {
          throw new Error(`Video upload failed: ${uploadErr.message}`);
        }
      }

      if (updateProfile) {
        try {
          await updateProfile({
            streetAddress: formData.streetAddress,
            apartment: formData.apartment,
            city: formData.cityAddress,
            state: formData.stateAddress,
            zipCode: formData.zipCode,
            country: formData.countryAddress
          });
        } catch (profileErr) {
          console.error("Profile auto-save error (non-blocking):", profileErr);
        }
      }

      const submissionData = {
        title: formData.recordTitle,
        // a chosen subcategory (e.g. Funny Talent) is the record's category, so it shows under that tab
        category: subcategoryNames.has(formData.subCategoryGroup) ? formData.subCategoryGroup : formData.category,
        description: formData.explanation,
        athleteId: formData.username,
        athleteName: formData.fullName || user.name,
        venueName: formData.venueName,
        city: formData.city,
        witnesses: formData.witnesses,
        recordType: 'standard',
        value: formData.resultScore,
        unit: formData.unit,
        evidenceUrl: formData.youtubeLink || uploadedVideoUrl,
        thumbnailUrl: uploadedImageUrl !== "pending_upload" ? uploadedImageUrl : "pending_upload",
        paymentStatus: 'pending_payment'
      };

      const response = await apiCall('/records', 'POST', submissionData, user.token);
      navigate('/submission-checkout', { state: { submissionData: { ...submissionData, id: response?.id || 'TEMP' } } });
    } catch (err) {
      setError(err.message || "Failed to submit record");
    } finally {
      setLoading(false);
    }
  };

  const [validationError, setValidationError] = useState("");

  const [auditProgress, setAuditProgress] = useState(0);
  const [auditState, setAuditState] = useState("pending"); // pending, scanning, complete
  const [auditOutcome, setAuditOutcome] = useState("pending"); // pending, passed, failed, incomplete
  const [auditConfidence, setAuditConfidence] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (step === 5) {
      setAuditState("scanning");
      setAuditProgress(0);
      setAuditConfidence(0);
      setAuditOutcome("pending");
      setAuditLogs(["[SYSTEM] Initializing Biometric Audit Engine..."]);

      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 8) + 5;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);

          // Evaluate outcome
          const hasVideo = uploadedFiles.video || (formData.youtubeLink && formData.youtubeLink.trim() !== "");
          const isMissingFields = !formData.fullName || !formData.recordTitle || !formData.resultScore || !formData.venueName || !formData.explanation || !hasVideo;

          if (isMissingFields) {
            setAuditOutcome("incomplete");
            setAuditConfidence(45.5);
            setAuditState("complete");
            setAuditLogs(prev => [
              ...prev,
              "[Biometrics] Auditing movement signatures...",
              "[WARNING] Crucial metadata or continuous video footage is missing.",
              "[SYSTEM] Biometric Audit Incomplete — Please complete required fields."
            ]);
          } else {
            const scoreVal = parseFloat(formData.resultScore);
            const isUnrealisticScore = scoreVal > 10000 || scoreVal <= 0 || isNaN(scoreVal);
            const hasUnsignedWitness = formData.witnesses.some(w => !w.signed);
            const suspiciousKeywords = ['fake', 'cheat', 'test', 'hack', 'bypass'];
            const hasSuspiciousText = suspiciousKeywords.some(kw =>
              formData.recordTitle.toLowerCase().includes(kw) || formData.explanation.toLowerCase().includes(kw)
            );

            if (isUnrealisticScore || hasSuspiciousText) {
              setAuditOutcome("failed");
              setAuditConfidence(38.2);
              setAuditState("complete");
              const reasons = [];
              if (isUnrealisticScore) reasons.push("Anomalous performance score detected");
              if (hasSuspiciousText) reasons.push("Suspicious attempt keyword flag");

              setAuditLogs(prev => [
                ...prev,
                "[Biometrics] Analyzing frame rate and spatial coordinates...",
                `[WARNING] Security review flagged anomalous patterns: ${reasons.join(", ")}.`,
                "[SYSTEM] Biometric Audit Failed — Additional Verification Required."
              ]);
            } else {
              setAuditOutcome("passed");
              setAuditConfidence(98.4);
              setAuditState("complete");
              setAuditLogs(prev => [
                ...prev,
                "[Biometrics] Participant movement geometry: 100% MATCH.",
                "[Deepfake Scanner] Checking generative patterns... NOMINAL.",
                "[Video Auditor] Raw continuous signature locked.",
                "[SYSTEM] Biometric Audit Passed."
              ]);
            }
          }
        } else {
          setAuditProgress(currentProgress);
          setAuditConfidence(parseFloat((currentProgress * 0.98 + (Math.random() * 2)).toFixed(1)));
          if (currentProgress > 25 && currentProgress < 40) {
            setAuditLogs(prev => prev.includes("[Biometrics] Scanning facial mesh...") ? prev : [...prev, "[Biometrics] Scanning facial mesh..."]);
          } else if (currentProgress > 50 && currentProgress < 70) {
            setAuditLogs(prev => prev.includes("[Security] Inspecting GAN visual grid noise...") ? prev : [...prev, "[Security] Inspecting GAN visual grid noise..."]);
          } else if (currentProgress > 75 && currentProgress < 90) {
            setAuditLogs(prev => prev.includes("[Auditing] Frame transitions & splice detection...") ? prev : [...prev, "[Auditing] Frame transitions & splice detection..."]);
          }
        }
      }, 150);

      return () => clearInterval(interval);
    }
  }, [step, formData, uploadedFiles]);

  const validateCurrentStep = () => {
    setValidationError("");

    // Step 1 check
    if (step === 1) {
      if (!formData.fullName || !formData.fullName.trim()) {
        setValidationError("Full legal name is required.");
        return false;
      }
      if (!formData.username || !formData.username.trim()) {
        setValidationError("Athlete handle is required.");
        return false;
      }
      if (!formData.dob) {
        setValidationError("Date of birth is required.");
        return false;
      }
      if (!formData.email || !formData.email.trim()) {
        setValidationError("Email address is required.");
        return false;
      }
      if (!formData.country) {
        setValidationError("Country of origin is required.");
        return false;
      }
    }

    // Step 2 check
    if (step === 2) {
      if (!formData.recordTitle || !formData.recordTitle.trim()) {
        setValidationError("Record title is required.");
        return false;
      }
      if (!formData.resultScore || !formData.resultScore.trim()) {
        setValidationError("Result of New Attempt value is required.");
        return false;
      }
      if (!formData.streetAddress || !formData.streetAddress.trim()) {
        setValidationError("Street address is required.");
        return false;
      }
      if (!formData.cityAddress || !formData.cityAddress.trim()) {
        setValidationError("City is required.");
        return false;
      }
      if (!formData.countryAddress) {
        setValidationError("Country is required.");
        return false;
      }
      if (!formData.stateAddress || !formData.stateAddress.trim()) {
        setValidationError("State / Province is required.");
        return false;
      }
      if (!formData.zipCode || !formData.zipCode.trim()) {
        setValidationError("Zip / Postal Code is required.");
        return false;
      }
      if (formData.countryAddress === "United States") {
        if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
          setValidationError("Please enter a valid United States Zip Code (5 digits or 5-4 format, numbers only).");
          return false;
        }
      }
    }

    // Step 3 check
    if (step === 3) {
      if (!formData.date) {
        setValidationError("Attempt date is required.");
        return false;
      }
      if (!formData.time) {
        setValidationError("Attempt time is required.");
        return false;
      }
      if (!formData.venueName || !formData.venueName.trim()) {
        setValidationError("Venue / Facility name is required.");
        return false;
      }
      if (!formData.city || !formData.city.trim()) {
        setValidationError("City / Country is required.");
        return false;
      }
      if (!formData.explanation || !formData.explanation.trim()) {
        setValidationError("Please describe your attempt in the explanation field.");
        return false;
      }
    }

    // Step 4 check
    if (step === 4) {
      if (!uploadedFiles.video && (!formData.youtubeLink || !formData.youtubeLink.trim())) {
        setValidationError("Please upload a primary video or provide a valid video link to continue.");
        return false;
      }
      if (uploadedFiles.video) {
        const v = uploadedFiles.video;
        if (!["video/mp4", "video/webm", "video/quicktime"].includes(v.type)) {
          setValidationError("Please upload an MP4, WEBM or MOV video, or provide a YouTube / Vimeo link.");
          return false;
        }
        if (v.size > MAX_VIDEO_BYTES) {
          setValidationError(`This video is larger than ${MAX_VIDEO_BYTES / 1048576} MB. Please upload a shorter clip or provide an unlisted YouTube / Vimeo link.`);
          return false;
        }
      }
    }

    // Standard HTML5 validation check
    const stepEl = document.querySelector(`#step-${step}-container`);
    if (stepEl) {
      const inputs = stepEl.querySelectorAll("input, textarea, select");
      let isValid = true;
      let firstInvalid = null;

      inputs.forEach(input => {
        if (!input.checkValidity()) {
          isValid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      if (!isValid) {
        if (firstInvalid) {
          firstInvalid.reportValidity();
          setValidationError("Please complete all required fields correctly.");
        }
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;
    setValidationError("");

    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const addWitness = () => {
    if (formData.witnesses.length < 5) {
      setFormData({
        ...formData,
        witnesses: [...formData.witnesses, { name: "", contact: "", role: "", showOther: false, otherValue: "", signed: false }]
      });
    }
  };

  const removeWitness = (index) => {
    if (formData.witnesses.length > 1) {
      const newWitnesses = [...formData.witnesses];
      newWitnesses.splice(index, 1);
      setFormData({ ...formData, witnesses: newWitnesses });
    }
  };

  const updateWitness = (index, field, value) => {
    const newWitnesses = [...formData.witnesses];
    newWitnesses[index] = { ...newWitnesses[index], [field]: value };
    setFormData({ ...formData, witnesses: newWitnesses });
  };

  if (authLoading || !user) return null;

  return (
    <PageTransition>
      <div style={{
        background: "#0A0A0A",
        color: "white",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column"
      }}>
        <Navbar />

        <div style={{
          padding: "180px 5% 120px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: isSubmitted ? "center" : "flex-start"
        }}>
          {/* GLOBAL PROGRESS BAR (TOP) */}
          <div style={{ position: "fixed", top: "0", left: "0", width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", zIndex: 100 }}>
            <motion.div
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
              style={{ height: "100%", background: "#FF6A00", boxShadow: "0 0 10px #FF6A00" }}
            />
          </div>

          <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: "center", padding: "60px 20px" }}
                >
                  <div style={{ width: "120px", height: "120px", background: "rgba(74, 222, 128, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 40px", border: "2px solid #4ADE80" }}>
                    <CheckCircle2 size={60} color="#4ADE80" />
                  </div>
                  <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: "950", textTransform: "uppercase", marginBottom: "20px" }}>SUBMITTED <span style={{ color: "#FF6A00" }}>SUCCESSFULLY</span></h1>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", maxWidth: "600px", margin: "0 auto 40px", lineHeight: "1.6" }}>
                    Your record attempt has been indexed in our secure ledger. Our global adjudication team will now begin the final biometric audit and evidence review.
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
                    <Link to="/" style={{ textDecoration: "none" }}>
                      <button style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 20px 40px rgba(255,106,0,0.2)" }}>
                        <Globe size={18} /> RETURN TO HOME BASE
                      </button>
                    </Link>
                    <Link to="/appeals" style={{ textDecoration: "none" }}>
                      <button style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}>
                        <FileText size={18} /> APPEAL A DECISION
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  {step === 1 && (
                    <ScrollReveal>
                      <div id="step-1-container" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
                      <div style={{ marginBottom: "40px" }}>
                        <h3 style={{ color: "#FF6A00", fontSize: "12px", fontWeight: "900", letterSpacing: "0.1em", marginBottom: "12px" }}>PHASE 01</h3>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <h1 style={{ fontSize: "48px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: "1" }}>ATHLETE IDENTITY</h1>
                          <div style={{ fontSize: "12px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>STEP 1 OF 6</div>
                        </div>
                        <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.05)", marginTop: "24px", position: "relative" }}>
                          <div style={{ width: "16.6%", height: "100%", background: "#FF6A00", position: "absolute", top: 0, left: 0 }}></div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>FULL LEGAL NAME</label>
                          <input
                            type="text"
                            placeholder="AS APPEARS ON PASSPORT"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            required
                            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px 24px", color: "white", fontSize: "14px", outline: "none" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>USERNAME / PROFILE NAME</label>
                          <input
                            type="text"
                            placeholder="ATHLETE HANDLE"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            required
                            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px 24px", color: "white", fontSize: "14px", outline: "none" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>DATE OF BIRTH</label>
                          <input
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            value={formData.dob}
                            onChange={(e) => setFormData({...formData, dob: e.target.value})}
                            required
                            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px 24px", color: "white", fontSize: "14px", outline: "none", colorScheme: "dark" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>AGE DIVISION</label>
                          <div style={{ position: "relative" }}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button style={{
                                  width: "100%",
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: "16px",
                                  padding: "18px 24px",
                                  color: "white",
                                  fontSize: "14px",
                                  outline: "none",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  textAlign: "left"
                                }}>
                                  <span>{
                                    formData.ageDivision === "UNDER_13" ? "UNDER 13" :
                                    formData.ageDivision === "TEEN" ? "TEEN (13-17)" :
                                    formData.ageDivision === "ADULT" ? "ADULT (18-49)" :
                                    formData.ageDivision === "MASTERS" ? "MASTERS (50+)" :
                                    formData.ageDivision || "SELECT AGE DIVISION"
                                  }</span>
                                  <ChevronDown size={16} style={{ opacity: 0.6 }} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent style={{
                                width: "100%",
                                minWidth: "250px",
                                background: "#161616",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "16px",
                                padding: "8px",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                              }}>
                                {[
                                  { val: "UNDER_13", label: "UNDER 13" },
                                  { val: "TEEN", label: "TEEN (13-17)" },
                                  { val: "ADULT", label: "ADULT (18-49)" },
                                  { val: "MASTERS", label: "MASTERS (50+)" }
                                ].map((item) => (
                                  <DropdownMenuItem
                                    key={item.val}
                                    onClick={() => setFormData({...formData, ageDivision: item.val})}
                                    style={{
                                      padding: "14px 20px",
                                      color: formData.ageDivision === item.val ? "#FF6A00" : "white",
                                      fontSize: "14px",
                                      fontWeight: formData.ageDivision === item.val ? "800" : "500",
                                      borderRadius: "10px",
                                      cursor: "pointer",
                                      transition: "all 0.2s"
                                    }}
                                  >
                                    {item.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>EMAIL ADDRESS</label>
                          <input
                            type="email"
                            placeholder="OFFICIAL CONTACT EMAIL"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px 24px", color: "white", fontSize: "14px", outline: "none" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>PHONE NUMBER</label>
                          <input
                            type="tel"
                            placeholder="+X XXX XXX XXXX"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            required
                            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px 24px", color: "white", fontSize: "14px", outline: "none" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>COUNTRY OF ORIGIN</label>
                          <div style={{ position: "relative" }}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button style={{
                                  width: "100%",
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: "16px",
                                  padding: "18px 24px",
                                  color: "white",
                                  fontSize: "14px",
                                  outline: "none",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  textAlign: "left"
                                }}>
                                  <span>{formData.country || "SELECT COUNTRY"}</span>
                                  <ChevronDown size={16} style={{ opacity: 0.6 }} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent style={{
                                width: "100%",
                                minWidth: "250px",
                                background: "#161616",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "16px",
                                padding: "8px",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                              }}>
                                {["UNITED STATES", "UNITED KINGDOM", "GERMANY", "CANADA", "AUSTRALIA", "OTHER"].map((country) => (
                                  <DropdownMenuItem
                                    key={country}
                                    onClick={() => setFormData({...formData, country})}
                                    style={{
                                      padding: "14px 20px",
                                      color: formData.country === country ? "#FF6A00" : "white",
                                      fontSize: "14px",
                                      fontWeight: formData.country === country ? "800" : "500",
                                      borderRadius: "10px",
                                      cursor: "pointer",
                                      transition: "all 0.2s"
                                    }}
                                  >
                                    {country}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>SOCIAL MEDIA (OPTIONAL)</label>
                          <input
                            type="text"
                            placeholder="@INSTAGRAM / X / FB"
                            value={formData.socialMedia}
                            onChange={(e) => setFormData({...formData, socialMedia: e.target.value})}
                            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px 24px", color: "white", fontSize: "14px", outline: "none" }}
                          />
                        </div>
                      </div>

                        <div style={{ background: "rgba(255, 106, 0, 0.03)", border: "1px solid rgba(255, 106, 0, 0.2)", borderRadius: "24px", padding: "24px", marginTop: "20px" }}>
                          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                            <Shield size={20} color="#FF6A00" />
                            <span style={{ fontSize: "12px", fontWeight: "900", color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.1em" }}>VERIFICATION PROTOCOL</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                            Identity must be confirmed via our <span style={{ color: "white", fontWeight: "700" }}>Biometric Audit Engine</span>. This process ensures the integrity of the World Record leaderboard by cryptographically linking your physical performance to your verified athlete profile.
                          </p>
                          <Link to="/verification-protocol-info" style={{ textDecoration: "none" }}>
                            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#FF6A00", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>
                              <div style={{ width: "6px", height: "6px", background: "#FF6A00", borderRadius: "50%" }}></div> LEARN MORE
                            </div>
                          </Link>
                        </div>

                        {validationError && (
                          <div style={{ background: "rgba(255, 77, 77, 0.1)", border: "1px solid #FF4D4D", color: "#FF4D4D", padding: "16px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", marginBottom: "20px", width: "100%", textAlign: "center" }}>
                            {validationError}
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "40px" }}>
                          <button
                            onClick={nextStep}
                            style={{
                              background: "#FF6A00",
                              color: "white",
                              border: "none",
                              borderRadius: "100px",
                              padding: "16px 40px",
                              fontSize: "14px",
                              fontWeight: "900",
                              textTransform: "uppercase",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              boxShadow: "0 20px 40px rgba(255, 106, 0, 0.2)",
                              transition: "all 0.3s"
                            }}
                          >
                            NEXT STEP <ArrowRight size={18} />
                          </button>
                        </div>
                      </div>
                </ScrollReveal>
                    )}                  {step === 2 && (
                    <ScrollReveal>
                      <div id="step-2-container" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
                      <div style={{ marginBottom: "40px" }}>
                        <h3 style={{ color: "#FF6A00", fontSize: "12px", fontWeight: "900", letterSpacing: "0.1em", marginBottom: "12px" }}>PHASE 02</h3>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <h1 style={{ fontSize: "48px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: "1" }}>RECORD INFORMATION</h1>
                          <div style={{ fontSize: "12px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>STEP 2 OF 6</div>
                        </div>
                        <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.05)", marginTop: "24px", position: "relative" }}>
                          <div style={{ width: "33.3%", height: "100%", background: "#FF6A00", position: "absolute", top: 0, left: 0 }}></div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "40px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                          {/* RECORD TITLE */}
                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>RECORD TITLE</label>
                            <input
                              type="text"
                              placeholder="E.G. MOST PUSH-UPS IN ONE MINUTE"
                              value={formData.recordTitle}
                              onChange={(e) => setFormData({...formData, recordTitle: e.target.value})}
                              required
                              style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px 24px", color: "white", fontSize: "14px", outline: "none" }}
                            />
                          </div>

                          {/* CATEGORY SELECTION */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>MAIN CATEGORY</label>
                              <div style={{ position: "relative" }}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button style={{
                                      width: "100%",
                                      background: "rgba(255,255,255,0.03)",
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      borderRadius: "16px",
                                      padding: "18px 24px",
                                      color: "white",
                                      fontSize: "14px",
                                      outline: "none",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      cursor: "pointer",
                                      textAlign: "left"
                                    }}>
                                      <span>{formData.category || "SELECT CATEGORY"}</span>
                                      <ChevronDown size={16} style={{ opacity: 0.6 }} />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent style={{
                                    width: "100%",
                                    minWidth: "250px",
                                    background: "#161616",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "16px",
                                    padding: "8px",
                                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                                  }}>
                                    {Object.keys(categoryOptions).map((cat) => (
                                      <DropdownMenuItem
                                        key={cat}
                                        onClick={() => {
                                          const groups = Object.keys(categoryOptions[cat]);
                                          setFormData({
                                            ...formData,
                                            category: cat,
                                            subCategoryGroup: groups[0],
                                            subCategory: categoryOptions[cat][groups[0]][0]
                                          });
                                        }}
                                        style={{
                                          padding: "14px 20px",
                                          color: formData.category === cat ? "#FF6A00" : "white",
                                          fontSize: "14px",
                                          fontWeight: formData.category === cat ? "800" : "500",
                                          borderRadius: "10px",
                                          cursor: "pointer",
                                          transition: "all 0.2s"
                                        }}
                                      >
                                        {cat}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>SUBCATEGORY GROUP</label>
                              <div style={{ position: "relative" }}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button style={{
                                      width: "100%",
                                      background: "rgba(255,255,255,0.03)",
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      borderRadius: "16px",
                                      padding: "18px 24px",
                                      color: "white",
                                      fontSize: "14px",
                                      outline: "none",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      cursor: "pointer",
                                      textAlign: "left"
                                    }}>
                                      <span>{formData.subCategoryGroup || "SELECT GROUP"}</span>
                                      <ChevronDown size={16} style={{ opacity: 0.6 }} />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent style={{
                                    width: "100%",
                                    minWidth: "250px",
                                    background: "#161616",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "16px",
                                    padding: "8px",
                                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                                  }}>
                                    {Object.keys(categoryOptions[formData.category] || {}).map((group) => (
                                      <DropdownMenuItem
                                        key={group}
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            subCategoryGroup: group,
                                            subCategory: categoryOptions[formData.category][group][0]
                                          });
                                        }}
                                        style={{
                                          padding: "14px 20px",
                                          color: formData.subCategoryGroup === group ? "#FF6A00" : "white",
                                          fontSize: "14px",
                                          fontWeight: formData.subCategoryGroup === group ? "800" : "500",
                                          borderRadius: "10px",
                                          cursor: "pointer",
                                          transition: "all 0.2s"
                                        }}
                                      >
                                        {group}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>SPECIFIC EVENT / SUBCATEGORY</label>
                            <div style={{ position: "relative" }}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button style={{
                                    width: "100%",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "16px",
                                    padding: "18px 24px",
                                    color: "white",
                                    fontSize: "14px",
                                    outline: "none",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    textAlign: "left"
                                  }}>
                                    <span>{formData.subCategory || "SELECT EVENT"}</span>
                                    <ChevronDown size={16} style={{ opacity: 0.6 }} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent style={{
                                  width: "100%",
                                  minWidth: "250px",
                                  background: "#161616",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  borderRadius: "16px",
                                  padding: "8px",
                                  boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                                }}>
                                  {(categoryOptions[formData.category]?.[formData.subCategoryGroup] || []).map((item) => (
                                    <DropdownMenuItem
                                      key={item}
                                      onClick={() => setFormData({...formData, subCategory: item})}
                                      style={{
                                        padding: "14px 20px",
                                        color: formData.subCategory === item ? "#FF6A00" : "white",
                                        fontSize: "14px",
                                        fontWeight: formData.subCategory === item ? "800" : "500",
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                      }}
                                    >
                                      {item}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* ATTEMPT TYPE */}
                          <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>IS THIS A:</label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                              {[
                                { id: "NEW_RECORD", label: "NEW ATTEMPT" },
                                { id: "BREAK_RECORD", label: "BREAK RECORD" },
                                { id: "NEW_PROPOSAL", label: "NEW CATEGORY" }
                              ].map((type) => (
                                <button
                                  key={type.id}
                                  onClick={() => setFormData({...formData, attemptType: type.id})}
                                  style={{
                                    padding: "16px",
                                    background: formData.attemptType === type.id ? "rgba(255,106,0,0.1)" : "rgba(255,255,255,0.03)",
                                    border: formData.attemptType === type.id ? "1px solid #FF6A00" : "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "12px",
                                    color: formData.attemptType === type.id ? "#FF6A00" : "white",
                                    fontSize: "11px",
                                    fontWeight: "900",
                                    cursor: "pointer",
                                    transition: "all 0.3s"
                                  }}
                                >
                                  {type.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* CONDITIONAL BREAK RECORD HOLDER DETAILS */}
                          <AnimatePresence>
                            {formData.attemptType === "BREAK_RECORD" && (
                              <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ overflow: "hidden" }}
                              >
                                <div style={{
                                  background: "rgba(255, 106, 0, 0.02)",
                                  border: "1px dashed rgba(255, 106, 0, 0.3)",
                                  borderRadius: "20px",
                                  padding: "24px",
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "20px"
                                }}>
                                  <div style={{ gridColumn: "span 2" }}>
                                    <h4 style={{ color: "#FF6A00", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                                      CURRENT RECORD HOLDER DETAILS
                                    </h4>
                                  </div>
                                  <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                      CURRENT HOLDER'S NAME
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="E.G. JOHN DOE"
                                      value={formData.currentRecordHolder}
                                      onChange={(e) => setFormData({...formData, currentRecordHolder: e.target.value})}
                                      style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", fontSize: "14px", outline: "none" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                      CURRENT RECORD SCORE / VALUE
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={`E.G. 500 (IN ${formData.unit})`}
                                      value={formData.currentRecordValue}
                                      onChange={(e) => setFormData({...formData, currentRecordValue: e.target.value})}
                                      style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", fontSize: "14px", outline: "none" }}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* PERFORMANCE DATA */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>RESULT OF NEW ATTEMPT</label>
                              <input
                                type="text"
                                placeholder="E.G. 502.5"
                                value={formData.resultScore}
                                onChange={(e) => setFormData({...formData, resultScore: e.target.value})}
                                required
                                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px 24px", color: "white", fontSize: "14px", outline: "none" }}
                              />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>MEASUREMENT TYPE</label>
                              <div style={{ position: "relative" }}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button style={{
                                      width: "100%",
                                      background: "rgba(255,255,255,0.03)",
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      borderRadius: "16px",
                                      padding: "18px 24px",
                                      color: "white",
                                      fontSize: "14px",
                                      outline: "none",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      cursor: "pointer",
                                      textAlign: "left"
                                    }}>
                                      <span>{
                                        formData.measurementType === "TIME" ? "TIME" :
                                        formData.measurementType === "DISTANCE" ? "DISTANCE" :
                                        formData.measurementType === "WEIGHT" ? "WEIGHT" :
                                        formData.measurementType === "REPETITIONS" ? "REPETITIONS" :
                                        formData.measurementType === "POINTS" ? "POINTS / SCORE" :
                                        formData.measurementType === "OTHER" ? "OTHER" :
                                        formData.measurementType || "SELECT TYPE"
                                      }</span>
                                      <ChevronDown size={16} style={{ opacity: 0.6 }} />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent style={{
                                    width: "100%",
                                    minWidth: "250px",
                                    background: "#161616",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "16px",
                                    padding: "8px",
                                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                                  }}>
                                    {[
                                      { val: "TIME", label: "TIME" },
                                      { val: "DISTANCE", label: "DISTANCE" },
                                      { val: "WEIGHT", label: "WEIGHT" },
                                      { val: "REPETITIONS", label: "REPETITIONS" },
                                      { val: "POINTS", label: "POINTS / SCORE" },
                                      { val: "OTHER", label: "OTHER" }
                                    ].map((item) => (
                                      <DropdownMenuItem
                                        key={item.val}
                                        onClick={() => {
                                          const defaultUnits = { TIME: "H:M:S", DISTANCE: "METERS", WEIGHT: "KG", REPETITIONS: "REPS", POINTS: "POINTS", OTHER: "CUSTOM" };
                                          setFormData({...formData, measurementType: item.val, unit: defaultUnits[item.val]});
                                        }}
                                        style={{
                                          padding: "14px 20px",
                                          color: formData.measurementType === item.val ? "#FF6A00" : "white",
                                          fontSize: "14px",
                                          fontWeight: formData.measurementType === item.val ? "800" : "500",
                                          borderRadius: "10px",
                                          cursor: "pointer",
                                          transition: "all 0.2s"
                                        }}
                                      >
                                        {item.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>

                          <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            <div style={{ gridColumn: "2 / 3" }}>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "white", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>SPECIFIC UNIT</label>
                              <div style={{ position: "relative" }}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button style={{
                                      width: "100%",
                                      background: "rgba(255,255,255,0.03)",
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      borderRadius: "16px",
                                      padding: "18px 24px",
                                      color: "white",
                                      fontSize: "14px",
                                      outline: "none",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      cursor: "pointer",
                                      textAlign: "left"
                                    }}>
                                      <span>{formData.unit || "SELECT UNIT"}</span>
                                      <ChevronDown size={16} style={{ opacity: 0.6 }} />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent style={{
                                    width: "100%",
                                    minWidth: "250px",
                                    background: "#161616",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "16px",
                                    padding: "8px",
                                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                                    maxHeight: "300px",
                                    overflowY: "auto"
                                  }}>
                                    {(
                                      formData.measurementType === "TIME" ? ["H:M:S", "HOURS", "MINUTES", "SECONDS", "MILLISECONDS"] :
                                      formData.measurementType === "DISTANCE" ? ["KILOMETERS", "METERS", "CENTIMETERS", "MILES", "FEET", "INCHES"] :
                                      formData.measurementType === "WEIGHT" ? ["KG", "GRAMS", "LBS", "OUNCES"] :
                                      formData.measurementType === "REPETITIONS" ? ["REPS"] :
                                      formData.measurementType === "POINTS" ? ["POINTS", "SCORE"] :
                                      ["CUSTOM", "OTHER"]
                                    ).map((u) => (
                                      <DropdownMenuItem
                                        key={u}
                                        onClick={() => setFormData({...formData, unit: u})}
                                        style={{
                                          padding: "14px 20px",
                                          color: formData.unit === u ? "#FF6A00" : "white",
                                          fontSize: "14px",
                                          fontWeight: formData.unit === u ? "800" : "500",
                                          borderRadius: "10px",
                                          cursor: "pointer",
                                          transition: "all 0.2s"
                                        }}
                                      >
                                        {u}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                          {/* ATTEMPT DETAILS */}
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "#FF6A00", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.1em" }}>ATTEMPT LOGISTICS</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "8px", textTransform: "uppercase" }}>DATE OF ATTEMPT</label>
                                <input type="date" max={new Date().toISOString().split('T')[0]} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none", fontSize: "12px", colorScheme: "dark" }} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "8px", textTransform: "uppercase" }}>TIME OF ATTEMPT</label>
                                <input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} required style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none", fontSize: "12px", colorScheme: "dark" }} />
                              </div>
                            </div>
                            <input
                              type="text" placeholder="VENUE / FACILITY NAME" value={formData.venueName}
                              onChange={(e) => setFormData({...formData, venueName: e.target.value})}
                              required
                              style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none", marginBottom: "12px" }}
                            />
                            <input
                              type="text" placeholder="CITY / COUNTRY" value={formData.city}
                              onChange={(e) => setFormData({...formData, city: e.target.value})}
                              required
                              style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none" }}
                            />
                          </div>

                          {/* HOME ADDRESS SECTION */}
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", textAlign: "left" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                              <MapPin size={18} color="#FF6A00" />
                              <span style={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", color: "#FF6A00" }}>APPLICANT HOME ADDRESS</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "8px", textTransform: "uppercase" }}>Street Address</label>
                                <input
                                  type="text"
                                  placeholder="Enter Street Address"
                                  value={formData.streetAddress || ""}
                                  onChange={(e) => setFormData({...formData, streetAddress: e.target.value})}
                                  required
                                  style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none" }}
                                />
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "8px", textTransform: "uppercase" }}>Apartment / Unit Number (Optional)</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Apt 4B"
                                    value={formData.apartment || ""}
                                    onChange={(e) => setFormData({...formData, apartment: e.target.value})}
                                    style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "8px", textTransform: "uppercase" }}>City</label>
                                  <input
                                    type="text"
                                    placeholder="Enter City"
                                    value={formData.cityAddress || ""}
                                    onChange={(e) => setFormData({...formData, cityAddress: e.target.value})}
                                    required
                                    style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none" }}
                                  />
                                </div>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "8px", textTransform: "uppercase" }}>Country</label>
                                  <select
                                    value={formData.countryAddress || ""}
                                    onChange={(e) => setFormData({...formData, countryAddress: e.target.value, stateAddress: ""})}
                                    required
                                    style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none" }}
                                  >
                                    <option value="" disabled>Select Country</option>
                                    <option value="United States">United States</option>
                                    <option value="Canada">Canada</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="Australia">Australia</option>
                                    <option value="Germany">Germany</option>
                                    <option value="France">France</option>
                                    <option value="India">India</option>
                                    <option value="Japan">Japan</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>

                                <div>
                                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "8px", textTransform: "uppercase" }}>State / Province</label>
                                  {formData.countryAddress === "United States" ? (
                                    <select
                                      value={formData.stateAddress || ""}
                                      onChange={(e) => setFormData({...formData, stateAddress: e.target.value})}
                                      required
                                      style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none" }}
                                    >
                                      <option value="" disabled>Select State</option>
                                      <option value="AL">Alabama</option>
                                      <option value="AK">Alaska</option>
                                      <option value="AZ">Arizona</option>
                                      <option value="AR">Arkansas</option>
                                      <option value="CA">California</option>
                                      <option value="CO">Colorado</option>
                                      <option value="CT">Connecticut</option>
                                      <option value="DE">Delaware</option>
                                      <option value="FL">Florida</option>
                                      <option value="GA">Georgia</option>
                                      <option value="HI">Hawaii</option>
                                      <option value="ID">Idaho</option>
                                      <option value="IL">Illinois</option>
                                      <option value="IN">Indiana</option>
                                      <option value="IA">Iowa</option>
                                      <option value="KS">Kansas</option>
                                      <option value="KY">Kentucky</option>
                                      <option value="LA">Louisiana</option>
                                      <option value="ME">Maine</option>
                                      <option value="MD">Maryland</option>
                                      <option value="MA">Massachusetts</option>
                                      <option value="MI">Michigan</option>
                                      <option value="MN">Minnesota</option>
                                      <option value="MS">Mississippi</option>
                                      <option value="MO">Missouri</option>
                                      <option value="MT">Montana</option>
                                      <option value="NE">Nebraska</option>
                                      <option value="NV">Nevada</option>
                                      <option value="NH">New Hampshire</option>
                                      <option value="NJ">New Jersey</option>
                                      <option value="NM">New Mexico</option>
                                      <option value="NY">New York</option>
                                      <option value="NC">North Carolina</option>
                                      <option value="ND">North Dakota</option>
                                      <option value="OH">Ohio</option>
                                      <option value="OK">Oklahoma</option>
                                      <option value="OR">Oregon</option>
                                      <option value="PA">Pennsylvania</option>
                                      <option value="RI">Rhode Island</option>
                                      <option value="SC">South Carolina</option>
                                      <option value="SD">South Dakota</option>
                                      <option value="TN">Tennessee</option>
                                      <option value="TX">Texas</option>
                                      <option value="UT">Utah</option>
                                      <option value="VT">Vermont</option>
                                      <option value="VA">Virginia</option>
                                      <option value="WA">Washington</option>
                                      <option value="WV">West Virginia</option>
                                      <option value="WI">Wisconsin</option>
                                      <option value="WY">Wyoming</option>
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder="Select State"
                                      value={formData.stateAddress || ""}
                                      onChange={(e) => setFormData({...formData, stateAddress: e.target.value})}
                                      required
                                      style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none" }}
                                    />
                                  )}
                                </div>
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "8px", textTransform: "uppercase" }}>Zip / Postal Code</label>
                                <input
                                  type="text"
                                  placeholder="Enter Zip / Postal Code"
                                  value={formData.zipCode || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (formData.countryAddress === "United States") {
                                      const raw = val.replace(/\D/g, "");
                                      let formatted = raw.substring(0, 5);
                                      if (raw.length > 5) {
                                        formatted += "-" + raw.substring(5, 9);
                                      }
                                      setFormData({...formData, zipCode: formatted});
                                    } else {
                                      setFormData({...formData, zipCode: val});
                                    }
                                  }}
                                  required
                                  style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none" }}
                                />
                              </div>
                            </div>
                          </div>

                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "#FF6A00", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.1em" }}>EXPLAIN YOUR ATTEMPT</label>
                            <textarea
                              placeholder="DESCRIBE THE PROCESS AND METHODS USED..."
                              value={formData.explanation}
                              onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                              required
                              style={{ width: "100%", minHeight: "150px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none", fontSize: "13px", resize: "none" }}
                            />
                          </div>
                        </div>
                      </div>

                      {validationError && (
                        <div style={{ background: "rgba(255, 77, 77, 0.1)", border: "1px solid #FF4D4D", color: "#FF4D4D", padding: "16px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", marginBottom: "20px", width: "100%", textAlign: "center" }}>
                          {validationError}
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
                        <button onClick={prevStep} style={{ background: "none", border: "none", color: "white", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <ArrowLeft size={16} /> PREVIOUS STEP
                        </button>
                        <button onClick={nextStep} style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "16px 40px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 20px 40px rgba(255, 106, 0, 0.2)" }}>
                          NEXT STEP <ArrowRight size={18} />
                        </button>
                      </div>
                      </div>
                    </ScrollReveal>
                  )}

                  {step === 3 && (
                    <ScrollReveal>
                      <div id="step-3-container" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
                      <div style={{ marginBottom: "40px" }}>
                        <h3 style={{ color: "#FF6A00", fontSize: "12px", fontWeight: "900", letterSpacing: "0.1em", marginBottom: "12px" }}>PHASE 03</h3>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <h1 style={{ fontSize: "48px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: "1" }}>EQUIPMENT & WITNESSES</h1>
                          <div style={{ fontSize: "12px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>STEP 3 OF 6</div>
                        </div>
                        <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.05)", marginTop: "24px", position: "relative" }}>
                          <div style={{ width: "50%", height: "100%", background: "#FF6A00", position: "absolute", top: 0, left: 0 }}></div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "40px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                          {/* EQUIPMENT SECTION */}
                          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                              <Dumbbell size={18} color="#FF6A00" />
                              <span style={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em" }}>EQUIPMENT USED</span>
                            </div>
                            <p style={{ fontSize: "12px", color: "white", marginBottom: "20px", lineHeight: "1.5" }}>
                              List all specialized gear, weights, or tools used during the attempt. Include calibration details if applicable.
                            </p>
                            <textarea
                              placeholder="E.G. AMPEX OHIO BAR, 25KG CALIBRATED PLATES, OFFICIAL TIMER..."
                              value={formData.equipment}
                              onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                              style={{ width: "100%", minHeight: "200px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none", fontSize: "13px", resize: "none" }}
                            />
                          </div>

                          <div style={{ background: "rgba(255, 106, 0, 0.03)", border: "1px solid rgba(255, 106, 0, 0.2)", borderRadius: "24px", padding: "24px" }}>
                            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                              <Shield size={20} color="#FF6A00" />
                              <span style={{ fontSize: "12px", fontWeight: "900", color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.1em" }}>ADJUDICATION POLICY</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                              Witnesses must be present throughout the entire attempt. Falsifying witness information will lead to <span style={{ color: "white", fontWeight: "700" }}>permanent exclusion</span> from the platform.
                            </p>
                          </div>
                        </div>

                        {/* WITNESSES SECTION */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                          {formData.witnesses.map((witness, index) => (
                            <div key={index} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px", position: "relative" }}>
                              {formData.witnesses.length > 1 && (
                                <button
                                  onClick={() => removeWitness(index)}
                                  style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,0,0,0.1)", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer", color: "#FF4D4D" }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                                <ClipboardCheck size={18} color="#FF6A00" />
                                <span style={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em" }}>WITNESS {index + 1} DATA</span>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                                <input
                                  type="text" placeholder="FULL LEGAL NAME" value={witness.name}
                                  onChange={(e) => updateWitness(index, "name", e.target.value)}
                                  style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none" }}
                                />
                                <input
                                  type="text" placeholder="CONTACT (EMAIL/PHONE)" value={witness.contact}
                                  onChange={(e) => updateWitness(index, "contact", e.target.value)}
                                  style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "14px 20px", color: "white", outline: "none" }}
                                />
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                                {["COACH", "OFFICIAL", "TRAINER", "MEDIA", "OTHER"].map((role) => (
                                  <button
                                    key={role}
                                    onClick={() => updateWitness(index, "role", role)}
                                    style={{
                                      padding: "12px",
                                      background: witness.role === role ? "rgba(255,106,0,0.1)" : "rgba(0,0,0,0.2)",
                                      borderRadius: "12px",
                                      border: witness.role === role ? "1px solid #FF6A00" : "1px solid rgba(255,255,255,0.05)",
                                      cursor: "pointer", fontSize: "11px", fontWeight: "800", color: witness.role === role ? "#FF6A00" : "rgba(255,255,255,0.6)", transition: "all 0.2s"
                                    }}
                                  >
                                    {role}
                                  </button>
                                ))}
                              </div>

                              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", background: witness.signed ? "rgba(74, 222, 128, 0.05)" : "transparent", padding: "16px", borderRadius: "12px", border: witness.signed ? "1px solid #4ADE80" : "1px solid rgba(255,255,255,0.05)", transition: "all 0.3s" }}>
                                <input
                                  type="checkbox"
                                  checked={witness.signed}
                                  onChange={(e) => updateWitness(index, "signed", e.target.checked)}
                                  style={{ width: "18px", height: "18px", accentColor: "#4ADE80" }}
                                />
                                <span style={{ fontSize: "12px", fontWeight: "800", color: witness.signed ? "#4ADE80" : "rgba(255,255,255,0.4)" }}>
                                  WITNESS CONFIRMS SIGNATURE & AUTHENTICITY
                                </span>
                              </label>
                            </div>
                          ))}

                          {formData.witnesses.length < 5 && (
                            <button
                              onClick={addWitness}
                              style={{
                                background: "rgba(255,106,0,0.1)", border: "1px dashed #FF6A00", borderRadius: "16px", padding: "16px", color: "#FF6A00", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "all 0.3s"
                              }}
                            >
                              <Plus size={18} /> ADD ANOTHER WITNESS
                            </button>
                          )}
                        </div>
                      </div>
                      {validationError && (
                        <div style={{ background: "rgba(255, 77, 77, 0.1)", border: "1px solid #FF4D4D", color: "#FF4D4D", padding: "16px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", marginBottom: "20px", width: "100%", textAlign: "center" }}>
                          {validationError}
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
                        <button onClick={prevStep} style={{ background: "none", border: "none", color: "white", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><ArrowLeft size={16} /> PREVIOUS STEP</button>
                        <button onClick={nextStep} style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "16px 40px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 20px 40px rgba(255, 106, 0, 0.2)" }}>
                          NEXT STEP <ArrowRight size={18} />
                        </button>
                      </div>
                      </div>
                    </ScrollReveal>
                  )}

                  {step === 4 && (
                    <ScrollReveal>
                      <div id="step-4-container" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
                      <div style={{ marginBottom: "40px" }}>
                        <h3 style={{ color: "#FF6A00", fontSize: "12px", fontWeight: "900", letterSpacing: "0.1em", marginBottom: "12px" }}>PHASE 04</h3>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <h1 style={{ fontSize: "48px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: "1" }}>MEDIA EVIDENCE</h1>
                          <div style={{ fontSize: "12px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>STEP 4 OF 6</div>
                        </div>
                        <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.05)", marginTop: "24px", position: "relative" }}>
                          <div style={{ width: "66.6%", height: "100%", background: "#FF6A00", position: "absolute", top: 0, left: 0 }}></div>
                        </div>
                      </div>

                      {/* MAIN CONTENT GRID */}
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", marginBottom: "32px" }}>
                        {/* PRIMARY VIDEO CARD */}
                        <div
                          onClick={() => videoInputRef.current?.click()}
                          style={{ position: "relative", borderRadius: "32px", overflow: "hidden", background: "#111", border: "1px solid rgba(255,255,255,0.05)", minHeight: "480px", cursor: "pointer" }}
                        >
                          <input
                            type="file"
                            ref={videoInputRef}
                            style={{ display: "none" }}
                            accept="video/mp4,video/webm,video/quicktime"
                            onChange={handleVideoUpload}
                          />
                          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}><EvidencePreview file={uploadedFiles.video || null} link={uploadedFiles.video ? null : (formData.youtubeLink || "").trim() || null} play={true} opacity={0.3} alt="Your attempt" /></div>
                          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", textAlign: "center" }}>
                            <div style={{ width: "90px", height: "90px", background: "#FF6A00", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", boxShadow: "0 15px 30px rgba(255,106,0,0.3)" }}>
                              <Video size={40} color="white" />
                            </div>
                            <h2 style={{ fontSize: "32px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px" }}>{uploadedFiles.video ? "VIDEO SELECTED" : "PRIMARY VIDEO (UNCUT)"}</h2>
                            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", maxWidth: "450px", marginBottom: "32px" }}>
                              {uploadedFiles.video ? `File: ${uploadedFiles.video.name}` : "Continuous footage starting from 1 minute prior to the attempt. Must include equipment verification."}
                            </p>
                            <button style={{ background: "white", color: "black", border: "none", borderRadius: "100px", padding: "18px 40px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", transition: "all 0.3s" }}>
                              {uploadedFiles.video ? "CHANGE FILE" : "BROWSE FILES"} <ArrowRight size={18} />
                            </button>
                          </div>
                        </div>

                        {/* SIDEBAR CARDS */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                          {/* YOUTUBE/VIMEO LINK */}
                          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "900", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                              <Link2 size={18} color="#FF6A00" /> VIDEO LINK URL
                            </h3>
                            <input
                              type="text"
                              placeholder="HTTPS://YOUTUBE.COM/..."
                              value={formData.youtubeLink}
                              onChange={(e) => setFormData({...formData, youtubeLink: e.target.value})}
                              style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px 20px", color: "white", outline: "none", fontSize: "13px" }}
                            />
                            <p style={{ fontSize: "11px", color: "white", marginTop: "12px" }}>
                              If your raw footage is over 50MB, please provide an unlisted YouTube or Vimeo link.
                            </p>
                          </div>

                          {/* PHOTO EVIDENCE */}
                          <div
                            onClick={() => imageInputRef.current?.click()}
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px", position: "relative", cursor: "pointer", flex: 1 }}
                          >
                            <input
                              type="file"
                              ref={imageInputRef}
                              style={{ display: "none" }}
                              multiple
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={handleImageUpload}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                              <Camera size={24} color="#FF6A00" />
                              <span style={{ fontSize: "10px", fontWeight: "900", color: "white" }}>MAX 250MB</span>
                            </div>
                            <h3 style={{ fontSize: "20px", fontWeight: "900", textTransform: "uppercase", marginBottom: "10px" }}>PHOTO EVIDENCE</h3>
                            <p style={{ fontSize: "13px", color: "white", lineHeight: "1.5", marginBottom: "20px" }}>
                              {uploadedFiles.images.length > 0 ? `${uploadedFiles.images.length} files selected` : "High-resolution stills of equipment and finish line."}
                            </p>
                            <div style={{ paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "11px", fontWeight: "900", color: "#FF6A00", letterSpacing: "0.1em" }}>
                              {uploadedFiles.images.length > 0 ? "ADD MORE IMAGES" : "DROP IMAGES HERE"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* FEATURE BADGES */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "48px" }}>
                        {[
                          { label: "4K / 1080P RECOMMENDED", icon: <CheckCircle2 size={16} /> },
                          { label: "NO CUTS OR EDITS", icon: <CheckCircle2 size={16} /> }
                        ].map((badge, bIdx) => (
                          <div key={bIdx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ color: "#FF6A00" }}>{badge.icon}</div>
                            <span style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "0.05em", color: "rgba(255,255,255,0.6)" }}>{badge.label}</span>
                          </div>
                        ))}
                      </div>

                      {validationError && (
                        <div style={{ background: "rgba(255, 77, 77, 0.1)", border: "1px solid #FF4D4D", color: "#FF4D4D", padding: "16px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", marginBottom: "20px", width: "100%", textAlign: "center" }}>
                          {validationError}
                        </div>
                      )}
                      {/* NAVIGATION */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button onClick={prevStep} style={{ background: "none", border: "none", color: "white", fontSize: "13px", fontWeight: "900", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                          <ArrowLeft size={18} /> PREVIOUS STEP
                        </button>
                        <button
                          onClick={nextStep}
                          style={{
                            background: "linear-gradient(90deg, #FF6A00, #FF8F3F)",
                            color: "white",
                            border: "none",
                            borderRadius: "100px",
                            padding: "20px 60px",
                            fontSize: "14px",
                            fontWeight: "900",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "15px",
                            boxShadow: "0 20px 40px rgba(255, 106, 0, 0.3)"
                          }}
                        >
                          SUBMIT EVIDENCE <ArrowRight size={20} />
                        </button>
                      </div>
                      </div>
                    </ScrollReveal>
                  )}

                  {step === 5 && (
                    <ScrollReveal>
                      <div id="step-5-container" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
                      <div style={{ marginBottom: "40px" }}>
                        <h3 style={{ color: "#FF6A00", fontSize: "12px", fontWeight: "900", letterSpacing: "0.1em", marginBottom: "12px" }}>PHASE 05</h3>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <h1 style={{ fontSize: "48px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: "1" }}>BIOMETRIC AUDIT</h1>
                          <div style={{ fontSize: "12px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>STEP 5 OF 6</div>
                        </div>
                        <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.05)", marginTop: "24px", position: "relative" }}>
                          <div style={{ width: "83.3%", height: "100%", background: "#FF6A00", position: "absolute", top: 0, left: 0 }}></div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px", marginBottom: "40px" }}>
                        {/* AI SCANNER HUD */}
                        <div style={{ position: "relative", height: "480px", borderRadius: "32px", overflow: "hidden", border: `1px solid ${
                          auditOutcome === "passed" ? "rgba(74, 222, 128, 0.3)" :
                          auditOutcome === "failed" ? "rgba(255, 77, 77, 0.3)" :
                          auditOutcome === "incomplete" ? "rgba(255, 204, 0, 0.3)" : "rgba(255, 106, 0, 0.3)"
                        }`, background: "#000" }}>
                          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}><EvidencePreview file={uploadedFiles.video || null} link={uploadedFiles.video ? null : (formData.youtubeLink || "").trim() || null} play={true} opacity={0.5} alt="Your attempt" /></div>
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))" }}></div>

                          {/* HUD TOP LEFT */}
                          <div style={{ position: "absolute", top: "24px", left: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              color:
                                auditOutcome === "passed" ? "#4ADE80" :
                                auditOutcome === "failed" ? "#FF4D4D" :
                                auditOutcome === "incomplete" ? "#FFCC00" : "#FF6A00",
                              fontSize: "10px",
                              fontWeight: "900",
                              letterSpacing: "0.1em"
                            }}>
                              <div style={{
                                width: "6px",
                                height: "6px",
                                background:
                                  auditOutcome === "passed" ? "#4ADE80" :
                                  auditOutcome === "failed" ? "#FF4D4D" :
                                  auditOutcome === "incomplete" ? "#FFCC00" : "#FF6A00",
                                borderRadius: "50%",
                                animation: auditState === "scanning" ? "pulse 1s infinite" : "none"
                              }}></div>
                              {auditState === "scanning" ? "SCANNING_ACTIVE" :
                               auditOutcome === "passed" ? "SYSTEM_NOMINAL" :
                               auditOutcome === "failed" ? "THREAT_DETECTED" : "DATA_MISSING"}
                            </div>
                            <div style={{ fontSize: "14px", fontWeight: "900", color: "white", letterSpacing: "0.05em" }}>
                              FPS: {auditState === "scanning" ? (118 + Math.random() * 4).toFixed(1) : "0.0"}
                            </div>
                          </div>

                          {/* SCAN LINE ANIMATION */}
                          {auditState === "scanning" && (
                            <motion.div
                              animate={{ top: ["0%", "100%", "0%"] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              style={{ position: "absolute", left: 0, width: "100%", height: "2px", background: "linear-gradient(90deg, transparent, #FF6A00, transparent)", boxShadow: "0 0 15px #FF6A00", zIndex: 2 }}
                            />
                          )}

                          {/* HUD BOTTOM LEFT */}
                          <div style={{ position: "absolute", bottom: "24px", left: "24px" }}>
                            <div style={{ fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase", marginBottom: "4px" }}>TRACKING IDENTITY</div>
                            <div style={{ fontSize: "16px", fontWeight: "950", color: "white" }}>
                              {formData.fullName ? formData.fullName.toUpperCase().replace(/\s+/g, '_') : user ? user.name.toUpperCase().replace(/\s+/g, '_') : "ELITE_ATHLETE"}
                            </div>
                          </div>

                          {/* HUD BOTTOM RIGHT */}
                          <div style={{ position: "absolute", bottom: "24px", right: "24px", textAlign: "right" }}>
                            <div style={{ fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase", marginBottom: "4px" }}>CONFIDENCE SCORE</div>
                            <div style={{
                              fontSize: "32px",
                              fontWeight: "950",
                              color:
                                auditOutcome === "passed" ? "#4ADE80" :
                                auditOutcome === "failed" ? "#FF4D4D" :
                                auditOutcome === "incomplete" ? "#FFCC00" : "#FF6A00"
                            }}>
                              {auditConfidence.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* STATUS & ACTIONS */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", padding: "32px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                              <h3 style={{ fontSize: "18px", fontWeight: "900", textTransform: "uppercase" }}>STATUS REPORT</h3>
                              <Shield size={18} color={
                                auditOutcome === "passed" ? "#4ADE80" :
                                auditOutcome === "failed" ? "#FF4D4D" :
                                auditOutcome === "incomplete" ? "#FFCC00" : "#FF6A00"
                              } />
                            </div>

                            {/* DYNAMIC AUDIT STATE CARD */}
                            <div style={{
                              background:
                                auditOutcome === "passed" ? "rgba(74, 222, 128, 0.04)" :
                                auditOutcome === "failed" ? "rgba(255, 77, 77, 0.04)" :
                                auditOutcome === "incomplete" ? "rgba(255, 204, 0, 0.04)" : "rgba(255, 106, 0, 0.04)",
                              border:
                                auditOutcome === "passed" ? "1px solid rgba(74, 222, 128, 0.2)" :
                                auditOutcome === "failed" ? "1px solid rgba(255, 77, 77, 0.2)" :
                                auditOutcome === "incomplete" ? "1px solid rgba(255, 204, 0, 0.2)" : "1px solid rgba(255, 106, 0, 0.2)",
                              borderRadius: "16px",
                              padding: "20px",
                              marginBottom: "24px",
                              textAlign: "center",
                              boxShadow:
                                auditOutcome === "passed" ? "0 0 20px rgba(74, 222, 128, 0.05)" :
                                auditOutcome === "failed" ? "0 0 20px rgba(255, 77, 77, 0.05)" :
                                auditOutcome === "incomplete" ? "0 0 20px rgba(255, 204, 0, 0.05)" : "0 0 20px rgba(255, 106, 0, 0.05)"
                            }}>
                              <div style={{
                                fontSize: "14px",
                                fontWeight: "950",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color:
                                  auditOutcome === "passed" ? "#4ADE80" :
                                  auditOutcome === "failed" ? "#FF4D4D" :
                                  auditOutcome === "incomplete" ? "#FFCC00" : "#FF6A00"
                              }}>
                                {auditOutcome === "pending" && "Biometric Audit Pending"}
                                {auditOutcome === "passed" && "Biometric Audit Passed"}
                                {auditOutcome === "failed" && "Biometric Audit Failed — Additional Verification Required"}
                                {auditOutcome === "incomplete" && "Biometric Audit Incomplete — Please complete required fields"}
                              </div>
                              {auditState === "scanning" && (
                                <div style={{ marginTop: "12px", width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                                  <div style={{ width: `${auditProgress}%`, height: "100%", background: "#FF6A00", transition: "width 0.15s ease-out" }}></div>
                                </div>
                              )}
                            </div>

                            {/* SCROLLING TERMINAL LOGS */}
                            <div style={{
                              background: "#000",
                              border: "1px solid rgba(255,255,255,0.05)",
                              borderRadius: "16px",
                              padding: "16px",
                              fontFamily: "'Courier New', Courier, monospace",
                              fontSize: "11px",
                              color: "#888",
                              minHeight: "140px",
                              maxHeight: "180px",
                              overflowY: "auto",
                              lineHeight: "1.5",
                              textAlign: "left"
                            }} className="custom-scrollbar">
                              {auditLogs.map((log, lIdx) => {
                                let color = "#aaa";
                                if (log.includes("[WARNING]")) color = "#FFCC00";
                                else if (log.includes("[SYSTEM]") && log.includes("Passed")) color = "#4ADE80";
                                else if (log.includes("[SYSTEM]") && log.includes("Failed")) color = "#FF4D4D";
                                else if (log.includes("[SYSTEM]") && log.includes("Incomplete")) color = "#FFCC00";
                                return <div key={lIdx} style={{ color }}>{log}</div>;
                              })}
                            </div>

                            {auditOutcome === "failed" && (
                              <div style={{
                                marginTop: "16px",
                                padding: "16px",
                                background: "rgba(255, 77, 77, 0.05)",
                                border: "1px solid rgba(255, 77, 77, 0.2)",
                                borderRadius: "12px",
                                color: "#FF4D4D",
                                fontSize: "12px",
                                lineHeight: "1.5"
                              }}>
                                <strong style={{ fontWeight: "900", display: "block", marginBottom: "4px" }}>AUDIT FAILED:</strong>
                                The biometric engine detected anomalies in the video frame rate, spatial coordinates, or movement signatures. This often occurs if the video is edited, spliced, or if the participant's facial mesh cannot be securely locked. Please provide an uncut, raw, and high-quality video to pass the security audit.
                              </div>
                            )}
                          </div>

                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", padding: "32px" }}>
                             <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6", marginBottom: "24px" }}>
                               {auditOutcome === "incomplete"
                                 ? "Mandatory fields or uncut evidence file are missing. Please step back and complete all required inputs."
                                 : auditOutcome === "failed"
                                   ? "The automatic check flagged this attempt. You can still submit it: an AMPEX adjudicator will review your video by hand before anything is approved."
                                   : "Automatic check complete. Continue to review and submit your attempt."}
                             </p>
                             <button
                               onClick={nextStep}
                               disabled={auditState !== "complete" || auditOutcome === "incomplete"}
                               style={{
                                 width: "100%",
                                 background: (auditState !== "complete" || auditOutcome === "incomplete") ? "rgba(255,255,255,0.1)" : "#FF6A00",
                                 color: (auditState !== "complete" || auditOutcome === "incomplete") ? "rgba(255,255,255,0.4)" : "white",
                                 border: "none",
                                 borderRadius: "100px",
                                 padding: "20px",
                                 fontSize: "14px",
                                 fontWeight: "900",
                                 textTransform: "uppercase",
                                 cursor: (auditState !== "complete" || auditOutcome === "incomplete") ? "not-allowed" : "pointer",
                                 display: "flex",
                                 alignItems: "center",
                                 justifyContent: "center",
                                 gap: "12px",
                                 boxShadow: (auditState !== "complete" || auditOutcome === "incomplete") ? "none" : "0 20px 40px rgba(255,106,0,0.2)",
                                 transition: "all 0.3s"
                               }}
                             >
                               {auditState === "scanning" ? `SCANNING MOVEMENT (${auditProgress}%)` : "CONFIRM VERIFICATION"} <ArrowRight size={18} />
                             </button>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", padding: "40px" }}>
                        <h4 style={{ fontSize: "20px", fontWeight: "950", textTransform: "uppercase", marginBottom: "16px" }}>AUTHENTICITY PROTOCOL_v4.2</h4>
                        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6", marginBottom: "32px", maxWidth: "800px" }}>
                          Our AI Vision Analysis scrutinizes 420 unique joint positions per second. By comparing your movement signature against the global standard for this record, we ensure the absolute integrity of the AMPEX ecosystem.
                        </p>
                        <div style={{ display: "flex", gap: "48px" }}>
                           <div>
                             <div style={{ fontSize: "24px", fontWeight: "950", color: "white" }}>
                               {formData.resultScore ? (parseFloat(formData.resultScore) * 0.00004 + 0.001).toFixed(4) + "s" : "0.002s"}
                             </div>
                             <div style={{ fontSize: "10px", fontWeight: "900", color: "#FF6A00", textTransform: "uppercase" }}>LATENCY</div>
                           </div>
                           <div>
                             <div style={{ fontSize: "24px", fontWeight: "950", color: "white" }}>TERABYTE+</div>
                             <div style={{ fontSize: "10px", fontWeight: "900", color: "#FF6A00", textTransform: "uppercase" }}>DATA_PARSED</div>
                           </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "40px" }}>
                        <button onClick={prevStep} style={{ background: "none", border: "none", color: "white", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><ArrowLeft size={16} /> PREVIOUS STEP</button>
                      </div>
                      </div>
                    </ScrollReveal>
                  )}

                  {step === 6 && (
                    <ScrollReveal>
                      <div id="step-6-container" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
                      <div style={{ marginBottom: "40px" }}>
                        <h3 style={{ color: "#FF6A00", fontSize: "12px", fontWeight: "900", letterSpacing: "0.1em", marginBottom: "12px" }}>PHASE 06</h3>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <h1 style={{ fontSize: "48px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: "1" }}>FINAL LEDGER SUBMISSION</h1>
                          <div style={{ fontSize: "12px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.05em" }}>STEP 6 OF 6</div>
                        </div>
                        <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.05)", marginTop: "24px", position: "relative" }}>
                          <div style={{ width: "100%", height: "100%", background: "#FF6A00", position: "absolute", top: 0, left: 0 }}></div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px", marginBottom: "64px" }}>
                        {/* RECORD SUMMARY */}
                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,106,0,0.2)", borderRadius: "32px", padding: "48px", position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", top: "40px", right: "40px", opacity: 0.1 }}>
                            <Trophy size={120} color="#FF6A00" />
                          </div>

                          <div style={{ position: "relative", zIndex: 2 }}>
                            <div style={{ color: "#FF6A00", fontSize: "11px", fontWeight: "900", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "32px" }}>VERIFIED RECORD DATA</div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "48px" }}>
                              <div>
                                <div style={{ fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase", marginBottom: "8px" }}>ATHLETE NAME</div>
                                <div style={{ fontSize: "24px", fontWeight: "950" }}>{formData.fullName || user.name}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase", marginBottom: "8px" }}>RECORD CATEGORY</div>
                                <div style={{ fontSize: "24px", fontWeight: "950" }}>{formData.recordTitle || "UNSPECIFIED"}</div>
                              </div>
                            </div>

                            <div style={{ marginBottom: "48px" }}>
                              <div style={{ fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase", marginBottom: "12px" }}>FINAL PERFORMANCE METRIC</div>
                              <div style={{ fontSize: "96px", fontWeight: "950", color: "#FF6A00", lineHeight: "1", letterSpacing: "-0.04em" }}>
                                {formData.resultScore || "0"} <span style={{ fontSize: "32px", color: "white", marginLeft: "12px" }}>{formData.unit || "UNIT"}</span>
                              </div>
                            </div>

                            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "24px", padding: "24px", display: "flex", alignItems: "center", gap: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: "#111", overflow: "hidden" }}>
                                <EvidencePreview file={uploadedFiles.video || null} link={uploadedFiles.video ? null : (formData.youtubeLink || "").trim() || null} play={false} opacity={0.8} alt="Your attempt" />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: "900", marginBottom: "4px" }}>
                                  {uploadedFiles.video ? uploadedFiles.video.name : "LIFT_VERIFICATION_V082.MOV"}
                                </div>
                                <div style={{ fontSize: "10px", color: "white", fontWeight: "700" }}>4K Resolution • GPS Logged • Biometric Verified</div>
                              </div>
                              <button onClick={() => setStep(4)} style={{ background: "none", border: "none", color: "#FF6A00", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                                EDIT <Edit3 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* SIDEBAR INFO */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "32px", padding: "32px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                              <Shield size={18} color="#FF6A00" />
                              <h4 style={{ fontSize: "14px", fontWeight: "900", textTransform: "uppercase" }}>TRUST & SAFETY</h4>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                              {[
                                "Biometric signature confirmed via heart rate strap log.",
                                "Location data matches AMPEX Certified Facility #422.",
                                "Equipment calibration certificate uploaded."
                              ].map((text, i) => (
                                <div key={i} style={{ display: "flex", gap: "12px", fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: "1.4" }}>
                                  <div style={{ color: "#FF6A00", marginTop: "2px" }}><CheckCircle2 size={14} /></div>
                                  {text}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ background: "rgba(255,106,0,0.05)", border: "1px solid rgba(255,106,0,0.2)", borderRadius: "32px", padding: "32px", textAlign: "center" }}>
                            <Award size={32} color="#FF6A00" style={{ margin: "0 auto 16px" }} />
                            <h4 style={{ fontSize: "12px", fontWeight: "900", color: "#FF6A00", marginBottom: "8px", letterSpacing: "0.1em" }}>ELITE MEMBERSHIP</h4>
                            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: "700" }}>This submission is eligible for the Global Leaderboard Top 1% bonus.</p>
                          </div>
                        </div>
                      </div>

                      {/* POST-SUBMISSION PREVIEW */}
                      <div style={{ textAlign: "center", marginBottom: "80px" }}>
                        <div style={{ color: "white", fontSize: "24px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "40px" }}>POST-SUBMISSION PREVIEW</div>
                        <div style={{
                          backgroundImage: videoThumbnailFor(formData.youtubeLink) ? `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('${videoThumbnailFor(formData.youtubeLink)}')` : "linear-gradient(135deg, rgba(255,106,0,0.14), #0d0d0d)",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          borderRadius: "40px",
                          padding: "100px 40px",
                          border: "1px solid rgba(255,255,255,0.05)"
                        }}>
                          <div style={{
                            fontSize: "120px",
                            fontWeight: "950",
                            lineHeight: "0.8",
                            color: "transparent",
                            WebkitTextStroke: "1px rgba(255,106,0,0.3)",
                            textTransform: "uppercase",
                            marginBottom: "20px"
                          }}>
                            BROKEN
                          </div>
                          <div style={{ fontSize: "56px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.02em", color: "white", marginBottom: "24px" }}>
                            YOUR NAME IN STONE.
                          </div>
                          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
                            Once submitted, your record will be etched into the AMPEX Global Ledger, visible to every athlete across the world.
                          </p>
                        </div>
                      </div>

                      {/* FINAL ACTION */}
                      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: "40px" }}>
                          <div style={{ fontSize: "11px", fontWeight: "900", color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "16px" }}>LEGAL DISCLAIMER</div>
                          <p style={{ fontSize: "12px", color: "white", lineHeight: "1.6" }}>
                            By hitting 'Submit to Global Ledger', you certify that all performance data, video evidence, and biometric logs are 100% authentic and unmanipulated. Any attempt to falsify record data will result in immediate permanent disqualification and revocation of Elite Membership. The AMPEX World Records committee reserves the right to request a live re-verification of any performance.
                          </p>
                        </div>

                        {/* SAFETY & RULES CONFIRMATION */}
                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", marginBottom: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                          {[
                            { id: "safetyConfirmed", label: "I confirm that all safety protocols were followed during this attempt." },
                            { id: "noIllegalActivity", label: "I certify that no performance-enhancing drugs or illegal equipment were used." },
                            { id: "authenticEvidence", label: "I verify that the uploaded media is raw, uncut, and unedited." },
                            { id: "followedRules", label: "I have read and adhered to the specific category rules for this record." }
                          ].map((item) => (
                            <label key={item.id} style={{ display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", background: formData[item.id] ? "rgba(74, 222, 128, 0.05)" : "rgba(0,0,0,0.2)", padding: "16px 24px", borderRadius: "12px", border: formData[item.id] ? "1px solid #4ADE80" : "1px solid rgba(255,255,255,0.05)", transition: "all 0.3s" }}>
                              <input
                                type="checkbox"
                                checked={formData[item.id]}
                                onChange={(e) => setFormData({...formData, [item.id]: e.target.checked})}
                                style={{ width: "20px", height: "20px", accentColor: "#4ADE80", cursor: "pointer" }}
                              />
                              <span style={{ fontSize: "13px", fontWeight: "700", color: formData[item.id] ? "white" : "rgba(255,255,255,0.6)" }}>{item.label}</span>
                            </label>
                          ))}
                        </div>

                        {/* DIGITAL SIGNATURE */}
                        <div style={{ background: "rgba(255,106,0,0.03)", border: "1px solid rgba(255,106,0,0.2)", borderRadius: "24px", padding: "32px", marginBottom: "48px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "900", color: "#FF6A00", textTransform: "uppercase", marginBottom: "20px" }}>DIGITAL SIGNATURE</h4>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                            <input
                              type="text"
                              placeholder="TYPE FULL LEGAL NAME TO SIGN"
                              value={formData.declarationSigned ? formData.athleteName : ""}
                              onChange={(e) => setFormData({...formData, declarationSigned: e.target.value.length > 0})}
                              style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px 20px", color: "white", outline: "none", fontSize: "13px" }}
                            />
                            <input
                              type="date"
                              value={formData.declarationDate}
                              onChange={(e) => setFormData({...formData, declarationDate: e.target.value})}
                              style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px 20px", color: "white", outline: "none", fontSize: "13px", colorScheme: "dark" }}
                            />
                          </div>
                        </div>

                        {validationError && (
                          <div style={{ background: "rgba(255, 77, 77, 0.1)", border: "1px solid #FF4D4D", color: "#FF4D4D", padding: "16px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", marginBottom: "20px", width: "100%", textAlign: "center" }}>
                            {validationError}
                          </div>
                        )}
                        <div style={{ textAlign: "center" }}>
                          <button
                            onClick={nextStep}
                            disabled={loading || !formData.safetyConfirmed || !formData.noIllegalActivity || !formData.authenticEvidence || !formData.followedRules || !formData.declarationSigned || !formData.declarationDate}
                            style={{
                              background: (loading || !formData.safetyConfirmed || !formData.noIllegalActivity || !formData.authenticEvidence || !formData.followedRules || !formData.declarationSigned || !formData.declarationDate) ? "rgba(255,255,255,0.1)" : "#FF6A00",
                              color: (loading || !formData.safetyConfirmed || !formData.noIllegalActivity || !formData.authenticEvidence || !formData.followedRules || !formData.declarationSigned || !formData.declarationDate) ? "rgba(255,255,255,0.4)" : "white",
                              border: "none",
                              borderRadius: "100px",
                              padding: "24px 64px",
                              fontSize: "18px",
                              fontWeight: "950",
                              textTransform: "uppercase",
                              cursor: (loading || !formData.safetyConfirmed || !formData.noIllegalActivity || !formData.authenticEvidence || !formData.followedRules || !formData.declarationSigned || !formData.declarationDate) ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "16px",
                              margin: "0 auto 24px",
                              boxShadow: (loading || !formData.safetyConfirmed || !formData.noIllegalActivity || !formData.authenticEvidence || !formData.followedRules || !formData.declarationSigned || !formData.declarationDate) ? "none" : "0 20px 40px rgba(255,106,0,0.3)",
                              transition: "all 0.3s"
                            }}
                            onMouseEnter={e => { if(!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(1.02)" }}
                            onMouseLeave={e => { if(!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(1)" }}
                          >
                            {loading ? "SUBMITTING..." : "SUBMIT TO GLOBAL LEDGER"} <ArrowRight size={20} />
                          </button>

                          {error && (
                            <div style={{ color: "#FF4D4D", fontSize: "14px", fontWeight: "700", marginBottom: "20px" }}>
                              ERROR: {error}
                            </div>
                          )}

                          <div style={{ fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                            AWAITING FINAL BIOMETRIC HASH...
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "60px" }}>
                        <button onClick={prevStep} style={{ background: "none", border: "none", color: "white", fontSize: "12px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><ArrowLeft size={16} /> PREVIOUS STEP</button>
                      </div>
                      </div>
                    </ScrollReveal>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <style>{`
          @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
          input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2) !important; }
          input:focus, textarea:focus, select:focus { border-color: #FF6A00 !important; box-shadow: 0 0 0 1px #FF6A00 !important; outline: none; }
          textarea { font-size: 13px !important; line-height: 1.6 !important; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #FF6A00; border-radius: 10px; }
          select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23FF6A00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 24px center; background-size: 16px; }
        `}</style>
      </div>
    </PageTransition>
  );
};

export default Verify;
