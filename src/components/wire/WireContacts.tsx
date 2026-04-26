import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Tag,
  MessageSquare,
  MoreHorizontal,
  Users,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWireContacts, type ContactFormData } from '@/hooks/useWireContacts';
import { ContactDialog } from './ContactDialog';
import { ContactDetailDrawer } from './ContactDetailDrawer';
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

function ContactRowSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 grid grid-cols-4 gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ContactRowProps {
  contact: WireContact;
  onView: (c: WireContact) => void;
  onEdit: (c: WireContact) => void;
  onDelete: (c: WireContact) => void;
}

function ContactRow({ contact, onView, onEdit, onDelete }: ContactRowProps) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(contact)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gray-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
            {contact.first_name[0]}{contact.last_name[0]}
          </div>

          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
            <div>
              <p className="font-semibold text-sm">
                {contact.first_name} {contact.last_name}
              </p>
              {contact.source && (
                <p className="text-xs text-muted-foreground">via {contact.source}</p>
              )}
              {contact.do_not_contact && (
                <p className="text-xs text-red-600 font-medium">Do Not Contact</p>
              )}
            </div>

            <div className="space-y-1">
              {contact.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {contact.phone}
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
            </div>

            <div>
              {(contact.city || contact.state) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {contact.city}{contact.city && contact.state ? ', ' : ''}{contact.state}
                </div>
              )}
              {contact.assigned_to && (
                <p className="text-xs text-muted-foreground mt-1">
                  {contact.assigned_to}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {contact.phone && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`tel:${contact.phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
            {contact.email && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`mailto:${contact.email}`}>
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageSquare className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(contact)}>View Details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(contact)}>Edit Contact</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(contact)}
                  className="text-red-600 focus:text-red-600"
                >
                  Delete Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WireContacts() {
  const { contacts, loading, error, addContact, updateContact, deleteContact } = useWireContacts();

  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<WireContact | null>(null);
  const [viewContact, setViewContact] = useState<WireContact | null>(null);

  const allTags = useMemo(
    () => Array.from(new Set(contacts.flatMap((c) => c.tags))).sort(),
    [contacts]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter((c) => {
      const name = `${c.first_name} ${c.last_name}`.toLowerCase();
      const matchesSearch =
        !q ||
        name.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.city?.toLowerCase().includes(q);
      const matchesTag = !tagFilter || c.tags.includes(tagFilter);
      return matchesSearch && matchesTag;
    });
  }, [contacts, search, tagFilter]);

  const openAdd = () => {
    setEditContact(null);
    setDialogOpen(true);
  };

  const openEdit = (contact: WireContact) => {
    setEditContact(contact);
    setDialogOpen(true);
  };

  const handleSave = async (data: ContactFormData) => {
    if (editContact) {
      await updateContact(editContact.id, data);
    } else {
      await addContact(data);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteContact(id);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading...' : `${contacts.length.toLocaleString()} total contacts`}
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-gray-900 hover:bg-gray-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      {!loading && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, city..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                onClick={() => setTagFilter(null)}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                  !tagFilter
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={`text-xs px-3 py-1 rounded-full border font-medium capitalize transition-colors ${
                    tagFilter === tag
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <ContactRowSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            {contacts.length === 0 ? (
              <>
                <p className="text-base font-medium">No contacts yet</p>
                <p className="text-sm mt-1">Add your first contact to get started.</p>
                <Button onClick={openAdd} className="mt-4 bg-gray-900 hover:bg-gray-700 text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm">No contacts match your search.</p>
                <button
                  onClick={() => { setSearch(''); setTagFilter(null); }}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          filtered.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              onView={setViewContact}
              onEdit={openEdit}
              onDelete={(c) => handleDelete(c.id)}
            />
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <ContactDialog
        open={dialogOpen}
        contact={editContact}
        onClose={() => { setDialogOpen(false); setEditContact(null); }}
        onSave={handleSave}
      />

      {/* Detail Drawer */}
      <ContactDetailDrawer
        contact={viewContact}
        onClose={() => setViewContact(null)}
        onEdit={(c) => { setViewContact(null); openEdit(c); }}
        onDelete={handleDelete}
      />
    </div>
  );
}
