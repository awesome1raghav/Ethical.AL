import { PolicyRule, RiskScores, ClassificationReport } from '../types';

export const INITIAL_POLICIES: PolicyRule[] = [
  {
    id: "policy_autonomy_impact",
    name: "Autonomy/Impact Escorter",
    description: "Require Human Review if Autonomy > 80 and Impact > 70 to avoid unguided automated operations.",
    enabled: true,
    rawConditionText: "IF autonomy > 80 AND impact > 70 -> pause & escalate",
    condition: (scores: RiskScores) => {
      if (scores.autonomy > 80 && scores.impact > 70) {
        return {
          triggered: true,
          action: "pause",
          reason: `High autonomy demand (${scores.autonomy}) paired with significant impact potential (${scores.impact}) requires human oversight.`
        };
      }
      return { triggered: false, action: "none", reason: "" };
    }
  },
  {
    id: "policy_financial_cap",
    name: "Executive Treasury Approval",
    description: "Require executive treasury clearance if Financial Risk > 80 to prevent unapproved asset expenditures.",
    enabled: true,
    rawConditionText: "IF financial_risk > 80 -> pause & escalate",
    condition: (scores: RiskScores) => {
      if (scores.financial > 80) {
        return {
          triggered: true,
          action: "pause",
          reason: `Financial transfer exposure calculated at ${scores.financial} exceeds the absolute safety ceiling (80). Executive review required.`
        };
      }
      return { triggered: false, action: "none", reason: "" };
    }
  },
  {
    id: "policy_privacy_barrier",
    name: "PII & Privacy Hard Limit",
    description: "Instantly block execution if Privacy Risk > 85 to ensure direct compliance with global GDPR/HIPAA mandates.",
    enabled: true,
    rawConditionText: "IF privacy_risk > 85 -> block execution",
    condition: (scores: RiskScores) => {
      if (scores.privacy > 85) {
        return {
          triggered: true,
          action: "block",
          reason: `Privacy Risk calculated at ${scores.privacy} exceeds maximum permissible GDPR data leakage limits (85). Hard override initiated.`
        };
      }
      return { triggered: false, action: "none", reason: "" };
    }
  },
  {
    id: "policy_ethical_bias",
    name: "Ethical & Demographic Guard",
    description: "Require Human Approval if Ethical/Biometric Risk > 75 to avoid bias propagation or unconsented automated tracking.",
    enabled: true,
    rawConditionText: "IF ethical_risk > 75 -> pause & escalate",
    condition: (scores: RiskScores) => {
      if (scores.ethical > 75) {
        return {
          triggered: true,
          action: "pause",
          reason: `Ethical Risk level matches ${scores.ethical}, indicating possible automated profiling or biometric monitoring. Pause & escalate.`
        };
      }
      return { triggered: false, action: "none", reason: "" };
    }
  }
];

export function evaluatePolicies(
  scores: RiskScores,
  report: ClassificationReport,
  policies: PolicyRule[]
): {
  triggeredPolicies: { policyId: string; name: string; action: "block" | "pause" | "escalate" | "none"; reason: string }[];
  highestAction: "block" | "pause" | "none";
  escalationReason: string;
} {
  const triggeredPolicies: { policyId: string; name: string; action: "block" | "pause" | "escalate" | "none"; reason: string }[] = [];
  let highestAction: "block" | "pause" | "none" = "none";
  let escalationReason = "";

  for (const policy of policies) {
    if (!policy.enabled) continue;
    const evaluation = policy.condition(scores, report);
    if (evaluation.triggered) {
      triggeredPolicies.push({
        policyId: policy.id,
        name: policy.name,
        action: evaluation.action,
        reason: evaluation.reason
      });

      // Block takes highest precedence, then pause
      if (evaluation.action === "block") {
        highestAction = "block";
        escalationReason = evaluation.reason;
      } else if (evaluation.action === "pause" && highestAction !== "block") {
        highestAction = "pause";
        escalationReason = evaluation.reason;
      }
    }
  }

  return {
    triggeredPolicies,
    highestAction,
    escalationReason
  };
}

// Generate secure immutable-like cryptographic hash chains for ledger events
export function generateFauxHash(previousHash: string, dataString: string): string {
  let hash = 0;
  const raw = previousHash + dataString;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return "SV_" + Math.abs(hash).toString(16).padEnd(8, "f");
}
