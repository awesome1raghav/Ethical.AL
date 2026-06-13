import React, { useState, useEffect, useRef } from 'react';
import {
  Mission,
  MissionState,
  DecisionType,
  RiskLevel,
  RiskScores,
  ClassificationReport,
  PolicyRule,
  AuditLog,
  AgentEvent
} from '../types';
import { runLocalClassification, initializeLocalModel } from '../utils/localClassifier';
import { INITIAL_POLICIES, evaluatePolicies, generateFauxHash } from '../utils/policyEngine';
import { RiskRadar } from './RiskRadar';
import { PolicyConfigurator } from './PolicyConfigurator';
import { AuditLedger } from './AuditLedger';
import { HumanReviewPortal } from './HumanReviewPortal';
import { AgentSwarmControl } from './AgentSwarmControl';
import {
  Shield,
  Cpu,
  Database,
  Terminal,
  Activity,
  UserCheck,
  AlertOctagon,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

export const SovereignDashboard: React.FC = () => {
  // App contexts states
  const [prompt, setPrompt] = useState<string>("Summarize annual feedback for Product Team to identify high performers.");
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [policies, setPolicies] = useState<PolicyRule[]>(INITIAL_POLICIES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [modelStatusText, setModelStatusText] = useState<string>("Initializing local environment...");
  const [usingTransformerModel, setUsingTransformerModel] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>("17:01:39 UTC");

  // Telemetry stream
  const [telemetryFeed, setTelemetryFeed] = useState<string[]>([]);
  const terminalLogsEndRef = useRef<HTMLDivElement>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize clock and local AI Model
  useEffect(() => {
    // Current time ticking
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { timeZone: "UTC", hour12: false }) + " UTC");
    }, 1000);

    // Initialize local classification neural net weights (Transformers.js)
    initializeLocalModel((status) => {
      setModelStatusText(status);
      if (status.includes("Transformers.js active") || status.includes("Local model active")) {
        setUsingTransformerModel(true);
      }
    }).then((success) => {
      setModelLoading(false);
      // Append initial setup to Audit log
      appendAuditLog(
        "MISSION_CREATED" as any,
        `SOVEREIGN Kernel online. Governance engine initialized successfully. Model mode: ${success ? 'Transformers.JS Neural Net (Local)' : 'Local Heuristic Regex Engine Fallback'}`
      );
    });

    return () => clearInterval(timer);
  }, []);

  // Scroll to bottom of terminal when logs are added
  useEffect(() => {
    terminalLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [telemetryFeed]);

  // Create immutable audit ledger item linked with simulated hash
  const appendAuditLog = (
    type: AuditLog["event_type"],
    message: string,
    details?: string,
    riskScore?: number
  ) => {
    setAuditLogs((prev) => {
      const lastLog = prev[prev.length - 1];
      const previousHash = lastLog ? lastLog.hash : "SV_GENESIS_BLOCK_0000";
      const timestampString = new Date().toISOString();
      const calculatedHash = generateFauxHash(previousHash, timestampString + message + type);

      const newLog: AuditLog = {
        id: "log_" + Math.random().toString(36).substr(2, 9),
        timestamp: timestampString,
        mission_id: activeMission?.id || "NEX_SOV_SYS",
        event_type: type,
        message,
        details,
        riskScore,
        hash: calculatedHash
      };
      return [...prev, newLog];
    });
  };

  // Toggle policies from compliance panel
  const handleTogglePolicy = (id: string) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const nextState = !p.enabled;
        appendAuditLog(
          "INTERVENTION_INJECTED" as any,
          `Configured policy ${p.name} updated: [${nextState ? 'ENABLED' : 'DISABLED'}]. Live enforcement re-compiled.`,
          `Policy unique ID: ${p.id}\nExpression: ${p.rawConditionText}`
        );
        return { ...p, enabled: nextState };
      }
      return p;
    }));
  };

  // Update policy threshold parameters dynamically
  const handleUpdateThreshold = (
    id: string,
    field: "autonomy" | "impact" | "financial" | "privacy" | "ethical",
    newValue: number
  ) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === id) {
        let updatedCondition = p.condition;
        let updatedExpressionText = p.rawConditionText;

        // Re-compile logic with custom values
        if (id === "policy_autonomy_impact") {
          const currentAutonomy = field === "autonomy" ? newValue : parseThresholdText(p.rawConditionText, "autonomy");
          const currentImpact = field === "impact" ? newValue : parseThresholdText(p.rawConditionText, "impact");
          updatedExpressionText = `IF autonomy > ${currentAutonomy} AND impact > ${currentImpact} -> pause & escalate`;
          updatedCondition = (scores: RiskScores) => {
            if (scores.autonomy > currentAutonomy && scores.impact > currentImpact) {
              return {
                triggered: true,
                action: "pause",
                reason: `Autonomy demand (${scores.autonomy}) > ${currentAutonomy} paired with impact potential (${scores.impact}) > ${currentImpact} triggers oversight override.`
              };
            }
            return { triggered: false, action: "none", reason: "" };
          };
        } else if (id === "policy_financial_cap") {
          updatedExpressionText = `IF financial_risk > ${newValue} -> pause & escalate`;
          updatedCondition = (scores: RiskScores) => {
            if (scores.financial > newValue) {
              return {
                triggered: true,
                action: "pause",
                reason: `Financial transfer exposure calculated at ${scores.financial} exceeds the customized safety ceiling of ${newValue}.`
              };
            }
            return { triggered: false, action: "none", reason: "" };
          };
        } else if (id === "policy_privacy_barrier") {
          updatedExpressionText = `IF privacy_risk > ${newValue} -> block execution`;
          updatedCondition = (scores: RiskScores) => {
            if (scores.privacy > newValue) {
              return {
                triggered: true,
                action: "block",
                reason: `Privacy Risk calculated at ${scores.privacy} exceeds the customized GDPR leakage threshold of ${newValue}. Hard block triggered.`
              };
            }
            return { triggered: false, action: "none", reason: "" };
          };
        } else if (id === "policy_ethical_bias") {
          updatedExpressionText = `IF ethical_risk > ${newValue} -> pause & escalate`;
          updatedCondition = (scores: RiskScores) => {
            if (scores.ethical > newValue) {
              return {
                triggered: true,
                action: "pause",
                reason: `Ethical risk matches ${scores.ethical}, exceeding threshold ${newValue}. Pause & escalate.`
              };
            }
            return { triggered: false, action: "none", reason: "" };
          };
        }

        appendAuditLog(
          "INTERVENTION_INJECTED" as any,
          `Policy compiler: updated critical parameters in ${p.name}. Compiled expression threshold target set: ${newValue}`,
          `Policy unique ID: ${p.id}\nUpdated Expression: ${updatedExpressionText}`
        );

        return {
          ...p,
          rawConditionText: updatedExpressionText,
          condition: updatedCondition
        };
      }
      return p;
    }));
  };

  // Helper to extract or parse thresholds from text
  const parseThresholdText = (text: string, keyword: string): number => {
    const regex = new RegExp(`${keyword}\\s*(?:>|>=|==|<=|<)?\\s*(\\d+)`, 'i');
    const match = text.match(regex);
    return match ? parseInt(match[1]) : 80;
  };

  // Initiate real-time agent monitoring swarm simulation
  const handleInitiateMission = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || prompt;
    if (!targetPrompt.trim()) return;

    // Remove any older running simulations
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
    }

    const missionId = "MSN_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Clear live feed console
    setTelemetryFeed([
      `[SOVEREIGN] INTAKE INITIALIZED FOR ACTION TARGET [${missionId}]`,
      `[SOVEREIGN] Prompt Content: "${targetPrompt}"`,
      `[SOVEREIGN] Triggering PRE-CHECK classification process...`
    ]);

    // 1. Intake: run transformers classification
    const evalResults = await runLocalClassification(targetPrompt);

    // Initial log messages
    const creationLogMsg = `Mission created [${missionId}] with prompt: "${targetPrompt.substring(0, 70)}..."`;
    const riskScoreLogMsg = `Dynamic Risk assessment pre-computed. Max Calculated Risk: ${Math.max(...Object.values(evalResults.scores))}/100. Severity Level: ${evalResults.riskLevel}`;

    // Calculate maximum score
    const scoresArr = Object.values(evalResults.scores);
    const maxScoreVal = Math.max(...scoresArr);

    // Evaluate against policy engine config first
    const policyResult = evaluatePolicies(evalResults.scores, evalResults.report, policies);

    const initialMission: Mission = {
      id: missionId,
      prompt: targetPrompt,
      state: MissionState.RUNNING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      riskScores: evalResults.scores,
      classification: evalResults.report,
      decision: evalResults.decision,
      currentAgent: "SOVEREIGN Engine",
      currentStep: "PRE-CHECK Compliance validation",
      currentActionText: "Evaluating prompt for adversarial injections, PII leakage, and ethical thresholds",
      stepIndex: 0,
      logs: []
    };

    setActiveMission(initialMission);

    // Immediately record intake and risk calculation in final Immutable Ledger
    appendAuditLog("MISSION_CREATED", creationLogMsg, `Mission ID: ${missionId}\nPrompt Input: ${targetPrompt}`);
    appendAuditLog(
      "RISK_CALCULATED", 
      riskScoreLogMsg, 
      `Intent: ${evalResults.report.intent}\nDomain: ${evalResults.report.domain}\nPII Detected: ${evalResults.report.hasPII ? 'YES' : 'NO'}\nAutonomy requested: ${evalResults.report.autonomyDetected ? 'YES' : 'NO'}\nScores breakdown:\n${JSON.stringify(evalResults.scores, null, 2)}`,
      maxScoreVal
    );

    // Perform checks
    // If ANY policy triggers block
    if (policyResult.highestAction === "block") {
      setTelemetryFeed(prev => [
        ...prev,
        `[SOVEREIGN] CRITICAL POLICY EXCEPTION DETECTED`,
        `[SOVEREIGN] VIOLATION: ${policyResult.escalationReason}`,
        `[SOVEREIGN] STATE DIRECTED TO REJECTED. OPERATION ABORTED.`
      ]);
      setActiveMission({
        ...initialMission,
        state: MissionState.REJECTED,
        currentAgent: "SOVEREIGN",
        currentStep: "Hard Interception",
        currentActionText: `Hard block: ${policyResult.escalationReason}`
      });
      appendAuditLog(
        "POLICY_TRIGGERED", 
        `CRITICAL POLICY VIOLATION: Execution blocked automatically`, 
        `Trigger: Privacy leakage threat detected.\nDetail: ${policyResult.escalationReason}`
      );
      appendAuditLog("MISSION_FAILED", `Mission aborted. Zero-tolerance policy violation reached.`);
      return;
    }

    // If ANY policy triggers pause OR Sovereign decision demands HUMAN REVIEW/INTERVENTION:
    const requirePause = policyResult.highestAction === "pause" || 
                         evalResults.decision === DecisionType.SOVEREIGN_INTERVENTION || 
                         evalResults.decision === DecisionType.HUMAN_REVIEW;

    if (requirePause) {
      const pauseReasonText = policyResult.escalationReason || 
                             (evalResults.decision === DecisionType.SOVEREIGN_INTERVENTION 
                               ? `Sovereign critical risk score override (${maxScoreVal}/100)` 
                               : `Human approval queue reached for elevated risk (${maxScoreVal}/100)`);

      const nextCheckpoint = {
        missionId: missionId,
        agentId: "PreCheckManager",
        stepName: "Intake Policy Evaluation",
        actionDetails: `Perform requested task: "${targetPrompt}"`,
        checkpointData: { prompt: targetPrompt },
        reason: pauseReasonText,
        riskScores: evalResults.scores
      };

      setTelemetryFeed(prev => [
        ...prev,
        `[SOVEREIGN] Risk threshold or policy limit matched. Safe-Lock activated.`,
        `[SOVEREIGN] SUSPENDING MISSION... FREEZING EXECUTION RUNTIME`,
        `[SOVEREIGN] Reason: ${pauseReasonText}`,
        `[SOVEREIGN] Checkpoint registered. Awaiting manual Human Supervisor override.`
      ]);

      setActiveMission({
        ...initialMission,
        state: MissionState.WAITING_FOR_HUMAN,
        currentAgent: "SOVEREIGN Kernel",
        currentStep: "Human Approval Queue Escaped",
        currentActionText: `Execution paused: ${pauseReasonText}`,
        checkpoint: nextCheckpoint
      });

      appendAuditLog(
        "POLICY_TRIGGERED", 
        `Execution paused by policy: ${pauseReasonText}`, 
        `Violated rule description: ${pauseReasonText}`
      );
      appendAuditLog("MISSION_PAUSED", `Mission paused immediately. Created freeze checkpoint.`);
      return;
    }

    // Normal auto approve or monitored flow!
    runApprovedSequentialSwarm(initialMission, evalResults.decision);
  };

  // Run the step-by-step agents swarm simulation on interval
  const runApprovedSequentialSwarm = (missionObj: Mission, decisionGrade: DecisionType) => {
    let currentStepIndex = 1; // start from Agent research (index 1)
    
    setTelemetryFeed(prev => [
      ...prev,
      `[SOVEREIGN] Decision Engine: [${decisionGrade}] SUCCESS`,
      `[SOVEREIGN] Activating runtime authorization token (Capability Ring 1)`,
      decisionGrade === DecisionType.MONITOR 
        ? `[SOVEREIGN] !! RUNNING IN MONITOR MODE: Continuous telemetry hooks will record payload payloads.` 
        : `[SOVEREIGN] Executing with green light auto approval status.`
    ]);

    appendAuditLog("MISSION_STARTED", `Nexus Agent Swarm activated for mission [${missionObj.id}]`);

    const swarmActions = [
      {
        agent: "ResearchAgent",
        title: "Scanning employee files & datasets",
        action: "Querying database for relevant keyword matches and gathering historical profiles",
        consoleMsg: "[ResearchAgent] Searching employee records and pulling feedback databases..."
      },
      {
        agent: "AnalysisAgent",
        title: "Compiling telemetry performance metrics",
        action: "Synthesizing cross-node feedback variables, weighting ratings, and matching schemas",
        consoleMsg: "[AnalysisAgent] Processing payload metrics. Running statistical correlation model..."
      },
      {
        agent: "DecisionAgent",
        title: "Formulating workflow decisions",
        action: "Preparing the recommended promotion list and compiling final report output markers",
        consoleMsg: "[DecisionAgent] Framing draft decision list. Packaging data payload for execution..."
      },
    ];

    simulationTimerRef.current = setInterval(() => {
      if (currentStepIndex <= 3) {
        const stepDetail = swarmActions[currentStepIndex - 1];
        
        // Emit agent telemetry structured event
        const agentEvent: AgentEvent = {
          agent_id: stepDetail.agent,
          mission_id: missionObj.id,
          status: "RUNNING",
          current_step: `Step ${currentStepIndex}/3`,
          current_action: stepDetail.action,
          timestamp: new Date().toISOString()
        };

        setTelemetryFeed(prev => [
          ...prev,
          `[${stepDetail.agent}] Emit: current_step="${agentEvent.current_step}" action="${stepDetail.action}"`,
          `[${stepDetail.agent}] ${stepDetail.consoleMsg}`,
          decisionGrade === DecisionType.MONITOR 
            ? `[SOVEREIGN MONITOR] Telemetry check: Zero PII violations found. Thread healthy.`
            : `[SOVEREIGN] Node check: Healthy`
        ]);

        setActiveMission(prev => {
          if (!prev) return null;
          return {
            ...prev,
            currentAgent: stepDetail.agent,
            currentStep: stepDetail.title,
            currentActionText: stepDetail.action,
            stepIndex: currentStepIndex,
            logs: [...prev.logs, agentEvent]
          };
        });

        // Record research step in audit logs
        appendAuditLog(
          "RISK_CALCULATED",
          `${stepDetail.agent} telemetries verified by Sovereign. Action: ${stepDetail.title}`,
          `Agent ID: ${stepDetail.agent}\nDetails: ${stepDetail.action}`
        );

        currentStepIndex++;
      } else {
        // Simulation finished!
        clearInterval(simulationTimerRef.current!);
        
        setTelemetryFeed(prev => [
          ...prev,
          `[SOVEREIGN] All node processes verified. Complete signature compiled.`,
          `[SOVEREIGN] MISSION COMPLETED SUCCESSFULLY. Token destroyed.`
        ]);

        setActiveMission(prev => {
          if (!prev) return null;
          return {
            ...prev,
            state: MissionState.COMPLETED,
            currentAgent: "SOVEREIGN Kernel",
            currentStep: "Mission Completed",
            currentActionText: "Governance verification concluded. All agents resolved safely."
          };
        });

        appendAuditLog("MISSION_COMPLETED", `Mission [${missionObj.id}] successfully executed to physical completion.`);
      }
    }, 2500);
  };

  // Human Oversight action: APPROVE
  const handleApproveCheckpoint = (mId: string) => {
    if (!activeMission) return;
    
    appendAuditLog("HUMAN_APPROVED", `Supervisor manually approved suspended checkpoint state`);
    appendAuditLog("MISSION_RESUMED", `Resuming mission execution thread from exact freeze state`);

    setTelemetryFeed(prev => [
      ...prev,
      `[SOVEREIGN] HUMAN OVERRIDE APPROVED`,
      `[SOVEREIGN] Recovering instruction stream from freeze checkpoint...`,
      `[SOVEREIGN] Resuming execution with elevated authorization ring.`
    ]);

    setActiveMission(prev => {
      if (!prev) return null;
      return {
        ...prev,
        state: MissionState.RUNNING,
        currentStep: "Resuming thread...",
        checkpoint: undefined
      };
    });

    // Run the remaining threads of the workflow
    runApprovedSequentialSwarm(activeMission, DecisionType.MONITOR);
  };

  // Human Oversight action: REJECT
  const handleRejectCheckpoint = (mId: string) => {
    if (!activeMission) return;

    appendAuditLog("HUMAN_REJECTED", `Supervisor manually rejected the frozen checkpoint`);
    appendAuditLog("MISSION_FAILED", `Mission aborted. Execution halted permanently.`);

    setTelemetryFeed(prev => [
      ...prev,
      `[SOVEREIGN] HUMAN OVERRIDE REJECTED`,
      `[SOVEREIGN] Killing all child node swarms. Releasing heap limits.`,
      `[SOVEREIGN] MISSION CLOSED WITH REJECTED STATUS.`
    ]);

    setActiveMission(prev => {
      if (!prev) return null;
      return {
        ...prev,
        state: MissionState.REJECTED,
        currentAgent: "SOVEREIGN Supervisor",
        currentStep: "Suspended & Aborted",
        currentActionText: "Agent operations blocked by manual supervisor rejection."
      };
    });
  };

  // Human Oversight action: MODIFY
  const handleModifyCheckpoint = async (mId: string, modifiedPromptText: string) => {
    if (!activeMission) return;

    appendAuditLog("HUMAN_MODIFIED", `Supervisor modified frozen action parameters: "${modifiedPromptText}"`);
    
    setTelemetryFeed(prev => [
      ...prev,
      `[SOVEREIGN] HUMAN PARAMETERS COMPILING...`,
      `[SOVEREIGN] Modified prompt: "${modifiedPromptText}"`,
      `[SOVEREIGN] Injecting modified parameters. Re-assessing risks...`
    ]);

    // Recalculate target parameters on modified text
    const reClassified = await runLocalClassification(modifiedPromptText);
    const policyResult = evaluatePolicies(reClassified.scores, reClassified.report, policies);

    const scoresArr = Object.values(reClassified.scores);
    const maxScoreVal = Math.max(...scoresArr);

    setActiveMission(prev => {
      if (!prev) return null;
      return {
        ...prev,
        prompt: modifiedPromptText,
        riskScores: reClassified.scores,
        classification: reClassified.report,
        decision: reClassified.decision,
        state: MissionState.RUNNING,
        currentAgent: "SOVEREIGN Auditor",
        currentStep: "Validating modified parameters",
        currentActionText: "Re-assessing risks of altered request payload"
      };
    });

    // Record new calculations
    appendAuditLog(
      "RISK_CALCULATED", 
      `Recompiled risk analysis for modified prompt. Max score: ${maxScoreVal}/100 [${reClassified.riskLevel}]`, 
      `Altered content: ${modifiedPromptText}\nDomain: ${reClassified.report.domain}\nScores breakdown:\n${JSON.stringify(reClassified.scores, null, 2)}`,
      maxScoreVal
    );

    // If new scores are still too high or trigger blocks, handle nicely
    if (policyResult.highestAction === "block") {
      setTelemetryFeed(prev => [
        ...prev,
        `[SOVEREIGN] MODIFIED VALUE STILL VIOLATES STRICT SECURITY RULES. BLOCKED.`
      ]);
      setActiveMission(prev => prev ? { ...prev, state: MissionState.REJECTED } : null);
      appendAuditLog("MISSION_FAILED", `Mission aborted after modifier parameters failed safety check.`);
      return;
    }

    // Otherwise, resume running with new compliance level successfully!
    runApprovedSequentialSwarm({
      ...activeMission,
      prompt: modifiedPromptText,
      riskScores: reClassified.scores,
      classification: reClassified.report,
      decision: reClassified.decision,
    }, reClassified.decision);
  };

  // Abort running simulation manually
  const handleCancelSimulation = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
    }
    setTelemetryFeed(prev => [
      ...prev,
      `[SOVEREIGN] KERNEL OVERRIDE: MANUAL INTERRUPTION SIGNAL DETECTED.`,
      `[SOVEREIGN] ABORTING SIMULATION IMMEDIATE. THREAD RELEASED.`
    ]);
    setActiveMission(null);
    appendAuditLog("MISSION_FAILED", "Simulation aborted manually by supervisor.");
  };

  // clear immutable journal ledger
  const handleClearLedger = () => {
    setAuditLogs([]);
    appendAuditLog("MISSION_CREATED", "Audit ledger vault flushed. Re-genesis initialized.");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#ffffff] flex flex-col font-sans relative overflow-hidden" id="sovereign-governance-app">
      {/* Background glow matrix effect */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none select-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/3 blur-[120px] rounded-full pointer-events-none select-none" />

      {/* Top micro-indicators bar */}
      <div className="border-b border-[#222] bg-[#000] px-6 py-2.5 flex justify-between items-center text-[10.5px] font-mono tracking-wider select-none text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-[#34C759]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
            NEXUS OS CORE
          </span>
          <span className="text-zinc-800">|</span>
          <span className="flex items-center gap-1">
            KERNEL STATUS: <span className="font-bold text-[#34C759]">ARMED</span>
          </span>
          <span className="text-zinc-800">|</span>
          <span className="text-zinc-500 truncate max-w-xs sm:max-w-md">
            SHA256 VAULT ACCESS KEY: <b className="text-zinc-350">SV_0A99X2B08</b>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
          <span className="font-bold text-zinc-300 select-all" id="current-utc-time">{currentTime}</span>
        </div>
      </div>

      {/* Header Panel */}
      <header className="border-b border-[#333] bg-black px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-neutral-900 border border-[#333] flex justify-center items-center">
            <Shield className="w-8 h-8 text-[#34C759]" />
          </div>
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-[48px] font-[900] tracking-[-0.05em] leading-none uppercase text-white font-sans">SOVEREIGN</h1>
              <span className="text-[10px] font-mono font-black uppercase text-white bg-[#FF3B30] px-2 py-0.5 tracking-widest leading-none select-none">v3.4.1</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#888] mt-1 select-none font-sans font-extrabold">
              AI Governance Operating System & Human Oversight Portal
            </p>
          </div>
        </div>

        {/* Neural model status indicator badge */}
        <div className="bg-black border border-[#333] p-4 flex items-center gap-3.5 w-full md:w-auto font-sans text-xs">
          <Activity className={`w-4 h-4 shrink-0 ${usingTransformerModel ? 'text-[#34C759] animate-pulse' : 'text-yellow-500'}`} />
          <div className="min-w-0 flex-1 sm:max-w-xs md:max-w-sm">
            <span className="text-[9px] uppercase font-black text-[#666] tracking-wider block select-none">Classifier weights status</span>
            <span className="text-zinc-300 truncate block font-bold mt-1 tracking-tight select-all">
              {modelStatusText}
            </span>
          </div>
        </div>
      </header>

      {/* Active Interception alert box */}
      {activeMission?.state === MissionState.WAITING_FOR_HUMAN && activeMission.checkpoint && (
        <div className="px-6 py-4 border-b border-[#FF3B30] bg-black">
          <HumanReviewPortal
            checkpoint={activeMission.checkpoint}
            onApprove={handleApproveCheckpoint}
            onReject={handleRejectCheckpoint}
            onModify={handleModifyCheckpoint}
          />
        </div>
      )}

      {/* Main Dashboard Layout */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Intakes & Policies (xl:col-span-4) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="flex-1">
            <AgentSwarmControl
              prompt={prompt}
              setPrompt={setPrompt}
              onInitiateMission={handleInitiateMission}
              activeMission={activeMission}
              onCancelSimulation={handleCancelSimulation}
              modelLoading={modelLoading}
            />
          </div>
          <div className="flex-1">
            <PolicyConfigurator
              policies={policies}
              onTogglePolicy={handleTogglePolicy}
              onUpdateThreshold={handleUpdateThreshold}
            />
          </div>
        </div>

        {/* Center Column: Live Risk Vectors & Terminal View (xl:col-span-4) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Risk vectors */}
          <div className="flex-1">
            <RiskRadar
              scores={activeMission?.riskScores || { security: 0, privacy: 0, financial: 0, ethical: 0, execution: 0, autonomy: 0, impact: 0 }}
              level={activeMission ? (activeMission.riskScores ? (((Object.values(activeMission.riskScores) as number[]).some(x => x > 80)) ? RiskLevel.CRITICAL : ((Object.values(activeMission.riskScores) as number[]).some(x => x > 60)) ? RiskLevel.HIGH : ((Object.values(activeMission.riskScores) as number[]).some(x => x > 40)) ? RiskLevel.ELEVATED : ((Object.values(activeMission.riskScores) as number[]).some(x => x > 20)) ? RiskLevel.GUARDED : RiskLevel.LOW) : RiskLevel.LOW) : RiskLevel.LOW}
              maxScore={Math.max(...(activeMission?.riskScores ? (Object.values(activeMission.riskScores) as number[]) : [0]))}
            />
          </div>

          {/* Terminal Console Swarm Feed */}
          <div className="flex-1 bg-black border border-[#333] p-5 flex flex-col h-[300px] justify-between relative shadow-none" id="live-console">
            <div className="flex justify-between items-baseline mb-3.5 border-b border-[#222] w-full pb-2.5 select-none">
              <span className="text-[11px] font-sans tracking-[0.2em] font-bold text-[#666] uppercase flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#34C759]" />
                Live Swarm Logs
              </span>
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                STREAM: ACTIVE
              </span>
            </div>

            {/* Scrolling messages container */}
            <div className="flex-1 overflow-y-auto mb-2 space-y-1.5 font-mono text-[10.5px] leading-relaxed text-zinc-400 pr-1 select-all">
              {telemetryFeed.length === 0 ? (
                <div className="text-zinc-600 h-full flex flex-col justify-center items-center select-none text-center">
                  <Terminal className="w-5 h-5 text-zinc-800 mb-1" />
                  <span>Interactive Swarm console.</span>
                  <span>Select template preset to verify events emission.</span>
                </div>
              ) : (
                telemetryFeed.map((msg, idx) => {
                  let textStyle = "text-zinc-300";
                  if (msg.includes("[SOVEREIGN]")) textStyle = "text-[#34C759] font-black";
                  if (msg.includes("POLICY EXCEPTION") || msg.includes("VIOLATION:")) textStyle = "text-[#FF3B30] font-black bg-[#FF3B30]/10 px-1.5 py-0.5 border border-[#FF3B30]/20 rounded-none inline-block";
                  if (msg.includes("SUSPENDING") || msg.includes("Risk threshold")) textStyle = "text-[#FFCC00] font-bold bg-[#FFCC00]/10 px-1.5 py-0.5 border border-[#FFCC00]/20 rounded-none inline-block animate-pulse";
                  if (msg.includes("MISSION COMPLETED")) textStyle = "text-[#34C759] font-black border border-[#34C759]/30 bg-[#34C759]/10 px-2 py-1 rounded-none select-all";
                  if (msg.includes("[ResearchAgent]")) textStyle = "text-blue-300";
                  if (msg.includes("[AnalysisAgent]")) textStyle = "text-purple-300";
                  if (msg.includes("[DecisionAgent]")) textStyle = "text-sky-300";

                  return (
                    <div key={idx} className={`${textStyle} break-words whitespace-pre-wrap`}>
                      {msg}
                    </div>
                  );
                })
              )}
              <div ref={terminalLogsEndRef} />
            </div>

            {/* Small instruction footer */}
            <div className="text-[10px] font-mono text-zinc-500 mt-1 border-t border-[#111] pt-1.5 select-none text-right">
              Console outputs represent telemetry frames emitted by active nodes.
            </div>
          </div>
        </div>

        {/* Right Column: Immutable Audit Ledger View (xl:col-span-4) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="flex-1">
            <AuditLedger
              logs={auditLogs}
              onClearLedger={handleClearLedger}
            />
          </div>
        </div>

      </main>

      {/* Footer system details */}
      <footer className="border-t border-[#222] bg-[#000] p-5 text-[10.5px] font-mono text-zinc-550 flex flex-col md:flex-row justify-between items-center gap-3 select-none">
        <div className="flex items-center gap-1.5">
          <span>Protected by</span>
          <span className="font-extrabold text-zinc-300">NEXUS GUARD CONSTITUTION SYSTEM</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Compliances:</span>
          <span className="bg-neutral-900 px-2 py-0.5 rounded-none text-zinc-300 font-bold tracking-tight">EU AI ACT</span>
          <span className="bg-neutral-900 px-2 py-0.5 rounded-none text-zinc-300 font-bold tracking-tight">GDPR</span>
          <span className="bg-neutral-900 px-2 py-0.5 rounded-none text-zinc-300 font-bold tracking-tight">SOC2</span>
        </div>
      </footer>
    </div>
  );
};
