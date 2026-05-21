import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ElementRef,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { AnimateOnScroll } from '@shared/directives/animate-on-scroll';
import { PersonalizationService } from '@core/services/personalization.service';
import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

interface ChatMessage {
  text: string;
  sender: 'user' | 'operator';
  timestamp: number;
}

@Component({
  selector: 'jsl-chat-bubble',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    LucideAngularModule,
    AnimateOnScroll,
    ReactiveFormsModule,
  ],
  templateUrl: './chat-bubble.html',
  styleUrl: './chat-bubble.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatBubbleComponent implements OnInit, OnDestroy {
  @ViewChild('chatBody') private chatBody: ElementRef<HTMLDivElement> | undefined;

  public isOpen = signal(false);
  public showPreview = signal(false);
  public previewTeaser = signal('');
  public messages = signal<ChatMessage[]>([]);
  public proactiveMessageSent = signal(false);

  public chatInput = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  private audio: HTMLAudioElement | null = null;
  private proactiveTimer: any = null;
  private previewTimer: any = null;
  private readonly isBrowser: boolean;
  private hasInteracted = false;

  private personalizationService = inject(PersonalizationService);

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private translate: TranslateService,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    effect(() => {
      if (this.messages() && this.isBrowser) {
        this.scrollToBottom();
      }
    });
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.audio = new Audio('assets/sounds/chat-notification.mp3');
      this.audio.load();

      this.translate
        .get('CHAT.GREETING')
        .subscribe((greeting: string) => {
          this.messages.set([
            {
              text: greeting,
              sender: 'operator',
              timestamp: Date.now(),
            },
          ]);
        });

      this.initializeProactiveChat();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      clearTimeout(this.proactiveTimer);
      clearTimeout(this.previewTimer);
    }
  }

  private initializeProactiveChat(): void {
    this.proactiveTimer = setTimeout(() => {
      this.triggerProactiveMessage();
    }, 7000);
  }

  private triggerProactiveMessage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const lastProactive = localStorage.getItem('jsl_chat_last_proactive');
    const now = Date.now();
    const cooldown = 1000 * 60 * 60; // 1 hour cooldown

    if (lastProactive && now - parseInt(lastProactive) < cooldown) {
      return;
    }

    if (!this.isOpen() && !this.proactiveMessageSent()) {
      const category = isPlatformBrowser(this.platformId) ? this.personalizationService.getMostVisitedCategory() : null;
      const greetingKey = category ? `CHAT.PREVIEW_${category.toUpperCase().replace(/-/g, '_')}` : 'CHAT.PREVIEW_GREETING';

      this.translate
        .get(greetingKey)
        .subscribe((message: string) => {
          // Fallback if key doesn't exist
          if (message === greetingKey) {
            this.translate.get('CHAT.PREVIEW_GREETING').subscribe(m => this.finalizeProactive(m));
          } else {
            this.finalizeProactive(message);
          }
        });
    }
  }

  private finalizeProactive(message: string): void {
    this.previewTeaser.set(message);
    this.showPreview.set(true);

    this.messages.update((msgs) => [
      ...msgs,
      { text: message, sender: 'operator', timestamp: Date.now() },
    ]);
    this.proactiveMessageSent.set(true);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('jsl_chat_last_proactive', Date.now().toString());
    }

    this.playNotificationSound();

    this.previewTimer = setTimeout(() => {
      this.showPreview.set(false);
    }, 5000);
  }

  /**
   * Intenta "desbloquear" el audio reproduciendo y pausando
   * un sonido silencioso en la primera interacción del usuario.
   */
  private unlockAudio(): void {
    if (this.isBrowser && this.audio && !this.hasInteracted) {
      this.audio.play().then(() => {
          // Éxito: el audio está desbloqueado
          this.audio?.pause();
          this.audio!.currentTime = 0;
          this.hasInteracted = true;
        }).catch(() => {
          // El navegador sigue bloqueando, se necesitará otra interacción
        });
    }
  }

  /**
   * Reproduce el sonido de notificación.
   */
  private playNotificationSound(): void {
    if (!this.audio) return; // Si el audio no se ha cargado

    // Reiniciar el audio por si se está reproduciendo
    this.audio.currentTime = 0;

    // Intentar reproducir
    this.audio.play().catch((e) => {
      if (!this.hasInteracted) {
        // Esto es normal si el usuario no ha interactuado con la página.
        console.warn('Audio bloqueado. Esperando interacción del usuario para desbloquear.');
      } else {
        // Si ya interactuó pero falló, es un error real.
        console.error('Error al reproducir sonido:', e);
      }
    });
  }

  /**
   * Maneja el evento keydown para enviar con Enter
   */
  onEnterPress(event: Event): void {
    // Comprobar si es un KeyboardEvent
    if (
      event instanceof KeyboardEvent &&
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault(); // Evitar salto de línea
      this.sendMessage();
    }
  }

  /**
   * Lógica para enviar un mensaje del usuario
   */
  sendMessage(): void {
    this.unlockAudio(); // Primera vez que se envía, desbloquea el audio
    if (this.chatInput.invalid) return;

    const text = this.chatInput.value.trim();
    if (text) {
      this.messages.update((msgs) => [
        ...msgs,
        { text, sender: 'user', timestamp: Date.now() },
      ]);
      this.chatInput.reset('');

      // Simular la respuesta del operador
      this.simulateOperatorReply();
    }
  }

  /**
   * Simula una respuesta automática del "bot"
   */
  private simulateOperatorReply(): void {
    setTimeout(() => {
      this.translate
        .get('CHAT.OPERATOR_REPLY')
        .subscribe((reply: string) => {
          this.messages.update((msgs) => [
            ...msgs,
            { text: reply, sender: 'operator', timestamp: Date.now() },
          ]);
          // ¡Reproducir sonido aquí!
          this.playNotificationSound();
        });
    }, 1500);
  }

  /**
   * Alterna la visibilidad de la ventana de chat
   */
  toggleChat(): void {
    this.isOpen.update((open) => !open);

    if (this.isOpen()) {
      this.unlockAudio(); // Primera vez que se abre, desbloquea el audio
      
      // Ocultar previsualización y limpiar temporizadores
      this.showPreview.set(false);
      clearTimeout(this.proactiveTimer);
      clearTimeout(this.previewTimer);

      // Forzar scroll al fondo al abrir
      this.scrollToBottom(true);
    }
  }

  /**
   * Mueve el scroll del chat al último mensaje
   */
  private scrollToBottom(force = false): void {
    if (this.isBrowser && this.chatBody) {
      setTimeout(() => {
        if (this.chatBody) {
          const el = this.chatBody.nativeElement;
          // Comprobar si el usuario está cerca del final
          const isScrolledToBottom =
            el.scrollHeight - el.clientHeight <= el.scrollTop + 100;

          // Forzar scroll si se acaba de abrir o si el usuario ya estaba abajo
          if (isScrolledToBottom || force) {
            el.scrollTop = el.scrollHeight;
          }
        }
      }, 0); // 0ms de espera para que se renderice el DOM
    }
  }
}