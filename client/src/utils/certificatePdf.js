// Draws an AMPEX certificate (template image + the issued details) on a canvas,
// and turns it into a downloadable PDF. Used by the admin issue preview, the admin
// "Download PDF" button and the athlete's "My Certificates".
//
// Field positions are fractions of the template's width (x, maxW) and height (y, size),
// measured on the two AMPEX designs supplied by the client.

const NAME_FONT = '"Georgia", "Times New Roman", serif';
const BODY_FONT = '"Georgia", "Times New Roman", serif';
const INK = '#1d1508';
const SOFT_INK = '#5a4a2c';

export const LAYOUT_PRESETS = {
  // 11 x 8.5 in design: fields written on the blank lines next to the printed labels
  'ampex-landscape': {
    orientation: 'landscape',
    fields: {
      recipientName: { x: 0.497, y: 0.503, maxW: 0.52, size: 0.043, align: 'center', baseline: 'middle', font: NAME_FONT, style: 'italic bold', minScale: 0.42 },
      recordTitle: { x: 0.21, y: 0.721, maxW: 0.198, size: 0.022, align: 'left', wrap: true },
      recordValue: { x: 0.3, y: 0.765, maxW: 0.107, size: 0.022, align: 'left' },
      dateAchieved: { x: 0.727, y: 0.713, maxW: 0.166, size: 0.022, align: 'left' },
      dateVerified: { x: 0.718, y: 0.754, maxW: 0.175, size: 0.022, align: 'left' },
      certificateNumber: { x: 0.756, y: 0.794, maxW: 0.137, size: 0.019, align: 'left', style: 'bold' },
      verifyUrl: { x: 0.725, y: 0.884, maxW: 0.25, size: 0.0135, align: 'center', color: SOFT_INK, prefix: 'Verify at ' },
    },
  },
  // 8.5 x 11 in design
  'ampex-portrait': {
    orientation: 'portrait',
    fields: {
      recipientName: { x: 0.497, y: 0.455, maxW: 0.575, size: 0.03, align: 'center', baseline: 'middle', font: NAME_FONT, style: 'italic bold', minScale: 0.42 },
      recordTitle: { x: 0.298, y: 0.672, maxW: 0.555, size: 0.0165, align: 'left', wrap: true },
      recordValue: { x: 0.438, y: 0.6965, maxW: 0.418, size: 0.0165, align: 'left' },
      dateAchieved: { x: 0.322, y: 0.7195, maxW: 0.533, size: 0.0165, align: 'left' },
      dateVerified: { x: 0.317, y: 0.7435, maxW: 0.538, size: 0.0165, align: 'left' },
      certificateNumber: { x: 0.384, y: 0.7685, maxW: 0.472, size: 0.0155, align: 'left', style: 'bold' },
      verifyUrl: { x: 0.86, y: 0.8, maxW: 0.26, size: 0.0098, align: 'right', color: SOFT_INK, prefix: 'Verify at ', wrapPrefix: true },
    },
  },
  // Custom uploads: the template has no printed labels, so labels are drawn with the values
  'generic-landscape': {
    orientation: 'landscape',
    generic: true,
    fields: {
      heading: { x: 0.5, y: 0.36, maxW: 0.7, size: 0.03, align: 'center', style: 'bold', color: SOFT_INK, text: 'This certificate is proudly presented to' },
      recipientName: { x: 0.5, y: 0.45, maxW: 0.7, size: 0.065, align: 'center', baseline: 'middle', font: NAME_FONT, style: 'italic bold', minScale: 0.42 },
      recordTitle: { x: 0.5, y: 0.56, maxW: 0.75, size: 0.032, align: 'center', style: 'bold', wrap: true },
      recordValue: { x: 0.5, y: 0.615, maxW: 0.7, size: 0.026, align: 'center', prefix: 'Official record: ' },
      dates: { x: 0.5, y: 0.67, maxW: 0.8, size: 0.022, align: 'center' },
      certificateNumber: { x: 0.5, y: 0.72, maxW: 0.6, size: 0.02, align: 'center', style: 'bold', prefix: 'Certificate No. ' },
      verifyUrl: { x: 0.5, y: 0.76, maxW: 0.7, size: 0.016, align: 'center', color: SOFT_INK, prefix: 'Verify at ' },
    },
  },
  'generic-portrait': {
    orientation: 'portrait',
    generic: true,
    fields: {
      heading: { x: 0.5, y: 0.38, maxW: 0.8, size: 0.022, align: 'center', style: 'bold', color: SOFT_INK, text: 'This certificate is proudly presented to' },
      recipientName: { x: 0.5, y: 0.45, maxW: 0.8, size: 0.045, align: 'center', baseline: 'middle', font: NAME_FONT, style: 'italic bold', minScale: 0.42 },
      recordTitle: { x: 0.5, y: 0.53, maxW: 0.82, size: 0.024, align: 'center', style: 'bold', wrap: true },
      recordValue: { x: 0.5, y: 0.57, maxW: 0.8, size: 0.019, align: 'center', prefix: 'Official record: ' },
      dates: { x: 0.5, y: 0.61, maxW: 0.85, size: 0.016, align: 'center' },
      certificateNumber: { x: 0.5, y: 0.65, maxW: 0.7, size: 0.015, align: 'center', style: 'bold', prefix: 'Certificate No. ' },
      verifyUrl: { x: 0.5, y: 0.68, maxW: 0.85, size: 0.012, align: 'center', color: SOFT_INK, prefix: 'Verify at ' },
    },
  },
};

