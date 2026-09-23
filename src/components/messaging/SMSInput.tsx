import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface SMSInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
}

// Recipient phone is no longer collected here -- send-sms reads it straight
// from the lead's isa_leads.phone so a message can never be redirected to a
// number that hasn't gone through the lead's consent check.
export const SMSInput = ({ onSend, disabled = false }: SMSInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!message.trim()) return;
    await onSend(message);
    setMessage("");
  };

  return (
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
        disabled={disabled || !message.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};
