import { Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: Message[];
}

const MessageList = ({ messages }: MessageListProps) => {
  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-start gap-2 max-w-[80%]">
              {message.role === "assistant" && (
                <Bot className="h-6 w-6 text-primary mt-2" />
              )}
              <div
                className={`p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-white ml-2"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.content}
              </div>
              {message.role === "user" && (
                <User className="h-6 w-6 text-primary mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default MessageList;