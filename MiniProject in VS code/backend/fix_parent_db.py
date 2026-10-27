import sqlite3

db = sqlite3.connect("stud_lms.db")

try:
    db.execute(
        "ALTER TABLE parents ADD COLUMN password VARCHAR NOT NULL DEFAULT ''"
    )
    db.commit()
    print("SUCCESS: Parent password column added.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("Parent password column already exists.")
    else:
        print("ERROR:", e)
finally:
    db.close()