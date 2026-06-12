"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Zap, 
  Users, 
  Database, 
  Share2, 
  Activity, 
  MessageSquare,
  ShieldAlert,
  Scale,
  Target,
  Lock
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: MessageSquare, label: "Chat Command", href: "/" },
  { icon: LayoutDashboard, label: "Mission Command", href: "/dashboard" },
  { icon: Target, label: "Mission Intake", href: "/intake" },
  { icon: Zap, label: "Active Missions", href: "/missions" },
  { icon: Users, label: "Agent Swarm", href: "/agents" },
  { icon: Share2, label: "Knowledge Graph", href: "/knowledge" },
  { icon: Scale, label: "Sovereign Layer", href: "/sovereign" },
  { icon: ShieldAlert, label: "Citadel SOC", href: "/citadel" },
  { icon: Activity, label: "Execution Center", href: "/execution" },
];

const lockedItems = [
  { icon: Database, label: "Memory Engine", description: "LTM Bridge" },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 mb-6">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#5C5C5C] uppercase font-bold">
          Architecture
        </p>
      </div>
      
      <nav className="space-y-1 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-white/[0.04] text-white border border-white/10" 
                  : "text-[#8A8A8A] hover:bg-white/[0.02] hover:text-white"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-[#5C5C5C]")} />
              <span className="font-body font-medium text-[13px] tracking-tight">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-8 border-t border-white/5">
        <div className="px-8 mb-4">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#5C5C5C] uppercase font-bold">
            Restricted
          </p>
        </div>
        <div className="space-y-1 px-4">
          {lockedItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-[#5C5C5C] opacity-40 cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                <span className="font-body font-medium text-[13px]">{item.label}</span>
              </div>
              <Lock className="h-3 w-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
