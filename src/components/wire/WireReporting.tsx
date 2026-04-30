import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { TrendingUp, Users, DollarSign, Mail, CalendarDays, KanbanSquare, Tag } from 'lucide-react';
import { useWireReporting } from '@/hooks/useWireReporting';

const CHART_COLORS = ['#EAB308', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#6B7280'];

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`rounded-xl p-3 ${accent ?? 'bg-gray-100'}`}>
            <Icon className="h-5 w-5 text-gray-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ h = 200 }: { h?: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height: h }} />;
}

export function WireReporting() {
  const { metrics, loading } = useWireReporting();

  const {
    totalContacts,
    totalPipelineValue,
    avgDealValue,
    openDeals,
    conversionRate,
    avgOpenRate,
    avgClickRate,
    totalAppointments,
    pipelineByStage,
    leadSourceData,
    tagData,
    contactTrend,
    appointmentData,
  } = metrics;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reporting</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live performance overview · The Wire
          {loading && <span className="ml-2 text-xs text-yellow-600">Loading...</span>}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <KpiCard
              title="Total Contacts"
              value={totalContacts.toLocaleString()}
              sub="in database"
              icon={Users}
              accent="bg-blue-100"
            />
            <KpiCard
              title="Pipeline Value"
              value={totalPipelineValue >= 1_000_000
                ? `$${(totalPipelineValue / 1_000_000).toFixed(2)}M`
                : `$${totalPipelineValue.toLocaleString()}`}
              sub={`${openDeals} open deals · avg $${avgDealValue.toLocaleString()}`}
              icon={DollarSign}
              accent="bg-yellow-100"
            />
            <KpiCard
              title="Email Open Rate"
              value={`${avgOpenRate}%`}
              sub={`${avgClickRate}% click-through`}
              icon={Mail}
              accent="bg-purple-100"
            />
            <KpiCard
              title="Deal Win Rate"
              value={`${conversionRate}%`}
              sub={`${totalAppointments} total appointments`}
              icon={TrendingUp}
              accent="bg-green-100"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Growth Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              New Contacts — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <ChartSkeleton /> : contactTrend.every((d) => d.contacts === 0) ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                No contact data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={contactTrend} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="contacts"
                    stroke="#EAB308"
                    strokeWidth={2.5}
                    dot={{ fill: '#EAB308', r: 4 }}
                    name="New Contacts"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lead Source Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Lead Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <ChartSkeleton h={180} /> : leadSourceData.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                No lead source data yet
              </div>
            ) : (
              <div className="flex items-center gap-4">
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
                <div className="space-y-1.5 flex-1">
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline by Stage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <KanbanSquare className="h-4 w-4" />
              Pipeline by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <ChartSkeleton /> : pipelineByStage.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                No pipeline data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pipelineByStage} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`
                    }
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Value">
                    {pipelineByStage.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Contact Tags */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Contacts by Tag
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <ChartSkeleton /> : tagData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                No tag data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={tagData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, bottom: 0, left: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="tag" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#EAB308" radius={[0, 4, 4, 0]} name="Contacts" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Appointment breakdown */}
        {appointmentData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Appointments by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={appointmentData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Appointments" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
