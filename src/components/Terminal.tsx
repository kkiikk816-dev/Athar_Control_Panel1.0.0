import React from 'react';
import { validateIncomingJSON } from '../lib/validator';
import { TableType, TABLES_CONFIG } from '../types';
import { TerminalSquare, Send } from 'lucide-react';
import { cn } from '../lib/utils';

interface TerminalProps {
  activeTable: TableType;
  onCommitBatch: (batch: {id: string, tags: string[]}[]) => Promise<void>;
}

export function Terminal({ activeTable, onCommitBatch }: TerminalProps) {
  const [input, setInput] = React.useState('');
  const [logs, setLogs] = React.useState<{type: 'success'|'error'|'warning', message: string}[]>([]);
  const [isCommitting, setIsCommitting] = React.useState(false);
  
  const terminalRef = React.useRef<HTMLDivElement>(null);

  const handleValidateAndCommit = async () => {
    if (!input.trim()) return;
    
    setLogs([]);
    const prefix = TABLES_CONFIG.find(t => t.value === activeTable)?.prefix || '';
    
    const result = validateIncomingJSON(input, prefix);
    setLogs(result.logs);
    
    if (result.valid && result.data) {
      setIsCommitting(true);
      try {
        await onCommitBatch(result.data);
        setLogs(prev => [...prev, { type: 'success', message: `تم رفع ${result.data?.length} عنصر بنجاح لقاعدة البيانات.` }]);
        setInput(''); // Clear on success
      } catch (error: any) {
        setLogs(prev => [...prev, { type: 'error', message: `[Database Error]: ${error.message}` }]);
      } finally {
        setIsCommitting(false);
      }
    }
  };

  React.useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel p-4 rounded-xl flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2 text-slate-200 font-medium shrink-0">
        <TerminalSquare size={18} className="text-emerald-400" />
        <h2>منطقة الاعتماد والترمينال</h2>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="الصق مخرجات الذكاء الاصطناعي (JSON) هنا..."
          className="w-full flex-1 bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-slate-300 font-mono text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none custom-scrollbar"
          dir="ltr"
        />
        
        <button
          onClick={handleValidateAndCommit}
          disabled={!input.trim() || isCommitting}
          className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCommitting ? (
             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <><Send size={16} /> فحص واعتماد</>
          )}
        </button>
      </div>

      <div 
        ref={terminalRef}
        className="terminal-box h-48 p-3 flex flex-col gap-1 overflow-y-auto"
        dir="ltr"
      >
        <div className="text-slate-500 text-xs mb-2">athar_terminal ~ % ready...</div>
        {logs.map((log, i) => (
          <div 
            key={i} 
            className={cn(
              "text-xs leading-relaxed font-mono break-words",
              log.type === 'error' ? 'text-red-400' :
              log.type === 'warning' ? 'text-amber-400' :
              'text-emerald-400'
            )}
          >
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
