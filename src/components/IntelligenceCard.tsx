"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntelligenceCardProps {
  text: string;
}

export const IntelligenceCard: React.FC<IntelligenceCardProps> = ({ text }) => {
  const getIntent = (t: string) => {
    if (!t) return "—";
    const low = t.toLowerCase();
    if (low.includes("data") || low.includes("analyze")) return "Data Synthesis";
    if (low.includes("market") || low.includes("trend")) return "Market Intelligence";
    if (low.includes("write") || low.includes("generate")) return "Content Creation";
    if (low.includes("safety") || low.includes("ethic")) return "Policy Audit";
    return "Analyzing intent...";
  };

  const stats = [
    { label: "Detected Intent", value: getIntent(text), threshold: 1 },
    { label: "Estimated Agents", value: "3 agents", threshold: 20 },
    { label: "Estimated Duration", value: "~5 min", threshold: 30 },
    { label: "Risk Level", value: "Low", threshold: 10, highlight: "#DCC3AA" },
    { label: "Policy Pre-Check", value: "✓ Permitted", threshold: 15 },
    { label: "Confidence Score", value: "94%", threshold: 40 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="preview-card-bg w-full max-w-sm rounded-[10px] border border-[rgba(220,195,170,0.12)] p-6 shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#F1E2D1] font-body">Mission Intelligence</h3>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-1.5 w-1.5 rounded-full bg-[#810B38]"
        />
      </div>

      <div className="space-y-5">
        {stats.map((stat, i) => {
          const isVisible = text.length >= stat.threshold;
          return (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#8b949e] uppercase tracking-wider">
                {stat.label}
              </span>
              <AnimatePresence mode="wait">
                {isVisible ? (
                  <motion.span
                    key="visible"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium text-[#F1E2D1]"
                    style={{ color: stat.highlight || "#F1E2D1" }}
                  >
                    {stat.value}
                  </motion.span>
                ) : (
                  <motion.span
                    key="hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium text-[#F1E2D1]/30"
                  >
                    —
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
