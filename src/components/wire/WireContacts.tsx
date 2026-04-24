import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Tag,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react';
import { mockContacts } from './wireData';
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

function ContactRow({ contact }: { contact: WireContact }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gray-800 text-white font-bold text-sm flex items-center justify-center shrink-0">
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
                  Assigned: {contact.assigned_to}
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
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WireContacts() {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = Array.from(new Set(mockContacts.flatMap((c) => c.tags)));

  const filtered = mockContacts.filter((c) => {
    const q = search.toLowerCase();
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    const matchesSearch =
      !q || name.includes(q) || c.email?.includes(q) || c.phone?.includes(q);
    const matchesTag = !tagFilter || c.tags.includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mockContacts.length.toLocaleString()} total contacts
          </p>
        </div>
        <Button className="bg-gray-900 hover:bg-gray-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => setTagFilter(null)}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
              !tagFilter ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-100'
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
      </div>

      {/* Contact List */}
      <div className="space-y-3">
        {filtered.map((contact) => (
          <ContactRow key={contact.id} contact={contact} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No contacts found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}
