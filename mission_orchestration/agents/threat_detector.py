from __future__ import annotations

import re
from typing import Dict, List

from ..core.mission_state import AgentResult
from ._shared import AgentRuntimeContext, BaseMissionAgent


class ThreatDetector(BaseMissionAgent):
    agent_id = "threat_detector"

    _patterns = [
        (re.compile(r"\b(malware|exploit|payload|backdoor|phishing|ransomware)\b", re.I), "malicious software or intrusion behavior"),
        (re.compile(r"\b(exfiltrat|steal|credential|token|secret|password)\b", re.I), "credential theft or data exfiltration"),
        (re.compile(r"\b(hack|bypass|circumvent|unauthorized|privilege escalation)\b", re.I), "unauthorized access or privilege escalation"),
        (re.compile(r"\b(surveillance|track|monitor.*without consent|spy)\b", re.I), "privacy-invasive surveillance behavior"),
    ]

    def _execute(self, context: AgentRuntimeContext, set_progress) -> AgentResult:
        set_progress(25)
        text = f"{context.mission.description}\n{context.step.name}"
        findings: List[Dict[str, str]] = []
        for pattern, reason in self._patterns:
            if pattern.search(text):
                findings.append({"reason": reason, "match": pattern.pattern})
        set_progress(100)
        risk = "critical" if len(findings) >= 2 else "elevated" if findings else "clear"
        return AgentResult(
            mission_id=context.mission.mission_id,
            step_id=str(context.step.index),
            agent_id=self.agent_id,
            status="COMPLETED",
            progress=100,
            output={"risk": risk, "findings": findings},
            message="Security analysis completed",
        )
