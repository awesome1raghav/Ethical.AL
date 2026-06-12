"""
Workflow builder for constructing mission execution plans from mission intent.
"""

from typing import Dict, List, Optional

from ..core.mission_state import MissionContext
from .dependency_graph import DependencyGraph, WorkflowNode


class WorkflowBuilder:
    """
    Builds execution workflows from mission intent and agent capabilities.
    
    Creates:
    - Step sequences
    - Agent assignments
    - Dependency chains
    """
    
    def __init__(self):
        self.workflow_templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, List[Dict]]:
        """Load workflow templates by intent type."""
        return {
            "research": [
                {
                    "step_id": "research_01",
                    "agent_id": "research_agent",
                    "description": "Search and collect research data",
                    "dependencies": set(),
                    "retryable": True,
                    "timeout_seconds": 300
                },
                {
                    "step_id": "research_02",
                    "agent_id": "analysis_agent",
                    "description": "Synthesize research findings",
                    "dependencies": {"research_01"},
                    "retryable": True,
                    "timeout_seconds": 300
                },
                {
                    "step_id": "research_03",
                    "agent_id": "threat_detector",
                    "description": "Scan for threats and risks",
                    "dependencies": {"research_02"},
                    "retryable": True,
                    "timeout_seconds": 300
                }
            ],
            "systems_analysis": [
                {
                    "step_id": "analysis_01",
                    "agent_id": "threat_detector",
                    "description": "Detect system threats",
                    "dependencies": set(),
                    "retryable": True,
                    "timeout_seconds": 300
                },
                {
                    "step_id": "analysis_02",
                    "agent_id": "financial_auditor",
                    "description": "Analyze financial impact",
                    "dependencies": {"analysis_01"},
                    "retryable": True,
                    "timeout_seconds": 300
                },
                {
                    "step_id": "analysis_03",
                    "agent_id": "system_optimizer",
                    "description": "Recommend optimizations",
                    "dependencies": {"analysis_02"},
                    "retryable": True,
                    "timeout_seconds": 300
                }
            ],
            "compliance": [
                {
                    "step_id": "compliance_01",
                    "agent_id": "research_agent",
                    "description": "Research compliance requirements",
                    "dependencies": set(),
                    "retryable": True,
                    "timeout_seconds": 300
                },
                {
                    "step_id": "compliance_02",
                    "agent_id": "threat_detector",
                    "description": "Check compliance violations",
                    "dependencies": {"compliance_01"},
                    "retryable": True,
                    "timeout_seconds": 300
                },
                {
                    "step_id": "compliance_03",
                    "agent_id": "analysis_agent",
                    "description": "Generate compliance report",
                    "dependencies": {"compliance_02"},
                    "retryable": True,
                    "timeout_seconds": 300
                }
            ],
            "default": [
                {
                    "step_id": "default_01",
                    "agent_id": "research_agent",
                    "description": "Execute primary mission task",
                    "dependencies": set(),
                    "retryable": True,
                    "timeout_seconds": 300
                },
                {
                    "step_id": "default_02",
                    "agent_id": "analysis_agent",
                    "description": "Analyze results",
                    "dependencies": {"default_01"},
                    "retryable": True,
                    "timeout_seconds": 300
                }
            ]
        }
    
    def build_workflow(self, mission_context: MissionContext) -> DependencyGraph:
        """
        Build workflow dependency graph from mission context.
        
        Returns configured DependencyGraph.
        """
        graph = DependencyGraph()
        
        # Detect intent type
        intent_type = self._detect_intent(mission_context.description)
        
        # Get appropriate template
        template = self.workflow_templates.get(intent_type, self.workflow_templates["default"])
        
        # Add nodes to graph
        for step_config in template:
            node = WorkflowNode(
                step_id=step_config["step_id"],
                agent_id=step_config["agent_id"],
                description=step_config["description"],
                dependencies=step_config["dependencies"],
                retryable=step_config["retryable"],
                timeout_seconds=step_config["timeout_seconds"]
            )
            graph.add_node(node)
        
        # Validate workflow
        graph.validate()
        
        return graph
    
    def _detect_intent(self, description: str) -> str:
        """Detect mission intent from description."""
        description_lower = description.lower()
        
        if any(word in description_lower for word in ["research", "analyze", "find", "search"]):
            return "research"
        
        if any(word in description_lower for word in ["system", "server", "infrastructure", "platform"]):
            return "systems_analysis"
        
        if any(word in description_lower for word in ["compliance", "policy", "regulation", "audit"]):
            return "compliance"
        
        return "default"
    
    def get_next_steps(self, graph: DependencyGraph, 
                      completed_steps: List[str],
                      failed_steps: List[str]) -> List[str]:
        """
        Get next steps ready for execution.
        
        Returns list of step IDs that are ready to run.
        """
        completed_set = set(completed_steps)
        
        # Don't re-execute failed steps
        for failed_step in failed_steps:
            completed_set.add(failed_step)
        
        ready_steps = graph.get_ready_steps(completed_set)
        
        return ready_steps
    
    def build_parallel_workflow(self, mission_context: MissionContext,
                               num_workers: int = 3) -> DependencyGraph:
        """
        Build workflow with parallelizable steps.
        
        Attempts to create parallel execution paths where possible.
        """
        base_graph = self.build_workflow(mission_context)
        
        # For now, return base workflow
        # Parallel optimization would go here
        
        return base_graph
