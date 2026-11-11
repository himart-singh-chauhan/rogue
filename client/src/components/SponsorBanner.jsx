import { useEffect, useState } from "react";
import { API_URL, apiCall, formatProductImage } from "../utils/api";
import { embedUrlFor } from "./EvidencePreview";

// Sponsor video: YouTube / Vimeo page (embedded, muted) or an uploaded MP4
const SponsorVideo = ({ url, title }) => {
  const embed = embedUrlFor(url);
  const box = { width: "100%", height: "100%", display: "block", border: 0, objectFit: "cover" };
  if (embed) return <iframe src={embed} title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" style={box} />;
  return <video src={formatProductImage(url)} muted autoPlay loop playsInline preload="metadata" style={box} />;
};

/**
 * Shows active sponsors managed in Admin → Sponsorships.
 * Renders nothing when no sponsor is live for the given placements.
 *
 * placements: array of placement values from the admin form (e.g. ["homepage_top_banner", "homepage"])
 * variant:    "banner" (full-width image card) | "compact" (small "Sponsored by" row, used in the footer)
 *             | "overlay" (small card in the corner of a video player; the parent must be position: relative)
 *
 * Each sponsor can set image_fit ("contain" = whole banner always visible, the default; "cover" = fill
 * the strip and crop) and image_position (center/top/bottom/left/right) in Admin → Sponsorships.
 */
const tracked = new Set(); // one impression per sponsor per page load

const track = (id, kind) => {
  try {
    fetch(`${API_URL}/sponsors/${id}/${kind}`, { method: "POST", keepalive: true }).catch(() => {});
  } catch {
    /* tracking must never break the page */
  }
};

// Admins type the link by hand: accept full URLs, bare domains and emails; anything else = no link.
const safeHref = (raw) => {
  const v = String(raw || "").trim();
  if (!v) return null;
  if (/^https?:\/\/\S+$/i.test(v)) return v;
  const email = v.replace(/\s+/g, "");
  if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return `mailto:${email}`;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v)) return `https://${v}`;
  return null;
};

const POSITIONS = ["center", "top", "bottom", "left", "right"];
const fitOf = (s) => (s?.image_fit === "cover" ? "cover" : "contain");
const positionOf = (s) => (POSITIONS.includes(s?.image_position) ? s.image_position : "center");

const SponsorBanner = ({ placements = [], variant = "banner", style }) => {
  const [sponsors, setSponsors] = useState([]);
  const [index, setIndex] = useState(0);
  const key = placements.join(",");

  useEffect(() => {
    let cancelled = false;
    apiCall(`/sponsors?placement=${encodeURIComponent(key)}`, "GET")
      .then((data) => {
        if (!cancelled) setSponsors(Array.isArray(data) ? data.filter((s) => s.banner_url || s.logo_url || s.video_url) : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Rotate when several sponsors share the spot
  useEffect(() => {
    if (variant === "compact" || sponsors.length < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % sponsors.length), 6000);
    return () => clearInterval(t);
  }, [sponsors.length, variant]);

  const visible = variant === "compact" ? sponsors : sponsors.slice(index, index + 1);
  useEffect(() => {
    visible.forEach((s) => {
      if (!tracked.has(s.id)) {
        tracked.add(s.id);
        track(s.id, "view");
      }
    });
  }, [visible]);

  if (!sponsors.length) return null;

  const linkProps = (s) => {
    const href = safeHref(s.link_url);
    return href
      ? { href, target: href.startsWith("mailto:") ? undefined : "_blank", rel: "noopener noreferrer sponsored", onClick: () => track(s.id, "click") }
      : {};
  };

  if (variant === "compact") {
    return (
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16, padding: "20px 0", ...style }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.5px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>Sponsored by</span>
        {sponsors.map((s) => {
          const Tag = safeHref(s.link_url) ? "a" : "span";
          return (
            <Tag key={s.id} {...linkProps(s)} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
              {s.logo_url ? (
                <img src={formatProductImage(s.logo_url)} alt={s.company_name} loading="lazy" decoding="async" style={{ height: 28, width: "auto", objectFit: "contain" }} />
              ) : (
                s.company_name
              )}
            </Tag>
          );
        })}
      </div>
    );
  }

  const s = visible[0];
  const Tag = safeHref(s.link_url) ? "a" : "div";

  if (variant === "overlay") {
    const img = s.logo_url || s.banner_url;
    return (
      <Tag
        {...linkProps(s)}
        aria-label={`Sponsored by ${s.company_name}`}
        style={{ position: "absolute", right: 16, bottom: 16, zIndex: 11, display: "flex", alignItems: "center", gap: 10, maxWidth: "min(260px, 60%)", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "8px 12px", textDecoration: "none", color: "white", ...style }}
      >
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.2px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", whiteSpace: "nowrap" }}>Sponsored by</span>
        {img ? (
          <img src={formatProductImage(img)} alt={s.company_name} loading="lazy" decoding="async" style={{ height: 28, maxWidth: 140, width: "auto", objectFit: "contain", display: "block" }} />
        ) : (
          <span style={{ fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.company_name}</span>
        )}
      </Tag>
    );
  }

  const fit = fitOf(s);
  const position = positionOf(s);
  const bannerSrc = s.banner_url ? formatProductImage(s.banner_url) : null;
  const video = s.video_url || null;
  return (
    <section style={{ padding: "32px 0", ...style }}>
      <div className="container">
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.5px", color: "#888", textTransform: "uppercase", marginBottom: 10 }}>Sponsored</div>
        <Tag
          {...linkProps(s)}
          style={{ display: "block", borderRadius: 16, overflow: "hidden", background: "#111", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", textDecoration: "none" }}
        >
          {bannerSrc || video ? (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch" }}>
              {bannerSrc && (
                <div style={{ position: "relative", flex: video ? "1 1 58%" : "1 1 100%", minWidth: "min(100%, 320px)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* "Show the whole banner": the space beside a narrower banner is filled with a blurred copy of it, not black */}
                  {fit === "contain" && (
                    <img src={bannerSrc} alt="" aria-hidden="true" loading="lazy" decoding="async"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(28px) brightness(0.55) saturate(1.2)", transform: "scale(1.2)" }} />
                  )}
                  <img
                    src={bannerSrc}
                    alt={s.company_name}
                    loading="lazy"
                    decoding="async"
                    style={fit === "cover"
                      ? { position: "relative", display: "block", width: "100%", height: "clamp(110px, 22vw, 260px)", objectFit: "cover", objectPosition: position }
                      : { position: "relative", display: "block", width: "100%", height: "auto", maxHeight: "min(360px, 70vw)", objectFit: "contain", objectPosition: position, margin: "0 auto" }}
                  />
                </div>
              )}
              {video && (
                <div style={{ flex: bannerSrc ? "1 1 38%" : "1 1 100%", minWidth: "min(100%, 280px)", aspectRatio: "16 / 9", maxHeight: bannerSrc ? "min(360px, 70vw)" : undefined, background: "#000" }}>
                  <SponsorVideo url={video} title={`${s.company_name} video`} />
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)", flexWrap: "wrap" }}>
              <img src={formatProductImage(s.logo_url)} alt={s.company_name} loading="lazy" decoding="async" style={{ height: 56, width: "auto", maxWidth: "40%", objectFit: "contain", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "white", fontWeight: 900, fontSize: 20 }}>{s.company_name}</div>
                {s.description && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>{s.description}</div>}
              </div>
            </div>
          )}
        </Tag>
      </div>
    </section>
  );
};

export default SponsorBanner;
