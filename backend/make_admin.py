"""
Usage: py make_admin.py your@email.com
"""
import sys
from app.database.db import SessionLocal
from app.models.user import User

if len(sys.argv) < 2:
    print("Usage: py make_admin.py <email>")
    sys.exit(1)

email = sys.argv[1]
db = SessionLocal()
user = db.query(User).filter(User.email == email).first()
if not user:
    print(f"No user found with email: {email}")
else:
    user.is_admin = True
    db.commit()
    print(f"✅ {user.name} ({user.email}) is now an admin.")
db.close()
