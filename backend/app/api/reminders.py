"""
API router for Reminders — create, list, and delete personal reminders.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Reminder

router = APIRouter(prefix="/reminders", tags=["reminders"])


class ReminderCreate(BaseModel):
    title: str
    description: str = ""
    remind_at: datetime
    activity_id: Optional[int] = None


class ReminderOut(BaseModel):
    id: int
    title: str
    description: str
    remind_at: datetime
    is_triggered: bool
    created_at: datetime
    activity_id: Optional[int]


@router.get("", response_model=List[ReminderOut])
def list_reminders(db: Session = Depends(get_db)):
    reminders = db.exec(
        select(Reminder).where(Reminder.is_triggered == False).order_by(Reminder.remind_at)
    ).all()
    return reminders


@router.post("", response_model=ReminderOut, status_code=201)
def create_reminder(data: ReminderCreate, db: Session = Depends(get_db)):
    reminder = Reminder(
        title=data.title,
        description=data.description,
        remind_at=data.remind_at,
        activity_id=data.activity_id,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.patch("/{reminder_id}", response_model=ReminderOut)
def update_reminder(reminder_id: int, is_triggered: bool, db: Session = Depends(get_db)):
    reminder = db.get(Reminder, reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    reminder.is_triggered = is_triggered
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}", status_code=204)
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    reminder = db.get(Reminder, reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(reminder)
    db.commit()
