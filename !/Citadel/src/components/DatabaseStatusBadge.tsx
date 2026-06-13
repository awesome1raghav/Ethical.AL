import React, { useEffect, useState } from 'react';
import { Database, Cpu, ShieldCheck } from 'lucide-react';
import { DbStatus } from '../types';

export default function DatabaseStatusBadge() {
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [modelInfo, setModelInfo] = useState<{ model: string; role: string; hasKey: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/db-status')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(err => console.error(err));

    fetch('/api/model-info')
      .then(res => res.json())
      .then(data => setModelInfo(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div id="db-status-badge-container" className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-[#E4E3E0] border-2 border-[#141414] rounded-none divide-y md:divide-y-0 md:divide-x divide-[#141414] mb-4">
      {/* DB STAGE */}
      <div className="flex items-center gap-3 p-4">
        <div className="p-2 bg-[#141414] text-[#E4E3E0] rounded-none">
          <Database className="w-4 h-4" />
        </div>
        <div>
          <p className="font-serif-italic text-xs opacity-60 leading-none mb-1">Storage Node Engine</p>
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${dbStatus?.connected ? 'bg-green-700 animate-pulse' : 'bg-amber-600'}`} />
            <span className="text-xs font-bold font-mono text-[#141414] uppercase">
              {dbStatus?.connected ? 'MONGODB_SECURE_NODE' : 'FAIL_SAFE_JSON_FS'}
            </span>
          </div>
        </div>
      </div>

      {/* MODEL STAGE */}
      <div className="flex items-center gap-3 p-4">
        <div className="p-2 bg-[#141414] text-[#E4E3E0] rounded-none">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <p className="font-serif-italic text-xs opacity-60 leading-none mb-1">Kernel Model Access</p>
          <p className="text-xs font-bold font-mono text-[#141414] uppercase">
            {modelInfo?.model || 'GEMINI-3.5-FLASH'} {modelInfo?.hasKey ? '(LIVE_ACCESS)' : '(SIMULATION)'}
          </p>
        </div>
      </div>

      {/* ACTIVE LABELS CONTAINER */}
      <div className="flex items-center justify-between p-4 bg-[#141414] text-[#E4E3E0]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span className="font-mono text-[10px] tracking-widest font-bold uppercase">
            CITADEL WORKSPACE CONFINED
          </span>
        </div>
        <div className="bg-green-700 text-white px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-none">
          OPERATIONAL
        </div>
      </div>
    </div>
  );
}
