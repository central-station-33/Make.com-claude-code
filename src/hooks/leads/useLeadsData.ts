import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/lead';
import { useToast } from '@/hooks/use-toast';

export const useLeadsData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchLeads = async (
    statusFilter: string = 'all',
    typeFilter: string = 'all',
    sortField: keyof Lead = 'created_at',
    sortDirection: 'asc' | 'desc' = 'desc'
  ) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          profiles:agent_id(*),
          crm_contacts(*)
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as Lead[];
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        variant: "destructive",
        title: "Error loading leads",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchLeads,
    isLoading
  };
};