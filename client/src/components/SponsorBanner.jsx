import { useEffect, useState } from "react";
import { API_URL, apiCall, formatProductImage } from "../utils/api";

/**
 * Shows active sponsors managed in Admin → Sponsorships.
 * Renders nothing when no sponsor is live for the given placements.
 *
 * placements: array of placement values from the admin form (e.g. ["homepage_top_banner", "homepage"])
 * variant:    "banner" (full-width image card) | "compact" (small "Sponsored by" row, used in the footer)
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

const SponsorBanner = ({ placements = [], variant = "banner", style }) => {
  const [sponsors, setSponsors] = useState([]);
  const [index, setIndex] = useState(0);
  const key = placements.join(",");

  useEffect(() => {
    let cancelled = false;
    apiCall(`/sponsors?placement=${encodeURIComponent(key)}`, "GET")
      .then((data) => {
        if (!cancelled) setSponsors(Array.isArray(data) ? data.filter((s) => s.banner_url || s.logo_url) : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Rotate when several sponsors share the spot
  useEffect(() => {
    if (variant !== "banner" || sponsors.length < 2) return undefined;
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
  return (
    <section style={{ padding: "32px 0", ...style }}>
      <div className="container">
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.5px", color: "#888", textTransform: "uppercase", marginBottom: 10 }}>Sponsored</div>
        <Tag
          {...linkProps(s)}
          style={{ display: "block", borderRadius: 16, overflow: "hidden", background: "#111", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", textDecoration: "none" }}
        >
          {s.banner_url ? (
            <img
              src={formatProductImage(s.banner_url)}
              alt={s.company_name}
              loading="lazy"
              decoding="async"
              style={{ display: "block", width: "100%", height: "auto", maxHeight: 260, objectFit: "cover" }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "24px 28px" }}>
              <img src={formatProductImage(s.logo_url)} alt={s.company_name} loading="lazy" decoding="async" style={{ height: 56, width: "auto", objectFit: "contain" }} />
              <div>
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
