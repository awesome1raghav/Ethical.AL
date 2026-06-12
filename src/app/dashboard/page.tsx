"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight,
  Activity,
  Database,
  ShieldCheck,
  Cpu,
  User
} from "lucide-react";
import Link from "next/link";
import { IntelligenceSidecar } from "@/components/IntelligenceSidecar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const stats = [
  { label: "Active Missions", value: "3", delta: "+1", type: "neutral", icon: Activity },
  { label: "Agents Running", value: "12", delta: "Live", type: "accent", icon: Cpu },
  { label: "Tasks Done (24h)", value: "142", delta: "+12%", type: "success", icon: ShieldCheck },
  { label: "Memory Signals", value: "2.8k", delta: "Normal", type: "neutral", icon: Database },
];

const missions = [
  { id: "M-902", name: "Market Intelligence", goal: "Decomposing sector trends", status: "Running", progress: 65, agents: 4 },
  { id: "M-841", name: "Security Audit", goal: "Vulnerability synthesis", status: "Analyzing", progress: 42, agents: 3 },
  { id: "M-722", name: "Policy Synthesis", goal: "Ethical alignment check", status: "Queued", progress: 0, agents: 1 },
];

export default function DashboardPage() {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col xl:flex-row h-full overflow-y-auto lg:overflow-hidden">
      {/* Main Workspace */}
      <div className="w-full xl:w-[72%] overflow-y-auto px-6 md:px-10 py-10 lg:py-12 scrollbar-hide">
        {/* Header Section */}
        <header className="mb-10 lg:mb-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="font-mono text-[10px] tracking-[0.4em] text-[#5C5C5C] uppercase mb-4 font-bold">
              Mission Command
            </p>
            <h1 className="text-fluid-h1 font-display font-bold tracking-tight text-white leading-tight mb-4">
              Good evening, Raghav.
            </h1>
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                <p className="text-[13px] md:text-[14px] text-[#adb5bd]">3 active missions</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#5C5C5C]" />
                <p className="text-[13px] md:text-[14px] text-[#adb5bd]">12 agents online</p>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 lg:mb-16">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-5 md:p-6 rounded-[24px] luxury-surface group hover-surface relative overflow-hidden">
              <div className="flex items-start justify-between mb-6 md:mb-8">
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                  <stat.icon className="h-4 w-4 text-[#8A8A8A]" />
                </div>
                <span className={cn(
                  "text-[9px] font-mono px-2 py-0.5 rounded-md border tracking-wider",
                  stat.type === 'accent' ? "bg-white text-black border-white" : "bg-black/40 text-[#5C5C5C] border-white/5"
                )}>
                  {stat.delta}
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#5C5C5C] uppercase tracking-[0.15em] mb-1 font-bold">{stat.label}</p>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tighter">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Mission Section */}
        <div>
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-[11px] md:text-[13px] font-display font-bold uppercase tracking-[0.25em] text-white">Active Operations</h2>
            <Link href="/missions" className="text-[10px] font-mono text-[#5C5C5C] hover:text-white transition-colors tracking-widest uppercase">View Archive →</Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {missions.map((mission, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.1 }} className="p-6 md:p-8 rounded-[24px] luxury-surface group hover-surface relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] text-[#5C5C5C] uppercase tracking-[0.2em]">{mission.id}</span>
                    <h3 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight">{mission.name}</h3>
                    <p className="text-[14px] md:text-[15px] text-[#8A8A8A] font-body mt-1">{mission.goal}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full border text-[9px] font-mono tracking-[0.15em] uppercase flex items-center gap-2 self-start",
                    mission.status === 'Running' ? "bg-white/10 border-white/20 text-white" : "bg-black/40 border-white/5 text-[#5C5C5C]"
                  )}>
                    {mission.status === 'Running' && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                    {mission.status}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                  <div className="md:col-span-8 space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-[0.2em]">Execution Progress</span>
                      <span className="text-[11px] font-mono text-white">{mission.progress}%</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/5 relative rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${mission.progress}%` }} className="absolute top-0 bottom-0 left-0 bg-white" />
                    </div>
                  </div>
                  <div className="md:col-span-4 flex justify-end items-center gap-6">
                    <Link href={`/execution`} className="p-2.5 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {!isMobile && (
        <aside className="w-full xl:w-[28%] border-l border-white/5 bg-[#050505]/40 backdrop-blur-xl p-8 shrink-0">
          <IntelligenceSidecar inputLength={60} />
        </aside>
      )}
    </div>
  );
}
