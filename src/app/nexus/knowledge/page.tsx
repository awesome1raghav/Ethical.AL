
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  Database, 
  Target, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Brain,
  Maximize2,
  Activity,
  ChevronRight,
  ShieldAlert,
  BarChart3,
  Minimize2,
  Layers,
  Compass,
  Info,
  Lock,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type NodeType = 'CORE' | 'GOVERNANCE' | 'RESEARCH' | 'RISK' | 'ENTITY' | 'AGENT' | 'POLICY' | 'MEMORY';

interface Node {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  size: number;
  confidence: number;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
  metadata: Record<string, string | number>;
  parentId?: string;
  isBloom?: boolean;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'TRUST' | 'RISK' | 'NORMAL';
  confidence: number;
}

// --- Mission Scenarios ---

const URBAN_NODES: Node[] = [
  { id: 'core', type: 'CORE', label: 'NEXUS CORE', x: 0, y: 0, size: 90, confidence: 99, risk: 'Low', metadata: { status: 'Primary', version: 'Kernel 1.0', load: '12%' } },
  { id: 'gov-1', type: 'GOVERNANCE', label: 'Sovereign Layer', x: 0, y: -250, size: 60, confidence: 100, risk: 'Low', metadata: { state: 'Enforcing', coverage: '100%' } },
  { id: 'gov-2', type: 'POLICY', label: 'Urban Equity Policy', x: -150, y: -320, size: 45, confidence: 98, risk: 'Low', metadata: { version: 'v3.2', status: 'Active' } },
  { id: 'gov-3', type: 'POLICY', label: 'No Harm Healthcare', x: 150, y: -320, size: 45, confidence: 100, risk: 'Low', metadata: { protocol: 'Standard', priority: 'Critical' } },
  { id: 'res-1', type: 'RESEARCH', label: 'ResearchAgent', x: -350, y: 0, size: 55, confidence: 94, risk: 'Low', metadata: { focus: 'Retrieval', trust: '99%' } },
  { id: 'res-2', type: 'MEMORY', label: 'Grid Topology', x: -450, y: -80, size: 40, confidence: 88, risk: 'Low', metadata: { accuracy: 'High', source: 'LTM' } },
  { id: 'res-3', type: 'MEMORY', label: 'Infrastructure Map', x: -450, y: 80, size: 40, confidence: 92, risk: 'Low', metadata: { coverage: '94%', state: 'Cached' } },
  { id: 'risk-1', type: 'RISK', label: 'Risk Engine', x: 350, y: 0, size: 55, confidence: 96, risk: 'Low', metadata: { status: 'Monitoring', scan_rate: '840/s' } },
  { id: 'risk-2', type: 'RISK', label: 'Citadel', x: 450, y: -80, size: 45, confidence: 100, risk: 'Low', metadata: { defense: 'Active', sandbox: 'gVisor' } },
  { id: 'risk-3', type: 'AGENT', label: 'PolicyAgent', x: 450, y: 80, size: 45, confidence: 98, risk: 'Low', metadata: { alignment: 'Stable', audit: 'PASS' } },
  { id: 'ent-1', type: 'ENTITY', label: 'District 9', x: 0, y: 250, size: 70, confidence: 82, risk: 'Medium', metadata: { priority: 'High', population: '14.2k' } },
  { id: 'ent-2', type: 'ENTITY', label: 'Medical Facilities', x: -180, y: 320, size: 50, confidence: 74, risk: 'High', metadata: { load: '110%', state: 'Emergency' } },
  { id: 'ent-3', type: 'ENTITY', label: 'Power Grid', x: 180, y: 320, size: 50, confidence: 42, risk: 'Critical', metadata: { state: 'Compromised', uptime: '12%' } },
];

const CYBER_NODES: Node[] = [
  { id: 'core', type: 'CORE', label: 'NEXUS CORE', x: 0, y: 0, size: 90, confidence: 99, risk: 'Low', metadata: { mode: 'Defense', hardened: 'TRUE' } },
  { id: 'cyber-1', type: 'RISK', label: 'Threat Surface', x: 0, y: -250, size: 65, confidence: 98, risk: 'Low', metadata: { nodes: 1240, active: 'TRUE' } },
  { id: 'cyber-2', type: 'ENTITY', label: 'Prompt Injection', x: -300, y: -100, size: 55, confidence: 12, risk: 'Critical', metadata: { threat: 'Detected', type: 'Jailbreak' } },
  { id: 'cyber-3', type: 'RESEARCH', label: 'Memory Firewall', x: 300, y: -100, size: 55, confidence: 100, risk: 'Low', metadata: { filtered: 14210 } },
  { id: 'cyber-4', type: 'GOVERNANCE', label: 'Defense Alignment', x: 0, y: 250, size: 60, confidence: 100, risk: 'Low', metadata: { policy: 'SOC-v4' } },
  { id: 'cyber-5', type: 'AGENT', label: 'CitadelValidator', x: -250, y: 200, size: 50, confidence: 99, risk: 'Low', metadata: { trust: '99.9%', latency: '8ms' } },
];

