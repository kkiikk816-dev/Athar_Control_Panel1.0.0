import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TableType, BaseContent, Progress } from '../types';

export function useData(activeTable: TableType, batchSize: number, showOnlyPending: boolean) {
  const [data, setData] = useState<BaseContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch user progress
  const fetchProgress = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: progressData, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (!error && progressData) {
        setProgress(progressData);
      }
    } catch (e) {
      // Ignore progress error
    }
  };

  const fetchStats = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setTotalCount(0);
      setPendingCount(0);
      return;
    }
    try {
      // Total count
      const { count: total, error: totalErr } = await supabase
        .from(activeTable)
        .select('*', { count: 'exact', head: true });
        
      if (totalErr) throw totalErr;
        
      let pending = 0;
      
      // Pending count
      const { count: pendingCountVal, error: pendingErr } = await supabase
        .from(activeTable)
        .select('*', { count: 'exact', head: true })
        .eq('tag_status', 'pending');
        
      if (pendingErr) {
        if (pendingErr.code === '42703') {
           // column tag_status does not exist, use tags fallback
           const { count: fallbackPending } = await supabase
             .from(activeTable)
             .select('*', { count: 'exact', head: true })
             .filter('tags', 'eq', '{}');
           pending = fallbackPending || 0;
        } else {
           throw pendingErr;
        }
      } else {
        pending = pendingCountVal || 0;
      }
        
      setTotalCount(total || 0);
      setPendingCount(pending);
    } catch (e) {
      // Ignore stat error
    }
  }, [activeTable]);

  const fetchData = useCallback(async (startId?: string) => {
    if (!isSupabaseConfigured) {
      setError("يرجى إعداد مفاتيح Supabase في المتغيرات البيئية (VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY).");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      let query = supabase
        .from(activeTable)
        .select('*');

      if (showOnlyPending) {
        query = query.eq('tag_status', 'pending');
      }

      if (startId) {
        query = query.gte('id', startId);
      }

      query = query.order('id', { ascending: true }).limit(batchSize);

      const { data: resultData, error: err } = await query;
      
      if (err) {
        if (err.code === '42703' && showOnlyPending) {
          // Fallback if tag_status is missing
          let fallbackQuery = supabase.from(activeTable).select('*').filter('tags', 'eq', '{}');
          if (startId) fallbackQuery = fallbackQuery.gte('id', startId);
          fallbackQuery = fallbackQuery.order('id', { ascending: true }).limit(batchSize);
          
          const { data: fallbackData, error: fallbackErr } = await fallbackQuery;
          if (fallbackErr) throw fallbackErr;
          setData(fallbackData as BaseContent[] || []);
          return;
        }
        throw err;
      }
      
      setData(resultData as BaseContent[] || []);
    } catch (e: any) {
      setError(`خطأ في جلب البيانات: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeTable, batchSize, showOnlyPending]);

  const updateItemStatus = async (id: string, tags: string[], status: 'completed' | 'staged') => {
    if (!isSupabaseConfigured) return;
    try {
      const { error: err } = await supabase
        .from(activeTable)
        .update({ tags, tag_status: status })
        .eq('id', id);
        
      if (err) {
        if (err.code === '42703') {
          // Fallback if tag_status is missing
          const { error: fallbackErr } = await supabase
            .from(activeTable)
            .update({ tags })
            .eq('id', id);
          if (fallbackErr) throw fallbackErr;
        } else {
          throw err;
        }
      }
      
      // Remove from local data if successful and we only show pending
      if (showOnlyPending && status !== 'pending') {
        setData(prev => prev.filter(item => item.id !== id));
      } else {
        setData(prev => prev.map(item => item.id === id ? { ...item, tags, tag_status: status } : item));
      }
      
      fetchStats();
      
    } catch (e: any) {
      setError(`خطأ في تحديث العنصر: ${e.message}`);
    }
  };

  const updateBatch = async (batch: {id: string, tags: string[]}[]) => {
    if (!isSupabaseConfigured) {
      setError("لا يمكن التحديث. يرجى إعداد Supabase.");
      return;
    }
    setLoading(true);
    try {
      // Supabase JS doesn't have bulk update easily unless using a stored procedure or upsert.
      // We will do parallel updates for simplicity in this prototype.
      const promises = batch.map(async (item) => {
        const { error: err } = await supabase
          .from(activeTable)
          .update({ tags: item.tags, tag_status: 'completed' })
          .eq('id', item.id);
          
        if (err && err.code === '42703') {
           return supabase
             .from(activeTable)
             .update({ tags: item.tags })
             .eq('id', item.id);
        } else if (err) {
           throw err;
        }
      });
      
      await Promise.all(promises);
      
      // Update progress
      if (batch.length > 0) {
        const lastId = batch[batch.length - 1].id;
        const progressField = `last_${activeTable.slice(0, -1)}_id`;
        
        await supabase
          .from('user_progress')
          .update({ [progressField]: lastId, updated_at: new Date().toISOString() })
          .eq('id', 1);
      }
      
      fetchData(); // Refresh data
      fetchStats();
    } catch (e: any) {
      setError(`خطأ في تحديث الدفعة: ${e.message}`);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  useEffect(() => {
    fetchStats();
    fetchData();
  }, [fetchData, fetchStats]);

  return {
    data,
    loading,
    error,
    progress,
    totalCount,
    pendingCount,
    fetchData,
    updateItemStatus,
    updateBatch
  };
}
