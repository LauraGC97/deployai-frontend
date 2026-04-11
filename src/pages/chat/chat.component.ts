import {
  Component, inject, signal, computed,
  ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy, HostListener, ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClaudeService } from '../../services/claude.service';
import { Message, MessageRole } from '../../models/message.model';
import { MarkdownService } from '../../services/markdown.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ConversationService, Conversation } from '../../services/conversation.service';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
  encapsulation: ViewEncapsulation.None
})
export class ChatComponent implements AfterViewChecked, OnInit, OnDestroy {

  private readonly claudeService       = inject(ClaudeService);
  private readonly markdownService     = inject(MarkdownService);
  private readonly sanitizer           = inject(DomSanitizer);
  private readonly router              = inject(Router);
  private readonly conversationService = inject(ConversationService);
  readonly authService = inject(AuthService);


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.userMenuOpen.set(false);
    }
  }

  @ViewChild('chatInput') private chatInput!: ElementRef<HTMLTextAreaElement>;

  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.userInput.set(textarea.value);
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  }

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages              = signal<Message[]>([]);
  userInput             = signal<string>('');
  isLoading             = signal<boolean>(false);
  selectedMode          = signal<'generate' | 'analyze' | 'explain'>('generate');
  currentConversationId = signal<string | null>(null);
  private shouldScroll  = false;

  canSend = computed(() =>
    this.userInput().trim().length > 0 && !this.isLoading()
  );

  private readonly systemPrompts: Record<string, string> = {
    generate: `Eres Deploy AI, un asistente experto en generación de código.
      Cuando el usuario describa una funcionalidad, genera el código completo,
      limpio y comentado. Indica el lenguaje usado. Responde siempre en español.`,
    analyze: `Eres Deploy AI, un experto en revisión de código.
      Analiza el código que te proporcione el usuario, detecta errores,
      malas prácticas y sugiere mejoras concretas. Responde siempre en español.`,
    explain: `Eres Deploy AI, un tutor de programación.
      Explica los conceptos de programación de forma clara y con ejemplos prácticos.
      Adapta el nivel de detalle a la pregunta. Responde siempre en español.`
  };

  readonly suggestions: Record<string, string[]> = {
    generate: [
      'Genera un componente Angular con formulario reactivo',
      'Crea una función para validar un email en TypeScript',
      'Genera un servicio HTTP con manejo de errores'
    ],
    analyze: [
      'Analiza este código y dime qué mejorar',
      'Detecta posibles bugs en mi función',
      'Revisa si sigo buenas prácticas en este componente'
    ],
    explain: [
      '¿Qué es un Observable en RxJS?',
      'Explícame la diferencia entre signal y BehaviorSubject',
      '¿Cómo funciona el ciclo de vida de Angular?'
    ]
  };

  // ── EVENT DELEGATION para botón copiar ────────────────────────────────────

 copyHandler = (event: Event) => {
  const target = event.target as HTMLElement;
  const btn = target.closest('.copy-btn') as HTMLElement;
  
  if (!btn) return;
  const codeBlock = btn.closest('.code-block-wrapper')?.querySelector('code');
  const code = codeBlock?.textContent ?? '';

  if (!code) return;

  const showSuccessFeedback = () => {
    const label = btn.querySelector('.copy-label') as HTMLElement;
    if (label) label.textContent = '¡Copiado!';
    btn.classList.add('copied');
    
    setTimeout(() => {
      if (label) label.textContent = 'Copiar';
      btn.classList.remove('copied');
    }, 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code)
      .then(() => {
        showSuccessFeedback();
      })
      .catch((err) => {
        console.warn('Fallo en clipboard API, intentando fallback...', err);
        this.fallbackCopy(code, showSuccessFeedback);
      });
  } else {
    this.fallbackCopy(code, showSuccessFeedback);
  }
};

