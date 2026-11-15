// Achievement Award design: drawn on a canvas and saved as a PDF. It is its own design (not the
// World Record Certificate): heading "Achievement Award", the award's badge (emoji or image), the award
// title, the member's name, the description, the date and award number, and the two signatures.
// Used by: Admin → Achievement Awards (preview + download), member profiles (print / download).
//
// award: { title, description, recipientName, date, awardNumber, icon, imageUrl, backgroundUrl,
//          orientation: 'landscape' | 'portrait', color, signers: [{ name, title, signatureUrl }] }

const SERIF = '"Georgia", "Times New Roman", serif';
const INK = '#1d1508';
const SOFT = '#5a4a2c';
const GOLD_DARK = '#8a6412';

export const DEFAULT_SIGNERS = [
  { name: 'Curtis Freeman', title: 'President / CEO', signatureUrl: '/certificates/signature-curtis-freeman.png' },
  { name: 'Stephen Pelham', title: 'Verified By', signatureUrl: '/certificates/signature-stephen-pelham.png' },
];

const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');
const resolve = (url) => {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${origin()}${url.startsWith('/') ? '' : '/'}${url}`;
};
const cache = new Map();
const loadImage = (url) => {
  const src = resolve(url);
  if (!src) return Promise.resolve(null);
  if (!cache.has(src)) {
    cache.set(src, new Promise((res) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = () => { cache.delete(src); res(null); }; // a missing picture never blocks the award
      img.src = src;
    }));
  }
  return cache.get(src);
};

// An achievement_awards row (admin) in the shape drawAward expects
export const awardFromRow = (a, extra = {}) => ({
  title: a.title, description: a.description, icon: a.icon, imageUrl: a.image_url, backgroundUrl: a.background_url,
  orientation: a.orientation, color: a.color, design: a.design || 'classic',
  signers: [
    { name: a.signer1_name, title: a.signer1_title, signatureUrl: a.signer1_signature_url },
    { name: a.signer2_name, title: a.signer2_title, signatureUrl: a.signer2_signature_url },
  ].filter((s) => s.name || s.signatureUrl),
  ...extra,
});

export const formatAwardDate = (value) => {
  if (!value) return '';
  const s = String(value).slice(0, 10);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
};

const fit = (ctx, text, px, maxW, style, family = SERIF, minScale = 0.45) => {
  let size = px;
  ctx.font = `${style} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxW && size > px * minScale) { size *= 0.95; ctx.font = `${style} ${size}px ${family}`; }
  return size;
};

