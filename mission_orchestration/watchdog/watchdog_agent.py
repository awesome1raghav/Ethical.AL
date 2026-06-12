"""
Watchdog agent that monitors mission execution and triggers recovery.
"""

import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Optional

from ..core.mission_manager import MissionManager
from ..core.mission_state import EventType, MissionStatus
from ..storage.mission_store import MissionStore

logger = logging.getLogger(__name__)


class WatchdogAgent:
    """
    Monitors running missions for timeouts and hung agents.
    
    Detects:
    - Mission timeouts
    - Agent heartbeat losses
    - Hung execution steps
    
    Actions:
    - Creates audit logs
    - Saves checkpoints
    - Initiates recovery
    """
    
    def __init__(self, mission_manager: MissionManager,
                 mission_store: MissionStore,
                 check_interval: int = 5):
        """
        Initialize watchdog agent.
        
        Args:
            mission_manager: MissionManager instance
            mission_store: MissionStore instance
            check_interval: Seconds between health checks
        """
        self.mission_manager = mission_manager
        self.mission_store = mission_store
        self.check_interval = check_interval
        
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
    
    def start(self) -> None:
        """Start the watchdog monitoring thread."""
        if self._running:
            logger.warning("[WATCHDOG] Watchdog already running")
            return
        
        with self._lock:
            self._running = True
        
        self._thread = threading.Thread(
            target=self._monitor_loop,
            daemon=False,
            name="WatchdogAgent"
        )
        self._thread.start()
        
        logger.info("[WATCHDOG] Watchdog agent started")
    
    def stop(self, wait: bool = True) -> None:
        """Stop the watchdog monitoring thread."""
        with self._lock:
            self._running = False
        
        if wait and self._thread:
            self._thread.join(timeout=10)
        
        logger.info("[WATCHDOG] Watchdog agent stopped")
    
    def _monitor_loop(self) -> None:
        """Main monitoring loop."""
        while self._running:
            try:
                self._check_all_missions()
                time.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"[WATCHDOG] Monitoring error: {e}")
                time.sleep(self.check_interval)
    
    def _check_all_missions(self) -> None:
        """Check status of all running missions."""
        # Get all RUNNING and RETRYING missions
        running_missions = self.mission_store.get_missions_by_status(MissionStatus.RUNNING)
        retrying_missions = self.mission_store.get_missions_by_status(MissionStatus.RETRYING)
        
        for mission in running_missions + retrying_missions:
            self._check_mission(mission)
    
    def _check_mission(self, mission) -> None:
        """Check specific mission for issues."""
        mission_id = mission.mission_id
        
        try:
            # Check mission timeout
            if self.mission_manager.check_mission_timeout(mission_id):
                self._handle_mission_timeout(mission_id, mission)
                return
            
            # Check agent heartbeats
            for agent_id in mission.active_agents.keys():
                if self.mission_manager.check_agent_timeout(mission_id, agent_id):
                    self._handle_agent_timeout(mission_id, agent_id)
        
        except Exception as e:
            logger.error(f"[WATCHDOG] Error checking mission {mission_id}: {e}")
    
    def _handle_mission_timeout(self, mission_id: str, mission) -> None:
        """Handle mission timeout."""
        logger.error(f"[WATCHDOG] Mission {mission_id} timeout detected (elapsed: {self._get_elapsed(mission)}s)")
        
        self.mission_manager._emit_event(
            EventType.RECOVERY_STARTED,
            mission_id,
            details={
                "reason": "mission_timeout",
                "elapsed_seconds": self._get_elapsed(mission)
            }
        )
        
        # Check if recoverable
        if self.mission_manager.recovery_engine.can_recover(mission_id):
            if mission.retry_count < mission.max_retries:
                logger.info(f"[WATCHDOG] Initiating recovery for mission {mission_id}")
                self.mission_manager.prepare_retry(mission_id)
                self.mission_manager._emit_event(
                    EventType.RECOVERY_STARTED,
                    mission_id,
                    details={"action": "resume_from_checkpoint"}
                )
            else:
                logger.error(f"[WATCHDOG] Max retries exceeded for mission {mission_id}")
                self.mission_manager.fail_mission(mission_id, "Max retries exceeded after timeout")
        else:
            logger.error(f"[WATCHDOG] No checkpoint available for mission {mission_id}")
            self.mission_manager.fail_mission(mission_id, "Mission timeout - no recovery checkpoint")
    
    def _handle_agent_timeout(self, mission_id: str, agent_id: str) -> None:
        """Handle agent heartbeat loss."""
        logger.warning(f"[WATCHDOG] Agent {agent_id} heartbeat lost in mission {mission_id}")
        
        self.mission_manager._emit_event(
            EventType.AGENT_TIMEOUT,
            mission_id,
            agent_id,
            details={"agent": agent_id, "action": "attempting_recovery"}
        )
        
        # Attempt to recover agent state
        agent_state = self.mission_manager.recovery_engine.restore_agent_state(
            mission_id,
            agent_id
        )
        
        if agent_state:
            self.mission_manager._emit_event(
                EventType.CHECKPOINT_RESTORED,
                mission_id,
                agent_id,
                details={"agent": agent_id, "state_restored": True}
            )
            logger.info(f"[WATCHDOG] Agent {agent_id} state restored from checkpoint")
        else:
            logger.error(f"[WATCHDOG] Failed to restore agent {agent_id} state")
    
    def _get_elapsed(self, mission) -> int:
        """Get elapsed time in seconds since mission started."""
        if not mission.started_at:
            return 0
        
        elapsed = datetime.utcnow() - mission.started_at
        return int(elapsed.total_seconds())
