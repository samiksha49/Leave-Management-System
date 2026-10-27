import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Info,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "../api";
import {
  RadialGauge,
  SectionTitle,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
  InfoItem,
} from "../components/UIComponents";
import { AttendanceCalculator } from "../components/AttendanceCalculator";

export function AttendancePage({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const studentId = user?.id || user?.student_id;

  const loadAttendance = useCallback(async () => {
    if (!studentId) {
      setError("Student identifier is missing. Please re-authenticate.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await apiFetch(`/student/${studentId}/attendance-analysis`);
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to load attendance intelligence records.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const filteredSubjects = useMemo(() => {
    if (!data?.subjects) return [];
    return data.subjects.filter((sub) => {
      const matchSearch =
        sub.name.toLowerCase().includes(search.toLowerCase()) ||
        sub.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        sub.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [data?.subjects, search, statusFilter]);

  const exportCSV = () => {
    if (!data?.subjects) return;
    const headers = ["Subject Code", "Subject Name", "Credits", "Attended", "Total", "Percentage", "Status"];
    const rows = data.subjects.map((s) => [
      s.code,
      `"${s.name}"`,
      s.credits,
      s.attended_classes,
      s.total_classes,
      `${s.percentage}%`,
      s.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [`STUD LMS ATTENDANCE REPORT - ${data.name} (${data.register_number})`, ""]
        .concat([headers.join(",")])
        .concat(rows.map((e) => e.join(",")))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${data.register_number || "report"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="attendance-page-content">
        <SectionTitle
          title="Attendance Analysis & Intelligence"
          text="Retrieving official records from campus database..."
        />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-page-content">
        <SectionTitle
          title="Attendance Analysis"
          text="Student Attendance Intelligence System"
        />
        <EmptyState
          title="Attendance Data Unavailable"
          text={error}
          icon={AlertCircle}
          action={
            <button className="primary-button" onClick={loadAttendance}>
              <RefreshCw size={15} /> Retry Connection
            </button>
          }
        />
      </div>
    );
  }

  const attendance = Number(data?.attendance || 0);
  const target = Number(data?.target || 75);
  const attendedClasses = Number(data?.attended_classes || 0);
  const totalClasses = Number(data?.total_classes || 100);
  const missedClasses = Number(data?.missed_classes || 0);

  return (
    <div className="attendance-page-content">
      {/* Page Header with Export */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-main-title">Attendance Intelligence & Monitoring</h1>
          <p className="page-main-subtitle">
            Curriculum tracking for <strong>{data?.name}</strong> • Roll No: {data?.register_number} • {data?.year} {data?.section}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="secondary-button" onClick={exportCSV}>
            <Download size={16} /> Export Attendance CSV
          </button>
        </div>
      </div>

      {/* Main Attendance Overview Card */}
      <div className="attendance-overview-banner">
        <div className="overview-gauge-col">
          <RadialGauge
            value={attendance}
            size={160}
            strokeWidth={14}
            label="Overall Attendance"
            target={target}
          />
        </div>

        <div className="overview-details-col">
          <div className="overview-status-row">
            <span
              className={`overview-badge ${
                attendance >= target
                  ? "safe"
                  : attendance >= 60
                  ? "warning"
                  : "danger"
              }`}
            >
              {attendance >= target ? (
                <CheckCircle2 size={16} />
              ) : attendance >= 60 ? (
                <AlertTriangle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{data?.risk || (attendance >= target ? "On Track" : "Attendance Shortage")}</span>
            </span>
            <span className="institution-target-tag">
              Institutional Target: <strong>{target}%</strong>
            </span>
          </div>

          <p className="overview-narrative">
            {attendance >= target
              ? "Your academic attendance exceeds the mandatory university examination threshold. Maintain regular presence to sustain eligibility."
              : `Your current attendance is below the mandatory ${target}% threshold. Immediate action is recommended to avoid examination condonation penalties.`}
          </p>

          <div className="overview-metrics-grid">
            <InfoItem label="Attended Classes" value={`${attendedClasses} hrs`} />
            <InfoItem label="Missed Classes" value={`${missedClasses} hrs`} />
            <InfoItem label="Total Conducted" value={`${totalClasses} hrs`} />
            <InfoItem label="Daily Classes" value={`${data?.classes_per_day || 6} hrs/day`} />
          </div>
        </div>
      </div>

      {/* Interactive Attendance Eligibility Calculator */}
      <AttendanceCalculator
        totalClasses={totalClasses}
        attendedClasses={attendedClasses}
        currentPercentage={attendance}
        defaultTarget={target}
      />

      {/* Monthly Attendance Trend Visualization */}
      {data?.monthly_trend && (
        <div className="card-box">
          <div className="card-box-header">
            <div>
              <h3 className="card-box-title">Monthly Attendance Trajectory</h3>
              <p className="card-box-subtitle">Progressive attendance performance across current semester</p>
            </div>
          </div>

          <div className="trend-bars-container">
            {data.monthly_trend.map((m) => {
              const pct = Number(m.percentage);
              const isSafe = pct >= target;
              return (
                <div key={m.month} className="trend-bar-item">
                  <div className="trend-bar-track">
                    <div
                      className={`trend-bar-fill ${isSafe ? "bg-emerald" : "bg-amber"}`}
                      style={{ height: `${Math.min(100, Math.max(10, pct))}%` }}
                    />
                    <span className="trend-bar-label-top">{pct}%</span>
                  </div>
                  <span className="trend-bar-month">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subject-Wise Attendance Breakdown Table */}
      <div className="card-box">
        <div className="card-box-header flex-wrap">
          <div>
            <h3 className="card-box-title">Course-Wise Attendance Roster</h3>
            <p className="card-box-subtitle">Detailed breakdown across all semester subjects</p>
          </div>

          <div className="table-controls-row">
            <div className="search-pill-input">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search subject code or name..."
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
                <option value="all">All Statuses</option>
                <option value="good">Good (≥75%)</option>
                <option value="warning">Warning (60-74%)</option>
                <option value="critical">Critical (&lt;60%)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Title</th>
                <th>Credits</th>
                <th>Attended / Total</th>
                <th>Percentage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((sub) => {
                const pct = Number(sub.percentage);
                return (
                  <tr key={sub.code}>
                    <td className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {sub.code}
                    </td>
                    <td>
                      <strong>{sub.name}</strong>
                    </td>
                    <td>{sub.credits} Credits</td>
                    <td>
                      {sub.attended_classes} / {sub.total_classes} hrs
                    </td>
                    <td>
                      <div className="table-progress-cell">
                        <div className="mini-progress-track">
                          <div
                            className={`mini-progress-fill ${
                              pct >= target ? "bg-emerald" : pct >= 60 ? "bg-amber" : "bg-red"
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="mini-progress-pct">{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={sub.status} />
                    </td>
                  </tr>
                );
              })}
              {!filteredSubjects.length && (
                <tr>
                  <td colSpan={6} className="text-center py-6">
                    <EmptyState
                      title="No Matching Subjects"
                      text="No courses match the current filter criteria."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
