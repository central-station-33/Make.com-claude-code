import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MessageSquare,
  KanbanSquare,
  CalendarDays,
  Zap,
  ArrowUp,
  DollarSign,
} from 'lucide-react';
import { mockStats, mockAppointments, mockConversations, mockOpportunities } from './wireData';
import { useWireContacts } from '@/hooks/useWireContacts';

function StatCard({
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
            {sub && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3" />
                {sub}
              </p>
            )}
          </div>
          <div className={`rounded-xl p-3 ${accent ?? 'bg-gray-100'}`}>
            <Icon className="h-5 w-5 text-gray-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WireDashboard() {
  const { contacts } = useWireContacts();
  const todayAppts = mockAppointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'scheduled'
  );
  const unread = mockConversations.filter((c) => c.unread_count > 0);
  const liveContactCount = contacts.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Agent workspace overview — The Wire
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Contacts"
          value={liveContactCount.toLocaleString()}
          sub={liveContactCount > 0 ? 'live from database' : 'Add your first contact'}
          icon={Users}
          accent="bg-blue-100"
        />
        <StatCard
          title="Open Conversations"
          value={mockStats.open_conversations}
          sub={`${mockStats.unread_messages} unread`}
          icon={MessageSquare}
          accent="bg-purple-100"
        />
        <StatCard
          title="Pipeline Value"
          value={`$${(mockStats.pipeline_value / 1_000_000).toFixed(1)}M`}
          sub={`${mockStats.open_opportunities} open deals`}
          icon={DollarSign}
          accent="bg-yellow-100"
        />
        <StatCard
          title="Appointments Today"
          value={mockStats.appointments_today}
          sub={`${mockStats.active_automations} automations active`}
          icon={CalendarDays}
          accent="bg-green-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppts.length === 0 && (
              <p className="text-sm text-muted-foreground">No appointments today.</p>
            )}
            {todayAppts.map((apt) => (
              <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="min-w-[52px] text-center">
                  <p className="text-xs font-bold text-gray-700">
                    {new Date(apt.start_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{apt.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {apt.assigned_to} · {apt.location ?? apt.meeting_link ?? 'TBD'}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    apt.status === 'confirmed'
                      ? 'border-green-400 text-green-700'
                      : 'border-blue-400 text-blue-700'
                  }
                >
                  {apt.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Unread Conversations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Unread Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unread.length === 0 && (
              <p className="text-sm text-muted-foreground">All caught up!</p>
            )}
            {unread.map((conv) => (
              <div key={conv.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="h-9 w-9 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {conv.contact?.first_name?.[0]}
                  {conv.contact?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {conv.contact?.first_name} {conv.contact?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="h-5 w-5 rounded-full bg-yellow-400 text-gray-900 text-xs font-bold flex items-center justify-center">
                    {conv.unread_count}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {conv.channel}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pipeline Snapshot */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <KanbanSquare className="h-4 w-4" />
              Top Pipeline Deals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockOpportunities.slice(0, 4).map((opp) => (
              <div key={opp.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{opp.name}</p>
                  <p className="text-xs text-muted-foreground">{opp.assigned_to}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    ${opp.value?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Automation Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automation Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Enrolled</span>
              <span className="font-semibold">277</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-semibold text-green-600">224</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active Automations</span>
              <span className="font-semibold">3</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ width: `${Math.round((224 / 277) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((224 / 277) * 100)}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
