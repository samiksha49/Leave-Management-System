import React from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Info as InfoIcon,
  HelpCircle,
  ChevronRight,
  X,
} from "lucide-react";

export function SectionTitle({ title, text, action }) {
  return (
    <div className="section-title-wrap">
      <div>
        <h2 className="section-title">{title}</h2>
        {text && <p className="section-subtitle">{text}</p>}
      </div>
      {action && <div className="section-title-action">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, change, changeType = "neutral", subtext }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className="stat-card-icon">
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {(change || subtext) && (
        <div className="stat-card-footer">
          {change && (
            <span className={`stat-pill ${changeType}`}>
              {change}
            </span>
          )}
          {subtext && <span className="stat-subtext">{subtext}</span>}
        </div>
      )}
    </div>
  );
}

export function ActionCard({ title, text, icon: Icon, onClick, badge }) {
  return (
    <div className="action-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick?.()}>
      <div className="action-card-header">
        {Icon && (
          <div className="action-card-icon">
            <Icon size={22} />
          </div>
        )}
        {badge && <span className="action-card-badge">{badge}</span>}
      </div>
      <div className="action-card-body">
        <h3 className="action-card-title">{title}</h3>
        <p className="action-card-text">{text}</p>
      </div>
      <div className="action-card-footer">
        <span>Proceed</span>
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = String(status || "Pending").toLowerCase();

  let type = "pending";
  let label = status;
  let Icon = Clock;

  if (s.includes("approve") || s === "safe" || s === "good" || s === "on track") {
    type = "success";
    Icon = CheckCircle2;
  } else if (s.includes("reject") || s.includes("critical") || s.includes("high risk")) {
    type = "danger";
    Icon = XCircle;
  } else if (s.includes("warning") || s.includes("needs improvement")) {
    type = "warning";
    Icon = AlertTriangle;
  } else if (s.includes("review") || s.includes("pending")) {
    type = "info";
    Icon = Clock;
  }

  return (
    <span className={`status-badge status-badge-${type}`}>
      <Icon size={13} className="status-badge-icon" />
      <span>{label}</span>
    </span>
  );
}

export function EmptyState({ title, text, icon: Icon = HelpCircle, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={36} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{text}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export function LoadingSkeleton({ count = 3, type = "card" }) {
  if (type === "table") {
    return (
      <div className="skeleton-table">
        <div className="skeleton-row skeleton-header-row" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-row" />
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = "520px" }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function RadialGauge({ value, size = 160, strokeWidth = 14, label = "Attendance", target = 75 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, Number(value) || 0));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  let strokeColor = "#4F46E5";
  if (clampedValue >= target) {
    strokeColor = "#16A34A"; // green
  } else if (clampedValue >= 60) {
    strokeColor = "#D97706"; // amber
  } else {
    strokeColor = "#DC2626"; // red
  }

  return (
    <div className="radial-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="radial-gauge-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="radial-gauge-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          stroke={strokeColor}
          strokeLinecap="round"
        />
      </svg>
      <div className="radial-gauge-content">
        <span className="radial-gauge-value" style={{ color: strokeColor }}>
          {clampedValue}%
        </span>
        <span className="radial-gauge-label">{label}</span>
      </div>
    </div>
  );
}

export function InfoItem({ label, value, subtext }) {
  return (
    <div className="info-item">
      <span className="info-label">{label}</span>
      <strong className="info-value">{value ?? "-"}</strong>
      {subtext && <span className="info-subtext">{subtext}</span>}
    </div>
  );
}
