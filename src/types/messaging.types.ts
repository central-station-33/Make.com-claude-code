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

export interface SMSMessage {
  id: string;
  lead_id: string;
  sender_id: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface SMSInputProps {
  onSend: (message: string, phoneNumber: string) => Promise<void>;
  recipientPhone?: string;
  disabled?: boolean;
}

export interface SMSListProps {
  messages: SMSMessage[];
  isLoading: boolean;
}
