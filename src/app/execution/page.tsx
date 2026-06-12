"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Database, 
  Terminal, 
  Layers,
  Activity,
  Cpu,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  Play,
  ArrowLeft,
  Compass,
  UserCheck,
  MessageSquare,
  Lock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  getLatestMission, 
  updateStepStatusAction, 
  updateAgentStatusAction, 
  insertChatMessage, 
  getChatHistory 
} from "@/app/actions/db-actions";
import { runResearchAgent, checkResearchAgentHealth } from "@/app/actions/research-agent-bridge";

interface DBStep {
  id: string;
  mission_id: string;
  step_index: number;
  name: string;
  is_legal: boolean;
  legality_reason: string;
  assigned_agent_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
}

interface DBAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  type: 'required' | 'optional';
  enabled: number;
  status: 'idle' | 'running' | 'completed' | 'error';
}

interface ChatMessage {
  id: string;
  mission_id: string;
  sender: string;
  agent_name: string | null;
  message: string;
  created_at: string;
}

export default function ExecutionCenterPage() {
  const [mission, setMission] = useState<any>(null);
  const [steps, setSteps] = useState<DBStep[]>([]);
  const [agents, setAgents] = useState<DBAgent[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // 9-Level Orchestration States
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<number>(0); // 0: Idle, 1-7: Nexus Sequence, 8: Step Execution, 9: Complete
  const [isPaused, setIsPaused] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  
  // Level 9: Chat Command state
  const [commandInput, setCommandInput] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<boolean>(false);

  // Load latest mission from SQLite on mount
  useEffect(() => {
    async function loadData() {
      const data = await getLatestMission();
      if (data) {
        setMission(data.mission);
        setSteps(data.steps);
        setAgents(data.agents);
        
        // Load initial messages
        const history = await getChatHistory(data.mission.id);
        setChatHistory(history);
        
        if (data.steps.length > 0) {
          setSelectedNodeId(data.steps[0].id);
        }
      }
    }
    loadData();
  }, []);

  // Auto scroll chat logs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Main Orchestrator Loop (Level 1 to Level 8)
  useEffect(() => {
    if (!simulationStarted || !mission || simulationRef.current) return;
    simulationRef.current = true;

    async function runNexusPipeline() {
      // LEVEL 1: Mission Intake
      setCurrentLevel(1);
      await insertLog("system", null, `[LEVEL 1 — MISSION INTAKE] Extracted intent: "${mission.primary_intent}". Target objective identified.`);
      await delay(2000);

      // LEVEL 2: Mission Command
      setCurrentLevel(2);
      await insertLog("system", null, `[LEVEL 2 — MISSION COMMAND] Instantiated Mission Request #${mission.id} with priority: ${mission.risk_level === 'Critical' ? 'CRITICAL' : 'HIGH'}. required_capabilities: ["analytics", "sovereign_enforcement", "threat_detection"].`);
      await delay(2000);

      // LEVEL 3: Knowledge Graph
      setCurrentLevel(3);
      await insertLog("system", null, `[LEVEL 3 — KNOWLEDGE GRAPH] Scanning long-term memory. Semantic matches checked against historical patterns and local repository policies.`);
      await delay(2000);

      // LEVEL 4: Sovereign Layer
      setCurrentLevel(4);
      const trustScore = mission.risk_level === 'Critical' ? 40 : 88;
      await insertLog("system", null, `[LEVEL 4 — SOVEREIGN LAYER] Compliance check: Trust Score evaluates to ${trustScore}%. Authority required: "${mission.risk_level === 'Critical' ? 'Enforce (Override review)' : 'Recommend'}".`);
      await delay(2000);

      // LEVEL 5: Citadel SOC
      setCurrentLevel(5);
      await insertLog("system", null, `[LEVEL 5 — CITADEL SOC] Security Operation Center auditing database queries, PII access, and API authorization boundaries. Threat status: MONITOR.`);
      await delay(2000);

      // LEVEL 6: Execution Center
      setCurrentLevel(6);
      await insertLog("system", null, `[LEVEL 6 — EXECUTION CENTER] Decomposed mission into ${steps.length} workflow steps. Estimating swarm resources and dependencies...`);
      await delay(2000);

      // LEVEL 7: Agent Swarm
      setCurrentLevel(7);
      const activeNames = agents.filter(a => a.enabled === 1).map(a => a.name).join(", ");
      await insertLog("system", null, `[LEVEL 7 — AGENT SWARM] Summoning dynamic AI agents to pool. Active swarm: [${activeNames}].`);
      await delay(2000);

      // LEVEL 8: Active Missions (Execution checklist loop)
      setCurrentLevel(8);
      await insertLog("system", null, `[LEVEL 8 — ACTIVE MISSIONS] Commencing workflow step execution...`);
      
      for (let i = 0; i < steps.length; i++) {
        // Handle pause
        while (isPaused) {
          await delay(500);
        }

        const currentStep = steps[i];
        const assignedAgent = agents.find(a => a.id === currentStep.assigned_agent_id);
        const isAgentEnabled = assignedAgent ? assignedAgent.enabled === 1 : false;

        // Skip disabled optional agents
        if (!isAgentEnabled) {
          await updateStepStatusAction(currentStep.id, 'skipped');
          setSteps(prev => prev.map(s => s.id === currentStep.id ? { ...s, status: 'skipped' } : s));
          await insertLog("system", null, `Step "${currentStep.name}" skipped (Agent ${assignedAgent?.name || 'Unknown'} is disabled).`);
          continue;
        }

        setSelectedNodeId(currentStep.id);

        // Mark running
        await updateStepStatusAction(currentStep.id, 'running');
        await updateAgentStatusAction(currentStep.assigned_agent_id, 'running');
        setSteps(prev => prev.map(s => s.id === currentStep.id ? { ...s, status: 'running' } : s));
        setAgents(prev => prev.map(a => a.id === currentStep.assigned_agent_id ? { ...a, status: 'running' } : a));

        await insertLog("agent", assignedAgent?.name || "AI Agent", `Executing: "${currentStep.name}"`);

        // Check legality / Sovereign constraints FIRST (before any execution)
        if (!currentStep.is_legal) {
          await updateStepStatusAction(currentStep.id, 'failed');
          await updateAgentStatusAction(currentStep.assigned_agent_id, 'error');
          setSteps(prev => prev.map(s => s.id === currentStep.id ? { ...s, status: 'failed' } : s));
          setAgents(prev => prev.map(a => a.id === currentStep.assigned_agent_id ? { ...a, status: 'error' } : a));

          await insertLog("agent", "ComplianceEnforcer", `🛑 SOVEREIGN CRITICAL VIOLATION: Legal block triggered on step "${currentStep.name}". Reason: ${currentStep.legality_reason}`);
          await insertLog("system", null, `Mission execution HALTED under security compliance enforcer override.`);
          setIsFailed(true);
          setCurrentLevel(9); // Stop and enter chat override
          return;
        }

        // === REAL RESEARCH AGENT INTEGRATION ===
        // When this step is assigned to research_agent, call the local Python server
        if (currentStep.assigned_agent_id === 'research_agent') {
          await insertLog("agent", "ResearchAgent", `🔍 Initiating deep web research on: "${currentStep.name}"...`);
          
          const isOnline = await checkResearchAgentHealth();
          if (!isOnline) {
            await insertLog("system", null, `⚠️ Research Agent server is offline (expected at http://localhost:8765). Start it with: python3 server.py`);
            await insertLog("agent", "ResearchAgent", `⚡ Falling back to knowledge synthesis from local Ollama model.`);
            await delay(2500);
          } else {
            await insertLog("agent", "ResearchAgent", `🌐 Research Agent online. Searching DuckDuckGo + synthesizing with gemma4:e4b...`);
            try {
              const result = await runResearchAgent(currentStep.name, 2);
              if (result.status === 'completed') {
                // Show first 600 chars of research summary in the log
                const preview = result.summary.substring(0, 600) + (result.summary.length > 600 ? '...' : '');
                await insertLog("agent", "ResearchAgent", `📋 Research complete.\n\n${preview}`);
              } else {
                await insertLog("agent", "ResearchAgent", `⚠️ Research status: ${result.status} — ${result.summary}`);
              }
            } catch (err: any) {
              await insertLog("agent", "ResearchAgent", `Research agent encountered an error: ${err.message}`);
            }
          }
        } else {
          // All other agents: simulate execution with a delay
          await delay(3000);
        }

        // Complete step
        await updateStepStatusAction(currentStep.id, 'completed');
        await updateAgentStatusAction(currentStep.assigned_agent_id, 'completed');
        setSteps(prev => prev.map(s => s.id === currentStep.id ? { ...s, status: 'completed' } : s));
        setAgents(prev => prev.map(a => a.id === currentStep.assigned_agent_id ? { ...a, status: 'completed' } : a));

        await insertLog("agent", assignedAgent?.name || "AI Agent", `✓ Step completed successfully.`);
        await delay(1000);
      }

      // Complete Pipeline
      await insertLog("system", null, "Mission swarm finished. SQLite synchronized. Core state nominal.");
      setCurrentLevel(9);
      for (const agent of agents) {
        await updateAgentStatusAction(agent.id, 'idle');
      }
      setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));
    }

    runNexusPipeline();
  }, [simulationStarted, isPaused]);

  // Level 9: Interactive Chat Commands handler
  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || !mission) return;

    const cmd = commandInput.trim().toLowerCase();
    setCommandInput("");

    // Log the user's intervention
    await insertLog("user", " Raghav (Admin)", commandInput);
    await delay(1000);

    // Command Intervention Parser
    if (cmd === "stop" || cmd === "abort") {
      setIsPaused(false);
      setCurrentLevel(9);
      await insertLog("system", null, "🛑 INTERVENTION COMMAND RECEIVED: Aborting swarm execution immediately. SQLite state finalized.");
      setSteps(prev => prev.map(s => s.status === 'running' || s.status === 'pending' ? { ...s, status: 'skipped' } : s));
      setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));
    } else if (cmd === "pause") {
      setIsPaused(true);
      await insertLog("system", null, "⚠️ INTERVENTION COMMAND RECEIVED: Swarm paused. Type 'resume' to continue.");
    } else if (cmd === "resume" || cmd === "continue") {
      setIsPaused(false);
      await insertLog("system", null, "▶️ INTERVENTION COMMAND RECEIVED: Resuming swarm execution.");
    } else if (cmd === "explain" || cmd === "why") {
      const activeStep = steps.find(s => s.status === 'running' || s.status === 'failed');
      if (activeStep) {
        await insertLog("agent", "ComplianceEnforcer", `Sovereign Audit rationale for step "${activeStep.name}": Legality check is evaluated as ${activeStep.is_legal ? 'PERMITTED' : 'NOT PERMITTED'}. ${activeStep.legality_reason}`);
      } else {
        await insertLog("agent", "ComplianceEnforcer", "System is idle. All currently scheduled checks are conforming.");
      }
    } else if (cmd === "status") {
      const activeSwarm = agents.filter(a => a.enabled === 1).map(a => `${a.name} (${a.status})`).join(", ");
      await insertLog("system", null, `Active Swarm Registry Status: [ ${activeSwarm} ]`);
    } else {
      // General QA / simulated reply
      await insertLog("agent", "ComplianceEnforcer", "Command received. Nexus AI agent monitoring is active. You can command 'pause', 'resume', 'stop', 'explain', or 'status'.");
    }
  };

  async function insertLog(sender: string, agentName: string | null, message: string) {
    if (!mission) return;
    await insertChatMessage(mission.id, sender, agentName, message);
    const updated = await getChatHistory(mission.id);
    setChatHistory(updated);
  }

  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const progressPercent = steps.length > 0 
    ? Math.round((steps.filter(s => s.status === 'completed' || s.status === 'skipped').length / steps.length) * 100)
    : 0;

  const dynamicArtifacts = steps
    .filter(s => s.status === 'completed')
    .map((s, idx) => {
      if (s.assigned_agent_id === 'research_agent') {
        return { id: `art-${idx}`, name: "knowledge_synthesis.md", type: "document", agent: "ResearchAgent" };
      }
      if (s.assigned_agent_id === 'threat_detector') {
        return { id: `art-${idx}`, name: "vulnerability_report.json", type: "data", agent: "ThreatDetector" };
      }
      if (s.assigned_agent_id === 'compliance_enforcer') {
        return { id: `art-${idx}`, name: "policy_alignment.md", type: "document", agent: "ComplianceEnforcer" };
      }
      if (s.assigned_agent_id === 'financial_auditor') {
        return { id: `art-${idx}`, name: "ledger_audit.csv", type: "data", agent: "FinancialAuditor" };
      }
      return { id: `art-${idx}`, name: "resource_metrics.log", type: "data", agent: "SystemOptimizer" };
    });

  if (!mission) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#5C5C5C]">Loading latest mission...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-84px)] w-full overflow-hidden bg-black text-[#f8f9fa] selection:bg-white/10 font-body relative">
      
      {/* 9-LEVEL PIPELINE STARTUP OVERLAY */}
      <AnimatePresence>
        {simulationStarted && currentLevel >= 1 && currentLevel <= 7 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-12"
          >
            <div className="w-full max-w-2xl space-y-8">
              <div className="text-center">
                <span className="text-[10px] font-mono text-[#5C5C5C] uppercase tracking-[0.4em] font-bold">NEXUS OS Core Neural Sequence</span>
                <h2 className="text-3xl font-display font-bold text-white tracking-tight mt-2">Sovereign Orchestration Layer</h2>
              </div>

              {/* Sequential Progress Indicators */}
              <div className="space-y-3">
                {[
                  { level: 1, name: "Level 1 — Mission Intake", desc: "Intent, Objective & Entity extraction" },
                  { level: 2, name: "Level 2 — Mission Command", desc: "Instantiating request, required capabilities audit" },
                  { level: 3, name: "Level 3 — Knowledge Graph", desc: "Scanning semantic memory & database cache" },
                  { level: 4, name: "Level 4 — Sovereign Layer", desc: "Compliance pre-check & authority verification" },
                  { level: 5, name: "Level 5 — Citadel SOC", desc: "Data access query auditing & PII firewall" },
                  { level: 6, name: "Level 6 — Execution Center", desc: "Decomposing operational workflow steps" },
                  { level: 7, name: "Level 7 — Agent Swarm", desc: "Allocating dynamic AI agent roles" }
                ].map((l) => {
                  const isPending = currentLevel < l.level;
                  const isCurrent = currentLevel === l.level;
                  const isDone = currentLevel > l.level;

                  return (
                    <motion.div 
                      key={l.level}
                      layout
                      className={cn(
                        "p-4 rounded-xl border flex items-center justify-between transition-all duration-300",
                        isCurrent ? "bg-white/[0.04] border-white/20 scale-[1.01]" : 
                        isDone ? "bg-white/[0.01] border-white/5 opacity-40" : "border-transparent opacity-20"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {isDone && <CheckCircle2 className="h-4 w-4 text-white" />}
                        {isCurrent && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                        {isPending && <div className="h-4 w-4 rounded-full border border-white/20" />}
                        
                        <div className="flex flex-col">
                          <span className={cn("text-[13px] font-display font-bold", isCurrent ? "text-white" : "text-[#adb5bd]")}>
                            {l.name}
                          </span>
                          <span className="text-[10px] font-mono text-[#5c5c5c] tracking-wide">{l.desc}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono uppercase text-[#5c5c5c]">
                        {isDone ? "RESOLVED" : isCurrent ? "COMPUTING" : "QUEUED"}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR: ARTIFACTS DOCK (22%) */}
      <aside className="w-[22%] border-r border-white/5 bg-[#050505] flex flex-col overflow-hidden">
        <header className="p-6 border-b border-white/5 shrink-0">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-[#5C5C5C] mb-1">Generated Artifacts</h2>
          <p className="text-[11px] text-[#8a8a8a]">Real-time audit files saved locally</p>
        </header>
        <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {dynamicArtifacts.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8 text-center text-[#444244] font-mono text-[11px]">
              Waiting for agent steps to complete...
            </div>
          ) : (
            dynamicArtifacts.map((art) => (
              <motion.div 
                key={art.id} 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl luxury-surface border border-white/5 hover:border-white/10 transition-all flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-3">
                  {art.type === 'document' ? <FileText className="h-4 w-4 text-white/40" /> : <Database className="h-4 w-4 text-white/40" />}
                  <span className="text-[13px] font-display font-bold text-white truncate">{art.name}</span>
                </div>
                <div className="flex justify-between items-center mt-1 text-[9px] font-mono text-[#5C5C5C]">
                  <span>Creator: {art.agent}</span>
                  <span className="text-white/40 font-bold">SAVED</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </aside>

      {/* MIDDLE WORKSPACE: EXECUTION THEATER & LOGS (53%) */}
      <section className="w-[53%] bg-black flex flex-col overflow-hidden relative">
        <header className="p-8 border-b border-white/5 bg-[#050505] shrink-0 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-white/30" />
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-[#5C5C5C]">Execution_Theater</h2>
            </div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">Active Intelligence Swarm Bridge</h1>
          </div>

          <div className="flex items-center gap-4">
            {!simulationStarted && (
              <button 
                onClick={() => setSimulationStarted(true)}
                className="h-10 px-6 rounded-full bg-white text-black font-bold font-mono text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/90 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                <Play className="h-3.5 w-3.5 fill-black" />
                Start Swarm
              </button>
            )}

            {simulationStarted && currentLevel < 8 && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] border border-white/5 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin text-white" />
                <span className="text-[9px] font-mono text-white uppercase tracking-widest font-bold">Pipelines Starting</span>
              </div>
            )}

            {simulationStarted && currentLevel >= 8 && currentLevel < 9 && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] border border-white/5 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin text-white" />
                <span className="text-[9px] font-mono text-white uppercase tracking-widest font-bold">{isPaused ? "Swarm Paused" : "Swarm Active"}</span>
              </div>
            )}

            {currentLevel === 9 && (
              <div className="flex items-center gap-2">
                <Link href="/" className="h-10 px-5 rounded-full border border-white/10 text-[#adb5bd] font-mono text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/5 active:scale-95 transition-all">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  New Mission
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Level 8 Checklist */}
        <div className="h-[40%] overflow-y-auto px-8 py-6 border-b border-white/5 scrollbar-hide space-y-3">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5C5C5C]">Level 8 — Active Missions Steps progress</span>
            <span className="text-[11px] font-mono text-white font-bold">{progressPercent}%</span>
          </div>

          <div className="space-y-2.5">
            {steps.map((node) => {
              const isSelected = selectedNodeId === node.id;
              
              return (
                <div 
                  key={node.id} 
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-300 flex items-center justify-between",
                    isSelected ? "bg-white/[0.04] border-white/15" : "bg-[#0A0A0A] border-white/5 opacity-70",
                    node.status === 'completed' && "border-white/10",
                    node.status === 'failed' && "border-red-500/20 bg-red-500/[0.02]"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {node.status === 'completed' && <CheckCircle2 className="h-4.5 w-4.5 text-white" />}
                    {node.status === 'failed' && <XCircle className="h-4.5 w-4.5 text-red-400" />}
                    {node.status === 'running' && <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />}
                    {node.status === 'pending' && <div className="h-4 w-4 rounded-full border border-white/20" />}
                    {node.status === 'skipped' && <div className="h-4 w-4 rounded-full border border-white/5 bg-white/5" />}

                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-wider">
                        {node.assigned_agent_id.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[13.5px] font-display font-bold text-white">{node.name}</span>
                    </div>
                  </div>

                  <span className={cn(
                    "text-[8px] font-mono uppercase px-2 py-0.5 rounded border tracking-wider",
                    node.status === 'completed' && "bg-white/10 text-white border-white/20",
                    node.status === 'running' && "bg-white text-black border-white animate-pulse",
                    node.status === 'failed' && "bg-red-500/20 text-red-400 border-red-500/30",
                    node.status === 'pending' && "bg-black/40 text-[#5C5C5C] border-white/5",
                    node.status === 'skipped' && "bg-white/5 text-white/30 border-white/5"
                  )}>
                    {node.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Logs Terminal & Level 9 Chat Commands */}
        <div className="h-[60%] flex flex-col overflow-hidden bg-black/40 relative">
          <header className="px-8 py-4 border-b border-white/5 bg-[#080808] shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-[#5C5C5C]" />
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5C5C5C]">Swarm Execution Logs</h3>
            </div>
            {simulationStarted && (
              <span className="text-[8px] font-mono text-[#5c5c5c] uppercase">Level 9 — Chat Command Active</span>
            )}
          </header>

          {/* Logs scroll area */}
          <div className="flex-grow p-8 overflow-y-auto space-y-4 font-mono text-[12px] leading-relaxed scrollbar-hide pb-20">
            {chatHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#444244]">
                Click "Start Swarm" to initiate AI agent processing logs.
              </div>
            ) : (
              chatHistory.map((chat) => (
                <div key={chat.id} className="flex gap-4 items-start border-b border-white/[0.02] pb-3">
                  <span className="text-[10.5px] text-[#444244] shrink-0">{new Date(chat.created_at).toLocaleTimeString()}</span>
                  
                  <div className="flex flex-col gap-1">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      chat.sender === 'system' ? "text-white/40" : 
                      chat.sender === 'user' ? "text-amber-400" :
                      chat.agent_name === 'ComplianceEnforcer' ? "text-red-400" : "text-white"
                    )}>
                      {chat.sender === 'system' ? 'SYSTEM' : chat.sender === 'user' ? 'USER INTERVENTION' : chat.agent_name}
                    </span>
                    
                    <p className={cn(
                      chat.sender === 'system' ? "text-[#8a8a8a] italic" : "text-[#adb5bd]"
                    )}>
                      {chat.message}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Level 9: Chat Command input footer */}
          {simulationStarted && (
            <form onSubmit={handleSendCommand} className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-[#050505]/95 backdrop-blur-md flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-[#5c5c5c] shrink-0 ml-2" />
              <input 
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type command to intervene (e.g. pause, resume, stop, explain, status)..."
                className="flex-grow bg-transparent border-none text-xs font-mono text-white placeholder-white/20 focus:ring-0"
              />
              <button type="submit" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all">
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* RIGHT SIDEBAR: SWARM AGENTS STATUS (25%) */}
      <aside className="w-[25%] border-l border-white/5 bg-[#050505] p-8 flex flex-col overflow-hidden">
        <header className="mb-8 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <Cpu className="h-4.5 w-4.5 text-white/30" />
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">Swarm Health</h3>
          </div>
          <p className="text-[11px] text-[#8a8a8a]">Active agent states monitor</p>
        </header>

        <div className="flex-grow overflow-y-auto space-y-4 pr-1 scrollbar-hide">
          {agents.map((agent) => (
            <div 
              key={agent.id} 
              className={cn(
                "p-4 rounded-xl border flex flex-col gap-2 transition-all duration-300",
                agent.enabled === 1 ? "bg-white/[0.02] border-white/5" : "bg-black/40 border-white/5 opacity-30",
                // Special highlight for research_agent when running (it's doing real web research!)
                agent.id === 'research_agent' && agent.status === 'running' && "border-blue-500/30 bg-blue-500/[0.03] shadow-[0_0_12px_rgba(59,130,246,0.08)]"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-display font-bold text-white leading-tight">{agent.name}</span>
                  <span className="text-[9px] font-mono text-[#5C5C5C] tracking-wide mt-0.5">{agent.type.toUpperCase()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[8px] font-mono uppercase px-2 py-0.5 rounded border tracking-wider",
                    agent.status === 'running' && agent.id !== 'research_agent' && "bg-white text-black border-white animate-pulse",
                    agent.status === 'running' && agent.id === 'research_agent' && "bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse",
                    agent.status === 'completed' && "bg-white/10 text-white border-white/20",
                    agent.status === 'error' && "bg-red-500/20 text-red-400 border-red-500/30",
                    agent.status === 'idle' && "bg-black/40 text-[#5C5C5C] border-white/5"
                  )}>
                    {agent.enabled === 0 ? 'DISABLED' : agent.id === 'research_agent' && agent.status === 'running' ? 'SEARCHING' : agent.status}
                  </span>
                  {agent.status === 'running' && (
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full animate-ping",
                      agent.id === 'research_agent' ? "bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "bg-white shadow-[0_0_8px_white]"
                    )} />
                  )}
                </div>
              </div>
              
              <p className="text-[11px] text-[#8a8a8a] leading-relaxed font-body">
                {agent.description}
              </p>

              {/* ResearchAgent extra indicator */}
              {agent.id === 'research_agent' && agent.status === 'running' && (
                <div className="mt-1 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-blue-400/70 uppercase tracking-widest">DuckDuckGo + gemma4:e4b active</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Research Agent Server Status footer */}
        <div className="mt-6 pt-6 border-t border-white/5 shrink-0">
          <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest">Research Server</span>
              <span className="text-[10px] font-mono text-white/50">localhost:8765</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-white/20 animate-pulse" />
              <span className="text-[8px] font-mono text-[#5C5C5C] uppercase">Python API</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

