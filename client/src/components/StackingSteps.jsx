import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Search, Globe, Clock, ChevronRight } from 'lucide-react';

const GRID_LIGHT = 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)';

const steps = [
  {
    num: "01",
    tag: "Step 01",
    title: { light: "Submit", orange: "Evidence" },
    desc: "Upload unedited video evidence, witness statements, and exact measurements through our secure portal.",
    features: [
      { icon: <ShieldCheck />, title: "Secure Portal", desc: "Encrypted data handling for all submissions." },
      { icon: <Search />, title: "File Integrity", desc: "Automated checks for unedited video metadata." },
      { icon: <CheckCircle2 />, title: "Guide-Led", desc: "Step-by-step submission instructions provided." },
      { icon: <Globe />, title: "Global Sync", desc: "Instant sync with regional verification offices." }
    ],
    img: "https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&w=1000&q=80",
    footerTitle: "Your Effort Deserves Professional Intake.",
    footerSub: "We process. We protect. We verify excellence.",
    time: "Intake Duration",
    days: "24 - 48 Hours",
    link: "/submit-evidence-info"
  },
  {
    num: "02",
    tag: "Step 02",
    title: { light: "Expert", orange: "Adjudication" },
    desc: "Our specialist panel reviews your evidence against strict category rules to ensure absolute legitimacy.",
    features: [
      { icon: <ShieldCheck />, title: "Strict Evaluation", desc: "Every detail is examined against official category guidelines." },
      { icon: <Search />, title: "Expert Panel", desc: "Reviewed by experienced adjudicators with deep subject knowledge." },
      { icon: <CheckCircle2 />, title: "Fair & Transparent", desc: "A fair process that upholds the integrity of every record." },
      { icon: <Globe />, title: "Global Standards", desc: "Ensuring every record meets world-class legitimacy." }
    ],
    img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80",
    footerTitle: "Your Record Deserves True Recognition.",
    footerSub: "We verify. We validate. We uphold excellence.",
    time: "Typical Review Time",
    days: "3 - 7 Business Days",
    link: "/adjudication-info"
  },
  {
    num: "03",
    tag: "Step 03",
    title: { light: "Global", orange: "Recognition" },
    desc: "Receive your official certificate and take your rightful place on the global leaderboard.",
    features: [
      { icon: <ShieldCheck />, title: "Official Certification", desc: "Receive a physical and digital world record certificate." },
      { icon: <Search />, title: "Wall of Fame", desc: "Permanent placement in the AMPEX World Records database." },
      { icon: <CheckCircle2 />, title: "Creator Economy", desc: "Unlock monetization opportunities for your record content." },
      { icon: <Globe />, title: "PR Support", desc: "Global press release and social media feature for record holders." }
    ],
    img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80",
    footerTitle: "Welcome to the Elite League.",
    footerSub: "Celebrate. Inspire. Dominate the world stage.",
    time: "Certificate Delivery",
    days: "10 - 14 Business Days",
    link: "/global-recognition-info"
  }
];

