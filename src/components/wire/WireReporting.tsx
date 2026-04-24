import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { mockStats, mockOpportunities, mockCampaigns, mockAutomations } from './wireData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const leadSourceData = [
  { source: 'Website', count: 312 },
  { source: 'Referral', count: 248 },
  { source: 'Facebook', count: 189 },
  { source: 'Google', count: 156 },
  { source: 'Cold Call', count: 98 },
  { source: 'Other', count: 245 },
];

const conversionData = [
  { month: 'Oct', leads: 84, closed: 12 },
  { month: 'Nov', leads: 97, closed: 15 },
  { month: 'Dec', leads: 72, closed: 9 },
  { month: 'Jan', leads: 110, closed: 18 },
  { month: 'Feb', leads: 128, closed: 21 },
  { month: 'Mar', leads: 143, closed: 24 },
];

const pipelineByStage = [
  { stage: 'New Lead', value: 310000, count: 3 },
  { stage: 'Contacted', value: 425000, count: 1 },
  { stage: 'Appt Set', value: 380000, count: 1 },
  { stage: 'Offer', value: 890000, count: 1 },
  { stage: 'Contract', value: 520000, count: 1 },
];

const CHART_COLORS = ['#EAB308', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#6B7280'];

function MetricCard({
  title,
  value,
  delta,
  sub,
}: {
  title: string;
  value: string;
  delta?: number;
  sub?: string;
}) {
  const DeltaIcon = delta == null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {DeltaIcon && delta != null && (
          <div
            className={`flex items-center gap-1 text-xs mt-1 ${
              delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            <DeltaIcon className="h-3 w-3" />
            <span>
              {delta > 0 ? '+' : ''}
              {delta}% vs last month
            </span>
          </div>
        )}
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function WireReporting() {
  const totalPipelineValue = mockOpportunities.reduce((s, o) => s + (o.value ?? 0), 0);
  const avgDealValue = Math.round(totalPipelineValue / mockOpportunities.length);
  const topCampaign = mockCampaigns.find((c) => c.open_count > 0);
  const openRate = topCampaign
    ? Math.round((topCampaign.open_count / topCampaign.sent_count) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reporting</h1>
        <p className="text-sm text-muted-foreground mt-1">Performance overview · The Wire</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pipeline Value"
          value={`$${(totalPipelineValue / 1_000_000).toFixed(2)}M`}
          delta={12}
        />
        <MetricCard
          title="Avg Deal Value"
          value={`$${avgDealValue.toLocaleString()}`}
          delta={5}
        />
        <MetricCard
          title="Email Open Rate"
          value={`${openRate}%`}
          delta={3}
          sub={`${topCampaign?.name ?? ''}`}
        />
        <MetricCard
          title="Automation Rate"
          value={`${Math.round((224 / 277) * 100)}%`}
          delta={7}
          sub="277 enrolled"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lead → Close Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={conversionData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name="Leads"
                />
                <Line
                  type="monotone"
                  dataKey="closed"
                  stroke="#EAB308"
                  strokeWidth={2}
                  dot={false}
                  name="Closed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Source Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="count"
                >
                  {leadSourceData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {leadSourceData.map((item, i) => (
                <div key={item.source} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {item.source}
                  </div>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline by Stage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pipeline by Stage ($)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipelineByStage} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="value" fill="#EAB308" radius={[4, 4, 0, 0]} name="Value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Automations Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Automation Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={mockAutomations.map((a) => ({
                  name: a.name.split('—')[0].trim(),
                  enrolled: a.enrolled_count,
                  completed: a.completed_count,
                }))}
                margin={{ top: 5, right: 10, bottom: 0, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="enrolled" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Enrolled" />
                <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
