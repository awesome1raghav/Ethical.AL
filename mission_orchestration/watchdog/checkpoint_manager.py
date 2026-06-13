from __future__ import annotations

from typing import Optional

from ..core.mission_state import MissionCheckpoint
from ..storage.mission_store import MissionStore


class CheckpointManager:
    def __init__(self, mission_store: MissionStore) -> None:
        self.mission_store = mission_store

    def save(self, checkpoint: MissionCheckpoint) -> None:
        self.mission_store.save_checkpoint(checkpoint)

    def latest(self, mission_id: str) -> Optional[MissionCheckpoint]:
        return self.mission_store.load_latest_checkpoint(mission_id)
