from typing import List, Dict
from collections import defaultdict

class ObjectiveDetector:
    """
    Infers the high-level goal (the 'why') of the mission.
    """
    OBJECTIVE_SIGNALS = {
        "Promotion Recommendation": ["promotion", "candidate", "recommendation"],
        "Fraud Detection": ["fraud", "suspicious", "detect", "transaction"],
        "Sales Optimization": ["sales", "improve", "optimize", "purchase"],
        "Risk Assessment": ["risk", "threat", "vulnerability", "assess"],
        "Compliance Monitoring": ["compliance", "audit", "regulation", "monitor"],
        "Process Automation": ["workflow", "automate", "update", "crm"]
    }

    def infer(self, text: str, domain_scores: Dict[str, float]) -> Dict[str, float]:
        text_lower = text.lower()
        scores = defaultdict(float)
        
        for objective, keywords in self.OBJECTIVE_SIGNALS.items():
            matches = sum(1 for kw in keywords if kw in text_lower)
            if matches > 0:
                scores[objective] = float(matches * 15)
        
        return dict(scores)
