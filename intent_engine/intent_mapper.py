from dataclasses import dataclass, field
from typing import List, Dict, Any
import json
from .action_extractor import ActionExtractor
from .entity_extractor import EntityExtractor
from .domain_detector import DomainDetector
from .objective_detector import ObjectiveDetector
from .intent_detector import IntentDetector

@dataclass
class IntentMap:
    primary_intent: str
    secondary_intents: List[str]
    domain: str
    objective: str
    actions: List[str]
    entities: List[str]
    stakeholders: List[str]
    authority_level: Dict[str, Any]
    workflow: Dict[str, Any]
    human_impact: Dict[str, bool]
    governance_signals: Dict[str, bool]
    confidence: int
    evidence: List[str]
    reasoning: List[str]

    def to_json(self):
        return json.dumps(self.__dict__, indent=2)

class IntentMapper:
    """
    Deterministic Intent Analysis System for EthicalAI.
    Orchestrates extraction layers and applies weighted intent classification.
    """
    def __init__(self):
        self.action_ext = ActionExtractor()
        self.entity_ext = EntityExtractor()
        self.domain_det = DomainDetector()
        self.obj_det = ObjectiveDetector()
        self.intent_det = IntentDetector()

    def process_mission(self, mission_text: str) -> IntentMap:
        # 1. Extraction Layers
        actions = self.action_ext.extract(mission_text)
        entities = self.entity_ext.extract(mission_text)
        
        # 2. Score Contribution
        domain_raw_scores = self.domain_det.detect(actions, entities)
        objective_raw_scores = self.obj_det.infer(mission_text, domain_raw_scores)
        
        # Convert signals to individual score maps for the voter
        action_keyword_scores = {a: 10.0 for a in actions}
        entity_keyword_scores = {e: self.entity_ext.ENTITY_MAP.get(e, 10.0) for e in entities}

        # 3. Final Intent Voting (Weighted Formula)
        final_scores = self.intent_det.calculate_intent_scores(
            action_scores=action_keyword_scores,
            entity_scores=entity_keyword_scores,
            domain_scores=domain_raw_scores,
            objective_scores=objective_raw_scores
        )
        
        # Determine Intents
        sorted_intents = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
        primary_intent = sorted_intents[0][0] if sorted_intents else "Research & Analysis"
        secondary = [item[0] for item in sorted_intents[1:3] if item[1] > 0]
        
        confidence = self.intent_det.calculate_confidence(final_scores)

        # 4. Governance & Meta Detection
        authority = self._detect_authority(actions, mission_text)
        workflow = self._analyze_workflow(actions)
        impact = self._analyze_impact(entities, primary_intent)
        signals = self._detect_governance_signals(mission_text, entities, primary_intent)

        # 5. Evidence & Reasoning
        evidence = [f"✓ {e} detected" for e in entities]
        evidence += [f"✓ {a} action identified" for a in actions]
        
        reasoning = [
            f"Primary intent {primary_intent} selected via weighted domain scoring.",
            f"Domain signals ({domain_raw_scores.get(primary_intent, 0)}) exceeded action noise.",
            f"Confidence calculated at {confidence}% based on signal margin."
        ]

        return IntentMap(
            primary_intent=primary_intent,
            secondary_intents=secondary,
            domain=primary_intent,
            objective=next(iter(objective_raw_scores.keys()), "System Execution"),
            actions=actions,
            entities=entities,
            stakeholders=self._detect_stakeholders(entities),
            authority_level=authority,
            workflow=workflow,
            human_impact=impact,
            governance_signals=signals,
            confidence=confidence,
            evidence=evidence,
            reasoning=reasoning
        )

    def _detect_authority(self, actions: List[str], text: str) -> Dict[str, Any]:
        if any(a in ["enforce", "reject", "block"] for a in actions):
            return {"level": 5, "label": "Enforce"}
        if "approve" in actions:
            return {"level": 4, "label": "Approve"}
        if "update" in actions or "create" in actions or "delete" in actions:
            return {"level": 3, "label": "Execute"}
        if "recommend" in text.lower():
            return {"level": 1, "label": "Recommend"}
        return {"level": 0, "label": "Inform"}

    def _analyze_workflow(self, actions: List[str]) -> Dict[str, Any]:
        count = len(actions)
        complexity = "LOW"
        if count >= 7: complexity = "CRITICAL"
        elif count >= 5: complexity = "HIGH"
        elif count >= 3: complexity = "MEDIUM"
        return {"steps": count, "complexity": complexity}

    def _analyze_impact(self, entities: List[str], intent: str) -> Dict[str, bool]:
        return {
            "employment": intent == "Human Resources" or "employee" in entities,
            "finance": intent in ["Finance", "Financial Risk Management"] or "payment" in entities,
            "healthcare": intent == "Healthcare" or "patient" in entities,
            "education": intent == "Education",
            "legal": intent == "Legal Operations",
            "safety": intent == "Cybersecurity" or "threat" in entities
        }

    def _detect_governance_signals(self, text: str, entities: List[str], intent: str) -> Dict[str, bool]:
        return {
            "privacy_sensitive": any(e in ["employee", "patient", "medical record"] for e in entities),
            "financial_sensitive": intent in ["Finance", "Financial Risk Management"],
            "human_consequence": intent == "Human Resources" or "hire" in text or "promote" in text,
            "compliance_relevant": intent == "Compliance" or "audit" in text,
            "system_modification": any(a in ["update", "create", "delete"] for a in text.split()),
            "automated_decision_making": any(a in ["approve", "reject", "hire", "promote"] for a in text.split())
        }

    def _detect_stakeholders(self, entities: List[str]) -> List[str]:
        stakeholders = []
        if "employee" in entities or "employees" in entities: stakeholders.append("Employees")
        if "manager" in entities: stakeholders.append("Department Managers")
        if "customer" in entities: stakeholders.append("Customers")
        if "patient" in entities: stakeholders.append("Patients")
        return list(set(stakeholders))
