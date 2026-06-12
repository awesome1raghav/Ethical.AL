"""
Asynchronous mission queue for non-blocking mission submission and processing.
"""

import queue
import threading
from dataclasses import dataclass
from datetime import datetime
from typing import Callable, Dict, Optional


@dataclass
class QueuedMission:
    """Mission submitted to the queue."""
    mission_id: str
    description: str
    submitted_at: datetime
    priority: int = 0
    metadata: Optional[Dict] = None
    timeout_seconds: int = 1800
    agent_timeout_seconds: int = 300


class MissionQueue:
    """Thread-safe queue for mission processing."""
    
    def __init__(self, max_size: int = 0, worker_threads: int = 1):
        """
        Initialize mission queue.
        
        Args:
            max_size: Maximum queue size (0 = unlimited)
            worker_threads: Number of worker threads
        """
        self._queue: queue.PriorityQueue = queue.PriorityQueue(maxsize=max_size)
        self._worker_threads: Dict[int, threading.Thread] = {}
        self._worker_count = worker_threads
        self._shutdown = False
        self._process_callback: Optional[Callable] = None
        self._lock = threading.Lock()
        self._condition = threading.Condition(self._lock)
        
        # Start worker threads
        for i in range(worker_threads):
            thread = threading.Thread(
                target=self._worker,
                args=(i,),
                daemon=False,
                name=f"MissionWorker-{i}"
            )
            thread.start()
            self._worker_threads[i] = thread
    
    def submit(self, mission: QueuedMission) -> str:
        """
        Submit a mission to the queue.
        
        Returns immediately with mission ID.
        Processing happens in background.
        """
        if self._shutdown:
            raise RuntimeError("Queue is shut down")
        
        # Negative priority for max-heap behavior (higher priority values go first)
        priority = (-mission.priority, mission.submitted_at.timestamp())
        
        self._queue.put((priority, mission.mission_id, mission))
        
        with self._condition:
            self._condition.notify()
        
        return mission.mission_id
    
    def set_process_callback(self, callback: Callable) -> None:
        """Set callback function to handle mission processing."""
        with self._lock:
            self._process_callback = callback
    
    def _worker(self, worker_id: int) -> None:
        """Worker thread that processes queued missions."""
        while not self._shutdown:
            try:
                with self._condition:
                    # Wait for mission with timeout
                    if self._queue.empty():
                        self._condition.wait(timeout=1)
                
                # Try to get mission without blocking
                try:
                    _, mission_id, mission = self._queue.get(timeout=0.5)
                except queue.Empty:
                    continue
                
                # Process the mission
                if self._process_callback:
                    try:
                        self._process_callback(mission)
                    except Exception as e:
                        print(f"[Worker-{worker_id}] Error processing mission {mission_id}: {e}")
                
                self._queue.task_done()
            
            except Exception as e:
                print(f"[Worker-{worker_id}] Unexpected error: {e}")
    
    def get_queue_size(self) -> int:
        """Get current queue size."""
        return self._queue.qsize()
    
    def wait_completion(self, timeout: Optional[float] = None) -> bool:
        """
        Wait for all queued missions to complete.
        
        Returns True if completed, False if timeout exceeded.
        """
        return self._queue.join() is None
    
    def shutdown(self, wait: bool = True) -> None:
        """Shutdown the queue and worker threads."""
        with self._lock:
            self._shutdown = True
            self._condition.notify_all()
        
        if wait:
            for thread in self._worker_threads.values():
                thread.join(timeout=5)
    
    def is_shutdown(self) -> bool:
        """Check if queue is shut down."""
        return self._shutdown
