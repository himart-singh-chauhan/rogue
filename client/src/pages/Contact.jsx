import React, { useState } from "react";
import { ArrowRight, Shield, User, MessageSquare, Loader2, ChevronDown } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import { apiCall } from "../utils/api";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "../components/ui/dropdown-menu";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "GENERAL INQUIRY",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiCall("/contact", "POST", formData);
      setSuccess(true);
      setFormData({ name: "", email: "", subject: "GENERAL INQUIRY", message: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>
        
        {/* NAVBAR */}
        <Navbar />

        {/* MAIN CONTENT */}
        <main style={{ padding: "180px 5% 120px", maxWidth: "1400px", margin: "0 auto" }}>
          
          {/* HERO SECTION */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "60px", marginBottom: "100px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <div style={{ color: "#FF6A00", fontWeight: "800", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "20px" }}>
                GET IN TOUCH
              </div>
              <h1 style={{ fontSize: "clamp(48px, 6vw, 90px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.95", marginBottom: "32px" }}>
                <ScrollReveal>CONTACT</ScrollReveal> <br />
                <span style={{ color: "#FF6A00" }}><ScrollReveal>US</ScrollReveal></span>
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", lineHeight: "1.6", maxWidth: "550px" }}>
                Have questions about submissions, memberships, record verification, partnerships, sponsorships, or live competitions? Our team is here to help. We welcome athletes, creators, competitors, fans, sponsors, media outlets, and future world record holders from around the globe.
              </p>
            </div>

            {/* RESPONSE TIME BOX */}
            <div style={{ background: "#161616", padding: "40px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", width: "320px", position: "relative", overflow: "hidden" }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                RESPONSE TIME
              </div>
              <div style={{ fontSize: "64px", fontWeight: "950", color: "white", lineHeight: "1" }}>
                2.4 <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>HOURS</span>
              </div>
              <div style={{ marginTop: "24px", width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px" }}>
                <div style={{ width: "70%", height: "100%", background: "#FF6A00", borderRadius: "2px", boxShadow: "0 0 10px #FF6A00" }}></div>
              </div>
            </div>
          </div>

          {/* QUICK ACCESS & FORM */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "60px", alignItems: "start" }}>
            
            {/* CONTACT INFORMATION */}
            <div>
              <h2 style={{ fontSize: "32px", fontWeight: "900", textTransform: "uppercase", marginBottom: "40px" }}>CONTACT INFO</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                  { icon: <MessageSquare size={20} />, title: "GENERAL SUPPORT", email: "ampexworldrecords@gmail.com", desc: "Questions, Account, Memberships, Tech issues" },
                  { icon: <Shield size={20} />, title: "RECORD SUBMISSIONS", email: "ampexworldrecords@gmail.com", desc: "Applications, Evidence, Rule clarification" },
                  { icon: <User size={20} />, title: "MEDIA & PRESS", email: "ampexworldrecords@gmail.com", desc: "Interviews, News, Podcasts, TV" },
                  { icon: <ArrowRight size={20} />, title: "SPONSORSHIPS & PARTNERSHIPS", email: "ampexworldrecords@gmail.com", desc: "Brands, Events, Advertising" }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: "#161616", padding: "24px 32px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: "24px", transition: "all 0.2s" }}>
                    <div style={{ color: "#FF6A00" }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>{item.title}</div>
                      <div style={{ fontSize: "13px", color: "#FF6A00", marginBottom: "4px", fontWeight: "bold" }}>{item.email}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "40px", background: "#161616", padding: "24px 32px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "900", textTransform: "uppercase", marginBottom: "16px", color: "white" }}>BUSINESS HOURS</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "800" }}>MONDAY - FRIDAY</div>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>9:00 AM – 6:00 PM EST</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "800" }}>WEEKEND SUPPORT</div>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>Limited Online Support Available</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "20px", background: "#161616", padding: "24px 32px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "900", textTransform: "uppercase", marginBottom: "16px", color: "white" }}>FOLLOW US</h3>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "16px" }}>Stay connected with AMPEX World Records for new world records, live competitions, featured athletes, and community highlights.</p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {["Facebook", "Instagram", "TikTok", "YouTube", "X (Twitter)"].map((social, i) => (
                    <span key={i} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "100px", fontSize: "12px", fontWeight: "bold", color: "white", cursor: "pointer" }}>{social}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* CONTACT FORM */}
            <div style={{ background: "#161616", padding: "60px", borderRadius: "40px", border: "1px solid rgba(255,255,255,0.05)" }}>
              {success ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ color: "#FF6A00", fontSize: "24px", fontWeight: "950", marginBottom: "16px" }}>MESSAGE SENT</div>
                  <p style={{ color: "rgba(255,255,255,0.6)" }}>Thank you for reaching out to AMPEX World Records. We will respond shortly.</p>
                  <button onClick={() => setSuccess(false)} style={{ marginTop: "32px", background: "transparent", border: "1px solid #FF6A00", color: "#FF6A00", padding: "12px 24px", borderRadius: "100px", cursor: "pointer", fontWeight: "800" }}>SEND ANOTHER</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                  {error && <div style={{ color: "#ff4444", fontSize: "12px", fontWeight: "600", textAlign: "center" }}>{error}</div>}
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>FULL NAME</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px 20px", color: "white", outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>EMAIL ADDRESS</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px 20px", color: "white", outline: "none" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>PHONE NUMBER</label>
                      <input type="tel" name="phone" onChange={handleChange} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px 20px", color: "white", outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>SUBJECT</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" style={{
                            width: "100%",
                            background: "#0A0A0A",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: "12px",
                            padding: "16px 20px",
                            color: "white",
                            outline: "none",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            textAlign: "left",
                            fontSize: "14px"
                          }}>
                            <span>{formData.subject || "SELECT SUBJECT"}</span>
                            <ChevronDown size={18} style={{ opacity: 0.6 }} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent style={{
                          width: "100%",
                          minWidth: "250px",
                          background: "#161616",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          padding: "8px",
                          boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                        }}>
                          {[
                            "General Question",
                            "Record Submission",
                            "Membership Support",
                            "Technical Support",
                            "Media Inquiry",
                            "Partnership Opportunity",
                            "Live Event Information",
                            "Other"
                          ].map((subj) => (
                            <DropdownMenuItem
                              key={subj}
                              onClick={() => setFormData({...formData, subject: subj})}
                              style={{
                                padding: "12px 16px",
                                color: formData.subject === subj ? "#FF6A00" : "white",
                                fontSize: "14px",
                                fontWeight: formData.subject === subj ? "800" : "500",
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              {subj}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>MESSAGE</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} rows="5" required style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px 20px", color: "white", outline: "none", resize: "none" }}></textarea>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "12px" }}>UPLOAD FILES (JPG, PNG, PDF, MP4)</label>
                    <div style={{ position: "relative" }}>
                      <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.mp4" style={{ width: "100%", opacity: 0, position: "absolute", top: 0, left: 0, height: "100%", cursor: "pointer", zIndex: 10 }} />
                      <div style={{ width: "100%", background: "#0A0A0A", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: "12px", padding: "20px", color: "rgba(255,255,255,0.6)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                        <ArrowRight size={24} style={{ color: "#FF6A00", transform: "rotate(-90deg)" }} />
                        <span style={{ fontSize: "14px", fontWeight: "600" }}>CLICK OR DRAG FILES HERE</span>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>ACCEPTED FILE TYPES: JPG, PNG, PDF, MP4</span>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "20px 40px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", transition: "all 0.3s ease", boxShadow: "0 10px 30px rgba(255, 106, 0, 0.2)", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "TRANSMITTING..." : "SEND MESSAGE"} {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                  </button>
                </form>
              )}
            </div>

          </div>
        </main>

        {/* FOOTER */}
        <Footer />

      </div>
    </PageTransition>
  );
};

export default Contact;
