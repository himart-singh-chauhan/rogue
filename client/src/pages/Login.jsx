import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(location.state?.message || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ background: "#0A0A0A", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{
        background: "#0A0A0A",
        color: "white",
        fontFamily: "'Inter', sans-serif",
        flex: 1,
        display: "flex",
        overflow: "hidden",
        boxSizing: "border-box"
      }}>

        {/* LEFT SIDE - HERO */}
        <div style={{
          flex: 1.2,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-start",
          padding: "60px 60px 120px 60px"
        }}>
          <img loading="lazy" decoding="async"
            src="https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=1200&q=80"
            alt="Athlete"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)" }}
          />
          {/* ORANGE SMOKE OVERLAY EFFECT */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(45deg, rgba(255,106,0,0.2) 0%, transparent 60%)",
            mixBlendMode: "overlay"
          }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{
              color: "#FF6A00",
              fontSize: "12px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: "12px"
            }}>
              ROGUE WORLD RECORDS
            </div>
            <h1 style={{
              fontSize: "clamp(40px, 6vw, 80px)",
              fontWeight: "950",
              textTransform: "uppercase",
              lineHeight: "0.85",
              letterSpacing: "-0.04em",
              color: "white"
            }}>
              PUSH <br />
              BEYOND <br />
              LIMITS
            </h1>
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <div style={{
          flex: 1,
          background: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px"
        }}>
          <div style={{
            background: "rgba(22, 22, 22, 0.8)",
            backdropFilter: "blur(20px)",
            padding: "40px 60px",
            borderRadius: "40px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            width: "100%",
            maxWidth: "480px",
            marginTop: "80px"
          }}>
            <h2 style={{ fontSize: "28px", fontWeight: "950", textTransform: "uppercase", marginBottom: "4px" }}>LOGIN</h2>
            <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "12px", fontWeight: "600", marginBottom: "32px" }}>
              Access your elite performance portal.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {error && <div style={{ color: "#ff4444", fontSize: "12px", fontWeight: "600", textAlign: "center" }}>{error}</div>}
              <div>
                <input
                  type="email"
                  placeholder="EMAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "100px",
                    padding: "18px 30px",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "700",
                    outline: "none",
                    letterSpacing: "0.05em"
                  }}
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="PASSWORD"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "100px",
                    padding: "18px 30px",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "700",
                    outline: "none",
                    letterSpacing: "0.05em"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px" }}>
                <Link to="/contact" style={{ fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  FORGOT PASSWORD?
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" id="signed-in" style={{ accentColor: "#FF6A00" }} />
                  <label htmlFor="signed-in" style={{ fontSize: "10px", fontWeight: "900", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    KEEP ME SIGNED IN
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                background: "#FF6A00",
                color: "white",
                border: "none",
                borderRadius: "100px",
                padding: "18px",
                fontSize: "13px",
                fontWeight: "900",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginTop: "10px",
                boxShadow: "0 20px 40px rgba(255, 106, 0, 0.3)",
                opacity: loading ? 0.7 : 1
              }}>
                {loading ? "AUTHENTICATING..." : "ENTER ARENA"}
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "50%", padding: "4px" }}>
                  {loading ? <Loader2 className="animate-spin" size={14} /> : <ArrowRight size={14} />}
                </div>
              </button>

              <div style={{ textAlign: "center", marginTop: "32px" }}>
                <div style={{ fontSize: "10px", fontWeight: "900", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  NEW TO ROGUE WORLD RECORDS?
                </div>
                <Link to="/signup" style={{
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "800",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  borderBottom: "2px solid #FF6A00",
                  paddingBottom: "4px"
                }}>
                  REGISTER ATHLETE PROFILE
                </Link>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
