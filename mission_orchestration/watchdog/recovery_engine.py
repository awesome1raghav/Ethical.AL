from __future__ import annotations

import logging
import threading
from typing import Callable, Optional

from ..core.mission_state import MissionCheckpoint, MissionEventType, MissionStatus, utc_now_iso
from ..storage.audit_store import AuditStore
from ..storage.mission_store import MissionStore
from .checkpoint_manager import CheckpointManager


logger = logging.getLogger(__name__)


class RecoveryEngine:
    def __init__(
        self,
        mission_store: MissionStore,
        audit_store: AuditStore,
        checkpoint_manager: CheckpointManager,
        requeue_callback: Callable[[str, MissionCheckpoint | None, int], None],
    ) -> None:
        self.mission_store = mission_store
        self.audit_store = audit_store
        self.checkpoint_manager = checkpoint_manager
        self.requeue_callback = requeue_callback

    def request_retry(self, mission_id: str, reason: str, checkpoint: MissionCheckpoint | None = None) -> bool:
        mission = self.mission_store.get_mission(mission_id)
        if mission is None:
            return False

        if mission.status in {MissionStatus.CANCELLED, MissionStatus.COMPLETED, MissionStatus.FAILED}:
            return False

        next_retry = mission.retry_count + 1
        if next_retry > mission.max_retries:
            self.mission_store.update_mission(mission_id, status=MissionStatus.FAILED, last_error=reason, completed_at=utc_now_iso())
            self.audit_store.record(mission_id, MissionEventType.MISSION_FAILED, "Mission failed after maximum retries", {"reason": reason, "retry_count": next_retry})
            return False

        checkpoint = checkpoint or self.checkpoint_manager.latest(mission_id)
        backoff = min(32, 2 ** next_retry)
        self.mission_store.update_mission(mission_id, status=MissionStatus.RETRYING, retry_count=next_retry, last_error=reason)
        if checkpoint is not None:
            self.checkpoint_manager.save(checkpoint)

        self.audit_store.record(
            mission_id,
            MissionEventType.RECOVERY_STARTED,
            "Recovery started",
            {"reason": reason, "retry_count": next_retry, "backoff_seconds": backoff},
        )
        timer = threading.Timer(backoff, self.requeue_callback, args=(mission_id, checkpoint, 0))
        timer.daemon = True
        timer.start()
        self.audit_store.record(mission_id, MissionEventType.CHECKPOINT_RESTORED, "Checkpoint restored", {"retry_count": next_retry, "backoff_seconds": backoff})
        return True
