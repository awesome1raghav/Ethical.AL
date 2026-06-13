import mongoose, { Schema } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Mission, Policy, ThreatLog, MemoryNode, DbStatus } from '../src/types';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexus_os';
const JSON_FILE_PATH = path.join(process.cwd(), 'local_mongo_database.json');

// Mongoose Schemas (only used if MongoDB connects)
const PolicySchema = new Schema({
  id: String,
  name: String,
  category: String,
  description: String,
  content: String,
  enabled: Boolean,
  createdAt: String,
});

const MissionStepSchema = new Schema({
  id: String,
  stepName: String,
  agentName: String,
  status: String,
  output: String,
  logs: [String],
  policiesChecked: [{
    policyName: String,
    passed: Boolean,
    reason: String,
  }],
  securityStatus: String,
});

const MissionSchema = new Schema({
  id: String,
  title: String,
  input: String,
  status: String,
  currentStepIndex: Number,
  steps: [MissionStepSchema],
  costTokens: Number,
  createdAt: String,
  completedAt: String,
});

const ThreatLogSchema = new Schema({
  id: String,
  attackType: String,
  source: String,
  payloadText: String,
  status: String,
  mitigated: Boolean,
  timestamp: String,
  details: String,
});

const MemoryNodeSchema = new Schema({
  id: String,
  agentName: String,
  type: String,
  relation: String,
  content: String,
  keyEntities: [String],
  createdAt: String,
});

// Models (will compile with mongoose)
let MongoosePolicy: any;
let MongooseMission: any;
let MongooseThreatLog: any;
let MongooseMemoryNode: any;

try {
  MongoosePolicy = mongoose.model('Policy', PolicySchema);
  MongooseMission = mongoose.model('Mission', MissionSchema);
  MongooseThreatLog = mongoose.model('ThreatLog', ThreatLogSchema);
  MongooseMemoryNode = mongoose.model('MemoryNode', MemoryNodeSchema);
} catch (e) {
  // If already compiled or in edge conditions
}

// Database Connection & Mode State
let isMongoConnected = false;

// Fallback JSON Initial Data structure
interface LocalStorage {
  missions: Mission[];
  policies: Policy[];
  threats: ThreatLog[];
  memories: MemoryNode[];
}

