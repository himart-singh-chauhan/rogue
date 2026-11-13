import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard, 
  Clock, 
  Trophy, 
  BarChart, 
  Mail, 
  MapPin,
  Zap,
  Search
} from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    { question: "1. What is AMPEX World Records?", answer: "AMPEX World Records is a global platform where individuals can attempt, submit, verify, and compete in world record challenges across multiple categories." },
    { question: "2. Who can apply for a world record?", answer: "Anyone can apply, regardless of age, nationality, or experience level, as long as they follow the official rules and safety guidelines." },
    { question: "3. Do I need to become a member to submit a record?", answer: "Basic submissions may be available to everyone, but certain premium competitions, prize events, and advanced features may require an active membership." },
    { question: "4. What types of records can I attempt?", answer: "You can attempt records in categories such as: Strength, Endurance, Gaming, Athletics, Balance, Skills, Mind & Memory, Entertainment, Action Sports, and Creative Challenges." },
    { question: "5. Can I create a completely new world record category?", answer: "Yes. Users can submit proposals for new record categories that do not currently exist." },
    { question: "6. How do I submit a record?", answer: "You create an account, choose a category, upload your evidence, complete the submission form, and submit your attempt for review." },
    { question: "7. What evidence is required for verification?", answer: "Depending on the challenge, evidence may include: Video recordings, Photos, Witness statements, Official measurements, Timer verification, and Judge approval." },
    { question: "8. How long does verification take?", answer: "Verification times vary based on the complexity of the record and the amount of evidence submitted." },
    { question: "9. Can I compete against an existing record holder?", answer: "Yes. Many records can be directly challenged if you believe you can beat the current record." },
    { question: "10. Are live events available?", answer: "Yes. AMPEX World Records plans to host live competitions, tournaments, and public challenge events." },
    { question: "11. Can children compete?", answer: "Yes. Youth competitors may participate in age-appropriate categories with parental or guardian permission." },
    { question: "12. What age groups are available?", answer: "Common age divisions may include: Under 13, Teen Division, Adult Division, Senior Division. Some categories may also be open to all ages." },
    { question: "13. Are there cash prizes?", answer: "Certain competitions, sponsored events, and special tournaments may include prize money, trophies, certificates, or rewards." },
    { question: "14. What happens if my submission is denied?", answer: "You may receive feedback explaining why the submission was not approved, and in some cases you may be allowed to resubmit with corrected evidence." },
    { question: "15. Can teams or groups break records together?", answer: "Yes. Some records are designed for teams, organizations, schools, gyms, or businesses." },
    { question: "16. Will I receive a certificate if I break a record?", answer: "Yes. Approved record holders may receive official certificates, digital recognition, and optional framed awards." },
    { question: "17. Can I upload my attempt from my phone?", answer: "Yes. Most submissions can be uploaded directly from mobile devices, tablets, or computers." },
    { question: "18. Are dangerous or unsafe records allowed?", answer: "No. Safety is a priority. Dangerous, illegal, or reckless challenges may be denied or removed." },
    { question: "19. Can I appeal a verification decision?", answer: "Yes. Users may request a review or appeal if they believe a decision was made incorrectly." },
    { question: "20. How do I contact support?", answer: "You can contact the AMPEX World Records support team through the Contact Us page or by emailing the appropriate department for assistance." }
  ];

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
        
        {/* NAVBAR */}
        <Navbar />

        <div style={{ padding: "180px 5% 120px", flex: 1 }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", maxWidth: "1200px", margin: "0 auto 80px" }}>
          <div>
            <h3 style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: "900", letterSpacing: "0.2em", marginBottom: "12px", textTransform: "uppercase" }}>SUPPORT CENTER</h3>
            <h1 style={{ fontSize: "72px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: "0.9" }}>FAQ | AMPEX WORLD <br /> RECORDS</h1>
          </div>
          <Link to="/verify" style={{ textDecoration: "none" }}>
            <button style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: "100px", padding: "14px 32px", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
              SUBMIT A RECORD <ArrowRight size={16} />
            </button>
          </Link>
        </div>

        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
          
          {/* FAQ ACCORDION */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "32px", padding: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
                <Search size={20} color="#FF6A00" />
                <span style={{ fontSize: "14px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "0.05em" }}>FREQUENTLY ASKED QUESTIONS</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {faqs.map((faq, i) => (
                  <div key={i} style={{ borderBottom: i === faqs.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)", paddingBottom: "24px" }}>
                    <button 
                      onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                      style={{ width: "100%", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left", padding: "0" }}
                    >
                      <span style={{ fontSize: "16px", fontWeight: "900", color: openIndex === i ? "#FF6A00" : "white", textTransform: "uppercase" }}>{faq.question}</span>
                      {openIndex === i ? <Minus size={18} color="#FF6A00" /> : <Plus size={18} color="rgba(255,255,255,0.2)" />}
                    </button>
                    {openIndex === i && (
                      <p style={{ marginTop: "16px", fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>{faq.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM LINKS */}
        <div style={{ maxWidth: "1200px", margin: "80px auto 0", display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "24px" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "24px", padding: "40px" }}>
             <h4 style={{ fontSize: "24px", fontWeight: "950", textTransform: "uppercase", marginBottom: "24px" }}>STILL HAVE <br/> QUESTIONS?</h4>
             <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
               <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", fontWeight: "700" }}>
                 <Mail size={16} color="#FF6A00" /> ampexworldrecords@gmail.com
               </div>
               <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", fontWeight: "700" }}>
                 <MapPin size={16} color="#FF6A00" /> Visit our full Contact Page
               </div>
             </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Link to="/explore" style={{ textDecoration: "none" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "900", color: "#FF6A00", marginBottom: "4px" }}>EXPLORE NOW</div>
                  <div style={{ fontSize: "20px", fontWeight: "950" }}>EXPLORE ALL RECORDS</div>
                </div>
                <ArrowRight size={24} />
              </div>
            </Link>
            <Link to="/challenge" style={{ textDecoration: "none" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "20px", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "900", color: "#FF6A00", marginBottom: "4px" }}>TAKE THE THRONE</div>
                  <div style={{ fontSize: "20px", fontWeight: "950" }}>CHALLENGE A RECORD</div>
                </div>
                <Zap size={24} />
              </div>
            </Link>
          </div>
        </div>
        </div>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default FAQ;
