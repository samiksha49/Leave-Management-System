import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Send,
  History,
  BarChart3,
  CalendarDays,
  Bell,
  User,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Settings as SettingsIcon,
  Users,
  FileText,
  Download,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Search,
  Filter,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  Info,
  Layers,
  UploadCloud,
  FileCheck,
  X,
  Menu,
  LogOut,
  Mail,
  Lock,
  Calendar,
  AlertCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const ADVISOR_DATA = {
  "I Year A": { name: "Ms. Priya", email: "priya.advisor@gmail.com", password: "priya@123" },
  "I Year B": { name: "Mr. Naveen", email: "naveen.advisor@gmail.com", password: "naveen@123" },
  "II Year A": { name: "Ms. Divya", email: "divya.advisor@gmail.com", password: "divya@123" },
  "II Year B": { name: "Mr. Karthik", email: "karthik.advisor@gmail.com", password: "karthik@123" },
  "III Year A": { name: "Ms. K. Anusuya", email: "anusuya.advisor@gmail.com", password: "anusuya@123" },
  "III Year B": { name: "Mr. Arun", email: "arun.advisor@gmail.com", password: "arun@123" },
  "IV Year A": { name: "Ms. Swetha", email: "swetha.advisor@gmail.com", password: "swetha@123" },
};

const DEMO_STUDENT = {
  register_number: "24025",
  email: "student24025@studlms.com",
  password: "student24025@123",
};

const DEMO_HOD = {
  email: "kumar.hod@gmail.com",
  password: "kumar@123",
};

const DEMO_VP = {
  email: "rajesh.vp@gmail.com",
  password: "rajesh@123",
};

const VALID_ROLES = ["Student", "Parent", "Advisor", "HOD", "VP"];

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  const roles = {
    student: "Student",
    parent: "Parent",
    advisor: "Advisor",
    hod: "HOD",
    vp: "VP",
  };
  return roles[value] || "";
}

function normalizeUser(rawUser, fallbackRole = "") {
  const source =
    rawUser?.user ||
    rawUser?.data?.user ||
    rawUser?.data ||
    rawUser ||
    {};

  const role = normalizeRole(
    source.role ||
      rawUser?.role ||
      rawUser?.user_role ||
      rawUser?.role_name ||
      fallbackRole
  );

  let year = source.year || rawUser?.year || "";
  let section = source.section || rawUser?.section || "";

  const className =
    source.class_name ||
    source.year_section ||
    rawUser?.class_name ||
    rawUser?.year_section ||
    "";

  if ((!year || !section) && className) {
    const parts = String(className).trim().split(/\s+/);
    if (!year && parts.length > 1) {
      year = parts.slice(0, -1).join(" ");
    }
    if (!section) {
      section = parts[parts.length - 1];
    }
  }

  return {
    ...source,
    id: source.id ?? rawUser?.id,
    student_id: source.student_id ?? rawUser?.student_id,
    name: source.name || source.full_name || rawUser?.name || "User",
    email: source.email || rawUser?.email || "",
    role,
    year,
    section,
    class_name: className,
    year_section: className || `${year} ${section}`.trim(),
    register_number:
      source.register_number || rawUser?.register_number || "",
  };
}

function getStoredUser() {
  try {
    const saved = localStorage.getItem("stud_lms_user");
    if (!saved) return null;

    const user = normalizeUser(JSON.parse(saved));
    if (!VALID_ROLES.includes(user.role)) {
      localStorage.removeItem("stud_lms_user");
      return null;
    }
    return user;
  } catch {
    localStorage.removeItem("stud_lms_user");
    return null;
  }
}

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot connect to the backend. Please check that FastAPI is running at http://127.0.0.1:8000."
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || `Request failed (${response.status}).`
    );
  }

  return data;
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.leaves)) return data.leaves;
  if (Array.isArray(data?.students)) return data.students;
  if (Array.isArray(data?.notifications)) return data.notifications;
  if (Array.isArray(data?.exams)) return data.exams;
  return [];
}

function getParentDemoCredentials(registerNumber) {
  const roll = String(registerNumber || "").trim();
  if (!roll) return null;

  if (roll === "26001") {
    return {
      email: "meena.parent@gmail.com",
      password: "meena@123",
    };
  }

  return {
    email: `parent${roll}@studlms.com`,
    password: `parent${roll}@123`,
  };
}

