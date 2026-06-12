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
  AlertCircle
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
};

type OrchestrationStep = {
  id: string;
  label: string;
  status: "pending" | "active" | "complete";
  timestamp?: number;
};

type GeneratedArtifact = {
  id: string;
  name: string;
  type: "log" | "json" | "markdown" | "data";
  status: "generating" | "complete";
  timestamp: number;
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

function buildRequiredAgents(): OrchestratedAgent[] {
  return [
    {
      id: "research_agent",
      name: "ResearchAgent",
      role: "Research & Retrieval",
      type: "required",
      icon: Target,
      status: "waiting",
      progress: 0,
      description: "Research mission-specific documents, knowledge, APIs, policies, regulations, sources, intelligence.",
    },
    {
      id: "sovereign_agent",
      name: "SovereignAgent",
      role: "Governance Layer",
      type: "required",
      icon: Shield,
      status: "waiting",
      progress: 0,
      description: "Ethical validation, risk scoring, autonomy approval, policy checks.",
    },
    {
      id: "citadel_agent",
      name: "CitadelAgent",
      role: "Security Layer",
      type: "required",
      icon: Radar,
      status: "waiting",
      progress: 0,
      description: "Threat detection, unsafe action prevention, prompt safety analysis.",
    },
    {
      id: "analysis_agent",
      name: "AnalysisAgent",
      role: "Intelligence Synthesis",
      type: "required",
      icon: Brain,
      status: "waiting",
      progress: 0,
      description: "Combining outputs from swarm into unified intelligence.",
    },
  ];
}

function buildOrchestrationSteps(): OrchestrationStep[] {
  return [
    { id: "classify", label: "Mission classified", status: "pending" },
    { id: "decompose", label: "Intent decomposition complete", status: "pending" },
    { id: "governance", label: "Sovereign governance initiated", status: "pending" },
    { id: "research", label: "ResearchAgent deployed", status: "pending" },
    { id: "knowledge", label: "Knowledge graph synchronized", status: "pending" },
    { id: "security", label: "Citadel verification complete", status: "pending" },
    { id: "synthesis", label: "Confidence synthesis complete", status: "pending" },
    { id: "ready", label: "Swarm deployment ready", status: "pending" },
  ];
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
        setAgents(buildRequiredAgents());
        setOrchestrationSteps(buildOrchestrationSteps());
        setOptionalAgents(detectOptionalAgents(parsedSnapshot.missionDescription));
      } else {
        setAgents(buildRequiredAgents());
        setOrchestrationSteps(buildOrchestrationSteps());
      }
    } catch (error) {
      console.error("Failed to load mission launch snapshot:", error);
      setAgents(buildRequiredAgents());
      setOrchestrationSteps(buildOrchestrationSteps());
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

    // Orchestration timing: 2s intervals, cinematic but subtle
    const timings = [
      { step: 0, delay: 0, artifact: null, status: "Analyzing mission" },
      { step: 1, delay: 2000, artifact: "mission_brief.json", status: "Deploying swarm" },
      { step: 2, delay: 4000, artifact: null, status: "Governance active" },
      { step: 3, delay: 6000, artifact: "policy_validation.log", status: "Security verified" },
      { step: 4, delay: 8000, artifact: "research_findings.md", status: "Intelligence synthesis" },
      { step: 5, delay: 10000, artifact: "risk_assessment.json", status: "Optional agents activate" },
      { step: 6, delay: 13000, artifact: "execution_memory.log", status: "Execution ready" },
      { step: 7, delay: 16000, artifact: null, status: "Ready for deployment" },
    ];

    // Orchestrate agents
    timings.forEach(({ step, delay, artifact, status }) => {
      timersRef.current.push(window.setTimeout(() => {
        // Update agent status
        setAgents((current) =>
          current.map((agent, idx) => {
            let agentStatus: AgentStatus = "waiting";
            if (idx === step) agentStatus = "running";
            else if (idx < step) agentStatus = "complete";
            
            return {
              ...agent,
              status: agentStatus,
              progress: agentStatus === "complete" ? 100 : agentStatus === "running" ? (50 + Math.random() * 40) : 0,
            };
          })
        );

        // Update orchestration step
        setOrchestrationSteps((current) =>
          current.map((s, idx) => ({
            ...s,
            status: idx < step ? "complete" : idx === step ? "active" : "pending",
            timestamp: idx <= step ? Date.now() : undefined,
          }))
        );

        // Update trust score progressively
        setTrustScore((prev) => Math.min(prev + 12.5, 100));

        // Add artifact
        if (artifact) {
          setGeneratedArtifacts((prev) => [
            ...prev,
            {
              id: `artifact-${Date.now()}`,
              name: artifact,
              type: artifact.split(".").pop() as any,
              status: "generating",
              timestamp: Date.now(),
            },
          ]);

          timersRef.current.push(window.setTimeout(() => {
            setGeneratedArtifacts((prev) =>
              prev.map((a) => (a.timestamp === Date.now() ? { ...a, status: "complete" } : a))
            );
          }, delay + 800));
        }

        setStatusText(status);
      }, delay));
    });

    timersRef.current.push(window.setTimeout(() => {
      setIsBooting(false);
      setIsComplete(true);
      setTrustScore(100);
      setStatusText("Execution ready");
    }, 18000));
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
                    "rounded-[24px] border p-5 transition-all",
                    agent.status === "running" ? "bg-white/[0.08] border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.06)]" : agent.status === "complete" ? "bg-white/[0.04] border-white/10" : "bg-white/[0.02] border-white/5"
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
                    <motion.div
                      initial={false}
                      animate={{
                        scale: agent.status === "running" ? [1, 1.2, 1] : 1,
                      }}
                      transition={{ duration: 2, repeat: agent.status === "running" ? Infinity : 0 }}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        agent.status === "complete" ? "bg-white shadow-[0_0_6px_white]" : agent.status === "running" ? "bg-white animate-pulse" : "bg-white/20"
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

          {/* Mission Execution Plan */}
          <div className="luxury-surface rounded-[32px] p-8 md:p-12 relative overflow-hidden">
            <div className="mb-8">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C] block mb-2">Orchestration Timeline</span>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white">Mission Execution Plan</h2>
            </div>

            <div className="space-y-4">
              {orchestrationSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "rounded-[20px] border px-5 py-4 flex items-start gap-4 transition-all",
                    step.status === "active" ? "bg-white/[0.06] border-white/15" : step.status === "complete" ? "bg-white/[0.03] border-white/8" : "bg-white/[0.01] border-white/5"
                  )}
                >
                  <div className="pt-1">
                    {step.status === "complete" && <CheckCircle2 className="h-5 w-5 text-white" />}
                    {step.status === "active" && <Loader2 className="h-5 w-5 text-white animate-spin" />}
                    {step.status === "pending" && <div className="h-5 w-5 rounded-full border-2 border-white/30" />}
                  </div>
                  <div className="flex-grow">
                    <p className={cn("text-[13px] font-body font-semibold", step.status === "pending" ? "text-[#8A8A8A]" : "text-white")}>
                      {step.label}
                    </p>
                  </div>
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
                    className={cn(
                      "rounded-[18px] border px-4 py-3 flex items-center justify-between transition-all",
                      artifact.status === "complete" ? "bg-white/[0.04] border-white/8" : "bg-white/[0.02] border-white/5"
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
