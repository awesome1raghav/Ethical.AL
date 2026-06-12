"""
Execution engine that orchestrates workflow execution with retry and recovery.
"""

import asyncio
import logging
import time
from typing import Any, Callable, Dict, List, Optional

from ..core.mission_manager import MissionManager
from ..core.mission_state import AgentStatus
from ..storage.mission_store import MissionStore
from .dependency_graph import DependencyGraph
from .workflow_builder import WorkflowBuilder

logger = logging.getLogger(__name__)


class ExecutionEngine:
    """
    Orchestrates mission execution with:
    - Workflow planning
    - Step-by-step execution
    - Retry logic
    - Dependency tracking
    - Recovery from checkpoints
    """
    
    def __init__(self, mission_manager: MissionManager,
                 mission_store: MissionStore,
                 workflow_builder: WorkflowBuilder):
        self.mission_manager = mission_manager
        self.mission_store = mission_store
        self.workflow_builder = workflow_builder
        
        self._agent_executors: Dict[str, Callable] = {}
        self._workflows: Dict[str, DependencyGraph] = {}
    
    def register_agent_executor(self, agent_id: str, 
                               executor: Callable) -> None:
        """Register executor function for agent."""
        self._agent_executors[agent_id] = executor
        logger.info(f"[EXECUTION] Registered executor for agent {agent_id}")
    
    def build_mission_workflow(self, mission_id: str) -> bool:
        """Build workflow for mission."""
        mission_context = self.mission_store.get_mission(mission_id)
        if not mission_context:
            logger.error(f"[EXECUTION] Mission {mission_id} not found")
            return False
        
        try:
            workflow = self.workflow_builder.build_workflow(mission_context)
            self._workflows[mission_id] = workflow
            
            execution_order = workflow.get_execution_order()
            mission_context.pending_steps = execution_order
            
            logger.info(f"[EXECUTION] Workflow built for mission {mission_id}: {execution_order}")
            
            return True
        
        except Exception as e:
            logger.error(f"[EXECUTION] Failed to build workflow: {e}")
            return False
    
    async def execute_mission(self, mission_id: str) -> bool:
        """
        Execute mission workflow with retries and recovery.
        
        Returns True if mission completed successfully.
        """
        mission_context = self.mission_store.get_mission(mission_id)
        if not mission_context:
            logger.error(f"[EXECUTION] Mission {mission_id} not found")
            return False
        
        workflow = self._workflows.get(mission_id)
        if not workflow:
            logger.error(f"[EXECUTION] Workflow not found for mission {mission_id}")
            return False
        
        # Start the mission
        self.mission_manager.start_mission(mission_id)
        
        retry_count = 0
        max_retries = mission_context.max_retries
        
        while retry_count < max_retries:
            try:
                if await self._execute_workflow(mission_id, workflow):
                    # Mission completed successfully
                    self.mission_manager.complete_mission(
                        mission_id,
                        mission_context.results
                    )
                    return True
                else:
                    # Workflow failed, check if recoverable
                    if self.mission_manager.recovery_engine.can_recover(mission_id):
                        retry_count += 1
                        
                        if retry_count < max_retries:
                            logger.info(
                                f"[EXECUTION] Mission {mission_id} retry {retry_count}/{max_retries}"
                            )
                            
                            self.mission_manager.prepare_retry(mission_id)
                            
                            # Wait before retry with exponential backoff
                            backoff = 2 ** retry_count
                            await asyncio.sleep(min(backoff, 32))
                        else:
                            logger.error(
                                f"[EXECUTION] Max retries exceeded for mission {mission_id}"
                            )
                            self.mission_manager.fail_mission(
                                mission_id,
                                "Max retries exceeded"
                            )
                            return False
                    else:
                        logger.error(
                            f"[EXECUTION] Mission {mission_id} failed and not recoverable"
                        )
                        self.mission_manager.fail_mission(
                            mission_id,
                            "Workflow failed - no recovery checkpoint"
                        )
                        return False
            
            except Exception as e:
                logger.error(f"[EXECUTION] Unexpected error executing mission {mission_id}: {e}")
                self.mission_manager.fail_mission(mission_id, str(e))
                return False
        
        return False
    
    async def _execute_workflow(self, mission_id: str, 
                               workflow: DependencyGraph) -> bool:
        """
        Execute workflow steps in order.
        
        Returns True if all steps completed successfully.
        """
        mission_context = self.mission_store.get_mission(mission_id)
        if not mission_context:
            return False
        
        try:
            execution_order = workflow.get_execution_order()
            
            for step_id in execution_order:
                # Check if already completed
                if step_id in mission_context.completed_steps:
                    logger.info(f"[EXECUTION] Skipping completed step {step_id}")
                    continue
                
                # Check if previously failed
                if step_id in mission_context.failed_steps:
                    logger.warning(f"[EXECUTION] Step {step_id} previously failed, skipping")
                    continue
                
                # Execute step
                if not await self._execute_step(mission_id, workflow, step_id):
                    logger.error(f"[EXECUTION] Step {step_id} failed")
                    return False
            
            return True
        
        except Exception as e:
            logger.error(f"[EXECUTION] Workflow execution error: {e}")
            return False
    
    async def _execute_step(self, mission_id: str, workflow: DependencyGraph,
                           step_id: str) -> bool:
        """
        Execute single workflow step.
        
        Returns True if step succeeded.
        """
        mission_context = self.mission_store.get_mission(mission_id)
        if not mission_context:
            return False
        
        node = workflow.nodes[step_id]
        agent_id = node.agent_id
        
        logger.info(f"[EXECUTION] Executing step {step_id} with agent {agent_id}")
        
        # Register agent
        self.mission_manager.register_agent(mission_id, agent_id)
        
        # Get executor
        executor = self._agent_executors.get(agent_id)
        if not executor:
            logger.error(f"[EXECUTION] No executor registered for agent {agent_id}")
            self.mission_manager.record_step_result(
                mission_id, step_id, agent_id, "failed",
                error=f"No executor for {agent_id}"
            )
            return False
        
        try:
            # Execute with timeout
            result = await asyncio.wait_for(
                asyncio.to_thread(executor, mission_id, step_id, mission_context),
                timeout=node.timeout_seconds
            )
            
            # Record result
            self.mission_manager.record_step_result(
                mission_id, step_id, agent_id, "success",
                output=result or {}
            )
            
            # Update mission context
            mission_context.completed_steps.append(step_id)
            mission_context.current_step += 1
            mission_context.results[step_id] = result or {}
            
            logger.info(f"[EXECUTION] Step {step_id} completed successfully")
            
            return True
        
        except asyncio.TimeoutError:
            logger.error(f"[EXECUTION] Step {step_id} timeout after {node.timeout_seconds}s")
            
            if node.retryable:
                # Retryable step failed, but workflow will be retried
                return False
            else:
                self.mission_manager.record_step_result(
                    mission_id, step_id, agent_id, "failed",
                    error="Step timeout"
                )
                mission_context.failed_steps.append(step_id)
                return False
        
        except Exception as e:
            logger.error(f"[EXECUTION] Step {step_id} error: {e}")
            
            self.mission_manager.record_step_result(
                mission_id, step_id, agent_id, "failed",
                error=str(e)
            )
            
            if node.retryable:
                return False
            else:
                mission_context.failed_steps.append(step_id)
                return False
    
    def get_workflow_status(self, mission_id: str) -> Optional[Dict[str, Any]]:
        """Get current workflow execution status."""
        mission_context = self.mission_store.get_mission(mission_id)
        if not mission_context:
            return None
        
        workflow = self._workflows.get(mission_id)
        if not workflow:
            return None
        
        execution_order = workflow.get_execution_order()
        
        return {
            "mission_id": mission_id,
            "total_steps": len(execution_order),
            "completed_steps": len(mission_context.completed_steps),
            "failed_steps": len(mission_context.failed_steps),
            "current_step": mission_context.current_step,
            "progress_percent": int((len(mission_context.completed_steps) / len(execution_order) * 100)) if execution_order else 0,
            "execution_order": execution_order,
            "step_status": {
                step_id: self._get_step_status(step_id, mission_context)
                for step_id in execution_order
            }
        }
    
    def _get_step_status(self, step_id: str, mission_context) -> str:
        """Get status of single step."""
        if step_id in mission_context.completed_steps:
            return "completed"
        elif step_id in mission_context.failed_steps:
            return "failed"
        else:
            return "pending"
