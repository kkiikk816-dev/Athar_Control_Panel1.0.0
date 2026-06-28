import React from 'react';
import { TABLES_CONFIG, TableType } from '../types';
import { Database, Filter, Search, Activity, Layers } from 'lucide-react';
import { cn } from '../lib/utils';

interface ControlBarProps {
  activeTable: TableType;
  setActiveTable: (table: TableType) => void;
  batchSize: number;
  setBatchSize: (size: number) => void;
  showOnlyPending: boolean;
  setShowOnlyPending: (show: boolean) => void;
  totalCount: number;
  pendingCount: number;
  onJumpToId: (id: string) => void;
}

export function ControlBar({
  activeTable,
  setActiveTable,
  batchSize,
  setBatchSize,
  showOnlyPending,
  setShowOnlyPending,
  totalCount,
  pendingCount,
  onJumpToId
}: ControlBarProps) {
  const [jumpId, setJumpId] = React.useState('');
  
  const completedCount = totalCount - pendingCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumpId.trim()) return;
    
    // Auto format jump ID based on active table prefix
    const prefix = TABLES_CONFIG.find(t => t.value === activeTable)?.prefix || '';
    
    let formattedId = jumpId.trim().toUpperCase();
    if (/^\d+$/.test(formattedId)) {
      // It's just numbers, pad and add prefix
      formattedId = `${prefix}${formattedId.padStart(6, '0')}`;
    }
    
    onJumpToId(formattedId);
    setJumpId('');
  };

  return (
    <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between relative z-10 w-full">
      
      {/* Table Selector */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="bg-slate-800 p-2 rounded-lg text-emerald-400">
          <Database size={20} />
        </div>
        <select
          value={activeTable}
          onChange={(e) => setActiveTable(e.target.value as TableType)}
          className="bg-slate-800/50 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2 outline-none"
        >
          {TABLES_CONFIG.map(table => (
            <option key={table.value} value={table.value}>{table.label}</option>
          ))}
        </select>
      </div>

      {/* Progress & Stats */}
      <div className="flex-1 w-full flex flex-col gap-1 px-4 border-l border-r border-slate-800">
        <div className="flex justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1"><Activity size={12}/> الإنجاز الكلي</span>
          <span>{completedCount.toLocaleString()} / {totalCount.toLocaleString()} ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5">
          <div 
            className="bg-emerald-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
        
        {/* Batch Size */}
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-slate-400"/>
          <select
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="bg-slate-800/50 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2 outline-none w-20"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowOnlyPending(!showOnlyPending)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm whitespace-nowrap",
            showOnlyPending 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200"
          )}
        >
          <Filter size={16} />
          {showOnlyPending ? 'غير المصنف فقط' : 'عرض الكل'}
        </button>

        {/* Jump ID */}
        <form onSubmit={handleJumpSubmit} className="relative">
          <input
            type="text"
            value={jumpId}
            onChange={(e) => setJumpId(e.target.value)}
            placeholder="القفز لمعرف..."
            className="bg-slate-800/50 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-32 p-2 pr-8 outline-none"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400">
            <Search size={14} />
          </button>
        </form>

      </div>
    </div>
  );
}
