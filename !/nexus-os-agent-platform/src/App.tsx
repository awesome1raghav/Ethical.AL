import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Trash2,
  Sparkles,
  Terminal,
  Shield,
  ShieldAlert,
  Network,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  RefreshCw,
  PlusCircle,
  Layers,
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Mission } from './types';
import DatabaseStatusBadge from './components/DatabaseStatusBadge';
import SovereignPanel from './components/SovereignPanel';
import CitadelPanel from './components/CitadelPanel';
import MemoryGraphPanel from './components/MemoryGraphPanel';

export default function App() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [loadingMissions, setLoadingMissions] = useState(true);

  // New Mission Inputs
  const [title, setTitle] = useState('');
  const [inputGoal, setInputGoal] = useState('');
  const [planningMode, setPlanningMode] = useState(false);

  // Active Panel Tap selector in Right Hand section
  const [rightPanelTab, setRightPanelTab] = useState<'sovereign' | 'citadel' | 'memory'>('sovereign');

  // Load physical state systems
  const fetchMissions = useCallback(() => {
    fetch('/api/missions')
      .then(res => res.json())
      .then(data => {
        setMissions(data);
        setLoadingMissions(false);
        // Sync selected mission status if active
        if (selectedMission) {
          const updated = data.find((m: Mission) => m.id === selectedMission.id);
          if (updated) setSelectedMission(updated);
        }
      })
      .catch(err => console.error(err));
  }, [selectedMission]);

  useEffect(() => {
    fetchMissions();
  }, []);

  // Poller trigger when a mission is running in background
  useEffect(() => {
    const activeMissionRunning = missions.some(m => m.status === 'running');
    if (activeMissionRunning) {
      const interval = setInterval(() => {
        fetchMissions();
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [missions, fetchMissions]);

  // Submit Mission Orchestration Planner Step
  const handlePlanMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !inputGoal) return;
    setPlanningMode(true);
    try {
      const response = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, input: inputGoal }),
      });
      if (response.ok) {
        const plannedMission = await response.json();
        setTitle('');
        setInputGoal('');
        fetchMissions();
        setSelectedMission(plannedMission);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPlanningMode(false);
    }
  };

  // Launch Active Worker Container Fleets
  const handleExecuteMission = async (id: string) => {
    try {
      const response = await fetch('/api/missions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId: id }),
      });
      if (response.ok) {
        fetchMissions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Mission and all logs
  const handleDeleteMission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this agent mission log?')) return;
    try {
      const response = await fetch(`/api/missions/${id}`, { method: 'DELETE' });
      if (response.ok) {
        if (selectedMission?.id === id) {
          setSelectedMission(null);
        }
        fetchMissions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick select presets to fill inputs fast
  const loadPreset = (presetTitle: string, presetGoal: string) => {
    setTitle(presetTitle);
    setInputGoal(presetGoal);
  };

  return (
    <div id="nexus-os-dashboard-app" className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans antialiased selection:bg-[#141414] selection:text-[#E4E3E0] pb-12">
      
      {/* HEADER BAR */}
      <header id="nexus-header" className="h-16 border-b border-[#141414] bg-[#E4E3E0] sticky top-0 z-50 flex items-center shrink-0">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-[#141414] flex items-center justify-center">
              <div className="w-4 h-4 border border-white rotate-45"></div>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tighter uppercase text-[#141414] flex items-center gap-2">
                Cluster_Admin <span className="font-normal opacity-50">/ node_nexus_01</span>
              </h1>
              <p className="text-[10px] text-[#141414]/70 font-mono tracking-tight leading-none uppercase">Autonomous Multi-Agent Scheduler</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={fetchMissions}
              className="p-1 px-3 bg-[#141414] text-[#E4E3E0] border border-[#141414] text-xs font-bold font-mono tracking-wider hover:opacity-90 transition-all uppercase cursor-pointer"
              title="Refresh telemetry"
            >
              Refresh OS
            </button>
            <div className="text-right hidden md:block">
              <p className="text-[9px] uppercase opacity-55 font-bold leading-none mb-0.5">Uptime Timeline</p>
              <p className="font-mono text-xs text-[#141414] leading-none font-bold">142:12:44:09</p>
            </div>
            <div className="bg-[#141414] text-[#E4E3E0] px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase">
              STATUS: OPERATIONAL
            </div>
          </div>
        </div>
      </header>

      {/* SYSTEM META METRIC BAR (Scalability badge configuration) */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-6">
        <DatabaseStatusBadge />
      </section>

      {/* MAIN TWO-COLUMN DASHBOARD */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: MISSION CREATOR & RUNTIME FLEET (Lg: 7/12) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Launch Mission Controller Card */}
          <div className="bg-[#E4E3E0] border-2 border-[#141414] rounded-none p-5 shadow-none text-[#141414]">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#141414]/20">
              <PlusCircle className="w-4 h-4 text-[#141414]" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Initialize Collaborative Mission Plan</h2>
            </div>
            
            <form onSubmit={handlePlanMission} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#141414] opacity-75 mb-1 font-mono">Mission Name / Objective</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conduct Multi-Vector Microservice Vulnerability Scan"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] rounded-none p-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#141414] opacity-75 mb-1 font-mono">Agent Command Specification (Input Objective)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Assign mission details here: e.g. Evaluate if Port 3000 has open directory paths, synthesize threat mitigation protocols."
                  value={inputGoal}
                  onChange={e => setInputGoal(e.target.value)}
                  className="w-full bg-[#E4E3E0] border border-[#141414] text-[#141414] rounded-none p-2.5 text-sm focus:outline-none"
                />
              </div>

              {/* Fast Preset Prompts */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#141414] block mb-1.5 font-mono">Or deploy a preset mission scenario:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => loadPreset('EU AI compliance check', 'Verify microservice execution logs against Sovereign EU AI Act criteria.')}
                    className="bg-[#141414]/5 hover:bg-[#141414]/15 border border-[#141414] text-[#141414] rounded-none px-2.5 py-1 text-xs transition-all font-semibold font-mono cursor-pointer"
                  >
                    EU AI Act Audit
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('Sandbox Container Pentest', 'Inject mock root override request into AnalystAgent to verify isolation boundaries.')}
                    className="bg-[#141414]/5 hover:bg-[#141414]/15 border border-[#141414] text-[#141414] rounded-none px-2.5 py-1 text-xs transition-all font-semibold font-mono cursor-pointer"
                  >
                    Vulnerability Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('Anti-PII Leak Validation', 'Draft dummy credit report containing user card tokens to test Citadel blocker filter.')}
                    className="bg-[#141414]/5 hover:bg-[#141414]/15 border border-[#141414] text-[#141414] rounded-none px-2.5 py-1 text-xs transition-all font-semibold font-mono cursor-pointer"
                  >
                    PII Exfiltration Scan
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={planningMode || !title || !inputGoal}
                  className="bg-[#141414] hover:bg-black text-[#E4E3E0] px-5 py-2.5 rounded-none text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all border border-[#141414] disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-green-400 animate-pulse" />
                  <span>{planningMode ? 'Decomposing Goal with Gemini...' : 'Decompose Target with Gemini'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. Command Fleet: Missions List & Execution Visualizer */}
          <div className="bg-[#E4E3E0] border-2 border-[#141414] rounded-none p-5 text-[#141414]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#141414] mb-4 flex items-center gap-2 pb-2 border-b border-[#141414]/20">
              <Terminal className="w-4 h-4 text-[#141414]" />
              <span>Mission Run History & Telemetry</span>
            </h2>

            {loadingMissions ? (
              <div className="text-center py-12 text-[#141414]/60 font-mono text-xs animate-pulse">Running system checks...</div>
            ) : missions.length === 0 ? (
              <div className="border border-dashed border-[#141414] rounded-none py-12 px-4 text-center">
                <Activity className="w-10 h-10 text-[#141414] mx-auto mb-3 opacity-60" />
                <p className="text-sm font-semibold text-[#141414] uppercase font-mono">No planned missions in local namespaces.</p>
                <p className="font-serif-italic text-xs opacity-60 mt-1">Use the planner above to decompose goals using server Gemini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {missions.map(mission => (
                  <div
                    key={mission.id}
                    onClick={() => setSelectedMission(mission)}
                    className={`border p-4 transition-all rounded-none cursor-pointer ${
                      selectedMission?.id === mission.id
                        ? 'bg-black/5 border-2 border-[#141414]'
                        : 'bg-[#E4E3E0]/60 border border-[#141414] hover:bg-black/5'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold uppercase text-[#141414] tracking-tight">{mission.title}</h3>
                          <span className={`text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-none ${
                            mission.status === 'completed'
                              ? 'bg-green-700 text-white'
                              : mission.status === 'blocked'
                              ? 'bg-red-800 text-white'
                              : mission.status === 'running'
                              ? 'bg-amber-600 text-white animate-pulse'
                              : 'bg-zinc-800 text-[#E4E3E0]'
                          }`}>
                            {mission.status}
                          </span>
                        </div>
                        <p className="font-serif-italic text-xs opacity-70 mt-1 leading-relaxed line-clamp-1">
                          Objective: "{mission.input}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-stretch sm:self-center justify-end">
                        {mission.status === 'planning' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecuteMission(mission.id);
                            }}
                            className="bg-[#141414] hover:bg-black text-[#E4E3E0] py-1 px-3 rounded-none text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-all border border-[#141414] cursor-pointer"
                          >
                            <Play className="w-3 h-3 text-green-400" />
                            <span>Run Fleet</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteMission(mission.id, e)}
                          className="p-1 text-[#141414]/70 hover:text-red-700 hover:bg-black/10 rounded-none transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Step Hand-off Track Progress Visualizer */}
                    <div className="mt-3 py-2 border-t border-[#141414]/15 flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold font-mono tracking-wider text-[#141414]/70">Stages:</span>
                        <div className="flex items-center gap-1">
                          {mission.steps.map((step, index) => {
                            let dotStyle = 'bg-neutral-300 border border-[#141414]/40';
                            if (mission.status === 'running' && index === mission.currentStepIndex) {
                              dotStyle = 'bg-amber-500 animate-pulse border border-[#141414]';
                            } else if (step.status === 'completed') {
                              dotStyle = 'bg-green-700 border border-[#141414]/20';
                            } else if (step.status === 'blocked') {
                              dotStyle = 'bg-red-700';
                            } else if (step.status === 'failed') {
                              dotStyle = 'bg-rose-700';
                            }
                            return (
                              <div key={step.id} className="relative flex items-center justify-center p-0.5" title={`${step.agentName}: ${step.stepName}`}>
                                <span className={`inline-block w-2 h-2 rounded-none ${dotStyle}`} />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="font-mono text-[9px] text-[#141414]/70 flex items-center gap-2 font-bold uppercase">
                        <span className="text-green-800">{mission.costTokens.toLocaleString()} tokens used</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#141414]" />
                          <span>{new Date(mission.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Deep Session Analysis Details Panel (Visible on Mission Selection) */}
          {selectedMission && (
            <div id="nexus-session-details-tracer" className="bg-[#141414] border-2 border-[#141414] rounded-none p-5 text-[#E4E3E0] relative shadow-none">
              <div className="flex items-center justify-between border-b border-[#E4E3E0]/20 pb-3 mb-4">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2 tracking-widest">
                    <Terminal className="w-4 h-4 text-green-400" />
                    <span>Debugger Session Audit: {selectedMission.title}</span>
                  </h3>
                  <p className="text-[10px] text-[#E4E3E0]/60 mt-0.5 font-mono">NAMESPACE_ID: {selectedMission.id}</p>
                </div>
                <span className="text-[10px] bg-white/10 border border-white/20 py-1 px-2.5 rounded-none text-green-300 font-mono font-bold">
                  {selectedMission.status.toUpperCase()}
                </span>
              </div>

              {/* Sequential Steps Details */}
              <div className="space-y-4">
                {selectedMission.steps.map((step, idx) => (
                  <div key={step.id} className="bg-black/30 border border-white/10 rounded-none p-4">
                    <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-[#141414] border border-white/30 text-green-400 px-2 py-0.5 rounded-none font-mono uppercase font-bold">
                            STAGE {idx + 1}: {step.agentName}
                          </span>
                          <span className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-none font-bold ${
                            step.status === 'completed'
                              ? 'text-green-400 bg-green-950/50'
                              : step.status === 'running'
                              ? 'text-amber-400 bg-amber-950/50 animate-pulse'
                              : step.status === 'blocked'
                              ? 'text-red-400 bg-red-950/50'
                              : 'text-zinc-400'
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        <h4 className="text-xs uppercase font-bold text-white mt-1.5">{step.stepName}</h4>
                      </div>

                      {/* Step Security Scanner Banner color code */}
                      <span className={`text-[9px] font-mono border px-2 py-0.5 rounded-none font-bold ${
                        step.securityStatus === 'safe'
                          ? 'bg-green-950/50 text-green-400 border-green-900'
                          : step.securityStatus === 'alert'
                          ? 'bg-yellow-950/50 text-yellow-400 border-yellow-900'
                          : 'bg-red-950/50 text-red-400 border-red-905'
                      }`}>
                        SEC: {step.securityStatus.toUpperCase()}
                      </span>
                    </div>

                    {/* Step Output Box */}
                    {step.output ? (
                      <div className="bg-black/60 rounded-none p-3 text-xs leading-normal text-[#E4E3E0] border border-white/10 mb-3 font-mono">
                        <div className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-green-400 border-b border-white/5 pb-1 mb-1.5">
                          <FileText className="w-3 h-3" />
                          <span>Generated Work Artifact</span>
                        </div>
                        <p className="whitespace-pre-wrap">{step.output}</p>
                      </div>
                    ) : (
                      <p className="text-xs font-serif-italic opacity-60 mb-2">Stage pending deployment...</p>
                    )}

                    {/* Sovereign Rules Check Outcome List */}
                    {step.policiesChecked.length > 0 && (
                      <div className="mt-3 bg-black/40 border border-white/10 rounded-none p-2.5 space-y-2">
                        <div className="text-[9px] uppercase font-bold tracking-widest text-[#E4E3E0]/70 flex items-center gap-1 mb-1.5 font-mono">
                          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                          <span>Sovereign Guardrail Audit Policy Results</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {step.policiesChecked.map((check, cIdx) => (
                            <div key={cIdx} className="flex items-start justify-between text-xs bg-[#141414] p-2 rounded-none border border-white/10">
                              <div className="flex-1">
                                <span className="font-bold text-white text-[10px] block uppercase font-mono">{check.policyName}</span>
                                <span className="text-[10px] text-[#E4E3E0]/80 font-serif-italic mt-0.5 block">{check.reason}</span>
                              </div>
                              <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-none ml-2 ${
                                check.passed
                                  ? 'bg-green-950 text-green-400'
                                  : 'bg-red-950 text-red-400'
                              }`}>
                                {check.passed ? 'PASSED' : 'VETOED'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Micro telemetry logs */}
                    {step.logs.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[9px] uppercase font-bold font-mono tracking-wider opacity-60 mb-1">Telemetry micro-logs:</div>
                        <div className="bg-black p-2 rounded-none border border-white/5 font-mono text-[9.5px] leading-relaxed text-green-400/90 space-y-0.5 max-h-[120px] overflow-y-auto">
                          {step.logs.map((log, lIdx) => (
                            <div key={lIdx} className="flex gap-1">
                              <span className="opacity-40">&gt;</span>
                              <span className="break-all">{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: CORE APP SUBSYSTEM TABBED SWITCHER (Lg: 5/12) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Subsystem tab switches */}
          <div className="bg-[#E4E3E0] border-2 border-[#141414] rounded-none p-1 flex items-center justify-between gap-0 shadow-none">
            <button
              onClick={() => setRightPanelTab('sovereign')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase py-2 px-1 rounded-none transition-all cursor-pointer ${
                rightPanelTab === 'sovereign'
                  ? 'bg-[#141414] text-[#E4E3E0] border-r border-[#141414]'
                  : 'text-[#141414] hover:bg-black/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Sovereign</span>
            </button>
            <button
              onClick={() => setRightPanelTab('citadel')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase py-2 px-1 rounded-none transition-all cursor-pointer ${
                rightPanelTab === 'citadel'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'text-[#141414] hover:bg-black/5'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Citadel Shield</span>
            </button>
            <button
              onClick={() => setRightPanelTab('memory')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase py-2 px-1 rounded-none transition-all cursor-pointer ${
                rightPanelTab === 'memory'
                  ? 'bg-[#141414] text-[#E4E3E0] border-l border-[#141414]'
                  : 'text-[#141414] hover:bg-black/5'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Memory Graph</span>
            </button>
          </div>

          {/* ACTIVE REGISTRY GRAPH CONTAINER PANEL */}
          <div className="transition-all duration-300">
            {rightPanelTab === 'sovereign' && (
              <SovereignPanel onPoliciesUpdated={fetchMissions} />
            )}
            {rightPanelTab === 'citadel' && (
              <CitadelPanel onAttackSimulated={fetchMissions} />
            )}
            {rightPanelTab === 'memory' && (
              <MemoryGraphPanel />
            )}
          </div>

          {/* Enterprise Operating System Info Box */}
          <div className="bg-black/5 border-2 border-[#141414] rounded-none p-5 font-mono text-xs text-[#141414] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414]/20 pb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#141414]" />
              <span>NEXUS TERMINAL PRINCIPLES</span>
            </h3>
            <p className="leading-relaxed text-xs">
              Nexus OS implements a zero-trust capability model. Sovereign interceptors run checks on every CPU/token execution hook. Citadel enforces process sandbox isolation to protect hosts from arbitrary tool and prompt escalation.
            </p>
            <div className="grid grid-cols-2 gap-3 text-[10px] pt-1">
              <div className="bg-[#141414] hover:bg-black p-3 rounded-none border border-[#141414] text-[#E4E3E0] transition-colors cursor-default">
                <div className="font-bold tracking-wider">01 / SOVEREIGN</div>
                <div className="mt-1 text-[9px] opacity-75">Policy-as-code evaluation interceptors</div>
              </div>
              <div className="bg-[#141414] hover:bg-black p-3 rounded-none border border-[#141414] text-[#E4E3E0] transition-colors cursor-default">
                <div className="font-bold tracking-wider">02 / CITADEL</div>
                <div className="mt-1 text-[9px] opacity-75">Sandboxed microVM container isolation</div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
