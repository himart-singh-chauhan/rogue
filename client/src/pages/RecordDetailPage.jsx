import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Download, Share2, Heart, Eye, Trophy, User, Calendar, MapPin, Award, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';
import { apiCall, formatProductImage } from '../utils/api';
import Navbar from '../components/Navbar';
import PageNav from '../components/PageNav';

export default function RecordDetailPage() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [socialStats, setSocialStats] = useState({ views: 0, likes: 0, isLiked: false, comments: [] });
  const [commentText, setCommentText] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [localRank, setLocalRank] = useState('N/A');
  const [athleteProfile, setAthleteProfile] = useState(null);

  const showAuthMessage = (msg) => {
    setAuthMessage(msg);
    setTimeout(() => setAuthMessage(''), 3000);
  };

  const recordVideoUrl = record?.evidence_url || record?.video_url || record?.videoUrl || '';

  const viewIncremented = useRef(false);

  useEffect(() => {
    fetchRecord();
  }, [recordId]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      setVideoError(false);
      const data = await apiCall(`/records/${recordId}`, 'GET', null, JSON.parse(localStorage.getItem('userInfo') || 'null')?.token);
      setRecord(data);
      
      // Fetch social stats
      const sessionToken = JSON.parse(localStorage.getItem('userInfo') || 'null')?.token;
      const stats = await apiCall(`/social/${recordId}`, 'GET', null, sessionToken);
      setSocialStats(stats);
      
      // Increment view only once
      if (!viewIncremented.current) {
        viewIncremented.current = true;
        const viewRes = await apiCall(`/social/${recordId}/view`, 'POST');
        setSocialStats(prev => ({ ...prev, views: viewRes.views }));
      }
      
      // Fetch Global Rank for Athlete
      if (data.user_id) {
        try {
          const res = await apiCall(`/rankings/global`, 'GET');
          if (res && res.rankings && res.rankings.length > 0) {
            const athleteRank = res.rankings.findIndex(r => r.user_id === data.user_id) + 1;
            if (athleteRank > 0) setLocalRank(athleteRank);
          }
        } catch (e) {
          console.error("Failed to fetch global rank", e);
        }
      }
      
      // Fetch Athlete Profile stats
      if (data.user?.username) {
        try {
          const profileData = await apiCall(`/auth/profile/${data.user.username}`, 'GET');
          setAthleteProfile(profileData);
        } catch (e) {
          console.error("Failed to fetch athlete profile", e);
        }
      }
      
    } catch (error) {
      console.error('Error fetching record:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleLike = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        showAuthMessage('Please login to like this record.');
        return;
      }
      const res = await apiCall(`/social/${recordId}/like`, 'POST', null, userInfo.token);
      setSocialStats(prev => ({ ...prev, likes: res.likes, isLiked: res.isLiked }));
    } catch (error) {
      if (error.message.includes('Not authorized')) showAuthMessage('Please login to like this record.');
      else showAuthMessage('Failed to like record.');
    }
  };
  
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        showAuthMessage('Please login to comment.');
        return;
      }
      const res = await apiCall(`/social/${recordId}/comment`, 'POST', { text: commentText }, userInfo.token);
      setSocialStats(prev => ({ ...prev, comments: [...prev.comments, res.comment] }));
      setCommentText('');
    } catch (error) {
      if (error.message.includes('Not authorized')) showAuthMessage('Please login to comment.');
      else showAuthMessage('Failed to add comment.');
    }
  };

  const handleDownloadVideo = async () => {
    if (!recordVideoUrl) {
      alert('No video available to download');
      return;
    }
    
    try {
      const response = await fetch(recordVideoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${record.title.replace(/\s+/g, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Could not download video. It might be a YouTube link.');
    }
  };

  const handleShareRecord = async () => {
    const shareUrl = `${window.location.origin}/record/${recordId}`;
    const shareText = `Check out this amazing record: "${record?.title}" - ${record?.value} ${record?.unit}`;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: record?.title,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setShareMessage('✅ Record link copied to clipboard!');
        setTimeout(() => setShareMessage(''), 2000);
      } catch (err) {
        console.error('Copy to clipboard failed:', err);
        alert('Could not copy to clipboard');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c0c0e 0%, #1a1a1f 100%)', paddingTop: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <Play size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>Loading record...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c0c0e 0%, #1a1a1f 100%)', paddingTop: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>Record not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      verified: '#4ade80',
      approved: '#3b82f6',
      pending: '#f59e0b',
      rejected: '#ef4444'
    };
    return colors[status] || '#888';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c0c0e 0%, #1a1a1f 100%)', paddingBottom: '60px' }}>
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

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 20px 0' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
          {/* Main Content */}
          <div>
            {/* Video Player */}
            <div style={{ background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', padding: '20px' }}>
              {(() => {
                const evidenceLinks = [
                  record.evidence_url,
                  record.evidenceUrl,
                  record.video_url,
                  record.videoUrl
                ].filter(Boolean);
                const uniqueLinks = [...new Set(evidenceLinks)].filter(link => link !== "pending_upload");

                // We only want to show videos here, no images
                const videos = uniqueLinks.filter(src => 
                  !src.match(/\.(jpeg|jpg|gif|png|webp|svg|heic|heif)(\?.*)?$/i) && 
                  !src.includes('ui-avatars') && 
                  !src.includes('unsplash')
                );

                if (videos.length === 0) {
                  return (
                    <div style={{ width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF5500 0%, #FFB84D 100%)', color: 'white', flexDirection: 'column' }}>
                      <AlertCircle size={48} style={{ margin: '0 auto 16px' }} />
                      <p>Video not available</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {videos.map((src, idx) => {
                      const isYouTube = src.includes('youtube') || src.includes('youtu.be');
                      if (isYouTube) {
                        const youtubeId = src.includes('youtube.com/watch?v=') ? src.split('v=')[1]?.split('&')[0] : src.split('youtu.be/')[1]?.split('?')[0];
                        return (
                          <div key={`vid-${idx}`} style={{ width: "100%", aspectRatio: "16/9", background: "#111", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0`}
                              title="Video Evidence"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              style={{ border: "none" }}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div key={`vid-${idx}`} style={{ width: "100%", aspectRatio: "16/9", background: "#111", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
                            <video
                              controls
                              preload="metadata"
                              style={{ width: "100%", height: "100%", outline: "none", backgroundColor: "#000", objectFit: "contain" }}
                            >
                              <source src={formatProductImage(src)} type={src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        );
                      }
                    })}
                  </div>
                );
              })()}

              {/* Show the original URLs below the media ONLY if they are external video links */}
              {(() => {
                const links = [
                  record.evidence_url,
                  record.evidenceUrl,
                  record.video_url,
                  record.videoUrl
                ].filter(Boolean).filter(link => link !== "pending_upload");
                
                const uniqueLinks = [...new Set(links)];
                
                // Only show external youtube links, hide internal /uploads/ paths
                const externalLinks = uniqueLinks.filter(src => src.includes('youtube') || src.includes('youtu.be'));
                
                if (externalLinks.length > 0) {
                  return (
                    <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <h4 style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '800' }}>External Video Links</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#ccc', wordBreak: 'break-all' }}>
                        {externalLinks.map((link, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>
                            <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#FF5500', textDecoration: 'none' }}>
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Title and Status */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px', gap: '16px' }}>
                <h1 style={{ fontSize: '42px', fontWeight: '950', color: 'white', margin: 0, lineHeight: '1.2' }}>
                  {record.title}
                </h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleShareRecord}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: '#888',
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                  <CheckCircle size={16} /> Verified
                </div>
                {record.record_type === 'world_record' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 215, 0, 0.1)', color: '#FFD700', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                    <Trophy size={16} /> World Record
                  </div>
                )}
                {record.is_featured && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 85, 0, 0.1)', color: '#FF5500', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                    <Award size={16} /> Featured
                  </div>
                )}
              </div>

              <p style={{ fontSize: '15px', color: '#ccc', lineHeight: '1.6', margin: 0 }}>
                {record.description}
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px', padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Record Score</div>
                <div style={{ fontSize: '28px', fontWeight: '950', color: '#FF5500' }}>{record.total_score || record.value}</div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Category</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>{record.category_name || record.category || record.category_id || 'Unknown Category'}</div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Verified Date</div>
                <div style={{ fontSize: '14px', color: '#ccc' }}>{new Date(record.verified_at || record.updated_at || record.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Views</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFD700' }}>{socialStats.views || 0}</div>
              </div>
            </div>

            {/* Record Details */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white', marginBottom: '16px' }}>Record Details</h3>

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px", marginBottom: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <h3 style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: "900", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>OFFICIAL TRACKING NUMBER</h3>
                <div style={{ fontSize: "24px", fontWeight: "950", color: "#FF6A00", letterSpacing: "2px" }}>
                  {record.tracking_number || `RWR-${record.id?.split('-')[0].toUpperCase()}${record.id?.split('-')[1]?.toUpperCase()}`}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                <div>
                  <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Attempt Date & Time
                  </div>
                  <div style={{ fontSize: '14px', color: '#ccc' }}>
                    {record.attempt_date ? new Date(record.attempt_date).toLocaleString() : 'Not specified'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} /> Location
                  </div>
                  <div style={{ fontSize: '14px', color: '#ccc' }}>
                    {[record.city, record.state, record.country].filter(Boolean).join(', ') || 'Not specified'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Witnesses</div>
                  <div style={{ fontSize: '14px', color: '#ccc' }}>
                    {record.witnesses_count || 0} witnesses
                  </div>
                </div>

                <div>
                  <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Verification ID</div>
                  <div style={{ fontSize: '16px', color: 'white', fontFamily: 'monospace', letterSpacing: '1px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                    {record.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white', marginBottom: '16px' }}>Comments ({socialStats.comments.length})</h3>
              
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input 
                  type="text" 
                  placeholder="Add a public comment..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }}
                />
                <button type="submit" style={{ background: '#FF5500', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' }}>
                  Post
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                {socialStats.comments.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '14px' }}>No comments yet. Be the first to comment!</p>
                ) : (
                  socialStats.comments.map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                         {c.userAvatar ? <img loading="lazy" decoding="async" src={c.userAvatar} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <User size={20} color="#fff" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '700', color: 'white', fontSize: '14px' }}>{c.userName || 'User'}</span>
                          <span style={{ fontSize: '10px', color: '#666' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ color: '#ccc', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Athlete Card */}
            <div style={{ background: 'rgba(255,85,0,0.1)', border: '1px solid rgba(255,85,0,0.2)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#FF5500', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Athlete Profile
              </h3>

              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#FF5500', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: '900', overflow: 'hidden' }}>
                  {record.user?.profile_image ? (
                    <img loading="lazy" decoding="async" src={formatProductImage(record.user.profile_image)} alt="Athlete" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    record.user?.display_name?.charAt(0) || record.user?.name?.charAt(0) || 'A'
                  )}
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '900', color: 'white', margin: '0 0 4px 0' }}>
                  {record.user?.display_name || record.user?.name || 'Unknown Athlete'}
                </h4>
                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                  Member #{athleteProfile?.profile?.member_number || record.user?.member_number || 'N/A'}
                </p>
              </div>

              <button
                onClick={() => {
                  if (record.user?.username) navigate(`/profile/${record.user.username}`);
                }}
                style={{
                  width: '100%',
                  background: '#FF5500',
                  border: 'none',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  marginBottom: '12px'
                }}
              >
                View Profile
              </button>

              <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#888' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Total Submitted:</span>
                  <span style={{ color: '#FF5500', fontWeight: '700' }}>{athleteProfile?.records?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Approved Records:</span>
                  <span style={{ color: '#4ade80', fontWeight: '700' }}>{athleteProfile?.ranking?.verified_records_count || record.user?.verified_records_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'white', marginBottom: '16px', textTransform: 'uppercase' }}>
                Record Stats
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <Eye size={18} color="#FF5500" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#888', fontWeight: '700' }}>VIEWS</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: 'white' }}>{socialStats.views || 0}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer' }} onClick={handleToggleLike}>
                  <Heart size={18} color="#FF5500" fill={socialStats.isLiked ? "#FF5500" : "none"} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#888', fontWeight: '700' }}>LIKES</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: 'white' }}>{socialStats.likes || 0}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <Trophy size={18} color="#FFD700" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#888', fontWeight: '700' }}>GLOBAL RANK</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#FFD700' }}>#{localRank}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleDownloadVideo}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,85,0,0.3)',
                  color: '#FF5500',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,85,0,0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <Download size={16} /> Download Video
              </button>
              <button
                onClick={handleShareRecord}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#888',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#FFF'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#888'; }}
              >
                <Share2 size={16} /> Share Record
              </button>
              {shareMessage && (
                <div style={{ textAlign: 'center', color: '#4ade80', fontSize: '12px', fontWeight: '600' }}>
                  {shareMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
