import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Send,
  Phone,
  Mail,
  MessageSquare,
  Search,
  ChevronDown,
  Plus,
  Inbox,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWireInbox } from '@/hooks/useWireInbox';
import { useWireContacts } from '@/hooks/useWireContacts';
import type { WireConversation } from '@/types/wire.types';

function ChannelIcon({ channel }: { channel: WireConversation['channel'] }) {
  if (channel === 'sms') return <MessageSquare className="h-3.5 w-3.5" />;
  if (channel === 'email') return <Mail className="h-3.5 w-3.5" />;
  if (channel === 'call') return <Phone className="h-3.5 w-3.5" />;
  return null;
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ConvSkeleton() {
  return (
    <div className="px-4 py-3 border-b flex items-center gap-2">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-44" />
      </div>
    </div>
  );
}

// New Conversation dialog
function NewConversationDialog({
  open,
  onClose,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  onStart: (contactId: string, channel: 'sms' | 'email', subject?: string) => Promise<void>;
}) {
  const { contacts } = useWireContacts();
  const [contactId, setContactId] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [subject, setSubject] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setContactId(''); setChannel('sms'); setSubject(''); }
  }, [open]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) return;
    setSaving(true);
    try {
      await onStart(contactId, channel, channel === 'email' ? subject : undefined);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleStart} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Select value={contactId} onValueChange={setContactId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact..." />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                    {c.phone ? ` · ${c.phone}` : c.email ? ` · ${c.email}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <div className="flex gap-2">
              {(['sms', 'email'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-colors',
                    channel === ch ? 'bg-gray-900 text-white border-gray-900' : 'hover:bg-gray-50'
                  )}
                >
                  <ChannelIcon channel={ch} />
                  {ch === 'sms' ? 'SMS' : 'Email'}
                </button>
              ))}
            </div>
          </div>
          {channel === 'email' && (
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Re: Your inquiry" />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !contactId} className="bg-gray-900 hover:bg-gray-700 text-white">
              {saving ? 'Starting...' : 'Start Conversation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WireInbox() {
  const {
    conversations,
    messages,
    selectedConversation,
    loadingConvs,
    loadingMsgs,
    sending,
    unreadTotal,
    selectConversation,
    sendMessage,
    startConversation,
    closeConversation,
  } = useWireInbox();

  const { contacts } = useWireContacts();

  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'unread'>('all');
  const [search, setSearch] = useState('');
  const [newConvOpen, setNewConvOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper to get contact name for a conversation
  const contactName = (conv: WireConversation) => {
    const c = contacts.find((ct) => ct.id === conv.contact_id);
    if (c) return `${c.first_name} ${c.last_name}`;
    return 'Unknown';
  };

  const contactInitials = (conv: WireConversation) => {
    const c = contacts.find((ct) => ct.id === conv.contact_id);
    if (c) return `${c.first_name[0] ?? ''}${c.last_name[0] ?? ''}`;
    return '?';
  };

  const contactInfo = (conv: WireConversation) => {
    const c = contacts.find((ct) => ct.id === conv.contact_id);
    if (!c) return '';
    return c.phone ?? c.email ?? '';
  };

  const filtered = conversations.filter((c) => {
    if (filter === 'unread' && c.unread_count === 0) return false;
    if (filter === 'open' && c.status !== 'open') return false;
    const q = search.toLowerCase();
    return (
      !q ||
      contactName(c).toLowerCase().includes(q) ||
      c.last_message?.toLowerCase().includes(q) ||
      c.subject?.toLowerCase().includes(q)
    );
  });

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    const body = draft;
    setDraft('');
    await sendMessage(body);
  };

  const handleNewConv = async (contactId: string, channel: 'sms' | 'email', subject?: string) => {
    await startConversation({ contact_id: contactId, channel, subject });
  };

  return (
    <div className="flex h-full">
      {/* Sidebar — conversation list */}
      <div className="w-72 border-r bg-white flex flex-col shrink-0">
        <div className="p-3 border-b space-y-2.5">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm flex-1">Inbox</h2>
            {unreadTotal > 0 && (
              <Badge variant="secondary" className="text-xs">{unreadTotal} unread</Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setNewConvOpen(true)}
              title="New conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
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
                  filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            Array.from({ length: 5 }).map((_, i) => <ConvSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground px-4">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">
                {conversations.length === 0
                  ? 'No conversations yet. Start one!'
                  : 'No conversations match your filter.'}
              </p>
              {conversations.length === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={() => setNewConvOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> New Conversation
                </Button>
              )}
            </div>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors',
                  selectedConversation?.id === conv.id && 'bg-yellow-50 border-l-2 border-l-yellow-400',
                  conv.unread_count > 0 && 'bg-blue-50/40'
                )}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="h-8 w-8 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {contactInitials(conv)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn('text-sm truncate', conv.unread_count > 0 ? 'font-bold' : 'font-medium')}>
                        {contactName(conv)}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="h-4 w-4 rounded-full bg-yellow-400 text-gray-900 text-xs font-bold flex items-center justify-center shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ChannelIcon channel={conv.channel} />
                      <span className="truncate">{conv.subject ?? conv.last_message ?? 'No messages yet'}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-10">{timeAgo(conv.last_message_at)}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a conversation or start a new one</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setNewConvOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> New Conversation
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="h-14 border-b px-6 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-800 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {contactInitials(selectedConversation)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{contactName(selectedConversation)}</p>
                  <p className="text-xs text-muted-foreground">{contactInfo(selectedConversation)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-xs gap-1">
                  <ChannelIcon channel={selectedConversation.channel} />
                  {selectedConversation.channel}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('text-xs capitalize',
                    selectedConversation.status === 'open' ? 'border-green-400 text-green-700' : ''
                  )}
                >
                  {selectedConversation.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {selectedConversation.status !== 'closed' && (
                      <DropdownMenuItem onClick={() => closeConversation(selectedConversation.id)}>
                        <CheckCheck className="h-3.5 w-3.5 mr-2" />
                        Mark as Closed
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {loadingMsgs ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-2/3" />
                  <Skeleton className="h-10 w-1/2 ml-auto" />
                  <Skeleton className="h-14 w-2/3" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No messages yet. Send the first message below.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
                        msg.direction === 'outbound'
                          ? 'bg-gray-900 text-white rounded-tr-sm'
                          : 'bg-white text-gray-900 border rounded-tl-sm shadow-sm'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                      <p className={cn('text-xs mt-1', msg.direction === 'outbound' ? 'text-gray-400' : 'text-muted-foreground')}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.direction === 'outbound' && ` · ${msg.status}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box */}
            {selectedConversation.status !== 'closed' ? (
              <div className="border-t bg-white p-4 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">Replying via</span>
                  <Badge variant="secondary" className="capitalize text-xs gap-1">
                    <ChannelIcon channel={selectedConversation.channel} />
                    {selectedConversation.channel}
                  </Badge>
                </div>
                <div className="flex gap-2 items-end">
                  <Textarea
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                    rows={1}
                    disabled={sending}
                  />
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-700 text-white h-10 px-4"
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Enter to send · Shift+Enter for new line</p>
              </div>
            ) : (
              <div className="border-t bg-gray-50 p-4 text-center text-sm text-muted-foreground shrink-0">
                This conversation is closed.
              </div>
            )}
          </>
        )}
      </div>

      <NewConversationDialog
        open={newConvOpen}
        onClose={() => setNewConvOpen(false)}
        onStart={handleNewConv}
      />
    </div>
  );
}
