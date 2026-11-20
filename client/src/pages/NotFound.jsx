// Any address that isn't a page on the site (a mistyped or old link)
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "white" }}>
      <Navbar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "140px 20px 60px", textAlign: "center" }}>
        <img src="/images/ampex-logo.webp" alt="AMPEX World Records" width={120} height={120} style={{ margin: "0 auto 24px", display: "block" }} />
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 12px" }}>Page not found</h1>
        <p style={{ color: "#aaa", lineHeight: 1.6, margin: "0 0 28px" }}>This link doesn't go to a page on Ampex World Records. It may be mistyped or out of date.</p>
        <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" style={{ color: "#FF6A00", fontWeight: 800 }}>Home</Link>
          <Link to="/explore-records" style={{ color: "#FF6A00", fontWeight: 800 }}>Explore Records</Link>
          <Link to="/events" style={{ color: "#FF6A00", fontWeight: 800 }}>Live Events</Link>
          <Link to="/shop" style={{ color: "#FF6A00", fontWeight: 800 }}>Shop</Link>
        </div>
      </div>
    </div>
  );
}
