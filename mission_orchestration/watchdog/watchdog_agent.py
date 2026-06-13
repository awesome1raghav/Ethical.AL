from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone
from typing import Optional

from ..core.mission_state import MissionCheckpoint, MissionEventType, MissionStatus
from ..storage.audit_store import AuditStore
from ..storage.mission_store import MissionStore
from .checkpoint_manager import CheckpointManager
from .recovery_engine import RecoveryEngine


logger = logging.getLogger(__name__)


class WatchdogAgent:
    def __init__(
        self,
        mission_store: MissionStore,
        audit_store: AuditStore,
        checkpoint_manager: CheckpointManager,
        recovery_engine: RecoveryEngine,
        heartbeat_timeout_seconds: int = 30,
        agent_timeout_seconds: int = 300,
        mission_timeout_seconds: int = 1800,
        poll_interval_seconds: int = 5,
    ) -> None:
        self.mission_store = mission_store
        self.audit_store = audit_store
        self.checkpoint_manager = checkpoint_manager
        self.recovery_engine = recovery_engine
        self.heartbeat_timeout_seconds = heartbeat_timeout_seconds
        self.agent_timeout_seconds = agent_timeout_seconds
        self.mission_timeout_seconds = mission_timeout_seconds
        self.poll_interval_seconds = poll_interval_seconds
        self._stop_event = threading.Event()
        self._thread = threading.Thread(target=self._run, name="mission-watchdog", daemon=True)
        self._recovering: set[str] = set()
        self._lock = threading.RLock()

    def start(self) -> None:
        if not self._thread.is_alive():
            self._thread = threading.Thread(target=self._run, name="mission-watchdog", daemon=True)
            self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread.is_alive():
            self._thread.join(timeout=2)

    def _run(self) -> None:
        while not self._stop_event.wait(self.poll_interval_seconds):
            try:
                self.inspect()
            except Exception:
                logger.exception("watchdog inspection failed")

    def inspect(self) -> None:
        missions = self.mission_store.list_running_missions()
        now = datetime.now(timezone.utc)
        for mission in missions:
            if mission.status in {MissionStatus.CANCELLED, MissionStatus.COMPLETED, MissionStatus.FAILED}:
                continue

            latest_heartbeat = self.mission_store.get_latest_heartbeat(mission.mission_id)
            heartbeat_age = None
            if latest_heartbeat is not None:
                heartbeat_age = int((now - datetime.fromisoformat(latest_heartbeat.timestamp)).total_seconds())

            reason = self._detect_violation(mission, heartbeat_age)
            if reason is None:
                continue

            with self._lock:
                if mission.mission_id in self._recovering:
                    continue
                self._recovering.add(mission.mission_id)

            try:
                checkpoint = self.checkpoint_manager.latest(mission.mission_id)
                if checkpoint is None:
                    checkpoint = MissionCheckpoint(
                        mission_id=mission.mission_id,
                        current_step=mission.current_step,
                        progress=float((len(mission.completed_steps) / max(1, len(mission.workflow_steps))) * 100.0),
                        completed_steps=[{"step_id": step_id} for step_id in mission.completed_steps],
                        agent_state=mission.agent_state,
                        partial_results=mission.partial_results,
                        retry_count=mission.retry_count,
                    )
                    self.checkpoint_manager.save(checkpoint)

                self.audit_store.record(
                    mission.mission_id,
                    MissionEventType.AGENT_TIMEOUT,
                    "Watchdog detected degradation",
                    {"reason": reason, "heartbeat_age": heartbeat_age, "checkpoint": checkpoint.to_dict()},
                )
                self.recovery_engine.request_retry(mission.mission_id, reason, checkpoint)
            finally:
                with self._lock:
                    self._recovering.discard(mission.mission_id)

    def _detect_violation(self, mission, heartbeat_age: Optional[int]) -> Optional[str]:
        elapsed = mission.elapsed_seconds()
        if elapsed >= self.mission_timeout_seconds:
            return f"Mission timeout exceeded after {elapsed}s"
        if heartbeat_age is None:
            if elapsed >= self.heartbeat_timeout_seconds:
                return "Missing heartbeat"
            return None
        if heartbeat_age >= self.heartbeat_timeout_seconds:
            current_agent = mission.agent_state.get("current_agent") or "unknown"
            return f"{current_agent} heartbeat lost"
        if elapsed >= self.agent_timeout_seconds:
            current_agent = mission.agent_state.get("current_agent") or "unknown"
            return f"{current_agent} agent timeout"
        return None