private fallbackCopy(code: string, onSuccess: () => void) {
  const textarea = document.createElement('textarea');
  textarea.value = code;
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      onSuccess();
    }
  } catch (err) {
    console.error('El fallback de copiado falló', err);
  } finally {
    document.body.removeChild(textarea);
  }
}

  // ── LIFECYCLE ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.conversationService.reloadForUser();
    document.addEventListener('mousedown', this.copyHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousedown', this.copyHandler);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  // ── CONVERSACIONES ─────────────────────────────────────────────────────────

  get conversations() {
    return this.conversationService.conversations;
  }

  loadConversation(conv: Conversation): void {
    this.messages.set(conv.messages);
    this.selectedMode.set(conv.mode);
    this.currentConversationId.set(conv.id);
    this.shouldScroll = true;
  }

  newConversation(): void {
    this.messages.set([]);
    this.currentConversationId.set(null);
    this.userInput.set('');
  }

  deleteConversation(id: string, event: Event): void {
    event.stopPropagation();
    this.conversationService.deleteConversation(id);
    if (this.currentConversationId() === id) {
      this.newConversation();
    }
  }

  // ── USER ───────────────────────────────────────────────────────────────────

  userMenuOpen = signal<boolean>(false);

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  getUserInitials(): string {
    const name = this.authService.currentUser()?.name ?? '';
    return name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.newConversation();
    this.authService.logout();
  }

  // ── MODO Y SUGERENCIAS ─────────────────────────────────────────────────────

  setMode(mode: 'generate' | 'analyze' | 'explain'): void {
    this.selectedMode.set(mode);
  }

  setSuggestion(text: string): void {
    this.userInput.set(text);
  }

  updateInput(value: string): void {
    this.userInput.set(value);
  }

  // ── ENVÍO DE MENSAJES ──────────────────────────────────────────────────────

  sendMessage(): void {
    const content = this.userInput().trim();
    if (!content || this.isLoading()) return;

    const userMessage: Message = {
      id:        crypto.randomUUID(),
      role:      'user' as MessageRole,
      content,
      timestamp: new Date()
    };

    const loadingMessage: Message = {
      id:        crypto.randomUUID(),
      role:      'assistant' as MessageRole,
      content:   '',
      timestamp: new Date(),
      isLoading: true
    };

    this.messages.update(msgs => [...msgs, userMessage, loadingMessage]);
    this.userInput.set('');
    this.isLoading.set(true);
    this.shouldScroll = true;

    setTimeout(() => {
    if (this.chatInput?.nativeElement) {
      this.chatInput.nativeElement.value = '';
      this.chatInput.nativeElement.style.height = 'auto';
      this.chatInput.nativeElement.style.height = '46px';
      }
    }, 0);

    setTimeout(() => {
      if (this.chatInput?.nativeElement) {
        this.chatInput.nativeElement.focus();
      }
    }, 100);

    const history = this.messages()
      .filter(m => !m.isLoading)
      .map(m => ({ role: m.role, content: m.content }));

    const requestMessages = [
      { role: 'user' as MessageRole,      content: this.systemPrompts[this.selectedMode()] },
      { role: 'assistant' as MessageRole, content: 'Entendido. Estoy listo para ayudarte.' },
      ...history
    ];

    this.claudeService.sendMessage({ messages: requestMessages }).subscribe({
      next: (responseContent) => {
        this.messages.update(msgs =>
          msgs.map(m =>
            m.isLoading
              ? { ...m, content: responseContent, isLoading: false }
              : m
          )
        );
        this.isLoading.set(false);
        this.shouldScroll = true;

        const currentId = this.currentConversationId();
        if (currentId) {
          this.conversationService.updateConversation(currentId, this.messages());
        } else {
          const conv = this.conversationService.createConversation(
            this.messages(),
            this.selectedMode()
          );
          this.currentConversationId.set(conv.id);
        }
      },
      error: (err: Error) => {
        this.messages.update(msgs =>
          msgs.map(m =>
            m.isLoading
              ? { ...m, content: `Error: ${err.message}`, isLoading: false }
              : m
          )
        );
        this.isLoading.set(false);
      }
    });
  }

  // ── NAVEGACIÓN ─────────────────────────────────────────────────────────────

  goHome(): void {
    this.router.navigate(['/']);
  }

  sidebarOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  handleEnter(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.shiftKey) return;
    event.preventDefault();
    this.sendMessage();
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────

  renderMarkdown(content: string): SafeHtml {
    const html = this.markdownService.parse(content);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch { }
  }
}