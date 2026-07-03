export type ModelSource = 'local' | 'remote';
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: number;
  role: ChatRole;
  content: string;
  modelUsed: ModelSource | null;
  createdAt: number;
}
