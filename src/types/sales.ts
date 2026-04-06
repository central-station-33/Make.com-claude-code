
import { Lead } from "./lead";

export interface SalesProposal {
  id: string;
  lead_id: string;
  proposal_details: Record<string, any>;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Negotiating';
  created_at: string;
  updated_at: string;
}

export interface SalesNegotiation {
  id: string;
  proposal_id: string;
  notes: string | null;
  status: 'In Negotiation' | 'Accepted' | 'Rejected';
  created_at: string;
  updated_at: string;
}

export interface ClosedDeal {
  id: string;
  lead_id: string;
  deal_amount: number | null;
  closed_at: string;
  created_at: string;
}

export interface SalesFunnelStats {
  totalLeads: number;
  proposalsSent: number;
  inNegotiation: number;
  closedDeals: number;
  conversionRate: number;
}

export interface SalesFunnelError {
  message: string;
  details?: any;
}

export interface SalesFunnelData {
  leads: Lead[];
  proposals: SalesProposal[];
  negotiations: SalesNegotiation[];
  closedDeals: ClosedDeal[];
  stats: SalesFunnelStats;
  isLoading: boolean;
  error: SalesFunnelError | null;
}
