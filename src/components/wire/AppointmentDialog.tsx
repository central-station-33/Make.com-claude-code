import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WireAppointment } from '@/types/wire.types';
import type { AppointmentFormData } from '@/hooks/useWireCalendar';
import { useWireContacts } from '@/hooks/useWireContacts';

function toLocalDatetimeString(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultEnd(start: string): string {
  if (!start) return '';
  const d = new Date(start);
  d.setMinutes(d.getMinutes() + 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY_FORM: AppointmentFormData = {
  title: '',
  contact_id: '',
  description: '',
  start_time: '',
  end_time: '',
  status: 'scheduled',
  assigned_to: '',
  location: '',
  meeting_link: '',
};

interface AppointmentDialogProps {
  open: boolean;
  appointment?: WireAppointment | null;
  defaultDate?: string;
  onClose: () => void;
  onSave: (data: AppointmentFormData) => Promise<void>;
}

export function AppointmentDialog({ open, appointment, defaultDate, onClose, onSave }: AppointmentDialogProps) {
  const { contacts } = useWireContacts();
  const [form, setForm] = useState<AppointmentFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointment) {
      setForm({
        title: appointment.title,
        contact_id: appointment.contact_id,
        description: appointment.description ?? '',
        start_time: toLocalDatetimeString(appointment.start_time),
        end_time: toLocalDatetimeString(appointment.end_time),
        status: appointment.status,
        assigned_to: appointment.assigned_to ?? '',
        location: appointment.location ?? '',
        meeting_link: appointment.meeting_link ?? '',
      });
    } else {
      const start = defaultDate
        ? `${defaultDate}T09:00`
        : toLocalDatetimeString(new Date(Date.now() + 3_600_000).toISOString());
      setForm({ ...EMPTY_FORM, start_time: start, end_time: defaultEnd(start) });
    }
  }, [appointment, defaultDate, open]);

  const set = <K extends keyof AppointmentFormData>(field: K, value: AppointmentFormData[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleStartChange = (v: string) => {
    setForm((f) => ({ ...f, start_time: v, end_time: defaultEnd(v) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_time || !form.end_time) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{appointment ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="apt_title">Title *</Label>
            <Input
              id="apt_title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
              placeholder="Buyer Consultation — Smith"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Select value={form.contact_id} onValueChange={(v) => set('contact_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}{c.phone ? ` · ${c.phone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start_time">Start *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => handleStartChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">End *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={form.end_time}
                min={form.start_time}
                onChange={(e) => set('end_time', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v as WireAppointment['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Input
                id="assigned_to"
                value={form.assigned_to}
                onChange={(e) => set('assigned_to', e.target.value)}
                placeholder="Agent Rivera"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="500 JRA Office, Atlanta GA"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meeting_link">Meeting Link</Label>
            <Input
              id="meeting_link"
              type="url"
              value={form.meeting_link}
              onChange={(e) => set('meeting_link', e.target.value)}
              placeholder="https://zoom.us/j/..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Meeting notes or agenda..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-700 text-white">
              {saving ? 'Saving...' : appointment ? 'Save Changes' : 'Create Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
