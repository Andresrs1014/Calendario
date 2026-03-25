from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..db.database import get_db
from ..sync.moodle import MoodleSync
from typing import Dict, Any

router = APIRouter(prefix="/sync", tags=["sync"])

class SyncRequest(BaseModel):
    session_cookie: str
    sesskey: str

@router.post("/moodle")
def sync_moodle(req: SyncRequest, db: Session = Depends(get_db)):
    """Trigger a Moodle sync with provided credentials."""
    try:
        syncer = MoodleSync(db, req.session_cookie, req.sesskey)
        result = syncer.sync()
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
