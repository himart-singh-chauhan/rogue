import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Video, Camera, Users, Watch, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

const SubmitEvidenceLearnMore = () => {
  const categories = [
    {
      id: "primary-video",
      icon: <Video size={24} color="#FF6A00" />,
      title: "Primary Video Evidence",
      subtitle: "Your video should clearly show the full record attempt from start to finish.",
      points: [
        "The video must be clear and easy to see.",
        "The full attempt should be recorded without cuts or edits.",
        "The competitor must remain visible during the attempt.",
        "Equipment should be shown before the attempt begins.",
        "Timing or measurement tools should be visible when required.",
        "The video should include the start and end of the attempt."
      ],
      extra: {
        title: "Video Upload Options",
        desc: "You may submit your video in one of two ways:",
        options: [
          { bold: "Upload a video file directly:", normal: "Select a saved video file (.mp4, .mov) from your device and upload it through the submission page." },
          { bold: "Submit a YouTube video link:", normal: "Upload your video to YouTube (set to Public or Unlisted), copy the link, and paste it into the field." }
        ],
        footer: "Only one primary video per submission is allowed."
      }
    },
    {
      id: "photo-evidence",
      icon: <Camera size={24} color="#FF6A00" />,
      title: "Photo Evidence",
      subtitle: "Photo evidence helps support your video submission.",
      points: [
        "Equipment used in the attempt",
        "Final score, measurement result, or digital display",
        "Finish line, distance markings, or boundary lines",
        "Stopwatch, timer, or scoreboard readings",
        "Weight plates or measuring tools used",
        "Competitor holding or completing the result",
        "Witnesses, judges, or timekeepers present"
      ],
      footerText: "Photos should be high-resolution and clearly visible."
    },
    {
      id: "witness-evidence",
      icon: <Users size={24} color="#FF6A00" />,
      title: "Witness Evidence",
      subtitle: "Some records may require witness confirmation.",
      points: [
        "Must be present during the full attempt",
        "Confirm the attempt was completed fairly and legally",
        "Provide their full name and verifiable contact information",
        "Sign a witness statement if required by the rules"
      ],
      footerText: "Witnesses should not submit false or misleading information."
    },
    {
      id: "timing-measurement",
      icon: <Watch size={24} color="#FF6A00" />,
      title: "Timing & Measurement Evidence",
      subtitle: "For records based on time, distance, weight, repetitions, or score, you may need supporting proof.",
      points: [
        "Stopwatch or official calibrated timer",
        "Digital clock or synchronized display",
        "Measuring tape, calipers, or digital scales",
        "Scoreboard or judge score sheet",
        "Official event result sheet"
      ],
      footerText: "All timing and measurement evidence must be clear, accurate, and unedited."
    }
  ];

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", fontFamily: "'Inter', sans-serif", minHeight: "100vh", paddingTop: "80px", display: "flex", flexDirection: "column" }}>
        
        {/* NAVBAR */}
        <Navbar />

        {/* HERO SECTION */}
        <header style={{ position: "relative", padding: "100px 5% 60px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "radial-gradient(circle at center, rgba(255,106,0,0.05) 0%, transparent 70%)" }}>
          <div style={{ background: "rgba(255,106,0,0.1)", color: "#FF6A00", display: "inline-block", padding: "6px 16px", borderRadius: "100px", fontSize: "10px", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
            EVIDENCE MANUAL
          </div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 68px)", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.03em", marginBottom: "24px", lineHeight: "1.1", maxWidth: "900px" }}>
            How to Submit Evidence for <span style={{ color: "#FF6A00" }}>a World Record</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", maxWidth: "750px", lineHeight: "1.7", margin: "0 auto 32px" }}>
            Submitting strong evidence is one of the most important steps in getting your record approved. AMPEX World Records uses video, photo, witness, and document evidence to verify that every record attempt is fair, authentic, and completed according to the official rules.
          </p>
          <Link to="/verify" style={{ textDecoration: "none" }}>
            <button style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", transition: "0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,106,0,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              SUBMIT EVIDENCE NOW <ArrowRight size={16} />
            </button>
          </Link>
        </header>

        {/* DETAILS SECTION */}
        <section style={{ padding: "80px 5%", maxWidth: "1200px", margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "280px 1fr", gap: "60px" }}>
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <div style={{ position: "sticky", top: "140px", height: "fit-content" }}>
            <h4 style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "24px" }}>QUICK SECTIONS</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <a href="#primary-video" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>1. Video Evidence</a>
              <a href="#photo-evidence" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>2. Photo Evidence</a>
              <a href="#witness-evidence" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>3. Witness Evidence</a>
              <a href="#timing-measurement" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>4. Timing & Measurement</a>
              <a href="#what-not-to-submit" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>5. What NOT to Submit</a>
              <a href="#review-process" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "14px", fontWeight: "700", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#FF6A00"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>6. After You Submit</a>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT AREA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
            
            {/* EVIDENCE CATEGORY BLOCKS */}
            {categories.map((cat) => (
              <div id={cat.id} key={cat.id} style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px", transition: "all 0.3s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ width: "48px", height: "48px", background: "rgba(255,106,0,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {cat.icon}
                  </div>
                  <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase" }}>{cat.title}</h3>
                </div>
                
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", marginBottom: "24px" }}>
                  {cat.subtitle}
                </p>

                <h4 style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "16px" }}>KEY REQUIREMENTS & CHECKPOINTS</h4>
                <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "20px", marginBottom: "24px", color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.6" }}>
                  {cat.points.map((pt, idx) => (
                    <li key={idx} style={{ listStyleType: "square", paddingLeft: "4px" }}>{pt}</li>
                  ))}
                </ul>

                {cat.extra && (
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.05)", padding: "24px", marginTop: "24px" }}>
                    <h5 style={{ fontSize: "14px", fontWeight: "900", color: "#FF6A00", marginBottom: "8px", textTransform: "uppercase" }}>{cat.extra.title}</h5>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "16px" }}>{cat.extra.desc}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                      {cat.extra.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ fontSize: "13px", lineHeight: "1.5" }}>
                          <strong style={{ color: "white" }}>{opt.bold} </strong>
                          <span style={{ color: "rgba(255,255,255,0.7)" }}>{opt.normal}</span>
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{cat.extra.footer}</span>
                  </div>
                )}

                {cat.footerText && (
                  <div style={{ fontSize: "12px", fontWeight: "800", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
                    {cat.footerText}
                  </div>
                )}
              </div>
            ))}

            {/* WHAT NOT TO SUBMIT */}
            <div id="what-not-to-submit" style={{ background: "rgba(239, 68, 68, 0.03)", borderRadius: "32px", border: "1px solid rgba(239, 68, 68, 0.15)", padding: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={24} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase", color: "#ef4444" }}>What Not to Submit</h3>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", marginBottom: "24px" }}>
                Do not submit evidence that is:
              </p>
              <ul style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingLeft: "20px", marginBottom: "24px", color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.6" }}>
                <li style={{ listStyleType: "square" }}>Edited or heavily cut</li>
                <li style={{ listStyleType: "square" }}>Blurry or unclear</li>
                <li style={{ listStyleType: "square" }}>Missing the start or finish</li>
                <li style={{ listStyleType: "square" }}>Missing the competitor</li>
                <li style={{ listStyleType: "square" }}>Missing required equipment proof</li>
                <li style={{ listStyleType: "square" }}>Fake, staged, or misleading</li>
                <li style={{ listStyleType: "square" }}>Unsafe or illegal</li>
              </ul>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "#ef4444", textTransform: "uppercase", borderTop: "1px solid rgba(239,68,68,0.1)", paddingTop: "16px" }}>
                Submissions that do not meet the evidence requirements may be denied or returned for correction.
              </div>
            </div>

            {/* AFTER YOU SUBMIT EVIDENCE */}
            <div id="review-process" style={{ background: "#161616", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.05)", padding: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", background: "rgba(34, 197, 94, 0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={24} color="#22c55e" />
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "900", textTransform: "uppercase" }}>After You Submit Evidence</h3>
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.6", marginBottom: "24px" }}>
                Once your evidence is uploaded successfully, AMPEX World Records will review your submission. The review team may:
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "20px", marginBottom: "32px", color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
                <li>• Confirm the video is complete and unedited</li>
                <li>• Review photos and supporting documents</li>
                <li>• Check timing and measurements matches strict criteria</li>
                <li>• Verify the record rules were followed precisely</li>
                <li>• Contact witnesses to verify statements if needed</li>
                <li>• Request more information or proof if necessary</li>
              </ul>

              <h4 style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "16px" }}>Evidence Review Outcome</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "20px", borderRadius: "16px" }}>
                  <strong style={{ color: "#22c55e", fontSize: "14px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Approved</strong>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>Your record is verified and added to leaderboards.</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "20px", borderRadius: "16px" }}>
                  <strong style={{ color: "#ef4444", fontSize: "14px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Denied</strong>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>The evidence did not meet official criteria.</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "20px", borderRadius: "16px" }}>
                  <strong style={{ color: "#f59e0b", fontSize: "14px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Needs More Info</strong>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>More proof or clarification is required to verify.</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "20px", borderRadius: "16px" }}>
                  <strong style={{ color: "#a855f7", fontSize: "14px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Extended Review</strong>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>The record requires additional specialized review time.</span>
                </div>
              </div>
            </div>

          </div>

          {/* FINAL REMINDER */}
          <div style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg, rgba(255,106,0,0.1) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid #FF6A00", borderRadius: "32px", padding: "40px", textAlign: "center", marginTop: "40px" }}>
            <h3 style={{ fontSize: "28px", fontWeight: "950", textTransform: "uppercase", marginBottom: "12px", color: "#FF6A00" }}>Final Reminder</h3>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", maxWidth: "650px", margin: "0 auto 24px", lineHeight: "1.6" }}>
              The stronger your evidence, the better your chance of approval. Before submitting, make sure your video is clear, your photos are readable, your measurements are visible, and your information is accurate.
            </p>
            <h4 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "white", textTransform: "uppercase", marginBottom: "32px" }}>
              Submit strong evidence. Protect the record. Make history.
            </h4>
            <Link to="/verify" style={{ textDecoration: "none" }}>
              <button style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "18px 48px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", transition: "0.3s" }}>
                START SUBMISSION
              </button>
            </Link>
          </div>

        </section>

        {/* FOOTER */}
        <Footer />

      </div>
    </PageTransition>
  );
};

export default SubmitEvidenceLearnMore;
