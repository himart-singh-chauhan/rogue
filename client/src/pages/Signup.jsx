import { ALL_COUNTRIES } from "../utils/countries";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Zap, Globe, Calendar, MapPin, Loader2, Eye, EyeOff } from "lucide-react";
import Navbar from "../components/Navbar";
import { useEffect, useRef, useState } from "react";
import { apiCall } from "../utils/api";
import Captcha, { captchaOn, captchaMessage } from "../components/Captcha";
import { useAuth } from "../context/AuthContext";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "../components/ui/dropdown-menu";

const Signup = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [weightUnit, setWeightUnit] = useState("kg"); // "kg" or "lbs"
  const [weightVal, setWeightVal] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm"); // "cm" or "ft_in"
  const [heightVal, setHeightVal] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  // Members under 18 need a parent or legal guardian (18+) to approve and manage the account
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianIsAdult, setGuardianIsAdult] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const ageYears = (() => {
    if (!dob) return null;
    const d = new Date(`${dob}T00:00:00`); const n = new Date();
    if (Number.isNaN(d.getTime())) return null;
    let a = n.getFullYear() - d.getFullYear();
    if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a -= 1;
    return a;
  })();
  const isMinor = ageYears !== null && ageYears < 18;
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const { signup } = useAuth();
  const [stats, setStats] = useState(null); // real totals from the database
  useEffect(() => { apiCall("/stats/public", "GET").then(setStats).catch(() => {}); }, []);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!dob || ageYears === null) { setError("Please enter your date of birth."); return; }
    if (!acceptTerms) { setError("Please accept the Terms of Service and Privacy Policy."); return; }
    if (!ageConfirmed) { setError("Please tick the age confirmation statement."); return; }
    if (isMinor && (!guardianName.trim() || !guardianRelationship || !guardianEmail.trim() || !guardianIsAdult)) {
      setError("Members under 18 need a parent or legal guardian: please fill in all of their details.");
      return;
    }
    setLoading(true);
    // wait for the security check to finish rather than asking the visitor to press twice
    const token = captchaOn ? (captchaToken || await captchaRef.current?.getToken(15000)) : "";
    if (captchaOn && !token) {
      setLoading(false);
      setError(captchaMessage(captchaRef.current?.status(), "press the button again"));
      return;
    }
    try {
      const heightValFinal = heightUnit === "cm" ? heightVal : `${heightFt}'${heightIn}"`;
      const result = await signup({
        acceptTerms,
        ageConfirmed,
        ...(isMinor ? { guardianName: guardianName.trim(), guardianRelationship, guardianEmail: guardianEmail.trim(), guardianIsAdult } : {}),
        name,
        email,
        password,
        username,
        phone,
        gender,
        dob,
        weight: weightVal,
        weightUnit,
        height: heightValFinal,
        heightUnit,
        country,
        city,
        captchaToken: token || undefined
      });
      if (result?.pendingGuardian) { setPendingMessage(result.message); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Failed to create profile");
      captchaRef.current?.reset(); // each security check works once
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{
        background: "#0A0A0A",
        color: "white",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 5% 40px",
        position: "relative",
        minHeight: "calc(100vh - 80px)"
      }}>
        {/* BACKGROUND IMAGE */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.15,
          filter: "blur(4px)"
        }} />

        <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "60px", maxWidth: "1200px", width: "100%", alignItems: "start" }}>

          {/* LEFT CONTENT */}
          <div style={{ position: "sticky", top: "120px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255, 106, 0, 0.15)",
              padding: "6px 16px",
              borderRadius: "100px",
              color: "#FF6A00",
              fontSize: "11px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "20px",
              border: "1px solid rgba(255, 106, 0, 0.2)"
            }}>
              <Zap size={14} fill="#FF6A00" /> ELITE REGISTRATION
            </div>

            <h1 style={{
              fontSize: "clamp(40px, 6vw, 80px)",
              fontWeight: "950",
              textTransform: "uppercase",
              lineHeight: "0.85",
              letterSpacing: "-0.04em",
              marginBottom: "20px"
            }}>
              JOIN THE <br />
              <span style={{ color: "white" }}>ELITE</span>
            </h1>

            <p style={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "16px",
              lineHeight: "1.6",
              maxWidth: "450px",
              marginBottom: "40px"
            }}>
              Become a verified member of the world's most prestigious athletic record-keeping platform. Complete your profile to start competing.
            </p>

            {stats && <div style={{ display: "flex", gap: "40px" }}>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "950", color: "white" }}>{Number(stats.verifiedAthletes || 0).toLocaleString()}</div>
                <div style={{ fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>VERIFIED ATHLETES</div>
              </div>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "950", color: "white" }}>{Number(stats.recordsSet || 0).toLocaleString()}</div>
                <div style={{ fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>WORLD RECORDS</div>
              </div>
            </div>}
          </div>

          {/* RIGHT CONTENT - FORM CARD */}
          <div style={{
            background: "rgba(22, 22, 22, 0.8)",
            backdropFilter: "blur(20px)",
            padding: "32px 40px",
            borderRadius: "40px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
            marginTop: "60px"
          }}>
            {pendingMessage ? (
              <div role="status" style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "center", padding: "20px 4px" }}>
                <div style={{ fontSize: "40px" }}>📧</div>
                <div style={{ fontSize: "20px", fontWeight: "950", color: "white" }}>Waiting for your parent or guardian</div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{pendingMessage}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>We also sent you an email to confirm your own address. Once your parent or guardian approves, you can log in.</div>
                <Link to="/login" style={{ color: "#FF6A00", fontWeight: 900, fontSize: "13px" }}>Go to Login</Link>
              </div>
            ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {error && <div style={{ color: "#ff4444", fontSize: "12px", fontWeight: "600", textAlign: "center" }}>{error}</div>}
              
              {/* Row 1: Name & Username */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "6px", textTransform: "uppercase" }}>FULL NAME</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} 
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "6px", textTransform: "uppercase" }}>USERNAME</label>
                  <input 
                    type="text" 
                    placeholder="elite_athlete_01" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} 
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "6px", textTransform: "uppercase" }}>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    placeholder="champion@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} 
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "6px", textTransform: "uppercase" }}>PHONE NUMBER</label>
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 000-0000" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} 
                  />
                </div>
              </div>

              {/* Row 3: Password */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "6px", textTransform: "uppercase" }}>PASSWORD</label>
                <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters, a letter and a number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 96px 12px 16px", color: "white", outline: "none", fontSize: "13px" }}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 900, letterSpacing: "0.05em", padding: 6 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />} {showPassword ? "HIDE" : "SHOW"}
                </button>
                </div>
              </div>

              {/* Row 4: Gender & DOB */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "6px", textTransform: "uppercase" }}>GENDER</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        color: "white",
                        outline: "none",
                        fontSize: "13px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        textAlign: "left"
                      }}>
                        <span>{
                          gender === "male" ? "Male" :
                          gender === "female" ? "Female" :
                          gender === "other" ? "Other" :
                          gender === "prefer_not_to_say" ? "Prefer not to say" :
                          "Select Gender"
                        }</span>
                        <ChevronDown size={14} style={{ opacity: 0.6 }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent style={{
                      width: "100%",
                      minWidth: "180px",
                      background: "#161616",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: "6px",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                    }}>
                      {[
                        { val: "male", label: "Male" },
                        { val: "female", label: "Female" },
                        { val: "other", label: "Other" },
                        { val: "prefer_not_to_say", label: "Prefer not to say" }
                      ].map((item) => (
                        <DropdownMenuItem
                          key={item.val}
                          onClick={() => setGender(item.val)}
                          style={{
                            padding: "10px 14px",
                            color: gender === item.val ? "#FF6A00" : "white",
                            fontSize: "13px",
                            fontWeight: gender === item.val ? "800" : "500",
                            borderRadius: "8px",
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
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "6px", textTransform: "uppercase" }}>DATE OF BIRTH</label>
                  <input 
                    type="date" 
                    max={new Date().toISOString().split('T')[0]}
                    value={dob}
                    required
                    onChange={(e) => setDob(e.target.value)}
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px", colorScheme: "dark" }} 
                  />
                </div>
              </div>

              {isMinor && (
                <div style={{ border: "1px solid rgba(255,106,0,0.4)", background: "rgba(255,106,0,0.06)", borderRadius: "14px", padding: "14px", display: "grid", gap: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "900", color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.05em" }}>Parent or legal guardian (required under 18)</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                    Members under 18 need a parent or legal guardian, who is at least 18, to approve and manage the account. We'll email them a link; the account opens once they approve it.
                  </div>
                  <input placeholder="Parent / guardian full name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} required style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} />
                  <select value={guardianRelationship} onChange={(e) => setGuardianRelationship(e.target.value)} required style={{ width: "100%", background: "#111", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }}>
                    <option value="">Relationship to you…</option>
                    {["Mother", "Father", "Parent", "Legal guardian", "Grandparent", "Other"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input type="email" placeholder="Parent / guardian email address" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} required style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} />
                  <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12px", color: "rgba(255,255,255,0.75)", cursor: "pointer" }}>
                    <input type="checkbox" checked={guardianIsAdult} onChange={(e) => setGuardianIsAdult(e.target.checked)} style={{ accentColor: "#FF6A00", marginTop: "2px" }} />
                    My parent or guardian is at least 18 years old.
                  </label>
                </div>
              )}

              {/* Row 5: Weight & Height */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase" }}>
                      WEIGHT ({weightUnit.toUpperCase()})
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" style={{ 
                          background: "transparent", 
                          border: "none", 
                          color: "#FF6A00", 
                          fontSize: "10px", 
                          fontWeight: "900", 
                          outline: "none", 
                          cursor: "pointer",
                          textTransform: "uppercase",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <span>{weightUnit === "kg" ? "Kilograms (kg)" : "Pounds (lbs)"}</span>
                          <ChevronDown size={10} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent style={{
                        background: "#161616",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        padding: "4px",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
                      }}>
                        <DropdownMenuItem
                          onClick={() => {
                            setWeightUnit("kg");
                            setWeightVal("");
                          }}
                          style={{
                            padding: "8px 12px",
                            color: weightUnit === "kg" ? "#FF6A00" : "white",
                            fontSize: "11px",
                            fontWeight: weightUnit === "kg" ? "800" : "500",
                            borderRadius: "6px",
                            cursor: "pointer"
                          }}
                        >
                          Kilograms (kg)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setWeightUnit("lbs");
                            setWeightVal("");
                          }}
                          style={{
                            padding: "8px 12px",
                            color: weightUnit === "lbs" ? "#FF6A00" : "white",
                            fontSize: "11px",
                            fontWeight: weightUnit === "lbs" ? "800" : "500",
                            borderRadius: "6px",
                            cursor: "pointer"
                          }}
                        >
                          Pounds (lbs)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <input 
                    type="number" 
                    placeholder={weightUnit === "kg" ? "75" : "165"} 
                    value={weightVal}
                    onChange={(e) => setWeightVal(e.target.value)}
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} 
                  />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase" }}>
                      HEIGHT ({heightUnit === "cm" ? "CM" : "FT/IN"})
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" style={{ 
                          background: "transparent", 
                          border: "none", 
                          color: "#FF6A00", 
                          fontSize: "10px", 
                          fontWeight: "900", 
                          outline: "none", 
                          cursor: "pointer",
                          textTransform: "uppercase",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <span>{heightUnit === "cm" ? "Centimeters (cm)" : "Feet & Inches (ft/in)"}</span>
                          <ChevronDown size={10} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent style={{
                        background: "#161616",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        padding: "4px",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
                      }}>
                        <DropdownMenuItem
                          onClick={() => {
                            setHeightUnit("cm");
                            setHeightVal("");
                          }}
                          style={{
                            padding: "8px 12px",
                            color: heightUnit === "cm" ? "#FF6A00" : "white",
                            fontSize: "11px",
                            fontWeight: heightUnit === "cm" ? "800" : "500",
                            borderRadius: "6px",
                            cursor: "pointer"
                          }}
                        >
                          Centimeters (cm)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setHeightUnit("ft_in");
                            setHeightVal("");
                            setHeightFt("");
                            setHeightIn("");
                          }}
                          style={{
                            padding: "8px 12px",
                            color: heightUnit === "ft_in" ? "#FF6A00" : "white",
                            fontSize: "11px",
                            fontWeight: heightUnit === "ft_in" ? "800" : "500",
                            borderRadius: "6px",
                            cursor: "pointer"
                          }}
                        >
                          Feet & Inches (ft'in\")
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {heightUnit === "cm" ? (
                    <input 
                      type="number" 
                      placeholder="180" 
                      value={heightVal}
                      onChange={(e) => setHeightVal(e.target.value)}
                      style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} 
                    />
                  ) : (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input 
                        type="number" 
                        placeholder="Ft" 
                        min="1"
                        max="8"
                        value={heightFt}
                        onChange={(e) => setHeightFt(e.target.value)}
                        style={{ width: "50%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} 
                      />
                      <input 
                        type="number" 
                        placeholder="In" 
                        min="0"
                        max="11"
                        value={heightIn}
                        onChange={(e) => setHeightIn(e.target.value)}
                        style={{ width: "50%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 6: Country & City */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "6px", textTransform: "uppercase" }}>COUNTRY</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        color: "white",
                        outline: "none",
                        fontSize: "13px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        textAlign: "left"
                      }}>
                        <span>{country || "Select Country"}</span>
                        <ChevronDown size={14} style={{ opacity: 0.6 }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent style={{
                      width: "100%",
                      minWidth: "220px",
                      maxHeight: "300px",
                      overflowY: "auto",
                      background: "#161616",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: "6px",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                    }}>
                      {ALL_COUNTRIES.map(c => (
                        <DropdownMenuItem
                          key={c}
                          onClick={() => setCountry(c)}
                          style={{
                            padding: "10px 14px",
                            color: country === c ? "#FF6A00" : "white",
                            fontSize: "13px",
                            fontWeight: country === c ? "800" : "500",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          {c}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: "900", color: "white", marginBottom: "6px", textTransform: "uppercase" }}>CITY / STATE</label>
                  <input 
                    type="text" 
                    placeholder="Los Angeles, CA" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} 
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                <input type="checkbox" id="terms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} style={{ accentColor: "#FF6A00" }} required />
                <label htmlFor="terms" style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)" }}>
                  I agree to the <Link to="/terms" style={{ color: "#FF6A00", textDecoration: "none" }}>Terms of Service</Link> and <Link to="/privacy" style={{ color: "#FF6A00", textDecoration: "none" }}>Privacy Policy</Link>
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <input type="checkbox" id="age-statement" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} style={{ accentColor: "#FF6A00", marginTop: "3px", flexShrink: 0 }} required />
                <label htmlFor="age-statement" style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.5 }}>
                  I confirm that I am at least 18 years old, or that my parent or legal guardian, who is at least 18 years old, has approved and will manage this account. I understand that providing false age or guardian information may result in account suspension and the revocation of any records earned through the account.
                </label>
              </div>

              <Captcha ref={captchaRef} onToken={setCaptchaToken} />

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "#FF6A00",
                  color: "white",
                  border: "none",
                  borderRadius: "100px",
                  padding: "16px",
                  fontSize: "14px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  marginTop: "8px",
                  boxShadow: "0 10px 30px rgba(255, 106, 0, 0.3)",
                  transition: "all 0.3s ease",
                  opacity: loading ? 0.7 : 1
                }}>
                {loading ? "CREATING PROFILE..." : "CREATE ACCOUNT"} 
                {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
              </button>

              <div style={{ textAlign: "center", marginTop: "12px", fontSize: "11px", color: "white" }}>
                Already have an account? <Link to="/login" style={{ color: "#FF6A00", textDecoration: "none", fontWeight: "800" }}>LOGIN</Link>
              </div>
            </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;
