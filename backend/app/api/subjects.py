"""
API router for Subjects — read-only from the backend perspective.
Subjects are created via seed or Moodle sync, not manually.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Subject, Activity, Session as ClassSession, ActivityStatus

router = APIRouter(prefix="/subjects", tags=["subjects"])


class SessionOut(BaseModel):
    id: int
    day_of_week: int
    hour: int
    minute: int
    duration_hours: float
    session_type: str


class SubjectOut(BaseModel):
    id: int
    name: str
    short_name: str
    instructor: str
    color: str
    total_activities: int
    completed_activities: int
    sessions: List[SessionOut]


@router.get("", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db)):
    subjects = db.exec(select(Subject)).all()
    result = []
    for s in subjects:
        total = len(s.activities)
        completed = sum(1 for a in s.activities if a.status == ActivityStatus.COMPLETED)
        sessions = [
            SessionOut(
                id=sess.id,
                day_of_week=sess.day_of_week,
                hour=sess.hour,
                minute=sess.minute,
                duration_hours=sess.duration_hours,
                session_type=sess.session_type,
            )
            for sess in s.sessions
        ]
        result.append(SubjectOut(
            id=s.id,
            name=s.name,
            short_name=s.short_name,
            instructor=s.instructor,
            color=s.color,
            total_activities=total,
            completed_activities=completed,
            sessions=sessions,
        ))
    return result
