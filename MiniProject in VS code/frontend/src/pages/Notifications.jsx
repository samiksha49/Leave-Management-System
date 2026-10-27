import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Search,
  CheckCheck,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { apiFetch, asArray } from "../api";
import {
  SectionTitle,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
} from "../components/UIComponents";

export function Notifications({ user, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const studentId = user?.id || user?.student_id;
  const role = user?.role || "Student";

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      let path = "";
      if (role === "Student" && studentId) {
        path = `/student/${studentId}/notifications`;
      } else if (role === "Parent" && user?.email) {
        path = `/parent/${encodeURIComponent(user.email)}/notifications`;
      } else {
        // Fallback for staff
        path = studentId ? `/student/${studentId}/notifications` : "";
      }

      if (!path) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const data = await apiFetch(path);
      setNotifications(asArray(data));
    } catch (err) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [role, studentId, user?.email]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "Read" } : n))
      );
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (studentId) {
      try {
        await apiFetch(`/student/${studentId}/notifications/read-all`, {
          method: "PUT",
        });
        setNotifications((prev) => prev.map((n) => ({ ...n, status: "Read" })));
      } catch (err) {
        console.error("Mark all read error:", err);
      }
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchSearch = item.message.toLowerCase().includes(search.toLowerCase());
      let matchFilter = true;
      if (filter === "unread") {
        matchFilter = item.status === "Unread";
      } else if (filter === "leaves") {
        matchFilter = item.message.toLowerCase().includes("leave");
      } else if (filter === "attendance") {
        matchFilter = item.message.toLowerCase().includes("attendance");
      }
      return matchSearch && matchFilter;
    });
  }, [notifications, search, filter]);

  const unreadCount = notifications.filter((n) => n.status === "Unread").length;

  return (
    <div className="notifications-page">
      <div className="page-header-flex">
        <div>
          <h1 className="page-main-title">Notification Center &amp; Alerts</h1>
          <p className="page-main-subtitle">
            System announcements, leave escalation progress, and academic deadlines
          </p>
        </div>
        <div className="page-header-actions">
          {unreadCount > 0 && (
            <button className="secondary-button" onClick={handleMarkAllRead}>
              <CheckCheck size={16} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Control bar */}
      <div className="card-box filters-bar-card">
        <div className="filters-row">
          <div className="search-pill-input flex-1">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-pill-select">
            <Filter size={15} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Notifications ({notifications.length})</option>
              <option value="unread">Unread ({unreadCount})</option>
              <option value="leaves">Leave Updates</option>
              <option value="attendance">Attendance Alerts</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <EmptyState
          title="Notification Service Unavailable"
          text={error}
          action={
            <button className="primary-button" onClick={loadNotifications}>
              Retry Connection
            </button>
          }
        />
      ) : !filteredNotifications.length ? (
        <EmptyState
          title="All Caught Up!"
          text={
            search || filter !== "all"
              ? "No alerts match the selected search filters."
              : "You have no outstanding unread notifications or alerts."
          }
          icon={Bell}
        />
      ) : (
        <div className="notifications-list-card">
          {filteredNotifications.map((notif) => {
            const isUnread = notif.status === "Unread";
            const isLeave = notif.message.toLowerCase().includes("leave");
            const isApproved = notif.message.toLowerCase().includes("approved");
            const isRejected = notif.message.toLowerCase().includes("rejected");

            return (
              <div
                key={notif.id}
                className={`notification-item-row ${isUnread ? "unread" : ""}`}
              >
                <div className="notif-item-left">
                  <div
                    className={`notif-type-icon ${
                      isApproved
                        ? "emerald"
                        : isRejected
                        ? "danger"
                        : "indigo"
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 size={18} />
                    ) : isRejected ? (
                      <AlertCircle size={18} />
                    ) : (
                      <Clock size={18} />
                    )}
                  </div>
                  <div className="notif-item-details">
                    <p className="notif-message-text">{notif.message}</p>
                    <div className="notif-meta-tags">
                      <span className="notif-category-chip">
                        {isLeave ? "Leave Workflow" : "Campus System"}
                      </span>
                      <span className="notif-status-chip">
                        {isUnread ? "Unread" : "Archived"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="notif-item-actions">
                  {isLeave && onNavigate && (
                    <button
                      className="notif-action-link"
                      onClick={() => onNavigate("leave-history")}
                    >
                      <span>Track Leave</span>
                      <ArrowRight size={14} />
                    </button>
                  )}

                  {isUnread && (
                    <button
                      className="mark-read-btn"
                      onClick={() => handleMarkRead(notif.id)}
                      title="Mark as read"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
