import httpx
from datetime import datetime
from typing import List, Dict
import json

MOODLE_URL = "https://campusvirtual.ibero.edu.co"

class MoodleClient:
    def __init__(self, session_cookie: str):
        self.session_cookie = session_cookie
        self.headers = {
            "Cookie": f"MoodleSession={session_cookie}",
            "Content-Type": "application/json"
        }

    async def get_timeline_events(self) -> List[Dict]:
        """
        Fetches upcoming events from the Moodle Dashboard using the internal AJAX service.
        """
        url = f"{MOODLE_URL}/lib/ajax/service.php?sesskey=CAPTURED_SESSKEY" # We'll need the sesskey too, or get it from initial fetch
        
        # Example payload for Moodle's core_calendar_get_action_events_by_timesort
        payload = [
            {
                "index": 0,
                "methodname": "core_calendar_get_action_events_by_timesort",
                "args": {
                    "limitnum": 20,
                    "timesortfrom": int(datetime.now().timestamp()),
                }
            }
        ]
        
        async with httpx.AsyncClient() as client:
            try:
                # Note: In a real scenario, we might needs to first GET /my/ to grab the 'sesskey' 
                # from the HTML, as Moodle requires it for AJAX calls.
                response = await client.post(url, json=payload, headers=self.headers)
                response.raise_for_status()
                return response.json()[0]["data"]["events"]
            except Exception as e:
                print(f"Error fetching from Moodle: {e}")
                return []

    async def get_enrolled_courses(self) -> List[Dict]:
        """
        Fetches courses the user is enrolled in.
        """
        payload = [
            {
                "index": 0,
                "methodname": "core_enrol_get_users_courses",
                "args": {"userid": 0} # 0 usually means current user in Moodle
            }
        ]
        # logic similar to above...
        return []
