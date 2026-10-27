import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  History,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { apiFetch, asArray, getLeaveStatus, isFinished, isRejected, API } from "../api";
import {
  SectionTitle,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
  Modal,
} from "../components/UIComponents";

export function LeaveHistory({ user, onApplyLeave }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const studentId = user?.id || user?.student_id;

  const loadLeaves = useCallback(async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      setError("");
      const result = await apiFetch(`/student/${studentId}/leaves`);
      setLeaves(asArray(result));
    } catch (err) {
      setError(err.message || "Failed to retrieve leave history.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const handleCancelLeave = async (leaveId) => {
    try {
      await apiFetch(`/student/${studentId}/leave/${leaveId}`, {
        method: "DELETE",
      });
      setCancellingId(null);
      await loadLeaves();
    } catch (err) {
      alert(err.message || "Unable to cancel leave request.");
    }
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const matchSearch =
        leave.reason.toLowerCase().includes(search.toLowerCase()) ||
        leave.leave_type.toLowerCase().includes(search.toLowerCase()) ||
        leave.from_date.includes(search) ||
        leave.to_date.includes(search);

      const status = getLeaveStatus(leave).toLowerCase();
      let matchStatus = true;
      if (statusFilter === "pending") {
        matchStatus = !isFinished(leave);
      } else if (statusFilter === "approved") {
        matchStatus = status.includes("approved");
      } else if (statusFilter === "rejected") {
        matchStatus = status.includes("rejected");
      }

      const matchType =
        typeFilter === "all" ||
        leave.leave_type.toLowerCase() === typeFilter.toLowerCase();

      return matchSearch && matchStatus && matchType;
    });
  }, [leaves, search, statusFilter, typeFilter]);

  return (
    <div className="leave-history-page">
      <div className="page-header-flex">
        <div>
          <h1 className="page-main-title">Leave Request History &amp; Tracking</h1>
          <p className="page-main-subtitle">
            Inspect real-time faculty approval status across Advisor, HOD, and Vice Principal
          </p>
        </div>
        <div className="page-header-actions">
          <button className="primary-button" onClick={onApplyLeave}>
            + Apply New Leave
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-box filters-bar-card">
        <div className="filters-row">
          <div className="search-pill-input flex-1">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by reason, leave type, or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-pill-select">
            <Filter size={15} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Approval States</option>
              <option value="pending">In Progress / Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-pill-select">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="On-Duty (OD)">On-Duty (OD)</option>
              <option value="Personal Leave">Personal Leave</option>
              <option value="Academic Conference">Academic Conference</option>
            </select>
          </div>

          <button
            className="icon-refresh-btn"
            onClick={loadLeaves}
            title="Refresh records"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <EmptyState
          title="Unable to Retrieve Leaves"
          text={error}
          action={
            <button className="primary-button" onClick={loadLeaves}>
              Retry Connection
            </button>
          }
        />
      ) : !filteredLeaves.length ? (
        <EmptyState
          title="No Leave Records Found"
          text={
            search || statusFilter !== "all" || typeFilter !== "all"
              ? "No leave requests matched your selected search filters."
              : "You have not submitted any leave applications yet."
          }
          icon={FileText}
          action={
            <button className="primary-button" onClick={onApplyLeave}>
              Submit First Application
            </button>
          }
        />
      ) : (
        <div className="leave-cards-stack">
          {filteredLeaves.map((leave) => {
            const status = getLeaveStatus(leave);
            const isExpanded = expandedId === leave.id;
            const canCancel = leave.advisor_status === "Pending";

            return (
              <div key={leave.id} className="leave-record-card">
                <div className="leave-record-main">
                  <div className="leave-record-summary">
                    <div className="leave-type-badge-row">
                      <span className="leave-type-chip primary">
                        {leave.leave_type}
                      </span>
                      <StatusBadge status={status} />
                      <span className="leave-dates-tag">
                        <Calendar size={14} /> {leave.from_date} to {leave.to_date}
                      </span>
                    </div>

                    <h4 className="leave-record-reason">"{leave.reason}"</h4>

                    {/* Step Approval Progress Bar */}
                    <div className="stepper-horizontal">
                      <div className="stepper-step completed">
                        <div className="step-circle">
                          <CheckCircle2 size={14} />
                        </div>
                        <div className="step-meta">
                          <span className="step-title">1. Submitted</span>
                          <span className="step-sub">By Student</span>
                        </div>
                      </div>

                      <div
                        className={`stepper-connector ${
                          leave.advisor_status === "Approved" ? "active" : ""
                        }`}
                      />

                      <div
                        className={`stepper-step ${
                          leave.advisor_status === "Approved"
                            ? "completed"
                            : leave.advisor_status === "Rejected"
                            ? "rejected"
                            : "current"
                        }`}
                      >
                        <div className="step-circle">
                          {leave.advisor_status === "Approved" ? (
                            <CheckCircle2 size={14} />
                          ) : leave.advisor_status === "Rejected" ? (
                            <XCircle size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                        </div>
                        <div className="step-meta">
                          <span className="step-title">2. Class Advisor</span>
                          <span className="step-sub">
                            {leave.advisor_status === "Approved"
                              ? "Endorsed"
                              : leave.advisor_status === "Rejected"
                              ? "Declined"
                              : "Reviewing"}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`stepper-connector ${
                          leave.hod_status === "Approved" ? "active" : ""
                        }`}
                      />

                      <div
                        className={`stepper-step ${
                          leave.hod_status === "Approved"
                            ? "completed"
                            : leave.hod_status === "Rejected"
                            ? "rejected"
                            : leave.advisor_status === "Approved"
                            ? "current"
                            : "pending"
                        }`}
                      >
                        <div className="step-circle">
                          {leave.hod_status === "Approved" ? (
                            <CheckCircle2 size={14} />
                          ) : leave.hod_status === "Rejected" ? (
                            <XCircle size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                        </div>
                        <div className="step-meta">
                          <span className="step-title">3. HOD</span>
                          <span className="step-sub">
                            {leave.hod_status === "Approved"
                              ? "Recommended"
                              : leave.hod_status === "Rejected"
                              ? "Declined"
                              : leave.advisor_status === "Approved"
                              ? "Awaiting"
                              : "Queued"}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`stepper-connector ${
                          leave.vp_status === "Approved" ? "active" : ""
                        }`}
                      />

                      <div
                        className={`stepper-step ${
                          leave.vp_status === "Approved"
                            ? "completed"
                            : leave.vp_status === "Rejected"
                            ? "rejected"
                            : leave.hod_status === "Approved"
                            ? "current"
                            : "pending"
                        }`}
                      >
                        <div className="step-circle">
                          {leave.vp_status === "Approved" ? (
                            <CheckCircle2 size={14} />
                          ) : leave.vp_status === "Rejected" ? (
                            <XCircle size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                        </div>
                        <div className="step-meta">
                          <span className="step-title">4. Vice Principal</span>
                          <span className="step-sub">
                            {leave.vp_status === "Approved"
                              ? "Final Approval"
                              : leave.vp_status === "Rejected"
                              ? "Declined"
                              : leave.hod_status === "Approved"
                              ? "Awaiting Sign-off"
                              : "Queued"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="leave-card-actions">
                    <button
                      className="details-toggle-btn"
                      onClick={() => setExpandedId(isExpanded ? null : leave.id)}
                    >
                      <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {canCancel && (
                      <button
                        className="danger-outline-btn"
                        onClick={() => setCancellingId(leave.id)}
                        title="Cancel this pending application"
                      >
                        <Trash2 size={15} /> Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="leave-expanded-drawer">
                    <div className="drawer-grid">
                      <div>
                        <span className="drawer-label">Request Identifier:</span>
                        <strong>LMS-LEAVE-#{leave.id}</strong>
                      </div>
                      <div>
                        <span className="drawer-label">Current Stage:</span>
                        <strong>{status}</strong>
                      </div>
                      <div>
                        <span className="drawer-label">Proof Document:</span>
                        {leave.proof_file ? (
                          <a
                            href={`${API}/leave/${leave.id}/proof`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="proof-link"
                          >
                            <ExternalLink size={14} /> View Attached Proof
                          </a>
                        ) : (
                          <span className="text-muted">No document attached</span>
                        )}
                      </div>
                      <div>
                        <span className="drawer-label">AI OCR Verification:</span>
                        <span className="ocr-status-chip">
                          {leave.proof_status || "Pending Verification"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancellingId}
        onClose={() => setCancellingId(null)}
        title="Cancel Leave Request"
        footer={
          <>
            <button className="secondary-button" onClick={() => setCancellingId(null)}>
              Keep Application
            </button>
            <button
              className="danger-button"
              onClick={() => handleCancelLeave(cancellingId)}
            >
              Confirm Cancellation
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to withdraw and cancel leave request <strong>#{cancellingId}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
