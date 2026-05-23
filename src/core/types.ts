export type Platform = "TikTok" | "X" | "Instagram" | "LinkedIn" | "YouTube";
export type ContentType = "Post" | "Thread" | "Article" | "VideoScript" | "ImagePrompt";
export type ProviderType = "Gemini" | "OpenAI" | "Anthropic" | "Runway" | "ElevenLabs";

export interface WorkspaceContext {
  workspaceId: string;
  brandIdentity: Record<string, any>;
  personas: Record<string, any>[];
  targetAudience: Record<string, any>;
  preferences: Record<string, any>;
  performanceHistory: Record<string, any>[];
}

export interface PromptTemplate {
  id: string;
  category: "text" | "image" | "video" | "voice";
  template: string;
  variables: string[];
}

export interface AIRequest {
  id: string;
  type: "generate_text" | "generate_image" | "generate_video" | "analyze";
  payload: any;
  priority: number;
  workspaceId: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: number;
}

export interface SystemEvent {
  type: string;
  payload: any;
  timestamp: number;
  source: string;
}
