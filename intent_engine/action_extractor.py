from typing import List

class ActionExtractor:
    """
    Extracts operational verbs (actions) from mission descriptions.
    Weights are assigned during the intent voting phase.
    """
    ACTION_MAP = {
        "analyze": 10, "review": 10, "evaluate": 10, "investigate": 10, "study": 10, "research": 10,
        "generate": 15, "create": 15, "update": 15, "delete": 15, "deploy": 15,
        "send": 20, "notify": 20, "email": 20, "approve": 25, "reject": 25, 
        "hire": 40, "promote": 40, "audit": 20, "scan": 15, "detect": 20
    }

    def extract(self, text: str) -> List[str]:
        words = text.lower().replace(',', ' ').split()
        detected = []
        for action in self.ACTION_MAP.keys():
            if action in words or action + "s" in words or action + "ing" in words:
                detected.append(action)
        
        return list(set(detected)) if detected else ["process"]
