// Advertise with us: sponsors choose a video ad (10 sec / 30 sec / 1 min, played before record videos, replays
// and live streams) or banner spots, at the prices set in Admin → Sponsors & Ads → Ad prices, and send a
// request. It arrives in the admin inbox and by email; the admin then sets the sponsor up.
import { useEffect, useRef, useState } from "react";
import { PlayCircle, Image as ImageIcon, Check, Loader2, Send } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Captcha, { captchaOn, captchaMessage } from "../components/Captcha";
import { apiCall } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useCompany } from "../utils/company";

const PERIOD = { one_time: "one time", day: "per day", week: "per week", month: "per month", year: "per year" };
const priceOf = (o) => (Number(o.price) > 0 ? <><strong style={{ fontSize: 22, color: "white" }}>${Number(o.price).toLocaleString(undefined, { minimumFractionDigits: Number(o.price) % 1 ? 2 : 0, maximumFractionDigits: 2 })}</strong> <span style={{ color: "#999", fontSize: 13 }}>{PERIOD[o.period] || ""}</span></> : <span style={{ color: "#bbb", fontSize: 14, fontWeight: 800 }}>Ask for price</span>);
const lengthName = (s) => (s === 60 ? "1 minute" : `${s} seconds`);

const card = (on) => ({ textAlign: "left", background: on ? "rgba(255,106,0,0.1)" : "#121212", border: `1px solid ${on ? "#FF6A00" : "rgba(255,255,255,0.08)"}`, borderRadius: 18, padding: 18, cursor: "pointer", color: "white", position: "relative", width: "100%", font: "inherit" });
const input = { width: "100%", boxSizing: "border-box", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 14px", color: "white", fontSize: 14, outline: "none", fontFamily: "inherit" };
const label = { display: "block", fontSize: 11, fontWeight: 900, color: "#aaa", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 };

export default function Advertise() {
  const { user } = useAuth();
  const company = useCompany();
  const [pricing, setPricing] = useState(null);
  const [chosen, setChosen] = useState([]);
  const [form, setForm] = useState({ name: user?.name || "", company: "", email: user?.email || "", phone: "", website: "", message: "" });
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef(null);
  const [state, setState] = useState({ busy: false, error: "", done: "" });

  useEffect(() => { apiCall("/settings/ad-pricing", "GET").then(setPricing).catch(() => setPricing({ video: [], banners: [] })); }, []);
  const toggle = (k) => setChosen((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const partners = company?.emails?.partners || "partners@ampexworldrecords.com";

  const submit = async (e) => {
    e.preventDefault();
    if (!chosen.length) { setState({ busy: false, error: "Please choose at least one ad above.", done: "" }); return; }
    setState({ busy: true, error: "", done: "" });
    const token = captchaOn ? (captchaToken || await captchaRef.current?.getToken(15000)) : "";
    if (captchaOn && !token) { setState({ busy: false, error: captchaMessage(captchaRef.current?.status(), "press Send again"), done: "" }); return; }
    try {
      const r = await apiCall("/advertise", "POST", { ...form, choices: chosen, captchaToken: token || undefined });
      setState({ busy: false, error: "", done: r.message });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setState({ busy: false, error: err.message, done: "" });
      captchaRef.current?.reset();
    }
  };

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "white" }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "130px 16px 60px" }}>
        <div style={{ color: "#FF6A00", fontSize: 12, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>Sponsors &amp; advertisers</div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 60px)", fontWeight: 950, textTransform: "uppercase", lineHeight: 1, margin: "0 0 14px" }}>Advertise with us</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, lineHeight: 1.6, maxWidth: 680, margin: "0 0 28px" }}>
          Put your brand in front of record breakers and their fans. Choose a video ad that plays before record videos, replays and live streams, or a banner on the pages you want. Pick what you'd like below and send us a request; we'll reply with the next steps.
        </p>

        {state.done && (
          <div role="status" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)", color: "#86efac", borderRadius: 16, padding: "16px 18px", fontWeight: 700, marginBottom: 28 }}>{state.done}</div>
        )}

        {!pricing ? <div style={{ color: "#888" }}>Loading prices…</div> : (
          <>
            {pricing.video.length > 0 && (
              <section style={{ marginBottom: 34 }}>
                <h2 style={{ fontSize: 20, fontWeight: 950, textTransform: "uppercase", margin: "0 0 4px", display: "flex", gap: 8, alignItems: "center" }}><PlayCircle size={20} color="#FF6A00" /> Video ads</h2>
                <p style={{ color: "#999", fontSize: 14, margin: "0 0 14px" }}>Your video plays before record videos, replays and live streams, with a link to your website.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  {pricing.video.map((v) => {
                    const k = `video_${v.seconds}`; const on = chosen.includes(k);
                    return (
                      <button type="button" key={k} onClick={() => toggle(k)} aria-pressed={on} style={card(on)}>
                        {on && <Check size={18} color="#FF6A00" style={{ position: "absolute", top: 14, right: 14 }} />}
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#FF6A00", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{lengthName(v.seconds)}</div>
                        <div>{priceOf(v)}</div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
            {pricing.banners.length > 0 && (
              <section style={{ marginBottom: 34 }}>
                <h2 style={{ fontSize: 20, fontWeight: 950, textTransform: "uppercase", margin: "0 0 4px", display: "flex", gap: 8, alignItems: "center" }}><ImageIcon size={20} color="#FF6A00" /> Banners</h2>
                <p style={{ color: "#999", fontSize: 14, margin: "0 0 14px" }}>Your banner (a picture, a video, or both) on the page you choose, linked to your website.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  {pricing.banners.map((b) => {
                    const on = chosen.includes(b.placement);
                    return (
                      <button type="button" key={b.placement} onClick={() => toggle(b.placement)} aria-pressed={on} style={card(on)}>
                        {on && <Check size={18} color="#FF6A00" style={{ position: "absolute", top: 14, right: 14 }} />}
                        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8, paddingRight: 22 }}>{b.label}</div>
                        <div>{priceOf(b)}</div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
            {pricing.note && <p style={{ color: "#bbb", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line", margin: "0 0 28px" }}>{pricing.note}</p>}
          </>
        )}

        <form onSubmit={submit} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "24px 20px", display: "grid", gap: 14, maxWidth: 760 }}>
          <h2 style={{ fontSize: 20, fontWeight: 950, textTransform: "uppercase", margin: 0 }}>Send a request</h2>
          <div style={{ color: "#aaa", fontSize: 13 }}>{chosen.length ? `${chosen.length} ad${chosen.length > 1 ? "s" : ""} chosen.` : "Choose one or more ads above."}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div><label style={label} htmlFor="ad-name">Your name *</label><input id="ad-name" style={input} required maxLength={120} value={form.name} onChange={set("name")} /></div>
            <div><label style={label} htmlFor="ad-company">Company *</label><input id="ad-company" style={input} required maxLength={160} value={form.company} onChange={set("company")} /></div>
            <div><label style={label} htmlFor="ad-email">Email *</label><input id="ad-email" type="email" style={input} required maxLength={200} value={form.email} onChange={set("email")} /></div>
            <div><label style={label} htmlFor="ad-phone">Phone</label><input id="ad-phone" style={input} maxLength={40} value={form.phone} onChange={set("phone")} /></div>
          </div>
          <div><label style={label} htmlFor="ad-site">Website</label><input id="ad-site" style={input} maxLength={300} value={form.website} onChange={set("website")} placeholder="https://" /></div>
          <div><label style={label} htmlFor="ad-msg">Anything else (dates, budget, questions)</label><textarea id="ad-msg" style={{ ...input, minHeight: 100, resize: "vertical" }} maxLength={3000} value={form.message} onChange={set("message")} /></div>
          <Captcha ref={captchaRef} onToken={setCaptchaToken} />
          {state.error && <div role="alert" style={{ color: "#f87171", fontWeight: 700, fontSize: 13 }}>{state.error}</div>}
          <button type="submit" disabled={state.busy} style={{ background: "#FF6A00", color: "white", border: "none", borderRadius: 100, padding: "15px 22px", fontSize: 14, fontWeight: 900, textTransform: "uppercase", cursor: state.busy ? "wait" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {state.busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {state.busy ? "Sending…" : "Send request"}
          </button>
          <div style={{ color: "#888", fontSize: 12 }}>Prefer email? Write to <a href={`mailto:${partners}`} style={{ color: "#FF6A00" }}>{partners}</a>.</div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
