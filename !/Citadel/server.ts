import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  connectDB,
  getDBStatus,
  getPolicies,
  updatePolicy,
  createPolicy,
  getMissions,
  createMission,
  updateMission,
  deleteMission,
  getThreatLogs,
  recordThreatLog,
  clearThreatLogs,
  getMemories,
  addMemory
} from './server/db';
import { planMission, executeStepWithAI, simulateAdversarialAttack } from './server/gemini';
import { Mission, ThreatLog, MemoryNode } from './src/types';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // 1. Core middleware
  app.use(express.json());

  // 2. Initialize Database on startup
  console.log('Booting Nexus OS storage system...');
  const dbStatus = await connectDB();
  console.log(`Nexus OS storage activated in [${dbStatus.type}] mode.`);

  // ----------------------------------------------------
  // API ROUTING SECTION (Precedes Vite middleware setup)
  // ----------------------------------------------------

  // A. Database Status Info
  app.get('/api/db-status', (req, res) => {
    res.json(getDBStatus());
  });

  // B. Sovereign Governance Policies
  app.get('/api/policies', async (req, res) => {
    try {
      const policies = await getPolicies();
      res.json(policies);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/policies/toggle', async (req, res) => {
    const { id, enabled } = req.body;
    if (typeof id !== 'string' || typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'Missing id (string) or enabled (boolean) parameters' });
      return;
    }
    try {
      const updated = await updatePolicy(id, enabled);
      if (updated) {
        res.json(updated);
      } else {
        res.status(404).json({ error: 'Policy not found' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/policies', async (req, res) => {
    const { name, category, description, content } = req.body;
    if (!name || !category || !description || !content) {
      res.status(400).json({ error: 'Missing name, category, description, or content fields' });
      return;
    }
    try {
      const created = await createPolicy({ name, category, description, content, enabled: true });
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // C. Agent Missions (Command & Orchestrator)
  app.get('/api/missions', async (req, res) => {
    try {
      const missions = await getMissions();
      res.json(missions);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/missions', async (req, res) => {
    const { title, input } = req.body;
    if (!title || !input) {
      res.status(400).json({ error: 'Missing title or input objective parameters' });
      return;
    }

    try {
      console.log(`Decomposing project objectives for mission: "${title}"...`);
      // Use Gemini to plan steps
      const rawSteps = await planMission(title, input);
      
      const newMission: Mission = {
        id: `m-${Date.now()}`,
        title,
        input,
        status: 'planning',
        currentStepIndex: 0,
        costTokens: 0,
        createdAt: new Date().toISOString(),
        steps: rawSteps.map(step => ({
          ...step,
          status: 'pending',
          output: '',
          logs: ['Step scheduled by ProjectManager.'],
          policiesChecked: [],
          securityStatus: 'safe',
        })),
      };

      const saved = await createMission(newMission);
      res.json(saved);
    } catch (e: any) {
      console.error('Failure planning mission:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // D. Async Execution Runner
  app.post('/api/execute-step', async (req, res) => {
    const { missionInput, stepName, agentName, previousOutputs } = req.body;
    if (!missionInput || !stepName || !agentName) {
      res.status(400).json({ error: 'Missing missionInput, stepName, or agentName' });
      return;
    }

    try {
      console.log(`Executing step [${stepName}] via agent [${agentName}]...`);
      const policies = await getPolicies();
      
      const result = await executeStepWithAI(
        missionInput,
        stepName,
        agentName,
        policies,
        previousOutputs || []
      );

      res.json(result);
    } catch (e: any) {
      console.error('Failed to execute step:', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/missions/execute', async (req, res) => {
    const { missionId } = req.body;
    if (!missionId) {
      res.status(400).json({ error: 'No missionId provided' });
      return;
    }

    try {
      const missions = await getMissions();
      const mission = missions.find(m => m.id === missionId);
      if (!mission) {
        res.status(404).json({ error: 'Mission not found' });
        return;
      }

      // Check if already executed or done
      if (mission.status === 'running') {
        res.status(400).json({ error: 'Mission execution is already in progress' });
        return;
      }

      // Start asynchronous execution block immediately
      mission.status = 'running';
      mission.currentStepIndex = 0;
      await updateMission(mission);

      // Trigger asynchronous work (doesn't block the caller)
      (async () => {
        try {
          console.log(`Starting real-time execution worker for mission [${missionId}]`);
          const policies = await getPolicies();
          const previousOutputs: string[] = [];

          for (let i = 0; i < mission.steps.length; i++) {
            // Update active index
            mission.currentStepIndex = i;
            mission.steps[i].status = 'running';
            mission.steps[i].logs.push('[KERNEL] Initialized isolated container worker.');
            await updateMission(mission);

            // Execute using server Agent Simulator
            const result = await executeStepWithAI(
              mission.input,
              mission.steps[i].stepName,
              mission.steps[i].agentName,
              policies,
              previousOutputs
            );

            // Update details
            mission.steps[i].status = result.securityStatus === 'blocked' ? 'blocked' : 'completed';
            mission.steps[i].output = result.output;
            mission.steps[i].logs = [...mission.steps[i].logs, ...result.logs, `[KERNEL] Completed worker with status: ${mission.steps[i].status}`];
            mission.steps[i].policiesChecked = result.policiesChecked;
            mission.steps[i].securityStatus = result.securityStatus;

            previousOutputs.push(result.output);
            
            // Check Sovereign blocking conditions or Citadel violations
            const failedPolicy = result.policiesChecked.find(p => !p.passed);
            const isBlockedPolicy = failedPolicy && policies.find(p => p.name === failedPolicy.policyName)?.category === 'Escalation';
            
            if (result.securityStatus === 'blocked' || isBlockedPolicy) {
              mission.status = 'blocked';
              mission.steps[i].status = 'blocked';
              mission.steps[i].logs.push(`[SOVEREIGN CRITICAL CHECK] Blocked: Rule "${failedPolicy?.policyName || 'Malicious Autonomy'}" triggered dynamic halt!`);
              
              // Record threat incident in Citadel log
              const threat: ThreatLog = {
                id: `threat-${Date.now()}`,
                attackType: 'Privilege Escalation & Rogue Agent Creation',
                source: `Mission: ${mission.title}`,
                payloadText: `Input: ${mission.input} | Executing: ${mission.steps[i].stepName}`,
                status: 'Blocked',
                mitigated: true,
                timestamp: new Date().toISOString(),
                details: `Autonomous escalation or critical policy veto occurred during agent run. Halted task to guarantee security. Policy: "${failedPolicy?.policyName || 'Core Sandboxing'}"`,
              };
              await recordThreatLog(threat);
              break;
            }

            // Mock cost/token generation
            mission.costTokens += Math.floor(Math.random() * 1200) + 400;
            
            // Add a small delay for feeling reactive progress
            await new Promise(resolve => setTimeout(resolve, 1500));
          }

          // Complete the mission if no step was blocked
          if (mission.status === 'running') {
            mission.status = 'completed';
            mission.completedAt = new Date().toISOString();
            
            // Log knowledge integration automatically
            const keyEntities = ['Agentic Deployment', mission.title];
            const memory: MemoryNode = {
              id: `m-log-${Date.now()}`,
              agentName: mission.steps[0].agentName,
              type: 'knowledge',
              relation: 'concluded_mission',
              content: `Mission "${mission.title}" successfully completed. Key outcome data verified by compliance: "${previousOutputs[previousOutputs.length - 1].slice(0, 100)}..."`,
              keyEntities,
              createdAt: new Date().toISOString(),
            };
            await addMemory(memory);
          }

          await updateMission(mission);
          console.log(`Async execution completed for mission [${missionId}] with overall status: ${mission.status}`);
        } catch (err: any) {
          console.error(`Async execution error for mission [${missionId}]:`, err);
          mission.status = 'failed';
          await updateMission(mission).catch(() => {});
        }
      })();

      res.json({ status: 'running', message: 'Mission started asynchronously.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/missions/:id', async (req, res) => {
    try {
      const success = await deleteMission(req.params.id);
      res.json({ success });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // E. Citadel Adversarial / Red-Team simulator
  app.get('/api/threats', async (req, res) => {
    try {
      const logs = await getThreatLogs();
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/threats/simulate', async (req, res) => {
    const { attackType, payload } = req.body;
    if (!attackType || !payload) {
      res.status(400).json({ error: 'Missing attackType or payload parameters' });
      return;
    }

    try {
      console.log(`Running Citadel active scanner red-team simulation for type [${attackType}]...`);
      const simulation = await simulateAdversarialAttack(attackType, payload);
      const readyThreat: ThreatLog = {
        ...simulation,
        id: `threat-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      
      const saved = await recordThreatLog(readyThreat);
      res.json(saved);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/threats/clear', async (req, res) => {
    try {
      await clearThreatLogs();
      res.json({ success: true, message: 'All security incident logs cleared.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // F. Semantic Knowledge Graph / Memory Interface
  app.get('/api/memories', async (req, res) => {
    try {
      const search = req.query.q as string;
      const memories = await getMemories(search);
      res.json(memories);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/memories', async (req, res) => {
    const { agentName, type, relation, content, keyEntities } = req.body;
    if (!agentName || !type || !relation || !content) {
      res.status(400).json({ error: 'Missing agentName, type, relation, or content parameter fields' });
      return;
    }

    try {
      const node: MemoryNode = {
        id: `m-custom-${Date.now()}`,
        agentName,
        type,
        relation,
        content,
        keyEntities: Array.isArray(keyEntities) ? keyEntities : [],
        createdAt: new Date().toISOString(),
      };

      const saved = await addMemory(node);
      res.json(saved);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // G. Model Information (to support clean client side indicators)
  app.get('/api/model-info', (req, res) => {
    const provider = (process.env.AI_PROVIDER || (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_MODEL ? 'ollama' : 'gemini')).toLowerCase();
    res.json({
      provider,
      model: provider === 'ollama' ? (process.env.OLLAMA_MODEL || process.env.MODEL_NAME || 'gemma4:e4b') : 'gemini-3.5-flash',
      role: 'Project Scheduler & Step Agent Core',
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    });
  });

  // ----------------------------------------------------
  // VITE ENGINE MIDDLEWARE & STATIC FILE HANDLERS
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mounting Vite Web IDE / Development Server Middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log(`Configuring Production Static assets serving endpoints on port ${PORT}...`);
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  NEXUS AGENT OPERATING SYSTEM (PORT ${PORT}) ACTIVE`);
    console.log(`  Sovereign Policy Evaluator: ACTIVE`);
    console.log(`  Citadel Red Team Threat Shield: ACTIVE`);
    console.log(`  Development Preview link: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('CRITICAL: Server crashed during initialization:', err);
});
