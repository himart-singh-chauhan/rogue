import React from 'react';
import { useLocation } from 'react-router-dom';
import BackButton from './BackButton';

// A "Back to previous page" button on pages that don't have their own back bar.
// It sits just under the navbar at the top of the page and scrolls away with it.
const SHOW_ON = [
  /^\/categories$/, /^\/shop$/, /^\/events$/, /^\/schedule$/, /^\/streams$/, /^\/stream\//,
  /^\/elite$/, /^\/certificate/, /^\/leaderboards?$/, /^\/local-leaderboards$/, /^\/local-rankings$/, /^\/global-leaderboard$/,
  /^\/faq$/, /^\/about$/, /^\/contact$/, /^\/rules$/, /^\/process$/, /^\/appeals$/, /^\/terms$/, /^\/privacy$/, /^\/cookies$/,
  /^\/submit-evidence-info$/, /^\/global-recognition-info$/, /^\/adjudication-info$/, /^\/verification-protocol-info$/,
  /^\/challenge$/, /^\/verify$/, /^\/challenge-verify$/, /^\/profile$/,
];
const FALLBACK = { '/product': '/shop', '/cart': '/shop', '/stream': '/events', '/certificate': '/' };

export default function FloatingBack() {
  const { pathname } = useLocation();
  if (!SHOW_ON.some((re) => re.test(pathname))) return null;
  const fallback = Object.entries(FALLBACK).find(([p]) => pathname.startsWith(p))?.[1] || '/';
  return (
    <div className="floating-back" style={{ position: 'absolute', zIndex: 60, left: 'max(5%, calc((100% - 1400px) / 2))' }}>
      <BackButton fallback={fallback} style={{ background: 'rgba(17,17,17,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
      <style>{`
        .floating-back { top: 100px; }
        @media (max-width: 1024px) { .floating-back { top: 84px; } }
      `}</style>
    </div>
  );
}
