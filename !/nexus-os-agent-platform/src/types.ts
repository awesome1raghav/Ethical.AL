export interface Policy {
  id: string;
  name: string;
  category: 'Data Privacy' | 'Spending' | 'Escalation' | 'Robustness';
  description: string;
  content: string; // The rule code or textual spec
  enabled: boolean;
  createdAt: string;
}

export interface MissionStep {
  id: string;
  stepName: string;
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
  output: string;
  logs: string[];
  policiesChecked: Array<{
    policyName: string;
    passed: boolean;
    reason: string;
  }>;
  securityStatus: 'safe' | 'alert' | 'blocked';
}

export interface Mission {
  id: string;
  title: string;
  input: string;
  status: 'planning' | 'running' | 'completed' | 'failed' | 'blocked';
  currentStepIndex: number;
  steps: MissionStep[];
  costTokens: number;
  createdAt: string;
  completedAt?: string;
}

export interface ThreatLog {
  id: string;
  attackType: string; // 'Prompt Injection' | 'Privilege Escalation' | 'Data Exfiltration' | 'Memory Poisoning'
  source: string; // 'External User Input' | 'Red Team Agent Simulation'
  payloadText: string;
  status: 'Blocked' | 'Logged' | 'Escalated';
  mitigated: boolean;
  timestamp: string;
  details: string;
}

export interface MemoryNode {
  id: string;
  agentName: string;
  type: 'semantic' | 'short-term' | 'knowledge';
  relation: string; // e.g. 'has_knowledge', 'completed_task'
  content: string;
  keyEntities: string[];
  createdAt: string;
}

export interface DbStatus {
  connected: boolean;
  type: 'mongodb' | 'json-fallback';
  connectionString: string;
  filepath?: string;
  stats?: {
    missions: number;
    policies: number;
    threats: number;
    memories: number;
  };
}
