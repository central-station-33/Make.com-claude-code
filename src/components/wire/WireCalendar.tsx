import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ChevronLeft, ChevronRight, MapPin, Video, User } from 'lucide-react';
import { mockAppointments } from './wireData';
import type { WireAppointment } from '@/types/wire.types';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<WireAppointment['status'], string> = {
  scheduled: 'border-blue-400 text-blue-700 bg-blue-50',
  confirmed: 'border-green-400 text-green-700 bg-green-50',
  cancelled: 'border-red-400 text-red-700 bg-red-50',
  completed: 'border-gray-400 text-gray-600 bg-gray-50',
  no_show: 'border-orange-400 text-orange-700 bg-orange-50',
};

function AppointmentCard({ apt }: { apt: WireAppointment }) {
  const start = new Date(apt.start_time);
  const end = new Date(apt.end_time);
  const duration = Math.round((end.getTime() - start.getTime()) / 60000);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="min-w-[60px] text-center">
            <p className="text-lg font-bold leading-none">{start.getDate()}</p>
            <p className="text-xs text-muted-foreground uppercase">
              {start.toLocaleString('default', { month: 'short' })}
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm">{apt.title}</p>
              <Badge
                variant="outline"
                className={cn('capitalize text-xs shrink-0', STATUS_COLORS[apt.status])}
              >
                {apt.status}
              </Badge>
            </div>
            <div className="mt-1.5 space-y-1">
              <p className="text-xs text-muted-foreground">
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({duration} min)
              </p>
              {apt.assigned_to && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {apt.assigned_to}
                </div>
              )}
              {apt.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {apt.location}
                </div>
              )}
              {apt.meeting_link && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Video className="h-3 w-3" />
                  Virtual Meeting
                </div>
              )}
              {apt.contact && (
                <p className="text-xs text-muted-foreground">
                  Contact: {apt.contact.first_name} {apt.contact.last_name}
                  {apt.contact.phone ? ` · ${apt.contact.phone}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeekCalendar({ appointments }: { appointments: WireAppointment[] }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayAppts = appointments.filter((a) => {
          const d = new Date(a.start_time);
          return (
            d.getDate() === day.getDate() &&
            d.getMonth() === day.getMonth() &&
            d.getFullYear() === day.getFullYear()
          );
        });
        const isToday =
          day.toDateString() === today.toDateString();

        return (
          <div key={day.toISOString()} className="min-h-[120px]">
            <div
              className={cn(
                'text-center py-2 mb-2 rounded-lg',
                isToday ? 'bg-yellow-400 text-gray-900' : 'bg-gray-50'
              )}
            >
              <p className="text-xs font-medium uppercase">
                {day.toLocaleString('default', { weekday: 'short' })}
              </p>
              <p className="text-lg font-bold leading-tight">{day.getDate()}</p>
            </div>
            <div className="space-y-1">
              {dayAppts.map((apt) => (
                <div
                  key={apt.id}
                  className={cn(
                    'text-xs px-2 py-1.5 rounded border truncate cursor-pointer',
                    STATUS_COLORS[apt.status]
                  )}
                  title={apt.title}
                >
                  {new Date(apt.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  {apt.title}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WireCalendar() {
  const [calView, setCalView] = useState<'week' | 'list'>('week');

  const upcoming = [...mockAppointments].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mockAppointments.length} upcoming appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setCalView('week')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                calView === 'week' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
              )}
            >
              Week
            </button>
            <button
              onClick={() => setCalView('list')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                calView === 'list' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
              )}
            >
              List
            </button>
          </div>
          <Button size="sm" className="bg-gray-900 hover:bg-gray-700 text-white gap-1.5">
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {calView === 'week' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="font-medium text-sm">
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <WeekCalendar appointments={mockAppointments} />
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} />
          ))}
        </div>
      )}
    </div>
  );
}
