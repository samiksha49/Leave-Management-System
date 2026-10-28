from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional
import os
import re

from .database import Base, engine, SessionLocal
from .models import (
    Student,
    Parent,
    LeaveRequest,
    Notification,
    ExamSchedule,
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Stud LMS",
    version="3.0.0",
    description="AI-Powered Student Leave, Attendance & Academic Monitoring System",
)
app.add_middleware(
    CORSMiddleware,
       allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "https://leave-management-system-1-s8vz.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


# ============================================================
# DATABASE
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# CONSTANTS
# ============================================================

DEPARTMENT = "CSE - AIML"

TARGET_ATTENDANCE = 75
WARNING_ATTENDANCE = 60

TOTAL_CLASSES = 100
CLASSES_PER_DAY = 6

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


DEMO_HOD = {
    "email": "kumar.hod@gmail.com",
    "password": "kumar@123",
    "name": "Mr. Kumar",
}


DEMO_VP = {
    "email": "rajesh.vp@gmail.com",
    "password": "rajesh@123",
    "name": "Mr. Rajesh",
}


ADVISOR_ACCOUNTS = [
    {
        "email": "priya.advisor@gmail.com",
        "password": "priya@123",
        "name": "Ms. Priya",
        "year": "I Year",
        "section": "A",
    },
    {
        "email": "naveen.advisor@gmail.com",
        "password": "naveen@123",
        "name": "Mr. Naveen",
        "year": "I Year",
        "section": "B",
    },
    {
        "email": "divya.advisor@gmail.com",
        "password": "divya@123",
        "name": "Ms. Divya",
        "year": "II Year",
        "section": "A",
    },
    {
        "email": "karthik.advisor@gmail.com",
        "password": "karthik@123",
        "name": "Mr. Karthik",
        "year": "II Year",
        "section": "B",
    },
    {
        "email": "anusuya.advisor@gmail.com",
        "password": "anusuya@123",
        "name": "Ms. K. Anusuya",
        "year": "III Year",
        "section": "A",
    },
    {
        "email": "arun.advisor@gmail.com",
        "password": "arun@123",
        "name": "Mr. Arun",
        "year": "III Year",
        "section": "B",
    },
    {
        "email": "swetha.advisor@gmail.com",
        "password": "swetha@123",
        "name": "Ms. Swetha",
        "year": "IV Year",
        "section": "A",
    },
]


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================

class LoginRequest(BaseModel):
    role: str
    email: str
    password: str
    register_number: Optional[str] = None


class LeaveCreate(BaseModel):
    leave_type: str
    from_date: date
    to_date: date
    reason: str


class LeaveDecision(BaseModel):
    status: str


class ExamCreate(BaseModel):
    exam_name: Optional[str] = "Semester Examination"
    exam_from_date: date
    exam_to_date: date


# ============================================================
# BASIC HELPERS
# ============================================================

def normalize_role(value):
    value = str(value or "").strip().lower()

    if value == "student":
        return "Student"

    if value == "parent":
        return "Parent"

    if value == "advisor":
        return "Advisor"

    if value == "hod":
        return "HOD"

    if value == "vp":
        return "VP"

    return ""


def get_year_from_roll(register_number: str):
    number = int(str(register_number)[-5:])

    if 23001 <= number <= 23060:
        return "IV Year"

    if 24001 <= number <= 24120:
        return "III Year"

    if 25001 <= number <= 25120:
        return "II Year"

    if 26001 <= number <= 26120:
        return "I Year"

    return "III Year"


def get_section_from_roll(register_number: str):
    number = int(str(register_number)[-5:])

    if 23001 <= number <= 23060:
        return "A"

    if 24001 <= number <= 24060:
        return "A"

    if 24061 <= number <= 24120:
        return "B"

    if 25001 <= number <= 25060:
        return "A"

    if 25061 <= number <= 25120:
        return "B"

    if 26001 <= number <= 26060:
        return "A"

    if 26061 <= number <= 26120:
        return "B"

    return "A"


def get_class_name(year: str, section: str):
    return f"{year} {section}"


def get_advisor_for_class(year: str, section: str):
    for advisor in ADVISOR_ACCOUNTS:
        if (
            advisor["year"] == year
            and advisor["section"] == section
        ):
            return advisor

    return None


def get_advisor_for_student(student):
    if not student:
        return None

    return get_advisor_for_class(
        student.year,
        student.section,
    )


def get_name_index(register_number: str):
    number = int(str(register_number)[-5:])

    if 23001 <= number <= 23060:
        return number - 23001

    if 24001 <= number <= 24120:
        return number - 24001 + 60

    if 25001 <= number <= 25120:
        return number - 25001 + 180

    if 26001 <= number <= 26120:
        return number - 26001 + 300

    return 0


FIRST_NAMES = [
    "Aarav",
    "Aadhira",
    "Abinaya",
    "Adhithya",
    "Akash",
    "Akila",
    "Ananya",
    "Anish",
    "Arjun",
    "Arun",
    "Ashwin",
    "Bharath",
    "Bhavya",
    "Charan",
    "Deepak",
    "Dharani",
    "Dhivya",
    "Dinesh",
    "Gokul",
    "Harini",
    "Harish",
    "Hema",
    "Jeeva",
    "Karthik",
    "Keerthana",
    "Kavin",
    "Kavya",
    "Krishna",
    "Lokesh",
    "Madhavan",
    "Manoj",
    "Meena",
    "Monisha",
    "Nandhini",
    "Naveen",
    "Nikhil",
    "Nithya",
    "Pavithra",
    "Pranav",
    "Praveen",
    "Priya",
    "Rahul",
    "Rajesh",
    "Ranjith",
    "Ravi",
    "Reshma",
    "Rohit",
    "Sanjay",
    "Sanjana",
    "Saranya",
    "Sathish",
    "Shalini",
    "Shivani",
    "Siva",
    "Sneha",
    "Sowmya",
    "Surya",
    "Swetha",
    "Tamilselvan",
    "Varsha",
    "Vignesh",
    "Vijay",
    "Vishnu",
    "Yamini",
    "Yash",
    "Zara",
]


def get_student_name(register_number: str):
    index = get_name_index(register_number)

    first = FIRST_NAMES[index % len(FIRST_NAMES)]

    number = int(str(register_number)[-5:])

    return f"{first} {chr(65 + ((number // 10) % 26))}"


def get_attendance(register_number: str):
    number = int(str(register_number)[-5:])

    values = [85, 88, 82, 91, 78, 86, 84, 89, 81, 87]

    return float(values[number % len(values)])


# ============================================================
# SERIALIZERS
# ============================================================

def student_to_dict(student):
    advisor = get_advisor_for_student(student)

    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "register_number": student.register_number,
        "department": student.department,
        "year": student.year,
        "section": student.section,
        "class_name": get_class_name(
            student.year,
            student.section,
        ),
        "year_section": get_class_name(
            student.year,
            student.section,
        ),
        "attendance": student.attendance,
        "advisor_name": advisor["name"] if advisor else "",
        "advisor_email": advisor["email"] if advisor else "",
        "role": "Student",
    }