const wrapLines = (ctx, text, maxW, maxLines) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last.trimEnd()}…`;
    return kept;
  }
  return lines;
};

const goldGradient = (ctx, x0, y0, x1, y1) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, '#7a5410'); g.addColorStop(0.25, '#f6d77a'); g.addColorStop(0.5, '#b8861f');
  g.addColorStop(0.75, '#ffe9a3'); g.addColorStop(1, '#8a6412');
  return g;
};

const drawFrame = (ctx, W, H) => {
  const u = Math.min(W, H);
  const bg = ctx.createRadialGradient(W / 2, H / 2, u * 0.1, W / 2, H / 2, Math.max(W, H) * 0.7);
  bg.addColorStop(0, '#fffaf0'); bg.addColorStop(0.7, '#f6ecd4'); bg.addColorStop(1, '#e9d7ad');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // outer black band, gold band, red line, thin gold line
  const b1 = u * 0.022; const b2 = u * 0.018;
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = goldGradient(ctx, 0, 0, W, H); ctx.fillRect(b1, b1, W - 2 * b1, H - 2 * b1);
  ctx.fillStyle = '#9b1c1c'; ctx.fillRect(b1 + b2, b1 + b2, W - 2 * (b1 + b2), H - 2 * (b1 + b2));
  const inset = b1 + b2 + u * 0.008;
  ctx.fillStyle = bg; ctx.fillRect(inset, inset, W - 2 * inset, H - 2 * inset);
  ctx.strokeStyle = goldGradient(ctx, 0, 0, W, H); ctx.lineWidth = u * 0.004;
  const i2 = inset + u * 0.014;
  ctx.strokeRect(i2, i2, W - 2 * i2, H - 2 * i2);
  // gold corner ornaments
  ctx.fillStyle = goldGradient(ctx, 0, 0, u * 0.2, u * 0.2);
  const r = u * 0.05;
  [[i2, i2], [W - i2, i2], [i2, H - i2], [W - i2, H - i2]].forEach(([cx, cy]) => {
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2); ctx.fillStyle = '#9b1c1c'; ctx.fill();
    ctx.fillStyle = goldGradient(ctx, 0, 0, u * 0.2, u * 0.2);
  });
};

const drawMedal = (ctx, cx, cy, r, color, icon, badgeImg) => {
  ctx.save();
  // ribbon tails
  ctx.fillStyle = '#9b1c1c';
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(cx + s * r * 0.25, cy + r * 0.6);
    ctx.lineTo(cx + s * r * 0.8, cy + r * 1.32);
    ctx.lineTo(cx + s * r * 0.55, cy + r * 1.22);
    ctx.lineTo(cx + s * r * 0.42, cy + r * 1.45);
    ctx.lineTo(cx + s * r * -0.05, cy + r * 0.75);
    ctx.closePath(); ctx.fill();
  });
  // gold sunburst rim
  ctx.fillStyle = goldGradient(ctx, cx - r, cy - r, cx + r, cy + r);
  ctx.beginPath();
  const spikes = 28;
  for (let i = 0; i < spikes * 2; i += 1) {
    const a = (Math.PI * i) / spikes;
    const rr = i % 2 === 0 ? r * 1.12 : r * 1.0;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
  // inner disc in the award colour
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r * 0.88);
  g.addColorStop(0, '#2a2a2a'); g.addColorStop(1, '#050505');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = r * 0.07; ctx.strokeStyle = color || '#FF6A00';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); ctx.stroke();
  if (badgeImg) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.74, 0, Math.PI * 2); ctx.clip();
    const s = (r * 1.48) / Math.max(badgeImg.naturalWidth, badgeImg.naturalHeight);
    const w = badgeImg.naturalWidth * s; const h = badgeImg.naturalHeight * s;
    ctx.drawImage(badgeImg, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  } else {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${r * 0.95}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.fillText(icon || '🏆', cx, cy + r * 0.05);
  }
  ctx.restore();
};

const text = (ctx, value, x, y, px, { style = '', color = INK, align = 'center', maxW, family = SERIF, baseline = 'alphabetic' } = {}) => {
  if (!value) return 0;
  ctx.save();
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = baseline;
  const size = maxW ? fit(ctx, value, px, maxW, style, family) : px;
  ctx.font = `${style} ${size}px ${family}`;
  ctx.fillText(value, x, y);
  ctx.restore();
  return size;
};

// Positions as fractions of the page; landscape and portrait have their own layout
const LAYOUTS = {
  landscape: {
    logo: [0.5, 0.105, 0.3], heading: [0.5, 0.225, 0.062], medal: [0.5, 0.35, 0.07],
    title: [0.5, 0.51, 0.048, 0.8], presented: [0.5, 0.553, 0.022], name: [0.5, 0.618, 0.055, 0.62], line: [0.27, 0.633, 0.73],
    desc: [0.5, 0.678, 0.02, 0.72, 2], sigY: 0.86, sigX: [0.215, 0.785], sigW: 0.24, seal: [0.5, 0.872, 0.068],
    meta: [0.5, 0.752],
  },
  portrait: {
    logo: [0.5, 0.098, 0.42], heading: [0.5, 0.2, 0.055], medal: [0.5, 0.31, 0.06],
    title: [0.5, 0.45, 0.044, 0.82], presented: [0.5, 0.49, 0.021], name: [0.5, 0.55, 0.048, 0.78], line: [0.17, 0.565, 0.83],
    desc: [0.5, 0.61, 0.019, 0.76, 4], sigY: 0.82, sigX: [0.25, 0.75], sigW: 0.32, seal: [0.5, 0.888, 0.052],
    meta: [0.5, 0.735],
  },
};

// ---------- The AMPEX award design (Curtis's artwork, Nov 2026) ----------
// 'artwork': a finished design (title, description and signatures printed on it) → write the name, date, number
// 'template': the same design with an empty banner and parchment → also write the title and description
export const AWARD_TEMPLATE_URL = '/awards/award-template.jpg';
const NAVY = '#141a46';
const DESIGNED = {
  name: [0.5, 0.476, 0.043, 0.68],      // on the line under "PRESENTED TO"
  meta: [0.5, 0.704, 0.0122, 0.62],     // in the gap above the seal
  title: { x: 0.5, maxW: 0.53, lines: [[0.279, 0.044], [0.329, 0.056], [0.373, 0.056]] },
  desc: { x: 0.5, y: 0.549, size: 0.0222, maxW: 0.74, lineH: 1.3, maxLines: 4 },
};

// "Grand Champion Achievement Award" → ["GRAND CHAMPION", "ACHIEVEMENT", "AWARD"], like the printed designs
const titleLines = (ctx, title, maxW, sizePx) => {
  const t = String(title || 'Achievement Award').trim().toUpperCase();
  const m = t.match(/^(.*?)\s*ACHIEVEMENT\s+AWARD$/);
  if (m && m[1]) return [m[1], 'ACHIEVEMENT', 'AWARD'];
  ctx.font = `bold ${sizePx}px ${SERIF}`;
  return wrapLines(ctx, t, maxW, 3);
};

const goldText = (ctx, value, x, y, px, maxW) => {
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const size = fit(ctx, value, px, maxW, 'bold', SERIF, 0.5);
  ctx.font = `bold ${size}px ${SERIF}`;
  ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = size * 0.12; ctx.shadowOffsetY = size * 0.05;
  ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.07; ctx.strokeStyle = '#3a2306'; ctx.strokeText(value, x, y);
  ctx.shadowColor = 'transparent';
  const g = ctx.createLinearGradient(0, y - size * 0.75, 0, y + size * 0.05);
  g.addColorStop(0, '#fff7cf'); g.addColorStop(0.45, '#f5cf62'); g.addColorStop(0.75, '#d9a32e'); g.addColorStop(1, '#a8741a');
  ctx.fillStyle = g; ctx.fillText(value, x, y);
  ctx.restore();
};

const drawDesigned = async (ctx, W, H, award, bgUrl, writeTexts) => {
  const bg = await loadImage(bgUrl);
  if (!bg) throw new Error('The award design image could not be loaded.');
  ctx.drawImage(bg, 0, 0, W, H);
  if (writeTexts) {
    const T = DESIGNED.title;
    const lines = titleLines(ctx, award.title, T.maxW * W, T.lines[1][1] * H);
    const slots = lines.length === 3 ? T.lines : lines.length === 2 ? [[0.302, 0.056], [0.36, 0.056]] : [[0.333, 0.06]];
    lines.forEach((ln, i) => goldText(ctx, ln, T.x * W, slots[i][0] * H, slots[i][1] * H, T.maxW * W));
    if (award.description) {
      const D = DESIGNED.desc;
      ctx.save(); ctx.fillStyle = NAVY; ctx.textAlign = 'center';
      let size = D.size * H;
      ctx.font = `italic bold ${size}px ${SERIF}`;
      let desc = wrapLines(ctx, award.description, D.maxW * W, 99);
      while (desc.length > D.maxLines && size > D.size * H * 0.72) { size *= 0.94; ctx.font = `italic bold ${size}px ${SERIF}`; desc = wrapLines(ctx, award.description, D.maxW * W, 99); }
      desc = wrapLines(ctx, award.description, D.maxW * W, D.maxLines);
      const top = D.y * H + ((D.maxLines - desc.length) * size * D.lineH) / 2.6;
      desc.forEach((ln, i) => ctx.fillText(ln, D.x * W, top + i * size * D.lineH));
      ctx.restore();
    }
  }
  const [nx, ny, ns, nw] = DESIGNED.name;
  text(ctx, award.recipientName || '', nx * W, ny * H, ns * H, { style: 'italic bold', maxW: nw * W, color: NAVY });
  const meta = [award.date ? `Awarded ${formatAwardDate(award.date)}` : '', award.awardNumber ? `Award No. ${award.awardNumber}` : ''].filter(Boolean).join('   ·   ');
  const [mx, my, ms, mw] = DESIGNED.meta;
  text(ctx, meta, mx * W, my * H, ms * H, { style: 'bold', maxW: mw * W, color: '#3d3a52' });
};

export const drawAward = async (canvas, award, { width } = {}) => {
  if (award.design === 'artwork' || award.design === 'template') {
    const W = Math.round(width || 2200);
    const H = Math.round(W * (1427 / 1102));
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    const artwork = award.design === 'artwork' && award.backgroundUrl;
    await drawDesigned(ctx, W, H, award, artwork ? award.backgroundUrl : AWARD_TEMPLATE_URL, !artwork);
    return canvas;
  }
  const portrait = award.orientation === 'portrait';
  const W = Math.round(width || 2200);
  const H = Math.round(portrait ? W * (11 / 8.5) : W * (8.5 / 11));
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  const L = portrait ? LAYOUTS.portrait : LAYOUTS.landscape;
  const signers = (award.signers && award.signers.length ? award.signers : DEFAULT_SIGNERS).slice(0, 2);
  const [bgImg, logoImg, sealImg, badgeImg, ...sigImgs] = await Promise.all([
    loadImage(award.backgroundUrl), loadImage('/images/ampex-logo.webp'), loadImage('/images/ampex-logo.webp'),
    loadImage(award.imageUrl), ...signers.map((s) => loadImage(s.signatureUrl)),
  ]);

  if (bgImg) ctx.drawImage(bgImg, 0, 0, W, H); else drawFrame(ctx, W, H);
  const color = award.color || '#FF6A00';

  if (!bgImg && logoImg) {
    const [lx, ly, lw] = L.logo; const w = W * lw * (portrait ? 1 : 0.62); const h = w * (logoImg.naturalHeight / logoImg.naturalWidth);
    ctx.drawImage(logoImg, lx * W - w / 2, ly * H - h / 2, w, h);
  }
  // heading
  {
    const [hx, hy, hs] = L.heading;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const size = fit(ctx, 'ACHIEVEMENT AWARD', hs * H, W * 0.8, 'bold');
    ctx.font = `bold ${size}px ${SERIF}`;
    ctx.lineWidth = size * 0.035; ctx.lineJoin = 'round'; ctx.strokeStyle = '#3a2808'; ctx.strokeText('ACHIEVEMENT AWARD', hx * W, hy * H);
    ctx.fillStyle = goldGradient(ctx, 0, hy * H - size, 0, hy * H); ctx.fillText('ACHIEVEMENT AWARD', hx * W, hy * H);
    ctx.restore();
  }
  drawMedal(ctx, L.medal[0] * W, L.medal[1] * H, L.medal[2] * H, color, award.icon, badgeImg);
  text(ctx, award.title || 'Achievement', L.title[0] * W, L.title[1] * H, L.title[2] * H, { style: 'bold', maxW: L.title[3] * W, color: '#141008' });
  text(ctx, 'This award is proudly presented to', L.presented[0] * W, L.presented[1] * H, L.presented[2] * H, { style: 'italic', color: SOFT });
  text(ctx, award.recipientName || '', L.name[0] * W, L.name[1] * H, L.name[2] * H, { style: 'italic bold', maxW: L.name[3] * W, color: INK });
  ctx.save(); ctx.strokeStyle = GOLD_DARK; ctx.lineWidth = H * 0.0022;
  ctx.beginPath(); ctx.moveTo(L.line[0] * W, L.line[1] * H); ctx.lineTo(L.line[2] * W, L.line[1] * H); ctx.stroke(); ctx.restore();
  // description (wrapped)
  if (award.description) {
    const [dx, dy, ds, dw, maxLines] = L.desc;
    ctx.save(); ctx.fillStyle = '#2c2416'; ctx.textAlign = 'center'; ctx.font = `${ds * H}px ${SERIF}`;
    const lines = wrapLines(ctx, award.description, dw * W, maxLines);
    lines.forEach((ln, i) => ctx.fillText(ln, dx * W, dy * H + i * ds * H * 1.45));
    ctx.restore();
  }
  // date + award number
  const meta = [award.date ? `Awarded ${formatAwardDate(award.date)}` : '', award.awardNumber ? `Award No. ${award.awardNumber}` : ''].filter(Boolean).join('     ·     ');
  text(ctx, meta, L.meta[0] * W, L.meta[1] * H, H * (portrait ? 0.0145 : 0.017), { color: SOFT, style: 'bold', maxW: W * 0.7 });
  // signatures
  signers.forEach((s, i) => {
    const x = L.sigX[i] * W; const lineY = L.sigY * H; const w = L.sigW * W;
    const img = sigImgs[i];
    if (img) {
      const h = Math.min(H * 0.075, w * 0.9 * (img.naturalHeight / img.naturalWidth));
      const iw = h * (img.naturalWidth / img.naturalHeight);
      ctx.drawImage(img, x - iw / 2, lineY - h - H * 0.004, iw, h);
    } else if (s.name) {
      text(ctx, s.name, x, lineY - H * 0.012, H * 0.042, { style: 'italic', color: '#b3121f', maxW: w, family: '"Brush Script MT", "Segoe Script", cursive' });
    }
    ctx.save(); ctx.strokeStyle = '#222'; ctx.lineWidth = H * 0.0018;
    ctx.beginPath(); ctx.moveTo(x - w / 2, lineY); ctx.lineTo(x + w / 2, lineY); ctx.stroke(); ctx.restore();
    text(ctx, s.name || '', x, lineY + H * 0.03, H * 0.02, { style: 'bold', maxW: w });
    text(ctx, s.title || '', x, lineY + H * 0.056, H * 0.019, { style: 'italic', color: SOFT, maxW: w });
  });
  if (sealImg && !bgImg) {
    const [sx, sy, sr] = L.seal; const d = sr * 2 * H;
    ctx.drawImage(sealImg, sx * W - d / 2, sy * H - d / 2, d, d);
  }
  return canvas;
};

export const renderAwardCanvas = async (award, width) => {
  const canvas = document.createElement('canvas');
  return drawAward(canvas, award, { width });
};

export const downloadAwardPdf = async (award) => {
  const canvas = await renderAwardCanvas(award, 2400);
  const { jsPDF } = await import('jspdf');
  const portrait = award.orientation === 'portrait' || award.design === 'artwork' || award.design === 'template';
  const pageW = portrait ? 612 : 792;
  const pageH = portrait ? 792 : 612;
  const pdf = new jsPDF({ orientation: portrait ? 'portrait' : 'landscape', unit: 'pt', format: [pageW, pageH], compress: true });
  let data;
  try { data = canvas.toDataURL('image/jpeg', 0.92); } catch { throw new Error('One of the award images blocks downloads. Upload it again from the admin panel.'); }
  pdf.addImage(data, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
  pdf.setProperties({ title: `AMPEX Achievement Award ${award.awardNumber || ''}`.trim(), subject: award.title || 'Achievement Award', author: 'AMPEX World Records' });
  const safe = String(award.title || 'award').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  pdf.save(`ampex-award-${safe}${award.awardNumber ? `-${award.awardNumber}` : ''}.pdf`);
};
