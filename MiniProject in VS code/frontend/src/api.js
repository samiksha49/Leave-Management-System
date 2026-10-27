export const API = "http://127.0.0.1:8000";

export const ADVISOR_DATA = {
  "I Year A": { name: "Ms. Priya", email: "priya.advisor@gmail.com", password: "priya@123" },
  "I Year B": { name: "Mr. Naveen", email: "naveen.advisor@gmail.com", password: "naveen@123" },
  "II Year A": { name: "Ms. Divya", email: "divya.advisor@gmail.com", password: "divya@123" },
  "II Year B": { name: "Mr. Karthik", email: "karthik.advisor@gmail.com", password: "karthik@123" },
  "III Year A": { name: "Ms. K. Anusuya", email: "anusuya.advisor@gmail.com", password: "anusuya@123" },
  "III Year B": { name: "Mr. Arun", email: "arun.advisor@gmail.com", password: "arun@123" },
  "IV Year A": { name: "Ms. Swetha", email: "swetha.advisor@gmail.com", password: "swetha@123" },
};

export const DEMO_STUDENT = {
  register_number: "24025",
  email: "student24025@studlms.com",
  password: "student24025@123",
};

export const DEMO_HOD = {
  email: "kumar.hod@gmail.com",
  password: "kumar@123",
};

export const DEMO_VP = {
  email: "rajesh.vp@gmail.com",
  password: "rajesh@123",
};

export const VALID_ROLES = ["Student", "Parent", "Advisor", "HOD", "VP"];

export function normalizeRole(role) {
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

export function normalizeUser(rawUser, fallbackRole = "") {
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

export function getStoredUser() {
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
    return null;
  }
}

export function setStoredUser(user) {
  try {
    localStorage.setItem("stud_lms_user", JSON.stringify(user));
  } catch (e) {
    console.error("Failed to store user:", e);
  }
}

export function clearStoredUser() {
  try {
    localStorage.removeItem("stud_lms_user");
  } catch (e) {
    console.error("Failed to clear user:", e);
  }
}

export async function apiFetch(path, options = {}) {
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
      "Cannot connect to the backend. Please check that FastAPI is running on http://127.0.0.1:8000."
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

export function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.leaves)) return data.leaves;
  if (Array.isArray(data?.students)) return data.students;
  return [];
}

export function getParentDemoCredentials(registerNumber) {
  const roll = String(registerNumber || "").trim();
  return {
    email: `parent${roll}@studlms.com`,
    password: `parent${roll}@123`,
  };
}

export function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function getLeaveStatus(leave) {
  if (!leave) return "Pending";
  if (leave.final_status && leave.final_status !== "Pending") {
    return leave.final_status;
  }

  const advisor = String(leave.advisor_status || "Pending");
  const hod = String(leave.hod_status || "Pending");
  const vp = String(leave.vp_status || "Pending");

  if (advisor === "Rejected" || hod === "Rejected" || vp === "Rejected") {
    return "Rejected";
  }

  if (advisor === "Approved" && hod === "Approved" && vp === "Approved") {
    return "Approved";
  }

  if (advisor === "Approved" && hod === "Approved") {
    return "Under VP Review";
  }

  if (advisor === "Approved") {
    return "Under HOD Review";
  }

  return "Under Advisor Review";
}

export function isRejected(leave) {
  return getLeaveStatus(leave).toLowerCase().includes("reject");
}

export function isFinished(leave) {
  const status = getLeaveStatus(leave).toLowerCase();
  return status.includes("approve") || status.includes("reject");
}