def parent_to_dict(parent, student=None):
    result = {
        "id": parent.id,
        "name": parent.name,
        "email": parent.email,
        "student_id": parent.student_id,
        "role": "Parent",
    }

    if student:
        result["student"] = student_to_dict(student)

    return result


def get_leave_status(leave):
    final_status = leave.final_status or "Pending"
    vp_status = leave.vp_status or "Pending"
    hod_status = leave.hod_status or "Pending"
    advisor_status = leave.advisor_status or "Pending"

    if final_status == "Approved":
        return "Approved"

    if final_status == "Rejected":
        if vp_status == "Rejected":
            return "VP Rejected"

        if hod_status == "Rejected":
            return "HOD Rejected"

        if advisor_status == "Rejected":
            return "Advisor Rejected"

        return "Rejected"

    if vp_status == "Rejected":
        return "VP Rejected"

    if hod_status == "Rejected":
        return "HOD Rejected"

    if advisor_status == "Rejected":
        return "Advisor Rejected"

    if vp_status == "Approved":
        return "VP Approved"

    if hod_status == "Approved":
        return "HOD Approved"

    if advisor_status == "Approved":
        return "Advisor Approved"

    return "Pending"


def leave_to_dict(leave, db=None):
    student = None

    if db:
        student = (
            db.query(Student)
            .filter(Student.id == leave.student_id)
            .first()
        )

    advisor = get_advisor_for_student(student) if student else None

    return {
        "id": leave.id,
        "student_id": leave.student_id,

        "student_name": student.name if student else "",
        "register_number": student.register_number if student else "",
        "department": student.department if student else "",
        "year": student.year if student else "",
        "section": student.section if student else "",
        "class_name": (
            get_class_name(student.year, student.section)
            if student
            else ""
        ),

        "advisor_name": advisor["name"] if advisor else "",
        "advisor_email": advisor["email"] if advisor else "",

        "leave_type": leave.leave_type,
        "from_date": str(leave.from_date),
        "to_date": str(leave.to_date),
        "reason": leave.reason,

        "proof_file": leave.proof_file,
        "proof_status": leave.proof_status or "Pending",

        "ocr_text": leave.ocr_text,

        "ai_proof_status": (
            leave.ai_proof_status or "Pending"
        ),

        "ai_verification": (
            leave.ai_proof_status or "Pending"
        ),

        "ai_reason": leave.ai_reason,
        "ai_confidence": leave.ai_confidence,

        "advisor_status": leave.advisor_status or "Pending",
        "hod_status": leave.hod_status or "Pending",
        "vp_status": leave.vp_status or "Pending",
        "final_status": leave.final_status or "Pending",

        "status": get_leave_status(leave),

        "proof_uploaded_at": (
            leave.proof_uploaded_at.isoformat()
            if leave.proof_uploaded_at
            else None
        ),
    }


# ============================================================
# STUDENT / PARENT GENERATION
# ============================================================

def get_all_roll_numbers():
    rolls = []

    for number in range(23001, 23061):
        rolls.append(str(number))

    for number in range(24001, 24121):
        rolls.append(str(number))

    for number in range(25001, 25121):
        rolls.append(str(number))

    for number in range(26001, 26121):
        rolls.append(str(number))

    return rolls


def generate_students(db):
    rolls = get_all_roll_numbers()

    for roll in rolls:
        year = get_year_from_roll(roll)
        section = get_section_from_roll(roll)

        student = (
            db.query(Student)
            .filter(Student.register_number == roll)
            .first()
        )

        if not student:
            student = Student(
                register_number=roll,
                name=get_student_name(roll),
                email=f"student{roll}@studlms.com",
                password=f"student{roll}@123",
                department=DEPARTMENT,
                year=year,
                section=section,
                attendance=get_attendance(roll),
            )

            db.add(student)

        else:
            student.name = get_student_name(roll)
            student.email = f"student{roll}@studlms.com"
            student.password = f"student{roll}@123"
            student.department = DEPARTMENT
            student.year = year
            student.section = section
            student.attendance = get_attendance(roll)

    db.commit()


def generate_parents(db):
    students = (
        db.query(Student)
        .order_by(Student.register_number)
        .all()
    )

    for student in students:
        parent = (
            db.query(Parent)
            .filter(Parent.student_id == student.id)
            .first()
        )

        roll = student.register_number

        if roll == "26001":
            parent_name = "Meena Parent"
            parent_email = "meena.parent@gmail.com"
            parent_password = "meena@123"
        else:
            parent_name = f"Parent of {student.name}"
            parent_email = f"parent{roll}@studlms.com"
            parent_password = f"parent{roll}@123"

        if not parent:
            parent = Parent(
                name=parent_name,
                email=parent_email,
                password=parent_password,
                student_id=student.id,
            )
            db.add(parent)
        else:
            parent.name = parent_name
            parent.email = parent_email
            parent.password = parent_password
            parent.student_id = student.id

    db.commit()


# ============================================================
# IMPORTANT:
# NO DEMO LEAVES ARE CREATED HERE
# ============================================================

def seed_demo_data(db):
    generate_students(db)

    # Make sure parent records exist and passwords are correct.
    generate_parents(db)

    # IMPORTANT:
    # Do NOT create any LeaveRequest here.
    #
    # The application starts with zero leave requests.
    #
    # A LeaveRequest is created ONLY when a student
    # actually submits a leave.


@app.on_event("startup")
def startup_event():
    db = SessionLocal()

    try:
        seed_demo_data(db)
    finally:
        db.close()


