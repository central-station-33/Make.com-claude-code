import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
  input: string;
  isLoading: boolean;
  disabled: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

const MessageInput = ({ input, isLoading, disabled, onInputChange, onSend }: MessageInputProps) => {
  return (
    <div className="flex gap-2 mt-4">
      <Input
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Type your message..."
        onKeyPress={(e) => e.key === "Enter" && onSend()}
        className="flex-1"
        disabled={isLoading || disabled}
      />
      <Button onClick={onSend} size="icon" disabled={isLoading || disabled}>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MessageInput;