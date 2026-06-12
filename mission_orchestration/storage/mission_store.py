"""
Storage layer for mission and audit data persistence using SQLite.
"""

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from .mission_state import Checkpoint, MissionContext, MissionEvent, MissionStatus


class MissionStore:
    """SQLite-backed persistent storage for missions."""
    
    def __init__(self, db_path: str = "mission_orchestration.db"):
        self.db_path = Path(db_path)
        self._init_db()
    
    @contextmanager
    def _get_connection(self):
        """Context manager for database connections."""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def _init_db(self) -> None:
        """Initialize database schema."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Missions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS missions (
                    mission_id TEXT PRIMARY KEY,
                    description TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at TEXT NOT NULL,
                    started_at TEXT,
                    completed_at TEXT,
                    current_step INTEGER DEFAULT 0,
                    retry_count INTEGER DEFAULT 0,
                    max_retries INTEGER DEFAULT 5,
                    timeout_seconds INTEGER DEFAULT 1800,
                    agent_timeout_seconds INTEGER DEFAULT 300,
                    results TEXT,
                    metadata TEXT,
                    priority INTEGER DEFAULT 0
                )
            """)
            
            # Mission steps table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS mission_steps (
                    step_id TEXT PRIMARY KEY,
                    mission_id TEXT NOT NULL,
                    step_number INTEGER NOT NULL,
                    agent_id TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    output TEXT,
                    error TEXT,
                    retry_count INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (mission_id) REFERENCES missions(mission_id)
                )
            """)
            
            # Heartbeats table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS heartbeats (
                    heartbeat_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mission_id TEXT NOT NULL,
                    agent_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    status TEXT NOT NULL,
                    progress INTEGER,
                    current_step INTEGER,
                    metadata TEXT,
                    FOREIGN KEY (mission_id) REFERENCES missions(mission_id)
                )
            """)
            
            # Checkpoints table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS checkpoints (
                    checkpoint_id TEXT PRIMARY KEY,
                    mission_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    current_step INTEGER,
                    completed_steps TEXT,
                    failed_steps TEXT,
                    partial_results TEXT,
                    agent_states TEXT,
                    FOREIGN KEY (mission_id) REFERENCES missions(mission_id)
                )
            """)
            
            # Create indices for performance
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_missions_status 
                ON missions(status)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_mission_steps_mission 
                ON mission_steps(mission_id)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_heartbeats_mission 
                ON heartbeats(mission_id)
            """)
    
    def create_mission(self, mission_id: str, description: str, 
                      timeout_seconds: int = 1800, 
                      agent_timeout_seconds: int = 300) -> MissionContext:
        """Create and store a new mission."""
        context = MissionContext(
            mission_id=mission_id,
            description=description,
            timeout_seconds=timeout_seconds,
            agent_timeout_seconds=agent_timeout_seconds
        )
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO missions 
                (mission_id, description, status, created_at, timeout_seconds, agent_timeout_seconds)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                mission_id, 
                description, 
                MissionStatus.PENDING.value,
                context.created_at.isoformat(),
                timeout_seconds,
                agent_timeout_seconds
            ))
        
        return context
    
    def get_mission(self, mission_id: str) -> Optional[MissionContext]:
        """Retrieve mission by ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM missions WHERE mission_id = ?", (mission_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            return self._row_to_mission(row)
    
    def get_missions_by_status(self, status: MissionStatus) -> List[MissionContext]:
        """Retrieve all missions with given status."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM missions WHERE status = ? ORDER BY created_at DESC",
                (status.value,)
            )
            rows = cursor.fetchall()
            return [self._row_to_mission(row) for row in rows]
    
    def update_mission_status(self, mission_id: str, status: MissionStatus) -> None:
        """Update mission status."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE missions SET status = ? WHERE mission_id = ?",
                (status.value, mission_id)
            )
    
    def update_mission_progress(self, mission_id: str, current_step: int,
                               completed_steps: List[str],
                               failed_steps: List[str]) -> None:
        """Update mission progress tracking."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE missions 
                SET current_step = ?, 
                    completed_steps = ?,
                    failed_steps = ?
                WHERE mission_id = ?
            """, (
                current_step,
                json.dumps(completed_steps),
                json.dumps(failed_steps),
                mission_id
            ))
    
    def update_mission_results(self, mission_id: str, results: Dict[str, Any]) -> None:
        """Store mission results."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE missions SET results = ? WHERE mission_id = ?",
                (json.dumps(results), mission_id)
            )
    
    def increment_retry_count(self, mission_id: str) -> None:
        """Increment mission retry count."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE missions SET retry_count = retry_count + 1 WHERE mission_id = ?",
                (mission_id,)
            )
    
    def set_mission_started(self, mission_id: str) -> None:
        """Mark mission as started."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE missions SET started_at = ?, status = ? WHERE mission_id = ?",
                (datetime.utcnow().isoformat(), MissionStatus.RUNNING.value, mission_id)
            )
    
    def set_mission_completed(self, mission_id: str) -> None:
        """Mark mission as completed."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE missions SET completed_at = ?, status = ? WHERE mission_id = ?",
                (datetime.utcnow().isoformat(), MissionStatus.COMPLETED.value, mission_id)
            )
    
    def _row_to_mission(self, row) -> MissionContext:
        """Convert database row to MissionContext."""
        return MissionContext(
            mission_id=row["mission_id"],
            description=row["description"],
            status=MissionStatus(row["status"]),
            created_at=datetime.fromisoformat(row["created_at"]),
            started_at=datetime.fromisoformat(row["started_at"]) if row["started_at"] else None,
            completed_at=datetime.fromisoformat(row["completed_at"]) if row["completed_at"] else None,
            current_step=row["current_step"],
            retry_count=row["retry_count"],
            max_retries=row["max_retries"],
            timeout_seconds=row["timeout_seconds"],
            agent_timeout_seconds=row["agent_timeout_seconds"],
            results=json.loads(row["results"]) if row["results"] else {},
            metadata=json.loads(row["metadata"]) if row["metadata"] else {},
        )


class AuditStore:
    """SQLite-backed persistent storage for audit events."""
    
    def __init__(self, db_path: str = "mission_orchestration.db"):
        self.db_path = Path(db_path)
        self._init_db()
    
    @contextmanager
    def _get_connection(self):
        """Context manager for database connections."""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def _init_db(self) -> None:
        """Initialize audit tables."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_events (
                    event_id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    mission_id TEXT,
                    agent_id TEXT,
                    timestamp TEXT NOT NULL,
                    details TEXT,
                    error TEXT
                )
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_mission 
                ON audit_events(mission_id)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_timestamp 
                ON audit_events(timestamp)
            """)
    
    def log_event(self, event: MissionEvent) -> None:
        """Log an audit event."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audit_events 
                (event_id, event_type, mission_id, agent_id, timestamp, details, error)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                event.event_id,
                event.event_type.value,
                event.mission_id,
                event.agent_id,
                event.timestamp.isoformat(),
                json.dumps(event.details),
                event.error
            ))
    
    def get_mission_events(self, mission_id: str) -> List[MissionEvent]:
        """Retrieve all audit events for a mission."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM audit_events WHERE mission_id = ? ORDER BY timestamp ASC",
                (mission_id,)
            )
            rows = cursor.fetchall()
            
            return [self._row_to_event(row) for row in rows]
    
    def _row_to_event(self, row) -> MissionEvent:
        """Convert database row to MissionEvent."""
        return MissionEvent(
            event_id=row["event_id"],
            event_type=row["event_type"],
            mission_id=row["mission_id"],
            agent_id=row["agent_id"],
            timestamp=datetime.fromisoformat(row["timestamp"]),
            details=json.loads(row["details"]) if row["details"] else {},
            error=row["error"]
        )