const BLOOM_DATA: Record<string, Node[]> = {
  'ent-2': [
    { id: 'b-1', type: 'ENTITY', label: 'Hospitals', x: -280, y: 400, size: 35, confidence: 94, risk: 'Medium', metadata: { parent: 'Medical Facilities', capacity: '110%' } },
    { id: 'b-2', type: 'ENTITY', label: 'Mobile Units', x: -180, y: 460, size: 35, confidence: 88, risk: 'Low', metadata: { units: 14 } },
  ],
  'ent-3': [
    { id: 'b-3', type: 'ENTITY', label: 'Sub-stations', x: 280, y: 400, size: 35, confidence: 32, risk: 'Critical', metadata: { status: 'Offline' } },
    { id: 'b-4', type: 'ENTITY', label: 'Generators', x: 180, y: 460, size: 35, confidence: 74, risk: 'Medium', metadata: { fuel: '62%' } },
  ]
};

const NODE_ICONS: Record<string, any> = {
  CORE: Brain,
  GOVERNANCE: ShieldCheck,
  RESEARCH: Search,
  RISK: ShieldAlert,
  ENTITY: Layers,
  AGENT: Cpu,
  POLICY: Lock,
  MEMORY: Database,
};

// --- Sub-components ---

const DataPacket = ({ source, target, speed = 3 }: { source: Node, target: Node, speed?: number }) => (
  <motion.circle
    r="1.5"
    fill="white"
    initial={{ cx: `calc(50% + ${source.x}px)`, cy: `calc(50% + ${source.y}px)`, opacity: 0 }}
    animate={{ 
      cx: [`calc(50% + ${source.x}px)`, `calc(50% + ${target.x}px)`],
      cy: [`calc(50% + ${source.y}px)`, `calc(50% + ${target.y}px)`],
      opacity: [0, 1, 1, 0]
    }}
    transition={{ 
      duration: speed, 
      repeat: Infinity, 
      ease: "linear",
      times: [0, 0.1, 0.9, 1]
    }}
  />
);

