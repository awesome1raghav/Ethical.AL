from typing import Dict, List
from collections import defaultdict

class IntentDetector:
    """
    Handles 'Intent Voting' using the critical weighted formula:
    Final Score = (Domain × 0.50 + Entity × 0.25 + Objective × 0.15 + Action × 0.10)
    """
    
    def calculate_intent_scores(
        self,
        action_scores: Dict[str, float],
        entity_scores: Dict[str, float],
        domain_scores: Dict[str, float],
        objective_scores: Dict[str, float]
    ) -> Dict[str, float]:
        final_scores = defaultdict(float)

        intents = set(
            list(action_scores.keys()) +
            list(entity_scores.keys()) +
            list(domain_scores.keys()) +
            list(objective_scores.keys())
        )

        for intent in intents:
            # Apply weighted formula
            final_scores[intent] = (
                domain_scores.get(intent, 0) * 0.50 +
                entity_scores.get(intent, 0) * 0.25 +
                objective_scores.get(intent, 0) * 0.15 +
                action_scores.get(intent, 0) * 0.10
            )

        return dict(final_scores)

    def calculate_confidence(self, scores: Dict[str, float]) -> int:
        if not scores:
            return 0

        values = sorted(scores.values(), reverse=True)
        if len(values) == 1:
            return 95

        winner = values[0]
        runner_up = values[1]

        if winner == 0:
            return 0

        margin = winner - runner_up
        # Margin-based confidence ensures we don't over-confide if two domains are close
        confidence = min(95, max(55, int((margin / max(winner, 1)) * 100) + 70))

        return confidence
