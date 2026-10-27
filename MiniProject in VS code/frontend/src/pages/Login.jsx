import React, { useState } from "react";
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Layers,
  BarChart3,
  Bot,
  AlertCircle,
} from "lucide-react";
import {
  apiFetch,
  normalizeUser,
  VALID_ROLES,
  ADVISOR_DATA,
  DEMO_STUDENT,
  DEMO_HOD,
  DEMO_VP,
  getParentDemoCredentials,
} from "../api";
import { useTheme } from "../theme";

export function Login({ onLogin }) {
  const { theme } = useTheme();
  const [role, setRole] = useState("Student");
  const [registerNumber, setRegisterNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [advisorClass, setAdvisorClass] = useState("III Year A");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setRegisterNumber("");
    setEmail("");
    setPassword("");
    setError("");
    if (newRole === "Advisor") {
      setAdvisorClass("III Year A");
    }
  };

  const fillDemoCredentials = () => {
    setError("");
    if (role === "Student") {
      setRegisterNumber(DEMO_STUDENT.register_number);
      setEmail(DEMO_STUDENT.email);
      setPassword(DEMO_STUDENT.password);
    } else if (role === "Parent") {
      const roll = registerNumber.trim() || "24025";
      setRegisterNumber(roll);
      const parentCreds = getParentDemoCredentials(roll);
      setEmail(parentCreds.email);
      setPassword(parentCreds.password);
    } else if (role === "Advisor") {
      const adv = ADVISOR_DATA[advisorClass] || ADVISOR_DATA["III Year A"];
      setEmail(adv.email);
      setPassword(adv.password);
    } else if (role === "HOD") {
      setEmail(DEMO_HOD.email);
      setPassword(DEMO_HOD.password);
    } else if (role === "VP") {
      setEmail(DEMO_VP.email);
      setPassword(DEMO_VP.password);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          role === "Student" || role === "Parent" ? registerNumber.trim() : "",
        child_register_number: role === "Parent" ? registerNumber.trim() : "",
        class_name: role === "Advisor" ? advisorClass : "",
        year_section: role === "Advisor" ? advisorClass : "",
        section: role === "Advisor" ? advisorClass.split(" ").pop() : "",
      };

      const data = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.success === false) {
        throw new Error(data.message || "Invalid authentication credentials.");
      }

      const rawUser = {
        ...(data.data || {}),
        ...(data.user || {}),
        ...data,
        role: data.role || data.user?.role || role,
      };

      onLogin(rawUser, rememberMe);
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Desktop Left Side: Brand & Value Proportions */}
      <div className="login-brand-side">
        <div className="brand-backdrop-glow" />

        <div className="brand-header-block">
          <div className="brand-pill">
            <GraduationCap size={18} />
            <span>Campus Intelligence Platform</span>
          </div>
          <h1 className="brand-headline">
            Stud LMS
            <span className="brand-gradient-text"> 3.0</span>
          </h1>
          <p className="brand-subheadline">
            Next-generation academic intelligence, real-time attendance analytics, and
            automated multi-tier campus workflows.
          </p>
        </div>

        {/* 3 Core Product Benefits */}
        <div className="brand-benefits-list">
          <div className="benefit-card">
            <div className="benefit-icon-box indigo">
              <Layers size={22} />
            </div>
            <div className="benefit-content">
              <h3>Automated 3-Tier Workflow</h3>
              <p>
                Seamless leave escalation through Advisor, HOD, and Vice Principal with digital OCR proof validation.
              </p>
            </div>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon-box violet">
              <BarChart3 size={22} />
            </div>
            <div className="benefit-content">
              <h3>Attendance Intelligence</h3>
              <p>
                Real-time subject-wise tracking, 75% threshold calculators, and automated risk prevention alerts.
              </p>
            </div>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon-box emerald">
              <Bot size={22} />
            </div>
            <div className="benefit-content">
              <h3>AI Academic Assistant</h3>
              <p>
                Data-grounded academic advising, schedule countdowns, and instant curriculum insight.
              </p>
            </div>
          </div>
        </div>

        {/* Live System Indicator */}
        <div className="brand-footer-pill">
          <span className="status-dot green" />
          <span>FastAPI Engine Online • 420 Students Connected • Dept of CSE - AIML</span>
        </div>
      </div>

      {/* Right Side: Authentication Card */}
      <div className="login-form-side">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="mobile-brand-mark">
              <GraduationCap size={24} className="text-indigo-600" />
              <span>Stud LMS</span>
            </div>
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Select your campus role and authenticate to proceed</p>
          </div>

          {/* Role Selector Tabs */}
          <div className="role-selector-tabs" role="tablist">
            {VALID_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                className={`role-tab-btn ${role === r ? "active" : ""}`}
                onClick={() => handleRoleChange(r)}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {(role === "Student" || role === "Parent") && (
              <div className="form-group">
                <label className="form-label">
                  {role === "Student" ? "Register Number" : "Student Register Number"}
                </label>
                <div className="input-wrap">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    required
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    placeholder={role === "Student" ? "e.g. 24025" : "e.g. 24025 or 26001"}
                    className="form-input"
                  />
                </div>
              </div>
            )}

            {role === "Advisor" && (
              <div className="form-group">
                <label className="form-label">Assigned Class Section</label>
                <select
                  value={advisorClass}
                  onChange={(e) => {
                    setAdvisorClass(e.target.value);
                    setEmail("");
                    setPassword("");
                    setError("");
                  }}
                  className="form-select"
                >
                  {Object.keys(ADVISOR_DATA).map((item) => (
                    <option key={item} value={item}>
                      {item} ({ADVISOR_DATA[item].name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                {role === "Student"
                  ? "Institutional Email"
                  : role === "Parent"
                  ? "Registered Parent Email"
                  : "Official Faculty Email"}
              </label>
              <div className="input-wrap">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu or name@studlms.com"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-action">
                <label className="form-label">Password</label>
              </div>
              <div className="input-wrap">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options-row">
              <label className="remember-me-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox-input"
                />
                <span>Remember this workstation</span>
              </label>

              {/* Demo auto-filler */}
              <button
                type="button"
                className="demo-autofill-btn"
                onClick={fillDemoCredentials}
                title="Populate authorized demo credentials"
              >
                <Sparkles size={14} />
                <span>Fill Demo {role}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <span className="submit-spinner-wrap">
                  <span className="spinner" />
                  <span>Authenticating...</span>
                </span>
              ) : (
                <span className="submit-content">
                  <span>Sign in as {role}</span>
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          <div className="auth-card-footer">
            <ShieldCheck size={16} className="text-indigo-500" />
            <span>End-to-end encrypted session • RBAC Authorization</span>
          </div>
        </div>
      </div>
    </div>
  );
}
