import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { apiFetch, asArray } from "../api";
import {
  SectionTitle,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
  Modal,
} from "../components/UIComponents";

export function AcademicCalendar({ user }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'month'
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Staff creation modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("End Semester Theory Examination");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const isStaff = ["Advisor", "HOD", "VP"].includes(user?.role);

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/exam-schedule");
      setExams(asArray(data));
    } catch (err) {
      setError(err.message || "Failed to load academic schedule.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Combined official calendar items
  const allEvents = useMemo(() => {
    const list = exams.map((ex) => ({
      id: `exam-${ex.id}`,
      rawId: ex.id,
      title: ex.exam_name || "Semester Examination",
      category: "Examinations",
      startDate: ex.exam_from_date,
      endDate: ex.exam_to_date,
      type: "exam",
      updatedBy: ex.updated_by || "System Faculty",
      location: "Main Exam Halls 1-4",
    }));

    // Standard institutional events for CSE - AIML
    const institutionEvents = [
      {
        id: "event-1",
        title: "Internal Assessment Assessment - I (CIA 1)",
        category: "Examinations",
        startDate: "2026-11-02",
        endDate: "2026-11-06",
        type: "internal",
        location: "Department Classrooms",
      },
      {
        id: "event-2",
        title: "National AI Symposium & Project Hackathon",
        category: "Events",
        startDate: "2026-11-14",
        endDate: "2026-11-15",
        type: "event",
        location: "Auditorium & AI Studio",
      },
      {
        id: "event-3",
        title: "Lab Practical Final Demonstrations",
        category: "Academic Deadlines",
        startDate: "2026-11-25",
        endDate: "2026-11-28",
        type: "lab",
        location: "Deep Learning Labs",
      },
      {
        id: "event-4",
        title: "Semester Winter Break & Vacation",
        category: "Holidays",
        startDate: "2026-12-20",
        endDate: "2027-01-02",
        type: "holiday",
        location: "Campus-wide",
      },
    ];

    return list.concat(institutionEvents).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [exams]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      const matchSearch =
        ev.title.toLowerCase().includes(search.toLowerCase()) ||
        ev.category.toLowerCase().includes(search.toLowerCase()) ||
        ev.startDate.includes(search);

      const matchCat =
        categoryFilter === "all" ||
        ev.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchSearch && matchCat;
    });
  }, [allEvents, search, categoryFilter]);

  const handleAddExam = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!fromDate || !toDate) {
      setModalError("Please select both start and end dates.");
      return;
    }

    if (toDate < fromDate) {
      setModalError("End date cannot precede start date.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/exam-schedule", {
        method: "POST",
        body: JSON.stringify({
          exam_name: name.trim() || "Semester Examination",
          exam_from_date: fromDate,
          exam_to_date: toDate,
        }),
      });

      setShowAddModal(false);
      setName("End Semester Theory Examination");
      setFromDate("");
      setToDate("");
      await loadSchedules();
    } catch (err) {
      setModalError(err.message || "Failed to save examination schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async (rawId) => {
    if (!window.confirm("Are you sure you want to remove this examination schedule entry?")) {
      return;
    }

    try {
      await apiFetch(`/exam-schedule/${rawId}`, {
        method: "DELETE",
      });
      await loadSchedules();
    } catch (err) {
      alert(err.message || "Unable to delete schedule.");
    }
  };

  return (
    <div className="academic-calendar-page">
      <div className="page-header-flex">
        <div>
          <h1 className="page-main-title">Academic Schedule &amp; Examinations</h1>
          <p className="page-main-subtitle">
            Official examination windows, internal assessments, and department milestones
          </p>
        </div>
        <div className="page-header-actions">
          {isStaff && (
            <button className="primary-button" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Examination Window
            </button>
          )}
        </div>
      </div>

      {/* Control bar: Search, Categories, and View Mode */}
      <div className="card-box filters-bar-card">
        <div className="filters-row">
          <div className="search-pill-input flex-1">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by event title, exam, or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-pill-select">
            <Filter size={15} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Event Categories</option>
              <option value="Examinations">Examinations</option>
              <option value="Academic Deadlines">Academic Deadlines</option>
              <option value="Events">Campus Events</option>
              <option value="Holidays">Official Holidays</option>
            </select>
          </div>

          <div className="view-mode-toggle">
            <button
              className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              List View
            </button>
            <button
              className={`toggle-btn ${viewMode === "month" ? "active" : ""}`}
              onClick={() => setViewMode("month")}
            >
              Schedule Cards
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <EmptyState
          title="Schedule Unavailable"
          text={error}
          action={
            <button className="primary-button" onClick={loadSchedules}>
              Retry Connection
            </button>
          }
        />
      ) : !filteredEvents.length ? (
        <EmptyState
          title="No Academic Events Found"
          text="There are no upcoming scheduled events matching the selected filters."
          icon={CalendarDays}
          action={
            isStaff ? (
              <button className="primary-button" onClick={() => setShowAddModal(true)}>
                Add First Schedule Entry
              </button>
            ) : null
          }
        />
      ) : (
        <div className={viewMode === "list" ? "calendar-events-list" : "calendar-events-grid"}>
          {filteredEvents.map((ev) => {
            const isExam = ev.category === "Examinations";
            return (
              <div
                key={ev.id}
                className={`calendar-event-card ${
                  isExam ? "border-indigo-card" : ev.category === "Holidays" ? "border-amber-card" : ""
                }`}
              >
                <div className="event-date-col">
                  <span className="event-date-month">
                    {new Date(ev.startDate).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="event-date-day">
                    {new Date(ev.startDate).getDate()}
                  </span>
                  <span className="event-date-year">
                    {new Date(ev.startDate).getFullYear()}
                  </span>
                </div>

                <div className="event-body-col">
                  <div className="event-category-badge-row">
                    <span
                      className={`event-cat-chip ${
                        isExam ? "exam" : ev.category === "Holidays" ? "holiday" : "deadline"
                      }`}
                    >
                      {ev.category}
                    </span>
                    {ev.updatedBy && (
                      <span className="event-faculty-tag">
                        Managed by: {ev.updatedBy}
                      </span>
                    )}
                  </div>

                  <h3 className="event-title">{ev.title}</h3>

                  <div className="event-meta-row">
                    <span className="event-meta-item">
                      <Clock size={14} />
                      <span>
                        {ev.startDate === ev.endDate
                          ? ev.startDate
                          : `${ev.startDate} to ${ev.endDate}`}
                      </span>
                    </span>
                    <span className="event-meta-item">
                      <MapPin size={14} />
                      <span>{ev.location}</span>
                    </span>
                  </div>
                </div>

                {isStaff && ev.rawId && (
                  <div className="event-actions-col">
                    <button
                      className="event-delete-btn"
                      onClick={() => handleDeleteExam(ev.rawId)}
                      title="Remove exam schedule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Staff Add Exam Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Schedule New Examination Window"
        footer={
          <>
            <button className="secondary-button" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button
              className="primary-button"
              disabled={submitting}
              onClick={handleAddExam}
            >
              {submitting ? "Publishing..." : "Publish Exam Window"}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddExam} className="modal-form-vertical">
          {modalError && (
            <div className="modal-error-box">
              <AlertCircle size={16} />
              <span>{modalError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Examination Name / Designation</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. End Semester Theory Examination Nov 2026"
              className="form-input"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Exam Commences (From)</label>
              <input
                type="date"
                required
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Exam Concludes (To)</label>
              <input
                type="date"
                required
                min={fromDate}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
