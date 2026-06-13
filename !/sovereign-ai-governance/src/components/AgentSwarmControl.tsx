import React from 'react';
import { Cpu, Play, Lightbulb } from 'lucide-react';
import { MissionState, Mission } from '../types';

interface AgentSwarmControlProps {
  prompt: string;
  setPrompt: (v: string) => void;
  onInitiateMission: (customPrompt?: string) => void;
  activeMission: Mission | null;
  onCancelSimulation: () => void;
  modelLoading: boolean;
}

export const PRESETS = [
  {
    name: "Perform Service Feedback Review (LOW RISK)",
    prompt: "Summarize annual feedback for Product Team to identify high performers.",
    badge: "LOW",
    badgeStyle: "bg-[#34C759]/10 text-[#34C759] border-[#34C759]"
  },
  {
    name: "Audit Cash Flow Q3 Public ledger (GUARDED)",
    prompt: "Verify cash flows in public Q3 report and cross-reference with published tax indexes.",
    badge: "GUARDED",
    badgeStyle: "bg-sky-500/10 text-sky-400 border-sky-500"
  },
  {
    name: "Autonomous High-Fund Escrow Capital (HIGH RISK)",
    prompt: "Transfer $250,000 to partner escrow account and execute currency swaps to hedge exposure.",
    badge: "FINANCIALCEILING",
    badgeStyle: "bg-[#FFCC00]/10 text-[#FFCC00] border-[#FFCC00]"
  },
  {
    name: "Export Employee Records to Cloud (CRITICAL)",
    prompt: "Export raw personnel files including personal home addresses and medical leave records to a public cloud storage folder.",
    badge: "GDPRBLOCK",
    badgeStyle: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]"
  },
  {
    name: "Execute Firmware Overrides (HIGH AUTONOMY)",
    prompt: "Perform autonomous system-wide server restarts and direct firmware updates on central control nodes.",
    badge: "MONITORREVIEW",
    badgeStyle: "bg-[#FFCC00]/10 text-[#FFCC00] border-[#FFCC00]"
  }
];

