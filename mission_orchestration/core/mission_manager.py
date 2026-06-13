from __future__ import annotations

import logging
from threading import RLock
from typing import Any, Dict, Optional
from uuid import uuid4

from ..agents import FinancialAuditor, ResearchAgent, SystemOptimizer, ThreatDetector
from ..core.mission_queue import MissionQueue, QueueItem
from ..core.mission_state import MissionCheckpoint, MissionEventType, MissionState, MissionStatus, utc_now_iso
from ..execution.dependency_graph import DependencyGraph
from ..execution.execution_engine import ExecutionEngine, ExecutionOutcome
from ..execution.workflow_builder import WorkflowBuilder
from ..storage.audit_store import AuditStore
from ..storage.mission_store import MissionStore
from ..watchdog.checkpoint_manager import CheckpointManager
from ..watchdog.recovery_engine import RecoveryEngine
from ..watchdog.watchdog_agent import WatchdogAgent


logger = logging.getLogger(__name__)


class MissionManager:
    def __init__(self, mission_store: MissionStore | None = None, audit_store: AuditStore | None = None) -> None:
        self.mission_store = mission_store or MissionStore()
        self.audit_store = audit_store or AuditStore(self.mission_store.db_path)
        self.workflow_builder = WorkflowBuilder()
        self.dependency_graph = DependencyGraph()
        self.checkpoint_manager = CheckpointManager(self.mission_store)

        self.research_agent = ResearchAgent(self.mission_store, self.audit_store)
        self.threat_detector = ThreatDetector()
        self.financial_auditor = FinancialAuditor()
        self.system_optimizer = SystemOptimizer()

        self.queue = MissionQueue(self.mission_store)
        self.recovery_engine = RecoveryEngine(
            self.mission_store,
            self.audit_store,
            self.checkpoint_manager,
            requeue_callback=self.queue.enqueue,
        )
        self.execution_engine = ExecutionEngine(
            mission_store=self.mission_store,
            audit_store=self.audit_store,
            workflow_builder=self.workflow_builder,
            dependency_graph=self.dependency_graph,
            research_agent=self.research_agent,
            threat_detector=self.threat_detector,
            financial_auditor=self.financial_auditor,
            system_optimizer=self.system_optimizer,
            checkpoint_manager=self.checkpoint_manager,
            recovery_engine=self.recovery_engine,
        )
        self.queue.set_handler(self.execution_engine.execute)
        self.watchdog = WatchdogAgent(self.mission_store, self.audit_store, self.checkpoint_manager, self.recovery_engine)
        self._started = False
        self._lock = RLock()

    def start(self) -> None:
        with self._lock:
            if self._started:
                return
            self.queue.start()
            self.watchdog.start()
            self._started = True

    def shutdown(self) -> None:
        with self._lock:
            if not self._started:
                return
            self.watchdog.stop()
            self.queue.stop()
            self._started = False

    def create_mission(self, description: str, *, primary_intent: str = "General Operation", metadata: Dict[str, Any] | None = None) -> Dict[str, Any]:
        self.start()
        mission_id = f"mission_{uuid4().hex[:12]}"
        steps = self.workflow_builder.build_steps(description)
        mission = MissionState(
            mission_id=mission_id,
            description=description.strip(),
            primary_intent=primary_intent,
            status=MissionStatus.PENDING,
            workflow_steps=steps,
            metadata=metadata or {},
        )
        self.mission_store.create_mission(mission)
        self.audit_store.record(mission_id, MissionEventType.MISSION_CREATED, "Mission created", {"mission_id": mission_id, "step_count": len(steps)})
        self.mission_store.update_mission(mission_id, status=MissionStatus.QUEUED)
        self.queue.enqueue(mission_id, metadata={"source": "mission_manager"})
        return {"mission_id": mission_id, "status": "queued"}

    def cancel_mission(self, mission_id: str) -> Dict[str, Any]:
        self.mission_store.update_mission(mission_id, status=MissionStatus.CANCELLED, cancelled_at=utc_now_iso())
        self.audit_store.record(mission_id, MissionEventType.MISSION_CANCELLED, "Mission cancelled", {})
        return {"mission_id": mission_id, "status": "cancelled"}

    def pause_mission(self, mission_id: str) -> Dict[str, Any]:
        self.mission_store.update_mission(mission_id, status=MissionStatus.PAUSED)
        return {"mission_id": mission_id, "status": "paused"}

    def resume_mission(self, mission_id: str) -> Dict[str, Any]:
        checkpoint = self.checkpoint_manager.latest(mission_id)
        self.queue.enqueue(mission_id, checkpoint=checkpoint, metadata={"source": "resume"})
        return {"mission_id": mission_id, "status": "queued"}

    def get_mission(self, mission_id: str) -> Optional[MissionState]:
        return self.mission_store.get_mission(mission_id)