# ============================================================
# ROOT / HEALTH
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Stud LMS Backend Running",
        "version": "3.0.0",
        "students": 420,
        "parents": 420,
        "sections": 7,
        "workflow": [
            "Student",
            "Advisor",
            "HOD",
            "VP",
            "Final Approval",
        ],
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "backend": "running",
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    role = normalize_role(data.role)

    # --------------------------------------------------------
    # STUDENT
    # --------------------------------------------------------

    if role == "Student":
        if not data.register_number:
            raise HTTPException(
                status_code=400,
                detail="Register number is required.",
            )

        student = (
            db.query(Student)
            .filter(
                Student.register_number
                == data.register_number.strip()
            )
            .first()
        )

        if not student:
            raise HTTPException(
                status_code=401,
                detail="Invalid register number.",
            )

        if student.email.lower() != data.email.strip().lower():
            raise HTTPException(
                status_code=401,
                detail="Invalid email.",
            )

        if student.password != data.password:
            raise HTTPException(
                status_code=401,
                detail="Invalid password.",
            )

        user = student_to_dict(student)

        return {
            "success": True,
            "role": "Student",
            "user": user,
        }

    # --------------------------------------------------------
    # PARENT
    # --------------------------------------------------------

    if role == "Parent":
        parent = (
            db.query(Parent)
            .filter(
                Parent.email
                == data.email.strip()
            )
            .first()
        )

        if not parent:
            raise HTTPException(
                status_code=401,
                detail="Invalid parent email.",
            )

        if parent.password != data.password:
            raise HTTPException(
                status_code=401,
                detail="Invalid parent password.",
            )

        student = (
            db.query(Student)
            .filter(Student.id == parent.student_id)
            .first()
        )

        return {
            "success": True,
            "role": "Parent",
            "user": parent_to_dict(
                parent,
                student,
            ),
        }

    # --------------------------------------------------------
    # ADVISOR
    # --------------------------------------------------------

    if role == "Advisor":
        for advisor in ADVISOR_ACCOUNTS:
            if (
                advisor["email"].lower()
                == data.email.strip().lower()
                and advisor["password"]
                == data.password
            ):
                return {
                    "success": True,
                    "role": "Advisor",
                    "user": {
                        "name": advisor["name"],
                        "email": advisor["email"],
                        "year": advisor["year"],
                        "section": advisor["section"],
                        "class_name": get_class_name(
                            advisor["year"],
                            advisor["section"],
                        ),
                        "year_section": get_class_name(
                            advisor["year"],
                            advisor["section"],
                        ),
                        "role": "Advisor",
                    },
                }

        raise HTTPException(
            status_code=401,
            detail="Invalid advisor credentials.",
        )

    # --------------------------------------------------------
    # HOD
    # --------------------------------------------------------

    if role == "HOD":
        if (
            data.email.strip().lower()
            == DEMO_HOD["email"].lower()
            and data.password
            == DEMO_HOD["password"]
        ):
            return {
                "success": True,
                "role": "HOD",
                "user": {
                    "name": DEMO_HOD["name"],
                    "email": DEMO_HOD["email"],
                    "role": "HOD",
                },
            }

        raise HTTPException(
            status_code=401,
            detail="Invalid HOD credentials.",
        )

    # --------------------------------------------------------
    # VP
    # --------------------------------------------------------

    if role == "VP":
        if (
            data.email.strip().lower()
            == DEMO_VP["email"].lower()
            and data.password
            == DEMO_VP["password"]
        ):
            return {
                "success": True,
                "role": "VP",
                "user": {
                    "name": DEMO_VP["name"],
                    "email": DEMO_VP["email"],
                    "role": "VP",
                },
            }

        raise HTTPException(
            status_code=401,
            detail="Invalid VP credentials.",
        )

    raise HTTPException(
        status_code=400,
        detail="Invalid role.",
    )


# ============================================================
# STUDENT PROFILE
# ============================================================

