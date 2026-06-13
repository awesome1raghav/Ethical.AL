from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List

from ..core.mission_state import MissionEvent, MissionEventType, utc_now_iso
from ._db import get_default_db_path, open_db


logger = logging.getLogger(__name__)


class AuditStore:
    def __init__(self, db_path: Path | None = None) -> None:
        self.db_path = db_path or get_default_db_path()

    def record(self, mission_id: str, event_type: MissionEventType | str, message: str, details: Dict[str, Any] | None = None) -> None:
        event = MissionEvent(
            mission_id=mission_id,
            event_type=event_type if isinstance(event_type, MissionEventType) else MissionEventType(event_type),
            message=message,
            details=details or {},
            created_at=utc_now_iso(),
        )
        from .mission_store import MissionStore

        MissionStore(self.db_path).save_event(event)

    def tail(self, mission_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        with open_db(self.db_path) as connection:
            rows = connection.execute("SELECT * FROM audit_events WHERE mission_id = ? ORDER BY created_at DESC, id DESC LIMIT ?", (mission_id, limit)).fetchall()
            return [
                {
                    "mission_id": row["mission_id"],
                    "event_type": row["event_type"],
                    "message": row["message"],
                    "details": row["details_json"],
                    "created_at": row["created_at"],
                }
                for row in rows
            ]
