import React, { useState, useEffect } from 'react';
import { Network, Search, Plus, Key, Tag, HelpCircle } from 'lucide-react';
import { MemoryNode } from '../types';

export default function MemoryGraphPanel() {
  const [memories, setMemories] = useState<MemoryNode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [agentName, setAgentName] = useState('ResearchAgent');
  const [type, setType] = useState<'semantic' | 'short-term' | 'knowledge'>('knowledge');
  const [relation, setRelation] = useState('knows_topic');
  const [content, setContent] = useState('');
  const [keyEntities, setKeyEntities] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMemories = (query = '') => {
    setLoading(true);
    fetch(`/api/memories?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        setMemories(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemories(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchMemories('');
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setSaving(true);
    try {
      const entitiesArr = keyEntities
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);

      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName,
          type,
          relation,
          content,
          keyEntities: entitiesArr,
        }),
      });

      if (response.ok) {
        setShowAddForm(false);
        setContent('');
        setKeyEntities('');
        fetchMemories(searchQuery);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const typeStyles = {
    knowledge: 'text-slate-800 bg-slate-300/60 border-[#141414]',
    semantic: 'text-stone-800 bg-stone-300/60 border-[#141414]',
    'short-term': 'text-[#141414] bg-neutral-300 border-[#141414]',
  };

  return (
    <div id="memory-knowledge-graph-panel" className="bg-[#E4E3E0] border-2 border-[#141414] rounded-none p-5 text-[#141414] shadow-none">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#141414]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#141414] text-[#E4E3E0] flex items-center justify-center">
            <Network className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-tight">Memory Engine & Knowledge Graph</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-[#141414] text-[#E4E3E0] text-[11px] font-mono px-3 py-1.5 rounded-none font-bold uppercase hover:opacity-90 active:translate-y-px transition-all cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Insert Context Node</span>
        </button>
      </div>

      <p className="font-serif-italic text-xs opacity-60 mb-5 leading-normal">
        The Memory Engine maintains relationships across agent runtimes. Triples persist facts, session histories, and metadata schemas directly inside MongoDB.
      </p>

      {/* Insert Node Form */}
      {showAddForm && (
        <form onSubmit={handleCreateMemory} className="bg-black/5 border border-[#141414] p-4 rounded-none mb-5 space-y-4">
          <h3 className="text-xs uppercase font-bold text-[#141414] border-b border-[#141414]/20 pb-1.5">Inject Fact Template</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] uppercase font-bold text-[#141414] opacity-75 mb-1 font-mono">Subject Agent</label>
              <select
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] rounded-none p-2 text-xs focus:outline-none"
              >
                <option value="ProjectManager">ProjectManager</option>
                <option value="ResearchAgent">ResearchAgent</option>
                <option value="AnalystAgent">AnalystAgent</option>
                <option value="WriterAgent">WriterAgent</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase font-bold text-[#141414] opacity-75 mb-1 font-mono">Predicate / Relation</label>
              <input
                type="text"
                required
                placeholder="e.g. executed_query"
                value={relation}
                onChange={e => setRelation(e.target.value)}
                className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] rounded-none p-2 text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] uppercase font-bold text-[#141414] opacity-75 mb-1 font-mono">Memory Mode</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] rounded-none p-2 text-xs focus:outline-none"
              >
                <option value="knowledge">knowledge (Facts & Data)</option>
                <option value="semantic">semantic (embeddings & vectors)</option>
                <option value="short-term">short-term (recent steps)</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase font-bold text-[#141414] opacity-75 mb-1 font-mono">Key Entities (Comma separated)</label>
              <input
                type="text"
                placeholder="API, Sandbox, Port 3000"
                value={keyEntities}
                onChange={e => setKeyEntities(e.target.value)}
                className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] rounded-none p-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase font-bold text-[#141414] opacity-75 mb-1 font-mono">Fact Content / Narrative Memory</label>
            <textarea
              required
              rows={2}
              placeholder="System successfully verified sandboxed gVisor limits."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] rounded-none p-2 text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[#141414] text-xs font-bold uppercase py-1 px-3 hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#141414] text-[#E4E3E0] text-[11px] font-bold uppercase px-4 py-1.5 rounded-none cursor-pointer"
            >
              {saving ? 'Injecting Fact...' : 'Inject Node'}
            </button>
          </div>
        </form>
      )}

      {/* Query Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search Semantic context maps (e.g. 'sandbox')..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] text-xs rounded-none pl-8 pr-4 py-2 focus:outline-none focus:ring-0"
          />
          <Search className="w-4 h-4 text-[#141414]/60 absolute left-2.5 top-2.5" />
        </div>
        <button
          type="submit"
          className="bg-[#141414] border border-[#141414] text-[#E4E3E0] text-xs font-mono font-bold uppercase px-4 py-2 rounded-none transition-all cursor-pointer hover:bg-[#141414]/90"
        >
          Query
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-xs text-[#141414] px-1 font-bold hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </form>

      {/* Bento Grid layout representing memory database items */}
      {loading ? (
        <div className="text-center py-8 text-xs font-mono text-[#141414]/50 animate-pulse">
          Querying MongoDB semantic index...
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-8 text-xs opacity-70 border border-dashed border-[#141414] rounded-none">
          No matching memory triples located in searchable vector namespaces.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
          {memories.map(node => (
            <div key={node.id} className="bg-black/5 border border-[#141414] rounded-none p-3 flex flex-col justify-between hover:bg-black/10 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] uppercase font-bold bg-[#141414] text-[#E4E3E0] px-2 py-0.5 rounded-none border border-[#141414]">
                    {node.agentName}
                  </span>
                  <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-none border-t border-b ${typeStyles[node.type]}`}>
                    {node.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#141414]/70 font-mono mb-1.5 uppercase">
                  <Key className="w-3 h-3 text-[#141414]" />
                  <span>REL: {node.relation}</span>
                </div>
                <p className="text-xs text-[#141414] leading-normal font-sans">
                  {node.content}
                </p>
              </div>

              {node.keyEntities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-[#141414]/20">
                  {node.keyEntities.map((ent, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-[#141414] text-[#E4E3E0] text-[9px] px-1.5 py-0.5 rounded-none font-bold font-mono">
                      <Tag className="w-2.5 h-2.5 text-green-400" />
                      {ent}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
