from typing import List, Dict

class WorkflowBuilder:
    """
    Decomposes a mission into specific execution steps.
    """
    def build_steps(self, mission_text: str) -> List[Dict]:
        # Simple decomposition logic
        # In a real system, this would use a task-planning LLM
        raw_steps = [s.strip() for s in mission_text.replace(',', '.').split('.') if s.strip()]
        
        steps = []
        for i, raw_action in enumerate(raw_steps):
            steps.append({
                "id": i + 1,
                "action": raw_action.capitalize()
            })
            
        return steps
