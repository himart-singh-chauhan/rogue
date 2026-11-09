import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Schedule = () => {
  const events = [
    { date: "OCT 20", time: "10:00 AM", title: "AMPEX OPENING CEREMONY", loc: "Tokyo Main Arena" },
    { date: "OCT 20", time: "02:00 PM", title: "THE SUMMIT LIFT: QUALIFIERS", loc: "Tokyo Main Arena" },
    { date: "OCT 21", time: "09:00 AM", title: "100M DASH: ROUND 1", loc: "Olympic Hub" },
    { date: "OCT 21", time: "04:00 PM", title: "STREET WORKOUT FREESTYLE", loc: "Shibuya Plaza" },
    { date: "OCT 22", time: "11:00 AM", title: "SPEED CLIMBING FINALS", loc: "Vertical Zone" },
  ];

  return (
    <PageTransition>
      <div style={{ background: "#0A0A0A", color: "white", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />
        <div style={{ padding: "180px 5% 120px", maxWidth: "1200px", margin: "0 auto" }}>
          <Link to="/events" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FF6A00", textDecoration: "none", fontSize: "14px", fontWeight: "900", marginBottom: "40px", textTransform: "uppercase" }}>
            <ArrowLeft size={16} /> BACK TO EVENTS
          </Link>
          <h1 style={{ fontSize: "64px", fontWeight: "950", textTransform: "uppercase", marginBottom: "60px", letterSpacing: "-0.03em" }}>EVENT <span style={{ color: "#FF6A00" }}>SCHEDULE</span></h1>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {events.map((ev, i) => (
              <div key={i} style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", display: "grid", gridTemplateColumns: "150px 1fr 200px", alignItems: "center", gap: "40px" }}>
                <div>
                   <div style={{ fontSize: "12px", fontWeight: "900", color: "#FF6A00", marginBottom: "4px" }}>{ev.date}</div>
                   <div style={{ fontSize: "20px", fontWeight: "900", display: "flex", alignItems: "center", gap: "8px" }}><Clock size={18} /> {ev.time}</div>
                </div>
                <div style={{ fontSize: "24px", fontWeight: "950", textTransform: "uppercase" }}>{ev.title}</div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                   <MapPin size={16} color="#FF6A00" /> {ev.loc}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Schedule;
