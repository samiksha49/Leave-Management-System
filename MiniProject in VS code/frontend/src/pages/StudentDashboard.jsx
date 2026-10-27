import React, { useState, useEffect, useCallback } from "react";
import {
  Send,
  History,
  BarChart3,
  CalendarDays,
  Bot,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { apiFetch, asArray, isFinished, getLeaveStatus, getInitials } from "../api";
import {
  StatCard,
  ActionCard,
  StatusBadge,
  SectionTitle,
  RadialGauge,
  EmptyState,
  LoadingSkeleton,
} from "../components/UIComponents";

export function StudentDashboard({ user, setActivePage }) {
  const [student, setStudent] = useState(user);
  const [attendanceData, setAttendanceData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const studentId = user?.id || user?.student_id;

  const loadData = useCallback(async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      setError("");

      const [profileRes, leavesRes, attendanceRes, examsRes] = await Promise.allSettled([
        apiFetch(`/student/${studentId}`),
        apiFetch(`/student/${studentId}/leaves`),
        apiFetch(`/student/${studentId}/attendance-analysis`),
        apiFetch("/exam-schedule"),
      ]);

      if (profileRes.status === "fulfilled") {
        setStudent((prev) => ({ ...prev, ...profileRes.value }));
      }
      if (leavesRes.status === "fulfilled") {
        setLeaves(asArray(leavesRes.value));
      }
      if (attendanceRes.status === "fulfilled") {
        setAttendanceData(attendanceRes.value);
      }
      if (examsRes.status === "fulfilled") {
        setExams(asArray(examsRes.value));
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Unable to retrieve all dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const overallAttendance = Number(attendanceData?.attendance ?? student?.attendance ?? 0);
  const pendingLeaves = leaves.filter((l) => !isFinished(l)).length;
  const targetAttendance = Number(attendanceData?.target ?? 75);

  // Find next upcoming exam
  const nextExam = exams && exams.length > 0 ? exams[0] : null;

  return (
    <div className="dashboard-content">
      {/* Welcome Hero Card */}
      <div className="dashboard-hero-card">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="live-dot" />
            <span>ACADEMIC PORTAL • 2026-2027</span>
          </div>
          <h1 className="hero-title">Welcome back, {student?.name || "Student"}</h1>
          <p className="hero-desc">
            Enrolled in <strong>{student?.department || "CSE - AIML"}</strong> • {student?.year || "III Year"}, Section {student?.section || "A"} • Class Advisor: <strong>{student?.advisor_name || "Ms. K. Anusuya"}</strong>
          </p>

          <div className="hero-meta-badges">
            <span className="hero-meta-chip">
              <strong>Roll No:</strong> {student?.register_number || "-"}
            </span>
            <span className={`hero-status-chip ${overallAttendance >= targetAttendance ? "safe" : "warning"}`}>
              {overallAttendance >= targetAttendance ? (
                <CheckCircle2 size={14} />
              ) : (
                <AlertTriangle size={14} />
              )}
              <span>Attendance: {overallAttendance}% ({overallAttendance >= targetAttendance ? "Safe" : "Shortage"})</span>
            </span>
          </div>
        </div>

        <div className="hero-right">
          <RadialGauge
            value={overallAttendance}
            size={140}
            strokeWidth={12}
            label="Current Attendance"
            target={targetAttendance}
          />
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-grid">
        <StatCard
          label="Overall Attendance"
          value={`${overallAttendance}%`}
          icon={BarChart3}
          change={overallAttendance >= targetAttendance ? "Above 75% Target" : "Below 75% Target"}
          changeType={overallAttendance >= targetAttendance ? "positive" : "negative"}
          subtext={`${attendanceData?.attended_classes ?? "-"} / ${attendanceData?.total_classes ?? 100} classes attended`}
        />

        <StatCard
          label="Active Leave Requests"
          value={pendingLeaves}
          icon={Clock}
          change={pendingLeaves > 0 ? `${pendingLeaves} In Review` : "All Processed"}
          changeType={pendingLeaves > 0 ? "warning" : "positive"}
          subtext={leaves.length ? `${leaves.length} total leaves on record` : "No prior leave requests"}
        />

        <StatCard
          label="Upcoming Examination"
          value={nextExam ? nextExam.exam_name || "Semester Exam" : "Announced Soon"}
          icon={CalendarDays}
          change={nextExam ? `${nextExam.exam_from_date}` : "Schedule Updated"}
          changeType="neutral"
          subtext={nextExam ? `To: ${nextExam.exam_to_date}` : "Check academic calendar"}
        />

        <StatCard
          label="AI Academic Standing"
          value={overallAttendance >= targetAttendance ? "Good Standing" : "Attendance Risk"}
          icon={Sparkles}
          change={overallAttendance >= targetAttendance ? "Exam Eligible" : "Condonation Required"}
          changeType={overallAttendance >= targetAttendance ? "positive" : "negative"}
          subtext="Target: 75% Minimum Attendance"
        />
      </div>

      {/* Main 2-Column Section: Attendance Analytics & Recent Activity */}
      <div className="dashboard-grid-2col">
        {/* Left Column: Subject Breakdown Preview */}
        <div className="card-box">
          <div className="card-box-header">
            <div>
              <h3 className="card-box-title">Subject-Wise Attendance</h3>
              <p className="card-box-subtitle">Current semester course enrollment breakdown</p>
            </div>
            <button
              className="text-link-btn"
              onClick={() => setActivePage("attendance")}
            >
              View Full Analysis <ArrowRight size={15} />
            </button>
          </div>

          <div className="subject-list">
            {attendanceData?.subjects?.map((sub) => {
              const pct = Number(sub.percentage || 0);
              const isSafe = pct >= targetAttendance;
              return (
                <div key={sub.code} className="subject-item">
                  <div className="subject-item-header">
                    <div className="subject-info">
                      <span className="subject-code">{sub.code}</span>
                      <strong className="subject-name">{sub.name}</strong>
                    </div>
                    <div className="subject-stats">
                      <span className="subject-attended">{sub.attended_classes}/{sub.total_classes} hrs</span>
                      <span className={`subject-pct ${isSafe ? "safe" : "warning"}`}>{pct}%</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${isSafe ? "bg-emerald" : "bg-amber"}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!attendanceData?.subjects?.length && (
              <EmptyState
                title="Curriculum Loading"
                text="Subject-wise attendance breakdown is loading from the server."
                icon={BookOpen}
              />
            )}
          </div>
        </div>

        {/* Right Column: Recent Leave Requests & Calendar Preview */}
        <div className="card-box">
          <div className="card-box-header">
            <div>
              <h3 className="card-box-title">Recent Leave Status</h3>
              <p className="card-box-subtitle">Multi-tier approval workflow tracking</p>
            </div>
            <button
              className="text-link-btn"
              onClick={() => setActivePage("leave-history")}
            >
              All Leaves <ArrowRight size={15} />
            </button>
          </div>

          <div className="recent-leaves-list">
            {leaves.slice(0, 3).map((leave) => {
              const status = getLeaveStatus(leave);
              return (
                <div key={leave.id} className="leave-status-card">
                  <div className="leave-card-top">
                    <div className="leave-type-chip">
                      <strong>{leave.leave_type}</strong>
                      <span>{leave.from_date} to {leave.to_date}</span>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <p className="leave-reason-text">"{leave.reason}"</p>
                  <div className="leave-workflow-dots">
                    <span className={`step-dot ${leave.advisor_status === "Approved" ? "done" : leave.advisor_status === "Rejected" ? "rejected" : "active"}`}>
                      1. Advisor
                    </span>
                    <span className="step-arrow">→</span>
                    <span className={`step-dot ${leave.hod_status === "Approved" ? "done" : leave.hod_status === "Rejected" ? "rejected" : leave.advisor_status === "Approved" ? "active" : ""}`}>
                      2. HOD
                    </span>
                    <span className="step-arrow">→</span>
                    <span className={`step-dot ${leave.vp_status === "Approved" ? "done" : leave.vp_status === "Rejected" ? "rejected" : leave.hod_status === "Approved" ? "active" : ""}`}>
                      3. VP
                    </span>
                  </div>
                </div>
              );
            })}
            {!leaves.length && (
              <EmptyState
                title="No Recent Leaves"
                text="You have not submitted any leave requests this semester."
                icon={FileText}
                action={
                  <button className="secondary-button" onClick={() => setActivePage("apply-leave")}>
                    Apply for Leave
                  </button>
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <SectionTitle
        title="Quick Campus Actions"
        text="Fast shortcuts for common student activities and tools"
      />
      <div className="actions-grid-4">
        <ActionCard
          title="Apply for Leave"
          text="Submit medical, personal, or on-duty requests with proof."
          icon={Send}
          onClick={() => setActivePage("apply-leave")}
        />
        <ActionCard
          title="Attendance Analysis"
          text="Inspect subject breakdown and use the eligibility calculator."
          icon={BarChart3}
          onClick={() => setActivePage("attendance")}
        />
        <ActionCard
          title="Academic Calendar"
          text="Check semester examination schedules and holidays."
          icon={CalendarDays}
          onClick={() => setActivePage("schedule")}
        />
        <ActionCard
          title="AI Academic Assistant"
          text="Get data-grounded answers about your attendance and exams."
          icon={Bot}
          onClick={() => setActivePage("ai-assistant")}
          badge="AI Powered"
        />
      </div>
    </div>
  );
}