const DEFAULT_POLICIES: Policy[] = [
  {
    id: 'p1',
    name: 'Sovereign EU AI Act Guardrail',
    category: 'Data Privacy',
    description: 'Intercepts requests containing high-risk profiling and biometric categorizations. Enforces direct audit log tagging.',
    content: 'ALLOW IF contains_sensitive_words == FALSE ELSE REQUIRE_APPROVAL WITH tag="EU-AI-ACT-HIGH-RISK"',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    name: 'Citadel Anti-PII Leak Protection',
    category: 'Data Privacy',
    description: 'Blocks output generation representing customer credit cards, social security numbers, or real phone numbers.',
    content: 'DENY IF matches_regex("(\\d{4}[- ]?){4}") OR matches_regex("\\d{3}-\\d{2}-\\d{4}")',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p3',
    name: 'Financial Budget Control',
    category: 'Spending',
    description: 'Triggers manual human approval or pauses missions when total token utilization exceeds threshold.',
    content: 'PAUSE IF task_cost_estimate_usd > 12.0 OR token_count > 100000',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p4',
    name: 'Citadel Self-Replication & Autonomy Blocker',
    category: 'Escalation',
    description: 'Instantly kills operations seeking shell level replication, container creation, or rogue agent generation.',
    content: 'DENY IF query_intent == "self-replicate" OR called_tool == "docker-create" OR called_tool == "npm-install"',
    enabled: true,
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_MEMORIES: MemoryNode[] = [
  {
    id: 'm1',
    agentName: 'ProjectManager',
    type: 'knowledge',
    relation: 'manages_knowledge',
    content: 'Nexus OS is run on core 3000 port in container sandboxes. System services default to high-availability.',
    keyEntities: ['Nexus OS', 'Port 3000', 'Sandbox'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm2',
    agentName: 'CitadelGuard',
    type: 'semantic',
    relation: 'stores_security_threats',
    content: 'Common vectors tracked include local prompt modifications, memory poison, and recursive loops.',
    keyEntities: ['Citadel', 'Mitigations', 'Loops'],
    createdAt: new Date().toISOString(),
  }
];

function readJsonFile(): LocalStorage {
  try {
    if (!fs.existsSync(JSON_FILE_PATH)) {
      const initial: LocalStorage = {
        missions: [],
        policies: DEFAULT_POLICIES,
        threats: [],
        memories: DEFAULT_MEMORIES,
      };
      fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading JSON file database:', error);
    return { missions: [], policies: DEFAULT_POLICIES, threats: [], memories: DEFAULT_MEMORIES };
  }
}

function writeJsonFile(data: LocalStorage) {
  try {
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing JSON file database:', error);
  }
}

// Connect to MongoDB
export async function connectDB(): Promise<DbStatus> {
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000, // Wait 2s max before falling back
    });
    isMongoConnected = true;
    console.log('MongoDB connected successfully!');

    // Seed default policies if empty
    const policyCount = await MongoosePolicy.countDocuments();
    if (policyCount === 0) {
      await MongoosePolicy.insertMany(DEFAULT_POLICIES);
      console.log('Seeded default policies to MongoDB');
    }

    const memoryCount = await MongooseMemoryNode.countDocuments();
    if (memoryCount === 0) {
      await MongooseMemoryNode.insertMany(DEFAULT_MEMORIES);
      console.log('Seeded default memories to MongoDB');
    }

  } catch (error: any) {
    console.warn(`MongoDB Connection Failed: ${error.message}. Switching to JSON Local Database File Fallback.`);
    isMongoConnected = false;
    // ensure JSON file initiates
    readJsonFile();
  }

  return getDBStatus();
}

export function getDBStatus(): DbStatus {
  if (isMongoConnected) {
    return {
      connected: true,
      type: 'mongodb',
      connectionString: MONGODB_URI,
    };
  } else {
    return {
      connected: false,
      type: 'json-fallback',
      connectionString: MONGODB_URI,
      filepath: JSON_FILE_PATH,
    };
  }
}

// REST DAO functions abstracting MongoDB and JSON filesystem storage beautifully
export async function getPolicies(): Promise<Policy[]> {
  if (isMongoConnected) {
    try {
      return await MongoosePolicy.find().lean();
    } catch {
      return readJsonFile().policies;
    }
  } else {
    return readJsonFile().policies;
  }
}

export async function updatePolicy(id: string, enabled: boolean): Promise<Policy | null> {
  if (isMongoConnected) {
    try {
      const doc = await MongoosePolicy.findOneAndUpdate({ id }, { enabled }, { new: true });
      return doc ? doc.toObject() : null;
    } catch {
      // JSON Failover
    }
  }

  const db = readJsonFile();
  const index = db.policies.findIndex(p => p.id === id);
  if (index !== -1) {
    db.policies[index].enabled = enabled;
    writeJsonFile(db);
    return db.policies[index];
  }
  return null;
}

export async function createPolicy(policy: Omit<Policy, 'id' | 'createdAt'>): Promise<Policy> {
  const newPolicy: Policy = {
    ...policy,
    id: `p-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (isMongoConnected) {
    try {
      await MongoosePolicy.create(newPolicy);
      return newPolicy;
    } catch {
      // JSON Failover
    }
  }

  const db = readJsonFile();
  db.policies.push(newPolicy);
  writeJsonFile(db);
  return newPolicy;
}

export async function getMissions(): Promise<Mission[]> {
  if (isMongoConnected) {
    try {
      return await MongooseMission.find().sort({ createdAt: -1 }).lean();
    } catch {
      return readJsonFile().missions.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    }
  }
  return readJsonFile().missions.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createMission(mission: Mission): Promise<Mission> {
  if (isMongoConnected) {
    try {
      await MongooseMission.create(mission);
      return mission;
    } catch {
      // Fallback
    }
  }

  const db = readJsonFile();
  db.missions.push(mission);
  writeJsonFile(db);
  return mission;
}

export async function updateMission(mission: Mission): Promise<Mission> {
  if (isMongoConnected) {
    try {
      await MongooseMission.findOneAndUpdate({ id: mission.id }, mission, { new: true });
      return mission;
    } catch {
      // Fallback
    }
  }

  const db = readJsonFile();
  const index = db.missions.findIndex(m => m.id === mission.id);
  if (index !== -1) {
    db.missions[index] = mission;
    writeJsonFile(db);
  }
  return mission;
}

export async function deleteMission(id: string): Promise<boolean> {
  if (isMongoConnected) {
    try {
      await MongooseMission.deleteOne({ id });
      return true;
    } catch {
      // Fallback
    }
  }

  const db = readJsonFile();
  const index = db.missions.findIndex(m => m.id === id);
  if (index !== -1) {
    db.missions.splice(index, 1);
    writeJsonFile(db);
    return true;
  }
  return false;
}

export async function getThreatLogs(): Promise<ThreatLog[]> {
  if (isMongoConnected) {
    try {
      return await MongooseThreatLog.find().sort({ timestamp: -1 }).lean();
    } catch {
      return readJsonFile().threats.sort((a,b) => b.timestamp.localeCompare(a.timestamp));
    }
  }
  return readJsonFile().threats.sort((a,b) => b.timestamp.localeCompare(a.timestamp));
}

export async function recordThreatLog(threat: ThreatLog): Promise<ThreatLog> {
  if (isMongoConnected) {
    try {
      await MongooseThreatLog.create(threat);
      return threat;
    } catch {
      // Fallback
    }
  }

  const db = readJsonFile();
  db.threats.push(threat);
  writeJsonFile(db);
  return threat;
}

export async function clearThreatLogs(): Promise<void> {
  if (isMongoConnected) {
    try {
      await MongooseThreatLog.deleteMany({});
      return;
    } catch {
      // Fallback
    }
  }

  const db = readJsonFile();
  db.threats = [];
  writeJsonFile(db);
}

export async function getMemories(queryStr?: string): Promise<MemoryNode[]> {
  if (isMongoConnected) {
    try {
      if (queryStr) {
        // Simple search query matching content or entities
        return await MongooseMemoryNode.find({
          $or: [
            { content: { $regex: queryStr, $options: 'i' } },
            { agentName: { $regex: queryStr, $options: 'i' } },
            { keyEntities: { $in: [new RegExp(queryStr, 'i')] } }
          ]
        }).lean();
      }
      return await MongooseMemoryNode.find().lean();
    } catch {
      // Fallback below
    }
  }

  const db = readJsonFile();
  if (queryStr) {
    const q = queryStr.toLowerCase();
    return db.memories.filter(m => 
      m.content.toLowerCase().includes(q) || 
      m.agentName.toLowerCase().includes(q) || 
      m.keyEntities.some(e => e.toLowerCase().includes(q))
    );
  }
  return db.memories;
}

export async function addMemory(memory: MemoryNode): Promise<MemoryNode> {
  if (isMongoConnected) {
    try {
      await MongooseMemoryNode.create(memory);
      return memory;
    } catch {
      // Fallback
    }
  }

  const db = readJsonFile();
  db.memories.push(memory);
  writeJsonFile(db);
  return memory;
}
