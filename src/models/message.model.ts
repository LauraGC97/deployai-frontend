// Tipos de mensajes del chat
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean; // true mientras la IA responde
}

export interface ChatRequest {
  messages: { role: MessageRole; content: string }[];
}