export default function StackingSteps() {
  return (
    <article>
      {/* ── Intro sticky card ── */}
      <section style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: `linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), url('/images/sketch-banner.webp') no-repeat center center / cover`,
        display: 'grid',
        placeContent: 'center',
        overflow: 'hidden',
        zIndex: 0,
      }}>
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, #000 55%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, #000 55%, transparent 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 32px' }}>
          <p style={{ color: '#FF6A00', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 24 }}>
            Official Path to Glory
          </p>
          <h2 style={{
            fontSize: 'clamp(40px, 6.5vw, 88px)',
            fontWeight: 900,
            color: '#111111',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            marginBottom: 24,
            fontFamily: "'Inter', sans-serif",
          }}>
            <ScrollReveal>Every Record is</ScrollReveal><br />
            <span style={{ color: '#FF6A00' }}><ScrollReveal>Officially Verified.</ScrollReveal></span>
          </h2>
          <p style={{ color: 'rgba(17,17,17,0.55)', fontSize: 18, lineHeight: 1.7, maxWidth: 460, margin: '0 auto 40px' }}>
            Every record is verified by our leading global experts before making it onto the platform.
          </p>
          <p style={{ color: 'rgba(17,17,17,0.4)', fontSize: 13, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Scroll to see the process
            <span style={{ display: 'inline-block', animation: 'bounceY 1.4s ease-in-out infinite' }}>↓</span>
          </p>
        </div>
      </section>

      {/* ── 3 stacking step cards ── */}
      {steps.map((s, i) => (
        <section
          key={s.tag}
          style={{
            height: '100vh',
            position: 'sticky',
            top: 0,
            background: '#0a0a0a',
            color: 'white',
            overflow: 'hidden',
            zIndex: i + 1,
            borderTop: i !== 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
          }}
        >
          {/* Grid texture */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: GRID_LIGHT,
            backgroundSize: '80px 80px',
            opacity: 0.3,
            pointerEvents: 'none'
          }} />


          <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '80px 60px 180px', position: 'relative', zIndex: 1 }}>
            
            {/* Left Content */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: 60 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ color: '#FF6A00', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.tag}</span>
                <div style={{ width: 40, height: 1, background: '#FF6A00', opacity: 0.5 }} />
              </div>
              <h2 style={{ fontSize: 'clamp(40px, 5vw, 82px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: 32 }}>
                {s.title.light}<br />
                <span style={{ color: '#FF6A00' }}>{s.title.orange}</span>
              </h2>
              <p style={{ fontSize: 18, color: '#aaa', lineHeight: 1.6, maxWidth: 440, marginBottom: 48 }}>
                {s.desc}
              </p>

              {/* Feature List */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px', maxWidth: 600 }}>
                {s.features.map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ color: '#FF6A00', flexShrink: 0, marginTop: 4 }}>
                      {React.cloneElement(f.icon, { size: 24 })}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{f.title}</h4>
                      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.4 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content: Hero Image & Big Number */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Giant BG Number */}
              <div style={{ 
                position: 'absolute', 
                right: 0, 
                fontSize: 'clamp(200px, 30vw, 450px)', 
                fontWeight: 900, 
                color: 'transparent',
                WebkitTextStroke: '1px rgba(255,106,0,0.15)',
                lineHeight: 1,
                zIndex: -1,
                userSelect: 'none'
              }}>
                {s.num}
              </div>

              {/* Radial Glow */}
              <div style={{
                position: 'absolute',
                width: '120%',
                height: '120%',
                background: 'radial-gradient(circle at center, rgba(255,106,0,0.08) 0%, transparent 70%)',
                zIndex: -1
              }} />

              {/* Main Image */}
              <div style={{ position: 'relative', height: '85%', width: 'auto', display: 'flex', alignItems: 'flex-end' }}>
                <img loading="lazy" decoding="async" 
                  src={s.img} 
                  alt={s.tag} 
                  style={{ 
                    height: '100%', 
                    width: 'auto', 
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))'
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Bottom Navigation Bar */}
          <div style={{ 
            position: 'absolute', 
            bottom: 24, 
            left: 60, 
            right: 60, 
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '20px',
            padding: '16px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img loading="lazy" decoding="async" src="/images/logo-mascot.webp" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'translateY(6px)' }} />
              </div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{s.footerTitle}</h4>
                <p style={{ fontSize: 13, color: '#666' }}>{s.footerSub}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Clock style={{ color: '#FF6A00', width: 40, height: 40, opacity: 0.8 }} />
                <div>
                  <p style={{ fontSize: 11, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.time}</p>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{s.days}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <Link to={s.link} style={{ textDecoration: 'none' }}>
                  <button style={{ 
                    background: '#FF6A00', 
                    border: 'none', 
                    borderRadius: '10px', 
                    padding: '12px 24px', 
                    color: 'white', 
                    fontSize: 14, 
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer'
                  }}>
                    Learn More
                    <div style={{ width: 20, height: 20, background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowRight style={{ width: 12, height: 12, color: '#FF6A00' }} />
                    </div>
                  </button>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 10 }}>
                  <ShieldCheck size={10} /> All submissions are confidential
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </article>
  );
}

const Trophy = ({ color, width, height, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const ScrollReveal = ({ children }) => (
  <span style={{ display: "inline-block" }}>{children}</span>
);

const styles = `
  @keyframes bounceY {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(6px); }
  }
`;

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}
