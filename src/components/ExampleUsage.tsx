
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/useSupabaseMutation';

export function ExampleComponent() {
  // Example query with retry logic
  const { data, isLoading } = useSupabaseQuery(
    ['example-data'],
    async (supabase) => await supabase.from('your_table').select('*')
  );

  // Example mutation with retry logic
  const { mutate } = useSupabaseMutation(
    async (supabase, newData: any) => 
      await supabase.from('your_table').insert(newData)
  );

  // ... rest of your component logic
}
