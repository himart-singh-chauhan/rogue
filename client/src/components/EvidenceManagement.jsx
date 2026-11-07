import React, { useState, useEffect } from "react";
import {
  Image,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  FileText,
} from "lucide-react";
import { apiCall } from "../utils/api";

const EvidenceManagement = () => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const response = await apiCall("GET", "/api/admin/evidence/photos", null);

      if (response.data) {
        setEvidence(response.data);
        
        // Calculate stats
        const stats = {
          total: response.data.length,
          verified: response.data.filter((e) => e.status === "verified").length,
          pending: response.data.filter((e) => e.status === "pending").length,
          rejected: response.data.filter((e) => e.status === "rejected").length,
        };
        setStats(stats);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching evidence:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (evidenceId) => {
    try {
      setLoading(true);

      await apiCall(
        "PUT",
        `/api/admin/evidence/photos/${evidenceId}/verify`,
        { verificationNotes }
      );

      setShowModal(false);
      setVerificationNotes("");
      setSelectedEvidence(null);
      fetchEvidence();
    } catch (err) {
      setError(err.message);
      console.error("Error verifying evidence:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (evidenceId) => {
    const rejectionReason = window.prompt("Enter rejection reason:");
    if (!rejectionReason) return;

    try {
      setLoading(true);

      await apiCall(
        "PUT",
        `/api/admin/evidence/photos/${evidenceId}/reject`,
        { rejectionReason }
      );

      fetchEvidence();
    } catch (err) {
      setError(err.message);
      console.error("Error rejecting evidence:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (evidenceId) => {
    if (!window.confirm("Are you sure you want to delete this evidence?")) {
      return;
    }

    try {
      setLoading(true);

      await apiCall("DELETE", `/api/admin/evidence/photos/${evidenceId}`, null);

      fetchEvidence();
    } catch (err) {
      setError(err.message);
      console.error("Error deleting evidence:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvidence = evidence.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "verified":
        return "bg-green-500 bg-opacity-20 text-green-400";
      case "rejected":
        return "bg-red-500 bg-opacity-20 text-red-400";
      case "pending":
        return "bg-yellow-500 bg-opacity-20 text-yellow-400";
      default:
        return "bg-gray-500 bg-opacity-20 text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Image className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Evidence Management</h1>
          </div>
          <p className="text-gray-300">Review and manage photo evidence submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Evidence" value={stats.total} icon={Image} />
          <StatCard label="Verified" value={stats.verified} icon={CheckCircle} color="green" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} color="yellow" />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="red" />
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

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Evidence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && !filteredEvidence.length ? (
            <div className="col-span-full p-8 text-center text-gray-400">
              Loading evidence...
            </div>
          ) : filteredEvidence.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-400">
              No evidence found
            </div>
          ) : (
            filteredEvidence.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition"
              >
                {/* Image Preview */}
                {item.file_url && item.mime_type?.startsWith("image") && (
                  <img loading="lazy" decoding="async"
                    src={item.file_url}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white flex-1">
                      {item.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {getStatusIcon(item.status)}
                      {item.status}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-400 mb-3">
                      {item.description.substring(0, 100)}
                      {item.description.length > 100 ? "..." : ""}
                    </p>
                  )}

                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      {item.file_name}
                    </div>
                    <div>
                      Submitted:{" "}
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Verification Notes */}
                  {item.verification_notes && (
                    <div className="mb-4 p-2 bg-slate-700 rounded text-xs text-gray-300">
                      <span className="font-semibold block mb-1">Notes:</span>
                      {item.verification_notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {item.status === "pending" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedEvidence(item);
                            setShowModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Verify
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-2 bg-slate-700 hover:bg-red-600 text-gray-300 hover:text-white text-sm rounded font-medium flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {showModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-md w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">
                Verify Evidence: {selectedEvidence.title}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {selectedEvidence.file_url &&
                selectedEvidence.mime_type?.startsWith("image") && (
                  <img loading="lazy" decoding="async"
                    src={selectedEvidence.file_url}
                    alt={selectedEvidence.title}
                    className="w-full h-48 object-cover rounded"
                  />
                )}

              <textarea
                placeholder="Verification notes (optional)..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 h-24"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setVerificationNotes("");
                    setSelectedEvidence(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerify(selectedEvidence.id)}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading ? "Verifying..." : "Verify"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color = "blue" }) => {
  const colorClass = {
    blue: "text-blue-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
  }[color];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${colorClass}`} />
      </div>
    </div>
  );
};

export default EvidenceManagement;
