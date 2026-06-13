"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Landmark,
  Loader2,
  ShieldCheck,
  Shield,
  Radar,
  Brain,
  Target,
  Zap,
  FileJson,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MISSION_LAUNCH_SNAPSHOT_KEY = "ethicalai.launchSnapshot";

type InitializationStatus = "pending" | "initializing" | "completed";

type MissionWorkflowStep = {
  name: string;
  assigned_agent_id: string;
  is_legal: boolean;
  legality_reason: string;
};

type MissionLaunchSnapshot = {
  missionId: string;
  missionDescription: string;
  detectedIntent: string;
  estimatedAgents?: string;
  riskLevel?: string;
  clarityScore?: number;
  workflowSteps?: MissionWorkflowStep[];
  suggestedAgents?: string[];
  activeAgents?: Record<string, boolean>;
  launchedAt: string;
};

type SwarmStep = {
  title: string;
  agentName: string;
  status: InitializationStatus;
  statusText: string;
  detail: string;
};

type AgentStatus = "waiting" | "initializing" | "running" | "verified" | "complete";

type OrchestratedAgent = {
  id: string;
  name: string;
  role: string;
  type: "required" | "optional";
  icon: any;
  status: AgentStatus;
  progress: number;
  description: string;
  runtimeText?: string;
  enabled?: boolean;
};

type OrchestrationStep = {
  id: string;
  label: string;
  status: "pending" | "active" | "complete";
  timestamp?: number;
  enabled?: boolean;
};

type GeneratedArtifact = {
  id: string;
  name: string;
  type: "log" | "json" | "markdown" | "data";
  status: "generating" | "complete";
  timestamp: number;
  content?: string;
};

const AGENT_LABELS: Record<string, string> = {
  compliance_enforcer: "PolicyAgent",
  threat_detector: "SecurityAgent",
  research_agent: "ResearchAgent",
  financial_auditor: "AnalystAgent",
  system_optimizer: "WriterAgent",
};

function parseAgentCount(value?: string, fallback = 1) {
  if (!value) return fallback;
  const match = value.match(/\d+/);
  return match ? Math.max(1, Number.parseInt(match[0], 10)) : fallback;
}

function detectOptionalAgents(description: string): string[] {
  const agents: string[] = [];
  const legalKeywords = /refund|legal|claim|lawsuit|compensation|policy/i;
  const financeKeywords = /budget|pricing|cost|money|refund/i;
  
  if (legalKeywords.test(description)) agents.push("legal_agent");
  if (financeKeywords.test(description)) agents.push("finance_agent");
  
  return agents;
}