@app.get("/student/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    return student_to_dict(student)


# ============================================================
# STUDENT ATTENDANCE & ANALYSIS
# ============================================================

def build_student_attendance_data(student):
    attendance = float(student.attendance or 0)
    attended = round(attendance * TOTAL_CLASSES / 100)
    missed = max(0, TOTAL_CLASSES - attended)

    # Attendance eligibility calculation:
    target_needed_pct = TARGET_ATTENDANCE / 100.0
    if attendance >= TARGET_ATTENDANCE:
        classes_needed = 0
        risk_status = "On Track"
    else:
        needed = (target_needed_pct * TOTAL_CLASSES - attended) / (1 - target_needed_pct)
        classes_needed = max(1, int(round(needed)))
        risk_status = "Warning" if attendance >= WARNING_ATTENDANCE else "Critical Shortage"

    # Curriculum mapping based on student year
    year_curricula = {
        "I Year": [
            ("CS101", "Engineering Mathematics - I", 25, 4),
            ("CS102", "Python for AI & Computing", 22, 5),
            ("CS103", "Digital Logic & Systems", 20, 4),
            ("CS104", "Engineering Physics", 18, 3),
            ("CS105", "Python Practical Lab", 15, 2),
        ],
        "II Year": [
            ("CS201", "Data Structures & Algorithms", 25, 4),
            ("CS202", "Artificial Intelligence Fundamentals", 22, 5),
            ("CS203", "Object Oriented Design & Java", 20, 4),
            ("CS204", "Discrete Mathematical Structures", 18, 3),
            ("CS205", "Data Structures Lab", 15, 2),
        ],
        "III Year": [
            ("CS301", "Deep Learning & Neural Networks", 25, 5),
            ("CS302", "Natural Language Processing", 22, 4),
            ("CS303", "Cloud Computing & DevOps", 20, 4),
            ("CS304", "Database Architecture & Optimization", 18, 3),
            ("CS305", "AI Systems Studio Lab", 15, 2),
        ],
        "IV Year": [
            ("CS401", "Generative AI & LLM Systems", 25, 5),
            ("CS402", "Computer Vision & Autonomous Systems", 22, 4),
            ("CS403", "Distributed Systems & Edge AI", 20, 4),
            ("CS404", "AI Ethics & Industry Governance", 18, 3),
            ("CS405", "Capstone AI Research Project", 15, 2),
        ],
    }

    raw_subjects = year_curricula.get(student.year, year_curricula["I Year"])
    subjects = []
    offsets = [2.5, -3.0, 1.5, -2.0, 4.0]

    for idx, (code, sub_name, total_sub, credits) in enumerate(raw_subjects):
        offset = offsets[idx % len(offsets)]
        sub_pct = max(0.0, min(100.0, attendance + offset))
        sub_attended = min(total_sub, max(0, round(total_sub * (sub_pct / 100.0))))
        calc_pct = round((sub_attended / total_sub) * 100.0, 1)
        sub_status = "Good" if calc_pct >= TARGET_ATTENDANCE else ("Warning" if calc_pct >= WARNING_ATTENDANCE else "Critical")
        subjects.append({
            "code": code,
            "name": sub_name,
            "credits": credits,
            "total_classes": total_sub,
            "attended_classes": sub_attended,
            "percentage": calc_pct,
            "status": sub_status,
        })

    monthly_trend = [
        {"month": "July", "percentage": min(100.0, round(attendance + 4.0, 1))},
        {"month": "August", "percentage": min(100.0, round(attendance + 1.5, 1))},
        {"month": "September", "percentage": min(100.0, round(attendance - 2.0, 1))},
        {"month": "October", "percentage": round(attendance, 1)},
    ]

    return {
        "student_id": student.id,
        "register_number": student.register_number,
        "name": student.name,
        "year": student.year,
        "section": student.section,
        "department": student.department,
        "class_name": get_class_name(
            student.year,
            student.section,
        ),
        "attendance": attendance,
        "target": TARGET_ATTENDANCE,
        "warning": WARNING_ATTENDANCE,
        "total_classes": TOTAL_CLASSES,
        "attended_classes": attended,
        "missed_classes": missed,
        "classes_per_day": CLASSES_PER_DAY,
        "risk": risk_status,
        "classes_needed_for_target": classes_needed,
        "subjects": subjects,
        "monthly_trend": monthly_trend,
    }


@app.get("/student/{student_id}/attendance")
def student_attendance(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    return build_student_attendance_data(student)


@app.get("/student/{student_id}/attendance-analysis")
def student_attendance_analysis(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    return build_student_attendance_data(student)


# ============================================================
# STUDENT APPLY LEAVE
# ============================================================

@app.post("/student/{student_id}/leave")
def apply_leave(
    student_id: int,
    data: LeaveCreate,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    if data.to_date < data.from_date:
        raise HTTPException(
            status_code=400,
            detail="To date cannot be before from date.",
        )

    if not data.reason.strip():
        raise HTTPException(
            status_code=400,
            detail="Reason is required.",
        )

    leave_type = data.leave_type.strip()

    allowed_types = [
        "Medical Leave",
        "Emergency Leave",
        "On Duty Leave",
        "Personal Leave",
        "Planned Leave",
    ]

    if leave_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid leave type.",
        )

    # --------------------------------------------------------
    # Planned / normal leave needs 2 days notice
    # --------------------------------------------------------

    if leave_type not in [
        "Emergency Leave",
        "Medical Leave",
    ]:
        minimum_date = date.today() + timedelta(days=2)

        if data.from_date < minimum_date:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Planned leave must be applied "
                    "at least 2 days before the leave date."
                ),
            )

    # --------------------------------------------------------
    # Check exam overlap
    # --------------------------------------------------------

    exams = (
        db.query(ExamSchedule)
        .order_by(
            ExamSchedule.exam_from_date.asc()
        )
        .all()
    )

    for exam in exams:
        if (
            data.from_date <= exam.exam_to_date
            and data.to_date >= exam.exam_from_date
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Leave overlaps with the examination "
                    "schedule."
                ),
            )

    # --------------------------------------------------------
    # Prevent overlapping active leave requests
    # --------------------------------------------------------

    existing_leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.student_id == student.id
        )
        .all()
    )

    for existing in existing_leaves:
        existing_status = get_leave_status(existing)

        if existing_status in [
            "Advisor Rejected",
            "HOD Rejected",
            "VP Rejected",
            "Rejected",
        ]:
            continue

        if (
            data.from_date <= existing.to_date
            and data.to_date >= existing.from_date
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "You already have a leave request "
                    "for an overlapping date."
                ),
            )

    # --------------------------------------------------------
    # FIND CORRECT ADVISOR AUTOMATICALLY
    # --------------------------------------------------------

    advisor = get_advisor_for_student(student)

    if not advisor:
        raise HTTPException(
            status_code=400,
            detail=(
                "No advisor is assigned to this "
                "student's class."
            ),
        )

    # --------------------------------------------------------
    # CREATE NEW LEAVE
    #
    # IMPORTANT:
    # There is NO "status" column.
    #
    # Workflow fields are used.
    # --------------------------------------------------------

    proof_status = (
        "Required"
        if leave_type
        in [
            "Medical Leave",
            "Emergency Leave",
        ]
        else "Not Required"
    )

    leave = LeaveRequest(
        student_id=student.id,
        leave_type=leave_type,
        from_date=data.from_date,
        to_date=data.to_date,
        reason=data.reason.strip(),

        proof_status=proof_status,

        advisor_status="Pending",
        hod_status="Pending",
        vp_status="Pending",
        final_status="Pending",
    )

    db.add(leave)
    db.commit()
    db.refresh(leave)

    # --------------------------------------------------------
    # PARENT NOTIFICATION
    # --------------------------------------------------------

    parent = (
        db.query(Parent)
        .filter(
            Parent.student_id == student.id
        )
        .first()
    )

    if parent:
        notification = Notification(
            student_id=student.id,
            message=(
                f"Leave request submitted for "
                f"{student.name} ({student.register_number}). "
                f"It has been sent to "
                f"{advisor['name']} "
                f"({student.year} {student.section}) "
                f"for Advisor review."
            ),
            status="Unread",
        )

        db.add(notification)
        db.commit()

    return {
        "success": True,
        "message": (
            "Leave submitted successfully. "
            f"Sent to {advisor['name']}."
        ),
        "assigned_advisor": {
            "name": advisor["name"],
            "email": advisor["email"],
            "year": advisor["year"],
            "section": advisor["section"],
            "class_name": get_class_name(
                advisor["year"],
                advisor["section"],
            ),
        },
        "leave": leave_to_dict(
            leave,
            db,
        ),
    }


# ============================================================
# STUDENT LEAVE HISTORY
# ============================================================

@app.get("/student/{student_id}/leaves")
def student_leaves(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.student_id == student_id
        )
        .order_by(
            LeaveRequest.id.desc()
        )
        .all()
    )

    return [
        leave_to_dict(
            leave,
            db,
        )
        for leave in leaves
    ]


# ============================================================
# PARENT STUDENT DETAILS
# ============================================================