export const PRESET_OPTIONS = [
  { value: 'ampex-landscape', label: 'AMPEX design — landscape' },
  { value: 'ampex-portrait', label: 'AMPEX design — portrait' },
  { value: 'generic-landscape', label: 'Custom design — landscape (labels drawn)' },
  { value: 'generic-portrait', label: 'Custom design — portrait (labels drawn)' },
];

export const presetFor = (template) => {
  const key = template?.layout?.preset;
  if (key && LAYOUT_PRESETS[key]) return LAYOUT_PRESETS[key];
  return template?.orientation === 'portrait' ? LAYOUT_PRESETS['generic-portrait'] : LAYOUT_PRESETS['generic-landscape'];
};

// "2026-03-04" -> "March 4, 2026" (no timezone shift)
export const formatCertDate = (value) => {
  if (!value) return '';
  const s = String(value).slice(0, 10);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
};

const siteOrigin = () => (typeof window !== 'undefined' && window.location?.origin) || 'https://rogue-client.vercel.app';

export const verifyUrlFor = (number) => `${siteOrigin()}/certificate/${encodeURIComponent(number || '')}`;
const verifyLabelFor = (number) => verifyUrlFor(number).replace(/^https?:\/\//, '');

const resolveSrc = (url) => {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${siteOrigin()}${url.startsWith('/') ? '' : '/'}${url}`;
};

const imageCache = new Map();
export const loadTemplateImage = (url) => {
  const src = resolveSrc(url);
  if (!imageCache.has(src)) {
    imageCache.set(src, new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // template images in Supabase storage: keeps the canvas exportable
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => {
        imageCache.delete(src);
        reject(new Error('Could not load the certificate template image.'));
      };
      img.src = src;
    }));
  }
  return imageCache.get(src);
};

// Shrinks the font until the text fits, then trims with an ellipsis as a last resort
const fitText = (ctx, text, spec, W, H) => {
  const maxW = spec.maxW * W;
  const family = spec.font || BODY_FONT;
  const style = spec.style || '';
  let px = spec.size * H;
  const minPx = px * (spec.minScale || 0.55);
  ctx.font = `${style} ${px}px ${family}`;
  while (ctx.measureText(text).width > maxW && px > minPx) {
    px *= 0.94;
    ctx.font = `${style} ${px}px ${family}`;
  }
  let out = text;
  if (ctx.measureText(out).width > maxW) {
    while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW) out = out.slice(0, -1);
    out = `${out.trimEnd()}…`;
  }
  return { text: out, px };
};

// Splits text into two lines of similar width (used for long record titles)
const splitInTwo = (ctx, text) => {
  const words = text.split(/\s+/);
  if (words.length < 2) return [text];
  let best = null;
  for (let i = 1; i < words.length; i += 1) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const widest = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (!best || widest < best.widest) best = { lines: [a, b], widest };
  }
  return best.lines;
};

const drawField = (ctx, spec, value, W, H) => {
  if (!spec || value === undefined || value === null || String(value).trim() === '') return;
  const text = `${spec.prefix || ''}${String(value).trim()}`;
  ctx.save();
  ctx.fillStyle = spec.color || INK;
  ctx.textAlign = spec.align || 'left';
  ctx.textBaseline = spec.baseline || 'alphabetic';
  const family = spec.font || BODY_FONT;
  const style = spec.style || '';
  ctx.font = `${style} ${spec.size * H}px ${family}`;
  const tooWide = ctx.measureText(text).width > spec.maxW * W * 1.25;
  if (spec.wrap && tooWide && text.includes(' ')) {
    // two lines; the second sits on the printed line, the first just above it
    const lineSpec = { ...spec, size: spec.size * 0.9 };
    ctx.font = `${style} ${lineSpec.size * H}px ${family}`;
    const [a, b] = splitInTwo(ctx, text);
    const second = fitText(ctx, b, lineSpec, W, H);
    const first = fitText(ctx, a, { ...lineSpec, size: second.px / H }, W, H);
    ctx.font = `${style} ${second.px}px ${family}`;
    ctx.fillText(second.text, spec.x * W, spec.y * H);
    ctx.font = `${style} ${first.px}px ${family}`;
    ctx.fillText(first.text, spec.x * W, spec.y * H - second.px * 1.12);
  } else if (spec.wrapPrefix && spec.prefix) {
    // two short lines: "Verify at" / the address
    const first = fitText(ctx, spec.prefix.trim(), spec, W, H);
    ctx.fillText(first.text, spec.x * W, spec.y * H);
    const second = fitText(ctx, String(value).trim(), spec, W, H);
    ctx.fillText(second.text, spec.x * W, spec.y * H + second.px * 1.35);
  } else {
    const fitted = fitText(ctx, text, spec, W, H);
    ctx.fillText(fitted.text, spec.x * W, spec.y * H);
  }
  ctx.restore();
};

// cert: { recipientName, recordTitle, recordValue, dateAchieved, dateVerified, certificateNumber }
export const drawCertificate = (canvas, img, cert, template, width) => {
  const W = Math.round(width || img.naturalWidth);
  const H = Math.round(W * (img.naturalHeight / img.naturalWidth));
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, W, H);

  const preset = presetFor(template);
  const f = preset.fields;
  const number = cert.certificateNumber || 'AMPEX-0000-PREVIEW';
  if (f.heading) drawField(ctx, f.heading, f.heading.text, W, H);
  drawField(ctx, f.recipientName, cert.recipientName, W, H);
  drawField(ctx, f.recordTitle, cert.recordTitle, W, H);
  drawField(ctx, f.recordValue, cert.recordValue, W, H);
  if (f.dates) {
    const parts = [];
    if (cert.dateAchieved) parts.push(`Achieved ${formatCertDate(cert.dateAchieved)}`);
    if (cert.dateVerified) parts.push(`Verified ${formatCertDate(cert.dateVerified)}`);
    drawField(ctx, f.dates, parts.join('   ·   '), W, H);
  } else {
    drawField(ctx, f.dateAchieved, formatCertDate(cert.dateAchieved), W, H);
    drawField(ctx, f.dateVerified, formatCertDate(cert.dateVerified), W, H);
  }
  drawField(ctx, f.certificateNumber, number, W, H);
  drawField(ctx, f.verifyUrl, verifyLabelFor(number), W, H);
  return canvas;
};

export const renderCertificateCanvas = async (cert, template, width) => {
  const img = await loadTemplateImage(template?.imageUrl);
  const canvas = document.createElement('canvas');
  return drawCertificate(canvas, img, cert, template, width || Math.min(3300, Math.max(2000, img.naturalWidth)));
};

// Builds the PDF (page size follows the template's proportions: 11in wide landscape, 8.5in wide portrait)
export const downloadCertificatePdf = async (cert, template) => {
  const canvas = await renderCertificateCanvas(cert, template);
  const { jsPDF } = await import('jspdf');
  const landscape = canvas.width >= canvas.height;
  const pageW = landscape ? 792 : 612; // points
  const pageH = Math.round(pageW * (canvas.height / canvas.width));
  const pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'pt', format: [pageW, pageH], compress: true });
  let data;
  try {
    data = canvas.toDataURL('image/jpeg', 0.92);
  } catch {
    throw new Error('The template image blocks downloads (storage CORS). Re-upload the template from the admin panel.');
  }
  pdf.addImage(data, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
  pdf.setProperties({
    title: `AMPEX World Records Certificate ${cert.certificateNumber || ''}`.trim(),
    subject: cert.recordTitle || 'Official World Record Certificate',
    author: 'AMPEX World Records',
  });
  pdf.save(`${cert.certificateNumber || 'ampex-certificate'}.pdf`);
};
