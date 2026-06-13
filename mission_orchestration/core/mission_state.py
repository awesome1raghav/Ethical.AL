from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def utc_now_iso() -> str:
    return utc_now().isoformat()


class MissionStatus(str, Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    RETRYING = "RETRYING"
    PAUSED = "PAUSED"
    FAILED = "FAILED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class StepStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class MissionEventType(str, Enum):
    MISSION_CREATED = "MISSION_CREATED"
    MISSION_STARTED = "MISSION_STARTED"
    AGENT_STARTED = "AGENT_STARTED"
    AGENT_TIMEOUT = "AGENT_TIMEOUT"
    RECOVERY_STARTED = "RECOVERY_STARTED"
    CHECKPOINT_RESTORED = "CHECKPOINT_RESTORED"
    CHECKPOINT_SAVED = "CHECKPOINT_SAVED"
    MISSION_COMPLETED = "MISSION_COMPLETED"
    MISSION_FAILED = "MISSION_FAILED"
    MISSION_CANCELLED = "MISSION_CANCELLED"
    HEARTBEAT_RECEIVED = "HEARTBEAT_RECEIVED"


@dataclass
class MissionStep:
    index: int
    name: str
    assigned_agent_id: str
    is_legal: bool = True
    legality_reason: str = ""
    dependencies: List[int] = field(default_factory=list)
    status: StepStatus = StepStatus.PENDING
    retries: int = 0
    result: Dict[str, Any] = field(default_factory=dict)
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    failed_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["status"] = self.status.value
        return payload


@dataclass
class AgentHeartbeat:
    mission_id: str
    agent: str
    timestamp: str = field(default_factory=utc_now_iso)
    status: str = "running"
    progress: int = 0
    current_step: int = 0
    retry_count: int = 0
    elapsed_time: int = 0
    message: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class MissionCheckpoint:
    mission_id: str
    current_step: int
    progress: float
    completed_steps: List[Dict[str, Any]]
    agent_state: Dict[str, Any]
    partial_results: List[Dict[str, Any]]
    retry_count: int
    updated_at: str = field(default_factory=utc_now_iso)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class MissionEvent:
    mission_id: str
    event_type: MissionEventType
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=utc_now_iso)

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["event_type"] = self.event_type.value
        return payload


@dataclass
class AgentResult:
    mission_id: str
    step_id: str
    agent_id: str
    status: str
    progress: int
    output: Dict[str, Any]
    message: str
    completed_at: str = field(default_factory=utc_now_iso)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class MissionState:
    mission_id: str
    description: str
    primary_intent: str = "General Operation"
    status: MissionStatus = MissionStatus.PENDING
    current_step: int = 0
    retry_count: int = 0
    max_retries: int = 5
    mission_timeout_seconds: int = 1800
    agent_timeout_seconds: int = 300
    heartbeat_timeout_seconds: int = 30
    workflow_steps: List[MissionStep] = field(default_factory=list)
    completed_steps: List[int] = field(default_factory=list)
    failed_steps: List[int] = field(default_factory=list)
    partial_results: List[Dict[str, Any]] = field(default_factory=list)
    agent_state: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=utc_now_iso)
    updated_at: str = field(default_factory=utc_now_iso)
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    cancelled_at: Optional[str] = None
    last_error: Optional[str] = None

    def elapsed_seconds(self) -> int:
        anchor = self.started_at or self.created_at
        anchor_dt = datetime.fromisoformat(anchor)
        return int((utc_now() - anchor_dt).total_seconds())

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["status"] = self.status.value
        payload["workflow_steps"] = [step.to_dict() for step in self.workflow_steps]
        return payload
