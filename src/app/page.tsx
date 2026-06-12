"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IntelligenceSidecar } from "@/components/IntelligenceSidecar";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Image as ImageIcon,
  FileText,
  Zap,
  Mic,
  Database,
  Loader2,
  Globe,
  Landmark,
  X
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { naturalLanguageMissionIntake, type NaturalLanguageMissionIntakeOutput } from "@/ai/flows/natural-language-mission-intake";
import { saveMission } from "@/app/actions/db-actions";

const MISSION_LAUNCH_SNAPSHOT_KEY = "ethicalai.launchSnapshot";

interface StagedMedia {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'file';
}

const UtilityOrb = ({ 
  icon: Icon, 
  label, 
  subtext, 
  onClick,
  active = false,
  status = null
}: { 
  icon: any, 
  label: string, 
  subtext: string, 
  onClick?: () => void,
  active?: boolean,
  status?: "loading" | "active" | null
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  return (
    <motion.button
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onClick={onClick}
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "relative flex items-center gap-2.5 h-9 px-2.5 rounded-full text-left",
        "bg-white/[0.03] border border-white/[0.06] backdrop-blur-md hover:bg-white/[0.05]",
        "transition-all duration-200 group w-full",
        active && "bg-white/[0.08] border-white/20"
      )}
    >
      {status === "loading" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
      ) : (
        <Icon className={cn(
          "h-3.5 w-3.5 shrink-0 transition-transform duration-300",
          (isHovered || active) ? "text-[#f8f9fa]" : "text-[#adb5bd] group-hover:text-[#f8f9fa]"
        )} />
      )}
      
      <AnimatePresence mode="wait">
        {(isHovered || isMobile || active) && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-start pr-1 overflow-hidden"
          >
            <span className="text-[10px] font-bold text-[#f8f9fa] whitespace-nowrap leading-none mb-0.5">{label}</span>
            <span className="text-[8px] font-mono text-[#adb5bd] whitespace-nowrap leading-none uppercase tracking-[0.1em]">{status || subtext}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default function EntryPage() {
  const [isFocused, setIsFocused] = useState(false);
  const [isRightZone, setIsRightZone] = useState(false);
  const [input, setInput] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [listening, setListening] = useState(false);
  
  const [aiResult, setAiResult] = useState<NaturalLanguageMissionIntakeOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<StagedMedia[]>([]);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [contextSources, setContextSources] = useState({
    sessionMemory: true,
    uploadedFiles: false,
    knowledgeBase: true,
    liveInternet: false,
    governmentData: false
  });

  const [activeAgents, setActiveAgents] = useState<Record<string, boolean>>({
    compliance_enforcer: true,
    threat_detector: true,
    research_agent: false,
    financial_auditor: false,
    system_optimizer: false
  });

  const router = useRouter();
  const isMobile = useIsMobile();
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Automatically enable optional agents if suggested by Ollama
  useEffect(() => {
    if (aiResult) {
      const suggested = aiResult.suggested_agents || [];
      setActiveAgents({
        compliance_enforcer: true,
        threat_detector: true,
        research_agent: suggested.includes("research_agent"),
        financial_auditor: suggested.includes("financial_auditor"),
        system_optimizer: suggested.includes("system_optimizer"),
      });
    }
  }, [aiResult]);

  useEffect(() => {
    if (input.trim().length < 8) {
      setAiResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const result = await naturalLanguageMissionIntake({ missionDescription: input });
        setAiResult(result);
      } catch (error) {
        console.error("AI Intake Failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [input]);

  const activeContextCount = useMemo(() => 
    Object.values(contextSources).filter(Boolean).length
  , [contextSources]);

  const handleToggleAgent = (agentId: string) => {
    setActiveAgents(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  const handleLaunch = async () => {
    if (!input.trim() && pendingMedia.length === 0) return;
    setIsLaunching(true);

    const missionId = `M-${Math.floor(100 + Math.random() * 900)}`;
    const steps = aiResult?.workflow_steps || [
      {
        name: "Analyze operational mission constraints",
        assigned_agent_id: "compliance_enforcer",
        is_legal: true,
        legality_reason: "Initial baseline security scan is fully permitted."
      }
    ];

    const agentsMapping = [
      { id: 'compliance_enforcer', enabled: true },
      { id: 'threat_detector', enabled: true },
      { id: 'research_agent', enabled: activeAgents.research_agent },
      { id: 'financial_auditor', enabled: activeAgents.financial_auditor },
      { id: 'system_optimizer', enabled: activeAgents.system_optimizer },
    ];

    try {
      await saveMission(
        missionId,
        input,
        aiResult?.primary_intent || "General Operation",
        aiResult?.riskLevel || "Low",
        aiResult?.clarityScore || 70,
        steps,
        agentsMapping
      );

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          MISSION_LAUNCH_SNAPSHOT_KEY,
          JSON.stringify({
            missionId,
            missionDescription: input.trim(),
            detectedIntent: aiResult?.primary_intent || "General Operation",
            estimatedAgents: aiResult?.estimatedAgents || `${steps.length} units`,
            riskLevel: aiResult?.riskLevel || "Low",
            clarityScore: aiResult?.clarityScore || 70,
            workflowSteps: steps,
            suggestedAgents: aiResult?.suggested_agents || [],
            activeAgents,
            launchedAt: new Date().toISOString(),
          })
        );
      }
    } catch (error) {
      console.error("Failed to save mission to SQLite:", error);
    }

    setTimeout(() => {
      setPendingMedia([]);
      router.push("/intake");
    }, 1200);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !inputContainerRef.current) return;
    const rect = inputContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setIsRightZone(x > rect.width * 0.75);
  };

  const intelligenceVisible = input.length >= 8 || pendingMedia.length > 0;
  const showUtilities = isFocused || isRightZone || isMobile || input.length > 0 || pendingMedia.length > 0 || listening;

  return (
    <div className="min-h-full flex flex-col relative">
      <AnimatePresence>
        {isLaunching && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
              <div className="h-1 w-24 bg-white/5 relative overflow-hidden rounded-full">
                <motion.div initial={{ left: "-100%" }} animate={{ left: "100%" }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="absolute top-0 bottom-0 w-full bg-white shadow-[0_0_15px_white]" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white">Launching NEXUS OS</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row flex-grow overflow-hidden relative">
        <motion.div layout className={cn("flex flex-col items-center justify-center transition-all duration-700 relative z-10", intelligenceVisible && !isMobile ? "lg:w-[72%] w-full" : "w-full")}>
          <div className={cn("w-full px-6 md:px-12 py-12 flex flex-col max-w-4xl", !intelligenceVisible || isMobile ? "items-center text-center" : "items-start")}>
            <div className="mb-10 w-full text-center lg:text-left">
              <h1 className="text-fluid-hero font-display font-bold tracking-tight text-[#f8f9fa] mb-4 leading-[1.1] max-w-3xl mx-auto lg:mx-0">What would you like EthicalAI to do?</h1>
              <p className="text-[17px] text-[#adb5bd] font-body leading-relaxed max-w-xl mx-auto lg:mx-0">Describe your mission in natural language. Our autonomous agent swarm will synthesize the strategy and execute.</p>
            </div>

            <div className="w-full relative max-w-3xl">
              <div ref={inputContainerRef} onMouseMove={handleMouseMove} onMouseLeave={() => setIsRightZone(false)} className="relative group">
                <motion.div layout className="relative bg-[#111111] rounded-[22px] flex flex-col overflow-hidden transition-all duration-300 border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col md:flex-row min-h-[160px] md:min-h-[180px]">
                    <div className="flex-grow relative flex flex-col overflow-hidden">
                      <textarea
                        value={input}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything or describe your mission..."
                        className="w-full h-full bg-transparent border-none focus:ring-0 px-6 md:px-8 pt-8 pb-4 text-lg md:text-[19px] font-body text-[#f8f9fa] placeholder:text-[#adb5bd]/30 resize-none"
                      />
                    </div>
                    <div className={cn("w-full md:w-[140px] shrink-0 border-t md:border-t-0 md:border-l border-white/5 bg-white/[0.01] flex flex-row md:flex-col items-center py-4 md:py-6 px-4 md:px-6 gap-3", showUtilities ? "opacity-100" : "opacity-40")}>
                      <UtilityOrb icon={Mic} label="Voice" subtext="Speech" active={listening} />
                      <UtilityOrb icon={ImageIcon} label="Media" subtext="Images" onClick={() => imageInputRef.current?.click()} />
                      <UtilityOrb icon={FileText} label="Files" subtext="Docs" onClick={() => documentInputRef.current?.click()} />
                      <UtilityOrb icon={Database} label="Context" subtext={activeContextCount > 0 ? `${activeContextCount} ACTIVE` : "IMPORT"} onClick={() => setIsContextOpen(true)} active={activeContextCount > 0} />
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between px-6 md:px-8 py-6 border-t border-white/5 bg-[#0D0D0D] z-20">
                    <div className="flex items-center gap-2">
                      {isAnalyzing ? (
                        <Loader2 className="h-3 w-3 text-white animate-spin" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                      )}
                      <span className="text-[10px] font-mono text-[#adb5bd]/20 tracking-[0.2em] uppercase font-bold">
                        {isAnalyzing ? 'Extracting Intent...' : 'Intelligence Core Ready'}
                      </span>
                    </div>
                    <button onClick={handleLaunch} className="nexus-button">
                      <span className="text">Launch Mission</span>
                      <Zap className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {intelligenceVisible && !isMobile && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: "28%", opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="h-full relative border-l border-white/[0.08] bg-[#0A0A0A] overflow-hidden">
              <div className="p-8 h-full flex flex-col">
                <IntelligenceSidecar 
                  inputLength={input.length} 
                  aiData={aiResult} 
                  activeAgents={activeAgents}
                  onToggleAgent={handleToggleAgent}
                  onLaunch={handleLaunch}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" />
      <input ref={documentInputRef} type="file" accept=".pdf,.doc" className="hidden" />
    </div>
  );
}
