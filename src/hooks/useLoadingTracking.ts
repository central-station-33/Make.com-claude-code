
import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useLoadingTracking = (componentPath: string) => {
  const { session } = useAuth();
  const loadingId = useRef<string>();
  
  const startLoading = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('loading_performance_logs')
        .insert({
          component_path: componentPath,
          user_id: session?.user?.id,
          start_time: new Date().toISOString(),
          page_url: window.location.pathname,
          success: null
        })
        .select('id')
        .single();

      if (error) throw error;
      loadingId.current = data.id;
    } catch (err) {
      console.error('Failed to log loading start:', err);
    }
  }, [componentPath, session?.user?.id]);

  const endLoading = useCallback(async (success: boolean, error?: Error) => {
    if (!loadingId.current) return;

    try {
      await supabase
        .from('loading_performance_logs')
        .update({
          end_time: new Date().toISOString(),
          success,
          error_message: error?.message
        })
        .eq('id', loadingId.current);
    } catch (err) {
      console.error('Failed to log loading end:', err);
    }
  }, []);

  useEffect(() => {
    return () => {
      // Handle unmount before loading completes
      if (loadingId.current) {
        endLoading(false, new Error('Component unmounted during loading'));
      }
    };
  }, [endLoading]);

  return {
    startLoading,
    endLoading
  };
};
