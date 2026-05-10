from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import Base, engine
import app.models  # noqa: F401 — registers all models with Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Travelloop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Travelloop API is running"}
