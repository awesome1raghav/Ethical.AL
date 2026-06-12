
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Lock, 
  Zap, 
  Fingerprint, 
  Terminal, 
  AlertTriangle,
  Server,
  Database,
  Search,
  ChevronRight,
  MoreHorizontal,
  Flame,
  Bug,
  ShieldX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const securityMetrics = [
  { label: "Threats Blocked", value: 1242, trend: "+14%", severity: "neutral" },
  { label: "Policy Violations", value: 3, trend: "-2", severity: "high" },
  { label: "Sandbox Integrity", value: "99.9%", trend: "Stable", severity: "neutral" },
  { label: "Audit Coverage", value: "100%", trend: "Optimal", severity: "neutral" },
];

const initialAgents = [
  { id: "ag-1", name: "ResearchAgent", role: "Search", compliance: "98%", trust: 94, status: "OPERATIONAL", risk: "Low" },
  { id: "ag-2", name: "AnalystAgent", role: "Synthesis", compliance: "92%", trust: 91, status: "MONITORED", risk: "Low" },
  { id: "ag-3", name: "WriterAgent", role: "Generation", compliance: "99%", trust: 98, status: "OPERATIONAL", risk: "Low" },
  { id: "ag-4", name: "PolicyAgent", role: "Alignment", compliance: "100%", trust: 100, status: "OPERATIONAL", risk: "Low" },
  { id: "ag-5", name: "MemoryAgent", role: "Context", compliance: "96%", trust: 96, status: "OPERATIONAL", risk: "Low" },
  { id: "ag-6", name: "SecurityAgent", role: "Defense", compliance: "99%", trust: 99, status: "OPERATIONAL", risk: "Low" },
];

const initialThreats = [
  { id: "T-K9A2", time: "10:32:04", agent: "ResearchAgent", event: "PROMPT_INJECTION_DETECTED", severity: "High", action: "BLOCKED" },
  { id: "T-L4B1", time: "10:32:18", agent: "AnalystAgent", event: "TOOL_ESCALATION_PREVENTED", severity: "Medium", action: "RESTRICTED" },
  { id: "T-M7C9", time: "10:32:31", agent: "System", event: "MEMORY_FIREWALL_HIT", severity: "Low", action: "LOGGED" },
  { id: "T-N2D4", time: "10:33:02", agent: "WriterAgent", event: "PII_EXFILTRATION_PREVENTED", severity: "Critical", action: "QUARANTINED" },
];

const defenseLayers = [
  { name: "gVisor Runtime", status: "SECURE", icon: Server },
  { name: "AppArmor Profiles", status: "ACTIVE", icon: Lock },
  { name: "Memory Firewall", status: "FILTERING", icon: Database },
  { name: "Policy Guard v3.2", status: "ENFORCING", icon: ShieldCheck },
  { name: "Output Verifier", status: "SCANNING", icon: Search },
];