@app.get("/parent/{parent_email}/student")
def parent_student(
    parent_email: str,
    db: Session = Depends(get_db),
):
    parent = (
        db.query(Parent)
        .filter(
            Parent.email == parent_email
        )
        .first()
    )

    if not parent:
        raise HTTPException(
            status_code=404,
            detail="Parent not found.",
        )

    student = (
        db.query(Student)
        .filter(
            Student.id == parent.student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Linked student not found.",
        )

    return student_to_dict(student)


# ============================================================
# PARENT LEAVE MONITORING
# ============================================================

@app.get("/parent/{parent_email}/leaves")
def parent_leaves(
    parent_email: str,
    db: Session = Depends(get_db),
):
    parent = (
        db.query(Parent)
        .filter(
            Parent.email == parent_email
        )
        .first()
    )

    if not parent:
        raise HTTPException(
            status_code=404,
            detail="Parent not found.",
        )

    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.student_id
            == parent.student_id
        )
        .order_by(
            LeaveRequest.id.desc()
        )
        .all()
    )

    return [
        leave_to_dict(
            leave,
            db,
        )
        for leave in leaves
    ]


@app.get("/parents/{parent_email}/leaves")
def parent_leaves_alias(
    parent_email: str,
    db: Session = Depends(get_db),
):
    return parent_leaves(
        parent_email,
        db,
    )


# ============================================================
# PARENT NOTIFICATIONS
# ============================================================

@app.get("/parent/{parent_email}/notifications")
def parent_notifications(
    parent_email: str,
    db: Session = Depends(get_db),
):
    parent = (
        db.query(Parent)
        .filter(
            Parent.email == parent_email
        )
        .first()
    )

    if not parent:
        raise HTTPException(
            status_code=404,
            detail="Parent not found.",
        )

    notifications = (
        db.query(Notification)
        .filter(
            Notification.student_id
            == parent.student_id
        )
        .order_by(
            Notification.id.desc()
        )
        .all()
    )

    return [
        {
            "id": item.id,
            "message": item.message,
            "status": item.status,
        }
        for item in notifications
    ]


# ============================================================
# ADVISOR STUDENTS
# ============================================================

@app.get("/advisor/students")
def advisor_students(
    advisor_email: str,
    db: Session = Depends(get_db),
):
    advisor = None

    for item in ADVISOR_ACCOUNTS:
        if (
            item["email"].lower()
            == advisor_email.strip().lower()
        ):
            advisor = item
            break

    if not advisor:
        raise HTTPException(
            status_code=404,
            detail="Advisor not found.",
        )

    students = (
        db.query(Student)
        .filter(
            Student.year == advisor["year"],
            Student.section == advisor["section"],
        )
        .order_by(
            Student.register_number
        )
        .all()
    )

    return [
        student_to_dict(student)
        for student in students
    ]


@app.get("/advisor/{advisor_email}/students")
def advisor_students_by_path(
    advisor_email: str,
    db: Session = Depends(get_db),
):
    return advisor_students(advisor_email=advisor_email, db=db)


@app.get("/students")
def get_all_students(
    year: Optional[str] = None,
    section: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Student)

    if year:
        query = query.filter(Student.year == year)
    if section:
        query = query.filter(Student.section == section)
    if department:
        query = query.filter(Student.department == department)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.name.ilike(term),
                Student.register_number.ilike(term),
                Student.email.ilike(term),
            )
        )

    students = query.order_by(Student.register_number).all()
    return [student_to_dict(s) for s in students]


# ============================================================
# LEAVE REQUEST LIST
#
# stage:
#   advisor
#   hod
#   vp
#   all
# ============================================================

@app.get("/leaves")
def get_leaves(
    advisor_email: Optional[str] = None,
    stage: Optional[str] = None,
    db: Session = Depends(get_db),
):
    leaves = (
        db.query(LeaveRequest)
        .order_by(
            LeaveRequest.id.desc()
        )
        .all()
    )

    # --------------------------------------------------------
    # ADVISOR
    # --------------------------------------------------------

    if advisor_email:
        advisor = None

        for item in ADVISOR_ACCOUNTS:
            if (
                item["email"].lower()
                == advisor_email.strip().lower()
            ):
                advisor = item
                break

        if not advisor:
            raise HTTPException(
                status_code=404,
                detail="Advisor not found.",
            )

        filtered = []

        for leave in leaves:
            student = (
                db.query(Student)
                .filter(
                    Student.id
                    == leave.student_id
                )
                .first()
            )

            if not student:
                continue

            if (
                student.year
                == advisor["year"]
                and student.section
                == advisor["section"]
                and leave.advisor_status
                == "Pending"
            ):
                filtered.append(leave)

        return [
            leave_to_dict(
                leave,
                db,
            )
            for leave in filtered
        ]

    # --------------------------------------------------------
    # STAGE FILTER
    # --------------------------------------------------------

    stage = (stage or "").strip().lower()

    if stage == "advisor":
        leaves = [
            leave
            for leave in leaves
            if leave.advisor_status == "Pending"
        ]

    elif stage == "hod":
        leaves = [
            leave
            for leave in leaves
            if (
                leave.advisor_status
                == "Approved"
                and leave.hod_status
                == "Pending"
            )
        ]

    elif stage == "vp":
        leaves = [
            leave
            for leave in leaves
            if (
                leave.advisor_status
                == "Approved"
                and leave.hod_status
                == "Approved"
                and leave.vp_status
                == "Pending"
            )
        ]

    return [
        leave_to_dict(
            leave,
            db,
        )
        for leave in leaves
    ]


# ============================================================
# ADVISOR APPROVAL
# ============================================================

