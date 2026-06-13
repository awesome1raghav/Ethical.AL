from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Set

from ..core.mission_state import MissionStep


@dataclass
class DependencyGraph:
    adjacency: Dict[int, List[int]] = field(default_factory=dict)

    def build(self, steps: Iterable[MissionStep]) -> "DependencyGraph":
        step_list = list(steps)
        self.adjacency = {step.index: list(step.dependencies) for step in step_list}
        return self

    def ready_steps(self, completed_steps: Set[int]) -> List[int]:
        ready: List[int] = []
        for index, dependencies in self.adjacency.items():
            if index in completed_steps:
                continue
            if all(dependency in completed_steps for dependency in dependencies):
                ready.append(index)
        return ready
