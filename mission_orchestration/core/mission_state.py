"""
Mission state definitions and enums for Ethical.AL mission orchestration.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4


class MissionStatus(str, Enum):
    """Mission lifecycle states."""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    RETRYING = "retrying"
    PAUSED = "paused"
    FAILED = "failed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AgentStatus(str, Enum):
    """Agent execution states."""
    IDLE = "idle"
    INITIALIZING = "initializing"
    RUNNING = "running"
    PAUSED = "paused"
    RECOVERING = "recovering"
    COMPLETED = "completed"
    FAILED = "failed"


class EventType(str, Enum):
    """Mission and agent events."""
    MISSION_CREATED = "mission_created"
    MISSION_STARTED = "mission_started"
    MISSION_COMPLETED = "mission_completed"
    MISSION_FAILED = "mission_failed"
    MISSION_CANCELLED = "mission_cancelled"
    MISSION_PAUSED = "mission_paused"
    MISSION_RESUMED = "mission_resumed"
    AGENT_STARTED = "agent_started"
    AGENT_TIMEOUT = "agent_timeout"
    AGENT_FAILED = "agent_failed"
    AGENT_COMPLETED = "agent_completed"
    RECOVERY_STARTED = "recovery_started"
    RECOVERY_FAILED = "recovery_failed"
    CHECKPOINT_SAVED = "checkpoint_saved"
    CHECKPOINT_RESTORED = "checkpoint_restored"


@dataclass
class Heartbeat:
    """Agent heartbeat message."""
    mission_id: str
    agent_id: str
    timestamp: datetime
    status: AgentStatus
    progress: int  # 0-100
    current_step: int
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MissionEvent:
    """Audit event for mission execution."""
    event_id: str = field(default_factory=lambda: str(uuid4()))
    event_type: EventType = EventType.MISSION_CREATED
    mission_id: str = ""
    agent_id: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    details: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


@dataclass
class StepResult:
    """Result from a workflow step execution."""
    step_id: str
    agent_id: str
    status: str  # "success", "failed", "retry"
    output: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    retry_count: int = 0


@dataclass
class MissionContext:
    """Complete mission execution context."""
    mission_id: str
    description: str
    status: MissionStatus = MissionStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Execution tracking
    current_step: int = 0
    completed_steps: List[str] = field(default_factory=list)
    failed_steps: List[str] = field(default_factory=list)
    pending_steps: List[str] = field(default_factory=list)
    
    # Retry tracking
    retry_count: int = 0
    max_retries: int = 5
    last_retry_at: Optional[datetime] = None
    
    # Timeout tracking
    timeout_seconds: int = 1800  # 30 minutes
    agent_timeout_seconds: int = 300  # 5 minutes
    
    # Agent tracking
    active_agents: Dict[str, AgentStatus] = field(default_factory=dict)
    agent_heartbeats: Dict[str, datetime] = field(default_factory=dict)
    
    # Results storage
    results: Dict[str, Any] = field(default_factory=dict)
    partial_results: List[StepResult] = field(default_factory=list)
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    priority: int = 0


@dataclass
class Checkpoint:
    """Saved mission checkpoint for recovery."""
    checkpoint_id: str = field(default_factory=lambda: str(uuid4()))
    mission_id: str = ""
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    # Execution state
    current_step: int = 0
    completed_steps: List[str] = field(default_factory=list)
    failed_steps: List[str] = field(default_factory=list)
    
    # Results to restore
    partial_results: List[StepResult] = field(default_factory=list)
    agent_states: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    
    # Context
    mission_context: Optional[MissionContext] = None
