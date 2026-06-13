import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { RiskScores, RiskLevel } from '../types';

interface RiskRadarProps {
  scores: RiskScores;
  level: RiskLevel;
  maxScore: number;
}

export const RiskRadar: React.FC<RiskRadarProps> = ({ scores, level, maxScore }) => {
  // Map dimensions to format suitable for Recharts Radar
  const chartData = [
    { subject: 'Security', value: scores.security, fullMark: 100 },
    { subject: 'Privacy', value: scores.privacy, fullMark: 100 },
    { subject: 'Financial', value: scores.financial, fullMark: 100 },
    { subject: 'Ethical', value: scores.ethical, fullMark: 100 },
    { subject: 'Execution', value: scores.execution, fullMark: 100 },
    { subject: 'Autonomy', value: scores.autonomy, fullMark: 100 },
    { subject: 'Impact', value: scores.impact, fullMark: 100 },
  ];

  // Map risk level to premium styling colors and borders using Bold Typography theme palette
  const getLevelStyles = (lvl: RiskLevel) => {
    switch (lvl) {
      case RiskLevel.LOW:
        return {
          bg: "bg-[#34C759]/10 border-[#34C759] text-[#34C759]",
          accent: "#34C759",
          text: "text-[#34C759]"
        };
      case RiskLevel.GUARDED:
        return {
          bg: "bg-sky-500/10 border-sky-500 text-sky-400",
          accent: "#0ea5e9",
          text: "text-sky-400"
        };
      case RiskLevel.ELEVATED:
        return {
          bg: "bg-[#FFCC00]/10 border-[#FFCC00] text-[#FFCC00]",
          accent: "#FFCC00",
          text: "text-[#FFCC00]"
        };
      case RiskLevel.HIGH:
        return {
          bg: "bg-[#FF3B30]/10 border-[#FF3B30] text-[#FF3B30]",
          accent: "#FF3B30",
          text: "text-[#FF3B30]"
        };
      case RiskLevel.CRITICAL:
        return {
          bg: "bg-[#FF3B30]/20 border-[#FF3B30] text-[#FF3B30] animate-pulse",
          accent: "#FF3B30",
          text: "text-[#FF3B30]"
        };
      default:
        return {
          bg: "bg-neutral-800 border-neutral-700 text-neutral-400",
          accent: "#888888",
          text: "text-neutral-400"
        };
    }
  };

  const levelStyles = getLevelStyles(level);

  return (
    <div className="bg-[#050505] border border-[#333] p-6 rounded-none flex flex-col h-full justify-between shadow-none" id="risk-radar-panel">
      <div className="flex justify-between items-baseline mb-6">
        <div>
          <h2 className="text-[11px] font-sans tracking-[0.2em] text-[#666] uppercase font-bold">Assessment Engines</h2>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1">Live Risk Vectors</h3>
        </div>
        <div className={`px-3 py-1 font-sans text-xs border font-black uppercase tracking-widest select-none ${levelStyles.bg}`}>
          {level} ({maxScore}/100)
        </div>
      </div>

      {/* Radar Chart Container */}
      <div className="h-64 w-full flex items-center justify-center relative bg-[#0a0a0a] rounded-none p-2 border border-[#222]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#222" strokeWidth={1} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: '#444444', fontSize: 8 }}
              axisLine={false}
            />
            <Radar
              name="Risk Value"
              dataKey="value"
              stroke={levelStyles.accent}
              fill={levelStyles.accent}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Numerical breakdown with metric visualizers */}
      <div className="grid grid-cols-2 gap-2.5 mt-5">
        {chartData.map((item) => (
          <div key={item.subject} className="bg-[#050505] p-3 border border-[#222] flex flex-col justify-between">
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-[#888]">{item.subject}</span>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="w-full bg-[#111] h-[3px] overflow-hidden">
                <div 
                  className="h-full transition-all duration-500" 
                  style={{ 
                    width: `${item.value}%`, 
                    backgroundColor: item.value > 75 ? '#FF3B30' : item.value > 40 ? '#FFCC00' : '#34C759' 
                  }}
                />
              </div>
              <span className={`text-xs font-mono font-bold ${item.value > 75 ? 'text-[#FF3B30]' : item.value > 40 ? 'text-[#FFCC00]' : 'text-[#34C759]'}`}>
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
