from typing import List

class EntityExtractor:
    """
    Identifies primary subjects and objects with domain-specific weights.
    """
    ENTITY_MAP = {
        # Human Resources
        "employee": 35, "employees": 35, "promotion": 50, "candidate": 45, 
        "recruitment": 45, "manager": 20, "performance review": 40, "payroll": 50, "benefits": 30,
        # Finance
        "invoice": 40, "payment": 35, "revenue": 40, "budget": 30, "forecast": 25, "transaction": 45,
        # Cybersecurity
        "threat": 50, "vulnerability": 45, "attack": 50, "firewall": 40, "server": 20, "audit log": 35,
        # Healthcare
        "patient": 50, "medical record": 50, "diagnosis": 45, "hospital": 30,
        # General
        "customer": 25, "crm": 30, "database": 20, "report": 15, "summary": 15
    }

    def extract(self, text: str) -> List[str]:
        text_lower = text.lower()
        detected = []
        for entity in self.ENTITY_MAP.keys():
            if entity in text_lower:
                detected.append(entity)
        return list(set(detected))
