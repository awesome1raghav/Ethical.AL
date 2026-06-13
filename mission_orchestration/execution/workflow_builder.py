from __future__ import annotations

import re
from typing import Iterable, List

from ..core.mission_state import MissionStep


class WorkflowBuilder:
    def build_steps(self, mission_text: str, suggested_agents: Iterable[str] | None = None) -> List[MissionStep]:
        text = mission_text.strip()
        clauses = [clause.strip() for clause in re.split(r"[\n.;]+", text) if clause.strip()]
        if not clauses:
            clauses = [text or "Execute mission"]

        steps: List[MissionStep] = []
        for index, clause in enumerate(clauses):
            agent_id = self._assign_agent(clause)
            if suggested_agents:
                agent_id = self._prefer_suggested(agent_id, suggested_agents)
            steps.append(
                MissionStep(
                    index=index,
                    name=clause[:240],
                    assigned_agent_id=agent_id,
                    is_legal=self._is_legal(clause),
                    legality_reason=self._legality_reason(clause),
                    dependencies=[] if index == 0 else [index - 1],
                )
            )
        return steps

    def _assign_agent(self, text: str) -> str:
        lowered = text.lower()
        if any(token in lowered for token in ("security", "threat", "malware", "vulnerability", "exploit", "attack")):
            return "threat_detector"
        if any(token in lowered for token in ("refund", "budget", "pricing", "money", "payment", "billing", "finance", "cost")):
            return "financial_auditor"
        if any(token in lowered for token in ("optimize", "scale", "schedule", "resource", "performance", "deploy", "workflow")):
            return "system_optimizer"
        return "research_agent"

    def _prefer_suggested(self, default_agent: str, suggested_agents: Iterable[str]) -> str:
        suggestions = list(dict.fromkeys(suggested_agents))
        if default_agent in suggestions:
            return default_agent
        return suggestions[0] if suggestions else default_agent

    def _is_legal(self, text: str) -> bool:
        lowered = text.lower()
        return not any(token in lowered for token in ("steal", "malware", "hack", "bypass", "evade", "fraud", "phish", "weapon"))

    def _legality_reason(self, text: str) -> str:
        if self._is_legal(text):
            return "Step verified as compliant with mission governance controls."
        return "Step violates governance controls and requires sovereign review."
