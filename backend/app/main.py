from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import Base, engine
import app.models  # noqa: F401

from app.routers import auth, users, cities, trips, stops, budget, packing, notes, share, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Travelloop API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(cities.router)
app.include_router(trips.router)
app.include_router(stops.router)
app.include_router(budget.router)
app.include_router(packing.router)
app.include_router(notes.router)
app.include_router(share.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "Travelloop API is running"}
