import React, { useState, useEffect } from "react";
import {
  Film,
  Plus,
  Trash2,
  Edit3,
  Video,
  Youtube,
  Link as LinkIcon,
  Upload,
  Search,
  Filter,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { apiCall, formatProductImage } from "../utils/api";

const VideoManagement = () => {
  const [activeTab, setActiveTab] = useState("record-videos");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [editingVideo, setEditingVideo] = useState(null);
  const [stats, setStats] = useState(null);

  const [formData, setFormData] = useState({
    recordId: "",
    attemptId: "",
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    source: "uploaded",
    youtubeVideoId: "",
    duration: "",
    isPublished: true,
  });

  // Fetch videos by type
  useEffect(() => {
    fetchVideos();
    fetchStats();
  }, [activeTab]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const tabMap = {
        "record-videos": "/record",
        "attempt-videos": "/attempt",
        "featured-videos": "/featured",
        "newest-videos": "/newest",
        "attempt-history": "/attempt-history",
      };

      const response = await apiCall(
        `GET`,
        `/api/admin/videos${tabMap[activeTab]}`,
        null
      );

      if (response.data) {
        setVideos(response.data);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiCall("GET", "/api/admin/videos/stats", null);
      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const tabMap = {
        "record-videos": "/record",
        "attempt-videos": "/attempt",
        "featured-videos": "/featured",
        "newest-videos": "/newest",
        "attempt-history": "/attempt-history",
      };

      const payload = {
        ...formData,
        ...(activeTab.includes("attempt") && { attemptId: formData.attemptId }),
        ...(activeTab.includes("record") && { recordId: formData.recordId }),
      };

      const response = await apiCall(
        modalType === "edit" ? "PUT" : "POST",
        `/api/admin/videos${tabMap[activeTab]}${
          modalType === "edit" ? `/${editingVideo.id}` : ""
        }`,
        payload
      );

      if (response.data) {
        setShowModal(false);
        setFormData({
          recordId: "",
          attemptId: "",
          title: "",
          description: "",
          videoUrl: "",
          thumbnailUrl: "",
          source: "uploaded",
          youtubeVideoId: "",
          duration: "",
          isPublished: true,
        });
        fetchVideos();
      }
    } catch (err) {
      setError(err.message);
      console.error("Error saving video:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video?")) {
      return;
    }

    try {
      setLoading(true);

      const tabMap = {
        "record-videos": "/record",
        "attempt-videos": "/attempt",
        "featured-videos": "/featured",
        "newest-videos": "/newest",
        "attempt-history": "/attempt-history",
      };

      await apiCall(
        "DELETE",
        `/api/admin/videos${tabMap[activeTab]}/${videoId}`,
        null
      );

      fetchVideos();
    } catch (err) {
      setError(err.message);
      console.error("Error deleting video:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportYouTube = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const response = await apiCall(
        "POST",
        "/api/admin/videos/youtube/import",
        {
          youtubeUrl: formData.videoUrl,
          recordId: formData.recordId,
          attemptId: formData.attemptId,
          title: formData.title,
          description: formData.description,
          videoType: activeTab === "featured-videos" ? "featured" : "record",
        }
      );

      if (response.data) {
        setShowModal(false);
        setFormData({
          recordId: "",
          attemptId: "",
          title: "",
          description: "",
          videoUrl: "",
          thumbnailUrl: "",
          source: "uploaded",
          youtubeVideoId: "",
          duration: "",
          isPublished: true,
        });
        fetchVideos();
      }
    } catch (err) {
      setError(err.message);
      console.error("Error importing YouTube video:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(
    (video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Film className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Video Management</h1>
          </div>
          <p className="text-gray-300">
            Manage record videos, attempt videos, featured content, and evidence
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <StatCard label="Total Videos" value={stats.total} icon={Video} />
            <StatCard label="Record Videos" value={stats.byType.record} icon={Film} />
            <StatCard label="Featured Videos" value={stats.byType.featured} icon="⭐" />
            <StatCard label="YouTube Videos" value={stats.bySource.youtube} icon={Youtube} />
            <StatCard label="Published" value={stats.published} icon={Eye} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "record-videos", label: "Record Videos", icon: Film },
            { id: "attempt-videos", label: "Attempt Videos", icon: Video },
            { id: "featured-videos", label: "Featured Videos", icon: "⭐" },
            { id: "newest-videos", label: "Newest Records", icon: "🆕" },
            { id: "attempt-history", label: "Attempt History", icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              {typeof tab.icon === "string" ? tab.icon : <tab.icon className="inline mr-2 w-4 h-4" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        {/* Search and Add Button */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => {
              setModalType("add");
              setShowModal(true);
              setEditingVideo(null);
            }}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Video
          </button>
        </div>

        {/* Videos List */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {loading && !filteredVideos.length ? (
            <div className="p-8 text-center text-gray-400">Loading videos...</div>
          ) : filteredVideos.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No videos found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((video) => (
                    <tr
                      key={video.id}
                      className="border-b border-slate-700 hover:bg-slate-700 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {video.thumbnail_url && video.thumbnail_url !== "pending_upload" && (
                            <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                              <img loading="lazy" decoding="async" 
                                src={formatProductImage(video.thumbnail_url)} 
                                alt={video.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-white font-medium">{video.title}</div>
                            <div className="text-sm text-gray-400">{video.description?.substring(0, 50)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-700 text-gray-300 rounded text-sm">
                          {video.source === "youtube" && <Youtube className="inline w-4 h-4 mr-1" />}
                          {video.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {video.is_published ? (
                            <>
                              <Eye className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 text-sm">Published</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400 text-sm">Hidden</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(video.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          className="p-2 hover:bg-red-500 hover:bg-opacity-20 rounded text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">
                {modalType === "add" ? "Add " : "Edit "} Video
              </h2>
            </div>

            <form onSubmit={handleAddVideo} className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                required
              />

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white h-20"
              />

              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value="uploaded">Upload File</option>
                <option value="youtube">YouTube</option>
                <option value="external_url">External URL</option>
              </select>

              <input
                type="text"
                placeholder={
                  formData.source === "youtube"
                    ? "YouTube URL or Video ID"
                    : "Video URL"
                }
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                required
              />

              <input
                type="text"
                placeholder="Thumbnail URL (optional)"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />

              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4"
                />
                Publish Immediately
              </label>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? "Saving..." : modalType === "add" ? "Add Video" : "Update Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-white text-2xl font-bold mt-1">{value}</p>
      </div>
      {typeof icon === "string" ? (
        <span className="text-3xl">{icon}</span>
      ) : (
        <icon.render className="w-8 h-8 text-blue-400" />
      )}
    </div>
  </div>
);

export default VideoManagement;