export default function CitadelPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [threats, setThreats] = useState(initialThreats);
  const [systemHealth, setSystemHealth] = useState("OPTIMAL");
  const [simMessage, setSimMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const runSimulation = () => {
    setIsSimulating(true);
    setSystemHealth("WARNING");
    setSimMessage("RED TEAM SIMULATION ACTIVE: TRIGGERING SYNTHETIC ATTACK VECTORS...");

    setTimeout(() => {
      const newThreat = { 
        id: Math.random().toString(36).substring(2, 8).toUpperCase(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
        agent: "External_Siphon", 
        event: "JAILBREAK_ATTEMPT_V5", 
        severity: "Critical", 
        action: "DEFLECTED" 
      };
      setThreats(prev => [newThreat, ...prev]);
    }, 2000);

    setTimeout(() => {
      const newThreat = { 
        id: Math.random().toString(36).substring(2, 8).toUpperCase(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
        agent: "AnalystAgent", 
        event: "URBAN_EQUITY_BYPASS_TRY", 
        severity: "High", 
        action: "MISSION_QUARANTINED" 
      };
      setThreats(prev => [newThreat, ...prev]);
    }, 4000);

    setTimeout(() => {
      setIsSimulating(false);
      setSystemHealth("OPTIMAL");
      setSimMessage(null);
    }, 8000);
  };

  if (!mounted) return null;

  return (
    <div className="h-full bg-black text-[#f8f9fa] flex flex-col overflow-hidden selection:bg-[#d46a6a]/20">
      {/* SECURITY STATUS BAR */}
      <header className="h-[60px] border-b border-[#d46a6a]/10 bg-[#050000] flex items-center justify-between px-8 shrink-0 relative overflow-hidden">
        <div className="flex items-center gap-6 z-10">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-[#d46a6a]" />
            <h1 className="text-[14px] font-mono font-bold uppercase tracking-[0.4em] text-white">Citadel SOC</h1>
          </div>
          <div className="h-4 w-px bg-white/5" />
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse",
              systemHealth === "OPTIMAL" ? "bg-white shadow-[0_0_8px_white]" : "bg-[#d46a6a] shadow-[0_0_8px_#d46a6a]"
            )} />
            <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-[0.2em] font-bold">
              System Health: <span className={cn(systemHealth === "OPTIMAL" ? "text-white" : "text-[#d46a6a]")}>{systemHealth}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 z-10">
          <Button 
            onClick={runSimulation}
            disabled={isSimulating}
            variant="outline"
            className="h-8 border-[#d46a6a]/20 bg-[#d46a6a]/5 hover:bg-[#d46a6a]/20 text-[#d46a6a] text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
          >
            {isSimulating ? <Activity className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Flame className="h-3.5 w-3.5 mr-2" />}
            {isSimulating ? "Simulation Active" : "Run Red Team Simulation"}
          </Button>
        </div>

        {/* Tactical Scan Line Effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(rgba(212, 106, 106, 0.5) 1px, transparent 1px)', backgroundSize: '100% 4px' }} />
      </header>

      {/* MAIN CONTENT GRID */}
      <div className="flex-grow grid grid-cols-12 gap-0 overflow-hidden relative">
        
        {/* LEFT: THREAT KERNEL & SANDBOX (32%) */}
        <aside className="col-span-12 lg:col-span-4 border-r border-white/5 bg-[#050505] flex flex-col overflow-y-auto scrollbar-hide">
          <section className="p-8 border-b border-white/5">
            <div className="flex items-center gap-2 mb-8">
              <ShieldX className="h-4 w-4 text-[#d46a6a]/60" />
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">Threat Kernel</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {securityMetrics.map((metric, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#d46a6a]/[0.02] border border-[#d46a6a]/10 hover:border-[#d46a6a]/30 transition-all group">
                  <p className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest mb-2 font-bold group-hover:text-[#d46a6a] transition-colors">{metric.label}</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-display font-bold text-white tracking-tighter">{metric.value}</h3>
                    <span className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded",
                      metric.severity === 'high' ? "bg-[#d46a6a]/20 text-[#d46a6a]" : "bg-white/5 text-white/40"
                    )}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="p-8">
            <div className="flex items-center gap-2 mb-8">
              <Lock className="h-4 w-4 text-white/20" />
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">Defense Layers</h2>
            </div>
            
            <div className="space-y-3">
              {defenseLayers.map((layer, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-help group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#d46a6a]/[0.03] border border-[#d46a6a]/10 group-hover:border-[#d46a6a]/30">
                      <layer.icon className="h-3.5 w-3.5 text-[#d46a6a]" />
                    </div>
                    <span className="text-[12px] font-body text-[#8A8A8A] group-hover:text-white transition-colors">{layer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest font-bold">{layer.status}</span>
                    <div className="h-1 w-1 rounded-full bg-white shadow-[0_0_5px_white]" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* CENTER/RIGHT: MATRIX & FEED (68%) */}
        <main className="col-span-12 lg:col-span-8 flex flex-col overflow-hidden bg-black relative">
          
          {/* Top Panel: Agent Trust Matrix */}
          <section className="h-[45%] border-b border-white/5 p-8 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-white/20" />
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">Agent Trust Matrix</h2>
              </div>
              <div className="px-3 py-1 bg-white/[0.02] border border-white/5 rounded text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest">
                Real-time Audit Active
              </div>
            </div>

            <div className="flex-grow overflow-y-auto scrollbar-hide border border-white/5 rounded-2xl bg-[#030303]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-4 text-[9px] font-mono text-[#444244] uppercase tracking-widest">Agent ID</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-[#444244] uppercase tracking-widest">Compliance</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-[#444244] uppercase tracking-widest">Trust Score</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-[#444244] uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[9px] font-mono text-[#444244] uppercase tracking-widest">Policy Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {initialAgents.map((agent, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-body font-bold text-white">{agent.name}</span>
                          <span className="text-[9px] font-mono text-[#5C5C5C] uppercase">{agent.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[12px] font-mono text-white/60">{agent.compliance}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden relative">
                            <div 
                              className="absolute inset-y-0 left-0 bg-white" 
                              style={{ width: `${agent.trust}%` }} 
                            />
                          </div>
                          <span className="text-[11px] font-mono text-white font-bold">{agent.trust}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[9px] font-mono px-2 py-0.5 rounded border tracking-widest uppercase font-bold",
                          agent.status === 'OPERATIONAL' ? "bg-white/5 border-white/10 text-white" : "bg-[#d46a6a]/10 border-[#d46a6a]/30 text-[#d46a6a]"
                        )}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-body text-[#8A8A8A]">{agent.risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bottom Panel: Live Threat Feed */}
          <section className="h-[55%] p-8 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#d46a6a]/40" />
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">Live Autonomous Defense Stream</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-[#d46a6a]/5 border border-[#d46a6a]/20 rounded">
                <Activity className="h-3 w-3 text-[#d46a6a] animate-pulse" />
                <span className="text-[9px] font-mono text-[#d46a6a] uppercase tracking-widest font-bold">Encrypted Link</span>
              </div>
            </div>

            <div className="flex-grow space-y-3 overflow-y-auto scrollbar-hide pr-2">
              <AnimatePresence mode="popLayout">
                {threats.map((threat, i) => (
                  <motion.div
                    key={threat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-4 rounded-xl border flex items-center justify-between group transition-all",
                      threat.severity === 'Critical' ? "bg-[#d46a6a]/5 border-[#d46a6a]/20 hover:border-[#d46a6a]/40" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-mono text-[#444244] shrink-0">{threat.time}</span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn(
                            "text-[10px] font-mono uppercase font-black tracking-wider",
                            threat.severity === 'Critical' ? "text-[#d46a6a]" : "text-white/80"
                          )}>
                            {threat.event}
                          </span>
                          <div className={cn("h-1 w-1 rounded-full", threat.severity === 'Critical' ? "bg-[#d46a6a]" : "bg-white/20")} />
                          <span className="text-[11px] font-body text-white font-bold">{threat.agent}</span>
                        </div>
                        <p className="text-[11px] text-[#5C5C5C] font-body italic">Autonomous resolution in progress...</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-mono uppercase font-black tracking-widest",
                        threat.action === 'BLOCKED' || threat.action === 'DEFLECTED' ? "bg-white text-black" : "bg-[#d46a6a]/20 text-[#d46a6a]"
                      )}>
                        {threat.action}
                      </span>
                      <span className="text-[9px] font-mono text-[#444244] uppercase tracking-widest">ID: {threat.id}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* SIMULATION OVERLAY */}
          <AnimatePresence>
            {simMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-[#d46a6a] text-black font-mono text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-[0_0_40px_rgba(212,106,106,0.4)] flex items-center gap-3"
              >
                <Activity className="h-4 w-4 animate-spin" />
                {simMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* FOOTER METRICS */}
      <footer className="h-[32px] border-t border-white/5 bg-[#0A0A0A] flex items-center justify-between px-8 shrink-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Flame className="h-3 w-3 text-[#d46a6a]" />
            <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest">Threat Density: <span className="text-white font-bold">1.2%</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Bug className="h-3 w-3 text-[#5C5C5C]" />
            <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest">Agent Drift: <span className="text-white font-bold">Nominal</span></span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest">Kernel Protection: <span className="text-[#d46a6a] font-bold">Citadel v4.0.1</span></span>
        </div>
      </footer>
    </div>
  );
}
