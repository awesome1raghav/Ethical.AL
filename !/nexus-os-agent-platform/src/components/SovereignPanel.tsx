import React, { useState, useEffect } from 'react';
import { Shield, ToggleLeft, ToggleRight, Plus, CheckCircle, AlertTriangle, Coins, Lock } from 'lucide-react';
import { Policy } from '../types';

interface SovereignPanelProps {
  onPoliciesUpdated?: () => void;
}

export default function SovereignPanel({ onPoliciesUpdated }: SovereignPanelProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Data Privacy' | 'Spending' | 'Escalation' | 'Robustness'>('Data Privacy');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPolicies = () => {
    fetch('/api/policies')
      .then(res => res.json())
      .then(data => {
        setPolicies(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/policies/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !currentStatus }),
      });
      if (response.ok) {
        setPolicies(prev => prev.map(p => p.id === id ? { ...p, enabled: !currentStatus } : p));
        if (onPoliciesUpdated) onPoliciesUpdated();
      }
    } catch (e) {
      console.error('Failed to toggle policy:', e);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content || !description) return;
    setSaving(true);
    try {
      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, category, content }),
      });
      if (response.ok) {
        const created = await response.json();
        setPolicies(prev => [...prev, created]);
        setShowAddForm(false);
        setName('');
        setDescription('');
        setContent('');
        if (onPoliciesUpdated) onPoliciesUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const categoryIcons = {
    'Data Privacy': <Shield className="w-3.5 h-3.5 text-[#141414]" />,
    'Spending': <Coins className="w-3.5 h-3.5 text-[#141414]" />,
    'Escalation': <Lock className="w-3.5 h-3.5 text-[#141414]" />,
    'Robustness': <AlertTriangle className="w-3.5 h-3.5 text-[#141414]" />,
  };

  return (
    <div id="sovereign-policy-control-panel" className="bg-[#E4E3E0] border-2 border-[#141414] rounded-none p-5 text-[#141414] shadow-none">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#141414]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#141414] text-[#E4E3E0] flex items-center justify-center">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-tight">Sovereign Governance Engine</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-[#141414] text-[#E4E3E0] text-[11px] font-mono px-3 py-1.5 rounded-none font-bold uppercase hover:opacity-90 active:translate-y-px transition-all cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>New Guardrail</span>
        </button>
      </div>

      <p className="font-serif-italic text-xs opacity-60 mb-5 leading-normal">
        Sovereign interceptors validate incoming tasks and final agent outputs against declarative policy files. Active policies act as continuous safety boundaries.
      </p>

      {showAddForm && (
        <form onSubmit={handleCreatePolicy} className="bg-black/5 border border-[#141414] p-4 rounded-none mb-5 space-y-4">
          <h3 className="text-xs uppercase font-bold text-[#141414] border-b border-[#141414]/20 pb-1.5">Compile New Policy Rule</h3>
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#141414] opacity-75 mb-1 font-mono">Policy Title / Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Reject Medical Prescriptions"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] rounded-none p-2 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#141414] opacity-75 mb-1 font-mono">Target Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] rounded-none p-2 text-xs"
            >
              <option value="Data Privacy">Data Privacy</option>
              <option value="Spending">Spending</option>
              <option value="Escalation">Escalation</option>
              <option value="Robustness">Robustness</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#141414] opacity-75 mb-1 font-mono">Public Description</label>
            <input
              type="text"
              required
              placeholder="Blocks dangerous unauthorized diagnostics..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] rounded-none p-2 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#141414] opacity-75 mb-1 font-mono">Interception Clause (Rego Syntax Equivalent)</label>
            <textarea
              required
              rows={3}
              placeholder="DENY IF matches_regex('diagnose') OR has_drug == TRUE"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] rounded-none p-2 font-mono text-xs focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[#141414] text-[11px] font-bold uppercase py-1 px-3 hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#141414] text-[#E4E3E0] text-[11px] font-bold uppercase px-4 py-1.5 rounded-none cursor-pointer"
            >
              {saving ? 'Compiling...' : 'Activate Policy'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-6 text-xs font-mono text-[#141414]/50 animate-pulse">
          Retrieving Sovereign rules...
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {policies.map(policy => (
            <div
              key={policy.id}
              className={`p-3 border transition-all rounded-none ${
                policy.enabled
                  ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]'
                  : 'bg-[#E4E3E0]/70 border-[#141414] text-[#141414]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={policy.enabled ? "opacity-90" : "opacity-60"}>
                      {policy.enabled ? (
                        <span className="text-[#E4E3E0]">{categoryIcons[policy.category]}</span>
                      ) : (
                        <span className="text-[#141414]">{categoryIcons[policy.category]}</span>
                      )}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-bold font-mono">
                      {policy.category}
                    </span>
                  </div>
                  <h4 className={`text-xs font-bold uppercase tracking-tight ${policy.enabled ? 'text-[#E4E3E0]' : 'text-[#141414]'}`}>
                    {policy.name}
                  </h4>
                  <p className={`text-[11px] mt-1 leading-normal ${policy.enabled ? 'text-[#E4E3E0]/80' : 'text-[#141414]/80'}`}>
                    {policy.description}
                  </p>
                  <div className={`mt-2 py-1 px-2 border font-mono text-[9px] ${
                    policy.enabled
                      ? 'bg-black/30 border-white/10 text-green-300'
                      : 'bg-black/5 border-black/10 text-green-800'
                  }`}>
                    {policy.content}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(policy.id, policy.enabled)}
                  className="p-1 focus:outline-none transition-transform active:scale-95 shrink-0 cursor-pointer"
                >
                  {policy.enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[#141414]/55" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
