import React, { useState, useEffect, useRef } from "react";
import {
  Sun,
  Moon,
  Bell,
  Search,
  Menu,
  User,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "../theme";
import { getInitials } from "../api";

export function Navbar({
  user,
  onLogout,
  onOpenMobileMenu,
  notifications = [],
  onNavigate,
  onSearch,
}) {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.status === "Unread").length;

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="navbar-greeting">
          <span className="greeting-text">
            {getGreeting()}, <strong className="user-name">{user?.name || "Scholar"}</strong>
          </span>
          <span className="navbar-date">{todayStr}</span>
        </div>
      </div>

      <div className="navbar-center">
        <form onSubmit={handleSearchSubmit} className="global-search-form">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search academic modules, schedule, leaves..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="global-search-input"
          />
          <kbd className="search-shortcut">⌘K</kbd>
        </form>
      </div>

      <div className="navbar-right">
        {/* Working Theme Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          aria-label="Toggle visual theme"
        >
          {theme === "dark" ? <Sun size={19} className="theme-icon sun" /> : <Moon size={19} className="theme-icon moon" />}
        </button>

        {/* Notifications Popover */}
        <div className="nav-popover-anchor" ref={notifRef}>
          <button
            className={`notif-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notifications-popover">
              <div className="popover-header">
                <div className="popover-title-row">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="unread-pill">{unreadCount} new</span>
                  )}
                </div>
                <button
                  className="view-all-link"
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate?.("notifications");
                  }}
                >
                  View All
                </button>
              </div>

              <div className="popover-list">
                {notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    className={`popover-item ${notif.status === "Unread" ? "unread" : ""}`}
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate?.("notifications");
                    }}
                  >
                    <div className="popover-item-icon">
                      {notif.message.toLowerCase().includes("approved") ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : notif.message.toLowerCase().includes("rejected") ? (
                        <AlertCircle size={16} className="text-red-500" />
                      ) : (
                        <Clock size={16} className="text-indigo-500" />
                      )}
                    </div>
                    <div className="popover-item-content">
                      <p className="popover-item-text">{notif.message}</p>
                      <span className="popover-item-time">Recent</span>
                    </div>
                  </div>
                ))}
                {!notifications.length && (
                  <div className="popover-empty">
                    <p>No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill & Dropdown */}
        <div className="nav-popover-anchor" ref={profileRef}>
          <button
            className="profile-pill-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="User account menu"
          >
            <div className="user-avatar-circle">
              {getInitials(user?.name)}
            </div>
            <div className="profile-pill-meta">
              <span className="pill-name">{user?.name}</span>
              <span className="pill-role">{user?.role}</span>
            </div>
            <ChevronDown size={14} className="profile-chevron" />
          </button>

          {showProfileMenu && (
            <div className="profile-menu-dropdown">
              <div className="dropdown-user-info">
                <strong>{user?.name}</strong>
                <span className="dropdown-email">{user?.email}</span>
                <span className="dropdown-role-chip">{user?.role}</span>
              </div>
              <div className="dropdown-divider" />
              {user?.role === "Student" && (
                <div className="dropdown-section-items">
                  <div className="dropdown-info-row">
                    <span>Register No:</span>
                    <strong>{user?.register_number || "-"}</strong>
                  </div>
                  <div className="dropdown-info-row">
                    <span>Class:</span>
                    <strong>{user?.year} {user?.section}</strong>
                  </div>
                  <div className="dropdown-info-row">
                    <span>Dept:</span>
                    <strong>{user?.department || "CSE - AIML"}</strong>
                  </div>
                </div>
              )}
              {user?.role === "Advisor" && (
                <div className="dropdown-section-items">
                  <div className="dropdown-info-row">
                    <span>Class:</span>
                    <strong>{user?.year} {user?.section}</strong>
                  </div>
                </div>
              )}
              <div className="dropdown-divider" />
              <button
                className="dropdown-logout-btn"
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout?.();
                }}
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
