"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BorderGlow from "@/components/ui/BorderGlow";
import { 
  Search, 
  ShieldCheck, 
  Database, 
  Zap, 
  Network, 
  Target,
  PenTool,
  Clock,
  Activity,
  Terminal,
  ShieldAlert,
  BarChart3,
  Scale,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AgentStatus = "ACTIVE" | "IDLE" | "PROCESSING" | "THINKING" | "SUSPENDED";

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  icon: any;
  latency: string;
  confidence: number;
  workload: number;
  thinkingLines: string[];
}

const INITIAL_AGENTS: Agent[] = [
  { id: "ag-1", name: "ResearchAgent", role: "Deep Research Orchestration", description: "Runs the Ollama-backed deep research pipeline for planning, evidence synthesis, and report drafting.", status: "PROCESSING", icon: Search, latency: "42ms", confidence: 98.4, workload: 64, thinkingLines: ["✓ Planning research queries...", "✓ Synthesizing evidence streams..."] },
  { id: "ag-2", name: "PolicyAgent", role: "Ethical Alignment", description: "Evaluates planning steps against ethical, legal, and organizational governance constraints.", status: "THINKING", icon: Scale, latency: "124ms", confidence: 100, workload: 12, thinkingLines: ["✓ Evaluating planning steps...", "✓ Validating governance constraints..."] },
];

const AgentCard = ({ agent, onInspect, onToggle }: { agent: Agent, onInspect: (a: Agent) => void, onToggle: (id: string) => void }) => {
  const isSuspended = agent.status === "SUSPENDED";
  return (
    <motion.div layout>
      <BorderGlow edgeSensitivity={18} glowColor="160 70 70" backgroundColor={isSuspended ? "#050505" : "#0B0B0B"} borderRadius={28} glowRadius={18} glowIntensity={0.18} coneSpread={12} animated={false} fillOpacity={0.03} colors={isSuspended ? ["#333333", "#222222", "#111111"] : ["#66ffcc", "#4ade80", "#14b8a6"]} className={cn("transition-all duration-500 group cursor-pointer border-transparent", isSuspended && "opacity-60")}>
        <div className="p-6 h-full relative" onClick={() => onInspect(agent)}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl border bg-white/[0.03] border-white/10 text-white">
                <agent.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-display font-bold text-white tracking-tight">{agent.name}</h3>
                <p className="text-[11px] font-body text-[#8A8A8A] font-medium">{agent.role}</p>
              </div>
            </div>
          </div>
          <p className="text-[13px] text-[#adb5bd] font-body leading-relaxed mb-6 h-10 line-clamp-2">{agent.description}</p>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 mt-6">
            <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest font-bold">Latency: {agent.latency}</span>
            <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest font-bold">Confidence: {agent.confidence}%</span>
            <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest font-bold text-right">Workload: {agent.workload}%</span>
          </div>
        </div>
      </BorderGlow>
    </motion.div>
  );
};

export default function AgentSwarmPage() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const activeAgentCount = agents.filter(a => a.status !== "SUSPENDED").length;

  return (
    <div className="flex flex-col flex-grow relative">
      <header className="px-10 py-10 shrink-0">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.5em] text-[#5C5C5C] block mb-4">Autonomous Systems Hive</span>
        <h1 className="text-4xl font-display font-bold tracking-tight text-white mb-3">Supervised Agent Swarm</h1>
        <p className="text-[#8A8A8A] text-[15px] font-body max-w-2xl leading-relaxed">Monitor logical workload distribution, semantic confidence weighting, and autonomous reasoning behavior in real time.</p>
      </header>
      <div className="flex-grow px-10 pb-32">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-[1400px]">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onInspect={() => {}} onToggle={() => {}} />
          ))}
        </div>
      </div>
    </div>
  );
}
