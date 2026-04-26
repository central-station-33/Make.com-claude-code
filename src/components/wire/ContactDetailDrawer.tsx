import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  MessageSquare,
  Pencil,
  Trash2,
  Ban,
  Clock,
} from 'lucide-react';
import type { WireContact } from '@/types/wire.types';

const TAG_COLORS: Record<string, string> = {
  seller: 'bg-orange-100 text-orange-700',
  buyer: 'bg-blue-100 text-blue-700',
  investor: 'bg-purple-100 text-purple-700',
  'hot-lead': 'bg-red-100 text-red-700',
  'pre-approved': 'bg-green-100 text-green-700',
  'follow-up': 'bg-yellow-100 text-yellow-700',
  cold: 'bg-gray-100 text-gray-600',
};

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ContactDetailDrawerProps {
  contact: WireContact | null;
  onClose: () => void;
  onEdit: (contact: WireContact) => void;
  onDelete: (id: string) => Promise<void>;
}

export function ContactDetailDrawer({ contact, onClose, onEdit, onDelete }: ContactDetailDrawerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!contact) return;
    setDeleting(true);
    try {
      await onDelete(contact.id);
      onClose();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!contact) return null;

  const initials = `${contact.first_name[0] ?? ''}${contact.last_name[0] ?? ''}`.toUpperCase();

  return (
    <>
      <Sheet open={!!contact} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-gray-900 text-white font-bold text-lg flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl">
                  {contact.first_name} {contact.last_name}
                </SheetTitle>
                {contact.source && (
                  <p className="text-sm text-muted-foreground mt-0.5">via {contact.source}</p>
                )}
                {contact.do_not_contact && (
                  <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs font-medium">
                    <Ban className="h-3.5 w-3.5" />
                    Do Not Contact
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2 mt-3">
              {contact.phone && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={`tel:${contact.phone}`}>
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </a>
                </Button>
              )}
              {contact.email && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={`mailto:${contact.email}`}>
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                SMS
              </Button>
            </div>
          </SheetHeader>

          <Separator />

          <div className="py-5 space-y-5">
            {/* Contact info */}
            <Section title="Contact Info">
              {contact.phone && (
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={contact.phone} />
              )}
              {contact.email && (
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={contact.email} />
              )}
              {(contact.city || contact.state) && (
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Location"
                  value={[contact.address, contact.city, contact.state, contact.zip].filter(Boolean).join(', ')}
                />
              )}
            </Section>

            {/* Assignment */}
            <Section title="Assignment">
              {contact.assigned_to && (
                <InfoRow icon={<User className="h-4 w-4" />} label="Assigned To" value={contact.assigned_to} />
              )}
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Added" value={fmt(contact.created_at)} />
              {contact.last_activity && (
                <InfoRow icon={<Clock className="h-4 w-4" />} label="Last Activity" value={fmt(contact.last_activity)} />
              )}
            </Section>

            {/* Notes */}
            {contact.notes && (
              <Section title="Notes">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
              </Section>
            )}
          </div>

          <Separator />

          {/* Footer actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              size="sm"
              className="bg-gray-900 hover:bg-gray-700 text-white gap-1.5"
              onClick={() => { onEdit(contact); onClose(); }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Contact
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {contact.first_name} {contact.last_name} and all associated data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete Contact'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}
