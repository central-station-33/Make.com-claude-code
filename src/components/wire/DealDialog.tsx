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
import type { WireOpportunity } from '@/types/wire.types';
import { DEFAULT_STAGES, type DealFormData } from '@/hooks/useWirePipeline';
import { useWireContacts } from '@/hooks/useWireContacts';

const EMPTY_FORM: DealFormData = {
  name: '',
  contact_id: '',
  pipeline_id: 'main',
  stage_id: 's1',
  value: undefined,
  status: 'open',
  assigned_to: '',
  close_date: '',
  notes: '',
};

interface DealDialogProps {
  open: boolean;
  deal?: WireOpportunity | null;
  defaultStageId?: string;
  onClose: () => void;
  onSave: (data: DealFormData) => Promise<void>;
}

export function DealDialog({ open, deal, defaultStageId, onClose, onSave }: DealDialogProps) {
  const { contacts } = useWireContacts();
  const [form, setForm] = useState<DealFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (deal) {
      setForm({
        name: deal.name,
        contact_id: deal.contact_id,
        pipeline_id: deal.pipeline_id,
        stage_id: deal.stage_id,
        value: deal.value,
        status: deal.status,
        assigned_to: deal.assigned_to ?? '',
        close_date: deal.close_date ?? '',
        notes: deal.notes ?? '',
      });
    } else {
      setForm({ ...EMPTY_FORM, stage_id: defaultStageId ?? 's1' });
    }
  }, [deal, defaultStageId, open]);

  const set = <K extends keyof DealFormData>(field: K, value: DealFormData[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{deal ? 'Edit Deal' : 'New Deal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="deal_name">Deal Name *</Label>
            <Input
              id="deal_name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              placeholder="Smith — 4BR Buckhead"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact">Contact</Label>
            <Select value={form.contact_id} onValueChange={(v) => set('contact_id', v)}>
              <SelectTrigger id="contact">
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                    {c.phone ? ` · ${c.phone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stage">Pipeline Stage *</Label>
            <Select value={form.stage_id} onValueChange={(v) => set('stage_id', v)}>
              <SelectTrigger id="stage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full inline-block"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="value">Deal Value ($)</Label>
              <Input
                id="value"
                type="number"
                min={0}
                step={1000}
                value={form.value ?? ''}
                onChange={(e) => set('value', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="450000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="close_date">Expected Close Date</Label>
              <Input
                id="close_date"
                type="date"
                value={form.close_date}
                onChange={(e) => set('close_date', e.target.value)}
              />
            </div>
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

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Deal notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-700 text-white">
              {saving ? 'Saving...' : deal ? 'Save Changes' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
