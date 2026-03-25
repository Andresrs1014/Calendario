"""
API router for Study Logs — track time spent on each subject.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import StudyLog

router = APIRouter(prefix="/study-logs", tags=["study-logs"])

class StudyLogCreate(BaseModel):
    subject_id: int
    duration_minutes: int
    notes: str = ""

class StudyLogOut(BaseModel):
    id: int
    subject_id: int
    started_at: datetime
    duration_minutes: int
    notes: str

@router.post("", response_model=StudyLogOut, status_code=201)
def create_study_log(data: StudyLogCreate, db: Session = Depends(get_db)):
    log = StudyLog(
        subject_id=data.subject_id,
        started_at=datetime.now(),
        duration_minutes=data.duration_minutes,
        notes=data.notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("", response_model=List[StudyLogOut])
def list_study_logs(db: Session = Depends(get_db)):
    return db.exec(select(StudyLog).order_by(StudyLog.started_at.desc())).all()
