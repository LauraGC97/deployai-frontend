// Tipos de mensajes del chat
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatRequest {
  messages: { role: MessageRole; content: string }[];
}