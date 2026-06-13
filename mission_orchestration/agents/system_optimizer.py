from __future__ import annotations

from typing import Dict, List

from ..core.mission_state import AgentResult
from ._shared import AgentRuntimeContext, BaseMissionAgent


class SystemOptimizer(BaseMissionAgent):
    agent_id = "system_optimizer"

    def _execute(self, context: AgentRuntimeContext, set_progress) -> AgentResult:
        set_progress(15)
        words = context.mission.description.split()
        estimated_parallelism = max(1, min(4, len(words) // 18 + 1))
        recommended_batch = max(1, len(words) // 12)
        set_progress(100)
        recommendations: List[Dict[str, int | str]] = [
            {"recommendation": "parallelize_independent_steps", "value": estimated_parallelism},
            {"recommendation": "batch_size", "value": recommended_batch},
        ]
        return AgentResult(
            mission_id=context.mission.mission_id,
            step_id=str(context.step.index),
            agent_id=self.agent_id,
            status="COMPLETED",
            progress=100,
            output={"recommendations": recommendations},
            message="System optimization completed",
        )
