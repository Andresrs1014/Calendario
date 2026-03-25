from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import create_db
from app.api.subjects import router as subjects_router
from app.api.activities import router as activities_router
from app.api.reminders import router as reminders_router
from app.api.today import router as today_router
from app.api.sync import router as sync_router
from app.api.study_logs import router as study_logs_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    create_db()
    yield

app = FastAPI(
    title="Calendario Ibero API",
    version="3.0.0",
    description="Academic management backend for Ibero university calendar",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(subjects_router)
app.include_router(activities_router)
app.include_router(reminders_router)
app.include_router(today_router)
app.include_router(sync_router)
app.include_router(study_logs_router)


@app.get("/health")
def health():
    return {"status": "ok"}
