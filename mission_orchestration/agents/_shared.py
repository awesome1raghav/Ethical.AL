from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Callable, Optional
import threading

from ..core.mission_state import AgentHeartbeat, AgentResult, MissionCheckpoint, MissionState, MissionStep, utc_now_iso


HeartbeatCallback = Callable[[AgentHeartbeat], None]


@dataclass
class AgentRuntimeContext:
    mission: MissionState
    step: MissionStep
    checkpoint: Optional[MissionCheckpoint]
    retry_count: int
    heartbeat_callback: HeartbeatCallback


class HeartbeatTicker:
    def __init__(self, context: AgentRuntimeContext, progress_supplier: Callable[[], int], interval_seconds: int = 5) -> None:
        self.context = context
        self.progress_supplier = progress_supplier
        self.interval_seconds = interval_seconds
        self._stop_event = threading.Event()
        self._thread = threading.Thread(target=self._run, name=f"heartbeat-{context.mission.mission_id}-{context.step.index}", daemon=True)

    def start(self) -> "HeartbeatTicker":
        self._thread.start()
        self.emit()
        return self

    def emit(self) -> None:
        heartbeat = AgentHeartbeat(
            mission_id=self.context.mission.mission_id,
            agent=self.context.step.assigned_agent_id,
            timestamp=utc_now_iso(),
            status="running",
            progress=max(0, min(100, int(self.progress_supplier()))),
            current_step=self.context.step.index,
            retry_count=self.context.retry_count,
            elapsed_time=self.context.mission.elapsed_seconds(),
            message=self.context.step.name,
        )
        self.context.heartbeat_callback(heartbeat)

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread.is_alive():
            self._thread.join(timeout=1)

    def _run(self) -> None:
        while not self._stop_event.wait(self.interval_seconds):
            self.emit()


class BaseMissionAgent(ABC):
    agent_id: str

    def execute(self, context: AgentRuntimeContext) -> AgentResult:
        progress = {"value": 0}

        def current_progress() -> int:
            return progress["value"]

        ticker = HeartbeatTicker(context, current_progress).start()
        try:
            result = self._execute(context, lambda value: progress.__setitem__("value", value))
            ticker.emit()
            return result
        finally:
            ticker.stop()

    @abstractmethod
    def _execute(self, context: AgentRuntimeContext, set_progress: Callable[[int], None]) -> AgentResult:
        raise NotImplementedError