function buildDynamicAgents(snapshot?: MissionLaunchSnapshot | null): OrchestratedAgent[] {
  const defaultAgents = [
    { id: "research_agent", name: "ResearchAgent", role: "Research & Retrieval", type: "required" as const, icon: Target, status: "waiting" as const, progress: 0, description: "Research mission-specific documents, knowledge, APIs, policies, regulations, sources, intelligence." },
    { id: "sovereign_agent", name: "SovereignAgent", role: "Governance Layer", type: "required" as const, icon: Shield, status: "waiting" as const, progress: 0, description: "Ethical validation, risk scoring, autonomy approval, policy checks." },
    { id: "citadel_agent", name: "CitadelAgent", role: "Security Layer", type: "required" as const, icon: Radar, status: "waiting" as const, progress: 0, description: "Threat detection, unsafe action prevention, prompt safety analysis." },
    { id: "analysis_agent", name: "AnalysisAgent", role: "Intelligence Synthesis", type: "required" as const, icon: Brain, status: "waiting" as const, progress: 0, description: "Combining outputs from swarm into unified intelligence." },
  ];

  if (!snapshot) return defaultAgents;

  const agentMap = new Map<string, string>();
  if (snapshot.suggestedAgents && Array.isArray(snapshot.suggestedAgents)) {
    snapshot.suggestedAgents.forEach(a => agentMap.set(a.toLowerCase().replace(/_/g, ''), a));
  }
  if (snapshot.workflowSteps && Array.isArray(snapshot.workflowSteps)) {
    snapshot.workflowSteps.forEach(s => {
      if (s.assigned_agent_id) {
        const rawName = AGENT_LABELS[s.assigned_agent_id] || s.assigned_agent_id;
        const normalized = rawName.toLowerCase().replace(/_/g, '');
        if (!agentMap.has(normalized)) {
          agentMap.set(normalized, rawName);
        }
      }
    });
  }

  if (agentMap.size === 0) return defaultAgents;

  return Array.from(agentMap.values()).map((agentName, i) => {
    // Map icons based on name
    let icon = Brain;
    const lower = agentName.toLowerCase();
    if (lower.includes("research")) icon = Target;
    else if (lower.includes("policy") || lower.includes("compliance") || lower.includes("sovereign")) icon = Shield;
    else if (lower.includes("threat") || lower.includes("security") || lower.includes("citadel")) icon = Radar;
    else if (lower.includes("finance") || lower.includes("audit")) icon = Landmark;
    else if (lower.includes("build") || lower.includes("dev")) icon = Zap;
    else if (lower.includes("legal")) icon = AlertCircle;

    return {
      id: `agent-${i}-${Date.now()}`,
      name: agentName,
      role: `Specialized Unit`,
      type: "required",
      icon: icon,
      status: "waiting",
      progress: 0,
      description: `Task-specific autonomous agent instantiated for ${agentName} operations.`,
      enabled: true
    };
  });
}

function buildOrchestrationSteps(snapshot?: MissionLaunchSnapshot | null): OrchestrationStep[] {
  const defaultSteps = [
    { id: "classify", label: "Mission classified", status: "pending" as const, enabled: true },
    { id: "decompose", label: "Intent decomposition complete", status: "pending" as const, enabled: true },
    { id: "governance", label: "Sovereign governance initiated", status: "pending" as const, enabled: true },
    { id: "research", label: "ResearchAgent deployed", status: "pending" as const, enabled: true },
    { id: "knowledge", label: "Knowledge graph synchronized", status: "pending" as const, enabled: true },
    { id: "security", label: "Citadel verification complete", status: "pending" as const, enabled: true },
    { id: "synthesis", label: "Confidence synthesis complete", status: "pending" as const, enabled: true },
    { id: "ready", label: "Swarm deployment ready", status: "pending" as const, enabled: true },
  ];

  if (!snapshot || !snapshot.workflowSteps || snapshot.workflowSteps.length === 0) {
    return defaultSteps;
  }

  return snapshot.workflowSteps.map((step, index) => ({
    id: `step-${index}`,
    label: step.name,
    status: "pending" as const,
    enabled: true
  }));
}

