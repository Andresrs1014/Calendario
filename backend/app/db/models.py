from datetime import datetime
from enum import Enum
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel


class ActivityStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class ActivityType(str, Enum):
    QUIZ = "quiz"
    TASK = "task"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# ── SUBJECTS ───────────────────────────────────
class Subject(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    moodle_id: Optional[int] = Field(default=None, unique=True, index=True)
    name: str = Field(index=True)
    short_name: str = ""
    instructor: str = ""
    color: str = "#4f8ef7"

    # Relationships
    activities: List["Activity"] = Relationship(back_populates="subject")
    sessions: List["Session"] = Relationship(back_populates="subject")


# ── SESSIONS (weekly schedule) ─────────────────
class Session(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    day_of_week: int  # 0=Sun, 1=Mon, ... 6=Sat
    hour: int
    minute: int = 0
    duration_hours: float = 1.5
    session_type: str = "Clase sincrónica"  # Clase sincrónica, Monitoria, Tutoría

    subject_id: int = Field(foreign_key="subject.id")
    subject: Subject = Relationship(back_populates="sessions")


# ── ACTIVITIES ─────────────────────────────────
class Activity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    moodle_id: Optional[int] = Field(default=None, unique=True, index=True)
    name: str
    activity_type: ActivityType = ActivityType.TASK
    status: ActivityStatus = ActivityStatus.PENDING
    priority: Priority = Priority.MEDIUM
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: str = ""

    subject_id: int = Field(foreign_key="subject.id")
    subject: Subject = Relationship(back_populates="activities")

    # Moodle sync tracking
    moodle_last_modified: Optional[datetime] = None
    grade: Optional[float] = None
    max_grade: Optional[float] = None


# ── REMINDERS ──────────────────────────────────
class Reminder(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str = ""
    remind_at: datetime
    is_triggered: bool = False
    created_at: datetime = Field(default_factory=datetime.now)

    # Optional link to an activity
    activity_id: Optional[int] = Field(default=None, foreign_key="activity.id")


# ── STUDY LOG ──────────────────────────────────
class StudyLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    subject_id: int = Field(foreign_key="subject.id")
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_minutes: int = 0
    notes: str = ""


# ── SYNC LOG ───────────────────────────────────
class SyncLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    synced_at: datetime = Field(default_factory=datetime.now)
    sync_type: str = "moodle"  # moodle, manual
    status: str = "success"  # success, failed, partial
    details: str = ""
    items_synced: int = 0
    activities_added: int = 0
    activities_updated: int = 0
    error_msg: Optional[str] = None
