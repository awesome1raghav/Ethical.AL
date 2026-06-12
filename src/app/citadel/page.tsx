"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";

export default function CitadelPage() {
  return (
    <div className="flex flex-col flex-grow relative">
      <header className="h-[60px] border-b border-[#d46a6a]/10 bg-[#050000] flex items-center justify-between px-8 shrink-0">
         <div className="flex items-center gap-3">
           <ShieldAlert className="h-5 w-5 text-[#d46a6a]" />
           <h1 className="text-sm font-mono font-bold uppercase tracking-[0.4em] text-white">Citadel SOC</h1>
         </div>
      </header>
      <div className="p-10 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="luxury-surface p-8 rounded-2xl border-[#d46a6a]/20">
            <p className="text-[10px] font-mono text-[#5C5C5C] uppercase tracking-widest mb-2">Threat Density</p>
            <h3 className="text-3xl font-display font-bold text-white">0.02%</h3>
          </div>
          <div className="luxury-surface p-8 rounded-2xl border-white/5">
            <p className="text-[10px] font-mono text-[#5C5C5C] uppercase tracking-widest mb-2">Audit Status</p>
            <h3 className="text-3xl font-display font-bold text-white">PASS</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
