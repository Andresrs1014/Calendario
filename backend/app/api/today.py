"""
API router for the "Today" view — aggregates everything relevant for the current day.
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Subject, Activity, Session as ClassSession, Reminder, ActivityStatus

router = APIRouter(prefix="/today", tags=["today"])


class TodaySession(BaseModel):
    subject_name: str
    subject_color: str
    hour: int
    minute: int
    duration_hours: float
    session_type: str


class TodayActivity(BaseModel):
    id: int
    name: str
    activity_type: str
    status: str
    priority: str
    deadline: Optional[datetime]
    subject_name: str
    subject_color: str
    days_remaining: Optional[int]


class TodayReminder(BaseModel):
    id: int
    title: str
    description: str
    remind_at: datetime


class TodayView(BaseModel):
    date: str
    day_name: str
    classes_today: List[TodaySession]
    upcoming_deadlines: List[TodayActivity]
    overdue: List[TodayActivity]
    reminders_today: List[TodayReminder]
    semester_progress: float  # percentage


DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]


@router.get("", response_model=TodayView)
def get_today(db: Session = Depends(get_db)):
    now = datetime.now()
    today_dow = now.weekday()
    # Python weekday: 0=Mon. We need 0=Sun to match our data.
    dow = (now.isoweekday() % 7)  # 0=Sun, 1=Mon, ..., 6=Sat

    # Classes today
    sessions = db.exec(select(ClassSession).where(ClassSession.day_of_week == dow)).all()
    classes_today = []
    for s in sessions:
        subj = db.get(Subject, s.subject_id)
        classes_today.append(TodaySession(
            subject_name=subj.name if subj else "Unknown",
            subject_color=subj.color if subj else "#666",
            hour=s.hour,
            minute=s.minute,
            duration_hours=s.duration_hours,
            session_type=s.session_type,
        ))
    classes_today.sort(key=lambda x: (x.hour, x.minute))

    # Upcoming deadlines (next 7 days, pending only)
    week_ahead = now + timedelta(days=7)
    upcoming_query = select(Activity).where(
        Activity.status != ActivityStatus.COMPLETED,
        Activity.deadline != None,
        Activity.deadline > now,
        Activity.deadline <= week_ahead,
    ).order_by(Activity.deadline)
    upcoming = db.exec(upcoming_query).all()

    upcoming_list = []
    for a in upcoming:
        days_rem = (a.deadline - now).days if a.deadline else None
        upcoming_list.append(TodayActivity(
            id=a.id, name=a.name, activity_type=a.activity_type,
            status=a.status, priority=a.priority, deadline=a.deadline,
            subject_name=a.subject.name if a.subject else "",
            subject_color=a.subject.color if a.subject else "#666",
            days_remaining=days_rem,
        ))

    # Overdue
    overdue_query = select(Activity).where(
        Activity.status != ActivityStatus.COMPLETED,
        Activity.deadline != None,
        Activity.deadline < now,
    ).order_by(Activity.deadline)
    overdue = db.exec(overdue_query).all()

    overdue_list = []
    for a in overdue:
        overdue_list.append(TodayActivity(
            id=a.id, name=a.name, activity_type=a.activity_type,
            status=a.status, priority=a.priority, deadline=a.deadline,
            subject_name=a.subject.name if a.subject else "",
            subject_color=a.subject.color if a.subject else "#666",
            days_remaining=None,
        ))

    # Reminders for today
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    reminders = db.exec(
        select(Reminder).where(
            Reminder.remind_at >= today_start,
            Reminder.remind_at < today_end,
            Reminder.is_triggered == False,
        )
    ).all()

    reminders_list = [
        TodayReminder(id=r.id, title=r.title, description=r.description, remind_at=r.remind_at)
        for r in reminders
    ]

    # Semester progress
    all_activities = db.exec(select(Activity)).all()
    total = len(all_activities)
    completed = sum(1 for a in all_activities if a.status == ActivityStatus.COMPLETED)
    progress = (completed / total * 100) if total > 0 else 0

    return TodayView(
        date=now.strftime("%d/%m/%Y"),
        day_name=DAYS[dow],
        classes_today=classes_today,
        upcoming_deadlines=upcoming_list,
        overdue=overdue_list,
        reminders_today=reminders_list,
        semester_progress=round(progress, 1),
    )
