import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// "Back to previous page" pill used at the top of pages. Falls back to a page when there is no history
// (e.g. the page was opened from a shared link).
export default function BackButton({ fallback = '/', label = 'Back to previous page', style }) {
  const navigate = useNavigate();
  const goBack = () => {
    const hasHistory = typeof window !== 'undefined' && window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0;
    if (hasHistory) navigate(-1);
    else navigate(fallback);
  };
  return (
    <button
      type="button"
      onClick={goBack}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255, 106, 0, 0.1)',
        border: '1px solid rgba(255, 106, 0, 0.3)', color: '#FF6A00', cursor: 'pointer', fontSize: 12, fontWeight: 800,
        textTransform: 'uppercase', padding: '8px 16px', borderRadius: 100, letterSpacing: '0.02em', ...style,
      }}
    >
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
