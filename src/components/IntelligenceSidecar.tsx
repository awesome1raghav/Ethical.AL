"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Clock, 
  AlertTriangle, 
  BarChart3, 
  Target, 
  Activity, 
  ChevronRight,
  UserCheck,
  Layers,
  ArrowRight,
  Search,
  ShieldCheck
} from "lucide-react";
import type { NaturalLanguageMissionIntakeOutput } from "@/ai/flows/natural-language-mission-intake";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface IntelligenceSidecarProps {
  inputLength: number;
  aiData?: NaturalLanguageMissionIntakeOutput | null;
  activeAgents?: Record<string, boolean>;
  onToggleAgent?: (agentId: string) => void;
  onLaunch?: () => void;
}

export const IntelligenceSidecar: React.FC<IntelligenceSidecarProps> = ({ 
  aiData, 
  activeAgents = {}, 
  onToggleAgent = () => {}, 
  onLaunch = () => {} 
}) => {
  const getIntelligence = (label: string) => {
    if (!aiData) return "—";
    
    switch (label) {
      case "Detected Intent": return aiData.primary_intent;
      case "Risk Level": return aiData.riskLevel || "Low";
      case "Mission Clarity": return aiData.clarityScore !== undefined ? `${aiData.clarityScore}%` : "—";
      case "Estimated Agents": return aiData.estimatedAgents || "—";
      case "Estimated Duration": return aiData.estimatedDuration || "—";
      default: return "—";
    }
  };

  const summaryStats = [
    { label: "Detected Intent", icon: Target, priority: true, interactive: true },
    { label: "Risk Level", icon: AlertTriangle, interactive: true },
    { label: "Mission Clarity", icon: Activity },
    { label: "Estimated Agents", icon: Zap },
    { label: "Estimated Duration", icon: Clock },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header Label */}
      <div className="flex items-center justify-between mb-8 px-1 shrink-0">
        <div className="flex flex-col gap-1">
          <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">
            Mission Intelligence
          </h3>
          <p className="text-[13px] font-body text-[#8A8A8A]">System Conclusions</p>
        </div>
        <div className="h-8 w-8 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
           <BarChart3 className="h-3.5 w-3.5 text-white" />
        </div>
      </div>

      <Sheet>
        {/* LEVEL 1: SUMMARY GRID */}
        <div className="flex-grow flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-hide">
          {summaryStats.map((stat, i) => {
            const value = getIntelligence(stat.label);
            const isPlaceholder = value === "—";
            const isInteractive = stat.interactive && !isPlaceholder;

            const CardContent = (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`
                  relative overflow-hidden p-5 rounded-[20px] 
                  luxury-surface hover-surface
                  transition-all duration-300
                  flex flex-col justify-center min-h-[82px] shrink-0
                  ${stat.priority ? 'ring-1 ring-white/10' : ''}
                  ${isInteractive ? 'cursor-pointer active:scale-[0.98]' : ''}
                `}
              >
                <div className="flex flex-col gap-1 relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#5C5C5C]">
                      {stat.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {isInteractive && (
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest font-bold">Details</span>
                      )}
                      <stat.icon className={`h-3.5 w-3.5 ${isPlaceholder ? 'text-[#444244]' : 'text-white/60'}`} />
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-2">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={value}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                          tracking-tighter font-display font-bold
                          ${stat.priority ? 'text-[24px]' : 'text-[22px]'}
                          ${isPlaceholder ? 'text-[#444244]' : 'text-white'}
                          ${stat.label === 'Risk Level' && value === 'High' ? 'text-red-400' : ''}
                          ${stat.label === 'Risk Level' && value === 'Critical' ? 'text-red-500 font-extrabold shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}
                          ${stat.label === 'Risk Level' && value === 'Medium' ? 'text-amber-400' : ''}
                        `}
                      >
                        {value}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );

            return isInteractive ? (
              <SheetTrigger key={stat.label} asChild>
                {CardContent}
              </SheetTrigger>
            ) : (
              <div key={stat.label}>{CardContent}</div>
            );
          })}
        </div>

        {/* LEVEL 2: INTENT DETAILS SHEET */}
        <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-[#0A0A0A] border-l border-white/10 p-0 text-white overflow-hidden">
          {aiData && (
            <div className="h-full flex flex-col">
              <SheetHeader className="p-8 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-display font-bold text-white tracking-tight">Intelligence Breakdown</SheetTitle>
                    <p className="text-[12px] text-[#5C5C5C] font-mono uppercase tracking-widest">Sovereign Audit Trail</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-grow overflow-y-auto p-8 space-y-10 scrollbar-hide">
                {/* AI Swarm Registry Section */}
                <section>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C] mb-6">AI Swarm Registry</h4>
                  <div className="space-y-3">
                    {[
                      { id: 'compliance_enforcer', name: 'ComplianceEnforcer', role: 'Sovereign Compliance & Ethics', type: 'required' },
                      { id: 'threat_detector', name: 'ThreatDetector', role: 'Citadel Security Auditor', type: 'required' },
                      { id: 'research_agent', name: 'ResearchAgent', role: 'Nexus Web & Knowledge Synthesizer', type: 'optional' },
                      { id: 'financial_auditor', name: 'FinancialAuditor', role: 'Sovereign Transaction Audit Engine', type: 'optional' },
                      { id: 'system_optimizer', name: 'SystemOptimizer', role: 'Nexus Swarm Resource Optimizer', type: 'optional' }
                    ].map((agent) => {
                      const isSuggested = aiData.suggested_agents?.includes(agent.id);
                      const isEnabled = activeAgents[agent.id] ?? (agent.type === 'required' || isSuggested);
                      const isRequired = agent.type === 'required';

                      return (
                        <div key={agent.id} className={cn(
                          "p-4 rounded-xl border flex items-center justify-between transition-all duration-300",
                          isEnabled ? "bg-white/[0.03] border-white/10" : "bg-black/20 border-white/5 opacity-50"
                        )}>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-display font-bold text-white">{agent.name}</span>
                              {isRequired && (
                                <span className="text-[8px] font-mono px-1 rounded bg-white/10 text-white/60 uppercase font-bold">Required</span>
                              )}
                              {isSuggested && !isRequired && (
                                <span className="text-[8px] font-mono px-1 rounded bg-[#810B38]/30 text-white/80 uppercase font-bold">Suggested</span>
                              )}
                            </div>
                            <span className="text-[10.5px] font-body text-[#8a8a8a]">{agent.role}</span>
                          </div>
                          
                          <button
                            disabled={isRequired}
                            onClick={() => onToggleAgent(agent.id)}
                            className={cn(
                              "h-5 w-10 rounded-full p-0.5 transition-colors duration-300 relative shrink-0",
                              isRequired ? "bg-white/20 cursor-not-allowed" : 
                              isEnabled ? "bg-white" : "bg-white/5"
                            )}
                          >
                            <div className={cn(
                              "h-4 w-4 rounded-full transition-all duration-300 shadow",
                              isEnabled ? "translate-x-5 bg-black" : "bg-white/40"
                            )} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Workflow Breakdown Section */}
                <section>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C] mb-6">Workflow Steps Breakdown</h4>
                  <div className="space-y-4">
                    {aiData.workflow_steps?.map((step, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-[13.5px] font-display font-bold text-white leading-tight">{step.name}</span>
                          <span className={cn(
                            "text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-bold shrink-0",
                            step.is_legal ? "bg-white/10 text-white border-white/20" : "bg-red-500/15 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                          )}>
                            {step.is_legal ? "✓ Legal" : "❌ Illegal"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8a8a8a] font-body leading-relaxed">
                          {step.legality_reason}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <span className="text-[9px] font-mono text-[#5c5c5c] uppercase tracking-wider font-bold">Assigned Agent</span>
                          <span className="text-[11px] font-mono text-white/60">{step.assigned_agent_id.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Deterministic Evaluation Section */}
                <section>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C] mb-6">Deterministic Evaluation</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[9px] font-mono text-[#5C5C5C] uppercase block mb-1">Clarity Rating</span>
                      <span className="text-sm font-bold text-white">{aiData.clarityRating}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[9px] font-mono text-[#5C5C5C] uppercase block mb-1">Risk Evaluation</span>
                      <span className={`text-sm font-bold ${aiData.riskLevel === 'High' || aiData.riskLevel === 'Critical' ? 'text-red-400' : 'text-white'}`}>{aiData.riskLevel}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                    <span className="text-[9px] font-mono text-[#444244] uppercase block mb-2">Kernel Rationale</span>
                    <p className="text-[11px] text-[#8A8A8A] font-body italic leading-relaxed">
                      "{aiData.riskReason}"
                    </p>
                  </div>
                </section>

                {/* Structural Alignment Section */}
                <section>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C] mb-6">Structural Alignment</h4>
                  <div className="space-y-4">
                    <DetailRow label="Domain" value={aiData.domain} />
                    <DetailRow label="Objective" value={aiData.objective} />
                    <div className="pt-4 border-t border-white/5">
                      <span className="text-[9px] font-mono text-[#444244] uppercase mb-3 block">Secondary Intents</span>
                      <div className="flex flex-wrap gap-2">
                        {aiData.secondary_intents.map((intent, i) => (
                          <span key={i} className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] font-body text-[#adb5bd]">{intent}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Operational Section */}
                <section>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C] mb-6">Operational Scope</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <StatusCard icon={UserCheck} label="Authority Level" value={aiData.authority_level.label} />
                    <StatusCard icon={Layers} label="Workflow" value={aiData.workflow.complexity} sub={`${aiData.workflow.steps} steps`} />
                  </div>
                </section>

                {/* Governance Section */}
                <section>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C] mb-6">Governance Signals</h4>
                  <div className="space-y-2">
                    {Object.entries(aiData.governance_signals).map(([key, active]) => (
                      <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-[12px] text-[#adb5bd] capitalize">{key.replace(/_/g, ' ')}</span>
                        {active ? (
                          <div className="flex items-center gap-2 text-white">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Active</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                          </div>
                        ) : (
                          <span className="text-[9px] font-mono text-[#444244] uppercase tracking-widest">Inactive</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <footer className="p-8 border-t border-white/5 bg-black/40 shrink-0">
                <button onClick={onLaunch} className="w-full p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-mono text-[#5C5C5C] uppercase tracking-widest mb-1">Execution Ready</span>
                    <span className="text-[14px] font-display font-bold text-white">Initialize Swarm Bridge</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-white transition-all group-hover:translate-x-1" />
                </button>
              </footer>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Status Footer */}
      <div className="mt-8 pt-8 border-t border-white/5 shrink-0">
        <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
            <p className="text-[11px] font-mono text-white uppercase tracking-[0.15em] font-bold">
              Ethical Core Nominal
            </p>
          </div>
          <p className="text-[10px] font-mono text-[#5C5C5C]">v1.0.42</p>
        </div>
      </div>
    </div>
  );
};

/* Helper Components */

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[9px] font-mono text-[#444244] uppercase tracking-widest">{label}</span>
    <span className="text-[15px] font-body text-white font-medium">{value}</span>
  </div>
);

const StatusCard = ({ icon: Icon, label, value, sub }: { icon: any, label: string, value: string, sub?: string }) => (
  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center">
    <Icon className="h-5 w-5 text-white/40 mb-3" />
    <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest mb-1">{label}</span>
    <span className="text-[14px] font-display font-bold text-white">{value}</span>
    {sub && <span className="text-[10px] text-[#5C5C5C] mt-0.5">{sub}</span>}
  </div>
);
