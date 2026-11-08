import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, Award, Zap, Heart, Share2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiCall, formatProductImage } from '../utils/api';
import Navbar from '../components/Navbar';
import PageNav from '../components/PageNav';
import Footer from '../components/Footer';

export default function GlobalRankingsPage() {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total_points');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const offset = (page - 1) * limit;
        const params = new URLSearchParams({
          limit,
          offset,
          search,
          sortBy,
          order: 'desc'
        });

        const data = await apiCall(`/rankings/global?${params}`, 'GET');
        setRankings(data.rankings || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error('Error fetching rankings:', error);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [page, search, sortBy]);

  const getTierColor = (badge) => {
    const tierColors = {
      'Grand Champion': '#FFD700',
      'Elite Master': '#C0C0C0',
      'Pro Competitor': '#CD7F32',
      'Challenger': '#888'
    };
    return tierColors[badge] || '#888';
  };

  const getTierIcon = (badge) => {
    if (badge === 'Grand Champion') return '👑';
    if (badge === 'Elite Master') return '⭐';
    if (badge === 'Pro Competitor') return '🏆';
    return '🎯';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c0c0e 0%, #1a1a1f 100%)', paddingBottom: '60px' }}>
      <Navbar />
      <PageNav breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Leaderboards', path: '/leaderboard' }, { label: 'Global Rankings' }]} />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px 0' }}>
        {/* Header */}
        <div style={{ marginBottom: '60px', textAlign: 'center' }}>
          <div style={{ color: '#FF5500', fontSize: '14px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
            🌍 WORLD RANKINGS
          </div>
          <h1 style={{ fontSize: '64px', fontWeight: '950', color: 'white', margin: '0 0 16px 0', letterSpacing: '-2px' }}>
            GLOBAL LEADERBOARD
          </h1>
          <p style={{ fontSize: '18px', color: '#888', margin: 0 }}>
            Top performers competing for glory around the world
          </p>
        </div>

        {/* Filters */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '32px', marginBottom: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Search size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Search Member
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Name or member number..."
              style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Filter size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }}
            >
              <option value="total_points">Total Points</option>
              <option value="world_records_count">World Records</option>
              <option value="verified_records_count">Verified Records</option>
            </select>
          </div>
        </div>

        {/* Rankings */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
            <Zap size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>Loading rankings...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', color: '#888' }}>
            <Award size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No rankings found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
            {rankings.map((ranking, index) => {
              const member = ranking.users;
              const globalRank = ranking.global_rank || index + 1;

              return (
                <div
                  key={ranking.id}
                onClick={() => {
                  if (member.username) navigate(`/profile/${member.username}`);
                }}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                >
                  {/* Rank */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                    <div style={{ fontSize: '32px', fontWeight: '950', color: '#FF5500' }}>#{globalRank}</div>
                    <div style={{ fontSize: '24px', marginTop: '4px' }}>{getTierIcon(ranking.tier_badge)}</div>
                  </div>

                  {/* Profile */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 'min(200px, 100%)' }}>
                    <img loading="lazy" decoding="async"
                      src={member.profile_image ? (member.profile_image.includes('http') ? member.profile_image : formatProductImage(`/uploads/${member.profile_image}`)) : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.display_name)}&background=FF6A00&color=fff`}
                      alt={member.display_name}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>
                        {member.display_name}
                      </div>
                      <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                        {member.country}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', minWidth: 'min(280px, 100%)' }}>
                    <div>
                      <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px', fontWeight: '700' }}>POINTS</div>
                      <div style={{ color: '#FF5500', fontSize: '24px', fontWeight: '950' }}>
                        {ranking.total_points.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px', fontWeight: '700' }}>VERIFIED</div>
                      <div style={{ color: 'white', fontSize: '20px', fontWeight: '900' }}>
                        {ranking.verified_records_count}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px', fontWeight: '700' }}>W.R.</div>
                      <div style={{ color: '#FFD700', fontSize: '20px', fontWeight: '900' }}>
                        {ranking.world_records_count}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        if (member.username) {
                          navigate(`/profile/${member.username}`);
                        }
                        }}
                        style={{ background: '#FF5500', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{ background: page === 1 ? 'rgba(255,255,255,0.05)' : '#FF5500', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: '700' }}
            >
              Previous
            </button>
            <span style={{ color: '#888' }}>
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage(Math.min(Math.ceil(total / limit), page + 1))}
              disabled={page >= Math.ceil(total / limit)}
              style={{ background: page >= Math.ceil(total / limit) ? 'rgba(255,255,255,0.05)' : '#FF5500', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '6px', cursor: page >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer', fontWeight: '700' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
