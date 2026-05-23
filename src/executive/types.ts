import { Platform, ContentType, Tone } from "../core/prompts/PromptEngine";

export type ExecutiveIntent = 
  | "GENERATE_CONTENT"
  | "ANALYZE_PERFORMANCE"
  | "MANAGE_PUBLISHING"
  | "CONFIGURE_AUTOMATION"
  | "BRAND_QUERY"
  | "GENERAL_ASSISTANCE";

export interface ExecutionStep {
  id: string;
  title: string;
  status: "pending" | "running" | "completed" | "failed";
  toolName?: string;
  args?: any;
  result?: any;
  error?: string;
}

export interface ExecutiveMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  intent?: ExecutiveIntent;
  plan?: ExecutionStep[];
  suggestions?: string[];
  options?: ExecutiveOption[];
  images?: string[]; // URLs or Base64
}

export interface ExecutiveOption {
  id: string;
  label: string;
  value: any;
  type: "choice" | "action";
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<any>;
}
