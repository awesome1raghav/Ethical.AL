from __future__ import annotations

import logging
import threading
from dataclasses import dataclass, field
from queue import Empty, Queue
from typing import Callable, Optional

from ..core.mission_state import MissionCheckpoint, MissionStatus
from ..storage.mission_store import MissionStore


logger = logging.getLogger(__name__)


@dataclass
class QueueItem:
    mission_id: str
    checkpoint: MissionCheckpoint | None = None
    retry_delay_seconds: int = 0
    metadata: dict = field(default_factory=dict)


class MissionQueue:
    def __init__(self, mission_store: MissionStore, handler: Callable[[QueueItem], None] | None = None) -> None:
        self.mission_store = mission_store
        self._handler = handler
        self._queue: Queue[QueueItem] = Queue()
        self._stop_event = threading.Event()
        self._worker = threading.Thread(target=self._worker_loop, name="mission-queue-worker", daemon=True)
        self._timers: list[threading.Timer] = []
        self._lock = threading.RLock()

    def set_handler(self, handler: Callable[[QueueItem], None]) -> None:
        self._handler = handler

    def start(self) -> None:
        if not self._worker.is_alive():
            self._worker.start()

    def stop(self) -> None:
        self._stop_event.set()
        with self._lock:
            for timer in self._timers:
                timer.cancel()
            self._timers.clear()
        if self._worker.is_alive():
            self._worker.join(timeout=2)

    def enqueue(self, mission_id: str, checkpoint: MissionCheckpoint | None = None, retry_delay_seconds: int = 0, metadata: dict | None = None) -> None:
        item = QueueItem(mission_id=mission_id, checkpoint=checkpoint, retry_delay_seconds=retry_delay_seconds, metadata=metadata or {})
        if retry_delay_seconds > 0:
            timer = threading.Timer(retry_delay_seconds, self._enqueue_now, args=(item,))
            timer.daemon = True
            with self._lock:
                self._timers.append(timer)
            timer.start()
            return
        self._enqueue_now(item)

    def _enqueue_now(self, item: QueueItem) -> None:
        if self._stop_event.is_set():
            return
        self.mission_store.update_mission(item.mission_id, status=MissionStatus.QUEUED)
        self._queue.put(item)

    def _worker_loop(self) -> None:
        while not self._stop_event.is_set():
            try:
                item = self._queue.get(timeout=0.5)
            except Empty:
                continue
            try:
                if self._handler is None:
                    raise RuntimeError("MissionQueue handler is not configured.")
                self._handler(item)
            except Exception:
                logger.exception("mission queue worker failed for mission %s", item.mission_id)
            finally:
                self._queue.task_done()
