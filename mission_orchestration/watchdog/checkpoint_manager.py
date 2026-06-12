"""
Checkpoint persistence and recovery system for mission resumption.
"""

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..core.mission_state import Checkpoint, MissionContext, StepResult


class CheckpointManager:
    """Manages mission checkpoints for recovery and resumption."""
    
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
        """Initialize checkpoint schema."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
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
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_checkpoints_mission 
                ON checkpoints(mission_id)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_checkpoints_timestamp 
                ON checkpoints(timestamp DESC)
            """)
    
    def save_checkpoint(self, mission_context: MissionContext,
                       agent_states: Dict[str, Dict[str, Any]]) -> Checkpoint:
        """Save current mission state as checkpoint."""
        checkpoint = Checkpoint(
            mission_id=mission_context.mission_id,
            timestamp=datetime.utcnow(),
            current_step=mission_context.current_step,
            completed_steps=mission_context.completed_steps.copy(),
            failed_steps=mission_context.failed_steps.copy(),
            partial_results=mission_context.partial_results.copy(),
            agent_states=agent_states.copy(),
            mission_context=mission_context
        )
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO checkpoints
                (checkpoint_id, mission_id, timestamp, current_step, completed_steps, 
                 failed_steps, partial_results, agent_states)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                checkpoint.checkpoint_id,
                checkpoint.mission_id,
                checkpoint.timestamp.isoformat(),
                checkpoint.current_step,
                json.dumps(checkpoint.completed_steps),
                json.dumps(checkpoint.failed_steps),
                json.dumps([
                    {
                        "step_id": r.step_id,
                        "agent_id": r.agent_id,
                        "status": r.status,
                        "output": r.output,
                        "error": r.error,
                        "timestamp": r.timestamp.isoformat(),
                        "retry_count": r.retry_count
                    }
                    for r in checkpoint.partial_results
                ]),
                json.dumps(checkpoint.agent_states)
            ))
        
        return checkpoint
    
    def get_latest_checkpoint(self, mission_id: str) -> Optional[Checkpoint]:
        """Retrieve the most recent checkpoint for a mission."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM checkpoints 
                WHERE mission_id = ? 
                ORDER BY timestamp DESC 
                LIMIT 1
            """, (mission_id,))
            
            row = cursor.fetchone()
            if not row:
                return None
            
            return self._row_to_checkpoint(row)
    
    def get_checkpoint_by_id(self, checkpoint_id: str) -> Optional[Checkpoint]:
        """Retrieve specific checkpoint by ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM checkpoints WHERE checkpoint_id = ?",
                (checkpoint_id,)
            )
            row = cursor.fetchone()
            
            if not row:
                return None
            
            return self._row_to_checkpoint(row)
    
    def get_all_checkpoints(self, mission_id: str) -> List[Checkpoint]:
        """Retrieve all checkpoints for a mission."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM checkpoints WHERE mission_id = ? ORDER BY timestamp DESC",
                (mission_id,)
            )
            rows = cursor.fetchall()
            
            return [self._row_to_checkpoint(row) for row in rows]
    
    def delete_checkpoint(self, checkpoint_id: str) -> None:
        """Delete a checkpoint."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM checkpoints WHERE checkpoint_id = ?",
                (checkpoint_id,)
            )
    
    def prune_old_checkpoints(self, mission_id: str, keep_count: int = 10) -> None:
        """Keep only the most recent N checkpoints for a mission."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Get checkpoint IDs to delete
            cursor.execute("""
                SELECT checkpoint_id FROM checkpoints 
                WHERE mission_id = ? 
                ORDER BY timestamp DESC 
                LIMIT -1 OFFSET ?
            """, (mission_id, keep_count))
            
            rows = cursor.fetchall()
            for row in rows:
                cursor.execute(
                    "DELETE FROM checkpoints WHERE checkpoint_id = ?",
                    (row["checkpoint_id"],)
                )
    
    def _row_to_checkpoint(self, row) -> Checkpoint:
        """Convert database row to Checkpoint."""
        partial_results = []
        if row["partial_results"]:
            for result_data in json.loads(row["partial_results"]):
                partial_results.append(StepResult(
                    step_id=result_data["step_id"],
                    agent_id=result_data["agent_id"],
                    status=result_data["status"],
                    output=result_data.get("output", {}),
                    error=result_data.get("error"),
                    timestamp=datetime.fromisoformat(result_data["timestamp"]),
                    retry_count=result_data.get("retry_count", 0)
                ))
        
        return Checkpoint(
            checkpoint_id=row["checkpoint_id"],
            mission_id=row["mission_id"],
            timestamp=datetime.fromisoformat(row["timestamp"]),
            current_step=row["current_step"],
            completed_steps=json.loads(row["completed_steps"]),
            failed_steps=json.loads(row["failed_steps"]),
            partial_results=partial_results,
            agent_states=json.loads(row["agent_states"]) if row["agent_states"] else {}
        )
