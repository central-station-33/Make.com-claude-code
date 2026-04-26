import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, X, Users } from 'lucide-react';
import type { WireCampaign } from '@/types/wire.types';
import type { CampaignFormData } from '@/hooks/useWireCampaigns';
import { useWireContacts } from '@/hooks/useWireContacts';

const AVAILABLE_TAGS = ['seller', 'buyer', 'investor', 'hot-lead', 'pre-approved', 'follow-up', 'cold'];

const EMPTY_FORM: CampaignFormData = {
  name: '',
  type: 'email',
  status: 'draft',
  subject: '',
  body: '',
  recipient_tags: [],
  scheduled_at: '',
};

const EMAIL_VARS = ['[First Name]', '[Last Name]', '[Phone]', '[Address]', '[City]', '[Agent Name]'];
const SMS_VARS = ['[First Name]', '[City]', '[Agent Name]', '[Link]'];

interface CampaignDialogProps {
  open: boolean;
  campaign?: WireCampaign | null;
  onClose: () => void;
  onSave: (data: CampaignFormData) => Promise<void>;
}

export function CampaignDialog({ open, campaign, onClose, onSave }: CampaignDialogProps) {
  const { contacts } = useWireContacts();
  const [form, setForm] = useState<CampaignFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        subject: campaign.subject ?? '',
        body: campaign.body,
        recipient_tags: [],
        scheduled_at: campaign.scheduled_at ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [campaign, open]);

  const set = <K extends keyof CampaignFormData>(field: K, value: CampaignFormData[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleTag = (tag: string) =>
    setForm((f) => ({
      ...f,
      recipient_tags: f.recipient_tags.includes(tag)
        ? f.recipient_tags.filter((t) => t !== tag)
        : [...f.recipient_tags, tag],
    }));

  // Estimate recipient count based on selected tags
  const estimatedCount =
    form.recipient_tags.length === 0
      ? contacts.length
      : contacts.filter((c) => form.recipient_tags.some((t) => c.tags.includes(t))).length;

  const insertVar = (v: string) =>
    setForm((f) => ({ ...f, body: f.body + v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const vars = form.type === 'email' ? EMAIL_VARS : SMS_VARS;
  const charCount = form.body.length;
  const smsSegments = form.type === 'sms' ? Math.ceil(charCount / 160) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Type selector */}
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Tabs
              value={form.type}
              onValueChange={(v) => set('type', v as 'email' | 'sms')}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-64">
                <TabsTrigger value="email" className="gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </TabsTrigger>
                <TabsTrigger value="sms" className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> SMS
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Name + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="camp_name">Campaign Name *</Label>
              <Input
                id="camp_name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
                placeholder="Spring Market Update — Sellers"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="camp_status">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v as WireCampaign['status'])}>
                <SelectTrigger id="camp_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Email subject */}
          {form.type === 'email' && (
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => set('subject', e.target.value)}
                placeholder="Atlanta Spring Market Report — Your Home's Value Has Increased"
                required={form.type === 'email'}
              />
            </div>
          )}

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">
                {form.type === 'email' ? 'Email Body' : 'SMS Message'} *
              </Label>
              <div className="text-xs text-muted-foreground">
                {charCount} chars{smsSegments ? ` · ${smsSegments} segment${smsSegments > 1 ? 's' : ''}` : ''}
              </div>
            </div>
            <Textarea
              id="body"
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
              required
              rows={form.type === 'sms' ? 4 : 8}
              placeholder={
                form.type === 'email'
                  ? 'Hi [First Name],\n\nThe spring market is here...'
                  : 'Hi [First Name]! New listings just hit in [City]. Click to view: [Link]'
              }
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">Insert variable:</span>
              {vars.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVar(v)}
                  className="text-xs px-2 py-0.5 rounded border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient targeting */}
          <div className="space-y-2 p-4 rounded-lg border bg-gray-50">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Target Audience
              </Label>
              <span className="text-sm font-semibold text-blue-700">
                ~{estimatedCount} contacts
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Select tags to target. Leave empty to send to all contacts.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1 rounded-full border font-medium capitalize transition-colors ${
                    form.recipient_tags.includes(tag)
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {form.recipient_tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-1">
                <span className="text-xs text-muted-foreground">Targeting:</span>
                {form.recipient_tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 text-xs pr-1 capitalize">
                    {t}
                    <button type="button" onClick={() => toggleTag(t)} className="hover:text-destructive">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled at */}
          {form.status === 'scheduled' && (
            <div className="space-y-1.5">
              <Label htmlFor="scheduled_at">Schedule Send Date & Time</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => set('scheduled_at', e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              name="action"
              value="draft"
              variant="outline"
              disabled={saving}
              onClick={() => set('status', 'draft')}
            >
              Save as Draft
            </Button>
            <Button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-700 text-white">
              {saving ? 'Saving...' : campaign ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
