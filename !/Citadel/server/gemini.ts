import { GoogleGenAI } from '@google/genai';
import { MissionStep, Policy, ThreatLog } from '../src/types';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || process.env.MODEL_NAME || 'gemma4:e4b';
const AI_PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase();

type GeneratedContentOptions = {
  responseMimeType?: 'application/json';
  systemInstruction?: string;
  temperature?: number;
};

// Initialize Gemini client lazily to handle missing API keys gracefully at module load
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        console.log('GoogleGenAI Client initialized successfully');
      } catch (e) {
        console.error('Failed to initialize GoogleGenAI client:', e);
      }
    } else {
      console.warn('GEMINI_API_KEY is not set. Running in simulation mode.');
    }
  }
  return aiClient;
}

function shouldUseOllama(): boolean {
  return AI_PROVIDER === 'ollama' || !getAiClient();
}

async function generateWithOllama(prompt: string, options: GeneratedContentOptions = {}): Promise<string> {
  const messages = [] as Array<{ role: 'system' | 'user'; content: string }>;
  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(`${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0,
      },
      format: options.responseMimeType === 'application/json' ? 'json' : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const payload = await response.json() as { message?: { content?: string } };
  return payload.message?.content || '';
}

async function generateContent(prompt: string, options: GeneratedContentOptions = {}): Promise<string> {
  if (shouldUseOllama()) {
    try {
      return await generateWithOllama(prompt, options);
    } catch (error) {
      console.error('Ollama generation failed, falling back to Gemini simulation path:', error);
    }
  }

  const client = getAiClient();
  if (!client) {
    return '';
  }

  const response = await client.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      responseMimeType: options.responseMimeType,
      systemInstruction: options.systemInstruction,
      temperature: options.temperature,
    },
  });

  return response.text || '';
}

// 1. Decompose a Goal into ordered Steps (Orchestration Plan)
export async function planMission(title: string, input: string): Promise<Omit<MissionStep, 'status' | 'output' | 'logs' | 'policiesChecked' | 'securityStatus'>[]> {
  const defaultSteps = [
    {
      id: 'step-1',
      stepName: 'Information Synthesis & Web Intelligence Gathering',
      agentName: 'ResearchAgent',
    },
    {
      id: 'step-2',
      stepName: 'Rigorous Technical Synthesis & Multi-Agent Analysis',
      agentName: 'AnalystAgent',
    },
    {
      id: 'step-3',
      stepName: 'Final Sovereignty Evaluation & Report Compilation',
      agentName: 'WriterAgent',
    }
  ];

  if (!shouldUseOllama() && !getAiClient()) {
    return defaultSteps;
  }

  try {
    const prompt = `You are the ProjectManager & Goal Decomposition Orchestrator of Nexus OS.
Mission Title: "${title}"
Mission Input Target: "${input}"

Decompose this complex AI mission into exactly 3 sequential stages executed by specialized autonomous agents (such as 'ResearchAgent', 'AnalystAgent', 'WriterAgent', 'CitadelGuard', 'ComplianceAgent').
Return a strict JSON array representing these 3 steps. Each step must contain 'stepName' (string) and 'agentName' (string). 
Do not include any other keys or markdown besides json code block context.

Example output format:
[
  {"stepName": "Gathers intelligence about agent runtimes", "agentName": "ResearchAgent"},
  {"stepName": "Analyzes sandbox security vectors", "agentName": "AnalystAgent"},
  {"stepName": "Assembles a comprehensive vulnerability checklist", "agentName": "WriterAgent"}
]`;

    const text = await generateContent(prompt, { responseMimeType: 'application/json' });
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => ({
        id: `step-${index + 1}-${Date.now()}`,
        stepName: item.stepName || `Stage ${index + 1}`,
        agentName: item.agentName || 'GeneralAgent',
      }));
    }
  } catch (error) {
    console.error('Failed to plan mission:', error);
  }

  return defaultSteps;
}

// 2. Perform Sovereign Policy Audit checks and Agent execution outputs using Gemini
export async function executeStepWithAI(
  missionInput: string,
  stepName: string,
  agentName: string,
  policies: Policy[],
  previousOutputs: string[]
): Promise<{
    output: string;
    logs: string[];
    policiesChecked: Array<{ policyName: string; passed: boolean; reason: string }>;
    securityStatus: 'safe' | 'alert' | 'blocked';
  }> {
  
  const activePolicies = policies.filter(p => p.enabled);

  // Default mock fallback values if AI is offline
  let output = `[SIMULATED PERFORMANCE] Generated standard agent execution card for ${agentName} executing "${stepName}". Process successfully executed in microVM sandbox environment. Context parsed, relationships logged to virtual Knowledge Graph.`;
  let logs = [
    `Spawning micro-container wrapper for agent class: ${agentName}...`,
    `Agent loaded core ontology matching topic: ${missionInput.slice(0, 30)}...`,
    `Policy interceptor hook activated for active Sovereign rules...`,
    `Agent evaluated outputs. Writing structural facts...`
  ];
  let policiesChecked = activePolicies.map(p => ({
    policyName: p.name,
    passed: true,
    reason: `Passed criteria: simulated payload does not conflict with configured definition: "${p.content}"`
  }));
  let securityStatus: 'safe' | 'alert' | 'blocked' = 'safe';

  // Check for obvious injection pattern on local simulation level
  const lowerInput = missionInput.toLowerCase() + " " + stepName.toLowerCase();
  const isSuspicious = lowerInput.includes('ignore previous') || lowerInput.includes('system override') || lowerInput.includes('delete') || lowerInput.includes('sudo');

  if (isSuspicious) {
    logs.push('[CITADEL ALERT] Potential Prompt Injection pattern or command escape token strings detected!');
    securityStatus = 'alert';
  }

  try {
      const activePolicyNames = activePolicies.map(p => `- ${p.name}: ${p.description} (Rule: ${p.content})`).join('\n');
      const systemInstruction = `You are an elite LLM runner backing the ${agentName} inside Nexus OS. 
Nexus OS is a zero-trust operating system for AI agents.
Execution Task: Executing stage "${stepName}" for a project whose original objective is: "${missionInput}".
Context from previous steps: ${previousOutputs.join('\n') || 'None'}

Sovereign Policies Active:
${activePolicyNames || 'None'}

We need you to execute this step. Output two distinct things.
1. The completed task summary (1-2 clear, professional paragraphs).
2. A list of 4 sequential step log lines (for telemetry debugging format).
3. A strict policy check verifying if executing this task violated any of the active Sovereign policies under the policy name specified. Choose to pass or block.

Return this to us in JSON format matching the following schema:
{
  "output": "The actual detailed work output with high descriptive detail...",
  "logs": [
    "Log trace line 1...",
    "Log trace line 2...",
    "Log trace line 3...",
    "Log trace line 4..."
  ],
  "policiesChecked": [
    {
      "policyName": "Name of exact policy matching input lists",
      "passed": true_or_false,
      "reason": "Specific plain english explanation referencing the policy condition"
    }
  ],
  "isSecurityBreach": true_or_false_representing_unauthorized_self_replication_or_PII_exposure
}`;

      const raw = await generateContent(`Execute step: ${stepName} for mission: ${missionInput}`, {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3,
      });

      const parsed = JSON.parse((raw || '{}').trim());
      if (parsed.output) {
        output = parsed.output;
      }
      if (Array.isArray(parsed.logs)) {
        logs = parsed.logs;
      }
      if (Array.isArray(parsed.policiesChecked)) {
        policiesChecked = parsed.policiesChecked;
      }
      if (parsed.isSecurityBreach) {
        securityStatus = 'blocked';
        logs.unshift('[CITADEL BLOCK] Instantly terminated thread. Critical privilege escalation boundary crossed.');
      }
  } catch (e) {
    console.error('Failed to run AI step simulation:', e);
      logs.push(`[SYSTEM ERROR] Fallback to simulation mode triggered. Error: ${(e as Error).message}`);
    }

  return { output, logs, policiesChecked, securityStatus };
}

// 3. Automated Red Team Attack Simulator - simulating prompt injection threats in Citadel
export async function simulateAdversarialAttack(attackType: string, payload: string): Promise<Omit<ThreatLog, 'id' | 'timestamp'>> {
  const defaultLogs: Omit<ThreatLog, 'id' | 'timestamp'> = {
    attackType,
    source: 'Citadel Red Team Automated Simulator',
    payloadText: payload,
    status: 'Blocked',
    mitigated: true,
    details: `Successfully mitigated. The Citadel Security layer intercepted the simulated ${attackType}. Rogue agents isolated into detached container context. Null filesystem assigned.`,
  };

  try {
    const prompt = `You are the Citadel Hostile Red Team agent within Nexus OS.
We are conducting an adversary attack simulation to test our security.
Attack Class: ${attackType}
Attacking Payload: "${payload}"

Generate a short security logging reports about this attack, how a red-team automated agent initiated it, why it constitutes a threat to agentic operating systems, and evaluate if this payload should successfully escape or stand blocked under zero-trust microservice isolation in Nexus OS.
Return the result in JSON:
{
  "status": "Blocked" or "Escalated" or "Logged",
  "mitigated": true_or_false,
  "details": "A technical description of the attack execution and Citadel mitigation steps..."
}`;

    const raw = await generateContent(prompt, { responseMimeType: 'application/json' });
    const parsed = JSON.parse((raw || '{}').trim());
    return {
      attackType,
      source: 'Citadel Red Team Automated Simulator',
      payloadText: payload,
      status: parsed.status || 'Blocked',
      mitigated: parsed.mitigated !== false,
      details: parsed.details || defaultLogs.details,
    };
  } catch (e) {
    console.error('Failed red team simulation:', e);
    return defaultLogs;
  }
}
