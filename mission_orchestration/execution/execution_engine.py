from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from dataclasses import dataclass
import logging
from typing import Dict, List, Optional

from ..agents import FinancialAuditor, ResearchAgent, SystemOptimizer, ThreatDetector
from ..agents._shared import AgentRuntimeContext
from ..core.mission_queue import QueueItem
from ..core.mission_state import AgentResult, MissionCheckpoint, MissionEventType, MissionState, MissionStatus, StepStatus, utc_now_iso
from ..storage.audit_store import AuditStore
from ..storage.mission_store import MissionStore
from .dependency_graph import DependencyGraph
from .workflow_builder import WorkflowBuilder


logger = logging.getLogger(__name__)


@dataclass
class ExecutionOutcome:
    mission_id: str
    status: MissionStatus
    completed_steps: List[int]
    message: str = ""
    failed_step: Optional[int] = None


class ExecutionEngine:
    def __init__(
        self,
        mission_store: MissionStore,
        audit_store: AuditStore,
        workflow_builder: WorkflowBuilder,
        dependency_graph: DependencyGraph,
        research_agent: ResearchAgent,
        threat_detector: ThreatDetector,
        financial_auditor: FinancialAuditor,
        system_optimizer: SystemOptimizer,
        checkpoint_manager,
        recovery_engine,
    ) -> None:
        self.mission_store = mission_store
        self.audit_store = audit_store
        self.workflow_builder = workflow_builder
        self.dependency_graph = dependency_graph
        self.research_agent = research_agent
        self.threat_detector = threat_detector
        self.financial_auditor = financial_auditor
        self.system_optimizer = system_optimizer
        self.checkpoint_manager = checkpoint_manager
        self.recovery_engine = recovery_engine
        self._agents = {
            "research_agent": research_agent,
            "threat_detector": threat_detector,
            "financial_auditor": financial_auditor,
            "system_optimizer": system_optimizer,
        }

    def execute(self, item: QueueItem) -> ExecutionOutcome:
        mission = self.mission_store.get_mission(item.mission_id)
        if mission is None:
            raise ValueError(f"Unknown mission: {item.mission_id}")

        steps = mission.workflow_steps or self.workflow_builder.build_steps(mission.description)
        self.dependency_graph.build(steps)
        checkpoint = item.checkpoint or self.checkpoint_manager.latest(mission.mission_id)

        completed_steps = set(mission.completed_steps)
        partial_results = list(mission.partial_results)
        if checkpoint is not None:
            completed_steps.update(step["step_id"] for step in checkpoint.completed_steps)
            partial_results = list(checkpoint.partial_results)
            self.audit_store.record(mission.mission_id, MissionEventType.CHECKPOINT_RESTORED, "Checkpoint restored", checkpoint.to_dict())

        self.mission_store.update_mission(
            mission.mission_id,
            status=MissionStatus.RUNNING,
            started_at=mission.started_at or utc_now_iso(),
            current_step=mission.current_step,
            agent_state={"current_agent": mission.agent_state.get("current_agent", ""), "progress": mission.agent_state.get("progress", 0)},
        )
        self.audit_store.record(mission.mission_id, MissionEventType.MISSION_STARTED, "Mission started", {"mission_id": mission.mission_id})

        with ThreadPoolExecutor(max_workers=1, thread_name_prefix=f"mission-{mission.mission_id}") as executor:
            while True:
                mission = self.mission_store.get_mission(mission.mission_id) or mission
                if mission.status == MissionStatus.CANCELLED:
                    return ExecutionOutcome(mission_id=mission.mission_id, status=MissionStatus.CANCELLED, completed_steps=sorted(completed_steps), message="Mission cancelled")

                ready_indices = self.dependency_graph.ready_steps(completed_steps)
                next_indices = [index for index in ready_indices if index not in completed_steps]
                if not next_indices:
                    break

                step_index = min(next_indices)
                step = next(step for step in steps if step.index == step_index)
                self.mission_store.update_step(step_id=self._step_id(mission.mission_id, step.index), status=StepStatus.RUNNING, retries=step.retries, started_at=utc_now_iso())
                self.mission_store.update_mission(mission.mission_id, status=MissionStatus.RUNNING, current_step=step.index, agent_state={"current_agent": step.assigned_agent_id, "current_step": step.index})
                self.audit_store.record(mission.mission_id, MissionEventType.AGENT_STARTED, f"Agent started: {step.assigned_agent_id}", {"step_index": step.index, "step_name": step.name})

                result = self._run_step(mission, step, checkpoint, executor)
                if result is None:
                    return ExecutionOutcome(mission_id=mission.mission_id, status=MissionStatus.RETRYING, completed_steps=sorted(completed_steps), failed_step=step.index, message="Step scheduled for retry")

                completed_steps.add(step.index)
                partial_results.append(result.output)
                progress = int((len(completed_steps) / max(1, len(steps))) * 100)
                self.mission_store.update_step(step_id=self._step_id(mission.mission_id, step.index), status=StepStatus.COMPLETED, retries=step.retries, result=result.output, completed_at=utc_now_iso())
                self.mission_store.update_mission(mission.mission_id, current_step=step.index, completed_steps=sorted(completed_steps), partial_results=partial_results, agent_state={"current_agent": step.assigned_agent_id, "progress": progress})
                self.checkpoint_manager.save(
                    MissionCheckpoint(
                        mission_id=mission.mission_id,
                        current_step=step.index,
                        progress=float(progress),
                        completed_steps=[{"step_id": idx} for idx in sorted(completed_steps)],
                        agent_state={"current_agent": step.assigned_agent_id, "progress": progress},
                        partial_results=partial_results,
                        retry_count=mission.retry_count,
                    )
                )

        self.mission_store.update_mission(mission.mission_id, status=MissionStatus.COMPLETED, completed_at=utc_now_iso(), current_step=len(steps))
        self.audit_store.record(mission.mission_id, MissionEventType.MISSION_COMPLETED, "Mission completed", {"completed_steps": sorted(completed_steps)})
        return ExecutionOutcome(mission_id=mission.mission_id, status=MissionStatus.COMPLETED, completed_steps=sorted(completed_steps), message="Mission completed")

    def _run_step(self, mission: MissionState, step, checkpoint: MissionCheckpoint | None, executor: ThreadPoolExecutor) -> AgentResult | None:
        agent = self._agents.get(step.assigned_agent_id, self.research_agent)
        max_attempts = min(5, max(1, mission.max_retries))

        for attempt in range(1, max_attempts + 1):
            step_id = self._step_id(mission.mission_id, step.index)
            self.mission_store.update_step(step_id=step_id, status=StepStatus.RUNNING, retries=attempt, started_at=utc_now_iso())
            heartbeat_context = AgentRuntimeContext(
                mission=mission,
                step=step,
                checkpoint=checkpoint,
                retry_count=attempt - 1,
                heartbeat_callback=self.mission_store.save_heartbeat,
            )
            future = executor.submit(agent.execute, heartbeat_context)
            try:
                result = future.result(timeout=mission.agent_timeout_seconds)
                return result
            except FutureTimeoutError:
                future.cancel()
                message = f"{step.assigned_agent_id} timed out after {mission.agent_timeout_seconds}s"
                self.audit_store.record(mission.mission_id, MissionEventType.AGENT_TIMEOUT, message, {"step_index": step.index, "attempt": attempt})
                self.mission_store.update_step(step_id=step_id, status=StepStatus.FAILED, failed_at=utc_now_iso(), error=message)
                self._schedule_retry(mission, step, message, checkpoint)
                return None
            except Exception as exc:
                message = str(exc)
                logger.exception("agent execution failed for mission %s step %s", mission.mission_id, step.index)
                self.mission_store.update_step(step_id=step_id, status=StepStatus.FAILED, failed_at=utc_now_iso(), error=message)
                if attempt >= max_attempts:
                    self.mission_store.update_mission(mission.mission_id, status=MissionStatus.FAILED, last_error=message, completed_at=utc_now_iso())
                    self.audit_store.record(mission.mission_id, MissionEventType.MISSION_FAILED, "Mission failed after retries", {"step_index": step.index, "error": message})
                    return AgentResult(mission_id=mission.mission_id, step_id=step_id, agent_id=step.assigned_agent_id, status="FAILED", progress=0, output={"error": message}, message=message)
                self._schedule_retry(mission, step, message, checkpoint)
                return None

        return None

    def _schedule_retry(self, mission: MissionState, step, reason: str, checkpoint: MissionCheckpoint | None) -> None:
        retry_count = mission.retry_count + 1
        if retry_count > mission.max_retries:
            self.mission_store.update_mission(mission.mission_id, status=MissionStatus.FAILED, last_error=reason, completed_at=utc_now_iso())
            self.audit_store.record(mission.mission_id, MissionEventType.MISSION_FAILED, "Mission failed after maximum retries", {"reason": reason})
            return

        backoff = min(32, 2 ** retry_count)
        self.mission_store.update_mission(mission.mission_id, status=MissionStatus.RETRYING, retry_count=retry_count, last_error=reason)
        checkpoint = checkpoint or self.checkpoint_manager.latest(mission.mission_id)
        if checkpoint is not None:
            self.checkpoint_manager.save(checkpoint)
        self.audit_store.record(mission.mission_id, MissionEventType.RECOVERY_STARTED, "Recovery started", {"reason": reason, "backoff_seconds": backoff, "retry_count": retry_count})
        self.recovery_engine.request_retry(mission.mission_id, reason, checkpoint)

    def _step_id(self, mission_id: str, step_index: int) -> str:
        return f"{mission_id}:step:{step_index}"