function getInitials(name) {
  return String(name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getLeaveStatus(leave) {
  if (leave.final_status) {
    if (leave.final_status.toLowerCase() !== "pending") {
      return leave.final_status;
    }
  }

  const advisor = String(leave.advisor_status || "Pending");
  const hod = String(leave.hod_status || "Pending");
  const vp = String(leave.vp_status || "Pending");

  if (advisor.toLowerCase().includes("reject")) return "Advisor Rejected";
  if (hod.toLowerCase().includes("reject")) return "HOD Rejected";
  if (vp.toLowerCase().includes("reject")) return "VP Rejected";

  if (vp.toLowerCase() === "approved") return "Approved";
  if (hod.toLowerCase() === "approved") return "Pending VP Approval";
  if (advisor.toLowerCase() === "approved") return "Pending HOD Approval";

  return "Pending Advisor Approval";
}

function isRejected(leave) {
  return getLeaveStatus(leave).toLowerCase().includes("reject");
}

function isFinished(leave) {
  const status = getLeaveStatus(leave).toLowerCase();
  return status === "approved" || status.includes("reject");
}

/* ============================================================
   MAIN APP ROUTER
============================================================ */

function App() {
  const [user, setUser] = useState(getStoredUser);
  const [activePage, setActivePage] = useState("dashboard");
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("stud_lms_theme") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("stud_lms_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  function handleLogin(rawUser) {
    const normalized = normalizeUser(rawUser);
    if (!VALID_ROLES.includes(normalized.role)) {
      throw new Error("Invalid user role returned from server. Please log in again.");
    }
    localStorage.setItem("stud_lms_user", JSON.stringify(normalized));
    setUser(normalized);
    setActivePage("dashboard");
  }

  function logout() {
    localStorage.removeItem("stud_lms_user");
    setUser(null);
    setActivePage("dashboard");
  }

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <MainLayout
      user={user}
      activePage={activePage}
      setActivePage={setActivePage}
      logout={logout}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}

/* ============================================================
   PAGE 1: LOGIN (SPLIT-SCREEN ENTERPRISE EXPERIENCE)
============================================================ */

function Login({ onLogin }) {
  const [role, setRole] = useState("Student");
  const [registerNumber, setRegisterNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [advisorClass, setAdvisorClass] = useState("III Year A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function changeRole(value) {
    setRole(value);
    setRegisterNumber("");
    setEmail("");
    setPassword("");
    setError("");
    if (value === "Advisor") setAdvisorClass("III Year A");
  }

  function useDemo() {
    setError("");

    if (role === "Student") {
      setRegisterNumber(DEMO_STUDENT.register_number);
      setEmail(DEMO_STUDENT.email);
      setPassword(DEMO_STUDENT.password);
      return;
    }

    if (role === "Parent") {
      const roll = registerNumber.trim() || "24025";
      setRegisterNumber(roll);
      const parent = getParentDemoCredentials(roll);
      setEmail(parent.email);
      setPassword(parent.password);
      return;
    }

    if (role === "Advisor") {
      const advisor = ADVISOR_DATA[advisorClass] || ADVISOR_DATA["III Year A"];
      setEmail(advisor.email);
      setPassword(advisor.password);
      return;
    }

    if (role === "HOD") {
      setEmail(DEMO_HOD.email);
      setPassword(DEMO_HOD.password);
      return;
    }

    if (role === "VP") {
      setEmail(DEMO_VP.email);
      setPassword(DEMO_VP.password);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    if ((role === "Student" || role === "Parent") && !registerNumber.trim()) {
      setError(
        role === "Student"
          ? "Please provide your student register number."
          : "Please provide the student's register number."
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        role,
        email: email.trim(),
        password,
        register_number:
          role === "Student" || role === "Parent"
            ? registerNumber.trim()
            : "",
        child_register_number:
          role === "Parent" ? registerNumber.trim() : "",
        class_name: role === "Advisor" ? advisorClass : "",
        year_section: role === "Advisor" ? advisorClass : "",
        section:
          role === "Advisor"
            ? advisorClass.split(" ").pop()
            : "",
      };

      const data = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.success === false) {
        throw new Error(data.message || "Invalid credentials provided.");
      }

      const rawUser = {
        ...(data.data || {}),
        ...(data.user || {}),
        ...data,
        role: data.role || data.user?.role || role,
      };

      onLogin(rawUser);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-split-container">
        {/* Left Side: Enterprise Showcase */}
        <div className="login-showcase-panel">
          <div className="showcase-brand">
            <div className="showcase-logo-icon">
              <GraduationCap size={30} className="text-white" />
            </div>
            <div>
              <h1 className="showcase-brand-title">Stud LMS</h1>
              <span className="showcase-brand-tagline">Academic &amp; Leave Intelligence</span>
            </div>
          </div>

          <div className="showcase-content">
            <div className="showcase-badge">
              <Sparkles size={14} /> Enterprise Academic OS
            </div>
            <h2 className="showcase-headline">
              Smart Student Leave, Attendance &amp; Academic Monitoring
            </h2>
            <p className="showcase-subtext">
              Unified institutional portal connecting students, parents, faculty advisors, HODs, and leadership in real-time.
            </p>

            <div className="showcase-features">
              <div className="showcase-feature-item">
                <div className="showcase-feature-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4>3-Tier Leave Workflow</h4>
                  <p>Multi-stage verification: Advisor &rarr; HOD &rarr; VP</p>
                </div>
              </div>
              <div className="showcase-feature-item">
                <div className="showcase-feature-icon">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h4>Attendance Forecaster</h4>
                  <p>Smart 75% threshold alerts &amp; recovery simulator</p>
                </div>
              </div>
              <div className="showcase-feature-item">
                <div className="showcase-feature-icon">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h4>Exam Calendar Sync</h4>
                  <p>Centralized examination agendas &amp; timelines</p>
                </div>
              </div>
              <div className="showcase-feature-item">
                <div className="showcase-feature-icon">
                  <Zap size={18} />
                </div>
                <div>
                  <h4>Instant SMS &amp; Email</h4>
                  <p>Real-time notifications for guardians &amp; students</p>
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <div className="showcase-stat">
              <span className="showcase-stat-value">99.9%</span>
              <span className="showcase-stat-label">System Uptime</span>
            </div>
            <div className="showcase-stat">
              <span className="showcase-stat-value">500+</span>
              <span className="showcase-stat-label">Active Scholars</span>
            </div>
            <div className="showcase-stat">
              <span className="showcase-stat-value">Instant</span>
              <span className="showcase-stat-label">Audit Reports</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="login-form-panel">
          <div className="login-card-container">
            <div className="login-header">
              <h2>Account Sign In</h2>
              <p>Select your authorized role to access your academic dashboard</p>
            </div>

            <div className="role-tabs-grid">
              {VALID_ROLES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={role === item ? "role-tab-btn active" : "role-tab-btn"}
                  onClick={() => changeRole(item)}
                >
                  {item === "Student" && <GraduationCap size={15} />}
                  {item === "Parent" && <User size={15} />}
                  {item === "Advisor" && <ShieldCheck size={15} />}
                  {item === "HOD" && <Award size={15} />}
                  {item === "VP" && <Layers size={15} />}
                  <span>{item}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {(role === "Student" || role === "Parent") && (
                <div className="form-field-group">
                  <label className="form-label">
                    {role === "Student" ? "Student Register Number" : "Linked Child Register Number"}
                  </label>
                  <div className="form-input-wrapper">
                    <User size={18} className="form-input-icon" />
                    <input
                      className="form-input has-icon"
                      value={registerNumber}
                      onChange={(event) => setRegisterNumber(event.target.value)}
                      placeholder={role === "Student" ? "e.g., 24025" : "e.g., 24025 or 26001"}
                      required
                    />
                  </div>
                </div>
              )}

              {role === "Advisor" && (
                <div className="form-field-group">
                  <label className="form-label">Assigned Class Section</label>
                  <select
                    className="form-select"
                    value={advisorClass}
                    onChange={(event) => {
                      setAdvisorClass(event.target.value);
                      setEmail("");
                      setPassword("");
                      setError("");
                    }}
                  >
                    {Object.keys(ADVISOR_DATA).map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-field-group">
                <label className="form-label">Institutional Email</label>
                <div className="form-input-wrapper">
                  <Mail size={18} className="form-input-icon" />
                  <input
                    type="email"
                    className="form-input has-icon"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@studlms.com"
                    required
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="form-label">Password</label>
                <div className="form-input-wrapper">
                  <Lock size={18} className="form-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input has-icon has-toggle"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    className="form-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert-error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18 }} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button className="btn-demo" type="button" onClick={useDemo}>
                <Sparkles size={16} />
                <span>Fill Demo Credentials ({role})</span>
              </button>
            </form>

            {role === "Parent" && (
              <div className="role-helper-note">
                ðŸ’¡ Tip: Enter child's register number (e.g. 24025), then click "Fill Demo Credentials".
              </div>
            )}
            {role === "Advisor" && (
              <div className="role-helper-note">
                ðŸ’¡ Demo credentials automatically load for the selected class section.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN APPLICATION SHELL & NAVIGATION
============================================================ */

function getMenuForRole(role) {
  const menus = {
    Student: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "apply-leave", label: "Apply Leave", icon: Send },
      { id: "leave-history", label: "Leave History", icon: History },
      { id: "attendance", label: "Attendance", icon: BarChart3 },
      { id: "attendance-analytics", label: "Attendance Analytics", icon: TrendingUp },
      { id: "schedule", label: "Academic Schedule", icon: CalendarDays },
      { id: "performance", label: "Academic Performance", icon: Award },
      { id: "profile", label: "Student Profile", icon: User },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "settings", label: "Settings", icon: SettingsIcon },
      { id: "help", label: "Help & Support", icon: HelpCircle },
    ],
    Parent: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "student-details", label: "Student Details", icon: User },
      { id: "leave-monitoring", label: "Leave Monitoring", icon: History },
      { id: "attendance", label: "Attendance Breakdown", icon: BarChart3 },
      { id: "schedule", label: "Academic Schedule", icon: CalendarDays },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "settings", label: "Settings", icon: SettingsIcon },
      { id: "help", label: "Help & Support", icon: HelpCircle },
    ],
    Advisor: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "students", label: "My Students", icon: Users },
      { id: "leave-requests", label: "Leave Requests", icon: Send },
      { id: "attendance", label: "Attendance Monitoring", icon: BarChart3 },
      { id: "schedule", label: "Exam Schedule", icon: CalendarDays },
      { id: "reports", label: "Reports & Analytics", icon: FileText },
      { id: "settings", label: "Settings", icon: SettingsIcon },
      { id: "help", label: "Help & Support", icon: HelpCircle },
    ],
    HOD: [
      { id: "dashboard", label: "Department Dashboard", icon: LayoutDashboard },
      { id: "students", label: "Department Students", icon: Users },
      { id: "leave-requests", label: "Escalated Requests", icon: Send },
      { id: "attendance", label: "Attendance Reports", icon: BarChart3 },
      { id: "schedule", label: "Exam Schedule", icon: CalendarDays },
      { id: "reports", label: "Reports & Analytics", icon: FileText },
      { id: "settings", label: "Settings", icon: SettingsIcon },
      { id: "help", label: "Help & Support", icon: HelpCircle },
    ],
    VP: [
      { id: "dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
      { id: "students", label: "Campus Directory", icon: Users },
      { id: "leave-requests", label: "Final Approvals", icon: Send },
      { id: "attendance", label: "Campus Attendance", icon: BarChart3 },
      { id: "schedule", label: "Exam Schedule", icon: CalendarDays },
      { id: "reports", label: "Institutional Reports", icon: FileText },
      { id: "settings", label: "Settings", icon: SettingsIcon },
      { id: "help", label: "Help & Support", icon: HelpCircle },
    ],
  };

  return menus[role] || [];
}

function pageTitle(page) {
  const titles = {
    dashboard: "Dashboard",
    "apply-leave": "Apply Leave",
    "leave-history": "Leave History",
    attendance: "Attendance Intelligence",
    "attendance-analytics": "Attendance Analytics & Forecast",
    schedule: "Academic Calendar & Schedules",
    notifications: "Notification Center",
    profile: "Student Profile & Credentials",
    performance: "Academic Performance",
    "student-details": "Linked Student Details",
    "leave-monitoring": "Leave Monitoring",
    students: "Student Directory",
    "leave-requests": "Leave Request Review",
    reports: "Reports & Analytics",
    settings: "System & Theme Settings",
    help: "Help & Institutional Support",
  };
  return titles[page] || "Dashboard";
}

function MainLayout({ user, activePage, setActivePage, logout, theme, toggleTheme }) {
  const role = normalizeRole(user.role);
  const menu = getMenuForRole(role);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="app-shell">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 45,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-wrapper">
            <div className="sidebar-logo-icon">
              <GraduationCap size={24} />
            </div>
            <div className="sidebar-brand-text">
              <h2>Stud LMS</h2>
              <span>Academic Intelligence</span>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              style={{ background: "none", color: "#94A3B8" }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* User Pill */}
        <div className="sidebar-user-card">
          <div className="user-avatar-pill">{getInitials(user.name)}</div>
          <div className="sidebar-user-meta">
            <span className="user-display-name">{user.name}</span>
            <span className="user-role-badge">{role}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav-scroll">
          <div className="sidebar-nav-section-title">Navigation Modules</div>
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Viewport */}
      <div className="main-viewport">
        {/* Header */}
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-trigger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="page-headline-wrap">
              <h2>{pageTitle(activePage)}</h2>
              <span>{todayStr} &bull; Welcome back, {user.name}</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-search-box">
              <Search size={15} className="topbar-search-icon" />
              <input
                type="text"
                placeholder="Quick search... (âŒ˜K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="topbar-search-input"
              />
            </div>

            <button
              className="topbar-icon-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              className="topbar-icon-btn"
              onClick={() => setActivePage("notifications")}
              title="Notifications"
            >
              <Bell size={18} />
              <span className="topbar-badge-dot" />
            </button>

            <button
              className="topbar-avatar-btn"
              onClick={() => setActivePage("profile")}
              title="My Profile"
            >
              <div className="topbar-avatar-img">{getInitials(user.name)}</div>
              <span className="topbar-avatar-name">{user.name.split(" ")[0]}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="page-container">
          <PageRenderer
            user={user}
            page={activePage}
            setActivePage={setActivePage}
            searchQuery={searchQuery}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE ROUTER
============================================================ */

function PageRenderer({ user, page, setActivePage, searchQuery, theme, toggleTheme }) {
  const role = normalizeRole(user.role);

  // Common modules across roles
  if (page === "settings") {
    return <SettingsPage user={user} theme={theme} toggleTheme={toggleTheme} />;
  }
  if (page === "help") {
    return <HelpAndSupport user={user} />;
  }
  if (page === "notifications") {
    return <Notifications user={user} />;
  }
  if (page === "profile") {
    return <StudentProfilePage user={user} />;
  }
  if (page === "schedule") {
    return <AcademicSchedule staff={["Advisor", "HOD", "VP"].includes(role)} />;
  }

  // Student pages
  if (role === "Student") {
    if (page === "dashboard") return <StudentDashboard user={user} setActivePage={setActivePage} />;
    if (page === "apply-leave") return <LeaveApplication user={user} />;
    if (page === "leave-history") return <LeaveHistory user={user} />;
    if (page === "attendance") return <AttendancePage user={user} />;
    if (page === "attendance-analytics") return <AttendanceAnalyticsPage user={user} />;
    if (page === "performance") return <AcademicPerformancePage user={user} />;
  }

  // Parent pages
  if (role === "Parent") {
    if (page === "dashboard") return <ParentDashboard user={user} setActivePage={setActivePage} />;
    if (page === "student-details") return <ParentStudentDetails user={user} />;
    if (page === "leave-monitoring") return <ParentLeaveMonitoring user={user} />;
    if (page === "attendance") return <AttendancePage user={{ ...user, id: user.student?.id || user.student_id }} />;
  }

  // Staff pages (Advisor, HOD, VP)
  if (["Advisor", "HOD", "VP"].includes(role)) {
    if (page === "dashboard") return <StaffDashboard user={user} setActivePage={setActivePage} />;
    if (page === "students") return <StudentDirectory user={user} externalSearch={searchQuery} />;
    if (page === "leave-requests") return <StaffLeaveRequests user={user} />;
    if (page === "attendance") return <StaffAttendance user={user} />;
    if (page === "reports") return <Reports user={user} />;
  }

  return (
    <EmptyState
      title="Page Not Found"
      text={`Role: ${role || "Unknown"} | Requested: ${page}`}
    />
  );
}

/* ============================================================
   PAGE 2: STUDENT DASHBOARD
============================================================ */

function StudentDashboard({ user, setActivePage }) {
  const [student, setStudent] = useState(user);
  const [leaves, setLeaves] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);

  const load = useCallback(async () => {
    const id = user.id || user.student_id;
    if (!id) return;

    try {
      const [profileRes, leavesRes, attendanceRes] = await Promise.allSettled([
        apiFetch(`/student/${id}`),
        apiFetch(`/student/${id}/leaves`),
        apiFetch(`/student/${id}/attendance-analysis`),
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
    } catch (error) {
      console.error("Student dashboard:", error);
    }
  }, [user.id, user.student_id]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = leaves.filter((l) => !isFinished(l)).length;
  const approvedCount = leaves.filter((l) => getLeaveStatus(l) === "Approved").length;
  const attendanceVal = Number(attendanceData?.attendance ?? student.attendance ?? 0);

  return (
    <>
      {/* Welcome Hero */}
      <div className="hero-card">
        <div>
          <span className="hero-eyebrow">SCHOLAR PORTAL</span>
          <h1>Welcome, {student.name}</h1>
          <p>
            Department of CSE - AIML &bull; Register No: <strong>{student.register_number || "-"}</strong> &bull; Class: <strong>{student.year} {student.section}</strong>
          </p>
        </div>
        <div className="hero-avatar-box">
          <GraduationCap size={36} />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stats-grid">
        <StatCard
          label="Overall Attendance"
          value={`${attendanceVal}%`}
          icon={BarChart3}
          pillText={attendanceVal >= 75 ? "Safe Threshold" : "Attention Required"}
          pillType={attendanceVal >= 75 ? "success" : "danger"}
          iconVariant={attendanceVal >= 75 ? "success" : "danger"}
        />
        <StatCard
          label="Active Leave Requests"
          value={pendingCount}
          icon={Clock}
          pillText={pendingCount > 0 ? "Under Review" : "No Pending"}
          pillType={pendingCount > 0 ? "warning" : "neutral"}
          iconVariant={pendingCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Approved Leaves"
          value={approvedCount}
          icon={CheckCircle2}
          pillText="Verified"
          pillType="success"
          iconVariant="success"
        />
        <StatCard
          label="Current Semester"
          value={student.year || "Semester 6"}
          icon={CalendarDays}
          pillText="Academic 2026"
          pillType="neutral"
        />
      </div>

      {/* Attendance & Alert Highlight */}
      <div className="attendance-card">
        <RadialGauge percentage={attendanceVal} />
        <div className="attendance-info-side">
          <div className="attendance-status-header">
            <h2>{attendanceVal >= 75 ? "Attendance Status: On Track" : "Attendance Shortage Alert"}</h2>
            <StatusBadge status={attendanceVal >= 75 ? "Safe" : "Needs Improvement"} />
          </div>
          <p className="attendance-target-desc">
            Institutional minimum target is <strong>75%</strong>. Current standing: {attendanceVal}%.
          </p>

          <div className="attendance-metrics-grid">
            <div className="attendance-metric-item">
              <span>Total Classes</span>
              <strong>{attendanceData?.total_classes ?? 100}</strong>
            </div>
            <div className="attendance-metric-item">
              <span>Attended</span>
              <strong>{attendanceData?.attended_classes ?? Math.round((attendanceVal / 100) * 100)}</strong>
            </div>
            <div className="attendance-metric-item">
              <span>Missed</span>
              <strong>{attendanceData?.missed_classes ?? (100 - Math.round((attendanceVal / 100) * 100))}</strong>
            </div>
            <div className="attendance-metric-item">
              <span>Classes / Day</span>
              <strong>{attendanceData?.classes_per_day ?? 6}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-subtitle">Common academic self-service workflows</p>
        </div>
      </div>

      <div className="action-grid">
        <ActionCard
          title="Apply Leave"
          text="Submit a leave or on-duty request to your assigned faculty advisor."
          icon={Send}
          onClick={() => setActivePage("apply-leave")}
        />
        <ActionCard
          title="Leave History"
          text="Track 3-tier approval stages and download approved leaves."
          icon={History}
          onClick={() => setActivePage("leave-history")}
        />
        <ActionCard
          title="Attendance Intelligence"
          text="Inspect subject breakdown and calculate needed recovery classes."
          icon={BarChart3}
          onClick={() => setActivePage("attendance")}
        />
        <ActionCard
          title="Academic Calendar"
          text="View semester exam timetables and institutional events."
          icon={CalendarDays}
          onClick={() => setActivePage("schedule")}
        />
      </div>
    </>
  );
}

/* ============================================================
   PAGE 3: APPLY LEAVE
============================================================ */

function LeaveApplication({ user }) {
  const [leaveType, setLeaveType] = useState("Medical Leave");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [proof, setProof] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const studentId = user.id || user.student_id;

  const dayCount = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (end < start) return 0;
    const diff = Math.abs(end - start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [fromDate, toDate]);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!studentId) {
      setError("Student ID is missing. Please log out and sign in again.");
      return;
    }

    if (!fromDate || !toDate || !reason.trim()) {
      setError("Please provide all required dates and a valid reason.");
      return;
    }

    if (toDate < fromDate) {
      setError("End date cannot be prior to start date.");
      return;
    }

    try {
      setLoading(true);

      const result = await apiFetch(`/student/${studentId}/leave`, {
        method: "POST",
        body: JSON.stringify({
          leave_type: leaveType,
          from_date: fromDate,
          to_date: toDate,
          reason: reason.trim(),
        }),
      });

      let successMessage = result.message || "Leave application submitted successfully.";

      if (proof && result.id) {
        const formData = new FormData();
        formData.append("file", proof);

        try {
          await apiFetch(`/leave/${result.id}/proof`, {
            method: "POST",
            body: formData,
          });
          successMessage += " Supporting document attached successfully.";
        } catch (proofError) {
          successMessage += ` (Note: Proof upload encountered an issue: ${proofError.message})`;
        }
      }

      setMessage(successMessage);
      setFromDate("");
      setToDate("");
      setReason("");
      setProof(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-card">
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Apply For Leave / On-Duty</h2>
          <p className="section-subtitle">
            Applications are automatically routed to your Class Advisor &bull; HOD &bull; VP
          </p>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="form-grid-3">
          <div className="form-field-group">
            <label className="form-label">Leave Category</label>
            <select
              className="form-select"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
            >
              <option value="Medical Leave">Medical Leave (Doctor Certificate)</option>
              <option value="Emergency Leave">Emergency Leave</option>
              <option value="On Duty Leave">On Duty Leave (Symposium/Hackathon)</option>
              <option value="Personal Leave">Personal Leave</option>
              <option value="Planned Leave">Planned Family Leave</option>
            </select>
          </div>

          <div className="form-field-group">
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
            />
          </div>

          <div className="form-field-group">
            <label className="form-label">
              <span>To Date</span>
              {dayCount > 0 && (
                <span className="stat-pill neutral">
                  Duration: {dayCount} {dayCount === 1 ? "day" : "days"}
                </span>
              )}
            </label>
            <input
              type="date"
              className="form-input"
              min={fromDate || undefined}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-field-group">
          <label className="form-label">Reason for Absence</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="State comprehensive academic or medical reason..."
            required
          />
        </div>

        <div className="form-field-group">
          <label className="form-label">Supporting Document (PDF, PNG, JPG - Max 5MB)</label>
          <div className="file-upload-dropzone">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              onChange={(e) => setProof(e.target.files?.[0] || null)}
            />
            <div className="file-upload-icon">
              <UploadCloud size={24} />
            </div>
            <strong style={{ display: "block", color: "var(--text-primary)", fontSize: 13 }}>
              {proof ? proof.name : "Click or drag medical certificate / OD letter here"}
            </strong>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {proof ? `${(proof.size / 1024).toFixed(1)} KB selected` : "Supports PDF, JPEG, PNG"}
            </span>
          </div>

          {proof && (
            <div className="file-preview-card">
              <span style={{ fontSize: 13, fontWeight: 600 }}>ðŸ“„ {proof.name}</span>
              <button
                type="button"
                onClick={() => setProof(null)}
                style={{ background: "none", color: "var(--danger)" }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {leaveType === "Emergency Leave" && (
          <div className="threshold-alert-banner warning">
            <AlertTriangle size={20} />
            <span>Emergency leave must be followed up with supporting documentary proof within 48 hours of campus resumption.</span>
          </div>
        )}

        {message && (
          <div className="alert-success">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={loading} style={{ maxWidth: 280 }}>
          {loading ? "Submitting Application..." : "Submit Leave Request"}
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   PAGE 4: LEAVE HISTORY
============================================================ */

function LeaveHistory({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLeave, setSelectedLeave] = useState(null);

  const load = useCallback(async () => {
    const id = user.id || user.student_id;
    if (!id) return;

    try {
      setError("");
      const data = await apiFetch(`/student/${id}/leaves`);
      setLeaves(asArray(data));
    } catch (err) {
      setError(err.message);
    }
  }, [user.id, user.student_id]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((item) => {
      const status = getLeaveStatus(item).toLowerCase();
      const matchSearch =
        !search ||
        (item.leave_type || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.reason || "").toLowerCase().includes(search.toLowerCase());

      if (statusFilter === "all") return matchSearch;
      if (statusFilter === "approved") return matchSearch && status.includes("approved");
      if (statusFilter === "pending") return matchSearch && status.includes("pending");
      if (statusFilter === "rejected") return matchSearch && status.includes("reject");
      return matchSearch;
    });
  }, [leaves, search, statusFilter]);

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Leave History &amp; Workflow Status</h2>
          <p className="section-subtitle">Real-time status across Advisor, HOD, and VP approval stages</p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-bar">
          <div className="topbar-search-box" style={{ width: 260 }}>
            <Search size={15} className="topbar-search-icon" />
            <input
              type="text"
              className="table-search-input"
              placeholder="Filter by reason or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {["all", "approved", "pending", "rejected"].map((st) => (
              <button
                key={st}
                className={`stat-pill ${statusFilter === st ? "neutral" : ""}`}
                style={{
                  background: statusFilter === st ? "var(--indigo)" : "var(--bg-muted)",
                  color: statusFilter === st ? "#fff" : "var(--text-secondary)",
                  textTransform: "capitalize",
                }}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <EmptyState title="Unable to retrieve leaves" text={error} />
        ) : filteredLeaves.length === 0 ? (
          <EmptyState title="No leave applications found" text="No records match your selected filter criteria." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Date Span</th>
                  <th>Reason</th>
                  <th>Workflow Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => {
                  const status = getLeaveStatus(leave);
                  return (
                    <tr key={leave.id}>
                      <td>
                        <strong>{leave.leave_type || "Leave"}</strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{leave.from_date}</span> &rarr;{" "}
                        <span style={{ fontWeight: 600 }}>{leave.to_date}</span>
                      </td>
                      <td style={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {leave.reason || "-"}
                      </td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                      <td>
                        <button
                          className="stat-pill neutral"
                          style={{ cursor: "pointer", background: "var(--indigo-light)", color: "var(--indigo)" }}
                          onClick={() => setSelectedLeave(leave)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLeave && (
        <div className="modal-backdrop" onClick={() => setSelectedLeave(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedLeave(null)}>
              <X size={18} />
            </button>
            <span className="hero-eyebrow">APPLICATION DETAILS</span>
            <h2 style={{ margin: "8px 0 4px 0", color: "var(--text-primary)" }}>{selectedLeave.leave_type}</h2>
            <p style={{ margin: "0 0 20px 0", color: "var(--text-muted)", fontSize: 13 }}>
              {selectedLeave.from_date} &rarr; {selectedLeave.to_date}
            </p>

            <div className="profile-grid" style={{ marginBottom: 20 }}>
              <div className="info-item">
                <span>Overall Status</span>
                <StatusBadge status={getLeaveStatus(selectedLeave)} />
              </div>
              <div className="info-item">
                <span>Advisor Stage</span>
                <StatusBadge status={selectedLeave.advisor_status || "Pending"} />
              </div>
              <div className="info-item">
                <span>HOD Stage</span>
                <StatusBadge status={selectedLeave.hod_status || "Pending"} />
              </div>
              <div className="info-item">
                <span>VP Stage</span>
                <StatusBadge status={selectedLeave.vp_status || "Pending"} />
              </div>
            </div>

            <div className="info-item" style={{ marginBottom: 16 }}>
              <span>Reason</span>
              <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>{selectedLeave.reason || "-"}</p>
            </div>

            {selectedLeave.proof_file && (
              <div className="threshold-alert-banner safe" style={{ padding: "10px 14px", fontSize: 13 }}>
                <FileCheck size={18} />
                <span>Supporting proof file registered: {selectedLeave.proof_file}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   PAGE 5: ATTENDANCE
============================================================ */

function AttendancePage({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const id = user.id || user.student_id;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError("");
      const result = await apiFetch(`/student/${id}/attendance-analysis`);
      setData(result);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <EmptyState title="Attendance Unavailable" text={error} />;
  if (!data) return <div className="loading-container"><div className="spinner" /> Fetching academic records...</div>;

  const attendance = Number(data.attendance || 0);
  const target = Number(data.target || 75);
  const totalClasses = Number(data.total_classes || 100);
  const attendedClasses = Number(data.attended_classes || Math.round((attendance / 100) * totalClasses));

  // Classes needed to reach target if below
  const neededClasses =
    attendance < target
      ? Math.ceil((target * totalClasses - 100 * attendedClasses) / (100 - target))
      : 0;

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Attendance Intelligence &amp; Thresholds</h2>
          <p className="section-subtitle">Real-time attendance analysis mapped to statutory norms</p>
        </div>
      </div>

      {attendance < target ? (
        <div className="threshold-alert-banner danger">
          <AlertTriangle size={24} />
          <div>
            <strong>Attendance Warning: Shortage Below {target}% Minimum</strong>
            <p style={{ margin: "2px 0 0 0", fontSize: 13 }}>
              You need to attend approximately <strong>{neededClasses > 0 ? neededClasses : 5} consecutive classes</strong> to restore your attendance to the safe {target}% threshold.
            </p>
          </div>
        </div>
      ) : (
        <div className="threshold-alert-banner safe">
          <CheckCircle2 size={24} />
          <div>
            <strong>Attendance Standing: Fully Compliant ({attendance}%)</strong>
            <p style={{ margin: "2px 0 0 0", fontSize: 13 }}>
              Your attendance satisfies institutional and university hall ticket eligibility requirements.
            </p>
          </div>
        </div>
      )}

      <div className="attendance-card">
        <RadialGauge percentage={attendance} />
        <div className="attendance-info-side">
          <div className="attendance-status-header">
            <h2>{data.risk || (attendance >= 75 ? "Safe Standing" : "Attendance Under Review")}</h2>
            <StatusBadge status={attendance >= 75 ? "Safe" : "Needs Improvement"} />
          </div>
          <p className="attendance-target-desc">
            Governing regulation: Anna University / AICTE minimum requirement is {target}%.
          </p>

          <div className="attendance-metrics-grid">
            <div className="attendance-metric-item">
              <span>Total Classes</span>
              <strong>{totalClasses}</strong>
            </div>
            <div className="attendance-metric-item">
              <span>Classes Attended</span>
              <strong>{attendedClasses}</strong>
            </div>
            <div className="attendance-metric-item">
              <span>Classes Missed</span>
              <strong>{data.missed_classes ?? (totalClasses - attendedClasses)}</strong>
            </div>
            <div className="attendance-metric-item">
              <span>Daily Class Load</span>
              <strong>{data.classes_per_day ?? 6}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Subject breakdown table if subjects array exists or synthesized from actual data */}
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Subject-Wise Breakdown</h2>
          <p className="section-subtitle">Academic monitoring across course modules</p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Course Code</th>
                <th>Total Classes</th>
                <th>Attended</th>
                <th>Percentage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Deep Learning & Neural Networks", code: "CS801", total: 24, attended: Math.round(24 * (attendance / 100)) },
                { name: "Natural Language Processing", code: "CS802", total: 22, attended: Math.round(22 * ((attendance + 2) / 100)) },
                { name: "Cloud Computing Architectures", code: "CS803", total: 20, attended: Math.round(20 * (attendance / 100)) },
                { name: "Full Stack Development Lab", code: "CS804", total: 18, attended: Math.round(18 * ((attendance - 2) / 100)) },
                { name: "Professional Ethics & Governance", code: "GE805", total: 16, attended: Math.round(16 * (attendance / 100)) },
              ].map((sub) => {
                const pct = Math.min(100, Math.max(0, Math.round((sub.attended / sub.total) * 100)));
                return (
                  <tr key={sub.code}>
                    <td><strong>{sub.name}</strong></td>
                    <td><span className="stat-pill neutral">{sub.code}</span></td>
                    <td>{sub.total}</td>
                    <td>{sub.attended}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, height: 6, background: "var(--bg-muted)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: pct >= 75 ? "var(--success)" : "var(--danger)" }} />
                        </div>
                        <strong style={{ fontSize: 12 }}>{pct}%</strong>
                      </div>
                    </td>
                    <td><StatusBadge status={pct >= 75 ? "Safe" : "Needs Improvement"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   PAGE 6: ACADEMIC SCHEDULE
============================================================ */

function AcademicSchedule({ staff = false }) {
  const [exams, setExams] = useState([]);
  const [name, setName] = useState("End Semester Theory Examination");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await apiFetch("/exams");
      setExams(asArray(data));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addExam(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!fromDate || !toDate) {
      setError("Please select both start and conclusion dates.");
      return;
    }

    if (toDate < fromDate) {
      setError("Conclusion date cannot be prior to start date.");
      return;
    }

    try {
      await apiFetch("/exams", {
        method: "POST",
        body: JSON.stringify({
          exam_name: name || "Semester Examination",
          exam_from_date: fromDate,
          exam_to_date: toDate,
        }),
      });

      setMessage("Examination schedule successfully registered.");
      setFromDate("");
      setToDate("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteExam(id) {
    try {
      await apiFetch(`/exams/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">{staff ? "Exam Schedule Management" : "Academic Schedule & Calendar"}</h2>
          <p className="section-subtitle">Official semester timeline, assessment agendas and exams</p>
        </div>
      </div>

      {staff && (
        <div className="form-card" style={{ marginBottom: 28 }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16 }}>Schedule New Examination Window</h3>
          <form onSubmit={addExam} className="form-grid-3">
            <div className="form-field-group">
              <label className="form-label">Examination Title</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Model Practical Exam"
                required
              />
            </div>
            <div className="form-field-group">
              <label className="form-label">Commencement Date</label>
              <input
                type="date"
                className="form-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
            </div>
            <div className="form-field-group">
              <label className="form-label">Conclusion Date</label>
              <input
                type="date"
                min={fromDate || undefined}
                className="form-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                required
              />
            </div>
          </form>

          {message && <div className="alert-success">{message}</div>}
          {error && <div className="alert-error">{error}</div>}

          <button className="btn-primary" type="button" onClick={addExam} style={{ maxWidth: 220 }}>
            Register Schedule
          </button>
        </div>
      )}

      <div className="schedule-grid">
        {exams.length > 0 ? (
          exams.map((exam) => (
            <div className="exam-card" key={exam.id}>
              <div className="exam-card-icon">
                <CalendarDays size={22} />
              </div>
              <div className="exam-card-body">
                <h3>{exam.exam_name || "Semester Examination"}</h3>
                <p className="exam-card-dates">
                  {exam.exam_from_date} &rarr; {exam.exam_to_date}
                </p>
                <span className="exam-days-tag">Academic Examination</span>
              </div>
              {staff && (
                <button
                  onClick={() => deleteExam(exam.id)}
                  style={{ background: "none", color: "var(--danger)", padding: 4 }}
                  title="Delete schedule"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        ) : (
          <EmptyState
            title="No Examinations Scheduled"
            text="Official examination schedules will appear here once published by the Controller of Examinations."
          />
        )}
      </div>
    </>
  );
}

/* ============================================================
   PAGE 7: NOTIFICATIONS
============================================================ */

function Notifications({ user }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const role = normalizeRole(user.role);

      const path =
        role === "Parent"
          ? `/parent/${encodeURIComponent(user.email)}/notifications`
          : `/student/${user.id || user.student_id}/notifications`;

      const data = await apiFetch(path);
      setItems(asArray(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.email, user.id, user.student_id, user.role]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Notification Center</h2>
          <p className="section-subtitle">Real-time alerts, attendance milestones, and approval updates</p>
        </div>
        {items.length > 0 && (
          <span className="stat-pill neutral">{items.length} notifications</span>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container"><div className="spinner" /> Loading notifications...</div>
      ) : items.length ? (
        <div className="notification-list">
          {items.map((item) => (
            <div className="notification-card" key={item.id}>
              <div className="notification-icon-box">
                <Bell size={18} />
              </div>
              <div className="notification-content">
                <p>{item.message}</p>
                <small>{item.created_at || "Recent dispatch"}</small>
              </div>
              <span className="stat-pill success">Delivered</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="You're all caught up" text="No pending or unread notifications at this time." />
      )}
    </>
  );
}

/* ============================================================
   PAGE 8: PROFILE (STUDENT PROFILE & CREDENTIALS)
============================================================ */

function StudentProfilePage({ user }) {
  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Academic Profile &amp; Identity</h2>
          <p className="section-subtitle">Verified institutional credentials and mentor allocation</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-big">{getInitials(user.name)}</div>
        <div className="profile-main-info">
          <h2>{user.name}</h2>
          <p className="profile-reg-number">Register No: <strong>{user.register_number || "24025"}</strong> &bull; Status: Active Scholar</p>

          <div className="profile-grid">
            <div className="info-item">
              <span>Department</span>
              <strong>CSE - Artificial Intelligence &amp; ML</strong>
            </div>
            <div className="info-item">
              <span>Academic Year</span>
              <strong>{user.year || "III Year"}</strong>
            </div>
            <div className="info-item">
              <span>Section</span>
              <strong>Section {user.section || "A"}</strong>
            </div>
            <div className="info-item">
              <span>Email</span>
              <strong>{user.email || "student@studlms.com"}</strong>
            </div>
            <div className="info-item">
              <span>Assigned Faculty Advisor</span>
              <strong>Ms. K. Anusuya (AP/CSE)</strong>
            </div>
            <div className="info-item">
              <span>Head of Department</span>
              <strong>Dr. Kumar (Professor &amp; Head)</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="action-grid" style={{ marginTop: 24 }}>
        <div className="stat-card">
          <span className="stat-card-label">Degree Pathway</span>
          <strong style={{ fontSize: 16, marginTop: 4 }}>B.Tech Computer Science &amp; Engineering</strong>
          <span className="stat-subtext" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Curriculum 2022 Regulation</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Institutional Status</span>
          <strong style={{ fontSize: 16, marginTop: 4 }}>Enrolled &bull; Good Standing</strong>
          <span className="stat-subtext" style={{ fontSize: 12, color: "var(--success)", marginTop: 4 }}>Zero disciplinary infractions</span>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   PAGE 9: ACADEMIC PERFORMANCE
============================================================ */

function AcademicPerformancePage({ user }) {
  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Academic Performance &amp; CGPA</h2>
          <p className="section-subtitle">Continuous internal assessments and semester grade points</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Cumulative GPA (CGPA)"
          value="8.42"
          icon={Award}
          pillText="First Class with Distinction"
          pillType="success"
          iconVariant="success"
        />
        <StatCard
          label="Completed Credits"
          value="112 / 160"
          icon={BookOpen}
          pillText="70% Completed"
          pillType="neutral"
        />
        <StatCard
          label="Current SGPA (Sem 5)"
          value="8.60"
          icon={TrendingUp}
          pillText="+0.18 vs Prev"
          pillType="success"
          iconVariant="success"
        />
        <StatCard
          label="Standing Arrears"
          value="0"
          icon={CheckCircle2}
          pillText="Clear Academic Record"
          pillType="success"
          iconVariant="success"
        />
      </div>

      <div className="table-card">
        <div className="table-header-bar">
          <strong style={{ fontSize: 14 }}>Continuous Internal Assessment (CIA) - Current Term</strong>
          <span className="stat-pill success">Provisional Results</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Course Name</th>
                <th>Internal 1</th>
                <th>Internal 2</th>
                <th>Model Exam</th>
                <th>Calculated Grade</th>
              </tr>
            </thead>
            <tbody>
              {[
                { code: "CS801", name: "Deep Learning & Neural Networks", i1: "48/50", i2: "46/50", model: "92/100", grade: "O (Outstanding)" },
                { code: "CS802", name: "Natural Language Processing", i1: "45/50", i2: "47/50", model: "88/100", grade: "A+ (Excellent)" },
                { code: "CS803", name: "Cloud Computing Architectures", i1: "44/50", i2: "45/50", model: "86/100", grade: "A+ (Excellent)" },
                { code: "CS804", name: "Full Stack Development Lab", i1: "50/50", i2: "48/50", model: "96/100", grade: "O (Outstanding)" },
                { code: "GE805", name: "Professional Ethics & Governance", i1: "42/50", i2: "44/50", model: "84/100", grade: "A (Very Good)" },
              ].map((row) => (
                <tr key={row.code}>
                  <td><span className="stat-pill neutral">{row.code}</span></td>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.i1}</td>
                  <td>{row.i2}</td>
                  <td>{row.model}</td>
                  <td><span className="stat-pill success">{row.grade}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   PAGE 10: ATTENDANCE ANALYTICS & SIMULATOR
============================================================ */

function AttendanceAnalyticsPage({ user }) {
  const [data, setData] = useState(null);
  const [futureMissed, setFutureMissed] = useState(0);
  const [futureAttended, setFutureAttended] = useState(5);

  const id = user.id || user.student_id;

  useEffect(() => {
    if (!id) return;
    apiFetch(`/student/${id}/attendance-analysis`)
      .then(setData)
      .catch(console.error);
  }, [id]);

  const currentAttended = Number(data?.attended_classes ?? 82);
  const currentTotal = Number(data?.total_classes ?? 100);

  // Simulation:
  const simAttended = currentAttended + futureAttended;
  const simTotal = currentTotal + futureAttended + futureMissed;
  const simPct = Math.round((simAttended / simTotal) * 100);

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Attendance Analytics &amp; Risk Simulator</h2>
          <p className="section-subtitle">Predictive models to maintain statutory 75% examination compliance</p>
        </div>
      </div>

      <div className="simulator-card">
        <div className="simulator-header">
          <Zap size={22} color="var(--indigo)" />
          <h3>Interactive Attendance Forecaster</h3>
        </div>
        <p style={{ margin: "0 0 20px 0", fontSize: 13, color: "var(--text-muted)" }}>
          Simulate how attending or missing forthcoming classes directly impacts your final semester percentage.
        </p>

        <div className="simulator-controls">
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8 }}>
              Upcoming Classes You Plan to Attend: <strong>{futureAttended} classes</strong>
            </label>
            <input
              type="range"
              min="0"
              max="30"
              value={futureAttended}
              onChange={(e) => setFutureAttended(Number(e.target.value))}
              className="simulator-slider"
            />

            <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginTop: 16, marginBottom: 8 }}>
              Upcoming Classes You Plan to Miss: <strong>{futureMissed} classes</strong>
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={futureMissed}
              onChange={(e) => setFutureMissed(Number(e.target.value))}
              className="simulator-slider"
            />
          </div>

          <div className="simulator-result-box">
            <span>Projected Attendance Percentage</span>
            <strong style={{ color: simPct >= 75 ? "var(--success)" : "var(--danger)" }}>
              {simPct}%
            </strong>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, display: "block" }}>
              {simPct >= 75 ? "âœ… Eligible for Semester Exams" : "âš ï¸ Hall Ticket Withheld Threshold"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   PAGE 11: SETTINGS
============================================================ */

function SettingsPage({ user, theme, toggleTheme }) {
  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Settings &amp; Preferences</h2>
          <p className="section-subtitle">Configure theme appearance, notification channels, and session security</p>
        </div>
      </div>

      <div className="form-card">
        <h3 style={{ margin: "0 0 16px 0", fontSize: 16 }}>Interface Appearance</h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border-color)" }}>
          <div>
            <strong style={{ display: "block", fontSize: 14 }}>Theme Mode</strong>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Currently set to {theme === "dark" ? "Midnight Dark" : "Enterprise Light"}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="btn-demo"
            style={{ width: "auto", padding: "8px 18px", marginTop: 0 }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>Switch to {theme === "dark" ? "Light" : "Dark"} Mode</span>
          </button>
        </div>

        <h3 style={{ margin: "24px 0 16px 0", fontSize: 16 }}>Security &amp; Account</h3>
        <div className="profile-grid">
          <div className="info-item">
            <span>Logged User</span>
            <strong>{user.name}</strong>
          </div>
          <div className="info-item">
            <span>Institutional Email</span>
            <strong>{user.email || "student@studlms.com"}</strong>
          </div>
          <div className="info-item">
            <span>Authorization Role</span>
            <strong>{user.role}</strong>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   PAGE 12: HELP & SUPPORT
============================================================ */

function HelpAndSupport() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "What is the mandatory minimum attendance percentage for semester exams?",
      a: "According to statutory university regulations, every student must maintain a minimum of 75% overall attendance. Students with attendance between 65% and 74% are eligible only under valid medical condonation approved by the HOD and Vice Principal.",
    },
    {
      q: "How does the multi-stage leave approval workflow function?",
      a: "1) Submitted leave requests first reach your assigned Class Faculty Advisor for initial review. 2) Once recommended, it progresses to the Department HOD. 3) Upon HOD endorsement, the Vice Principal provides final executive approval.",
    },
    {
      q: "How do I apply for On-Duty (OD) attendance for hackathons or symposiums?",
      a: "Select 'On Duty Leave' in the Apply Leave portal, specify the event dates, and upload the official invitation letter or participant certificate under supporting proof. Ensure submission at least 24 hours prior to the event.",
    },
    {
      q: "What medical certificate is required for Medical Leave?",
      a: "Any medical leave exceeding 2 consecutive days requires an authorized medical practitioner certificate with registration number and diagnosis, uploaded during leave application.",
    },
  ];

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Help Desk &amp; Institutional Guidelines</h2>
          <p className="section-subtitle">Frequently asked questions, administrative procedures, and support directory</p>
        </div>
      </div>

      <div className="faq-list">
        {faqs.map((faq, idx) => (
          <div className="faq-item" key={idx}>
            <button
              className="faq-question-btn"
              onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
            >
              <span>{faq.q}</span>
              {openIndex === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {openIndex === idx && <div className="faq-answer">{faq.a}</div>}
          </div>
        ))}
      </div>

      <div className="action-grid" style={{ marginTop: 24 }}>
        <div className="stat-card">
          <span className="stat-card-label">Class Advisor Desk</span>
          <strong style={{ fontSize: 15, marginTop: 4 }}>Ms. K. Anusuya (AP/CSE)</strong>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Cabin 304, Academic Block A &bull; anusuya.advisor@gmail.com</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Head of Department Desk</span>
          <strong style={{ fontSize: 15, marginTop: 4 }}>Dr. Kumar, Ph.D.</strong>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>HOD Chamber, CSE Block &bull; kumar.hod@gmail.com</span>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   PARENT EXPERIENCES
============================================================ */

function ParentDashboard({ user, setActivePage }) {
  const [student, setStudent] = useState(user.student || null);
  const [leaves, setLeaves] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/parent/${encodeURIComponent(user.email)}/student`);
      setStudent(data);

      const studentId = data?.id || data?.student_id;
      if (studentId) {
        const leaveData = await apiFetch(`/parent/${encodeURIComponent(user.email)}/leaves`);
        setLeaves(asArray(leaveData));
      }
    } catch (error) {
      console.error("Parent dashboard:", error);
    }
  }, [user.email]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = leaves.filter((leave) => !isFinished(leave)).length;
  const attendanceVal = Number(student?.attendance ?? 0);

  return (
    <>
      <div className="hero-card">
        <div>
          <span className="hero-eyebrow">PARENT PORTAL</span>
          <h1>Welcome, Guardian {user.name}</h1>
          <p>
            Linked Student: <strong>{student ? student.name : "Loading student..."}</strong> &bull; Register No: <strong>{student?.register_number || "-"}</strong>
          </p>
        </div>
        <div className="hero-avatar-box">
          <User size={36} />
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Student Attendance"
          value={`${attendanceVal}%`}
          icon={BarChart3}
          pillText={attendanceVal >= 75 ? "Safe" : "Low Attendance"}
          pillType={attendanceVal >= 75 ? "success" : "danger"}
          iconVariant={attendanceVal >= 75 ? "success" : "danger"}
        />
        <StatCard
          label="Class &amp; Section"
          value={student ? `${student.year || ""} ${student.section || ""}`.trim() : "-"}
          icon={CalendarDays}
          pillText="Enrolled"
          pillType="neutral"
        />
        <StatCard
          label="Total Leave Applications"
          value={leaves.length}
          icon={History}
          pillText="History"
          pillType="neutral"
        />
        <StatCard
          label="Pending Approvals"
          value={pending}
          icon={Clock}
          pillText={pending > 0 ? "Under Review" : "Clear"}
          pillType={pending > 0 ? "warning" : "success"}
          iconVariant={pending > 0 ? "warning" : "success"}
        />
      </div>

      <div className="action-grid">
        <ActionCard
          title="Student Details"
          text="Inspect comprehensive academic credentials and mentor details."
          icon={User}
          onClick={() => setActivePage("student-details")}
        />
        <ActionCard
          title="Leave Monitoring"
          text="Track real-time multi-stage approval statuses."
          icon={History}
          onClick={() => setActivePage("leave-monitoring")}
        />
      </div>
    </>
  );
}

function ParentStudentDetails({ user }) {
  const [student, setStudent] = useState(user.student || null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/parent/${encodeURIComponent(user.email)}/student`)
      .then(setStudent)
      .catch((err) => setError(err.message));
  }, [user.email]);

  if (error) return <EmptyState title="Unable to retrieve student profile" text={error} />;
  if (!student) return <div className="loading-container"><div className="spinner" /> Loading student details...</div>;

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Linked Ward Details</h2>
          <p className="section-subtitle">Verified institutional registration and academic status</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-big">{getInitials(student.name)}</div>
        <div className="profile-main-info">
          <h2>{student.name}</h2>
          <p className="profile-reg-number">Register No: <strong>{student.register_number}</strong></p>
          <div className="profile-grid">
            <div className="info-item">
              <span>Department</span>
              <strong>{student.department || "CSE - AIML"}</strong>
            </div>
            <div className="info-item">
              <span>Year</span>
              <strong>{student.year}</strong>
            </div>
            <div className="info-item">
              <span>Section</span>
              <strong>{student.section}</strong>
            </div>
            <div className="info-item">
              <span>Current Attendance</span>
              <strong>{student.attendance ?? 0}%</strong>
            </div>
            <div className="info-item">
              <span>Student Email</span>
              <strong>{student.email}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ParentLeaveMonitoring({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/parent/${encodeURIComponent(user.email)}/leaves`)
      .then((data) => setLeaves(asArray(data)))
      .catch((err) => setError(err.message));
  }, [user.email]);

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Ward Leave Monitoring</h2>
          <p className="section-subtitle">Official records of all leave and on-duty requests submitted by the student</p>
        </div>
      </div>

      {error ? (
        <EmptyState title="Unable to load leave records" text={error} />
      ) : (
        <LeaveTable leaves={leaves} />
      )}
    </>
  );
}

/* ============================================================
   STAFF EXPERIENCES (ADVISOR, HOD, VP)
============================================================ */

function StaffDashboard({ user, setActivePage }) {
  const [stats, setStats] = useState({});
  const [students, setStudents] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState("");
  const role = normalizeRole(user.role);

  const load = useCallback(async () => {
    try {
      setError("");

      const statsResult = await apiFetch("/statistics");
      setStats(statsResult || {});

      const studentPath =
        role === "Advisor"
          ? `/advisor/${encodeURIComponent(user.email)}/students`
          : "/students";

      const studentResult = await apiFetch(studentPath);
      setStudents(asArray(studentResult));

      let leavePath;
      if (role === "Advisor") {
        leavePath = `/leaves?advisor_email=${encodeURIComponent(user.email)}`;
      } else if (role === "HOD") {
        leavePath = "/hod/leaves";
      } else {
        leavePath = "/vp/leaves";
      }

      const leaveResult = await apiFetch(leavePath);
      setLeaves(asArray(leaveResult));
    } catch (err) {
      setError(err.message);
    }
  }, [role, user.email]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingAtStage = leaves.filter((l) => !isFinished(l)).length;

  return (
    <>
      <div className="hero-card">
        <div>
          <span className="hero-eyebrow">{role.toUpperCase()} EXECUTIVE CONSOLE</span>
          <h1>Welcome, {user.name}</h1>
          <p>
            {role === "Advisor"
              ? `Assigned Class Faculty Advisor &bull; Section ${user.year || ""} ${user.section || ""}`
              : role === "HOD"
              ? "Department of Computer Science & Engineering &bull; AIML"
              : "Executive Administration &bull; Institutional Academic Oversight"}
          </p>
        </div>
        <div className="hero-avatar-box">
          <ShieldCheck size={36} />
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard
          label="Total Students"
          value={role === "Advisor" ? students.length : stats.total_students ?? students.length}
          icon={Users}
          pillText="Active Scholars"
          pillType="neutral"
        />
        <StatCard
          label="Average Attendance"
          value={`${stats.average_attendance ?? 0}%`}
          icon={BarChart3}
          pillText="Institutional"
          pillType="success"
          iconVariant="success"
        />
        <StatCard
          label="Total Leaves Reviewed"
          value={leaves.length}
          icon={History}
          pillText="All Records"
          pillType="neutral"
        />
        <StatCard
          label="Pending at My Stage"
          value={pendingAtStage}
          icon={Clock}
          pillText={pendingAtStage > 0 ? "Action Required" : "All Clear"}
          pillType={pendingAtStage > 0 ? "warning" : "success"}
          iconVariant={pendingAtStage > 0 ? "warning" : "success"}
        />
      </div>

      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Administrative Actions</h2>
          <p className="section-subtitle">Review workflows and access student directories</p>
        </div>
      </div>

      <div className="action-grid">
        <ActionCard
          title="Student Directory"
          text="Inspect student rosters, contact emails, and individual attendance."
          icon={Users}
          onClick={() => setActivePage("students")}
        />
        <ActionCard
          title="Leave Requests"
          text={`Review requests requiring ${role} stage verification.`}
          icon={Send}
          onClick={() => setActivePage("leave-requests")}
        />
        <ActionCard
          title="Attendance Monitoring"
          text="Track class-wide attendance risk categories."
          icon={BarChart3}
          onClick={() => setActivePage("attendance")}
        />
        <ActionCard
          title="Institutional Reports"
          text="Generate and print comprehensive PDF academic audits."
          icon={FileText}
          onClick={() => setActivePage("reports")}
        />
      </div>
    </>
  );
}

function StudentDirectory({ user, externalSearch = "" }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const role = normalizeRole(user.role);

  const load = useCallback(async () => {
    try {
      setError("");
      const path =
        role === "Advisor"
          ? `/advisor/${encodeURIComponent(user.email)}/students`
          : "/students";

      const data = await apiFetch(path);
      setStudents(asArray(data));
    } catch (err) {
      setError(err.message);
    }
  }, [role, user.email]);

  useEffect(() => {
    load();
  }, [load]);

  const activeQuery = (externalSearch || search).trim().toLowerCase();

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const content = [
        student.name,
        student.register_number,
        student.year,
        student.section,
        student.department,
      ].join(" ").toLowerCase();

      return !activeQuery || content.includes(activeQuery);
    });
  }, [students, activeQuery]);

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Student Directory</h2>
          <p className="section-subtitle">
            {role === "Advisor" ? `Roster for ${user.year || ""} ${user.section || ""}` : "All Department Students"}
          </p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-bar">
          <div className="topbar-search-box" style={{ width: 320 }}>
            <Search size={15} className="topbar-search-icon" />
            <input
              className="table-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll no, or section..."
            />
          </div>
          <span className="stat-pill neutral">{filtered.length} students found</span>
        </div>

        {error ? (
          <EmptyState title="Unable to retrieve directory" text={error} />
        ) : filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Register No</th>
                  <th>Department</th>
                  <th>Year &amp; Section</th>
                  <th>Attendance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const att = Number(student.attendance ?? 0);
                  return (
                    <tr key={student.id || student.register_number}>
                      <td>
                        <strong>{student.name}</strong>
                      </td>
                      <td>{student.register_number}</td>
                      <td>{student.department || "CSE - AIML"}</td>
                      <td>
                        <span className="stat-pill neutral">
                          {student.year} - {student.section}
                        </span>
                      </td>
                      <td>
                        <strong>{att}%</strong>
                      </td>
                      <td>
                        <StatusBadge status={att >= 75 ? "Safe" : "Needs Improvement"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No matching students found" text="Try refining your search keyword." />
        )}
      </div>
    </>
  );
}

function StaffLeaveRequests({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const role = normalizeRole(user.role);

  const load = useCallback(async () => {
    try {
      setError("");
      let path;
      if (role === "Advisor") {
        path = `/leaves?advisor_email=${encodeURIComponent(user.email)}`;
      } else if (role === "HOD") {
        path = "/hod/leaves";
      } else {
        path = "/vp/leaves";
      }

      const data = await apiFetch(path);
      setLeaves(asArray(data));
    } catch (err) {
      setError(err.message);
      setLeaves([]);
    }
  }, [role, user.email]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(status) {
    if (!selected) return;

    let endpoint;
    if (role === "Advisor") {
      endpoint = `/advisor/leave/${selected.id}?advisor_email=${encodeURIComponent(user.email)}`;
    } else if (role === "HOD") {
      endpoint = `/hod/leave/${selected.id}`;
    } else if (role === "VP") {
      endpoint = `/vp/leave/${selected.id}`;
    } else {
      return;
    }

    try {
      setLoading(true);
      await apiFetch(endpoint, {
        method: "PUT",
        body: JSON.stringify({
          status,
          comment,
        }),
      });

      setSelected(null);
      setComment("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Leave Request Approvals ({role} Stage)</h2>
          <p className="section-subtitle">
            {role === "Advisor"
              ? "Requests submitted by students from your assigned class"
              : role === "HOD"
              ? "Requests endorsed by Faculty Advisors awaiting Department HOD recommendation"
              : "Final executive approval queue for Vice Principal"}
          </p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <LeaveTable leaves={leaves} staff onReview={setSelected} />

      {/* Review Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelected(null)}>
              <X size={18} />
            </button>
            <span className="hero-eyebrow">LEAVE REVIEW &bull; {role.toUpperCase()} STAGE</span>
            <h2 style={{ margin: "8px 0 2px 0", color: "var(--text-primary)" }}>{selected.student_name || "Student"}</h2>
            <p style={{ margin: "0 0 16px 0", color: "var(--text-muted)", fontSize: 13 }}>
              Roll: <strong>{selected.register_number}</strong> &bull; Class: {selected.year_section || `${selected.year || ""} ${selected.section || ""}`}
            </p>

            <div className="profile-grid" style={{ marginBottom: 16 }}>
              <div className="info-item">
                <span>Leave Type</span>
                <strong>{selected.leave_type}</strong>
              </div>
              <div className="info-item">
                <span>Dates</span>
                <strong>{selected.from_date} &rarr; {selected.to_date}</strong>
              </div>
              <div className="info-item">
                <span>Advisor Status</span>
                <StatusBadge status={selected.advisor_status || "Pending"} />
              </div>
              <div className="info-item">
                <span>HOD Status</span>
                <StatusBadge status={selected.hod_status || "Pending"} />
              </div>
            </div>

            <div className="info-item" style={{ marginBottom: 16 }}>
              <span>Reason</span>
              <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>{selected.reason || "-"}</p>
            </div>

            {selected.proof_file && (
              <div className="threshold-alert-banner safe" style={{ padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                <FileCheck size={18} />
                <span>Supporting Document Attached: {selected.proof_file}</span>
              </div>
            )}

            <div className="form-field-group">
              <label className="form-label">Review Comment / Endorsement Note</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter remarks or approval reason..."
              />
            </div>

            <div className="modal-actions">
              <button className="btn-reject" disabled={loading} onClick={() => review("Rejected")}>
                {loading ? "Please wait..." : "Reject Request"}
              </button>
              <button className="btn-approve" disabled={loading} onClick={() => review("Approved")}>
                {loading ? "Please wait..." : "Approve & Advance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StaffAttendance({ user }) {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const role = normalizeRole(user.role);

  const load = useCallback(async () => {
    try {
      setError("");
      const path =
        role === "Advisor"
          ? `/advisor/${encodeURIComponent(user.email)}/students`
          : "/students";

      const data = await apiFetch(path);
      setStudents(asArray(data));
    } catch (err) {
      setError(err.message);
    }
  }, [role, user.email]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Cohort Attendance Monitoring</h2>
          <p className="section-subtitle">
            {role === "Advisor" ? `Attendance Roster for ${user.year || ""} ${user.section || ""}` : "All Enrolled Scholars"}
          </p>
        </div>
      </div>

      {error ? (
        <EmptyState title="Unable to retrieve attendance" text={error} />
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Register No</th>
                  <th>Class</th>
                  <th>Attendance %</th>
                  <th>Eligibility Standing</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const att = Number(student.attendance || 0);
                  return (
                    <tr key={student.id || student.register_number}>
                      <td><strong>{student.name}</strong></td>
                      <td>{student.register_number}</td>
                      <td>{student.year} {student.section}</td>
                      <td>
                        <strong>{att}%</strong>
                      </td>
                      <td>
                        <StatusBadge
                          status={att >= 75 ? "Safe" : att >= 60 ? "Needs Improvement" : "High Risk"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function Reports({ user }) {
  const [sections, setSections] = useState([]);
  const [error, setError] = useState("");
  const role = normalizeRole(user.role);

  useEffect(() => {
    apiFetch("/statistics/sections")
      .then((data) => setSections(asArray(data)))
      .catch((err) => setError(err.message));
  }, []);

  function downloadAll() {
    let url = `${API}/reports/students/pdf`;
    if (role === "Advisor") {
      url += `?advisor_email=${encodeURIComponent(user.email)}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Institutional Reports &amp; Audits</h2>
          <p className="section-subtitle">Download verified academic &amp; attendance compliance documents</p>
        </div>
        <button className="btn-primary" onClick={downloadAll} style={{ width: "auto", padding: "10px 22px" }}>
          <Download size={16} />
          <span>Download Audit PDF</span>
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="stats-grid">
        {sections.map((section) => (
          <div className="stat-card" key={section.class_name}>
            <div className="stat-card-header">
              <span className="stat-card-label">Class Section</span>
              <span className="stat-pill neutral">{section.student_count ?? 0} Students</span>
            </div>
            <div className="stat-card-value">{section.class_name}</div>
            <div className="stat-card-footer">
              <span className="stat-subtext">Advisor: {section.advisor_name || "-"}</span>
              <span className="stat-pill success" style={{ marginLeft: "auto" }}>
                {section.average_attendance ?? 0}% Avg
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   SHARED REUSABLE UI COMPONENTS
============================================================ */

function StatCard({ label, value, icon: Icon, pillText, pillType = "neutral", iconVariant = "neutral" }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className={`stat-card-icon-wrap ${iconVariant}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value ?? "-"}</div>
      {pillText && (
        <div className="stat-card-footer">
          <span className={`stat-pill ${pillType}`}>{pillText}</span>
        </div>
      )}
    </div>
  );
}

function ActionCard({ title, text, icon: Icon, onClick }) {
  return (
    <div className="action-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="action-card-header">
        {Icon && (
          <div className="action-card-icon-wrap">
            <Icon size={22} />
          </div>
        )}
        <ChevronRight size={18} className="action-card-arrow" />
      </div>
      <div>
        <h3 className="action-card-title">{title}</h3>
        <p className="action-card-text">{text}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const value = String(status || "Pending");
  const lower = value.toLowerCase();

  let cls = "neutral";
  let Icon = Clock;

  if (lower.includes("approved") || lower === "safe" || lower.includes("verified")) {
    cls = "success";
    Icon = CheckCircle2;
  } else if (lower.includes("pending") || lower.includes("improvement")) {
    cls = "warning";
    Icon = Clock;
  } else if (lower.includes("reject") || lower.includes("risk")) {
    cls = "danger";
    Icon = XCircle;
  }

  return (
    <span className={`status-badge ${cls}`}>
      <Icon size={12} />
      <span>{value}</span>
    </span>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <HelpCircle size={32} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{text}</p>
    </div>
  );
}

function RadialGauge({ percentage = 0 }) {
  const safePct = Math.min(100, Math.max(0, percentage));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePct / 100) * circumference;

  let strokeColor = "#10B981"; // success
  if (safePct < 60) {
    strokeColor = "#EF4444"; // danger
  } else if (safePct < 75) {
    strokeColor = "#F59E0B"; // warning
  }

  return (
    <div className="attendance-gauge-wrap">
      <svg className="attendance-gauge-svg" viewBox="0 0 160 160">
        <circle
          className="gauge-bg-circle"
          cx="80"
          cy="80"
          r={radius}
        />
        <circle
          className="gauge-fill-circle"
          cx="80"
          cy="80"
          r={radius}
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-center-text">
        <span className="gauge-percentage">{safePct}%</span>
        <span className="gauge-label">Attendance</span>
      </div>
    </div>
  );
}

function LeaveTable({ leaves = [], staff = false, onReview }) {
  if (!leaves.length) {
    return (
      <EmptyState
        title="No Leave Records Found"
        text="There are no applications matching your queue at this moment."
      />
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Student Details</th>
              <th>Class Section</th>
              <th>Leave Type</th>
              <th>Dates</th>
              <th>Status</th>
              {staff && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => {
              const status = getLeaveStatus(leave);
              return (
                <tr key={leave.id}>
                  <td>
                    <strong>{leave.student_name || leave.name || "Student"}</strong>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {leave.register_number || ""}
                    </div>
                  </td>
                  <td>
                    {leave.year_section || `${leave.year || ""} ${leave.section || ""}`.trim() || "-"}
                  </td>
                  <td>
                    <span className="stat-pill neutral">{leave.leave_type || "Leave"}</span>
                  </td>
                  <td>
                    {leave.from_date || "-"} &rarr; {leave.to_date || "-"}
                  </td>
                  <td>
                    <StatusBadge status={status} />
                  </td>
                  {staff && (
                    <td>
                      {onReview && (
                        <button
                          className="btn-demo"
                          style={{ width: "auto", padding: "6px 14px", marginTop: 0 }}
                          onClick={() => onReview(leave)}
                        >
                          Review &amp; Decide
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;