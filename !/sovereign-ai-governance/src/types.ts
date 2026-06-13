export enum MissionState {
  RUNNING = "RUNNING",
  PAUSED = "PAUSED",
  WAITING_FOR_HUMAN = "WAITING_FOR_HUMAN",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

export enum RiskLevel {
  LOW = "LOW",
  GUARDED = "GUARDED",
  ELEVATED = "ELEVATED",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL"
}

export enum DecisionType {
  AUTO_APPROVE = "AUTO APPROVE",
  MONITOR = "MONITOR",
  HUMAN_REVIEW = "HUMAN REVIEW",
  SOVEREIGN_INTERVENTION = "SOVEREIGN INTERVENTION"
}

export interface RiskScores {
  security: number;   // 0-100
  privacy: number;    // 0-100
  financial: number;  // 0-100
  ethical: number;    // 0-100
  execution: number;  // 0-100
  autonomy: number;   // 0-100
  impact: number;     // 0-100
}

export interface ClassificationReport {
  intent: string;
  domain: string;
  hasPII: boolean;
  sensitiveDataDetected: boolean;
  humanImpactDetected: boolean;
  financialImpactDetected: boolean;
  ethicalImpactDetected: boolean;
  autonomyDetected: boolean;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: (scores: RiskScores, report: ClassificationReport) => { triggered: boolean; action: "block" | "pause" | "escalate" | "none"; reason: string };
  rawConditionText: string;
}

export interface AgentEvent {
  agent_id: string;
  mission_id: string;
  status: string;
  current_step: string;
  current_action: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  mission_id: string;
  event_type: "MISSION_CREATED" | "MISSION_STARTED" | "RISK_CALCULATED" | "POLICY_TRIGGERED" | "MISSION_PAUSED" | "HUMAN_APPROVED" | "HUMAN_REJECTED" | "HUMAN_MODIFIED" | "MISSION_RESUMED" | "MISSION_COMPLETED" | "MISSION_FAILED" | "INTERVENTION_INJECTED";
  agent_id?: string;
  message: string;
  details?: string;
  riskScore?: number;
  hash: string; // SHA-256 simulation representing immutable block linkage
}

export interface MissionCheckpoint {
  missionId: string;
  agentId: string;
  stepName: string;
  actionDetails: string;
  checkpointData: any;
  reason: string;
  riskScores: RiskScores;
}

export interface Mission {
  id: string;
  prompt: string;
  state: MissionState;
  createdAt: string;
  updatedAt: string;
  riskScores: RiskScores;
  classification: ClassificationReport;
  decision: DecisionType;
  currentAgent: string;
  currentStep: string;
  currentActionText: string;
  stepIndex: number;
  checkpoint?: MissionCheckpoint;
  logs: AgentEvent[];
}

export interface AppState {
  missions: Mission[];
  activeMissionId: string | null;
  policies: PolicyRule[];
  auditLogs: AuditLog[];
  modelLoading: boolean;
  modelError: string | null;
  usingTransformerModel: boolean;
}
