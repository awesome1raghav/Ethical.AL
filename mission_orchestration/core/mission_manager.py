"""
Mission manager for orchestrating mission lifecycle and state transitions.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, Optional
from uuid import uuid4

from ..core.mission_state import (
    AgentStatus, EventType, MissionContext, MissionEvent, MissionStatus
)
from ..storage.mission_store import AuditStore, MissionStore
from ..watchdog.checkpoint_manager import CheckpointManager
from ..watchdog.recovery_engine import RecoveryEngine

logger = logging.getLogger(__name__)


class MissionManager:
    """Manages mission lifecycle from creation through completion."""
    
    def __init__(self, mission_store: MissionStore, audit_store: AuditStore,
                 checkpoint_manager: CheckpointManager,
                 recovery_engine: RecoveryEngine):
        self.mission_store = mission_store
        self.audit_store = audit_store
        self.checkpoint_manager = checkpoint_manager
        self.recovery_engine = recovery_engine
        self._event_callbacks: Dict[EventType, list] = {}
    
    def create_mission(self, description: str, 
                      timeout_seconds: int = 1800,
                      agent_timeout_seconds: int = 300,
                      priority: int = 0) -> MissionContext:
        """Create and return new mission in PENDING state."""
        mission_id = str(uuid4())
        
        context = self.mission_store.create_mission(
            mission_id=mission_id,
            description=description,
            timeout_seconds=timeout_seconds,
            agent_timeout_seconds=agent_timeout_seconds
        )
        context.priority = priority
        
        # Log creation event
        self._emit_event(EventType.MISSION_CREATED, mission_id, 
                        details={"description": description})
        
        logger.info(f"[MISSION] Created mission {mission_id}")
        
        return context
    
    def queue_mission(self, mission_id: str) -> bool:
        """Transition mission from PENDING to QUEUED."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            logger.error(f"[MISSION] Mission {mission_id} not found")
            return False
        
        if context.status != MissionStatus.PENDING:
            logger.warning(f"[MISSION] Cannot queue mission {mission_id} in {context.status} state")
            return False
        
        self.mission_store.update_mission_status(mission_id, MissionStatus.QUEUED)
        
        logger.info(f"[MISSION] Mission {mission_id} queued")
        
        return True
    
    def start_mission(self, mission_id: str) -> bool:
        """Transition mission from QUEUED to RUNNING."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            logger.error(f"[MISSION] Mission {mission_id} not found")
            return False
        
        if context.status == MissionStatus.COMPLETED:
            logger.warning(f"[MISSION] Mission {mission_id} already completed")
            return False
        
        if context.status == MissionStatus.RUNNING:
            logger.info(f"[MISSION] Mission {mission_id} already running")
            return True
        
        self.mission_store.set_mission_started(mission_id)
        self._emit_event(EventType.MISSION_STARTED, mission_id)
        
        logger.info(f"[MISSION] Mission {mission_id} started at {datetime.utcnow().isoformat()}")
        
        return True
    
    def register_agent(self, mission_id: str, agent_id: str) -> bool:
        """Register agent as active in mission."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            return False
        
        context.active_agents[agent_id] = AgentStatus.INITIALIZING
        
        self._emit_event(EventType.AGENT_STARTED, mission_id, agent_id,
                        details={"agent": agent_id})
        
        logger.info(f"[MISSION] Agent {agent_id} registered for mission {mission_id}")
        
        return True
    
    def update_agent_heartbeat(self, mission_id: str, agent_id: str,
                              status: AgentStatus, progress: int,
                              current_step: int) -> None:
        """Record agent heartbeat signal."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            return
        
        context.agent_heartbeats[agent_id] = datetime.utcnow()
        if agent_id in context.active_agents:
            context.active_agents[agent_id] = status
    
    def record_step_result(self, mission_id: str, step_id: str, agent_id: str,
                          status: str, output: Dict[str, Any],
                          error: Optional[str] = None) -> bool:
        """Record completion of workflow step."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            return False
        
        from ..core.mission_state import StepResult
        
        result = StepResult(
            step_id=step_id,
            agent_id=agent_id,
            status=status,
            output=output,
            error=error
        )
        
        context.partial_results.append(result)
        
        if status == "success":
            if step_id not in context.completed_steps:
                context.completed_steps.append(step_id)
        elif status == "failed":
            if step_id not in context.failed_steps:
                context.failed_steps.append(step_id)
        
        logger.info(f"[MISSION] Step {step_id} recorded as {status}")
        
        return True
    
    def complete_mission(self, mission_id: str, results: Dict[str, Any]) -> bool:
        """Mark mission as COMPLETED."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            return False
        
        context.completed_at = datetime.utcnow()
        self.mission_store.set_mission_completed(mission_id)
        self.mission_store.update_mission_results(mission_id, results)
        
        self._emit_event(EventType.MISSION_COMPLETED, mission_id,
                        details={"results": results})
        
        # Cleanup checkpoints
        self.recovery_engine.delete_all_checkpoints(mission_id)
        
        duration = (context.completed_at - context.started_at).total_seconds() if context.started_at else 0
        logger.info(f"[MISSION] Mission {mission_id} completed in {duration}s")
        
        return True
    
    def fail_mission(self, mission_id: str, error: str) -> bool:
        """Mark mission as FAILED."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            return False
        
        self.mission_store.update_mission_status(mission_id, MissionStatus.FAILED)
        
        self._emit_event(EventType.MISSION_FAILED, mission_id,
                        details={"error": error})
        
        logger.error(f"[MISSION] Mission {mission_id} failed: {error}")
        
        return True
    
    def cancel_mission(self, mission_id: str) -> bool:
        """Mark mission as CANCELLED."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            return False
        
        self.mission_store.update_mission_status(mission_id, MissionStatus.CANCELLED)
        
        self._emit_event(EventType.MISSION_CANCELLED, mission_id)
        
        # Cleanup checkpoints
        self.recovery_engine.delete_all_checkpoints(mission_id)
        
        logger.info(f"[MISSION] Mission {mission_id} cancelled")
        
        return True
    
    def pause_mission(self, mission_id: str) -> bool:
        """Pause mission execution."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            return False
        
        self.mission_store.update_mission_status(mission_id, MissionStatus.PAUSED)
        
        self._emit_event(EventType.MISSION_PAUSED, mission_id)
        
        logger.info(f"[MISSION] Mission {mission_id} paused")
        
        return True
    
    def resume_mission(self, mission_id: str) -> bool:
        """Resume paused mission."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            return False
        
        if context.status != MissionStatus.PAUSED:
            logger.warning(f"[MISSION] Cannot resume mission {mission_id} in {context.status} state")
            return False
        
        self.mission_store.update_mission_status(mission_id, MissionStatus.RUNNING)
        
        self._emit_event(EventType.MISSION_RESUMED, mission_id)
        
        logger.info(f"[MISSION] Mission {mission_id} resumed")
        
        return True
    
    def prepare_retry(self, mission_id: str) -> bool:
        """Prepare mission for retry after timeout."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            return False
        
        if context.retry_count >= context.max_retries:
            logger.warning(f"[MISSION] Max retries exceeded for mission {mission_id}")
            return False
        
        self.mission_store.increment_retry_count(mission_id)
        self.mission_store.update_mission_status(mission_id, MissionStatus.RETRYING)
        context.last_retry_at = datetime.utcnow()
        
        logger.info(f"[MISSION] Mission {mission_id} retry {context.retry_count} initiated")
        
        return True
    
    def check_mission_timeout(self, mission_id: str) -> bool:
        """Check if mission has exceeded timeout."""
        context = self.mission_store.get_mission(mission_id)
        if not context or not context.started_at:
            return False
        
        elapsed = datetime.utcnow() - context.started_at
        timeout = timedelta(seconds=context.timeout_seconds)
        
        return elapsed > timeout
    
    def check_agent_timeout(self, mission_id: str, agent_id: str) -> bool:
        """Check if agent has exceeded heartbeat timeout."""
        context = self.mission_store.get_mission(mission_id)
        if not context:
            return False
        
        last_heartbeat = context.agent_heartbeats.get(agent_id)
        if not last_heartbeat:
            return True  # No heartbeat received
        
        elapsed = datetime.utcnow() - last_heartbeat
        timeout = timedelta(seconds=30)  # 30 second heartbeat timeout
        
        return elapsed > timeout
    
    def on_event(self, event_type: EventType, 
                callback: Callable[[MissionEvent], None]) -> None:
        """Register callback for event type."""
        if event_type not in self._event_callbacks:
            self._event_callbacks[event_type] = []
        
        self._event_callbacks[event_type].append(callback)
    
    def _emit_event(self, event_type: EventType, mission_id: str,
                   agent_id: Optional[str] = None,
                   details: Optional[Dict[str, Any]] = None) -> None:
        """Emit event and trigger callbacks."""
        event = MissionEvent(
            event_type=event_type,
            mission_id=mission_id,
            agent_id=agent_id,
            details=details or {}
        )
        
        self.audit_store.log_event(event)
        
        # Trigger callbacks
        callbacks = self._event_callbacks.get(event_type, [])
        for callback in callbacks:
            try:
                callback(event)
            except Exception as e:
                logger.error(f"[MISSION] Event callback error: {e}")
