import React from 'react';
import { ControlBar } from './components/ControlBar';
import { Workspace } from './components/Workspace';
import { Terminal } from './components/Terminal';
import { useData } from './hooks/useData';
import { TableType } from './types';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [activeTable, setActiveTable] = React.useState<TableType>('wisdoms');
  const [batchSize, setBatchSize] = React.useState(15);
  const [showOnlyPending, setShowOnlyPending] = React.useState(true);

  // When changing to hadiths, cap batch size at 15
  React.useEffect(() => {
    if (activeTable === 'hadiths' && batchSize > 15) {
      setBatchSize(15);
    }
  }, [activeTable, batchSize]);

  const {
    data,
    loading,
    error,
    totalCount,
    pendingCount,
    fetchData,
    updateItemStatus,
    updateBatch
  } = useData(activeTable, batchSize, showOnlyPending);

  const handleJumpToId = (id: string) => {
    fetchData(id);
  };

  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-[1600px] p-4 lg:p-6">
      
      {/* Header */}
      <header className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Sparkles className="text-emerald-400" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">أثَر | <span className="text-slate-400 font-normal">Control Panel</span></h1>
            <p className="text-xs text-slate-500 mt-0.5">منصة تصنيف المحتوى الإسلامي</p>
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <div className="shrink-0 mb-6">
        <ControlBar 
          activeTable={activeTable}
          setActiveTable={setActiveTable}
          batchSize={batchSize}
          setBatchSize={setBatchSize}
          showOnlyPending={showOnlyPending}
          setShowOnlyPending={setShowOnlyPending}
          totalCount={totalCount}
          pendingCount={pendingCount}
          onJumpToId={handleJumpToId}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Workspace Zone */}
        <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-0 overflow-hidden">
          <Workspace 
            data={data}
            loading={loading}
            error={error}
            activeTable={activeTable}
            onUpdateStatus={updateItemStatus}
          />
        </div>

        {/* Staging & Terminal Zone */}
        <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col shrink-0 min-h-[500px] lg:min-h-0">
          <Terminal 
            activeTable={activeTable}
            onCommitBatch={updateBatch}
          />
        </div>
        
      </div>
    </div>
  );
}
