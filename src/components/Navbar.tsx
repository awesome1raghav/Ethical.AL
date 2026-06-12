"use client";

import React from "react";
import { Search, Bell, Plus, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const isMobile = useIsMobile();

  return (
    <nav className="sticky top-0 w-full h-[64px] md:h-[68px] bg-black/40 backdrop-blur-2xl border-b border-white/5 z-30 px-6 md:px-10 flex items-center justify-between gap-4">
      {/* Left Area - Search on desktop, Spacing on mobile */}
      <div className="flex-1 max-w-[340px] hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5C5C] group-focus-within:text-white transition-colors" />
          <Input 
            placeholder="Search command..."
            className="w-full bg-[#111111]/50 border-white/5 pl-10 h-10 rounded-xl placeholder:text-[#444244] focus-visible:ring-white/10 focus:border-white/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-white/10 bg-black/40 opacity-40">
            <Command className="h-2.5 w-2.5 text-[#5C5C5C]" />
            <span className="font-mono text-[9px] text-[#5C5C5C]">K</span>
          </div>
        </div>
      </div>

      {/* Center Intelligence Chip */}
      <div className={cn(
        "flex-shrink-0 transition-all",
        isMobile ? "ml-10" : "absolute left-1/2 -translate-x-1/2"
      )}>
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-[#111111]/40 backdrop-blur-md"
        >
          <div className="relative flex-shrink-0">
            <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
            <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-white animate-pulse opacity-40" />
          </div>
          <span className="font-mono text-[9px] md:text-[10px] font-bold text-white uppercase tracking-[0.15em] whitespace-nowrap">
            {isMobile ? "12 Active" : "12 Agents Online"}
          </span>
        </motion.div>
      </div>

      {/* Right Cluster */}
      <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
        {!isMobile && (
          <button className="relative p-2 text-[#8A8A8A] hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
            <div className="absolute top-2 right-2 h-1.5 w-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
          </button>
        )}

        <Link href="/missions/new">
          <Button className="bg-white hover:bg-white/90 text-black font-bold rounded-full h-9 md:h-10 px-4 md:px-6 shadow-[0_0_25px_rgba(255,255,255,0.1)] transition-all active:scale-95 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Mission</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
};
