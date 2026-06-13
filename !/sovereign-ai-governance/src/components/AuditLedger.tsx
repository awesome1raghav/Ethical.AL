import React, { useState } from 'react';
import { AuditLog } from '../types';
import { Database, Filter, Hash, Layers, Clipboard, AlertCircle } from 'lucide-react';

interface AuditLedgerProps {
  logs: AuditLog[];
  onClearLedger: () => void;
}

export const AuditLedger: React.FC<AuditLedgerProps> = ({ logs, onClearLedger }) => {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const eventTypes = [
    "ALL",
    "MISSION_CREATED",
    "MISSION_STARTED",
    "RISK_CALCULATED",
    "POLICY_TRIGGERED",
    "MISSION_PAUSED",
    "HUMAN_APPROVED",
    "HUMAN_REJECTED",
    "HUMAN_MODIFIED",
    "MISSION_RESUMED",
    "MISSION_COMPLETED",
    "MISSION_FAILED",
    "INTERVENTION_INJECTED"
  ];

  const filteredLogs = logs.filter(log => {
    if (filterType === "ALL") return true;
    return log.event_type === filterType;
  });

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "MISSION_CREATED":
        return "bg-[#111] text-zinc-400 border-[#222]";
      case "MISSION_STARTED":
        return "bg-blue-500/10 text-blue-400 border-blue-500";
      case "RISK_CALCULATED":
        return "bg-indigo-500/10 text-indigo-455 border-indigo-500";
      case "POLICY_TRIGGERED":
        return "bg-[#FFCC00]/10 text-[#FFCC00] border-[#FFCC00]";
      case "MISSION_PAUSED":
        return "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30] animate-pulse";
      case "HUMAN_APPROVED":
      case "MISSION_RESUMED":
        return "bg-[#34C759]/10 text-[#34C759] border-[#34C759]";
      case "HUMAN_REJECTED":
      case "MISSION_FAILED":
        return "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]";
      case "HUMAN_MODIFIED":
        return "bg-sky-500/10 text-sky-400 border-sky-500";
      case "MISSION_COMPLETED":
        return "bg-[#34C759]/20 text-[#34C759] border-[#34C759] border-dashed";
      default:
        return "bg-[#111] text-zinc-400 border-[#222]";
    }
  };

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    alert(`Copied secure immutable hash: ${hash}`);
  };

  return (
    <div className="bg-[#050505] border border-[#333] p-6 rounded-none flex flex-col h-full shadow-none" id="audit-ledger-panel">
      <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-3 mb-4">
        <div>
          <h2 className="text-[11px] font-sans tracking-[0.2em] text-[#666] uppercase font-bold">Immutable Ledger</h2>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1 flex items-center gap-2">
            <Database className="w-5 h-5 text-white" />
            Audit Vault
          </h3>
        </div>

        {/* Clear Ledger Button */}
        <div>
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-[10px] font-sans uppercase bg-black hover:bg-[#111] px-3 py-1.5 text-zinc-500 hover:text-[#FF3B30] rounded-none border border-[#222] font-semibold cursor-pointer tracking-wider"
              id="btn-trigger-clear-ledger"
            >
              Flush Audit logs
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-black border border-[#FF3B30] p-1.5">
              <span className="text-[9px] font-sans text-[#FF3B30] font-black tracking-wider select-none">CONFIRM FLASH?</span>
              <button
                onClick={() => {
                  onClearLedger();
                  setConfirmClear(false);
                }}
                className="text-[9px] font-sans uppercase font-bold bg-[#FF3B30] text-white px-2 py-0.5 rounded-none cursor-pointer"
                id="btn-confirm-clear"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-[9px] font-sans uppercase font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-none cursor-pointer"
                id="btn-cancel-clear"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-black p-3 rounded-none border border-[#222] mb-4">
        <div className="flex items-center gap-1.5 min-w-0">
          <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="text-xs font-sans text-zinc-400 mr-1 shrink-0 font-bold uppercase tracking-wider">Filter:</span>
          <div className="relative inline-block text-left min-w-0">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#050505] border border-[#222] rounded-none font-mono text-[10px] text-white py-1 pl-2 pr-7 outline-none select-none focus:border-[#333] cursor-pointer truncate max-w-[180px]"
              id="select-audit-filter"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[#666]">Total:</span>
          <span className="bg-[#050505] border border-[#222] px-2 py-0.5 rounded-none text-[#34C759] font-black">
            {filteredLogs.length}
          </span>
          <span className="text-zinc-800">|</span>
          <span className="text-zinc-500 font-bold select-none flex items-center gap-1 uppercase tracking-wider text-[9px]">
            <Layers className="w-3 h-3 text-[#34C759]" />
            VAULT SECURE
          </span>
        </div>
      </div>

      {/* Ledger Feed */}
      <div className="flex-1 overflow-y-auto max-h-[350px] space-y-2 pr-1 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 flex flex-col items-center justify-center gap-1.5 text-[11px] select-none bg-black border border-[#222]">
            <Hash className="w-6 h-6 text-zinc-800 mb-1" />
            <span className="font-extrabold uppercase tracking-widest text-[#444] text-[10px]">Vault Empty</span>
            <span className="text-[10px] text-zinc-650 max-w-xs font-sans">Unleash agent missions to write to the ledger.</span>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isSelected = selectedLogId === log.id;
            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogId(isSelected ? null : log.id)}
                className={`p-3 rounded-none border text-left cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? 'bg-[#0a0a0a] border-[#34C759]' 
                    : 'bg-black border-[#222] hover:bg-[#050505] hover:border-[#333]'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] text-[#666] font-mono font-bold uppercase tracking-wider">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`px-2 py-0.5 border text-[8px] font-black rounded-none uppercase tracking-wide ${getEventBadgeColor(log.event_type)}`}>
                      {log.event_type}
                    </span>
                    {log.agent_id && (
                      <span className="text-[9px] text-zinc-400 font-black bg-neutral-900 px-1.5 py-0.5 rounded-none border border-[#222] uppercase tracking-wider">
                        {log.agent_id}
                      </span>
                    )}
                  </div>
                  <div 
                    onClick={(e) => handleCopyHash(log.hash, e)}
                    className="flex items-center gap-1.5 text-[9px] text-zinc-500 hover:text-[#34C759] font-black bg-[#050505] px-2 py-0.5 border border-[#222] select-all rounded-none uppercase tracking-widest transition-colors"
                    title="Click to copy block hash"
                  >
                    <Hash className="w-3 h-3 text-[#34C759] shrink-0" />
                    <span className="truncate max-w-[80px] font-mono">{log.hash}</span>
                    <Clipboard className="w-3 h-3 text-zinc-700 shrink-0" />
                  </div>
                </div>

                {/* Primary Message */}
                <p className="mt-2 text-[11.5px] font-mono text-zinc-300 select-all font-semibold break-words leading-relaxed pl-2.5 border-l-2 border-[#222]">
                  {log.message}
                </p>

                {/* Expanded Details */}
                {isSelected && log.details && (
                  <div className="mt-3 p-3 bg-[#050505] border border-[#222] text-[10.5px] leading-relaxed text-zinc-400 whitespace-pre-wrap select-all font-mono">
                    <div className="text-[9px] uppercase font-bold text-[#34C759] mb-1.5 tracking-wider border-b border-[#222] pb-1 flex items-center gap-1 select-none">
                      <AlertCircle className="w-3 h-3 text-[#34C759]" />
                      Ledger Cryptographic Metadata
                    </div>
                    {log.details}
                    {log.riskScore !== undefined && (
                      <div className="mt-2 text-zinc-500 border-t border-[#111] pt-1.5 text-[9px] uppercase select-none text-right font-sans font-bold tracking-wider">
                        Calculated risk ceiling: <span className="text-white font-mono font-black">{log.riskScore}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
