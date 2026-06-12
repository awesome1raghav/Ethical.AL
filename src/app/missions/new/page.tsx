"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Globe, Shield, Terminal, Code } from "lucide-react";

export default function NewMission() {
  const [missionDescription, setMissionDescription] = useState("");

  return (
    <div className="max-w-3xl mx-auto py-12 md:py-24 px-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <div className="mb-12">
          <p className="font-body font-semibold text-[11px] tracking-[0.3em] text-[#444244] uppercase mb-4">Mission Definition</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white">What do you want to accomplish?</h1>
        </div>

        <div className="relative group">
          <Textarea 
            placeholder="Describe your goal in plain language... e.g. Research competitors in the AI agent space."
            value={missionDescription}
            onChange={(e) => setMissionDescription(e.target.value)}
            className="min-h-[240px] bg-[#0D0B0D]/60 border-white/10 rounded-2xl p-8 text-xl font-body placeholder:text-[#444244] focus:border-white/20 transition-all"
          />
        </div>

        {missionDescription.length > 20 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-white" />
              <p className="text-sm font-body text-[#8A8A8A]">AI can decompose this into subtasks automatically.</p>
            </div>
          </motion.div>
        )}

        <div className="mt-16 pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Globe, label: "Web Intelligence" },
              { icon: Shield, label: "Governance Audit" },
              { icon: Code, label: "Logic Synthesis" },
              { icon: Terminal, label: "System Execution" },
            ].map((cap, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-xs text-[#8A8A8A]">
                <cap.icon className="h-3.5 w-3.5" />
                {cap.label}
              </div>
            ))}
          </div>

          <Button disabled={missionDescription.length < 10} className="nexus-button min-w-[200px]">
            <span className="text">Initialise Mission</span>
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
