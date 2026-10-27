import React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Send,
  History,
  BarChart3,
  Bell,
  Bot,
  Users,
  Inbox,
  FileText,
  UserCheck,
  LogOut,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  X,
} from "lucide-react";
import { getInitials } from "../api";

export function Sidebar({
  user,
  activePage,
  setActivePage,
  logout,
  isMobileOpen,
  onCloseMobile,
}) {
  const role = user?.role || "Student";

  const getMenuItems = () => {
    switch (role) {
      case "Student":
        return [
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "attendance", label: "Attendance Analysis", icon: BarChart3 },
          { id: "apply-leave", label: "Apply Leave", icon: Send },
          { id: "leave-history", label: "Leave History", icon: History },
          { id: "schedule", label: "Academic Calendar", icon: CalendarDays },
          { id: "ai-assistant", label: "AI Academic Assistant", icon: Bot, highlight: true },
          { id: "notifications", label: "Notifications", icon: Bell },
        ];
      case "Parent":
        return [
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "student-details", label: "Student Details", icon: UserCheck },
          { id: "leave-monitoring", label: "Leave Monitoring", icon: History },
          { id: "notifications", label: "Notifications", icon: Bell },
        ];
      case "Advisor":
        return [
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "students", label: "My Students", icon: Users },
          { id: "leave-requests", label: "Leave Requests", icon: Inbox },
          { id: "attendance", label: "Attendance Monitoring", icon: BarChart3 },
          { id: "reports", label: "Reports & Analytics", icon: FileText },
        ];
      case "HOD":
        return [
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "students", label: "Department Students", icon: Users },
          { id: "leave-requests", label: "Escalated Leaves", icon: Inbox },
          { id: "attendance", label: "Attendance Reports", icon: BarChart3 },
          { id: "schedule", label: "Exam Schedule", icon: CalendarDays },
          { id: "reports", label: "Reports & Analytics", icon: FileText },
        ];
      case "VP":
        return [
          { id: "dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
          { id: "students", label: "Institution Directory", icon: Users },
          { id: "leave-requests", label: "Final Approvals", icon: Inbox },
          { id: "attendance", label: "Campus Attendance", icon: BarChart3 },
          { id: "schedule", label: "Exam Schedule", icon: CalendarDays },
          { id: "reports", label: "Institutional Reports", icon: FileText },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {isMobileOpen && (
        <div className="sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside className={`app-sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-wrap">
            <div className="brand-logo-icon">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div className="brand-text">
              <h1 className="brand-name">Stud LMS</h1>
              <span className="brand-tagline">Academic Intelligence</span>
            </div>
          </div>
          <button className="mobile-close-btn" onClick={onCloseMobile} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* User Profile Mini Card */}
        <div className="sidebar-profile-card">
          <div className="profile-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="profile-details">
            <strong className="profile-name">{user?.name}</strong>
            <span className="profile-role-badge">
              <ShieldCheck size={12} />
              {role}
            </span>
            <span className="profile-meta">
              {role === "Student" && `${user?.year || "III Year"} • Sec ${user?.section || "A"}`}
              {role === "Advisor" && `${user?.year || ""} ${user?.section || ""} Advisor`}
              {(role === "HOD" || role === "VP") && (user?.department || "CSE - AIML")}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">MAIN NAVIGATION</span>
          <ul className="nav-list">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <li key={item.id} className="nav-item">
                  <button
                    className={`nav-link ${isActive ? "active" : ""} ${item.highlight ? "highlight-link" : ""}`}
                    onClick={() => {
                      setActivePage(item.id);
                      onCloseMobile?.();
                    }}
                  >
                    <Icon size={19} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                    {item.highlight && (
                      <span className="sparkle-pill">
                        <Sparkles size={11} /> AI
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Card / System Status */}
        <div className="sidebar-footer">
          <div className="status-mini-card">
            <div className="status-indicator">
              <span className="pulse-dot" />
              <span>Campus Core v3.0</span>
            </div>
            <span className="status-caption">Dept of CSE - AIML</span>
          </div>

          <button className="sidebar-logout-btn" onClick={logout}>
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
