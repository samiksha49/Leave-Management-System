from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    Date,
    DateTime,
)

from .database import Base


# ============================================================
# STUDENT
# ============================================================

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    email = Column(String, unique=True, nullable=False, index=True)

    password = Column(String, nullable=False)

    register_number = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    department = Column(String, nullable=False)

    year = Column(String, nullable=False)

    section = Column(String, nullable=False)

    attendance = Column(Float, default=0.0)


# ============================================================
# PARENT
# ============================================================

class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    email = Column(String, unique=True, nullable=False)

    password = Column(String, nullable=False)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )


# ============================================================
# LEAVE REQUEST
# ============================================================

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    leave_type = Column(String, nullable=False)

    from_date = Column(Date, nullable=False)

    to_date = Column(Date, nullable=False)

    reason = Column(String, nullable=False)

    proof_file = Column(String, nullable=True)

    proof_status = Column(
        String,
        default="Pending"
    )

    ocr_text = Column(
        String,
        nullable=True
    )

    ai_proof_status = Column(
        String,
        default="Pending"
    )

    ai_reason = Column(
        String,
        nullable=True
    )

    ai_confidence = Column(
        Float,
        nullable=True
    )

    proof_uploaded_at = Column(
        DateTime,
        nullable=True
    )

    advisor_status = Column(
        String,
        default="Pending"
    )

    hod_status = Column(
        String,
        default="Pending"
    )

    vp_status = Column(
        String,
        default="Pending"
    )

    final_status = Column(
        String,
        default="Pending"
    )


# ============================================================
# NOTIFICATION
# ============================================================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    message = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        default="Unread"
    )


# ============================================================
# EXAM SCHEDULE
# ============================================================

class ExamSchedule(Base):
    __tablename__ = "exam_schedule"

    id = Column(Integer, primary_key=True, index=True)

    exam_from_date = Column(
        Date,
        nullable=False
    )

    exam_to_date = Column(
        Date,
        nullable=False
    )

    updated_by = Column(
        String,
        nullable=False
    )