export default function MissionIntakePage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<MissionLaunchSnapshot | null>(null);
  const [agents, setAgents] = useState<OrchestratedAgent[]>([]);
  const [orchestrationSteps, setOrchestrationSteps] = useState<OrchestrationStep[]>([]);
  const [generatedArtifacts, setGeneratedArtifacts] = useState<GeneratedArtifact[]>([]);
  const [optionalAgents, setOptionalAgents] = useState<string[]>([]);
  const [isBooting, setIsBooting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [trustScore, setTrustScore] = useState(0);
  const [statusText, setStatusText] = useState("Awaiting launch signal");
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    try {
      const rawSnapshot = window.sessionStorage.getItem(MISSION_LAUNCH_SNAPSHOT_KEY);
      if (rawSnapshot) {
        const parsedSnapshot = JSON.parse(rawSnapshot) as MissionLaunchSnapshot;
        setSnapshot(parsedSnapshot);
        setAgents(buildDynamicAgents(parsedSnapshot));
        setOrchestrationSteps(buildOrchestrationSteps(parsedSnapshot));
        setOptionalAgents(detectOptionalAgents(parsedSnapshot.missionDescription));
      } else {
        setAgents(buildDynamicAgents(null));
        setOrchestrationSteps(buildOrchestrationSteps(null));
      }
    } catch (error) {
      console.error("Failed to load mission launch snapshot:", error);
      setAgents(buildDynamicAgents(null));
      setOrchestrationSteps(buildOrchestrationSteps(null));
    }
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current = [];
    };
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  };

  const startInitialization = () => {
    if (isBooting || agents.length === 0) return;

    clearTimers();
    setIsBooting(true);
    setIsComplete(false);
    setTrustScore(0);
    setStatusText("Analyzing mission");
    setGeneratedArtifacts([]);

    const latencyInterval = 2500;
    
    const generateContent = (name: string, snap: MissionLaunchSnapshot | null, stepIndex: number) => {
      if (!snap) return "{}";
      
      if (name.startsWith('sovereign_verify_')) {
        const stepDetails = snap.workflowSteps ? snap.workflowSteps[stepIndex] : null;
        return JSON.stringify({
          verification_id: `sov-chk-${Date.now()}-${stepIndex}`,
          target_step: stepDetails?.name || "Unknown Step",
          assigned_agent: stepDetails?.assigned_agent_id || "System",
          policy_checks: [
            { policy: "Financial Autonomy Limit", status: "PASSED", confidence: 0.98 },
            { policy: "Data Privacy Masking", status: "PASSED", confidence: 0.99 },
            { policy: "Execution Safety", status: "PASSED", confidence: 0.95 }
          ],
          sovereign_decision: "APPROVED",
          timestamp: new Date().toISOString()
        }, null, 2);
      }

      return `[SYSTEM LOG]\nMission: ${snap.missionId}\nIntent: ${snap.detectedIntent}\nStatus: VERIFIED\nReady for deployment.`;
    };

    const timings = orchestrationSteps.map((step, idx) => {
      const safeName = step.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 20);
      const artifactName = `sovereign_verify_${safeName}.json`;

      return {
        step: idx,
        delay: idx * latencyInterval,
        artifact: artifactName,
        status: `Verifying step ${idx + 1}...`
      };
    });
    
    timings.push({
      step: orchestrationSteps.length,
      delay: orchestrationSteps.length * latencyInterval,
      artifact: null,
      status: "Verification Complete"
    });

    timings.forEach(({ step, delay, artifact, status }) => {
      timersRef.current.push(window.setTimeout(() => {
        setAgents((current) =>
          current.map((agent, idx) => {
            const agentStepProgress = (step / Math.max(1, orchestrationSteps.length)) * current.length;
            let agentStatus: AgentStatus = "waiting";
            
            if (step >= orchestrationSteps.length) {
              agentStatus = "complete";
            } else if (idx < Math.floor(agentStepProgress)) {
              agentStatus = "complete";
            } else if (idx === Math.floor(agentStepProgress)) {
              agentStatus = "running";
            }
            
            return {
              ...agent,
              status: agentStatus,
              progress: agentStatus === "complete" ? 100 : agentStatus === "running" ? (50 + Math.random() * 40) : 0,
            };
          })
        );

        setOrchestrationSteps((current) =>
          current.map((s, idx) => ({
            ...s,
            status: idx < step ? "complete" : idx === step ? "active" : "pending",
            timestamp: idx <= step ? Date.now() : undefined,
          }))
        );

        setTrustScore((prev) => Math.min(prev + (100 / Math.max(1, orchestrationSteps.length)), 100));

        if (artifact) {
          const artifactId = `artifact-${Date.now()}-${step}`;
          setGeneratedArtifacts((prev) => [
            ...prev,
            {
              id: artifactId,
              name: artifact,
              type: artifact.split(".").pop() as any,
              status: "generating",
              timestamp: Date.now(),
              content: generateContent(artifact, snapshot, step),
            },
          ]);

          timersRef.current.push(window.setTimeout(() => {
            setGeneratedArtifacts((prev) =>
              prev.map((a) => (a.id === artifactId ? { ...a, status: "complete" } : a))
            );
          }, 2000));
        }

        setStatusText(status);

        if (step >= orchestrationSteps.length) {
          setIsComplete(true);
          timersRef.current.push(window.setTimeout(() => {
            setIsBooting(false);
            setTrustScore(100);
            setStatusText("Execution ready");
          }, 600));
        }
      }, delay));
    });
  };

  const continueToExecution = () => {
    if (isComplete) {
      router.push("/execution");
    }
  };

  return (
    <div className="flex-grow p-6 md:p-10 overflow-y-auto scrollbar-hide">
      <header className="mb-10 md:mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-[1px] w-8 bg-white/20" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-[#5C5C5C]">Nexus Intake Kernel</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white leading-none mb-4">Mission Initialization</h1>
          <p className="text-[#8A8A8A] text-base md:text-lg max-w-2xl font-body">Autonomous AI swarm preparing for governed execution. All allocated units standing by for deployment approval.</p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 self-start md:self-auto">
          <div className={cn("h-2 w-2 rounded-full", isComplete ? "bg-white shadow-[0_0_8px_white]" : isBooting ? "bg-white animate-pulse" : "bg-white/30")} />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8A8A8A]">{statusText}</span>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 pb-20">
        <div className="col-span-12 lg:col-span-7 space-y-8">
          {/* Agent Orchestration Section */}
          <div className="luxury-surface rounded-[32px] p-8 md:p-12 relative overflow-hidden">
            <div className="mb-8">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C] block mb-2">Agent Orchestration</span>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white">Active Swarm Units</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-[24px] border p-5 transition-all relative overflow-hidden",
                    agent.enabled === false ? "opacity-40 grayscale" : "",
                    agent.status === "running" && agent.enabled !== false ? "bg-white/[0.08] border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.06)]" : agent.status === "complete" && agent.enabled !== false ? "bg-white/[0.04] border-white/10" : "bg-white/[0.02] border-white/5"
                  )}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center">
                      <agent.icon className="h-5 w-5 text-white/70" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-sm font-display font-bold text-white">{agent.name}</h3>
                      <p className="text-[11px] text-[#8A8A8A]">{agent.role}</p>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => setAgents(agents.map(a => a.id === agent.id ? { ...a, enabled: a.enabled === false ? true : false } : a))}
                      className={cn(
                        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out hover:scale-105 ml-2 mt-0.5",
                        agent.enabled !== false ? "bg-white/30 hover:bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.1)]" : "bg-white/10 hover:bg-white/20"
                      )}
                      title={agent.enabled === false ? "Enable Agent" : "Disable Agent"}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-300 ease-in-out shadow-sm",
                          agent.enabled !== false ? "translate-x-4 shadow-[0_0_8px_white]" : "translate-x-0 opacity-40"
                        )}
                      />
                    </button>

                    <motion.div
                      initial={false}
                      animate={{
                        scale: agent.status === "running" ? [1, 1.2, 1] : 1,
                      }}
                      transition={{ duration: 2, repeat: agent.status === "running" ? Infinity : 0 }}
                      className={cn(
                        "h-2 w-2 rounded-full absolute top-5 right-5",
                        agent.status === "complete" ? "bg-white shadow-[0_0_6px_white]" : agent.status === "running" ? "bg-white animate-pulse" : "bg-white/20",
                        agent.enabled === false ? "hidden" : ""
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#5C5C5C]">
                        {agent.status === "running" ? "INITIALIZING" : agent.status === "complete" ? "VERIFIED" : "WAITING"}
                      </span>
                      <span className="text-[10px] font-mono text-[#8A8A8A]">{Math.round(agent.progress)}%</span>
                    </div>
                    <div className="h-[2px] w-full rounded-full overflow-hidden bg-white/[0.05]">
                      <motion.div
                        initial={false}
                        animate={{ width: `${agent.progress}%` }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "h-full rounded-full",
                          agent.status === "complete" ? "bg-white" : agent.status === "running" ? "bg-white" : "bg-white/20"
                        )}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Optional Agents */}
            {optionalAgents.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 border-t border-white/5">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#5C5C5C] mb-4">Optional Agents Activated</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {optionalAgents.includes("legal_agent") && (
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4 flex items-center gap-3">
                      <FileJson className="h-4 w-4 text-[#8A8A8A]" />
                      <span className="text-[12px] font-body text-white">Legal Compliance Agent</span>
                    </div>
                  )}
                  {optionalAgents.includes("finance_agent") && (
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4 flex items-center gap-3">
                      <Zap className="h-4 w-4 text-[#8A8A8A]" />
                      <span className="text-[12px] font-body text-white">Finance Analysis Agent</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Verification Process BY Sovereign */}
          <div className="luxury-surface rounded-[32px] p-8 md:p-12 relative overflow-hidden">
            <div className="mb-8">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C] block mb-2">Orchestration Timeline</span>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white">Verification Process BY Sovereign</h2>
            </div>

            <div className="space-y-4">
              {orchestrationSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "rounded-[20px] border px-5 py-4 flex items-center gap-4 transition-all relative overflow-hidden",
                    step.enabled === false ? "opacity-50 grayscale" : "",
                    step.status === "active" && step.enabled !== false ? "bg-white/[0.06] border-white/15" : step.status === "complete" && step.enabled !== false ? "bg-white/[0.03] border-white/8" : "bg-white/[0.01] border-white/5"
                  )}
                >
                  <div className="pt-1">
                    {step.status === "complete" && <CheckCircle2 className="h-5 w-5 text-white" />}
                    {step.status === "active" && <Loader2 className="h-5 w-5 text-white animate-spin" />}
                    {step.status === "pending" && <div className="h-5 w-5 rounded-full border-2 border-white/30" />}
                  </div>
                  <div className="flex-grow">
                    <p className={cn("text-[13px] font-body font-semibold", step.status === "pending" ? "text-[#8A8A8A]" : "text-white", step.enabled === false && "line-through text-[#5C5C5C]")}>
                      {step.label}
                    </p>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => setOrchestrationSteps(orchestrationSteps.map(s => s.id === step.id ? { ...s, enabled: s.enabled === false ? true : false } : s))}
                    className={cn(
                      "relative inline-flex h-4 w-8 mx-3 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out hover:scale-110",
                      step.enabled !== false ? "bg-white/30 hover:bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.1)]" : "bg-white/10 hover:bg-white/20"
                    )}
                    title={step.enabled === false ? "Enable Step" : "Disable Step"}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white transition duration-300 ease-in-out shadow-sm",
                        step.enabled !== false ? "translate-x-4 shadow-[0_0_8px_white]" : "translate-x-0 opacity-40"
                      )}
                    />
                  </button>

                  <span className="text-[10px] font-mono text-[#5C5C5C]">
                    {step.status === "complete" ? `+${Math.floor(Math.random() * 200) + 50}ms` : step.status === "active" ? "running" : "queued"}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Generated Artifacts */}
          {generatedArtifacts.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="luxury-surface rounded-[32px] p-8 md:p-12 relative overflow-hidden">
              <div className="mb-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C] block mb-2">Generated Artifacts</span>
                <h2 className="text-xl md:text-2xl font-display font-bold text-white">Mission Files</h2>
              </div>

              <div className="space-y-3">
                {generatedArtifacts.map((artifact) => (
                  <motion.div
                    key={artifact.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      if (artifact.status === "complete" && artifact.content) {
                        const blob = new Blob([artifact.content], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = artifact.name;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                    className={cn(
                      "rounded-[18px] border px-4 py-3 flex items-center justify-between transition-all",
                      artifact.status === "complete" ? "bg-white/[0.04] border-white/8 cursor-pointer hover:bg-white/[0.08]" : "bg-white/[0.02] border-white/5 opacity-70"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <FileJson className="h-4 w-4 text-[#8A8A8A]" />
                      <span className="text-[12px] font-body text-white">{artifact.name}</span>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{
                        scale: artifact.status === "generating" ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ duration: 1.5, repeat: artifact.status === "generating" ? Infinity : 0 }}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        artifact.status === "complete" ? "bg-white shadow-[0_0_4px_white]" : "bg-white/50"
                      )}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Initialize Swarm Button */}
          <div className="flex flex-col md:flex-row gap-3">
            <Button
              type="button"
              onClick={startInitialization}
              disabled={isBooting}
              className="group bg-white hover:bg-white/90 text-black font-bold h-12 px-8 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.12)] transition-all active:scale-95 text-sm disabled:opacity-60 flex-grow"
            >
              {isBooting ? "Orchestration Running..." : "Initialize Swarm"}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            <Button
              type="button"
              onClick={continueToExecution}
              disabled={!isComplete}
              className={cn(
                "h-12 px-8 rounded-full border text-[10px] font-mono font-bold uppercase tracking-widest transition-all",
                isComplete
                  ? "border-white/30 bg-white/[0.05] text-white hover:bg-white/[0.08] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  : "border-white/5 bg-transparent text-[#5C5C5C]"
              )}
            >
              Deploy to Execution
            </Button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Mission Snapshot */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="luxury-surface rounded-[32px] p-8 space-y-6">
            <div>
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#5C5C5C] mb-3">Mission Snapshot</h3>
              <h4 className="text-2xl font-display font-bold text-white mb-2">{snapshot?.detectedIntent || "Analyzing..."}</h4>
              <p className="text-[13px] text-[#8A8A8A] font-body leading-relaxed">
                {snapshot?.missionDescription || "Mission initialization in progress..."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Mission ID",
                  value: snapshot?.missionId?.slice(0, 8) || "—",
                  icon: Target,
                },
                {
                  label: "Allocated Units",
                  value: snapshot?.estimatedAgents || "4",
                  icon: Cpu,
                },
                {
                  label: "Risk Level",
                  value: snapshot?.riskLevel || "Low",
                  icon: AlertCircle,
                },
                {
                  label: "Trust Score",
                  value: `${Math.round(trustScore)}%`,
                  icon: ShieldCheck,
                },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[20px] border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="h-3.5 w-3.5 text-[#5C5C5C]" />
                    <span className="block text-[9px] font-mono uppercase tracking-[0.15em] text-[#5C5C5C]">
                      {item.label}
                    </span>
                  </div>
                  <motion.span
                    initial={false}
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 0.5, repeat: isBooting ? Infinity : 0 }}
                    className="text-sm font-display font-bold text-white"
                  >
                    {item.value}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mission Context */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="luxury-surface rounded-[32px] p-8">
            <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#5C5C5C] mb-6">Mission Context</h3>
            <div className="space-y-3">
              {[
                { label: "Session Memory", icon: Database, count: "↑3" },
                { label: "Knowledge Base", icon: Globe, count: "↑12" },
                { label: "Government Data", icon: Landmark, count: "↑5" },
              ].map((source, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-[20px] bg-white/[0.02] border border-white/5 group hover:border-white/10 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <source.icon className="h-4 w-4 text-[#5C5C5C] group-hover:text-white/70" />
                    <span className="text-[13px] font-body text-[#8A8A8A] group-hover:text-white">{source.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#5C5C5C]">{source.count}</span>
                    <CheckCircle2 className="h-4 w-4 text-white/60 group-hover:text-white" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Status Bar Evolution */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="luxury-surface rounded-[32px] p-6 flex items-center justify-between border-l-4 border-white/20"
          >
            <div className="flex-grow">
              <span className="block text-[9px] font-mono uppercase tracking-[0.15em] text-[#5C5C5C] mb-1">
                Initialization State
              </span>
              <motion.span
                key={statusText}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-body text-white font-semibold"
              >
                {statusText}
              </motion.span>
            </div>
            <motion.div
              animate={{
                rotate: isBooting ? 360 : 0,
                scale: isComplete ? 1.1 : 1,
              }}
              transition={{
                rotate: { duration: 2, repeat: isBooting ? Infinity : 0 },
                scale: { duration: 0.3 },
              }}
              className={cn(
                "h-5 w-5 rounded-full",
                isComplete ? "bg-white shadow-[0_0_12px_white]" : isBooting ? "bg-white/70 animate-pulse" : "bg-white/30"
              )}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
