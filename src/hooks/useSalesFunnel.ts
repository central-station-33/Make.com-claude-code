
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/lead";
import { SalesProposal, SalesNegotiation, ClosedDeal, SalesFunnelStats, SalesFunnelData, SalesFunnelError } from "@/types/sales";
import { useToast } from "@/hooks/use-toast";

export const useSalesFunnel = (): SalesFunnelData => {
  const { toast } = useToast();

  const { data: leads = [], isLoading: leadsLoading, error: leadsError } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching leads:", error);
        throw error;
      }

      return data as Lead[];
    },
  });

  const { data: proposals = [], isLoading: proposalsLoading, error: proposalsError } = useQuery({
    queryKey: ["proposals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching proposals:", error);
        throw error;
      }

      return data as SalesProposal[];
    },
  });

  const { data: negotiations = [], isLoading: negotiationsLoading, error: negotiationsError } = useQuery({
    queryKey: ["negotiations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("negotiations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching negotiations:", error);
        throw error;
      }

      return data as SalesNegotiation[];
    },
  });

  const { data: closedDeals = [], isLoading: dealsLoading, error: dealsError } = useQuery({
    queryKey: ["closed_deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("closed_deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching closed deals:", error);
        throw error;
      }

      return data as ClosedDeal[];
    },
  });

  const calculateStats = (): SalesFunnelStats => {
    const totalLeads = leads.length;
    const proposalsSent = proposals.length;
    const inNegotiation = negotiations.filter(n => n.status === 'In Negotiation').length;
    const closedDealsCount = closedDeals.length;
    
    return {
      totalLeads,
      proposalsSent,
      inNegotiation,
      closedDeals: closedDealsCount,
      conversionRate: totalLeads ? (closedDealsCount / totalLeads) * 100 : 0
    };
  };

  const isLoading = leadsLoading || proposalsLoading || negotiationsLoading || dealsLoading;
  const error = leadsError || proposalsError || negotiationsError || dealsError;

  const formatError = (error: any): SalesFunnelError | null => {
    if (!error) return null;
    return {
      message: error.message || 'An unexpected error occurred',
      details: error
    };
  };

  return {
    leads,
    proposals,
    negotiations,
    closedDeals,
    stats: calculateStats(),
    isLoading,
    error: formatError(error),
  };
};
