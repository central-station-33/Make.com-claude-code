import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Send, Phone, Mail, MessageSquare, Search, ChevronDown } from 'lucide-react';
import { mockConversations, mockMessages } from './wireData';
import type { WireConversation, WireMessage } from '@/types/wire.types';

function ChannelIcon({ channel }: { channel: WireConversation['channel'] }) {
  if (channel === 'sms') return <MessageSquare className="h-3.5 w-3.5" />;
  if (channel === 'email') return <Mail className="h-3.5 w-3.5" />;
  if (channel === 'call') return <Phone className="h-3.5 w-3.5" />;
  return null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function WireInbox() {
  const [selected, setSelected] = useState<WireConversation>(mockConversations[0]);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'unread'>('all');
  const [search, setSearch] = useState('');

  const messages: WireMessage[] = mockMessages[selected.id] ?? [];

  const filtered = mockConversations.filter((c) => {
    if (filter === 'unread' && c.unread_count === 0) return false;
    if (filter === 'open' && c.status !== 'open') return false;
    const q = search.toLowerCase();
    const name = `${c.contact?.first_name} ${c.contact?.last_name}`.toLowerCase();
    return name.includes(q) || c.last_message?.toLowerCase().includes(q);
  });

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="w-72 border-r bg-white flex flex-col">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm flex-1">Inbox</h2>
            <Badge variant="secondary">{mockConversations.filter((c) => c.unread_count > 0).length} unread</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'open', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full capitalize font-medium transition-colors',
                  filter === f
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={cn(
                'w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors',
                selected.id === conv.id && 'bg-yellow-50 border-l-2 border-l-yellow-400'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {conv.contact?.first_name?.[0]}{conv.contact?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {conv.contact?.first_name} {conv.contact?.last_name}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="h-4 w-4 rounded-full bg-yellow-400 text-gray-900 text-xs font-bold flex items-center justify-center shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ChannelIcon channel={conv.channel} />
                    <span className="truncate">{conv.last_message}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pl-10">
                {timeAgo(conv.last_message_at ?? conv.updated_at)}
              </p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No conversations found.</p>
          )}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b px-6 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gray-800 text-white text-sm font-bold flex items-center justify-center">
              {selected.contact?.first_name?.[0]}{selected.contact?.last_name?.[0]}
            </div>
            <div>
              <p className="font-semibold text-sm">
                {selected.contact?.first_name} {selected.contact?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{selected.contact?.phone ?? selected.contact?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              <ChannelIcon channel={selected.channel} />
              <span className="ml-1">{selected.channel}</span>
            </Badge>
            <Badge
              variant="outline"
              className={selected.status === 'open' ? 'border-green-400 text-green-700' : ''}
            >
              {selected.status}
            </Badge>
            <Button variant="ghost" size="sm">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
                  msg.direction === 'outbound'
                    ? 'bg-gray-900 text-white rounded-tr-sm'
                    : 'bg-white text-gray-900 border rounded-tl-sm shadow-sm'
                )}
              >
                <p>{msg.body}</p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    msg.direction === 'outbound' ? 'text-gray-400' : 'text-muted-foreground'
                  )}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  {msg.direction === 'outbound' && `· ${msg.status}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Box */}
        <div className="border-t bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">Replying via</span>
            <Badge variant="secondary" className="capitalize text-xs">
              <ChannelIcon channel={selected.channel} />
              <span className="ml-1">{selected.channel}</span>
            </Badge>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setDraft('');
                }
              }}
              className="flex-1"
            />
            <Button
              size="sm"
              className="bg-gray-900 hover:bg-gray-700 text-white"
              onClick={() => setDraft('')}
              disabled={!draft.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
