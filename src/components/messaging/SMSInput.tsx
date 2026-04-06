
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { SMSInputProps } from '@/types/messaging.types';

export const SMSInput = ({ onSend, recipientPhone = '', disabled = false }: SMSInputProps) => {
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(recipientPhone);

  const handleSend = async () => {
    if (!message.trim() || !phoneNumber.trim()) return;
    await onSend(message, phoneNumber);
    setMessage("");
  };

  return (
    <div className="space-y-4">
      <Input
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="Recipient phone number"
        type="tel"
        disabled={disabled || !!recipientPhone}
      />
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your SMS message..."
          className="flex-1"
          disabled={disabled}
        />
        <Button 
          onClick={handleSend}
          disabled={disabled || !message.trim() || !phoneNumber.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
