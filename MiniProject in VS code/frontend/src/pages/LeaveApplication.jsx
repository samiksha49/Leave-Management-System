import React, { useState, useMemo } from "react";
import {
  Send,
  Calendar,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  X,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { apiFetch, asArray } from "../api";
import { SectionTitle, Modal } from "../components/UIComponents";

export function LeaveApplication({ user, onSubmitted }) {
  const [leaveType, setLeaveType] = useState("Medical Leave");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const studentId = user?.id || user?.student_id;

  // Calculate day count
  const dayCount = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [fromDate, toDate]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError("Document size exceeds maximum allowable limit of 5MB.");
        return;
      }
      setFile(selected);
      setError("");
    }
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!studentId) {
      setError("Student identifier missing. Please re-login.");
      return;
    }

    if (!fromDate || !toDate) {
      setError("Please specify both From Date and To Date.");
      return;
    }

    if (toDate < fromDate) {
      setError("To Date cannot be earlier than From Date.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a concise academic justification/reason for your absence.");
      return;
    }

    setShowConfirmModal(true);
  };

  const executeSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // 1. Submit leave request
      const payload = {
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        reason: reason.trim(),
      };

      const response = await apiFetch(`/student/${studentId}/leave`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const leaveId = response?.leave?.id || response?.id;

      // 2. Upload supporting proof if attached
      if (leaveId && file) {
        const formData = new FormData();
        formData.append("file", file);
        try {
          await apiFetch(`/leave/${leaveId}/proof`, {
            method: "POST",
            body: formData,
          });
        } catch (proofErr) {
          console.warn("Proof upload error:", proofErr);
        }
      }

      setSuccess(true);
      setReason("");
      setFile(null);
      setFromDate("");
      setToDate("");
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      setError(err.message || "Failed to submit leave request.");
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="leave-application-page">
      <SectionTitle
        title="Leave Request Portal"
        text="Submit medical, personal, or on-duty academic leave for sequential faculty review"
      />

      {success && (
        <div className="success-banner" role="alert">
          <CheckCircle2 size={20} className="text-emerald-500" />
          <div className="success-banner-content">
            <strong>Leave Request Successfully Submitted!</strong>
            <p>
              Your request has been registered and routed to your Class Advisor{" "}
              (<strong>{user?.advisor_name || "Assigned Faculty"}</strong>) for initial verification.
            </p>
          </div>
          <button className="banner-dismiss" onClick={() => setSuccess(false)}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          <AlertCircle size={20} className="text-red-500" />
          <div className="error-banner-content">
            <strong>Application Notice</strong>
            <p>{error}</p>
          </div>
          <button className="banner-dismiss" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="leave-form-layout">
        {/* Left: Leave Request Form */}
        <div className="card-box leave-form-box">
          <form onSubmit={handleInitialSubmit} className="leave-form">
            {/* Leave Type Selector */}
            <div className="form-group">
              <label className="form-label">Classification of Leave</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="form-select"
              >
                <option value="Medical Leave">Medical Leave (Doctor Certificate / Prescription)</option>
                <option value="On-Duty (OD)">On-Duty (Symposium / Hackathon / Sports / Lab Visit)</option>
                <option value="Personal Leave">Personal Leave (Family Event / Emergency)</option>
                <option value="Academic Conference">Academic Conference / Paper Presentation</option>
                <option value="Semester Internship">Industrial Internship / Interview</option>
              </select>
            </div>

            {/* Date Pickers */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">From Date</label>
                <div className="input-wrap">
                  <Calendar size={18} className="input-icon" />
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">To Date</label>
                <div className="input-wrap">
                  <Calendar size={18} className="input-icon" />
                  <input
                    type="date"
                    required
                    min={fromDate || todayStr}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Days Preview */}
            {dayCount > 0 && (
              <div className="day-count-pill">
                <Clock size={16} />
                <span>
                  Total Duration: <strong>{dayCount} {dayCount === 1 ? "Day" : "Days"}</strong>
                </span>
              </div>
            )}

            {/* Justification / Reason */}
            <div className="form-group">
              <div className="label-with-count">
                <label className="form-label">Detailed Academic Reason</label>
                <span className="char-count">{reason.length} / 500</span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State clearly why you require leave and any academic arrangements made..."
                className="form-textarea"
              />
            </div>

            {/* Document Upload Zone */}
            <div className="form-group">
              <label className="form-label">
                Supporting Verification Document (Optional, Recommended for Medical & OD)
              </label>
              <div className="upload-dropzone">
                <input
                  type="file"
                  id="leave-file-input"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden-file-input"
                />
                <label htmlFor="leave-file-input" className="dropzone-label">
                  <UploadCloud size={32} className="dropzone-icon" />
                  <span className="dropzone-main-text">
                    {file ? file.name : "Click to attach proof or drag and drop"}
                  </span>
                  <span className="dropzone-sub-text">
                    Supported: PDF, PNG, JPG (Max 5MB) • OCR Verified
                  </span>
                </label>
                {file && (
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => setFile(null)}
                  >
                    <X size={15} /> Remove File
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button submit-leave-btn"
            >
              {loading ? (
                <span>Submitting Request...</span>
              ) : (
                <>
                  <Send size={18} /> Submit Leave Request
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Institutional Workflow Guidance */}
        <div className="card-box leave-workflow-box">
          <h3 className="card-box-title">Approval Hierarchy</h3>
          <p className="card-box-subtitle">
            Every student leave follows the institution's mandatory sequential protocol
          </p>

          <div className="workflow-steps-vertical">
            <div className="workflow-step-item">
              <div className="step-num-circle">1</div>
              <div className="step-content">
                <strong>Class Advisor Review</strong>
                <p>Verifies academic schedule, past attendance record, and attached proof.</p>
                <span className="step-assigned">Assigned: {user?.advisor_name || "Faculty Advisor"}</span>
              </div>
            </div>

            <div className="workflow-step-item">
              <div className="step-num-circle">2</div>
              <div className="step-content">
                <strong>Head of Department (HOD)</strong>
                <p>Evaluates departmental impact and semester lab commitments.</p>
                <span className="step-assigned">Mr. Kumar • HOD CSE-AIML</span>
              </div>
            </div>

            <div className="workflow-step-item">
              <div className="step-num-circle">3</div>
              <div className="step-content">
                <strong>Vice Principal (VP) Endorsement</strong>
                <p>Final institutional clearance and official attendance register adjustment.</p>
                <span className="step-assigned">Mr. Rajesh • Vice Principal</span>
              </div>
            </div>
          </div>

          <div className="workflow-tips">
            <FileCheck size={18} className="text-indigo-600" />
            <div>
              <strong>Instant OCR Validation</strong>
              <p>Medical certificates and event brochures are scanned for dates to accelerate advisor approval.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Leave Application Submission"
        footer={
          <>
            <button className="secondary-button" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </button>
            <button className="primary-button" onClick={executeSubmit}>
              Confirm &amp; Route
            </button>
          </>
        }
      >
        <div className="confirm-modal-body">
          <p>Please review your application summary before routing to faculty:</p>
          <div className="confirm-summary-list">
            <div className="confirm-row">
              <span>Classification:</span>
              <strong>{leaveType}</strong>
            </div>
            <div className="confirm-row">
              <span>Duration:</span>
              <strong>{fromDate} to {toDate} ({dayCount} days)</strong>
            </div>
            <div className="confirm-row">
              <span>Justification:</span>
              <strong>{reason}</strong>
            </div>
            <div className="confirm-row">
              <span>Attached Proof:</span>
              <strong>{file ? file.name : "None attached"}</strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
