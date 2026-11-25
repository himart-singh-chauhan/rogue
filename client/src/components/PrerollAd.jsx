// A sponsor's video ad before a video plays (Admin → Sponsors & Ads → placement "Video ad before videos").
// The ad stops at the length the sponsor bought (10 sec, 30 sec or 1 min) and then the video shows.
// One ad per video per visit; with no active video ad the video shows straight away.
//   <PrerollAd contentKey="record:123">…player…</PrerollAd>        in-page, 16:9
//   <PrerollAd fill contentKey="event:9">…player…</PrerollAd>     fills a positioned parent
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, ExternalLink } from "lucide-react";
import { API_URL, apiCall, formatProductImage } from "../utils/api";
import { embedUrlFor } from "./EvidencePreview";

let adsPromise = null;
const loadAds = () => {
  if (!adsPromise) {
    adsPromise = apiCall("/sponsors?placement=video_preroll", "GET")
      .then((list) => (Array.isArray(list) ? list.filter((s) => s.video_url) : []))
      .catch(() => []);
  }
  return adsPromise;
};
const seenKey = (k) => `ampex_ad_seen_${k}`;
const alreadySeen = (k) => { try { return !!sessionStorage.getItem(seenKey(k)); } catch { return false; } };
const markSeen = (k) => { try { sessionStorage.setItem(seenKey(k), "1"); } catch { /* private mode */ } };
const track = (id, kind) => { try { fetch(`${API_URL}/sponsors/${id}/${kind}`, { method: "POST", keepalive: true }).catch(() => {}); } catch { /* never breaks the page */ } };
const safeHref = (raw) => {
  const v = String(raw || "").trim();
  if (/^https?:\/\/\S+$/i.test(v)) return v;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v)) return `https://${v}`;
  return null;
};
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function AdPlayer({ ad, onDone }) {
  const limit = [10, 30, 60].includes(Number(ad.ad_seconds)) ? Number(ad.ad_seconds) : 30;
  const [left, setLeft] = useState(limit);
  const [sound, setSound] = useState(false);
  const ref = useRef(null);
  const doneRef = useRef(false);
  const embed = embedUrlFor(ad.video_url);
  const finish = () => { if (!doneRef.current) { doneRef.current = true; onDone(); } };

  useEffect(() => {
    track(ad.id, "view");
    const started = Date.now();
    const t = setInterval(() => {
      const gone = Math.floor((Date.now() - started) / 1000);
      setLeft(limit - gone);
      if (gone >= limit) { clearInterval(t); finish(); }
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad.id, limit]);

  const toggle = () => {
    const next = !sound;
    setSound(next);
    if (ref.current) { ref.current.muted = !next; if (next) ref.current.play?.().catch(() => {}); }
  };
  const href = safeHref(ad.link_url);
  const media = { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, objectFit: "contain", background: "#000" };
  const pill = { background: "rgba(0,0,0,0.72)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 100, padding: "7px 13px", fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 6 };
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000" }}>
      {embed
        ? <iframe key={sound ? "on" : "off"} src={(sound ? embed.replace("mute=1&", "mute=0&").replace("muted=1&", "muted=0&") : embed).replace("loop=1", "loop=0")} title={`Ad: ${ad.company_name || "Sponsor"}`} allow="autoplay; encrypted-media" style={media} />
        : <video ref={ref} src={formatProductImage(ad.video_url)} autoPlay muted playsInline onEnded={finish} onError={finish} style={media} />}
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2, display: "flex", gap: 8, alignItems: "center", pointerEvents: "none" }}>
        <span style={{ background: "#FFC107", color: "#111", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 900, letterSpacing: "0.06em" }}>AD</span>
        <span style={{ color: "white", fontSize: 12, fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{ad.company_name}</span>
      </div>
      <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, zIndex: 2, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={toggle} style={{ ...pill, cursor: "pointer" }}>{sound ? <VolumeX size={14} /> : <Volume2 size={14} />} {sound ? "Sound off" : "Sound on"}</button>
          {href && <a href={href} target="_blank" rel="noopener noreferrer sponsored" onClick={() => track(ad.id, "click")} style={{ ...pill, textDecoration: "none" }}><ExternalLink size={13} /> Visit {ad.company_name || "sponsor"}</a>}
        </div>
        <span style={pill} aria-live="off">Video starts in {clock(left)}</span>
      </div>
    </div>
  );
}

export default function PrerollAd({ contentKey, fill = false, children }) {
  const [state, setState] = useState(() => (contentKey && alreadySeen(contentKey) ? { done: true } : { loading: true }));
  useEffect(() => {
    if (state.done || !state.loading) return undefined;
    let cancelled = false;
    loadAds().then((ads) => {
      if (cancelled) return;
      if (!ads.length) { setState({ done: true }); return; }
      setState({ ad: ads[Math.floor(Math.random() * ads.length)] });
    });
    return () => { cancelled = true; };
  }, [state.done, state.loading]);

  if (state.done) return children;
  const frame = fill
    ? { position: "absolute", inset: 0, zIndex: 5 }
    : { position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 12, overflow: "hidden", background: "#000" };
  return (
    <div style={frame}>
      {state.ad && <AdPlayer ad={state.ad} onDone={() => { if (contentKey) markSeen(contentKey); setState({ done: true }); }} />}
    </div>
  );
}
