import { Bot, Wrench } from "lucide-react";

interface AgentHeaderProps {
  toolCount: number;
}

const AgentHeader = ({ toolCount }: AgentHeaderProps) => (
  <div className="flex items-center gap-2 mb-4">
    <Bot className="h-5 w-5 text-primary" />
    <h2 className="text-xl font-semibold">AI Assistant</h2>
    {toolCount > 0 && (
      <div className="ml-auto flex items-center gap-2">
        <Wrench className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-500">
          {toolCount} tools available
        </span>
      </div>
    )}
  </div>
);

export default AgentHeader;