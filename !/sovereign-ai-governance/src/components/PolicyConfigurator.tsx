import React from 'react';
import { PolicyRule } from '../types';
import { Shield, ToggleLeft, ToggleRight, Sliders, Info, Cpu, FileWarning, DollarSign, EyeOff } from 'lucide-react';

interface PolicyConfiguratorProps {
  policies: PolicyRule[];
  onTogglePolicy: (id: string) => void;
  onUpdateThreshold: (id: string, field: "autonomy" | "impact" | "financial" | "privacy" | "ethical", newValue: number) => void;
}

export const PolicyConfigurator: React.FC<PolicyConfiguratorProps> = ({
  policies,
  onTogglePolicy,
  onUpdateThreshold
}) => {

  const getPolicyIcon = (id: string) => {
    switch(id) {
      case "policy_autonomy_impact":
        return <Cpu className="w-4 h-4 text-[#FFCC00]" />;
      case "policy_financial_cap":
        return <DollarSign className="w-4 h-4 text-[#34C759]" />;
      case "policy_privacy_barrier":
        return <EyeOff className="w-4 h-4 text-[#FF3B30]" />;
      case "policy_ethical_bias":
        return <FileWarning className="w-4 h-4 text-[#FFCC00]" />;
      default:
        return <Shield className="w-4 h-4 text-white" />;
    }
  };

  // Helper to extract or parse thresholds from text dynamically
  const parseThreshold = (text: string, keyword: string): number => {
    const regex = new RegExp(`${keyword}\\s*(?:>|>=|==|<=|<)?\\s*(\\d+)`, 'i');
    const match = text.match(regex);
    return match ? parseInt(match[1]) : 80;
  };

  return (
    <div className="bg-[#050505] border border-[#333] p-6 rounded-none flex flex-col h-full shadow-none" id="policy-configurator">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h2 className="text-[11px] font-sans tracking-[0.2em] text-[#666] uppercase font-bold">SOVEREIGN Core</h2>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1">Policy Engine</h3>
        </div>
        <Sliders className="w-4 h-4 text-[#666]" />
      </div>

      <p className="text-xs text-zinc-400 mb-5 font-sans leading-relaxed">
        Policies compile automatically at runtime. SOVEREIGN intercepts execution and evaluates active policies against live risk scores.
      </p>

      {/* Policies List */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1 max-h-[440px]">
        {policies.map((policy) => {
          const isAutonomy = policy.id === "policy_autonomy_impact";
          const isFinancial = policy.id === "policy_financial_cap";
          const isPrivacy = policy.id === "policy_privacy_barrier";
          const isEthical = policy.id === "policy_ethical_bias";

          return (
            <div 
              key={policy.id} 
              className={`p-4 rounded-none border transition-all duration-300 ${
                policy.enabled 
                  ? 'bg-[#0a0a0a] border-[#222] hover:border-[#333]' 
                  : 'bg-black border-[#111] opacity-40'
              }`}
            >
              {/* Header: Title & Switch */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-black border border-[#222]">
                    {getPolicyIcon(policy.id)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-wider">{policy.name}</h4>
                    <span className="text-[9px] font-mono text-[#666] uppercase tracking-wider block mt-0.5">{policy.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => onTogglePolicy(policy.id)}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={policy.enabled ? "Disable Policy" : "Enable Policy"}
                  id={`btn-toggle-${policy.id}`}
                >
                  {policy.enabled ? (
                    <ToggleRight className="w-7 h-7 text-[#34C759]" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-[#444]" />
                  )}
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed font-sans">
                {policy.description}
              </p>

              {/* Editable Threshold controls */}
              {policy.enabled && (
                <div className="mt-3.5 pt-3.5 border-t border-[#222] grid grid-cols-1 gap-2 bg-black p-3.5 border">
                  <span className="text-[9px] font-sans font-bold text-[#666] uppercase tracking-wider">Compiled Expression:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Autonomy/Impact specific controls */}
                    {isAutonomy && (
                      <>
                        <div className="flex items-center gap-1.5 bg-[#050505] px-2 py-1 border border-[#222]">
                          <span className="text-[10px] font-mono text-zinc-400 font-bold">Autonomy &gt;</span>
                          <input 
                            type="number" 
                            className="w-10 bg-black font-mono text-center text-xs text-[#34C759] border-none outline-none font-bold"
                            value={parseThreshold(policy.rawConditionText, "autonomy")}
                            onChange={(e) => onUpdateThreshold(policy.id, "autonomy", parseInt(e.target.value) || 0)}
                            min="0" max="100"
                            id="input-param-autonomy"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#050505] px-2 py-1 border border-[#222]">
                          <span className="text-[10px] font-mono text-zinc-400 font-bold">Impact &gt;</span>
                          <input 
                            type="number" 
                            className="w-10 bg-black font-mono text-center text-xs text-[#34C759] border-none outline-none font-bold"
                            value={parseThreshold(policy.rawConditionText, "impact")}
                            onChange={(e) => onUpdateThreshold(policy.id, "impact", parseInt(e.target.value) || 0)}
                            min="0" max="100"
                            id="input-param-impact"
                          />
                        </div>
                      </>
                    )}

                    {/* Financial specific controls */}
                    {isFinancial && (
                      <div className="flex items-center gap-1.5 bg-[#050505] px-2 py-1 border border-[#222]">
                        <span className="text-[10px] font-mono text-zinc-400 font-bold">Financial Risk &gt;</span>
                        <input 
                          type="number" 
                          className="w-10 bg-black font-mono text-center text-xs text-[#34C759] border-none outline-none font-bold"
                          value={parseThreshold(policy.rawConditionText, "financial_risk")}
                          onChange={(e) => onUpdateThreshold(policy.id, "financial", parseInt(e.target.value) || 0)}
                          min="0" max="100"
                          id="input-param-financial"
                        />
                      </div>
                    )}

                    {/* Privacy specific controls */}
                    {isPrivacy && (
                      <div className="flex items-center gap-1.5 bg-[#050505] px-2 py-1 border border-[#222]">
                        <span className="text-[10px] font-mono text-zinc-400 font-bold">Privacy Limit &gt;</span>
                        <input 
                          type="number" 
                          className="w-10 bg-black font-mono text-center text-xs text-[#34C759] border-none outline-none font-bold"
                          value={parseThreshold(policy.rawConditionText, "privacy_risk")}
                          onChange={(e) => onUpdateThreshold(policy.id, "privacy", parseInt(e.target.value) || 0)}
                          min="0" max="100"
                          id="input-param-privacy"
                        />
                      </div>
                    )}

                    {/* Ethical specific controls */}
                    {isEthical && (
                      <div className="flex items-center gap-1.5 bg-[#050505] px-2 py-1 border border-[#222]">
                        <span className="text-[10px] font-mono text-zinc-400 font-bold">Ethical Risk &gt;</span>
                        <input 
                          type="number" 
                          className="w-10 bg-black font-mono text-center text-xs text-[#34C759] border-none outline-none font-bold"
                          value={parseThreshold(policy.rawConditionText, "ethical_risk")}
                          onChange={(e) => onUpdateThreshold(policy.id, "ethical", parseInt(e.target.value) || 0)}
                          min="0" max="100"
                          id="input-param-ethical"
                        />
                      </div>
                    )}

                    <div className="text-[10px] bg-[#FF3B30]/10 border border-[#FF3B30]/30 px-2.5 py-1 text-[#FF3B30] font-mono uppercase font-black tracking-widest rounded-none">
                      {isPrivacy ? 'REJECT' : 'WAIT_HUMAN'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-[#222] text-[10px] font-sans flex items-start gap-2 text-zinc-500 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-[#34C759] shrink-0 mt-0.5" />
        <span>Customize trigger thresholds. Active bounds intercept execution streams to run safety simulations.</span>
      </div>
    </div>
  );
};
