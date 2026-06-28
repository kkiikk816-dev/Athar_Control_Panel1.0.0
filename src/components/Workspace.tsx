import React from 'react';
import { BaseContent, TableType } from '../types';
import { Copy, Check, X, SkipForward } from 'lucide-react';
import { cn } from '../lib/utils';

interface WorkspaceProps {
  data: BaseContent[];
  loading: boolean;
  error: string | null;
  activeTable: TableType;
  onUpdateStatus: (id: string, tags: string[], status: 'completed' | 'staged') => void;
}

const AI_PROMPT = `أنت خبير تصنيف بيانات إسلامية ومفسر وسوم (Tags). سأعطيك مصفوفة نصوص مع معرفاتها الفريدة. المطلوب منك حصراً إصدار مصفوفة بصيغة JSON مغلقة ومستقلة، بدون أي كلمات أو شروحات قبل أو بعد الكود.
القائمة المعتمدة للوسوم (اختر منها حصراً): [أخلاق، علم، جهل، عقل، بصيرة، فضل، تقوى، عبادات، مناجاة، قرآن، أهل_البيت، مواعظ، صبر، توكل، تفكير، حكمة، ذم_الدنيا، آخرة]. (يسمح لك بإضافة وسم واحد خارج القائمة فقط في حالات الضرورة القصوى).
الشروط الصارمة:
1. الـ ID ينقل كما هو حرفياً.
2. كل مادة تأخذ من 1 إلى 4 وسوم كحد أقصى.
3. الوسم يتكون من كلمة أو كلمتين كحد أقصى.
4. الهيكل المطلوب مخرجاته فقط: [{"id": "W000001", "tags": ["علم", "بصيرة"]}].

النصوص المرفقة:
`;

export function Workspace({ data, loading, error, activeTable, onUpdateStatus }: WorkspaceProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyToAI = () => {
    const itemsToClassify = data.map(item => ({ id: item.id, text: item.text }));
    const textToCopy = `${AI_PROMPT}\n${JSON.stringify(itemsToClassify, null, 2)}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRemoveTag = (item: BaseContent, tagToRemove: string) => {
    const newTags = (item.tags || []).filter(t => t !== tagToRemove);
    onUpdateStatus(item.id, newTags, 'completed');
  };

  const handleSkip = (item: BaseContent) => {
    onUpdateStatus(item.id, ['للمراجعة_اللاحقة'], 'staged');
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] glass-panel rounded-xl">
        <div className="text-red-400 text-center max-w-md p-6 bg-red-500/10 rounded-lg border border-red-500/20">
          <p className="font-medium mb-2">تنبيه النظام</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] glass-panel rounded-xl">
        <p className="text-slate-400">لا توجد بيانات متاحة أو تم الانتهاء من تصنيف جميع العناصر.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-hidden h-full">
      <div className="flex justify-between items-center px-2 shrink-0">
        <h2 className="text-lg font-medium text-slate-200">منطقة العمل الحية</h2>
        <button
          onClick={handleCopyToAI}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            copied 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" 
              : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-500/30"
          )}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'تم النسخ بنجاح' : 'نسخ الدفعة للذكاء الاصطناعي'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto pb-4 custom-scrollbar">
        {data.map((item) => (
          <div key={item.id} className="glass-card rounded-xl p-5 flex flex-col gap-3 group relative">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                {item.id}
              </span>
              
              <button 
                onClick={() => handleSkip(item)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1 text-slate-500 hover:text-amber-400 bg-slate-900/50 px-2 py-1 rounded border border-slate-800"
                title="تخطي للمراجعة لاحقاً"
              >
                <SkipForward size={12} />
                تخطي آمن
              </button>
            </div>
            
            <p className="text-slate-200 text-sm leading-relaxed">{item.text}</p>
            
            <div className="flex flex-wrap gap-2 mt-auto pt-2">
              {item.tags && item.tags.length > 0 ? (
                item.tags.map(tag => (
                  <div key={tag} className="flex items-center gap-1 bg-slate-800 border border-slate-700 text-emerald-300 text-xs px-2 py-1 rounded-full">
                    <span>{tag}</span>
                    <button 
                      onClick={() => handleRemoveTag(item, tag)}
                      className="hover:text-red-400 hover:bg-red-400/10 rounded-full p-0.5 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">غير مصنف...</span>
              )}
            </div>
            
            {item.tag_status === 'staged' && (
              <div className="absolute top-0 right-0 w-2 h-full bg-amber-500/50 rounded-r-xl"></div>
            )}
            {item.tag_status === 'completed' && (
              <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500/50 rounded-r-xl"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
