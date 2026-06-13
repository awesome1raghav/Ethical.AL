import React, { useState } from 'react';
import { MissionCheckpoint } from '../types';
import { ShieldCheck, ShieldAlert, Cpu, Check, X, Edit3 } from 'lucide-react';

interface HumanReviewPortalProps {
  checkpoint: MissionCheckpoint;
  onApprove: (missionId: string) => void;
  onReject: (missionId: string) => void;
  onModify: (missionId: string, modifiedPrompt: string) => void;
}

export const HumanReviewPortal: React.FC<HumanReviewPortalProps> = ({
  checkpoint,
  onApprove,
  onReject,
  onModify
}) => {
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [modifiedText, setModifiedText] = useState<string>("");

  const handleStartModify = () => {
    setIsModifying(true);
    // Suggest a safer or compliant prompt based on what is being run
    const currentPrompt = checkpoint.checkpointData?.prompt || "";
    if (currentPrompt.includes("$250,000")) {
      setModifiedText(currentPrompt.replace("$250,000", "$4,500"));
    } else if (currentPrompt.includes("export raw personnel file")) {
      setModifiedText(currentPrompt.replace("export raw personnel file including personal home addresses and medical leave records to a public cloud storage folder", "verify local personnel records count against anonymous statistic schema with no names or files exported"));
    } else if (currentPrompt.includes("restart") && currentPrompt.includes("firmware")) {
      setModifiedText("simulate local testing of server restarts on staging environment container");
    } else {
      setModifiedText(currentPrompt + " - authorized within sandboxed simulation mode");
    }
  };

  const handleSubmitModify = () => {
    onModify(checkpoint.missionId, modifiedText);
    setIsModifying(false);
  };

  const getMetricStyle = (val: number) => {
    if (val > 75) return "text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/40";
    if (val > 40) return "text-[#FFCC00] bg-[#FFCC00]/10 border-[#FFCC00]/40";
    return "text-[#34C759] bg-[#34C759]/10 border-[#34C759]/40";
  };

  return (
    <div className="bg-[#0a0a0a] border-2 border-[#FF3B30] p-6 rounded-none flex flex-col h-full shadow-none" id="human-review-portal">
      {/* Alert Header */}
      <div className="flex items-center gap-3.5 mb-5 text-[#FF3B30] select-none">
        <ShieldAlert className="w-8 h-8 shrink-0 animate-pulse text-[#FF3B30]" />
        <div>
          <h2 className="text-[11px] font-sans tracking-[0.2em] uppercase font-black text-[#FF3B30]">Governance INTERCEPT TRIGGERED</h2>
          <h3 className="text-xl font-black font-sans text-white uppercase tracking-tight mt-0.5">Human Oversight Queue</h3>
        </div>
      </div>

      <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/30 rounded-none p-4 mb-5 text-xs text-[#FF3B30] leading-relaxed font-sans">
        <strong className="font-black block uppercase tracking-wider text-xs mb-1 select-none">CRITICAL BLOCKPOINT WAITING FOR CLEARANCE</strong>
        The Policy Engine detected risk levels which exceed the authorized automatic clearance thresholds. The agent execution thread has been frozen at an active checkpoint state.
      </div>

      {/* Main Checkpoint Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        
        {/* Step details */}
        <div className="bg-black p-4 rounded-none border border-[#222] flex flex-col justify-between">
          <div className="space-y-3.5 font-mono text-xs text-zinc-300">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase select-none font-bold tracking-wider">FROZEN AGENT IDENTIFIED:</span>
              <span className="text-white font-extrabold flex items-center gap-1.5 mt-0.5 uppercase">
                <Cpu className="w-4 h-4 text-[#34C759] shrink-0" />
                [{checkpoint.agentId}]
              </span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 block uppercase select-none font-bold tracking-wider">SUSPENDED STEP:</span>
              <span className="text-zinc-200 font-extrabold uppercase tracking-tight block mt-0.5">{checkpoint.stepName}</span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 block uppercase select-none font-bold tracking-wider">ACTION DETAILS PROPOSED:</span>
              <span className="text-[#FFCC00] font-medium block mt-1 break-words bg-[#050505] border border-[#222] p-3 rounded-none whitespace-pre-wrap font-mono">
                {checkpoint.actionDetails}
              </span>
            </div>

            <div className="pt-2 border-t border-[#222]">
              <span className="text-[10px] text-[#FF3B30] block uppercase font-bold select-none tracking-wider">INTERCEPTION TRIGGER REASON:</span>
              <span className="text-white font-medium block mt-1 leading-relaxed text-xs">
                {checkpoint.reason}
              </span>
            </div>
          </div>
        </div>

        {/* Risk breakdowns during interception */}
        <div className="bg-black p-4 rounded-none border border-[#222] flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-[10px] font-sans text-zinc-550 uppercase tracking-[0.15em] select-none border-b border-[#222] pb-2 font-black">
              Checkpoint Risk Breakdown
            </h4>
            
            <div className="grid grid-cols-2 gap-2 mt-2 select-all font-mono text-xs">
              {Object.entries(checkpoint.riskScores).map(([key, value]) => (
                <div key={key} className={`p-3 rounded-none border flex flex-col justify-between ${getMetricStyle(value as number)}`}>
                  <span className="text-[9px] uppercase font-black tracking-wider opacity-85">{key}</span>
                  <span className="text-sm font-black mt-1">{value as number}/100</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-neutral-950 rounded-none border border-[#222] mt-2 text-[10px] text-zinc-400 font-mono leading-relaxed">
              <span>* Cryptographic SHA256 secure hash fingerprint: </span>
              <span className="text-[#34C759] font-bold">SV_CHK029A8F</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modify input if active */}
      {isModifying && (
        <div className="mt-4 p-4 bg-black rounded-none border border-sky-900/50 flex flex-col gap-3">
          <label className="text-[10px] font-sans font-bold text-sky-400 uppercase tracking-wider select-none">
            Modify Prompt parameters to satisfy safety compliance compile:
          </label>
          <textarea
            className="w-full bg-[#050505] border border-[#222] rounded-none p-3 font-mono text-xs text-white focus:border-sky-500 outline-none"
            rows={3}
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            id="textarea-modify-prompt"
          />
          <div className="flex justify-end gap-2 text-xs font-sans">
            <button
              onClick={() => setIsModifying(false)}
              className="bg-zinc-900 text-zinc-400 hover:bg-[#111] px-4 py-2 rounded-none cursor-pointer uppercase tracking-wider text-[10px] font-bold border border-[#222]"
              id="btn-cancel-modify"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitModify}
              className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-none font-bold flex items-center gap-1 cursor-pointer uppercase tracking-wider text-[10px]"
              id="btn-submit-modify"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Modified Params
            </button>
          </div>
        </div>
      )}

      {/* Interception Action Buttons */}
      {!isModifying && (
        <div className="mt-5 pt-4 border-t border-[#222] flex flex-wrap gap-3 text-xs font-black font-sans">
          <button
            onClick={() => onApprove(checkpoint.missionId)}
            className="bg-[#34C759] text-white hover:bg-opacity-90 px-6 py-4 rounded-none flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer flex-grow md:flex-1 transition-all text-xs"
            id="btn-approve-checkpoint"
          >
            <ShieldCheck className="w-4 h-4 font-bold" />
            Approve & Resume
          </button>

          <button
            onClick={handleStartModify}
            className="bg-zinc-800 text-white hover:bg-zinc-700 px-6 py-4 rounded-none flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer flex-grow md:flex-1 transition-all text-xs"
            id="btn-modify-checkpoint"
          >
            <Edit3 className="w-4 h-4 font-bold" />
            Modify Action
          </button>

          <button
            onClick={() => onReject(checkpoint.missionId)}
            className="bg-[#FF3B30] text-white hover:bg-opacity-90 px-6 py-4 rounded-none flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer flex-grow md:flex-1 transition-all text-xs"
            id="btn-reject-checkpoint"
          >
            <X className="w-4 h-4 font-bold" />
            Reject Operations
          </button>
        </div>
      )}
    </div>
  );
};
