"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  Target, 
  Plus,
  Filter,
  ArrowUpDown,
  Zap,
  Fingerprint,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const operationalMissions = [
  { id: "M-902", title: "Market Intelligence", description: "Decomposing sector trends and competitor signals.", status: "Running", progress: 65, agents: 4, eta: "2.4m", risk: "Low", memory: "Writing", graph: "Syncing" },
  { id: "M-841", title: "Security Audit", description: "Vulnerability synthesis and penetration simulation.", status: "Analyzing", progress: 42, agents: 3, eta: "8.1m", risk: "Medium", memory: "Reading", graph: "Locked" },
  { id: "M-722", title: "Policy Synthesis", description: "Ethical alignment check for new product deployment.", status: "Queued", progress: 0, agents: 1, eta: "—", risk: "Low", memory: "Standby", graph: "Standby" },
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Running: "bg-white/10 text-white border-white/20",
    Analyzing: "bg-white/5 text-[#ced4da] border-white/10",
    Queued: "bg-black/40 text-[#5C5C5C] border-white/5",
  };
  return (
    <div className={cn("px-2 py-0.5 rounded-md border text-[9px] font-mono tracking-[0.15em] uppercase flex items-center gap-1.5", styles[status] || styles.Queued)}>
      {status === "Running" && <div className="h-1 w-1 rounded-full bg-white animate-pulse" />}
      {status}
    </div>
  );
};

export default function ActiveMissionsPage() {
  const [selectedMissionId, setSelectedMissionId] = useState("M-902");

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-full lg:w-[72%] overflow-y-auto px-6 md:px-10 py-10 scrollbar-hide flex flex-col">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-6">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-[#5C5C5C] uppercase block mb-2">Operational Hub</span>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-1">Active Missions</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" className="h-9 px-4 border border-white/5 bg-[#111111]/40 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/5">
              <Filter className="h-3 w-3 mr-2" /> Filters
            </Button>
            <Link href="/missions/new">
              <Button className="h-9 bg-white hover:bg-white/90 text-black text-[10px] font-mono font-bold uppercase tracking-widest px-5 rounded-lg">
                <Plus className="h-3.5 w-3.5 mr-2" /> New Mission
              </Button>
            </Link>
          </div>
        </header>

        <div className="space-y-3">
          {operationalMissions.map((mission, i) => (
            <motion.div key={mission.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setSelectedMissionId(mission.id)} className={cn("p-6 rounded-[20px] border transition-all cursor-pointer group relative overflow-hidden", selectedMissionId === mission.id ? "bg-white/[0.03] border-white/10" : "bg-[#0A0A0A] border-white/5 hover:border-white/10")}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-[#5C5C5C] uppercase tracking-[0.2em] font-bold">{mission.id}</span>
                <StatusBadge status={mission.status} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4">
                  <h3 className="text-xl font-display font-bold text-white mb-1">{mission.title}</h3>
                  <p className="text-[13px] text-[#8A8A8A] font-body line-clamp-1">{mission.description}</p>
                </div>
                <div className="md:col-span-5 flex flex-col justify-center">
                  <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${mission.progress}%` }} className="h-full bg-white shadow-[0_0_8px_white]" />
                  </div>
                </div>
                <div className="md:col-span-3 flex justify-end">
                   <Button variant="outline" className="h-8 border-white/5 bg-white/5 text-[10px] font-mono font-bold uppercase">Inspect →</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <aside className="hidden lg:flex w-[28%] border-l border-white/5 bg-[#050505] p-8 flex-col h-full overflow-hidden">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#5C5C5C]">Execution Stream</h3>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/5">
              <Activity className="h-3 w-3 text-white animate-pulse" />
              <span className="text-[9px] font-mono text-white uppercase font-bold">Live</span>
            </div>
          </div>
        </header>
        <footer className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-[#5C5C5C] uppercase">Sovereign State</span>
              <span className="text-[11px] font-body font-bold text-white">Secure Protected</span>
            </div>
            <Fingerprint className="h-4 w-4 text-white/40" />
          </div>
        </footer>
      </aside>
    </div>
  );
}
