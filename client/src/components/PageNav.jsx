import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Home, Trophy, Globe, MapPin, Search, Target } from 'lucide-react';

const PageNav = ({ breadcrumbs = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // If we have history, go back. Otherwise go to explore records or home as a fallback.
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/explore-records');
    }
  };

  return (
    <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px 5%', position: 'sticky', top: '80px', marginTop: '80px', zIndex: 90, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Row: Back Button & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        
        <button 
          onClick={handleBack}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 106, 0, 0.1)', 
            border: '1px solid rgba(255, 106, 0, 0.3)', color: '#FF6A00', cursor: 'pointer', 
            fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', padding: '8px 16px', 
            borderRadius: '100px', transition: 'all 0.2s' 
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#FF6A00'; e.currentTarget.style.color = '#FFF'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 106, 0, 0.1)'; e.currentTarget.style.color = '#FF6A00'; }}
        >
          <ArrowLeft size={16} /> Back to Previous Page
        </button>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', flexWrap: 'wrap' }}>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>&gt;</span>}
                {crumb.path ? (
                  <Link 
                    to={crumb.path} 
                    style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', transition: 'color 0.2s' }} 
                    onMouseOver={e => e.target.style.color = '#FF6A00'} 
                    onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Row: Tab Bar */}
      <div style={{ maxWidth: '1400px', width: '100%', minWidth: 0, margin: '0 auto', display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {[
          { icon: <Home size={14} />, label: 'Home', path: '/' },
          { icon: <Search size={14} />, label: 'Explore Records', path: '/explore-records' },
          { icon: <Trophy size={14} />, label: 'Leaderboards', path: '/leaderboard' },
          { icon: <Globe size={14} />, label: 'Global Rankings', path: '/global-rankings' },
          { icon: <MapPin size={14} />, label: 'Local Rankings', path: '/local-leaderboards' },
          { icon: <Target size={14} />, label: 'Challenges', path: '/challenge' },
        ].map(item => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', 
                textTransform: 'uppercase', color: isActive ? '#FF6A00' : 'rgba(255,255,255,0.5)', 
                textDecoration: 'none', whiteSpace: 'nowrap', transition: 'color 0.2s', paddingBottom: '8px',
                borderBottom: isActive ? '2px solid #FF6A00' : '2px solid transparent'
              }} 
              onMouseOver={e => { if (!isActive) e.target.style.color = '#FFF'; }} 
              onMouseOut={e => { if (!isActive) e.target.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              {item.icon} {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default PageNav;
