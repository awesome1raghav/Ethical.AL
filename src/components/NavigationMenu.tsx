
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Zap, 
  Users, 
  Database, 
  Share2, 
  Activity, 
  Eye, 
  Settings,
  X,
  MessageSquare
} from "lucide-react";
import Link from "next/link";

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: MessageSquare, label: "Chat Command", href: "/" },
  { icon: LayoutDashboard, label: "Mission Command", href: "/dashboard" },
  { icon: Zap, label: "Active Missions", href: "/missions" },
  { icon: Users, label: "Agent Swarm", href: "/agents" },
  { icon: Database, label: "Memory Engine", href: "/memory" },
  { icon: Share2, label: "Knowledge Graph", href: "/nexus/knowledge" },
  { icon: Activity, label: "Execution Center", href: "/execution" },
  { icon: Eye, label: "Observability", href: "/observability" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[320px] z-50 bg-[#111111] border-l border-white/5 p-8 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center mb-12 shrink-0">
              <span className="font-display font-bold text-lg text-white">Workspace</span>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[#8A8A8A]" />
              </button>
            </div>

            <nav className="space-y-2 overflow-y-auto scrollbar-hide flex-grow mb-8 pr-2">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl text-[#8A8A8A] hover:text-white hover:bg-white/5 transition-all group"
                  >
                    <item.icon className="h-5 w-5 group-hover:text-white transition-colors" />
                    <span className="font-body font-medium text-[15px]">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="shrink-0 pt-4 border-t border-white/5">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[11px] font-mono text-[#5C5C5C] uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[13px] font-medium text-white/80">Ethical Core Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
