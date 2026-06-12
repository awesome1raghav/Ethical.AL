
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Target, 
  Zap, 
  ArrowRight, 
  Plus, 
  FileText, 
  Search,
  LayoutGrid,
  Activity,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MissionIntakePage() {
  const [isHoveringStart, setIsHoveringStart] = useState(false);

  return (
    <div className="min-h-full p-12 flex flex-col">
      {/* Header Section */}
      <header className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-[1px] w-8 bg-white/20" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-[#5C5C5C]">Operational Node: Intake</span>
        </div>
        <h1 className="text-[48px] font-display font-bold tracking-tight text-white leading-none mb-4">
          Mission Initialization
        </h1>
        <p className="text-[#8A8A8A] text-lg max-w-2xl font-body">
          Define and launch autonomous intelligence missions within the NEXUS environment. 
          Configure agent swarms, set ethical guardrails, and begin execution.
        </p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Standby System */}
        <div className="col-span-7 space-y-8">
          <div className="luxury-surface rounded-[32px] p-12 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#5C5C5C]">Current Status</h2>
                    <p className="text-xl font-display font-bold text-white">System Idle</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono text-[#5C5C5C] uppercase tracking-widest">Readiness</span>
                  <span className="text-xl font-mono text-white">100%</span>
                </div>
              </div>

              {/* Central Visualization */}
              <div className="h-[240px] flex items-center justify-center relative mb-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
                
                {/* Simulated Orbitals */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10 + i * 5, repeat: Infinity, ease: "linear" }}
                    className="absolute rounded-full border border-white/[0.05]"
                    style={{ 
                      width: 140 + i * 80, 
                      height: 140 + i * 80 
                    }}
                  />
                ))}

                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="h-24 w-24 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center relative shadow-[0_0_40px_rgba(255,255,255,0.02)]"
                >
                  <Cpu className="h-8 w-8 text-white/20" />
                </motion.div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onMouseEnter={() => setIsHoveringStart(true)}
                  onMouseLeave={() => setIsHoveringStart(false)}
                  className="bg-white hover:bg-white/90 text-black font-bold h-16 px-12 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all active:scale-95 text-lg group"
                >
                  Launch Intelligence Swarm
                  <ArrowRight className={cn("ml-3 h-5 w-5 transition-transform duration-300", isHoveringStart ? "translate-x-1" : "")} />
                </Button>
              </div>
            </div>

            {/* Grid Decoration */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 rounded-[24px] bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
              <Plus className="h-5 w-5 text-[#5C5C5C] mb-4 group-hover:text-white transition-colors" />
              <h3 className="text-[13px] font-display font-bold text-white uppercase tracking-widest mb-1">New Template</h3>
              <p className="text-[12px] text-[#5C5C5C] font-body leading-relaxed">Initialize from pre-validated mission frameworks.</p>
            </div>
            <div className="p-8 rounded-[24px] bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
              <FileText className="h-5 w-5 text-[#5C5C5C] mb-4 group-hover:text-white transition-colors" />
              <h3 className="text-[13px] font-display font-bold text-white uppercase tracking-widest mb-1">Policy Library</h3>
              <p className="text-[12px] text-[#5C5C5C] font-body leading-relaxed">Review and attach ethical constraints to your mission.</p>
            </div>
          </div>
        </div>

        {/* Right: Telemetry / Meta */}
        <div className="col-span-5 space-y-6">
          <div className="p-8 rounded-[24px] border border-white/5 bg-[#0A0A0A] flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#5C5C5C]">Kernel Telemetry</h3>
              <Activity className="h-4 w-4 text-white/20" />
            </div>

            <div className="space-y-6">
              {[
                { label: "Active Nodes", value: "32 Online", status: "Nominal" },
                { label: "Memory Buffer", value: "1.2 TB", status: "Secure" },
                { label: "Swarm Pulse", value: "Syncing", status: "Ready" },
                { label: "Sovereign Layer", value: "V3.2.1", status: "Active" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-[#5C5C5C] uppercase tracking-widest">{item.label}</span>
                    <span className="text-[14px] font-body font-bold text-white mt-0.5">{item.value}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded border border-white/10 bg-black/40 text-[9px] font-mono text-[#8A8A8A] uppercase tracking-widest">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8">
              <div className="p-6 rounded-[20px] bg-white/[0.02] border border-white/5">
                <p className="text-[11px] font-body text-[#8A8A8A] leading-relaxed italic">
                  "NEXUS is currently operating in low-latency mode. All autonomous agents are undergoing pre-flight ethical diagnostics."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