@app.put("/advisor/leave/{leave_id}")
def advisor_decision(
    leave_id: int,
    data: LeaveDecision,
    advisor_email: Optional[str] = None,
    db: Session = Depends(get_db),
):
    leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id
        )
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    student = (
        db.query(Student)
        .filter(
            Student.id == leave.student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    correct_advisor = get_advisor_for_student(
        student
    )

    if not correct_advisor:
        raise HTTPException(
            status_code=400,
            detail="No advisor assigned.",
        )

    # --------------------------------------------------------
    # If advisor email supplied, verify it
    # --------------------------------------------------------

    if advisor_email:
        if (
            correct_advisor["email"].lower()
            != advisor_email.strip().lower()
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "This leave belongs to another "
                    "advisor's class."
                ),
            )

    # --------------------------------------------------------
    # Only Pending Advisor requests can be reviewed
    # --------------------------------------------------------

    if leave.advisor_status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=(
                "This leave has already been reviewed "
                "by the Advisor."
            ),
        )

    decision = data.status.strip().lower()

    if decision not in [
        "approved",
        "rejected",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Status must be Approved or Rejected.",
        )

    if decision == "approved":
        leave.advisor_status = "Approved"
        leave.hod_status = "Pending"
        leave.vp_status = "Pending"
        leave.final_status = "Pending"

        message = (
            f"Advisor approved your leave request. "
            f"It has been forwarded to the HOD."
        )

    else:
        leave.advisor_status = "Rejected"
        leave.hod_status = "Pending"
        leave.vp_status = "Pending"
        leave.final_status = "Rejected"

        message = (
            f"Your leave request was rejected "
            f"by the Advisor."
        )

    db.commit()
    db.refresh(leave)

    notification = Notification(
        student_id=student.id,
        message=message,
        status="Unread",
    )

    db.add(notification)
    db.commit()

    return {
        "success": True,
        "message": message,
        "leave": leave_to_dict(
            leave,
            db,
        ),
    }


# ============================================================
# HOD LEAVE LIST
# ============================================================

@app.get("/hod/leaves")
def hod_leaves(
    db: Session = Depends(get_db),
):
    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.advisor_status
            == "Approved",
            LeaveRequest.hod_status
            == "Pending",
        )
        .order_by(
            LeaveRequest.id.desc()
        )
        .all()
    )

    return [
        leave_to_dict(
            leave,
            db,
        )
        for leave in leaves
    ]


# ============================================================
# HOD APPROVAL
# ============================================================

@app.put("/hod/leave/{leave_id}")
def hod_decision(
    leave_id: int,
    data: LeaveDecision,
    db: Session = Depends(get_db),
):
    leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id
        )
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    student = (
        db.query(Student)
        .filter(
            Student.id == leave.student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    # --------------------------------------------------------
    # HOD sees ONLY Advisor-approved leaves
    # --------------------------------------------------------

    if leave.advisor_status != "Approved":
        raise HTTPException(
            status_code=400,
            detail=(
                "This leave has not been approved "
                "by the Advisor yet."
            ),
        )

    if leave.hod_status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=(
                "This leave has already been reviewed "
                "by the HOD."
            ),
        )

    decision = data.status.strip().lower()

    if decision not in [
        "approved",
        "rejected",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Status must be Approved or Rejected.",
        )

    if decision == "approved":
        leave.hod_status = "Approved"
        leave.vp_status = "Pending"
        leave.final_status = "Pending"

        message = (
            "HOD approved your leave request. "
            "It has been forwarded to the VP."
        )

    else:
        leave.hod_status = "Rejected"
        leave.vp_status = "Pending"
        leave.final_status = "Rejected"

        message = (
            "Your leave request was rejected by the HOD."
        )

    db.commit()
    db.refresh(leave)

    notification = Notification(
        student_id=student.id,
        message=message,
        status="Unread",
    )

    db.add(notification)
    db.commit()

    return {
        "success": True,
        "message": message,
        "leave": leave_to_dict(
            leave,
            db,
        ),
    }


# ============================================================
# VP LEAVE LIST
# ============================================================

@app.get("/vp/leaves")
def vp_leaves(
    db: Session = Depends(get_db),
):
    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.advisor_status
            == "Approved",
            LeaveRequest.hod_status
            == "Approved",
            LeaveRequest.vp_status
            == "Pending",
        )
        .order_by(
            LeaveRequest.id.desc()
        )
        .all()
    )

    return [
        leave_to_dict(
            leave,
            db,
        )
        for leave in leaves
    ]


# ============================================================
# VP APPROVAL
# ============================================================

@app.put("/vp/leave/{leave_id}")
def vp_decision(
    leave_id: int,
    data: LeaveDecision,
    db: Session = Depends(get_db),
):
    leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id
        )
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    student = (
        db.query(Student)
        .filter(
            Student.id == leave.student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    # --------------------------------------------------------
    # VP sees ONLY HOD-approved leaves
    # --------------------------------------------------------

    if leave.advisor_status != "Approved":
        raise HTTPException(
            status_code=400,
            detail="Advisor approval is required first.",
        )

    if leave.hod_status != "Approved":
        raise HTTPException(
            status_code=400,
            detail="HOD approval is required first.",
        )

    if leave.vp_status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=(
                "This leave has already been reviewed "
                "by the VP."
            ),
        )

    decision = data.status.strip().lower()

    if decision not in [
        "approved",
        "rejected",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Status must be Approved or Rejected.",
        )

    if decision == "approved":
        leave.vp_status = "Approved"
        leave.final_status = "Approved"

        message = (
            "Your leave request has received final "
            "approval from the VP."
        )

    else:
        leave.vp_status = "Rejected"
        leave.final_status = "Rejected"

        message = (
            "Your leave request was rejected by the VP."
        )

    db.commit()
    db.refresh(leave)

    notification = Notification(
        student_id=student.id,
        message=message,
        status="Unread",
    )

    db.add(notification)
    db.commit()

    return {
        "success": True,
        "message": message,
        "leave": leave_to_dict(
            leave,
            db,
        ),
    }


# ============================================================
# NOTIFICATIONS
# ============================================================

@app.get("/student/{student_id}/notifications")
def student_notifications(
    student_id: int,
    db: Session = Depends(get_db),
):
    notifications = (
        db.query(Notification)
        .filter(
            Notification.student_id
            == student_id
        )
        .order_by(
            Notification.id.desc()
        )
        .all()
    )

    return [
        {
            "id": item.id,
            "message": item.message,
            "status": item.status,
        }
        for item in notifications
    ]


@app.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id
            == notification_id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    notification.status = "Read"

    db.commit()

    return {
        "success": True,
        "message": "Notification marked as read.",
    }


@app.put("/student/{student_id}/notifications/read-all")
def mark_all_student_notifications_read(
    student_id: int,
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.student_id == student_id,
        Notification.status == "Unread",
    ).update({"status": "Read"})
    db.commit()

    return {
        "success": True,
        "message": "All notifications marked as read.",
    }


@app.delete("/student/{student_id}/leave/{leave_id}")
def cancel_student_leave(
    student_id: int,
    leave_id: int,
    db: Session = Depends(get_db),
):
    leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id,
            LeaveRequest.student_id == student_id,
        )
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    if leave.advisor_status != "Pending":
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel a leave request that has already been reviewed.",
        )

    db.delete(leave)
    db.commit()

    return {
        "success": True,
        "message": "Leave request cancelled successfully.",
    }


