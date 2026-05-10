# Travelloop 🌍

A personalized travel planning platform built for the Odoo Hackathon.

## Tech Stack
- **Frontend**: React + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MySQL
- **Auth**: JWT

## Project Structure
```
Travelloop/
├── backend/        # FastAPI app
│   └── app/
│       ├── routers/    # API route handlers
│       ├── models/     # SQLAlchemy ORM models
│       ├── schemas/    # Pydantic schemas
│       ├── services/   # Business logic
│       ├── database/   # DB connection
│       └── utils/      # Auth, helpers
└── frontend/       # React app
    └── src/
        ├── pages/      # One file per screen
        ├── components/ # Reusable UI
        ├── services/   # API calls
        ├── context/    # Global state
        └── hooks/      # Custom hooks
```

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Database
MySQL — host: localhost, user: root, password: root, db: travelloop
