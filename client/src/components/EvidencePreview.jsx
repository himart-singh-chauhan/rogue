import React, { useEffect, useState } from 'react';

// YouTube / Vimeo helpers for evidence links
export const youtubeId = (url) => {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
};
const vimeoId = (url) => {
  const m = String(url || '').match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
};
export const embedUrlFor = (url, { autoplay = true } = {}) => {
  const yt = youtubeId(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}?${autoplay ? 'autoplay=1&mute=1&' : ''}loop=1&playlist=${yt}&playsinline=1&rel=0`;
  const vm = vimeoId(url);
  if (vm) return `https://player.vimeo.com/video/${vm}?${autoplay ? 'autoplay=1&muted=1&' : ''}loop=1`;
  return null;
};
export const videoThumbnailFor = (url) => {
  const yt = youtubeId(url);
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null;
};

/**
 * Shows the athlete's own evidence: the video file they picked, or the YouTube / Vimeo link they pasted.
 * Falls back to `fallbackImage` (e.g. the challenged record's thumbnail) and then to a plain dark panel —
 * never a stock photo.
 */
export default function EvidencePreview({ file, link, fallbackImage, opacity = 1, play = true, alt = 'Your evidence', style }) {
  const [objectUrl, setObjectUrl] = useState(null);
  useEffect(() => {
    if (!file) { setObjectUrl(null); return undefined; }
    const u = URL.createObjectURL(file);
    setObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const box = { width: '100%', height: '100%', objectFit: 'cover', opacity, display: 'block', border: 0, ...style };
  if (objectUrl && file?.type?.startsWith('video/')) {
    return <video src={objectUrl} muted playsInline loop autoPlay={play} preload="metadata" style={box} />;
  }
  if (objectUrl && file?.type?.startsWith('image/')) {
    return <img src={objectUrl} alt={alt} style={box} />;
  }
  const embed = link ? embedUrlFor(link, { autoplay: play }) : null;
  if (embed && play) {
    return <iframe src={embed} title={alt} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={box} />;
  }
  const thumb = link ? videoThumbnailFor(link) : null;
  if (thumb) return <img src={thumb} alt={alt} loading="lazy" decoding="async" style={box} />;
  if (fallbackImage) return <img src={fallbackImage} alt={alt} loading="lazy" decoding="async" style={box} />;
  return <div style={{ ...box, background: 'radial-gradient(circle at 30% 30%, rgba(255,106,0,0.18), #0d0d0d 70%)' }} />;
}
