export interface Message {
  id: string;
  message: string;
  sent_at: string;
  sender_id: string;
  delivered_at?: string;
  read_at?: string;
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
  lead_id?: string;
  status?: string;
}

export interface TypingStatus {
  user_id: string;
  typing: boolean;
}

export interface MessageInputProps {
  onSend: (message: string, file?: File) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export interface MessageListProps {
  messages?: Message[];
  isLoading: boolean;
}

export interface MessageGroupProps {
  date: string;
  messages: Message[];
  currentUserId?: string;
}

export interface LeadMessagingProps {
  leadId: string;
}

// SMS-specific types (SMSTouch, and the SMSInput/SMSList prop shapes) now
// live next to their hook/components -- src/hooks/messaging/useSMSMessaging.ts
// and src/components/messaging/SMS*.tsx -- since they're keyed to
// lead_touches, not a standalone text_messages table.
