import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Share2, MessageSquare, MapPin, Award, Medal, Shield, Activity, TrendingUp, HelpCircle, FileText, CheckCircle2, Search, X, UserX, AlertTriangle, Home, Trophy, Globe } from 'lucide-react';
import { apiCall, formatProductImage } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { downloadAwardPdf } from '../utils/awardPdf';
import MessageComposer from '../components/MessageComposer';
import Navbar from '../components/Navbar';
import PageNav from '../components/PageNav';

export default function MemberProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [records, setRecords] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState('');
  const [awards, setAwards] = useState([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const { user } = useAuth();

  // Achievement awards given by AMPEX (Admin → Achievement Awards)
  useEffect(() => {
    if (!profile?.id) return undefined;
    let alive = true;
    apiCall(`/awards/user/${profile.id}`, 'GET').then((list) => { if (alive) setAwards(Array.isArray(list) ? list : []); }).catch(() => {});
    return () => { alive = false; };
  }, [profile?.id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Failed to copy URL");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username || username === 'undefined') {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        const data = await apiCall(`/auth/profile/${username}`, 'GET', null, user?.token);

        if (data && data.profile) {
          const userObj = data.profile;
          setProfile({
            ...userObj,
            display_name: userObj.name || username,
            profile_picture: userObj.profile_image ? formatProductImage(userObj.profile_image) : ('https://ui-avatars.com/api/?name=' + encodeURIComponent(userObj.name || username) + '&background=FF6A00&color=fff'),
          });

          if (data.ranking) {
            setRanking({
              global_rank: data.ranking.global_rank || '-',
              total_points: data.ranking.total_points || 0,
              verified_records_count: data.ranking.verified_records_count || 0,
              world_records_count: data.ranking.world_records_count || 0,
              tier_badge: data.ranking.tier_badge || 'Challenger',
              first_place_categories: data.ranking.first_place_categories || 0,
              top_10_placements: data.ranking.top_10_placements || 0,
              medals_earned: data.ranking.medals_earned || 0,
              certificates_earned: data.ranking.certificates_earned || 0,
              vip: data.ranking.vip || null,
              rewards: data.ranking.rewards || null
            });
          }

          if (data.records) {
             setRecords(data.records);
          }
        } else {
          setProfile(null);
        }

        setPointsHistory([]);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchProfile();
  }, [username, user?.token]);

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        <Navbar />
        <PageNav breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Explore Records', path: '/explore-records' }, { label: 'Loading Profile...' }]} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#FF6A00', letterSpacing: '2px' }}>LOADING PROFILE...</div>
        </div>
      </div>
    );
  }

  if (!profile || !username || username === 'undefined') {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
        <Navbar />
        <PageNav breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Explore Records', path: '/explore-records' }, { label: 'Profile Not Found' }]} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '24px', textAlign: 'center', padding: '20px' }}>
          <AlertTriangle size={64} color="#EF4444" />
          <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Profile Not Found</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '400px' }}>
            We couldn't find a profile for this user. The account might have been deleted, or the link may be broken.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', margin: '16px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'rgba(255,106,0,0.1)', border: '1px solid #FF6A00', color: '#FF6A00', padding: '12px 24px', borderRadius: '8px', fontWeight: '800', textTransform: 'uppercase', cursor: 'pointer' }}>
              Back to Previous Page
            </button>
            <Link to="/explore-records" style={{ background: '#FF6A00', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '800', textTransform: 'uppercase' }}>
              Back to Explore Records
            </Link>
            <Link to="/leaderboard" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '800', textTransform: 'uppercase' }}>
              Back to Leaderboards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getTierBadge = (badge) => {
    const badges = {
      'Grand Champion': { emoji: '👑', color: '#FFD700' },
      'Elite Master': { emoji: '⭐', color: '#C0C0C0' },
      'Pro Competitor': { emoji: '🏆', color: '#CD7F32' },
      'Challenger': { emoji: '🎯', color: '#888' }
    };
    return badges[badge] || badges['Challenger'];
  };

  const tierBadge = getTierBadge(ranking?.tier_badge);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c0c0e 0%, #1a1a1f 100%)', paddingBottom: '60px' }}>
      <Navbar />
      <PageNav breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Explore Records', path: '/explore-records' }, { label: profile.display_name || profile.name || username }]} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 0' }}>

        {/* Header */}
        <div style={{ background: 'rgba(255,85,0,0.1)', border: '1px solid rgba(255,85,0,0.2)', borderRadius: '20px', padding: '40px', marginBottom: '40px', display: 'grid', gridTemplateColumns: '150px 1fr', gap: '32px', alignItems: 'start' }}>
          <div>
            <img loading="lazy" decoding="async"
              src={profile.profile_picture}
              alt={profile.display_name}
              style={{ width: '150px', height: '150px', borderRadius: '12px', objectFit: 'cover', border: '3px solid #FF5500' }}
            />
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '32px' }}>
              {tierBadge.emoji}
            </div>
          </div>

          <div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#FF5500', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {ranking?.tier_badge}
                {ranking?.vip?.status && (
                  <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#111', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', letterSpacing: '0.5px' }}>
                    {ranking.vip.status === 'legend' ? 'VIP Legend' : ranking.vip.status === 'elite' ? 'VIP Elite' : 'VIP'}
                  </span>
                )}
                {ranking?.rewards?.isAmbassador && (
                  <span style={{ background: 'linear-gradient(135deg, #FF6A00, #ff9a3c)', color: 'white', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', letterSpacing: '0.5px' }}>🎖️ AMPEX Ambassador</span>
                )}
                {ranking?.vip?.verified && (
                  <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)', padding: '2px 10px', borderRadius: '100px', fontSize: '11px' }}>✓ Verified</span>
                )}
              </div>
              <h1 style={{ fontSize: '48px', fontWeight: '950', color: 'white', margin: '0 0 8px 0', letterSpacing: '-1px' }}>
                {profile.display_name}
              </h1>
              <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
                @{profile.username} • Member #{profile.member_number}
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginTop: '24px' }}>
              <div>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>RANK</div>
                <div style={{ color: '#FF5500', fontSize: '28px', fontWeight: '950' }}>
                  #{ranking?.global_rank}
                </div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>POINTS</div>
                <div style={{ color: 'white', fontSize: '28px', fontWeight: '950' }}>
                  {(ranking?.total_points || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>VERIFIED</div>
                <div style={{ color: '#FFD700', fontSize: '28px', fontWeight: '950' }}>
                  {ranking?.verified_records_count}
                </div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>W.R.</div>
                <div style={{ color: '#4ade80', fontSize: '28px', fontWeight: '950' }}>
                  {ranking?.world_records_count}
                </div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>MEDALS</div>
                <div style={{ color: '#FF5500', fontSize: '28px', fontWeight: '950' }}>
                  {ranking?.medals_earned}
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              {profile.country && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
                  <MapPin size={14} /> {profile.country}
                </div>
              )}
              {(!user || String(user._id || user.id) !== String(profile.id)) && (
                <button
                  type="button"
                  onClick={() => (user ? setComposeOpen(true) : navigate('/login', { state: { message: 'Log in to message other members.' } }))}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}
                >
                  <MessageSquare size={14} /> Message
                </button>
              )}
              <button
                onClick={handleShare}
                style={{ background: copied ? '#4ade80' : '#FF5500', border: 'none', color: copied ? 'black' : 'white', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', transition: 'all 0.3s' }}
              >
                <Share2 size={14} /> {copied ? 'Copied URL!' : 'Share'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', overflowX: 'auto' }}>
          {['overview', 'demographics', 'achievements', 'records', 'videos'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#FF5500' : 'transparent',
                border: 'none',
                color: activeTab === tab ? 'white' : '#888',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '700',
                textTransform: 'uppercase',
                fontSize: '12px',
                whiteSpace: 'nowrap'
              }}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'demographics' && '👤 Demographics'}
              {tab === 'achievements' && '⭐ Achievements'}
              {tab === 'records' && '📋 Submitted Records'}
              {tab === 'videos' && '🎥 Videos'}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Trophy size={24} color="#FF5500" />
                <h3 style={{ color: 'white', fontWeight: '900', margin: 0 }}>First Place</h3>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '950', color: '#FF5500' }}>
                {ranking?.first_place_categories}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <TrendingUp size={24} color="#FFD700" />
                <h3 style={{ color: 'white', fontWeight: '900', margin: 0 }}>Top 10</h3>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '950', color: '#FFD700' }}>
                {ranking?.top_10_placements}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Award size={24} color="#4ade80" />
                <h3 style={{ color: 'white', fontWeight: '900', margin: 0 }}>Certificates</h3>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '950', color: '#4ade80' }}>
                {ranking?.certificates_earned}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'demographics' && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>FULL NAME</div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>{profile.name || profile.display_name}</div>
              </div>
              <div>
                <div style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>EMAIL ADDRESS</div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>{profile.private_visible ? (profile.email || 'Not Specified') : 'Private'}</div>
              </div>
              <div>
                <div style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>PHONE NUMBER</div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>{profile.private_visible ? (profile.phone || 'Not Specified') : 'Private'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
              <div>
                <div style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>ADDRESS</div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>
                  {profile.street_address || profile.city || profile.state || profile.zip_code ?
                    [profile.street_address, profile.city, profile.state, profile.zip_code].filter(Boolean).join(", ")
                    : (profile.country || "Not Specified")}
                </div>
              </div>
              <div>
                <div style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>BIRTH DATE</div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>
                  {profile.dob ? new Date(profile.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "Not Set"}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
              <div>
                <div style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>GENDER</div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '700', textTransform: 'capitalize' }}>{profile.gender || 'Not Set'}</div>
              </div>
              <div>
                <div style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>RACE / ETHNICITY</div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '700', textTransform: 'capitalize' }}>{profile.ethnicity || 'Not Set'}</div>
              </div>
              <div>
                <div style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>WEIGHT</div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>{profile.weight ? `${profile.weight} ${profile.weight_unit || 'kg'}` : 'Not Set'}</div>
              </div>
              <div>
                <div style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>HEIGHT</div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>{profile.height ? `${profile.height} ${profile.height_unit || 'cm'}` : 'Not Set'}</div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'achievements' && (() => {
          const achievementsList = [
            { id: 'grand_champion', icon: '👑', label: 'Grand Champion', earned: ranking?.tier_badge === 'Grand Champion', desc: 'The highest echelon of athletic excellence in the AMPEX Network. Awarded only to elite athletes exceeding 5000 verified power points. True legends of the sport.', color: '#FF5500' },
            { id: 'elite_master', icon: '⭐', label: 'Elite Master', earned: ['Grand Champion', 'Elite Master'].includes(ranking?.tier_badge), desc: 'A seasoned world record holder with exceptional athletic performance and over 2,000 power points. Highly respected in the community.', color: '#a200ff' },
            { id: 'pro_competitor', icon: '🏆', label: 'Pro Competitor', earned: true, desc: 'An official AMPEX Network competitor who has successfully registered their athletic profile and is actively competing on the global stage.', color: '#3b82f6' },
            { id: 'first_place', icon: '🥇', label: 'First Place', earned: (ranking?.first_place_categories || 0) > 0, desc: `Currently holding First Place globally in ${ranking?.first_place_categories || 0} category(s). This athlete is an absolute pioneer pushing human limits!`, color: '#FFD700' },
            { id: 'top_10', icon: '🥈', label: 'Top 10 Rank', earned: (ranking?.top_10_placements || 0) > 0, desc: `Ranked in the Global Top 10 for ${ranking?.top_10_placements || 0} category(s). A testament to elite competitive capability.`, color: '#cbd5e1' },
            { id: 'certified', icon: '📜', label: 'AMPEX Certified', earned: (ranking?.certificates_earned || 0) > 0, desc: `Successfully earned ${ranking?.certificates_earned || 0} Official AMPEX Certificates for verified, record-breaking performances.`, color: '#4ade80' },
            { id: 'ambassador', icon: '🎖️', label: 'AMPEX Ambassador', earned: !!ranking?.rewards?.isAmbassador, desc: 'Reached the top level of the AMPEX Rewards program by inviting members and supporting AMPEX World Records.', color: '#FF6A00' }
          ];
          // Awards given by AMPEX come first; each one prints as its own design
          awards.forEach((a) => achievementsList.unshift({ id: a.id, icon: a.icon || '🏆', image: a.imageUrl, label: a.title, earned: true, desc: a.description, color: a.color || '#FF6A00', award: a }));

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {achievementsList.map((achievement, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (achievement.earned) {
                      setSelectedAchievement(achievement);
                    }
                  }}
                  style={{
                    background: achievement.earned ? 'rgba(255,85,0,0.15)' : 'rgba(255,255,255,0.02)',
                    border: achievement.earned ? '1px solid rgba(255,85,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    opacity: achievement.earned ? 1 : 0.5,
                    cursor: achievement.earned ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    boxShadow: achievement.earned ? '0 4px 15px rgba(255,85,0,0.1)' : 'none'
                  }}
                  onMouseEnter={e => {
                    if (achievement.earned) {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 8px 25px ${achievement.color}40`;
                      e.currentTarget.style.borderColor = achievement.color;
                    }
                  }}
                  onMouseLeave={e => {
                    if (achievement.earned) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,85,0,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255,85,0,0.3)';
                    }
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '12px', filter: achievement.earned ? `drop-shadow(0 0 10px ${achievement.color}80)` : 'none' }}>{achievement.image ? <img src={achievement.image} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} /> : achievement.icon}</div>
                  <div style={{ color: achievement.earned ? 'white' : '#888', fontWeight: '800', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {achievement.label}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {activeTab === 'records' && (
          <div>
            {records.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {records.map(record => (
                  <div
                    key={record.id}
                    onClick={() => navigate(`/record/${record.id}`)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '24px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,106,0,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,106,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'white' }}>{record.title || record.category}</h3>
                        {record.status === 'verified' && (
                          <span style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            <CheckCircle2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            Verified
                          </span>
                        )}
                        {record.status === 'rejected' && (
                          <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            <X size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            Rejected
                          </span>
                        )}
                        {record.status === 'pending' && (
                          <span style={{ background: 'rgba(255, 106, 0, 0.1)', color: '#FF6A00', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            <Activity size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            Under Review
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                        {record.category} | {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: '950', color: 'white' }}>
                        {record.value} <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{record.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <FileText size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>No records submitted yet</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>This athlete hasn't submitted any records.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {records.filter(r => r.evidence_url || r.video_url || r.videoUrl).length > 0 ? (
              records
                .filter(r => r.evidence_url || r.video_url || r.videoUrl)
                .map(record => {
                  const videoUrl = record.evidence_url || record.video_url || record.videoUrl;
                  const isYouTube = videoUrl.includes('youtube') || videoUrl.includes('youtu.be');
                  let embedUrl = videoUrl;

                  if (isYouTube) {
                    const youtubeId = videoUrl.includes('youtube.com/watch?v=')
                      ? videoUrl.split('v=')[1]?.split('&')[0]
                      : videoUrl.split('youtu.be/')[1]?.split('?')[0];
                    embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=0`;
                  }

                  return (
                    <div key={record.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ width: '100%', position: 'relative', paddingTop: '56.25%', background: '#000', cursor: 'pointer' }} onClick={() => navigate(`/record/${record.id}`)}>
                        {isYouTube ? (
                          <iframe
                            src={embedUrl}
                            title={record.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <video preload="metadata"
                            src={formatProductImage(videoUrl)}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                      <div style={{ padding: '16px', cursor: 'pointer' }} onClick={() => navigate(`/record/${record.id}`)}>
                        <div style={{ background: record.record_type === 'world_record' ? '#FFD700' : '#FF5500', color: record.record_type === 'world_record' ? '#000' : 'white', display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', marginBottom: '8px' }}>
                          {record.record_type === 'world_record' ? 'WORLD RECORD' : record.category.toUpperCase()}
                        </div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: 'white' }}>{record.title}</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#888', lineHeight: '1.5' }}>
                          Value: {record.value} {record.unit} • {new Date(record.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>No videos found</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>This athlete hasn't uploaded any video evidence yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Achievement Popup Modal */}
      {selectedAchievement && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setSelectedAchievement(null)}>
          <div style={{
            background: '#111',
            borderRadius: '24px',
            border: `1px solid ${selectedAchievement.color}50`,
            padding: '40px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: `0 20px 50px -10px ${selectedAchievement.color}40`,
            position: 'relative',
            animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedAchievement(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <X size={16} />
            </button>

            <div style={{
              fontSize: '80px',
              marginBottom: '20px',
              filter: `drop-shadow(0 0 30px ${selectedAchievement.color})`,
              animation: 'pulse 2s infinite ease-in-out'
            }}>
              {selectedAchievement.image ? <img src={selectedAchievement.image} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }} /> : selectedAchievement.icon}
            </div>

            <div style={{ color: selectedAchievement.color, fontSize: '12px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
              {selectedAchievement.award ? 'ACHIEVEMENT AWARD' : 'ACHIEVEMENT UNLOCKED'}
            </div>

            <h2 style={{ color: 'white', fontSize: '32px', fontWeight: '950', margin: '0 0 16px 0', letterSpacing: '-1px' }}>
              {selectedAchievement.label}
            </h2>

            <div style={{ height: '2px', width: '40px', background: selectedAchievement.color, margin: '0 auto 20px auto', borderRadius: '2px' }} />

            <p style={{ color: '#aaa', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
              {selectedAchievement.desc}
            </p>

            <div style={{ marginTop: '30px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', fontSize: '12px', color: '#666', border: '1px solid rgba(255,255,255,0.05)' }}>
              Acquired by <span style={{ color: '#fff', fontWeight: 'bold' }}>{profile.display_name}</span> • AMPEX Network
            </div>
            {user && (String(user._id || user.id) === String(profile.id) || user.isAdmin || user.is_admin) && (
              <>
                <button
                  type="button"
                  disabled={printing}
                  onClick={async () => {
                    setPrinting(true); setPrintError('');
                    try {
                      // Prints the achievement shown here (its own award design), not the World Record certificate
                      const a = selectedAchievement;
                      const member = String(profile.member_number || 'AMPEX').replace(/[^A-Z0-9-]/gi, '').toUpperCase();
                      await downloadAwardPdf(a.award
                        ? { ...a.award, recipientName: a.award.recipientName || profile.display_name }
                        : {
                          title: a.label, description: a.desc, icon: a.icon, color: a.color,
                          recipientName: profile.display_name, date: new Date().toISOString().slice(0, 10),
                          awardNumber: `${member}-${String(a.id).toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
                        });
                    } catch (err) { setPrintError(err.message || 'Could not create the certificate.'); }
                    finally { setPrinting(false); }
                  }}
                  style={{ marginTop: '16px', width: '100%', background: '#FF6A00', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 900, fontSize: '13px', letterSpacing: '0.5px', cursor: printing ? 'wait' : 'pointer' }}
                >
                  {printing ? 'Preparing…' : '🖨️ Print / download this award (PDF)'}
                </button>
                {printError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>{printError}</div>}
              </>
            )}
          </div>
        </div>
      )}
      {composeOpen && profile && (
        <MessageComposer to={{ id: profile.id, name: profile.display_name }} onClose={() => setComposeOpen(false)} />
      )}
    </div>
  );
}