# ============================================================
# PROOF UPLOAD
# ============================================================

@app.post("/leave/{leave_id}/proof")
async def upload_leave_proof(
    leave_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id
        )
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Please select a file.",
        )

    extension = Path(
        file.filename
    ).suffix.lower()

    allowed_extensions = [
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
    ]

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF, PNG, JPG and JPEG files "
                "are allowed."
            ),
        )

    safe_name = re.sub(
        r"[^a-zA-Z0-9._-]",
        "_",
        file.filename,
    )

    filename = (
        f"leave_{leave_id}_"
        f"{datetime.now().strftime('%Y%m%d%H%M%S')}_"
        f"{safe_name}"
    )

    file_path = UPLOAD_DIR / filename

    content = await file.read()

    with open(
        file_path,
        "wb",
    ) as output:
        output.write(content)

    leave.proof_file = filename
    leave.proof_uploaded_at = datetime.now()
    leave.proof_status = "Uploaded"
    leave.ai_proof_status = "Checking"

    db.commit()

    # --------------------------------------------------------
    # Simple AI/OCR verification
    # --------------------------------------------------------

    ocr_text = ""

    try:
        import pytesseract
        from PIL import Image

        if os.path.exists(TESSERACT_PATH):
            pytesseract.pytesseract.tesseract_cmd = (
                TESSERACT_PATH
            )

        if extension in [
            ".png",
            ".jpg",
            ".jpeg",
        ]:
            image = Image.open(
                file_path
            )

            ocr_text = pytesseract.image_to_string(
                image
            )

        elif extension == ".pdf":
            ocr_text = (
                "PDF uploaded successfully. "
                "Document available for verification."
            )

    except Exception:
        ocr_text = ""

    leave.ocr_text = ocr_text

    if ocr_text.strip():
        leave.ai_proof_status = "Verified"
        leave.ai_reason = (
            "Proof uploaded and text extracted "
            "successfully."
        )
        leave.ai_confidence = 90.0
        leave.proof_status = "AI Verified"
    else:
        leave.ai_proof_status = "Checking"
        leave.ai_reason = (
            "Proof uploaded. Manual verification "
            "may be required."
        )
        leave.ai_confidence = 60.0
        leave.proof_status = "Uploaded"

    db.commit()
    db.refresh(leave)

    return {
        "success": True,
        "message": "Proof uploaded successfully.",
        "leave": leave_to_dict(
            leave,
            db,
        ),
    }


# ============================================================
# DOWNLOAD PROOF
# ============================================================

@app.get("/leave/{leave_id}/proof")
def download_leave_proof(
    leave_id: int,
    db: Session = Depends(get_db),
):
    leave = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id
        )
        .first()
    )

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found.",
        )

    if not leave.proof_file:
        raise HTTPException(
            status_code=404,
            detail="No proof file uploaded.",
        )

    file_path = UPLOAD_DIR / leave.proof_file

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Proof file not found.",
        )

    return FileResponse(
        path=file_path,
        filename=file_path.name,
    )


# ============================================================
# EXAM SCHEDULE
# ============================================================

@app.get("/exam-schedule")
def get_exam_schedule(
    db: Session = Depends(get_db),
):
    exams = (
        db.query(ExamSchedule)
        .order_by(
            ExamSchedule.exam_from_date.asc()
        )
        .all()
    )

    return [
        {
            "id": exam.id,
            "exam_name": "Semester Examination",
            "exam_from_date": str(
                exam.exam_from_date
            ),
            "exam_to_date": str(
                exam.exam_to_date
            ),
            "updated_by": exam.updated_by,
        }
        for exam in exams
    ]


@app.post("/exam-schedule")
def create_exam_schedule(
    data: ExamCreate,
    db: Session = Depends(get_db),
):
    if data.exam_to_date < data.exam_from_date:
        raise HTTPException(
            status_code=400,
            detail=(
                "Exam to-date cannot be before "
                "exam from-date."
            ),
        )

    exam = ExamSchedule(
        exam_from_date=data.exam_from_date,
        exam_to_date=data.exam_to_date,
        updated_by="System",
    )

    db.add(exam)
    db.commit()
    db.refresh(exam)

    return {
        "success": True,
        "message": "Exam schedule saved.",
        "exam": {
            "id": exam.id,
            "exam_name": (
                data.exam_name
                or "Semester Examination"
            ),
            "exam_from_date": str(
                exam.exam_from_date
            ),
            "exam_to_date": str(
                exam.exam_to_date
            ),
            "updated_by": exam.updated_by,
        },
    }


@app.delete("/exam-schedule/{exam_id}")
def delete_exam_schedule(
    exam_id: int,
    db: Session = Depends(get_db),
):
    exam = (
        db.query(ExamSchedule)
        .filter(
            ExamSchedule.id == exam_id
        )
        .first()
    )

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam schedule not found.",
        )

    db.delete(exam)
    db.commit()

    return {
        "success": True,
        "message": "Exam schedule deleted.",
    }


# Aliases for exam schedule
@app.get("/exams")
def get_exams_alias(db: Session = Depends(get_db)):
    return get_exam_schedule(db=db)


@app.post("/exams")
def create_exam_alias(data: ExamCreate, db: Session = Depends(get_db)):
    return create_exam_schedule(data=data, db=db)


@app.delete("/exams/{exam_id}")
def delete_exam_alias(exam_id: int, db: Session = Depends(get_db)):
    return delete_exam_schedule(exam_id=exam_id, db=db)


# ============================================================
# STATISTICS
# ============================================================

@app.get("/statistics")
def statistics(
    db: Session = Depends(get_db),
):
    students_count = db.query(Student).count()
    parents_count = db.query(Parent).count()

    leaves = (
        db.query(LeaveRequest)
        .all()
    )

    pending = 0
    approved = 0
    rejected = 0

    for leave in leaves:
        status = get_leave_status(leave)

        if status == "Approved":
            approved += 1

        elif "Rejected" in status:
            rejected += 1

        else:
            pending += 1

    return {
        "students": students_count,
        "parents": parents_count,
        "advisors": len(
            ADVISOR_ACCOUNTS
        ),
        "sections": len(
            ADVISOR_ACCOUNTS
        ),
        "total_leaves": len(leaves),
        "pending_leaves": pending,
        "approved_leaves": approved,
        "rejected_leaves": rejected,
    }


