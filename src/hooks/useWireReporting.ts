import { useMemo } from 'react';
import { useWireContacts } from './useWireContacts';
import { useWirePipeline, DEFAULT_STAGES } from './useWirePipeline';
import { useWireCampaigns } from './useWireCampaigns';
import { useWireCalendar } from './useWireCalendar';

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lastNMonths(n: number) {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function shortMonth(key: string) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('default', { month: 'short' });
}

export function useWireReporting() {
  const { contacts, loading: loadingContacts } = useWireContacts();
  const { opportunities, loading: loadingPipeline } = useWirePipeline();
  const { campaigns, loading: loadingCampaigns } = useWireCampaigns();
  const { appointments, loading: loadingCalendar } = useWireCalendar();

  const loading = loadingContacts || loadingPipeline || loadingCampaigns || loadingCalendar;

  const metrics = useMemo(() => {
    // ── Pipeline ──────────────────────────────────────────────
    const openDeals = opportunities.filter((o) => o.status === 'open');
    const wonDeals = opportunities.filter((o) => o.status === 'won');
    const totalPipelineValue = openDeals.reduce((s, o) => s + (o.value ?? 0), 0);
    const avgDealValue = openDeals.length > 0
      ? Math.round(totalPipelineValue / openDeals.length)
      : 0;

    // ── Pipeline by stage ─────────────────────────────────────
    const pipelineByStage = DEFAULT_STAGES.map((stage) => {
      const stageDeals = opportunities.filter((o) => o.stage_id === stage.id && o.status === 'open');
      return {
        stage: stage.name.replace(' Set', '').replace(' Made', ''),
        value: stageDeals.reduce((s, o) => s + (o.value ?? 0), 0),
        count: stageDeals.length,
        color: stage.color,
      };
    }).filter((s) => s.count > 0 || s.value > 0);

    // ── Lead sources ──────────────────────────────────────────
    const sourceCounts: Record<string, number> = {};
    for (const c of contacts) {
      const src = c.source ?? 'Other';
      sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
    }
    const leadSourceData = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // ── Tags breakdown ────────────────────────────────────────
    const tagCounts: Record<string, number> = {};
    for (const c of contacts) {
      for (const t of c.tags) {
        tagCounts[t] = (tagCounts[t] ?? 0) + 1;
      }
    }
    const tagData = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    // ── Monthly contacts trend (last 6 months) ─────────────────
    const months = lastNMonths(6);
    const contactsByMonth: Record<string, number> = {};
    for (const m of months) contactsByMonth[m] = 0;
    for (const c of contacts) {
      const k = monthKey(c.created_at);
      if (k in contactsByMonth) contactsByMonth[k]++;
    }
    const contactTrend = months.map((m) => ({
      month: shortMonth(m),
      contacts: contactsByMonth[m],
    }));

    // ── Campaign metrics ──────────────────────────────────────
    const sentCampaigns = campaigns.filter((c) => c.sent_count > 0);
    const totalSent = sentCampaigns.reduce((s, c) => s + c.sent_count, 0);
    const totalOpened = sentCampaigns.reduce((s, c) => s + c.open_count, 0);
    const totalClicked = sentCampaigns.reduce((s, c) => s + c.click_count, 0);
    const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    const avgClickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;

    // ── Appointments by status ────────────────────────────────
    const aptStatusCounts: Record<string, number> = {};
    for (const a of appointments) {
      aptStatusCounts[a.status] = (aptStatusCounts[a.status] ?? 0) + 1;
    }
    const appointmentData = Object.entries(aptStatusCounts).map(([status, count]) => ({
      status: status.replace('_', ' '),
      count,
    }));

    // ── Conversion rate (won / total closed) ──────────────────
    const closedDeals = opportunities.filter((o) => o.status === 'won' || o.status === 'lost');
    const conversionRate = closedDeals.length > 0
      ? Math.round((wonDeals.length / closedDeals.length) * 100)
      : 0;

    return {
      totalContacts: contacts.length,
      totalPipelineValue,
      avgDealValue,
      openDeals: openDeals.length,
      wonDeals: wonDeals.length,
      conversionRate,
      avgOpenRate,
      avgClickRate,
      totalCampaigns: campaigns.length,
      totalAppointments: appointments.length,
      pipelineByStage,
      leadSourceData,
      tagData,
      contactTrend,
      appointmentData,
    };
  }, [contacts, opportunities, campaigns, appointments]);

  return { metrics, loading };
}
