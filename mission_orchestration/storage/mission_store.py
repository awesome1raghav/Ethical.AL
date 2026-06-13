from __future__ import annotations

import json
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..core.mission_state import AgentHeartbeat, MissionCheckpoint, MissionEvent, MissionState, MissionStatus, MissionStep, StepStatus
from ._db import get_default_db_path, open_db


logger = logging.getLogger(__name__)


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _parse_json(value: str | None, default: Any) -> Any:
    if value is None or value == "":
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


class MissionStore:
    def __init__(self, db_path: Path | None = None) -> None:
        self.db_path = db_path or get_default_db_path()
        self._lock = threading.RLock()
        self._initialize_schema()

    def _initialize_schema(self) -> None:
        with open_db(self.db_path) as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS missions (
                    id TEXT PRIMARY KEY,
                    description TEXT NOT NULL,
                    primary_intent TEXT NOT NULL,
                    status TEXT NOT NULL,
                    current_step INTEGER NOT NULL,
                    retry_count INTEGER NOT NULL,
                    max_retries INTEGER NOT NULL,
                    mission_timeout_seconds INTEGER NOT NULL,
                    agent_timeout_seconds INTEGER NOT NULL,
                    heartbeat_timeout_seconds INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    started_at TEXT,
                    completed_at TEXT,
                    cancelled_at TEXT,
                    last_error TEXT,
                    metadata_json TEXT NOT NULL,
                    agent_state_json TEXT NOT NULL,
                    completed_steps_json TEXT NOT NULL,
                    failed_steps_json TEXT NOT NULL,
                    partial_results_json TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS mission_steps (
                    id TEXT PRIMARY KEY,
                    mission_id TEXT NOT NULL,
                    step_index INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    assigned_agent_id TEXT NOT NULL,
                    is_legal INTEGER NOT NULL,
                    legality_reason TEXT NOT NULL,
                    dependencies_json TEXT NOT NULL,
                    status TEXT NOT NULL,
                    retries INTEGER NOT NULL,
                    result_json TEXT NOT NULL,
                    started_at TEXT,
                    completed_at TEXT,
                    failed_at TEXT,
                    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS heartbeats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mission_id TEXT NOT NULL,
                    agent TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    status TEXT NOT NULL,
                    progress INTEGER NOT NULL,
                    current_step INTEGER NOT NULL,
                    retry_count INTEGER NOT NULL,
                    elapsed_time INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS checkpoints (
                    mission_id TEXT PRIMARY KEY,
                    current_step INTEGER NOT NULL,
                    progress REAL NOT NULL,
                    completed_steps_json TEXT NOT NULL,
                    agent_state_json TEXT NOT NULL,
                    partial_results_json TEXT NOT NULL,
                    retry_count INTEGER NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS audit_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mission_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    details_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
                CREATE INDEX IF NOT EXISTS idx_mission_steps_mission ON mission_steps(mission_id, step_index);
                CREATE INDEX IF NOT EXISTS idx_heartbeats_mission_agent ON heartbeats(mission_id, agent, timestamp DESC);
                CREATE INDEX IF NOT EXISTS idx_checkpoints_mission ON checkpoints(mission_id, updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_audit_events_mission ON audit_events(mission_id, created_at DESC);
                """
            )

    def create_mission(self, mission: MissionState) -> None:
        with self._lock, open_db(self.db_path) as connection:
            connection.execute(
                """
                INSERT INTO missions (
                    id, description, primary_intent, status, current_step, retry_count,
                    max_retries, mission_timeout_seconds, agent_timeout_seconds,
                    heartbeat_timeout_seconds, created_at, updated_at, started_at,
                    completed_at, cancelled_at, last_error, metadata_json, agent_state_json,
                    completed_steps_json, failed_steps_json, partial_results_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    mission.mission_id,
                    mission.description,
                    mission.primary_intent,
                    mission.status.value,
                    mission.current_step,
                    mission.retry_count,
                    mission.max_retries,
                    mission.mission_timeout_seconds,
                    mission.agent_timeout_seconds,
                    mission.heartbeat_timeout_seconds,
                    mission.created_at,
                    mission.updated_at,
                    mission.started_at,
                    mission.completed_at,
                    mission.cancelled_at,
                    mission.last_error,
                    _json(mission.metadata),
                    _json(mission.agent_state),
                    _json(mission.completed_steps),
                    _json(mission.failed_steps),
                    _json(mission.partial_results),
                ),
            )
            for step in mission.workflow_steps:
                connection.execute(
                    """
                    INSERT INTO mission_steps (
                        id, mission_id, step_index, name, assigned_agent_id, is_legal,
                        legality_reason, dependencies_json, status, retries, result_json,
                        started_at, completed_at, failed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        f"{mission.mission_id}:step:{step.index}",
                        mission.mission_id,
                        step.index,
                        step.name,
                        step.assigned_agent_id,
                        1 if step.is_legal else 0,
                        step.legality_reason,
                        _json(step.dependencies),
                        step.status.value,
                        step.retries,
                        _json(step.result),
                        step.started_at,
                        step.completed_at,
                        step.failed_at,
                    ),
                )

    def get_mission(self, mission_id: str) -> Optional[MissionState]:
        with open_db(self.db_path) as connection:
            row = connection.execute("SELECT * FROM missions WHERE id = ?", (mission_id,)).fetchone()
            if row is None:
                return None
            step_rows = connection.execute("SELECT * FROM mission_steps WHERE mission_id = ? ORDER BY step_index ASC", (mission_id,)).fetchall()
            return self._row_to_mission(row, step_rows)

    def list_running_missions(self) -> List[MissionState]:
        with open_db(self.db_path) as connection:
            rows = connection.execute(
                "SELECT * FROM missions WHERE status IN (?, ?, ?) ORDER BY updated_at ASC",
                (MissionStatus.RUNNING.value, MissionStatus.RETRYING.value, MissionStatus.QUEUED.value),
            ).fetchall()
            missions: List[MissionState] = []
            for row in rows:
                step_rows = connection.execute("SELECT * FROM mission_steps WHERE mission_id = ? ORDER BY step_index ASC", (row["id"],)).fetchall()
                missions.append(self._row_to_mission(row, step_rows))
            return missions

    def update_mission(self, mission_id: str, **updates: Any) -> None:
        field_map = {
            "status": "status",
            "current_step": "current_step",
            "retry_count": "retry_count",
            "last_error": "last_error",
            "completed_steps": "completed_steps_json",
            "failed_steps": "failed_steps_json",
            "partial_results": "partial_results_json",
            "agent_state": "agent_state_json",
            "started_at": "started_at",
            "completed_at": "completed_at",
            "cancelled_at": "cancelled_at",
            "updated_at": "updated_at",
        }
        assignments: List[str] = []
        values: List[Any] = []
        for key, value in updates.items():
            column = field_map.get(key)
            if column is None:
                continue
            assignments.append(f"{column} = ?")
            if column in {"completed_steps_json", "failed_steps_json", "partial_results_json", "agent_state_json"}:
                values.append(_json(value))
            elif column == "status" and hasattr(value, "value"):
                values.append(value.value)
            else:
                values.append(value)

        if not assignments:
            return

        assignments.append("updated_at = ?")
        values.append(updates.get("updated_at") or datetime.now(timezone.utc).isoformat())
        values.append(mission_id)
        with self._lock, open_db(self.db_path) as connection:
            connection.execute(f"UPDATE missions SET {', '.join(assignments)} WHERE id = ?", values)

    def update_step(self, step_id: str, **updates: Any) -> None:
        field_map = {
            "status": "status",
            "retries": "retries",
            "result": "result_json",
            "started_at": "started_at",
            "completed_at": "completed_at",
            "failed_at": "failed_at",
        }
        assignments: List[str] = []
        values: List[Any] = []
        for key, value in updates.items():
            column = field_map.get(key)
            if column is None:
                continue
            assignments.append(f"{column} = ?")
            if column == "status" and hasattr(value, "value"):
                values.append(value.value)
            elif column == "result_json":
                values.append(_json(value))
            else:
                values.append(value)
        if not assignments:
            return
        values.append(step_id)
        with self._lock, open_db(self.db_path) as connection:
            connection.execute(f"UPDATE mission_steps SET {', '.join(assignments)} WHERE id = ?", values)

    def save_heartbeat(self, heartbeat: AgentHeartbeat) -> None:
        with self._lock, open_db(self.db_path) as connection:
            connection.execute(
                """
                INSERT INTO heartbeats (
                    mission_id, agent, timestamp, status, progress, current_step,
                    retry_count, elapsed_time, message
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    heartbeat.mission_id,
                    heartbeat.agent,
                    heartbeat.timestamp,
                    heartbeat.status,
                    heartbeat.progress,
                    heartbeat.current_step,
                    heartbeat.retry_count,
                    heartbeat.elapsed_time,
                    heartbeat.message,
                ),
            )

    def get_latest_heartbeat(self, mission_id: str, agent: str | None = None) -> Optional[AgentHeartbeat]:
        with open_db(self.db_path) as connection:
            if agent is None:
                row = connection.execute("SELECT * FROM heartbeats WHERE mission_id = ? ORDER BY timestamp DESC, id DESC LIMIT 1", (mission_id,)).fetchone()
            else:
                row = connection.execute("SELECT * FROM heartbeats WHERE mission_id = ? AND agent = ? ORDER BY timestamp DESC, id DESC LIMIT 1", (mission_id, agent)).fetchone()
            if row is None:
                return None
            return AgentHeartbeat(
                mission_id=row["mission_id"],
                agent=row["agent"],
                timestamp=row["timestamp"],
                status=row["status"],
                progress=int(row["progress"]),
                current_step=int(row["current_step"]),
                retry_count=int(row["retry_count"]),
                elapsed_time=int(row["elapsed_time"]),
                message=row["message"],
            )

    def save_checkpoint(self, checkpoint: MissionCheckpoint) -> None:
        with self._lock, open_db(self.db_path) as connection:
            connection.execute(
                """
                INSERT INTO checkpoints (
                    mission_id, current_step, progress, completed_steps_json,
                    agent_state_json, partial_results_json, retry_count, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(mission_id) DO UPDATE SET
                    current_step = excluded.current_step,
                    progress = excluded.progress,
                    completed_steps_json = excluded.completed_steps_json,
                    agent_state_json = excluded.agent_state_json,
                    partial_results_json = excluded.partial_results_json,
                    retry_count = excluded.retry_count,
                    updated_at = excluded.updated_at
                """,
                (
                    checkpoint.mission_id,
                    checkpoint.current_step,
                    checkpoint.progress,
                    _json(checkpoint.completed_steps),
                    _json(checkpoint.agent_state),
                    _json(checkpoint.partial_results),
                    checkpoint.retry_count,
                    checkpoint.updated_at,
                ),
            )

    def load_latest_checkpoint(self, mission_id: str) -> Optional[MissionCheckpoint]:
        with open_db(self.db_path) as connection:
            row = connection.execute("SELECT * FROM checkpoints WHERE mission_id = ? ORDER BY updated_at DESC LIMIT 1", (mission_id,)).fetchone()
            if row is None:
                return None
            return MissionCheckpoint(
                mission_id=row["mission_id"],
                current_step=int(row["current_step"]),
                progress=float(row["progress"]),
                completed_steps=_parse_json(row["completed_steps_json"], []),
                agent_state=_parse_json(row["agent_state_json"], {}),
                partial_results=_parse_json(row["partial_results_json"], []),
                retry_count=int(row["retry_count"]),
                updated_at=row["updated_at"],
            )

    def save_event(self, event: MissionEvent) -> None:
        with self._lock, open_db(self.db_path) as connection:
            connection.execute(
                """
                INSERT INTO audit_events (mission_id, event_type, message, details_json, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (event.mission_id, event.event_type.value, event.message, _json(event.details), event.created_at),
            )
        logger.info(_json({"event": event.event_type.value, "mission_id": event.mission_id, "message": event.message}))

    def tail_events(self, mission_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        with open_db(self.db_path) as connection:
            rows = connection.execute("SELECT * FROM audit_events WHERE mission_id = ? ORDER BY created_at DESC, id DESC LIMIT ?", (mission_id, limit)).fetchall()
            return [
                {
                    "mission_id": row["mission_id"],
                    "event_type": row["event_type"],
                    "message": row["message"],
                    "details": _parse_json(row["details_json"], {}),
                    "created_at": row["created_at"],
                }
                for row in rows
            ]

    def search_related_text(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        like = f"%{query.lower()}%"
        with open_db(self.db_path) as connection:
            rows = connection.execute(
                "SELECT id, description, primary_intent, status FROM missions WHERE lower(description) LIKE ? OR lower(primary_intent) LIKE ? ORDER BY updated_at DESC LIMIT ?",
                (like, like, limit),
            ).fetchall()
            return [
                {
                    "id": row["id"],
                    "title": row["primary_intent"],
                    "snippet": row["description"],
                    "status": row["status"],
                }
                for row in rows
            ]

    def _row_to_mission(self, row: Any, step_rows: List[Any]) -> MissionState:
        return MissionState(
            mission_id=row["id"],
            description=row["description"],
            primary_intent=row["primary_intent"],
            status=MissionStatus(row["status"]),
            current_step=int(row["current_step"]),
            retry_count=int(row["retry_count"]),
            max_retries=int(row["max_retries"]),
            mission_timeout_seconds=int(row["mission_timeout_seconds"]),
            agent_timeout_seconds=int(row["agent_timeout_seconds"]),
            heartbeat_timeout_seconds=int(row["heartbeat_timeout_seconds"]),
            workflow_steps=[
                MissionStep(
                    index=int(step_row["step_index"]),
                    name=step_row["name"],
                    assigned_agent_id=step_row["assigned_agent_id"],
                    is_legal=bool(step_row["is_legal"]),
                    legality_reason=step_row["legality_reason"],
                    dependencies=_parse_json(step_row["dependencies_json"], []),
                    status=StepStatus(step_row["status"]),
                    retries=int(step_row["retries"]),
                    result=_parse_json(step_row["result_json"], {}),
                    started_at=step_row["started_at"],
                    completed_at=step_row["completed_at"],
                    failed_at=step_row["failed_at"],
                )
                for step_row in step_rows
            ],
            completed_steps=_parse_json(row["completed_steps_json"], []),
            failed_steps=_parse_json(row["failed_steps_json"], []),
            partial_results=_parse_json(row["partial_results_json"], []),
            agent_state=_parse_json(row["agent_state_json"], {}),
            metadata=_parse_json(row["metadata_json"], {}),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            started_at=row["started_at"],
            completed_at=row["completed_at"],
            cancelled_at=row["cancelled_at"],
            last_error=row["last_error"],
        )
