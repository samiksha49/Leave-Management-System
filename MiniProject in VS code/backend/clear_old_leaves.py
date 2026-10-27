from app.database import SessionLocal
from app.models import LeaveRequest

db = SessionLocal()

try:
    count = db.query(LeaveRequest).delete()
    db.commit()
    print(f"SUCCESS: Removed {count} old leave records.")
finally:
    db.close()