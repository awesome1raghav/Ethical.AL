"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  X, 
  Bell, 
  Search, 
  Plus, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Settings, 
  User 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/Sidebar";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    console.log("NEXUS Kernel Mounted");
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  // PREMIUM BOOT SEQUENCE: Only render loading screen if app is still initializing
  if (isAppLoading) {
    return <LoadingScreen onComplete={() => setIsAppLoading(false)} />;
  }

  return (
    <div className="h-screen w-full bg-black text-[#f8f9fa] flex flex-col overflow-hidden selection:bg-white/10 relative">
      {/* GLOBAL OS TOPBAR */}
      <motion.header 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-[64px] border-b border-white/[0.08] bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-8 shrink-0 z-[100] relative"
      >
        <div className="flex items-center gap-6">
          {/* Hamburger Toggle */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-[#adb5bd] hover:text-white transition-all group flex items-center gap-3"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {sidebarOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isMobile && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5C5C5C] group-hover:text-white transition-colors">
                Architecture
              </span>
            )}
          </button>

          <Link href="/" className="flex flex-col group">
            <span className="font-display font-black text-[14px] md:text-[16px] tracking-[0.25em] text-white group-hover:text-white transition-colors">
              NEXUS OS
            </span>
          </Link>

          {!isMobile && (
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] ml-4">
              <div className="relative flex-shrink-0">
                <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-white animate-pulse opacity-40" />
              </div>
              <span className="font-mono text-[10px] font-bold text-white uppercase tracking-[0.15em] whitespace-nowrap">
                12 Agents Online
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          {!isMobile && (
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5C5C5C]" />
              <input 
                placeholder="Search command..."
                className="bg-white/[0.03] border border-white/[0.06] rounded-full pl-9 pr-4 py-2 text-[11px] font-mono w-[180px] md:w-[240px] transition-all focus:border-white/20 outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button className="p-2 text-[#5C5C5C] hover:text-white transition-colors relative">
              <Bell className="h-4 w-4" />
              <div className="absolute top-2 right-2 h-1.5 w-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
            </button>
            <Link href="/missions/new">
              <button className="h-9 px-4 rounded-full bg-white text-black flex items-center justify-center gap-2 hover:bg-white/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">New Mission</span>
              </button>
            </Link>
          </div>
        </div>
      </motion.header>

      <div className="flex-grow flex relative overflow-hidden">
        {/* SIDEBAR OVERLAY & BACKDROP */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
              />
              
              {/* Sidebar Content */}
              <motion.aside
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300, duration: 0.28 }}
                className={cn(
                  "fixed left-0 top-0 bottom-0 z-[120] bg-[#0A0A0A] border-r border-white/10 shadow-2xl overflow-hidden flex flex-col",
                  isMobile ? "w-[85vw]" : "w-[300px]"
                )}
              >
                <div className="h-full flex flex-col">
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-display font-black text-lg tracking-[0.2em] text-white">NEXUS OS</span>
                      <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest mt-1">Intelligence Kernel</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-[#5C5C5C] hover:text-white transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-grow overflow-y-auto scrollbar-hide py-6">
                    <Sidebar />
                  </div>
                  <div className="p-8 border-t border-white/5 bg-black/40">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-[#5C5C5C]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-white">Raghav</span>
                        <span className="text-[9px] font-mono text-[#5C5C5C] uppercase">Commander</span>
                      </div>
                      <button className="ml-auto p-2 text-[#5C5C5C] hover:text-white">
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* MAIN OPERATIONAL WORKSPACE */}
        <motion.main 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="flex-grow relative flex flex-col overflow-hidden bg-black z-10"
        >
          <div className="flex-grow overflow-y-auto relative scrollbar-hide">
            {children}
          </div>

          {/* KERNEL STATUS FOOTER */}
          <footer className="h-[32px] border-t border-white/[0.08] bg-[#0A0A0A]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-40">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
                <span className="text-[9px] font-mono text-white uppercase tracking-widest font-bold">Stable</span>
              </div>
              <div className="flex items-center gap-6 hidden md:flex">
                <div className="flex items-center gap-2">
                  <Cpu className="h-3 w-3 text-[#5C5C5C]" />
                  <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest">12% Load</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-[#5C5C5C]" />
                  <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest">Nominal</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <ShieldCheck className="h-3 w-3 text-white/40" />
                 <span className="text-[9px] font-mono text-[#5C5C5C] uppercase tracking-widest">Sovereign Protected</span>
              </div>
              <span className="text-[9px] font-mono text-[#333] tracking-[0.2em] font-bold">v1.0.42</span>
            </div>
          </footer>
        </motion.main>
      </div>
    </div>
  );
}
