"""
Recovery engine for mission resumption after timeouts or failures.
"""

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from ..core.mission_state import MissionContext, MissionStatus
from ..storage.mission_store import MissionStore
from .checkpoint_manager import CheckpointManager

logger = logging.getLogger(__name__)


class RecoveryEngine:
    """Handles mission recovery from checkpoints."""
    
    def __init__(self, mission_store: MissionStore, 
                 checkpoint_manager: CheckpointManager):
        self.mission_store = mission_store
        self.checkpoint_manager = checkpoint_manager
    
    def save_mission_checkpoint(self, mission_context: MissionContext,
                               agent_states: Dict[str, Dict[str, Any]]) -> bool:
        """
        Save current mission state to enable recovery.
        
        Returns True on success.
        """
        try:
            checkpoint = self.checkpoint_manager.save_checkpoint(
                mission_context,
                agent_states
            )
            
            logger.info(
                f"[CHECKPOINT] Mission {mission_context.mission_id} "
                f"saved at step {mission_context.current_step}"
            )
            
            return True
        except Exception as e:
            logger.error(f"[CHECKPOINT] Failed to save checkpoint: {e}")
            return False
    
    def can_recover(self, mission_id: str) -> bool:
        """Check if mission can be recovered from checkpoint."""
        checkpoint = self.checkpoint_manager.get_latest_checkpoint(mission_id)
        return checkpoint is not None
    
    def recover_mission(self, mission_id: str) -> Optional[Dict[str, Any]]:
        """
        Recover mission from latest checkpoint.
        
        Returns recovery state dict or None if recovery fails.
        """
        try:
            checkpoint = self.checkpoint_manager.get_latest_checkpoint(mission_id)
            if not checkpoint:
                logger.warning(f"[RECOVERY] No checkpoint found for mission {mission_id}")
                return None
            
            mission_context = self.mission_store.get_mission(mission_id)
            if not mission_context:
                logger.error(f"[RECOVERY] Mission {mission_id} not found in store")
                return None
            
            # Restore execution state
            recovery_state = {
                "mission_id": mission_id,
                "current_step": checkpoint.current_step,
                "completed_steps": checkpoint.completed_steps,
                "failed_steps": checkpoint.failed_steps,
                "partial_results": checkpoint.partial_results,
                "agent_states": checkpoint.agent_states,
                "checkpoint_id": checkpoint.checkpoint_id,
                "checkpoint_timestamp": checkpoint.timestamp.isoformat()
            }
            
            logger.info(
                f"[RECOVERY] Mission {mission_id} recovered from checkpoint "
                f"at step {checkpoint.current_step}"
            )
            
            return recovery_state
        
        except Exception as e:
            logger.error(f"[RECOVERY] Failed to recover mission {mission_id}: {e}")
            return None
    
    def restore_agent_state(self, mission_id: str, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Restore specific agent state from checkpoint.
        
        Returns agent state dict or None if not found.
        """
        try:
            checkpoint = self.checkpoint_manager.get_latest_checkpoint(mission_id)
            if not checkpoint:
                return None
            
            agent_state = checkpoint.agent_states.get(agent_id)
            
            if agent_state:
                logger.info(
                    f"[RECOVERY] Restored state for agent {agent_id} "
                    f"in mission {mission_id}"
                )
            
            return agent_state
        
        except Exception as e:
            logger.error(f"[RECOVERY] Failed to restore agent state: {e}")
            return None
    
    def cleanup_checkpoints(self, mission_id: str, keep_count: int = 10) -> None:
        """
        Clean up old checkpoints to save storage space.
        
        Keeps the N most recent checkpoints.
        """
        try:
            self.checkpoint_manager.prune_old_checkpoints(mission_id, keep_count)
            logger.info(f"[RECOVERY] Pruned checkpoints for mission {mission_id}")
        except Exception as e:
            logger.error(f"[RECOVERY] Failed to prune checkpoints: {e}")
    
    def delete_all_checkpoints(self, mission_id: str) -> None:
        """Delete all checkpoints for completed/cancelled mission."""
        try:
            checkpoints = self.checkpoint_manager.get_all_checkpoints(mission_id)
            for checkpoint in checkpoints:
                self.checkpoint_manager.delete_checkpoint(checkpoint.checkpoint_id)
            
            logger.info(f"[RECOVERY] Deleted all checkpoints for mission {mission_id}")
        except Exception as e:
            logger.error(f"[RECOVERY] Failed to delete checkpoints: {e}")
