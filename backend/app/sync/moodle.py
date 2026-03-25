import requests
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlmodel import select
from ..db.models import Subject, Activity, SyncLog

class MoodleSync:
    BASE_URL = "https://campusvirtual.ibero.edu.co/lib/ajax/service.php"

    def __init__(self, db: Session, session_cookie: str, sesskey: str):
        self.db = db
        self.session_cookie = session_cookie
        self.sesskey = sesskey
        self.headers = {
            "Cookie": f"MoodleSession={session_cookie}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    def fetch_events(self, timesortfrom: int = 0) -> List[Dict[str, Any]]:
        """Fetch timeline events from Moodle AJAX service."""
        print(f"MoodleSync: Iniciando fetch_events (sesskey={self.sesskey[:5]}...)")
        payload = [{
            "index": 0,
            "methodname": "core_calendar_get_action_events_by_timesort",
            "args": {
                "timesortfrom": timesortfrom,
                "limitnum": 50
            }
        }]
        
        url = f"{self.BASE_URL}?sesskey={self.sesskey}"
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            if data[0].get("error"):
                print(f"MoodleSync: Error de API - {data[0]['exception']}")
                raise Exception(f"Moodle API Error: {data[0]['exception']}")
            print(f"MoodleSync: Recibidos {len(data[0]['data']['events'])} eventos")
            return data[0]["data"]["events"]
        return []

    def fetch_grades(self, course_id: int) -> List[Dict[str, Any]]:
        """Fetch gradebook for a specific course."""
        print(f"MoodleSync: Buscando notas para materia {course_id}")
        payload = [{
            "index": 0,
            "methodname": "gradereport_user_get_grades_table",
            "args": {"courseid": course_id}
        }]
        url = f"{self.BASE_URL}?sesskey={self.sesskey}"
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        data = response.json()
        if isinstance(data, list) and len(data) > 0 and not data[0].get("error"):
            # The grades are inside a nested structure in 'tables'
            return data[0]["data"]["tables"]
        return []

    def sync(self) -> Dict[str, Any]:
        """Run the full sync process."""
        print("MoodleSync: Iniciando proceso de sincronización completo...")
        start_time = datetime.now()
        stats = {"new": 0, "updated": 0, "subjects": 0, "graded_items": []}
        
        try:
            events = self.fetch_events()
            
            # Map activities for grade lookup later
            course_activities: Dict[int, List[Activity]] = {}
            
            for event in events:
                # 1. Subject extraction
                course_name = event["course"]["fullname"]
                course_short = event["course"]["shortname"]
                moodle_course_id = event["course"]["id"]
                
                subject = self.db.exec(select(Subject).where(Subject.name == course_name)).first()
                if not subject:
                    subject = Subject(name=course_name, short_name=course_short.split(" ")[0], color="#4f8ef7", instructor="Por definir")
                    self.db.add(subject)
                    self.db.commit()
                    self.db.refresh(subject)
                    stats["subjects"] += 1
                
                # 2. Activity extraction
                moodle_id = event["instance"]
                activity_name = event["name"]
                deadline = datetime.fromtimestamp(event["timesort"])
                act_type = "quiz" if "quiz" in event["modulename"] else "task"
                
                activity = self.db.exec(select(Activity).where(Activity.moodle_id == moodle_id)).first()
                if not activity:
                    activity = Activity(subject_id=subject.id, moodle_id=moodle_id, name=activity_name, activity_type=act_type, deadline=deadline)
                    self.db.add(activity)
                    stats["new"] += 1
                else:
                    if activity.deadline != deadline:
                        activity.deadline = deadline
                        stats["updated"] += 1
                
                if moodle_course_id not in course_activities:
                    course_activities[moodle_course_id] = []
                course_activities[moodle_course_id].append(activity)

            # 3. Grade Sync
            for m_course_id, activities in course_activities.items():
                try:
                    tables = self.fetch_grades(m_course_id)
                    for table in tables:
                        for row in table.get("tabledata", []):
                            # Moodle grade table rows are complex. We look for 'itemname' and 'grade'
                            item_name_data = row.get("itemname", {})
                            if not item_name_data: continue
                            
                            # Match by name (simplest way in Moodle AJAX gradebook)
                            item_name_html = item_name_data.get("content", "")
                            # Remove HTML tags to match
                            clean_name = re.sub('<[^<]+?>', '', item_name_html).strip()
                            
                            for act in activities:
                                if clean_name in act.name or act.name in clean_name:
                                    grade_text = row.get("grade", {}).get("content", "-")
                                    # Clean grade text (e.g. "4.50")
                                    try:
                                        new_grade = float(re.findall(r"\d+\.\d+|\d+", grade_text)[0])
                                        if act.grade is None and new_grade is not None:
                                            stats["graded_items"].append({"name": act.name, "grade": new_grade})
                                        act.grade = new_grade
                                    except:
                                        pass
                except Exception as ge:
                    print(f"MoodleSync: Error fetching grades for course {m_course_id}: {ge}")

            self.db.commit()
            
            # Log sync
            log = SyncLog(sync_type="moodle", status="success", items_synced=stats["new"] + stats["updated"], details=f"Nuevas: {stats['new']}, Actualizadas: {stats['updated']}, Calificadas: {len(stats['graded_items'])}")
            self.db.add(log)
            self.db.commit()
            
            return {"status": "success", "stats": stats, "duration": (datetime.now() - start_time).total_seconds()}
            
        except Exception as e:
            self.db.rollback()
            self.db.add(SyncLog(sync_type="moodle", status="failed", error_msg=str(e)))
            self.db.commit()
            raise e
