from typing import Dict, List
from .workflow_builder import WorkflowBuilder
from .dependency_detector import DependencyDetector

class ExecutionMapper:
    """
    Constructs the final Execution Map for the mission swarm.
    """
    def __init__(self):
        self.builder = WorkflowBuilder()
        self.dep_det = DependencyDetector()

    def generate_map(self, mission_text: str) -> Dict:
        steps = self.builder.build_steps(mission_text)
        dependencies = self.dep_det.map_dependencies(steps)
        
        return {
            "steps": steps,
            "dependencies": dependencies,
            "metrics": {
                "workflow_length": len(steps),
                "complexity": "Medium" if len(steps) > 3 else "Low",
                "automation_level": "High"
            }
        }