@app.get("/statistics/sections")
def section_statistics(
    db: Session = Depends(get_db),
):
    result = []
    for advisor in ADVISOR_ACCOUNTS:
        year = advisor["year"]
        section = advisor["section"]
        students = (
            db.query(Student)
            .filter(
                Student.year == year,
                Student.section == section,
            )
            .all()
        )
        count = len(students)
        avg_att = (
            round(sum(float(s.attendance or 0) for s in students) / count, 1)
            if count > 0
            else 0.0
        )
        low_att = sum(
            1 for s in students if float(s.attendance or 0) < TARGET_ATTENDANCE
        )
        result.append({
            "year": year,
            "section": section,
            "class_name": f"{year} {section}",
            "advisor_name": advisor["name"],
            "advisor_email": advisor["email"],
            "student_count": count,
            "average_attendance": avg_att,
            "low_attendance_count": low_att,
        })
    return result


# ============================================================
# STUDENT REPORT
# ============================================================

def build_student_report_text(
    student,
    leaves,
):
    advisor = get_advisor_for_student(
        student
    )

    lines = []

    lines.append(
        "STUD LMS - STUDENT REPORT"
    )
    lines.append("=" * 50)
    lines.append("")
    lines.append(
        f"Student Name   : {student.name}"
    )
    lines.append(
        f"Register Number: {student.register_number}"
    )
    lines.append(
        f"Department     : {student.department}"
    )
    lines.append(
        f"Year           : {student.year}"
    )
    lines.append(
        f"Section        : {student.section}"
    )
    lines.append(
        f"Attendance     : {student.attendance:.1f}%"
    )

    if advisor:
        lines.append(
            f"Advisor        : {advisor['name']}"
        )

    lines.append("")
    lines.append(
        "LEAVE HISTORY"
    )
    lines.append("-" * 50)

    if not leaves:
        lines.append(
            "No leave records found."
        )
    else:
        for leave in leaves:
            lines.append(
                f"Leave ID       : {leave.id}"
            )
            lines.append(
                f"Leave Type     : {leave.leave_type}"
            )
            lines.append(
                f"From Date      : {leave.from_date}"
            )
            lines.append(
                f"To Date        : {leave.to_date}"
            )
            lines.append(
                f"Status         : {get_leave_status(leave)}"
            )
            lines.append(
                f"Advisor Status : {leave.advisor_status}"
            )
            lines.append(
                f"HOD Status     : {leave.hod_status}"
            )
            lines.append(
                f"VP Status      : {leave.vp_status}"
            )
            lines.append(
                f"Reason         : {leave.reason}"
            )
            lines.append("-" * 50)

    return "\n".join(lines)


@app.get("/student/{student_id}/report")
def student_report(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    leaves = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.student_id
            == student_id
        )
        .order_by(
            LeaveRequest.id.desc()
        )
        .all()
    )

    report = build_student_report_text(
        student,
        leaves,
    )

    report_dir = (
        Path(__file__).resolve().parent.parent
        / "reports"
    )

    report_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    filename = (
        f"student_report_"
        f"{student.register_number}.txt"
    )

    path = report_dir / filename

    with open(
        path,
        "w",
        encoding="utf-8",
    ) as file:
        file.write(report)

    return FileResponse(
        path=path,
        filename=filename,
        media_type="text/plain",
    )


# ============================================================
# ALL STUDENTS REPORT
# ============================================================

@app.get("/reports/students")
def all_students_report(
    advisor_email: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Student)

    if advisor_email:
        advisor = None

        for item in ADVISOR_ACCOUNTS:
            if (
                item["email"].lower()
                == advisor_email.strip().lower()
            ):
                advisor = item
                break

        if not advisor:
            raise HTTPException(
                status_code=404,
                detail="Advisor not found.",
            )

        query = query.filter(
            Student.year == advisor["year"],
            Student.section == advisor["section"],
        )

    students = (
        query
        .order_by(
            Student.register_number
        )
        .all()
    )

    lines = []

    lines.append(
        "STUD LMS - STUDENT REPORT"
    )
    lines.append("=" * 80)
    lines.append("")

    for student in students:
        advisor = get_advisor_for_student(
            student
        )

        lines.append(
            f"Name       : {student.name}"
        )
        lines.append(
            f"Register No: {student.register_number}"
        )
        lines.append(
            f"Department : {student.department}"
        )
        lines.append(
            f"Year       : {student.year}"
        )
        lines.append(
            f"Section    : {student.section}"
        )
        lines.append(
            f"Attendance : {student.attendance:.1f}%"
        )

        if advisor:
            lines.append(
                f"Advisor    : {advisor['name']}"
            )

        lines.append("-" * 80)

    if not students:
        lines.append(
            "No student records found."
        )

    report_dir = (
        Path(__file__).resolve().parent.parent
        / "reports"
    )

    report_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    filename = "students_report.txt"
    path = report_dir / filename

    with open(
        path,
        "w",
        encoding="utf-8",
    ) as file:
        file.write(
            "\n".join(lines)
        )

    return FileResponse(
        path=path,
        filename=filename,
        media_type="text/plain",
    )


# ============================================================
# DELETE STUDENT
# ============================================================

@app.delete("/student/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    db.query(Notification).filter(
        Notification.student_id
        == student.id
    ).delete(
        synchronize_session=False
    )

    db.query(LeaveRequest).filter(
        LeaveRequest.student_id
        == student.id
    ).delete(
        synchronize_session=False
    )

    db.query(Parent).filter(
        Parent.student_id
        == student.id
    ).delete(
        synchronize_session=False
    )

    db.delete(student)
    db.commit()

    return {
        "success": True,
        "message": "Student deleted.",
    }


# ============================================================
# DEBUG / DATA COUNTS
# ============================================================

@app.get("/data-summary")
def data_summary(
    db: Session = Depends(get_db),
):
    return {
        "students": db.query(Student).count(),
        "parents": db.query(Parent).count(),
        "leave_requests": db.query(LeaveRequest).count(),
        "notifications": db.query(Notification).count(),
        "exam_schedules": db.query(ExamSchedule).count(),
        "advisors": len(ADVISOR_ACCOUNTS),
    }