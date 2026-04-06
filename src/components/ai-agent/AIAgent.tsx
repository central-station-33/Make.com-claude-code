import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AIAgent } from "@/types/ai-agent.types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const AIAgent = () => {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hello! I'm your AI assistant. How can I help you with lead management today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AIAgent | null>(null);

  useEffect(() => {
    const fetchDefaultAgent = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('type', 'research')
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching agent:', error);
          setError('Failed to load AI agent configuration');
          return;
        }

        if (!data) {
          setError('No research agent found. Please configure an agent first.');
          return;
        }

        setCurrentAgent(data);
        setError(null);
      } catch (error) {
        console.error('Error in fetchDefaultAgent:', error);
        setError('An unexpected error occurred while loading the AI agent');
      }
    };

    fetchDefaultAgent();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !currentAgent) return;
    
    setIsLoading(true);
    setMessages(prev => [...prev, { role: "user", content: input }]);
    
    try {
      const response = await supabase.functions.invoke('handle-agent-interaction', {
        body: {
          input: input,
          agentId: currentAgent.id
        }
      });

      if (response.error) throw response.error;

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.data.output 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I apologize, but I encountered an error processing your request. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  if (error) {
    return (
      <Card className="p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">AI Assistant</h2>
      </div>
      <MessageList messages={messages} />
      <MessageInput
        input={input}
        isLoading={isLoading}
        disabled={!currentAgent}
        onInputChange={setInput}
        onSend={handleSend}
      />
    </Card>
  );
};

export default AIAgent;