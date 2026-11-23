// After `vite build`: give every public page real HTML so search engines, link previews (WhatsApp, Facebook…)
// and tools that don't run JavaScript see the page's title, description and text instead of an empty shell.
// The React app replaces this content as soon as it starts, so visitors see the normal site.
// Also writes sitemap.xml (pages + verified records). Never fails the build: if the API can't be reached,
// the record pages are simply skipped.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PAGES, NAV_LINKS, SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from "../src/seoPages.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(here, "..", "dist");
const API = (process.env.VITE_API_URL || "https://rogue-api.vercel.app/api").replace(/\/+$/, "");
const shell = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const getJson = async (p) => {
  try {
    const r = await fetch(API + p, { signal: AbortSignal.timeout(15000) });
    return r.ok ? await r.json() : null;
  } catch { return null; }
};

// Branded screen while the site starts (black + logo, like the loading animation); the text below it is for
// search engines and screen readers only and is never shown, so the plain page can't flash on a slow connection.
const css = `<style>html,body{background:#000}.seo-splash{position:fixed;inset:0;z-index:1;background:#000;display:flex;align-items:center;justify-content:center}.seo-splash img{width:120px;height:120px;opacity:.9}.seo-static{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;margin:-1px!important;padding:0!important;border:0!important}</style>`;

const render = ({ urlPath, title, description, h1, text = [], extra = "", jsonLd = null }) => {
  const url = SITE_URL + (urlPath === "/" ? "/" : urlPath);
  const head = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${SITE_URL}/images/ampex-og.jpg" />`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : "",
  ].join("\n    ");
  const body = `${css}<div class="seo-splash" aria-hidden="true"><img src="/images/ampex-logo.webp" alt="" width="120" height="120" /></div><div class="seo-static"><nav>${NAV_LINKS.map(([to, label]) => `<a href="${to}">${esc(label)}</a>`).join("")}</nav><main><h1>${esc(h1)}</h1>${text.map((p) => `<p>${esc(p)}</p>`).join("")}${extra}</main><footer><p>${esc(SITE_NAME)} · <a href="${SITE_URL}/">ampexworldrecords.com</a></p></footer></div>`;
  return shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:image" content=")\/([^"]*")/, `$1${SITE_URL}/$2`)
    .replace("</head>", `    ${head}\n  </head>`)
    .replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${body}</div>`);
};

// dist/about.html is served at /about (vercel.json: cleanUrls); "/" is dist/index.html
const write = (urlPath, html) => {
  const file = urlPath === "/" ? path.join(DIST, "index.html") : path.join(DIST, `${urlPath.replace(/^\//, "")}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};

const [records, events, settings, challenges] = await Promise.all([
  getJson("/records/explore/all?filter=new").then((d) => (Array.isArray(d?.records) ? d.records : [])),
  getJson("/events").then((d) => (Array.isArray(d) ? d : [])),
  getJson("/settings/public"),
  getJson("/open-records").then((d) => (Array.isArray(d) ? d : [])),
]);
const recordUrl = (r) => `/record/${encodeURIComponent(r.slug || r.id)}`;
const holder = (r) => r.user?.display_name || r.user?.name || r.athlete_id || "an AMPEX athlete";
const recordList = (list) => (list.length ? `<h2>Verified records</h2><ul>${list.slice(0, 200).map((r) => `<li><a href="${recordUrl(r)}">${esc(r.title)}</a> – ${esc(r.value)}${r.unit ? ` ${esc(String(r.unit).toLowerCase())}` : ""} by ${esc(holder(r))}${r.category ? ` (${esc(r.category)})` : ""}</li>`).join("")}</ul>` : "");
const eventList = (list) => (list.length ? `<h2>Events</h2><ul>${list.map((e) => `<li><a href="/stream/${esc(e.id)}">${esc(e.title)}</a>${e.date ? ` – ${esc(new Date(e.date).toUTCString().slice(0, 16))}` : ""}${e.isPaid ? ` – spectator pass $${Number(e.ticketPrice || 0).toFixed(2)}` : " – free to watch"}</li>`).join("")}</ul>` : "");

let pages = 0;
for (const [urlPath, p] of Object.entries(PAGES)) {
  const home = urlPath === "/";
  const title = home && settings?.seoTitle ? settings.seoTitle : p.title;
  const description = home && settings?.seoDescription ? settings.seoDescription : p.description;
  const extra = urlPath === "/explore-records" || home ? recordList(home ? records.slice(0, 12) : records) : urlPath === "/events" || urlPath === "/streams" ? eventList(events) : "";
  const jsonLd = home ? [
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, alternateName: "ampexworldrecords.com", url: SITE_URL + "/", potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/explore-records?q={search_term_string}`, "query-input": "required name=search_term_string" } },
    { "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: SITE_URL + "/", logo: `${SITE_URL}/images/ampex-logo-email.png` },
  ] : null;
  write(urlPath, render({ urlPath, title, description, h1: p.h1, text: p.text, extra, jsonLd }));
  pages += 1;
}
for (const r of records) {
  const title = `${r.title} – World Record by ${holder(r)} | AMPEX World Records`;
  const description = `Verified AMPEX World Record: ${r.title} – ${r.value}${r.unit ? ` ${String(r.unit).toLowerCase()}` : ""} by ${holder(r)}${r.category ? `, ${r.category}` : ""}. Think you can beat it? Challenge this record.`;
  write(recordUrl(r).split("/").map(decodeURIComponent).join("/"), render({
    urlPath: recordUrl(r), title, description, h1: r.title,
    text: [description, r.description || ""].filter(Boolean),
    extra: `<p><a href="/challenge">Challenge this record</a> · <a href="/explore-records">Explore Records</a></p>`,
  }));
  pages += 1;
}
// Try These Records: one page per challenge
const challengeUrl = (c) => `/try-these-records/${c.id}`;
for (const c of challenges) {
  const title = `${c.title} | Try These Records | AMPEX World Records`;
  const description = `${c.status === "set" ? "Record set" : "Open to set"}: ${c.title}. ${c.description || ""} Follow the rules, submit your attempt and become the first AMPEX record holder.`.trim();
  write(challengeUrl(c), render({ urlPath: challengeUrl(c), title, description, h1: c.title, text: [c.description || "", c.rules || ""].filter(Boolean) }));
  pages += 1;
}

const today = new Date().toISOString().slice(0, 10);
const urls = [...Object.keys(PAGES).filter((u) => !["/login", "/signup"].includes(u)), ...records.map(recordUrl), ...challenges.map(challengeUrl)];
fs.writeFileSync(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE_URL}${u === "/" ? "/" : u}</loc><lastmod>${today}</lastmod>${u === "/" ? "<priority>1.0</priority>" : ""}</url>`).join("\n")}\n</urlset>\n`);
console.log(`[prerender] ${pages} pages, ${records.length} records, sitemap with ${urls.length} links${records.length ? "" : " (records skipped: API not reachable)"}`);
void DEFAULT_TITLE; void DEFAULT_DESCRIPTION;
