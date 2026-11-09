import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Zap, Globe, Calendar, MapPin, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { useState } from "react";
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
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const heightValFinal = heightUnit === "cm" ? heightVal : `${heightFt}'${heightIn}"`;
      await signup({
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
        city
      });
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Failed to create profile");
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

            <div style={{ display: "flex", gap: "40px" }}>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "950", color: "white" }}>12.4K+</div>
                <div style={{ fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>VERIFIED ATHLETES</div>
              </div>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "950", color: "white" }}>850+</div>
                <div style={{ fontSize: "10px", fontWeight: "900", color: "white", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>WORLD RECORDS</div>
              </div>
            </div>
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
                <input 
                  type="password" 
                  placeholder="********" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px" }} 
                />
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
                    onChange={(e) => setDob(e.target.value)}
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "12px 16px", color: "white", outline: "none", fontSize: "13px", colorScheme: "dark" }} 
                  />
                </div>
              </div>

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
                      {[
                        "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
                        "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
                        "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
                        "Denmark", "Djibouti", "Dominica", "Dominican Republic",
                        "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
                        "Fiji", "Finland", "France",
                        "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
                        "Haiti", "Honduras", "Hungary",
                        "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
                        "Jamaica", "Japan", "Jordan",
                        "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan",
                        "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
                        "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
                        "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
                        "Oman",
                        "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
                        "Qatar",
                        "Romania", "Russia", "Rwanda",
                        "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
                        "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
                        "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
                        "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
                        "Yemen",
                        "Zambia", "Zimbabwe"
                      ].map(c => (
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
                <input type="checkbox" id="terms" style={{ accentColor: "#FF6A00" }} required />
                <label htmlFor="terms" style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)" }}>
                  I agree to the <Link to="/terms" style={{ color: "#FF6A00", textDecoration: "none" }}>Terms of Service</Link> and <Link to="/privacy" style={{ color: "#FF6A00", textDecoration: "none" }}>Privacy Policy</Link>
                </label>
              </div>

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
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;
