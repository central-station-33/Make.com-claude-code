
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { withDatabaseRetry } from '@/utils/databaseRetry';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useSupabaseMutation<TData, TVariables>(
  mutationFn: (supabase: SupabaseClient, variables: TVariables) => Promise<{ data: TData | null; error: PostgrestError | null }>,
  options?: Omit<UseMutationOptions<TData, PostgrestError, TVariables>, 'mutationFn'>
) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const result = await withDatabaseRetry(
        () => mutationFn(supabase, variables),
        {
          onRetry: (attempt, error) => {
            toast({
              title: 'Operation failed',
              description: `Retrying... (Attempt ${attempt}/3)`,
              variant: 'destructive',
            });
          },
        }
      );

      if (result.error) {
        throw result.error;
      }

      return result.data as TData;
    },
    ...options,
    retry: options?.retry ?? 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });
}
