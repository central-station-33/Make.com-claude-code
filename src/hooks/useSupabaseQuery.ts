
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { withDatabaseRetry } from '@/utils/databaseRetry';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useSupabaseQuery<T>(
  key: string[],
  queryFn: (supabase: SupabaseClient) => Promise<{ data: T | null; error: PostgrestError | null }>,
  options?: Omit<UseQueryOptions<T, PostgrestError>, 'queryKey' | 'queryFn'>
) {
  const { toast } = useToast();

  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const result = await withDatabaseRetry(
        () => queryFn(supabase),
        {
          onRetry: (attempt, error) => {
            toast({
              title: 'Database operation failed',
              description: `Retrying... (Attempt ${attempt}/3)`,
              variant: 'destructive',
            });
          },
        }
      );

      if (result.error) {
        throw result.error;
      }

      return result.data as T;
    },
    ...options,
    retry: options?.retry ?? 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });
}
