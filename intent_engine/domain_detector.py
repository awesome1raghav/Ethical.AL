from typing import List, Dict
from collections import defaultdict

class DomainDetector:
    """
    Maps detected entities and actions to a specialized operational domain.
    Weights are tuned to ensure Domain signals lead the classification.
    """
    DOMAIN_MAP = {
        "Human Resources": ["employee", "employees", "promotion", "candidate", "recruitment", "manager", "performance review", "payroll", "benefits"],
        "Finance": ["invoice", "payment", "revenue", "forecast", "budget", "investment", "refund", "transaction", "fraud"],
        "Healthcare": ["patient", "medical", "diagnosis", "hospital", "treatment", "clinical"],
        "Cybersecurity": ["threat", "audit log", "incident", "server", "vulnerability", "attack", "security", "breach", "firewall"],
        "Government Services": ["citizen", "policy", "regulation", "permit", "public service", "government"],
        "Operations": ["crm", "inventory", "workflow", "operations", "sales process", "logistics"],
        "Research & Analysis": ["analyze", "review", "evaluate", "investigate", "study", "research", "market", "competitor", "trends"],
        "Communication": ["notify", "email", "report", "summary", "presentation", "send"]
    }

    def detect(self, actions: List[str], entities: List[str]) -> Dict[str, float]:
        scores = defaultdict(float)
        combined_signals = actions + entities
        
        for domain, keywords in self.DOMAIN_MAP.items():
            matches = 0
            for signal in combined_signals:
                if signal in keywords:
                    # Domain keywords contribute heavily to the base domain score
                    matches += 1
            
            if matches > 0:
                scores[domain] = float(matches * 25) # Base multiplier for domain signals
                
        return dict(scores)