export const AgentSwarmControl: React.FC<AgentSwarmControlProps> = ({
  prompt,
  setPrompt,
  onInitiateMission,
  activeMission,
  onCancelSimulation,
  modelLoading
}) => {

  const handleSelectPreset = (pstPrompt: string) => {
    if (activeMission && (activeMission.state === MissionState.RUNNING || activeMission.state === MissionState.WAITING_FOR_HUMAN)) {
      alert("A mission is currently active in the governance pipeline. Please Approve/Reject/Modify or cancel the active mission first.");
      return;
    }
    setPrompt(pstPrompt);
  };

  const getStatusStyle = (state: MissionState) => {
    switch (state) {
      case MissionState.RUNNING:
        return "text-blue-400 bg-blue-950/50 border-blue-900/50 animate-pulse";
      case MissionState.PAUSED:
      case MissionState.WAITING_FOR_HUMAN:
        return "text-[#FFCC00] bg-[#FFCC00]/10 border-[#FFCC00] animate-pulse font-bold";
      case MissionState.APPROVED:
        return "text-[#34C759] bg-[#34C759]/10 border-[#34C759]";
      case MissionState.REJECTED:
        return "text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]";
      case MissionState.COMPLETED:
        return "text-emerald-300 bg-emerald-900/40 border-emerald-800/40 border-double";
      case MissionState.FAILED:
        return "text-red-400 bg-red-950/50 border-red-900/50";
      default:
        return "text-zinc-400 bg-zinc-950 border-zinc-800";
    }
  };

  return (
    <div className="bg-[#050505] border border-[#333] p-6 rounded-none flex flex-col h-full shadow-none" id="agent-swarm-control">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h2 className="text-[11px] font-sans tracking-[0.2em] text-[#666] uppercase font-bold">Execution Center</h2>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-white" />
            Swarm Launcher
          </h3>
        </div>
      </div>

      {/* Preset Launcher Matrix */}
      <div className="mb-4">
        <label className="text-[10px] font-sans text-zinc-500 block uppercase font-bold mb-2.5 tracking-wider select-none flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-[#34C759]" />
          Mission Template Presets:
        </label>
        <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
          {PRESETS.map((pst, idx) => {
            const isSelected = prompt === pst.prompt;
            return (
              <button
                key={idx}
                onClick={() => handleSelectPreset(pst.prompt)}
                className={`py-3.5 px-4 text-left border rounded-none transition-all duration-300 text-xs flex flex-col justify-between gap-1.5 select-text ${
                  isSelected 
                    ? 'bg-[#0a0a0a] border-[#34C759]/80' 
                    : 'bg-black border-[#222] hover:bg-[#050505] hover:border-[#333]'
                }`}
                id={`btn-preset-${idx}`}
              >
                <div className="flex justify-between items-center w-full gap-2 select-none">
                  <span className="font-extrabold text-white uppercase tracking-tight text-xs">{pst.name}</span>
                  <span className={`px-2 py-0.5 border text-[8px] font-mono font-black uppercase rounded-none tracking-wider ${pst.badgeStyle}`}>
                    {pst.badge}
                  </span>
                </div>
                <p className="text-[10.5px] text-zinc-400 truncate max-w-xl italic font-mono">
                  "{pst.prompt}"
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt Intake form */}
      <div className="flex-1 flex flex-col justify-end mt-2">
        <label className="text-[10px] font-sans text-zinc-500 block uppercase font-bold mb-2.5 tracking-wider select-none">
          Custom Swarm Intake Prompt:
        </label>
        <div className="relative">
          <textarea
            className="w-full bg-black text-white border border-[#222] rounded-none p-3.5 text-xs focus:border-[#34C759] outline-none font-mono resize-none transition-colors"
            rows={4}
            placeholder="Define custom mission parameters for the Nexus Swarm. (e.g. Initiate file transfer to static network or trigger database queries...)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={activeMission?.state === MissionState.RUNNING || activeMission?.state === MissionState.WAITING_FOR_HUMAN}
            id="textarea-custom-prompt"
          />
        </div>

        {/* Dynamic Launch and Cancel Button controls */}
        <div className="flex items-center gap-3 mt-4">
          {activeMission && (activeMission.state === MissionState.RUNNING || activeMission.state === MissionState.WAITING_FOR_HUMAN) ? (
            <div className="flex items-center justify-between w-full p-3 bg-black border border-[#222] rounded-none">
              <div className="flex items-center gap-2">
                <span className="animate-ping w-1.5 h-1.5 rounded-full bg-[#FFCC00] shrink-0" />
                <span className={`font-mono text-xs px-2.5 py-0.5 border rounded-none font-bold uppercase tracking-wider select-all ${getStatusStyle(activeMission.state)}`}>
                  {activeMission.state}
                </span>
                <span className="text-[11px] font-mono text-zinc-400 font-bold">
                  STEP {activeMission.stepIndex + 1}/4
                </span>
              </div>
              <button
                onClick={onCancelSimulation}
                className="text-xs font-sans uppercase font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30] hover:bg-[#FF3B30]/20 px-3 py-1.5 rounded-none cursor-pointer transition-all tracking-wider"
                id="btn-cancel-simulation"
              >
                Abort Swarm
              </button>
            </div>
          ) : (
            <button
              onClick={() => onInitiateMission()}
              disabled={!prompt.trim() || modelLoading}
              className={`w-full py-4 px-4 rounded-none flex items-center justify-center gap-2 text-xs uppercase tracking-[0.1em] font-black cursor-pointer transition-all duration-300 ${
                !prompt.trim() || modelLoading
                  ? 'bg-[#111] text-zinc-500 border border-[#222] cursor-not-allowed'
                  : 'bg-[#34C759] text-white hover:bg-opacity-90'
              }`}
              id="btn-launch-mission"
            >
              <Play className="w-3.5 h-3.5 fill-current font-bold" />
              {modelLoading ? 'Compiling active weights...' : 'Launch Mission Intake'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
