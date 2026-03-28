import { Injectable, signal, inject } from '@angular/core';
import { Message } from '../models/message.model';
import { AuthService } from './auth.service';

export interface Conversation {
  id:        string;
  title:     string;
  messages:  Message[];
  createdAt: Date;
  mode:      'generate' | 'analyze' | 'explain';
  userId:    number; // ← vincula al usuario
}

@Injectable({ providedIn: 'root' })
export class ConversationService {

  private readonly authService = inject(AuthService);

  // Clave dinámica por usuario
  private get STORAGE_KEY(): string {
    const userId = this.authService.currentUser()?.id ?? 'guest';
    return `deploy_conversations_${userId}`;
  }

  conversations = signal<Conversation[]>(this.loadFromStorage());

  // Recarga el historial cuando cambia el usuario
  reloadForUser(): void {
    this.conversations.set(this.loadFromStorage());
  }

  private loadFromStorage(): Conversation[] {
    try {
      const userId = this.authService.currentUser()?.id ?? 'guest';
      const key    = `deploy_conversations_${userId}`;
      const raw    = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Conversation[];
      return parsed.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        messages:  c.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
      }));
    } catch {
      return [];
    }
  }

  private saveToStorage(convs: Conversation[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(convs));
  }

  createConversation(
    messages: Message[],
    mode: 'generate' | 'analyze' | 'explain'
  ): Conversation {
    const firstUserMsg = messages.find(m => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 40) + '...'
      : 'Nueva conversación';

    const conv: Conversation = {
      id:        crypto.randomUUID(),
      title,
      messages,
      createdAt: new Date(),
      mode,
      userId:    this.authService.currentUser()?.id ?? 0
    };

    this.conversations.update(list => {
      const updated = [conv, ...list];
      this.saveToStorage(updated);
      return updated;
    });

    return conv;
  }

  updateConversation(id: string, messages: Message[]): void {
    this.conversations.update(list => {
      const updated = list.map(c =>
        c.id === id ? { ...c, messages } : c
      );
      this.saveToStorage(updated);
      return updated;
    });
  }

  deleteConversation(id: string): void {
    this.conversations.update(list => {
      const updated = list.filter(c => c.id !== id);
      this.saveToStorage(updated);
      return updated;
    });
  }

  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.conversations.set([]);
  }
}