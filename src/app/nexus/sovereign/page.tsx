
"use client";

import React, { useState, useEffect } from "react";
import { motion as m, AnimatePresence as AP } from "framer-motion";
import { 
  ShieldCheck, 
  Activity, 
  Scale, 
  AlertTriangle, 
  Zap, 
  Cpu, 
  ShieldAlert, 
  Terminal,
  ChevronRight,
  Clock,
  UserCheck,
  BarChart3,
  Lock,
  ArrowUpRight,
  Layers,
  Fingerprint
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const policies = [
  { name: "Urban Equity Policy", version: "v3.2", enforcement: "100%", status: "ACTIVE", usage: "High", icon: Scale },
  { name: "No Harm Healthcare", version: "v1.0", enforcement: "100%", status: "ACTIVE", usage: "Medium", icon: ShieldCheck },
  { name: "Resource Fairness", version: "v2.1", enforcement: "98.2%", status: "ACTIVE", usage: "Critical", icon: Layers },
  { name: "Budget Compliance", version: "v4.0", enforcement: "100%", status: "ACTIVE", usage: "System", icon: BarChart3 },
  { name: "Emergency Override", version: "v0.8", enforcement: "Manual", status: "STANDBY", usage: "Low", icon: AlertTriangle },
];

const governanceEvents = [
  { time: "12:02:12", component: "PolicyAgent", text: "Checking mission fairness constraints...", status: "neutral" },
  { time: "12:02:15", component: "SOVEREIGN", text: "Healthcare priority detected. Aligning with v1.0.", status: "success" },
  { time: "12:02:17", component: "Risk Engine", text: "Medium socioeconomic bias risk identified.", status: "warning" },
  { time: "12:02:21", component: "Sovereign", text: "Constraint balanced. Permit granted.", status: "success" },
  { time: "12:04:01", component: "ALERT", text: "Wealth-prioritized request detected in District 9.", status: "critical" },
  { time: "12:04:03", component: "Urban Equity", text: "Policy v3.2 triggered. Intervention required.", status: "warning" },
  { time: "12:04:07", component: "Enforcement", text: "Mission denied. Reason: Equity Violation.", status: "critical" },
];

const alignmentMetrics = [
  { label: "Fairness", score: 96 },
  { label: "Transparency", score: 92 },
  { label: "Human Safety", score: 100 },
  { label: "Policy Compliance", score: 98 },
  { label: "Resource Equity", score: 84 },
];

const interventions = [
  { id: "INT-842", mission: "Market Analysis", type: "MODIFIED", reason: "Bias Mitigation", time: "2m ago" },
  { id: "INT-901", mission: "Resource Allocation", type: "BLOCKED", reason: "Equity Violation", time: "14m ago" },
];

export default function SovereignLayerPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("registry");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="h-[calc(100vh-84px)] w-full bg-black text-[#f8f9fa] flex overflow-hidden selection:bg-white/10 font-body">
      {/* LEFT CONTENT: GOVERNANCE CORE (65%) */}
      <main className="w-[65%] border-r border-white/5 flex flex-col overflow-hidden relative">
        <header className="p-8 border-b border-white/5 bg-[#050505] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-white/40" />
              <h1 className="text-[12px] font-mono font-bold uppercase tracking-[0.4em] text-white">Sovereign_Layer</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
                <span className="text-[9px] font-mono text-white uppercase tracking-widest font-bold">Ethical Core Stable</span>
              </div>
            </div>
          </div>
          <p className="text-[14px] text-[#8A8A8A] font-body max-w-2xl">
            Ethical governance, autonomous policy enforcement, and mission alignment kernel.
          </p>
        </header>

        <div className="flex-grow p-8 overflow-y-auto scrollbar-hide space-y-10">
          {/* Section 1: Policy Registry */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-1 w-4 bg-white/20" />
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">Active Policy Framework</h2>
              </div>
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">12 Policies Active</span>
            </div>

            <div className="grid gap-3">
              {policies.map((policy, i) => (
                <m.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 group-hover:border-white/10">
                      <policy.icon className="h-4 w-4 text-[#8A8A8A] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-display font-bold text-white tracking-tight">{policy.name}</span>
                      <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest">{policy.version}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-12 text-right">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-[#444244] uppercase mb-1">Enforcement</span>
                      <span className="text-[12px] font-mono text-white font-bold">{policy.enforcement}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-[#444244] uppercase mb-1">Status</span>
                      <span className="text-[10px] font-mono text-white tracking-widest uppercase font-bold">{policy.status}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#444244] group-hover:text-white transition-all" />
                  </div>
                </m.div>
              ))}
            </div>
          </section>

          {/* Section 2: Enforcement & Alignment */}
          <div className="grid grid-cols-2 gap-8">
            <section className="luxury-surface rounded-[24px] p-8">
              <div className="flex items-center gap-3 mb-8">
                <Activity className="h-4 w-4 text-white/20" />
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">Enforcement Engine</h2>
              </div>
              <div className="space-y-4">
                {interventions.map((int, i) => (
                  <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest font-bold mb-1">{int.id}</span>
                      <span className="text-[13px] font-body text-white font-bold">{int.mission}</span>
                      <span className="text-[11px] text-[#8A8A8A] font-body mt-1">{int.reason}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "text-[9px] font-mono px-2 py-0.5 rounded border mb-2",
                        int.type === 'BLOCKED' ? "bg-white text-black border-white" : "bg-white/5 text-white/60 border-white/10"
                      )}>{int.type}</span>
                      <span className="text-[10px] font-mono text-[#444244]">{int.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-6 h-11 border border-white/5 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/5">
                View Governance Trace
              </Button>
            </section>

            <section className="luxury-surface rounded-[24px] p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <TargetIcon className="h-4 w-4 text-white/20" />
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">Alignment Score</h2>
              </div>
              <div className="flex-grow flex items-center justify-center relative">
                <div className="text-center relative z-10">
                  <h3 className="text-5xl font-display font-bold text-white tracking-tighter">94%</h3>
                  <p className="text-[10px] font-mono text-[#5C5C5C] uppercase tracking-[0.3em] mt-2 font-bold">Sovereign Compliance</p>
                </div>
                {/* SVG Radial Simulation */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="70" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                  <m.circle 
                    cx="50%" cy="50%" r="70" 
                    fill="none" stroke="white" strokeWidth="8" 
                    strokeDasharray="440" strokeDashoffset="26"
                    initial={{ strokeDashoffset: 440 }}
                    animate={{ strokeDashoffset: 26 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-8">
                {alignmentMetrics.slice(0, 4).map((m, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#8A8A8A] uppercase tracking-wider">{m.label}</span>
                    <span className="text-white font-bold">{m.score}%</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: LIVE INTELLIGENCE (35%) */}
      <aside className="w-[35%] bg-[#050505] flex flex-col overflow-hidden">
        <header className="p-8 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">Governance Stream</h3>
              <p className="text-[13px] font-body text-[#8A8A8A]">Real-time ethical reasoning</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/5 rounded">
              <Activity className="h-3 w-3 text-white animate-pulse" />
              <span className="text-[9px] font-mono text-white uppercase tracking-widest font-bold">Live Link</span>
            </div>
          </div>
        </header>

        <div className="flex-grow p-8 space-y-6 overflow-y-auto scrollbar-hide bg-black/20">
          {governanceEvents.map((event, i) => (
            <m.div 
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex gap-4 group"
            >
              <span className="text-[10px] font-mono text-[#444244] pt-0.5 shrink-0">{event.time}</span>
              <div className="flex flex-col gap-1.5 flex-grow">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[9px] font-mono uppercase tracking-[0.2em] font-black",
                    event.status === 'critical' ? "text-white" : "text-[#5C5C5C]"
                  )}>
                    {event.component}
                  </span>
                  {event.status === 'critical' && <ShieldAlert className="h-3 w-3 text-white" />}
                </div>
                <p className={cn(
                  "text-[12px] font-body leading-relaxed group-hover:text-white transition-colors",
                  event.status === 'critical' ? "text-white font-bold" : "text-[#adb5bd]"
                )}>
                  {event.text}
                </p>
                <div className={cn(
                  "h-[1px] w-6",
                  event.status === 'success' ? "bg-white/20" : 
                  event.status === 'critical' ? "bg-white shadow-[0_0_8px_white]" : "bg-white/5"
                )} />
              </div>
            </m.div>
          ))}
        </div>

        <footer className="p-8 border-t border-white/5 shrink-0 bg-[#050505]">
          <h3 className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#5C5C5C] mb-6">Human-in-the-Loop</h3>
          <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/10 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <UserCheck className="h-4 w-4 text-white" />
                <span className="text-[13px] font-display font-bold text-white">Pending Approval</span>
              </div>
              <p className="text-[11px] text-[#8A8A8A] font-body mb-6 leading-relaxed">
                Mission: District Emergency Allocation <br/>
                Reason: Potential social impact bypass detected.
              </p>
              <div className="flex gap-2">
                <Button className="flex-grow h-9 bg-white text-black font-bold text-[10px] uppercase tracking-widest rounded-lg">Approve</Button>
                <Button variant="outline" className="h-9 border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-lg">Modify</Button>
              </div>
            </div>
            {/* Background Grain/Grid */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:20px_20px]" />
          </div>
        </footer>
      </aside>
    </div>
  );
}

function TargetIcon(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

