"""
Dependency graph builder for workflow step ordering and execution planning.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set


@dataclass
class WorkflowNode:
    """Represents a step in the workflow."""
    step_id: str
    agent_id: str
    description: str
    dependencies: Set[str] = field(default_factory=set)
    retryable: bool = True
    timeout_seconds: int = 300


class DependencyGraph:
    """
    Manages workflow step dependencies and execution order.
    
    Detects:
    - Circular dependencies
    - Missing dependencies
    - Execution ordering
    """
    
    def __init__(self):
        self.nodes: Dict[str, WorkflowNode] = {}
        self._execution_order: List[str] = []
        self._sorted = False
    
    def add_node(self, node: WorkflowNode) -> None:
        """Add step node to graph."""
        if node.step_id in self.nodes:
            raise ValueError(f"Step {node.step_id} already exists")
        
        self.nodes[node.step_id] = node
        self._sorted = False
    
    def add_dependency(self, step_id: str, depends_on: str) -> None:
        """Add dependency between steps."""
        if step_id not in self.nodes:
            raise ValueError(f"Step {step_id} not found")
        
        if depends_on not in self.nodes:
            raise ValueError(f"Dependency step {depends_on} not found")
        
        self.nodes[step_id].dependencies.add(depends_on)
        self._sorted = False
    
    def validate(self) -> bool:
        """
        Validate graph for circular dependencies and issues.
        
        Returns True if valid.
        Raises ValueError if invalid.
        """
        # Check for circular dependencies
        visited: Set[str] = set()
        rec_stack: Set[str] = set()
        
        def has_cycle(node_id: str) -> bool:
            visited.add(node_id)
            rec_stack.add(node_id)
            
            node = self.nodes[node_id]
            for dep_id in node.dependencies:
                if dep_id not in visited:
                    if has_cycle(dep_id):
                        return True
                elif dep_id in rec_stack:
                    return True
            
            rec_stack.remove(node_id)
            return False
        
        for node_id in self.nodes:
            if node_id not in visited:
                if has_cycle(node_id):
                    raise ValueError(f"Circular dependency detected involving {node_id}")
        
        return True
    
    def get_execution_order(self) -> List[str]:
        """
        Get topological sort of steps for execution.
        
        Returns step IDs in order they should be executed.
        """
        if self._sorted:
            return self._execution_order.copy()
        
        self.validate()
        
        # Topological sort using Kahn's algorithm
        in_degree = {node_id: 0 for node_id in self.nodes}
        
        for node in self.nodes.values():
            for dep_id in node.dependencies:
                in_degree[node.step_id] += 1
        
        # Find all nodes with no incoming edges
        queue = [node_id for node_id in self.nodes if in_degree[node_id] == 0]
        result = []
        
        while queue:
            node_id = queue.pop(0)
            result.append(node_id)
            
            # Find all nodes that depend on this node
            for other_id, other_node in self.nodes.items():
                if node_id in other_node.dependencies:
                    in_degree[other_id] -= 1
                    if in_degree[other_id] == 0:
                        queue.append(other_id)
        
        if len(result) != len(self.nodes):
            raise ValueError("Circular dependency or invalid graph")
        
        self._execution_order = result
        self._sorted = True
        
        return result.copy()
    
    def get_ready_steps(self, completed_steps: Set[str]) -> List[str]:
        """
        Get steps that are ready to execute.
        
        A step is ready if all its dependencies are completed.
        """
        ready = []
        
        for node_id, node in self.nodes.items():
            if node_id in completed_steps:
                continue  # Already done
            
            # Check if all dependencies are completed
            if node.dependencies.issubset(completed_steps):
                ready.append(node_id)
        
        return ready
    
    def get_dependencies(self, step_id: str) -> Set[str]:
        """Get all dependencies of a step."""
        if step_id not in self.nodes:
            raise ValueError(f"Step {step_id} not found")
        
        return self.nodes[step_id].dependencies.copy()
    
    def get_dependents(self, step_id: str) -> Set[str]:
        """Get all steps that depend on this step."""
        dependents = set()
        
        for node_id, node in self.nodes.items():
            if step_id in node.dependencies:
                dependents.add(node_id)
        
        return dependents
