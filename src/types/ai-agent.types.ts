import type { Database } from "@/types/database.types";

export type AIAgent = Database["public"]["Tables"]["ai_agents"]["Row"];

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Tool {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  configuration: Record<string, any>;
}