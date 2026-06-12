'use server';

import { db } from '@/lib/db';

export async function saveMission(
  id: string,
  description: string,
  primaryIntent: string,
  riskLevel: string,
  clarityScore: number,
  steps: { name: string; assigned_agent_id: string; is_legal: boolean; legality_reason: string }[],
  agents: { id: string; enabled: boolean }[]
) {
  // Insert mission
  const insertMission = db.prepare(`
    INSERT INTO missions (id, description, primary_intent, risk_level, clarity_score, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertMission.run(
    id,
    description,
    primaryIntent,
    riskLevel,
    clarityScore,
    'running',
    new Date().toISOString()
  );

  // Insert steps
  const insertStep = db.prepare(`
    INSERT INTO steps (id, mission_id, step_index, name, is_legal, legality_reason, assigned_agent_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  steps.forEach((step, index) => {
    insertStep.run(
      `${id}-step-${index}`,
      id,
      index,
      step.name,
      step.is_legal ? 1 : 0,
      step.legality_reason,
      step.assigned_agent_id,
      'pending'
    );
  });

  // Update agents settings (enabled/disabled and reset status to idle)
  const updateAgent = db.prepare(`
    UPDATE agents_registry
    SET enabled = ?, status = 'idle'
    WHERE id = ?
  `);
  agents.forEach((agent) => {
    updateAgent.run(agent.enabled ? 1 : 0, agent.id);
  });
}

export async function getLatestMission() {
  const latestMission = db.prepare(`
    SELECT * FROM missions ORDER BY created_at DESC LIMIT 1
  `).get() as any;

  if (!latestMission) return null;

  const steps = db.prepare(`
    SELECT * FROM steps WHERE mission_id = ? ORDER BY step_index ASC
  `).all(latestMission.id) as any[];

  const agents = db.prepare(`
    SELECT * FROM agents_registry
  `).all() as any[];

  return JSON.parse(JSON.stringify({
    mission: latestMission,
    steps: steps.map((s: any) => ({
      ...s,
      is_legal: s.is_legal === 1
    })),
    agents
  }));
}

export async function getMissionsHistory() {
  const data = db.prepare(`
    SELECT * FROM missions ORDER BY created_at DESC
  `).all() as any[];
  return JSON.parse(JSON.stringify(data));
}

export async function updateStepStatusAction(stepId: string, status: string) {
  db.prepare(`
    UPDATE steps SET status = ? WHERE id = ?
  `).run(status, stepId);
}

export async function updateAgentStatusAction(agentId: string, status: string) {
  db.prepare(`
    UPDATE agents_registry SET status = ? WHERE id = ?
  `).run(status, agentId);
}

export async function insertChatMessage(
  missionId: string,
  sender: string,
  agentName: string | null,
  message: string
) {
  const id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  db.prepare(`
    INSERT INTO chat_history (id, mission_id, sender, agent_name, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, missionId, sender, agentName, message, new Date().toISOString());
}

export async function getChatHistory(missionId: string) {
  const data = db.prepare(`
    SELECT * FROM chat_history WHERE mission_id = ? ORDER BY created_at ASC
  `).all(missionId) as any[];
  return JSON.parse(JSON.stringify(data));
}
