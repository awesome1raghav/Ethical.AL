from __future__ import annotations

import re
from typing import Dict, List

from ..core.mission_state import AgentResult
from ._shared import AgentRuntimeContext, BaseMissionAgent


class FinancialAuditor(BaseMissionAgent):
    agent_id = "financial_auditor"

    _patterns = [
        (re.compile(r"\b(refund|reimburse|payment|invoice|billing|budget|cost|pricing)\b", re.I), "financial or commercial impact"),
        (re.compile(r"\b(transfer|withdraw|bank|wire|payout|money|funds?)\b", re.I), "funds movement or monetary handling"),
        (re.compile(r"\b(fraud|chargeback|tax|account|credit card)\b", re.I), "financial compliance or fraud risk"),
    ]

    def _execute(self, context: AgentRuntimeContext, set_progress) -> AgentResult:
        set_progress(20)
        text = f"{context.mission.description}\n{context.step.name}"
        findings: List[Dict[str, str]] = []
        for pattern, reason in self._patterns:
            if pattern.search(text):
                findings.append({"reason": reason, "match": pattern.pattern})
        set_progress(100)
        compliance = "review_required" if findings else "clear"
        return AgentResult(
            mission_id=context.mission.mission_id,
            step_id=str(context.step.index),
            agent_id=self.agent_id,
            status="COMPLETED",
            progress=100,
            output={"compliance": compliance, "findings": findings},
            message="Financial review completed",
        )
