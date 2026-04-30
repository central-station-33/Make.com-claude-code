import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { WireContact } from '@/types/wire.types';
import type { ContactFormData } from '@/hooks/useWireContacts';

const AVAILABLE_TAGS = ['seller', 'buyer', 'investor', 'hot-lead', 'pre-approved', 'follow-up', 'cold'];
const SOURCES = ['Website', 'Referral', 'Facebook Ad', 'Google Ad', 'Cold Call', 'Zillow', 'Realtor.com', 'Instagram', 'Direct Mail', 'Event', 'Other'];
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const EMPTY_FORM: ContactFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  tags: [],
  source: '',
  assigned_to: '',
  do_not_contact: false,
  notes: '',
};

interface ContactDialogProps {
  open: boolean;
  contact?: WireContact | null;
  onClose: () => void;
  onSave: (data: ContactFormData) => Promise<void>;
}

export function ContactDialog({ open, contact, onClose, onSave }: ContactDialogProps) {
  const [form, setForm] = useState<ContactFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (contact) {
      setForm({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        address: contact.address ?? '',
        city: contact.city ?? '',
        state: contact.state ?? '',
        zip: contact.zip ?? '',
        tags: [...contact.tags],
        source: contact.source ?? '',
        assigned_to: contact.assigned_to ?? '',
        do_not_contact: contact.do_not_contact,
        notes: contact.notes ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setTagInput('');
  }, [contact, open]);

  const set = (field: keyof ContactFormData, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const removeTag = (tag: string) =>
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return;
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                required
                placeholder="James"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                required
                placeholder="Whitfield"
              />
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="james@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(404) 555-0100"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="842 Peachtree St"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Atlanta"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Select value={form.state} onValueChange={(v) => set('state', v)}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={form.zip}
                onChange={(e) => set('zip', e.target.value)}
                placeholder="30308"
                maxLength={10}
              />
            </div>
          </div>

          {/* Source + Assigned */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="source">Lead Source</Label>
              <Select value={form.source} onValueChange={(v) => set('source', v)}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
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

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {AVAILABLE_TAGS.filter((t) => !form.tags.includes(t)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="text-xs px-2.5 py-1 rounded-full border border-dashed border-gray-300 hover:border-gray-500 hover:bg-gray-50 capitalize transition-colors"
                >
                  + {tag}
                </button>
              ))}
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); }
                  if (e.key === ',') { e.preventDefault(); addTag(tagInput); }
                }}
                placeholder="Custom tag..."
                className="h-7 text-xs w-32"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Internal notes about this contact..."
              rows={3}
            />
          </div>

          {/* DNC toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-red-100 bg-red-50">
            <Switch
              id="dnc"
              checked={form.do_not_contact}
              onCheckedChange={(v) => set('do_not_contact', v)}
            />
            <Label htmlFor="dnc" className="text-sm font-medium text-red-700 cursor-pointer">
              Do Not Contact
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-700 text-white">
              {saving ? 'Saving...' : contact ? 'Save Changes' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
