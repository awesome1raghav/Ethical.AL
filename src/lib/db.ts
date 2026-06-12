// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

// Define DB path in the workspace root
const DB_PATH = path.join(process.cwd(), 'database.db');

declare global {
  // @ts-ignore
  var sqliteDb: DatabaseSync | undefined;
}

export const db = globalThis.sqliteDb || new DatabaseSync(DB_PATH);

if (process.env.NODE_ENV !== 'production') {
  globalThis.sqliteDb = db;
}

// Function to initialize tables
export function initDb() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents_registry (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      primary_intent TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      clarity_score INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      step_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      is_legal INTEGER NOT NULL,
      legality_reason TEXT NOT NULL,
      assigned_agent_id TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (mission_id) REFERENCES missions(id)
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      agent_name TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (mission_id) REFERENCES missions(id)
    );
  `);

  // Seed default agents if registry is empty
  const checkAgents = db.prepare('SELECT COUNT(*) as count FROM agents_registry').get() as { count: number };
  if (checkAgents.count === 0) {
    const defaultAgents = [
      {
        id: 'compliance_enforcer',
        name: 'ComplianceEnforcer',
        role: 'Sovereign Compliance & Ethics Enforcer',
        description: 'Monitors mission actions to ensure zero policy deviations and compliance with global ethical bounds.',
        type: 'required',
        enabled: 1,
        status: 'idle'
      },
      {
        id: 'threat_detector',
        name: 'ThreatDetector',
        role: 'Citadel Security & Vulnerability Auditor',
        description: 'Audits network endpoints, payload structure, and data queries for potential security breaches or threats.',
        type: 'required',
        enabled: 1,
        status: 'idle'
      },
      {
        id: 'research_agent',
        name: 'ResearchAgent',
        role: 'Nexus Web & Knowledge Synthesizer',
        description: 'Runs the Ollama-backed deep research workflow for planning, synthesis, and report generation.',
        type: 'optional',
        enabled: 1,
        status: 'idle'
      },
      {
        id: 'financial_auditor',
        name: 'FinancialAuditor',
        role: 'Sovereign Transaction Audit Engine',
        description: 'Audits and tracks funds flow, payment details, and accounts validation to mitigate financial fraud.',
        type: 'optional',
        enabled: 1,
        status: 'idle'
      },
      {
        id: 'system_optimizer',
        name: 'SystemOptimizer',
        role: 'Nexus Swarm Coordinator & Resource Scheduler',
        description: 'Balances computing workloads, task priority queues, and optimizes token consumption rates.',
        type: 'optional',
        enabled: 1,
        status: 'idle'
      }
    ];

    const insertAgent = db.prepare(`
      INSERT INTO agents_registry (id, name, role, description, type, enabled, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const agent of defaultAgents) {
      insertAgent.run(
        agent.id,
        agent.name,
        agent.role,
        agent.description,
        agent.type,
        agent.enabled,
        agent.status
      );
    }
  }
}

// Auto-init on load
initDb();
