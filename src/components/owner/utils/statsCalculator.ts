import { LeadWithProfile } from "@/types/lead";

export const calculateLeadStats = (leads: LeadWithProfile[]) => {
  if (!Array.isArray(leads)) {
    console.warn('Invalid leads data provided to calculateLeadStats');
    return {
      totalLeads: 0,
      activeLeads: 0,
      assignedLeads: 0,
      conversionRate: 0
    };
  }

  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => l.status !== 'Lost' && l.status !== 'Closed').length;
  const closedLeads = leads.filter(l => l.status === 'Closed').length;
  const assignedLeads = leads.filter(l => l.agent_id).length;
  const conversionRate = totalLeads ? Math.round((closedLeads / totalLeads) * 100) : 0;

  return {
    totalLeads,
    activeLeads,
    assignedLeads,
    conversionRate
  };
};