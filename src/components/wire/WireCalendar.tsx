import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Video,
  User,
  MoreHorizontal,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWireCalendar, type AppointmentFormData } from '@/hooks/useWireCalendar';
import { useWireContacts } from '@/hooks/useWireContacts';
import { AppointmentDialog } from './AppointmentDialog';
import type { WireAppointment } from '@/types/wire.types';

const STATUS_COLORS: Record<WireAppointment['status'], string> = {
  scheduled: 'border-blue-400 text-blue-700 bg-blue-50',
  confirmed:  'border-green-400 text-green-700 bg-green-50',
  cancelled:  'border-red-400 text-red-700 bg-red-50',
  completed:  'border-gray-400 text-gray-600 bg-gray-50',
  no_show:    'border-orange-400 text-orange-700 bg-orange-50',
};

const STATUS_OPTIONS: WireAppointment['status'][] = ['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'];

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

interface AppointmentCardProps {
  apt: WireAppointment;
  contactName: string;
  onEdit: (a: WireAppointment) => void;
  onDelete: (a: WireAppointment) => void;
  onStatusChange: (id: string, status: WireAppointment['status']) => void;
}

function AppointmentCard({ apt, contactName, onEdit, onDelete, onStatusChange }: AppointmentCardProps) {
  const start = new Date(apt.start_time);
  const end = new Date(apt.end_time);
  const duration = Math.round((end.getTime() - start.getTime()) / 60000);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="min-w-[56px] text-center shrink-0">
            <p className="text-lg font-bold leading-none">{start.getDate()}</p>
            <p className="text-xs text-muted-foreground uppercase">
              {start.toLocaleString('default', { month: 'short' })}
            </p>
            <p className="text-xs text-muted-foreground">{start.getFullYear()}</p>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm">{apt.title}</p>
              <div className="flex items-center gap-1 shrink-0">
                <Badge
                  variant="outline"
                  className={cn('capitalize text-xs', STATUS_COLORS[apt.status])}
                >
                  {apt.status.replace('_', ' ')}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(apt)}>Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {STATUS_OPTIONS.filter((s) => s !== apt.status).map((s) => (
                      <DropdownMenuItem key={s} onClick={() => onStatusChange(apt.id, s)}>
                        Mark as {s.replace('_', ' ')}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(apt)}
                      className="text-red-600 focus:text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="mt-1.5 space-y-1">
              <p className="text-xs text-muted-foreground">
                {fmtTime(apt.start_time)} – {fmtTime(apt.end_time)} ({duration} min)
              </p>
              {contactName && (
                <p className="text-xs text-muted-foreground">Contact: {contactName}</p>
              )}
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
                <a
                  href={apt.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <Video className="h-3 w-3" />
                  Join Virtual Meeting
                </a>
              )}
              {apt.description && (
                <p className="text-xs text-muted-foreground italic">{apt.description}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeekCalendar({
  appointments,
  weekStart,
  contacts,
  onDayClick,
  onAptClick,
}: {
  appointments: WireAppointment[];
  weekStart: Date;
  contacts: ReturnType<typeof useWireContacts>['contacts'];
  onDayClick: (dateStr: string) => void;
  onAptClick: (a: WireAppointment) => void;
}) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayStr = isoDate(day);
        const dayAppts = appointments.filter((a) => a.start_time.slice(0, 10) === dayStr);
        const isToday = isoDate(day) === isoDate(today);

        return (
          <div key={dayStr} className="min-h-[120px]">
            <button
              onClick={() => onDayClick(dayStr)}
              className={cn(
                'w-full text-center py-2 mb-2 rounded-lg transition-colors hover:opacity-80',
                isToday ? 'bg-yellow-400 text-gray-900' : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <p className="text-xs font-medium uppercase">
                {day.toLocaleString('default', { weekday: 'short' })}
              </p>
              <p className="text-lg font-bold leading-tight">{day.getDate()}</p>
            </button>

            <div className="space-y-1">
              {dayAppts.map((apt) => (
                <button
                  key={apt.id}
                  onClick={() => onAptClick(apt)}
                  className={cn(
                    'w-full text-left text-xs px-2 py-1.5 rounded border truncate transition-opacity hover:opacity-80',
                    STATUS_COLORS[apt.status]
                  )}
                  title={apt.title}
                >
                  {fmtTime(apt.start_time)} {apt.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WireCalendar() {
  const { appointments, loading, error, addAppointment, updateAppointment, updateStatus, deleteAppointment } =
    useWireCalendar();
  const { contacts } = useWireContacts();

  const [calView, setCalView] = useState<'week' | 'list'>('week');
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Start of current week (Sunday)
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editApt, setEditApt] = useState<WireAppointment | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [deletingApt, setDeletingApt] = useState<WireAppointment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [listFilter, setListFilter] = useState<'upcoming' | 'all' | WireAppointment['status']>('upcoming');

  const contactName = (apt: WireAppointment) => {
    const c = contacts.find((ct) => ct.id === apt.contact_id);
    return c ? `${c.first_name} ${c.last_name}` : '';
  };

  const openAdd = (dateStr?: string) => {
    setEditApt(null);
    setDefaultDate(dateStr);
    setDialogOpen(true);
  };

  const openEdit = (apt: WireAppointment) => {
    setEditApt(apt);
    setDefaultDate(undefined);
    setDialogOpen(true);
  };

  const handleSave = async (data: AppointmentFormData) => {
    if (editApt) {
      await updateAppointment(editApt.id, data);
    } else {
      await addAppointment(data);
    }
  };

  const handleDelete = async () => {
    if (!deletingApt) return;
    setDeleting(true);
    try {
      await deleteAppointment(deletingApt.id);
    } finally {
      setDeleting(false);
      setDeletingApt(null);
    }
  };

  const prevWeek = () => setWeekStart((d) => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart((d) => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
  const goToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    setWeekStart(d);
  };

  const now = new Date();
  const listAppointments = (() => {
    const sorted = [...appointments].sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    if (listFilter === 'upcoming') return sorted.filter((a) => new Date(a.start_time) >= now);
    if (listFilter === 'all') return sorted;
    return sorted.filter((a) => a.status === listFilter);
  })();

  const weekLabel = (() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  })();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading...' : `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setCalView('week')}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                calView === 'week' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100')}
            >
              Week
            </button>
            <button
              onClick={() => setCalView('list')}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                calView === 'list' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100')}
            >
              List
            </button>
          </div>
          <Button size="sm" onClick={() => openAdd()} className="bg-gray-900 hover:bg-gray-700 text-white gap-1.5">
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex gap-4">
                <Skeleton className="h-12 w-12 rounded shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : calView === 'week' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /></Button>
              <p className="font-medium text-sm min-w-[220px] text-center">{weekLabel}</p>
              <Button variant="ghost" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          </div>
          <WeekCalendar
            appointments={appointments}
            weekStart={weekStart}
            contacts={contacts}
            onDayClick={(dateStr) => openAdd(dateStr)}
            onAptClick={openEdit}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-1.5 flex-wrap">
            {(['upcoming', 'all', 'scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setListFilter(f)}
                className={cn(
                  'text-xs px-3 py-1 rounded-full border font-medium capitalize transition-colors',
                  listFilter === f
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 hover:bg-gray-100'
                )}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          {listAppointments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
              {appointments.length === 0 ? (
                <>
                  <p className="text-base font-medium">No appointments yet</p>
                  <Button onClick={() => openAdd()} className="mt-4 bg-gray-900 hover:bg-gray-700 text-white gap-2">
                    <Plus className="h-4 w-4" /> New Appointment
                  </Button>
                </>
              ) : (
                <p className="text-sm">No {listFilter} appointments.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {listAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  apt={apt}
                  contactName={contactName(apt)}
                  onEdit={openEdit}
                  onDelete={setDeletingApt}
                  onStatusChange={updateStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AppointmentDialog
        open={dialogOpen}
        appointment={editApt}
        defaultDate={defaultDate}
        onClose={() => { setDialogOpen(false); setEditApt(null); }}
        onSave={handleSave}
      />

      <AlertDialog open={!!deletingApt} onOpenChange={(o) => !o && setDeletingApt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingApt?.title}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