export default function KnowledgeGraphPage() {
  const [mounted, setMounted] = useState(false);
  const [mission, setMission] = useState<'URBAN' | 'CYBER'>('URBAN');
  const [nodes, setNodes] = useState<Node[]>(URBAN_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('core');
  const [isCinematic, setIsCinematic] = useState(false);
  const [bloomedNodes, setBloomedNodes] = useState<string[]>([]);
  
  // Viewport State for Pan & Zoom
  const viewportX = useMotionValue(0);
  const viewportY = useMotionValue(0);
  const viewportScale = useMotionValue(1);

  const springX = useSpring(viewportX, { stiffness: 100, damping: 30 });
  const springY = useSpring(viewportY, { stiffness: 100, damping: 30 });
  const springScale = useSpring(viewportScale, { stiffness: 100, damping: 30 });

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mission === 'URBAN') {
      setNodes(URBAN_NODES);
      setSelectedNodeId('core');
    } else {
      setNodes(CYBER_NODES);
      setSelectedNodeId('core');
    }
    setBloomedNodes([]);
    resetViewport();
  }, [mission]);

  const resetViewport = () => {
    viewportX.set(0);
    viewportY.set(0);
    viewportScale.set(1);
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNodeId(node.id);
    // Smoothly focus and zoom into node
    viewportX.set(-node.x);
    viewportY.set(-node.y);
    viewportScale.set(1.5);
  };

  const handleBloom = (nodeId: string) => {
    if (bloomedNodes.includes(nodeId)) {
      setNodes(prev => prev.filter(n => n.parentId !== nodeId));
      setBloomedNodes(prev => prev.filter(id => id !== nodeId));
    } else {
      const subs = BLOOM_DATA[nodeId];
      if (subs) {
        const newNodes = subs.map(n => ({ ...n, parentId: nodeId, isBloom: true }));
        setNodes(prev => [...prev, ...newNodes]);
        setBloomedNodes(prev => [...prev, nodeId]);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(viewportScale.get() + delta, 0.5), 2.5);
    viewportScale.set(newScale);
  };

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const edges = useMemo(() => {
    const activeIds = nodes.map(n => n.id);
    const baseEdges: Edge[] = [
      { id: 'e1', source: 'core', target: 'gov-1', type: 'NORMAL', confidence: 100 },
      { id: 'e2', source: 'gov-1', target: 'gov-2', type: 'TRUST', confidence: 98 },
      { id: 'e3', source: 'gov-1', target: 'gov-3', type: 'TRUST', confidence: 100 },
      { id: 'e4', source: 'core', target: 'res-1', type: 'NORMAL', confidence: 94 },
      { id: 'e5', source: 'res-1', target: 'res-2', type: 'NORMAL', confidence: 90 },
      { id: 'e6', source: 'res-1', target: 'res-3', type: 'NORMAL', confidence: 90 },
      { id: 'e7', source: 'core', target: 'risk-1', type: 'NORMAL', confidence: 96 },
      { id: 'e8', source: 'risk-1', target: 'risk-2', type: 'TRUST', confidence: 100 },
      { id: 'e9', source: 'risk-1', target: 'risk-3', type: 'TRUST', confidence: 98 },
      { id: 'e10', source: 'core', target: 'ent-1', type: 'NORMAL', confidence: 82 },
      { id: 'e11', source: 'ent-1', target: 'ent-2', type: 'RISK', confidence: 74 },
      { id: 'e12', source: 'ent-1', target: 'ent-3', type: 'RISK', confidence: 42 },
    ];

    if (mission === 'CYBER') {
       return [
        { id: 'ce1', source: 'core', target: 'cyber-1', type: 'NORMAL', confidence: 99 },
        { id: 'ce2', source: 'cyber-1', target: 'cyber-2', type: 'RISK', confidence: 12 },
        { id: 'ce3', source: 'cyber-1', target: 'cyber-3', type: 'TRUST', confidence: 100 },
        { id: 'ce4', source: 'core', target: 'cyber-4', type: 'NORMAL', confidence: 100 },
        { id: 'ce5', source: 'cyber-4', target: 'cyber-5', type: 'TRUST', confidence: 99 },
      ];
    }

    const bloomEdges: Edge[] = [];
    bloomedNodes.forEach(parentId => {
      const subs = BLOOM_DATA[parentId];
      if (subs) {
        subs.forEach(s => {
          bloomEdges.push({ id: `be-${parentId}-${s.id}`, source: parentId, target: s.id, type: 'NORMAL', confidence: s.confidence });
        });
      }
    });

    return [...baseEdges, ...bloomEdges].filter(e => activeIds.includes(e.source) && activeIds.includes(e.target));
  }, [nodes, bloomedNodes, mission]);

  if (!mounted) return null;

  return (
    <div className="h-full w-full bg-black text-[#f8f9fa] flex overflow-hidden selection:bg-white/10 relative">
      {/* LEFT: Graph Controls (20%) */}
      {!isCinematic && (
        <aside className="w-[20%] border-r border-white/5 bg-[#050505] flex flex-col z-50 shrink-0">
          <header className="p-8 border-b border-white/5">
            <div className="flex items-center gap-3 mb-1">
              <Compass className="h-4 w-4 text-[#5C5C5C]" />
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-[#5C5C5C]">Semantic Engine</h2>
            </div>
            <p className="text-[12px] font-body text-[#8A8A8A]">Global Memory Sync</p>
          </header>

          <div className="flex-grow p-6 space-y-10 overflow-y-auto scrollbar-hide">
            <section>
              <h3 className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#444244] mb-4">Active Mission</h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setMission('URBAN')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                    mission === 'URBAN' ? "bg-white/5 border-white/20 text-white" : "border-transparent text-[#5C5C5C] hover:text-[#8A8A8A]"
                  )}
                >
                  <Target className="h-4 w-4" />
                  <span className="text-[11px] font-mono font-bold uppercase">Urban Crisis</span>
                </button>
                <button 
                  onClick={() => setMission('CYBER')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                    mission === 'CYBER' ? "bg-white/5 border-white/20 text-white" : "border-transparent text-[#5C5C5C] hover:text-[#8A8A8A]"
                  )}
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span className="text-[11px] font-mono font-bold uppercase">Cyber Citadel</span>
                </button>
              </div>
            </section>

            <section className="pt-6 border-t border-white/5">
              <h3 className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#444244] mb-4">Filters</h3>
              <div className="space-y-1">
                {Object.keys(NODE_ICONS).map(type => (
                  <div key={type} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] text-[#5C5C5C] hover:text-[#8A8A8A] group transition-all">
                    <div className="flex items-center gap-3">
                      {React.createElement(NODE_ICONS[type], { className: "h-3.5 w-3.5" })}
                      <span className="text-[10px] font-mono uppercase">{type}</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-white/20 group-hover:bg-white/60" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      )}

      {/* CENTER: Main Hero Graph (60% or 100%) */}
      <main 
        onWheel={handleWheel}
        className="flex-grow relative bg-black overflow-hidden flex flex-col"
      >
        {/* Cinematic Toggle */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] flex gap-4">
          <button 
            onClick={() => setIsCinematic(!isCinematic)}
            className="flex items-center gap-3 px-6 py-2.5 bg-black/60 border border-white/10 backdrop-blur-2xl rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all shadow-2xl group"
          >
            {isCinematic ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {isCinematic ? "Exit Intelligence Space" : "Expand Intelligence Space"}
          </button>
          <button 
            onClick={resetViewport}
            className="px-6 py-2.5 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all"
          >
            Reset View
          </button>
        </div>

        {/* Neural Canvas */}
        <div 
          ref={canvasRef}
          onDoubleClick={resetViewport}
          className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {/* Star grid stays fixed background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
          
          <motion.div 
            drag
            dragMomentum={true}
            onDrag={(e, info) => {
              viewportX.set(viewportX.get() + info.delta.x);
              viewportY.set(viewportY.get() + info.delta.y);
            }}
            style={{ x: springX, y: springY, scale: springScale }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* Semantic Links Layer */}
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
              {edges.map(edge => {
                const s = nodes.find(n => n.id === edge.source);
                const t = nodes.find(n => n.id === edge.target);
                if (!s || !t) return null;
                
                const isSelected = selectedNodeId === s.id || selectedNodeId === t.id;
                const strokeColor = edge.type === 'TRUST' ? 'rgba(34,197,94,0.3)' : edge.type === 'RISK' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)';

                return (
                  <motion.g key={edge.id}>
                    <line
                      x1={`calc(50% + ${s.x}px)`}
                      y1={`calc(50% + ${s.y}px)`}
                      x2={`calc(50% + ${t.x}px)`}
                      y2={`calc(50% + ${t.y}px)`}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 2 : 1}
                      className="transition-all duration-700"
                    />
                    <DataPacket source={s} target={t} speed={mission === 'URBAN' ? 4 : 2} />
                  </motion.g>
                );
              })}
            </svg>

            {/* Nodes Layer */}
            {nodes.map(node => {
              const Icon = NODE_ICONS[node.type] || Info;
              const isSelected = selectedNodeId === node.id;
              const isDimmed = selectedNodeId !== null && !isSelected && !edges.some(e => 
                (e.source === node.id && e.target === selectedNodeId) || 
                (e.target === node.id && e.source === selectedNodeId)
              );
              
              return (
                <motion.div
                  key={node.id}
                  drag
                  dragMomentum={false}
                  onDragStart={() => setSelectedNodeId(node.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(node);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleBloom(node.id);
                  }}
                  className={cn(
                    "absolute z-10 cursor-pointer group transition-opacity duration-500",
                    isDimmed ? "opacity-20" : "opacity-100"
                  )}
                  style={{ left: `calc(50% + ${node.x}px)`, top: `calc(50% + ${node.y}px)` }}
                  animate={{ 
                    x: "-50%", y: "-50%",
                    scale: isSelected ? 1.2 : 1,
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className={cn(
                      "flex items-center justify-center rounded-full border transition-all duration-500 relative",
                      isSelected ? "bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.2)]" : "bg-black/90 border-white/10 group-hover:border-white/30",
                      node.size === 90 ? "h-20 w-20" : node.size >= 60 ? "h-16 w-16" : "h-12 w-12"
                    )}
                  >
                    <Icon size={node.size * 0.4} className={cn("transition-colors", isSelected ? "text-black" : "text-white/40 group-hover:text-white")} />
                    
                    {BLOOM_DATA[node.id] && !bloomedNodes.includes(node.id) && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-white rounded-full flex items-center justify-center animate-pulse">
                        <div className="h-1 w-1 bg-black rounded-full" />
                      </div>
                    )}

                    <div className={cn(
                      "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all",
                      isSelected ? "text-white opacity-100" : "text-[#5C5C5C] opacity-0 group-hover:opacity-100"
                    )}>
                      {node.label}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* BOTTOM: Memory Telemetry */}
        <div className="absolute bottom-0 left-0 right-0 h-[80px] border-t border-white/5 bg-black/40 backdrop-blur-3xl px-12 flex items-center justify-between z-50">
          <div className="flex items-center gap-16">
            {[
              { label: "Semantic Nodes", value: nodes.length + 1204, icon: Layers },
              { label: "Memory Clusters", value: mission === 'URBAN' ? 12 : 6, icon: Database },
              { label: "Sync Confidence", value: "96.4%", icon: ShieldCheck },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-[9px] font-mono text-[#5C5C5C] uppercase font-bold tracking-widest">{stat.label}</span>
                <div className="flex items-center gap-2.5">
                  <stat.icon className="h-4 w-4 text-white/40" />
                  <span className="text-[16px] font-display font-bold text-white">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
             <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-mono text-white font-bold uppercase tracking-widest">Brain_Sync: NOMINAL</span>
             </div>
          </div>
        </div>
      </main>

      {/* RIGHT: Node Intelligence Inspector (20%) */}
      {!isCinematic && (
        <aside className="w-[20%] border-l border-white/5 bg-[#050505] flex flex-col z-50 overflow-hidden shrink-0">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div 
                key={selectedNode.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col h-full"
              >
                <header className="p-8 border-b border-white/5">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                      {React.createElement(NODE_ICONS[selectedNode.type] || Info, { className: "h-6 w-6 text-white" })}
                    </div>
                    <div>
                      <h3 className="text-[10px] font-mono text-[#5C5C5C] uppercase font-bold mb-1">{selectedNode.type}</h3>
                      <p className="text-xl font-display font-bold text-white tracking-tight">{selectedNode.label}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[9px] font-mono text-[#444244] uppercase mb-1 block">Confidence</span>
                      <span className="text-[14px] font-mono text-white font-bold">{selectedNode.confidence}%</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[9px] font-mono text-[#444244] uppercase mb-1 block">Risk Factor</span>
                      <span className={cn(
                        "text-[14px] font-mono font-bold",
                        selectedNode.risk === 'Low' ? "text-green-500" : selectedNode.risk === 'Medium' ? "text-amber-500" : "text-red-500"
                      )}>{selectedNode.risk}</span>
                    </div>
                  </div>
                </header>

                <div className="flex-grow p-8 space-y-8 overflow-y-auto scrollbar-hide">
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-mono text-[#5C5C5C] uppercase font-bold tracking-widest">Metadata Matrix</h4>
                      <BarChart3 className="h-3.5 w-3.5 text-[#5C5C5C]" />
                    </div>
                    <div className="space-y-2">
                      {Object.entries(selectedNode.metadata).map(([k, v]) => (
                        <div key={k} className="p-3 rounded-lg bg-white/[0.01] border border-white/5 flex flex-col">
                          <span className="text-[8px] font-mono text-[#444244] uppercase">{k.replace('_', ' ')}</span>
                          <span className="text-[12px] font-body text-white/80">{v}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-mono text-[#5C5C5C] uppercase font-bold mb-4 tracking-widest">Semantic Memory</h4>
                    <div className="p-4 rounded-xl border border-white/5 border-dashed bg-white/[0.01]">
                      <p className="text-[11px] font-body text-[#8A8A8A] leading-relaxed italic">
                        "Node identified as a core dependency for {mission === 'URBAN' ? 'Urban Crisis' : 'Cyber Security'} workflows. Semantically reinforced by past mission history."
                      </p>
                    </div>
                  </section>
                </div>

                <footer className="p-8 border-t border-white/5 space-y-3 bg-black/40">
                  <button className="w-full h-11 bg-white text-black font-bold text-[10px] font-mono uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    Open Context <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button className="w-full h-11 bg-white/5 border border-white/10 text-white font-bold text-[10px] font-mono uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">
                    Sync Intelligence
                  </button>
                </footer>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20">
                <Brain className="h-12 w-12 mb-6" />
                <p className="text-[11px] font-mono uppercase tracking-[0.3em]">Select node to inspect intelligence</p>
              </div>
            )}
          </AnimatePresence>
        </aside>
      )}
    </div>
  );
}
