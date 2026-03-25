"""
API router for Activities — supports filtering, status updates, and notes.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Activity, ActivityStatus, Priority

router = APIRouter(prefix="/activities", tags=["activities"])


class ActivityOut(BaseModel):
    id: int
    name: str
    activity_type: str
    status: str
    priority: str
    deadline: Optional[datetime]
    completed_at: Optional[datetime]
    notes: str
    subject_id: int
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None


class ActivityUpdate(BaseModel):
    status: Optional[ActivityStatus] = None
    priority: Optional[Priority] = None
    notes: Optional[str] = None


@router.get("", response_model=List[ActivityOut])
def list_activities(
    subject_id: Optional[int] = Query(None),
    status: Optional[ActivityStatus] = Query(None),
    db: Session = Depends(get_db),
):
    query = select(Activity)
    if subject_id:
        query = query.where(Activity.subject_id == subject_id)
    if status:
        query = query.where(Activity.status == status)
    query = query.order_by(Activity.deadline)

    activities = db.exec(query).all()
    result = []
    for a in activities:
        result.append(ActivityOut(
            id=a.id,
            name=a.name,
            activity_type=a.activity_type,
            status=a.status,
            priority=a.priority,
            deadline=a.deadline,
            completed_at=a.completed_at,
            notes=a.notes,
            subject_id=a.subject_id,
            subject_name=a.subject.name if a.subject else None,
            subject_color=a.subject.color if a.subject else None,
        ))
    return result


@router.patch("/{activity_id}", response_model=ActivityOut)
def update_activity(
    activity_id: int,
    data: ActivityUpdate,
    db: Session = Depends(get_db),
):
    activity = db.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    if data.status is not None:
        activity.status = data.status
        if data.status == ActivityStatus.COMPLETED:
            activity.completed_at = datetime.now()
        elif data.status != ActivityStatus.COMPLETED:
            activity.completed_at = None

    if data.priority is not None:
        activity.priority = data.priority

    if data.notes is not None:
        activity.notes = data.notes

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return ActivityOut(
        id=activity.id,
        name=activity.name,
        activity_type=activity.activity_type,
        status=activity.status,
        priority=activity.priority,
        deadline=activity.deadline,
        completed_at=activity.completed_at,
        notes=activity.notes,
        subject_id=activity.subject_id,
        subject_name=activity.subject.name if activity.subject else None,
        subject_color=activity.subject.color if activity.subject else None,
    )
