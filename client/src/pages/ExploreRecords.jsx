import React, { useState, useEffect } from 'react';
import { Search, Eye, Heart, Zap, Trophy, Play, User, AlertCircle, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiCall, formatProductImage } from '../utils/api';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import { useCategories, namesWithChildren } from '../utils/categoryMeta';

export default function ExploreRecords() {
  const navigate = useNavigate();
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('new');
  const [authMessage, setAuthMessage] = useState('');

  const showAuthMessage = (msg) => {
    setAuthMessage(msg);
    setTimeout(() => setAuthMessage(''), 3000);
  };



  const handleWatchRecord = (e, recordId) => {
    e.stopPropagation();
    navigate(`/record/${recordId}`);
  };

  const handleToggleLike = async (e, recordId) => {
    e.stopPropagation();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        showAuthMessage('Please login to like records!');
        return;
      }
      const res = await apiCall(`/social/${recordId}/like`, 'POST', null, userInfo.token);
      setRecords(records.map(r => r.id === recordId ? { ...r, isLiked: res.isLiked, likes: res.likes } : r));
    } catch (err) {
      if (err.message.includes('Not authorized')) showAuthMessage('Please login to like records!');
    }
  };

  const { tree: categoryTree } = useCategories();
  const categoryChips = [{ name: 'All', isSub: false }];
  categoryTree.forEach((c) => {
    categoryChips.push({ name: c.name, isSub: false });
    (c.children || []).forEach((child) => categoryChips.push({ name: child.name, isSub: true, parent: c.name }));
  });
  // Choosing a parent category also shows its subcategories' records (Talent includes Funny Talent)
  const findNode = (nodes, name) => {
    for (const n of nodes) {
      if (n.name.toLowerCase() === String(name).toLowerCase()) return n;
      const hit = findNode(n.children || [], name);
      if (hit) return hit;
    }
    return null;
  };
  const activeNode = activeCategory !== 'All' ? findNode(categoryTree, activeCategory) : null;
  const activeNames = activeNode ? namesWithChildren(activeNode).map((n) => n.toLowerCase()) : [String(activeCategory).toLowerCase()];
  const hasChildren = !!(activeNode && activeNode.children && activeNode.children.length);
  const parentFilter = hasChildren ? activeNode.name.toLowerCase() : '';
  const tabs = [
    { id: 'new', label: '🆕 New Records' },
    { id: 'featured', label: '⭐ Featured' },
    { id: 'viewed', label: '👁️ Most Viewed' }
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || params.get('search') || '';
    const cat = params.get('category') || 'All';
    setSearchQuery(q);
    setActiveCategory(cat);
    // a parent with subcategories is filtered here in the page (records store one category name)
    fetchRecords(q, parentFilter && parentFilter === cat.toLowerCase() ? 'All' : cat, filterType);
  }, [location.search, filterType, parentFilter]);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    const params = new URLSearchParams(location.search);
    if (cat === 'All') params.delete('category');
    else params.set('category', cat);
    navigate(`/explore?${params.toString()}`);
  };

  const fetchRecords = async (q = '', category = 'All', filter = 'new') => {
    try {
      setLoading(true);
      let endpoint = '/records/explore/all';
      const params = new URLSearchParams();
      if (q) params.append('search', q);
      if (category && category !== 'All') params.append('category', category);
      if (filter) params.append('filter', filter);
      const qs = params.toString();
      if (qs) endpoint += `?${qs}`;

      const data = await apiCall(endpoint, 'GET');
      setRecords(data.records || []);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const applySearch = (value) => {
    const params = new URLSearchParams(location.search);
    const v = String(value || '').trim();
    if (v) params.set('q', v); else { params.delete('q'); params.delete('search'); }
    const qs = params.toString();
    navigate(`/explore${qs ? `?${qs}` : ''}`, { replace: true });
  };
  const handleSearch = (e) => {
    e.preventDefault();
    applySearch(searchQuery);
  };
  // Typing (or deleting) updates the results after a short pause, so an empty box shows every record again
  useEffect(() => {
    const current = new URLSearchParams(location.search).get('q') || new URLSearchParams(location.search).get('search') || '';
    if (searchQuery.trim() === current.trim()) return undefined;
    const t = setTimeout(() => applySearch(searchQuery), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  let filteredRecords = records.filter(r => {
    const matchesSearch = !searchQuery || (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (r.user?.display_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || activeNames.includes((r.category || '').toLowerCase()) || activeNames.includes((r.category_name || '').toLowerCase());

    // Featured status is managed by admin / backend, with local fallback for legacy stats.
    const matchesFeatured = filterType === 'featured' ? (r.is_featured || r.isFeatured) : true;

    return matchesSearch && matchesCategory && matchesFeatured;
  });

  if (filterType === 'viewed') {
    filteredRecords.sort((a, b) => {
      const viewsA = a.views || 0;
      const viewsB = b.views || 0;
      return viewsB - viewsA;
    });

    if (filteredRecords.length > 0) {
      const maxViews = filteredRecords[0].views || 0;
      filteredRecords = filteredRecords.filter(r => (r.views || 0) === maxViews);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: '0' }}>
      <Navbar />

      {/* Custom Auth Toast Message */}
      {authMessage && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#FF5500',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '50px',
          fontWeight: '700',
          fontSize: '14px',
          boxShadow: '0 8px 32px rgba(255,85,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeInUp 0.3s ease forwards'
        }}>
          <AlertCircle size={18} />
          {authMessage}
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 40px 60px' }}>
        <div style={{ marginBottom: '40px', textAlign: 'left' }}>
          <BackButton fallback="/" style={{ marginTop: 44, marginBottom: 20 }} />
          <p style={{ color: '#FF6A00', fontWeight: '700', fontSize: '14px', letterSpacing: '1px', marginBottom: '8px' }}>GLOBAL ARCHIVE</p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: '900', margin: 0, letterSpacing: '-2px' }}>EXPLORE RECORDS</h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: '#1a1a1a', borderRadius: '99px', padding: '8px 16px', border: '1px solid #333' }}>
            <Search size={20} color="#888" />
            <input
              type="text"
              placeholder="Search by athlete, record or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', outline: 'none', marginLeft: '10px', minWidth: 'min(280px, 60vw)' }}
            />
            {searchQuery && (
              <button type="button" aria-label="Clear search" onClick={() => { setSearchQuery(''); applySearch(''); }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#bbb', width: 26, height: 26, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 6 }}>
                <X size={14} />
              </button>
            )}
          </form>

        </div>

        {/* All categories and subcategories (subcategories are marked with ›) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
          {categoryChips.map(chip => {
            const isActive = String(activeCategory).toLowerCase() === chip.name.toLowerCase();
            return (
              <button
                key={`${chip.parent || ''}-${chip.name}`}
                onClick={() => handleCategoryClick(chip.name)}
                title={chip.isSub ? `${chip.parent} › ${chip.name}` : chip.name}
                style={{
                  background: isActive ? '#FF6A00' : '#1a1a1a',
                  color: 'white',
                  border: isActive ? '1px solid #FF6A00' : '1px solid #333',
                  borderRadius: '99px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {chip.name}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '12px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{
                background: filterType === tab.id ? '#FF5500' : 'rgba(255,255,255,0.03)',
                border: filterType === tab.id ? 'none' : '1px solid rgba(255,255,255,0.06)',
                color: filterType === tab.id ? 'white' : '#888',
                padding: '10px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
            <Zap size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>Loading records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#888', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,85,0,0.3)' }}>
            <div style={{
              width: '80px', height: '80px', background: 'rgba(255,85,0,0.1)', borderRadius: '50%',
              display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px auto',
              border: '1px solid rgba(255,85,0,0.2)'
            }}>
              <Trophy size={40} color="#FF5500" style={{ opacity: 0.8 }} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 900, color: 'white', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              No Records Here Yet!
            </h3>
            <p style={{ fontSize: '15px', color: '#aaa', maxWidth: '400px', margin: '0 auto 30px auto', lineHeight: '1.6' }}>
              This category is currently wide open. It looks like nobody has set a verified record here yet. This is your chance to shine and etch your name into the AMPEX history!
            </p>
            <button
              onClick={() => navigate('/verify')}
              style={{
                background: 'linear-gradient(135deg, #FF5500 0%, #ff8800 100%)',
                color: 'white', border: 'none', padding: '14px 32px', borderRadius: '100px',
                fontSize: '14px', fontWeight: '900', letterSpacing: '0.5px', cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(255, 85, 0, 0.35)', transition: 'all 0.2s'
              }}
              className="btn-glow-neon"
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              CLAIM THIS RECORD
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredRecords.map((record) => {
              const displayViews = record.views || 0;
              const displayLikes = record.likes || 0;
              const isLiked = record.isLiked;
              const isFeatured = record.is_featured || record.isFeatured;

              return (
              <div
                key={record.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'relative', width: '100%', paddingBottom: '60%', background: '#111' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF5500 0%, #FFB84D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy size={48} color="white" opacity={0.3} />
                  </div>
                  {record.thumbnail_url && record.thumbnail_url !== "pending_upload" && (
                    <img loading="lazy" decoding="async"
                      src={formatProductImage(record.thumbnail_url)}
                      alt={record.title}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}

                  <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                    {(record.category || record.category_name || 'Category').toString().toUpperCase()}
                  </div>

                  <div style={{ position: 'absolute', top: 12, right: 12, background: '#4ade80', color: 'black', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 900 }}>
                    ✓ Verified
                  </div>
                </div>

                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: 'white', margin: '0 0 8px 0' }}>{record.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <User size={14} color="#FF5500" />
                    <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{record.user?.display_name || 'Unknown'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 11, color: '#666' }}>
                    <span>{record.category_name || record.category || 'Category'}</span>
                    <span>{record.verified_at ? new Date(record.verified_at).toLocaleDateString() : 'Recent'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 12 }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <Eye size={14} color="#FF5500" />
                      <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>{displayViews}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }} onClick={(e) => handleToggleLike(e, record.id)}>
                      <Heart size={14} color="#FF5500" fill={isLiked ? "#FF5500" : "none"} />
                      <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>{displayLikes}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <Trophy size={14} color="#FFD700" />
                      <div style={{ fontSize: 10, color: '#888', marginTop: 6 }}>Rank</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={(e) => handleWatchRecord(e, record.id)} style={{ flex: 1, background: '#FF5500', border: 'none', color: 'white', padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Play size={14} /> Watch
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`\n        .play-overlay:hover { opacity: 1 !important; }\n      `}</style>
      <Footer />
    </div>
  );
}
