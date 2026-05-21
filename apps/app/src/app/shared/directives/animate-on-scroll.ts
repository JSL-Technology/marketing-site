import { Directive, ElementRef, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // <-- 1. Importar

@Directive({
  selector: '[jslAnimateOnScroll]',
  standalone: true
})
export class AnimateOnScroll implements OnInit, OnDestroy {
  private observer: IntersectionObserver | null = null;

  constructor(
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: object // <-- 2. Inyectar PLATFORM_ID
  ) {}

  ngOnInit(): void {
    // 3. Añadir la comprobación de la plataforma
    if (isPlatformBrowser(this.platformId)) {
      const options = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1 // 10% del elemento debe ser visible
      };

      this.observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // Dejar de observar una vez animado
          }
        });
      }, options);

      this.observer.observe(this.el.nativeElement);
    }
  }

  ngOnDestroy(): void {
    // Esta comprobación ya es segura para SSR,
    // ya que this.observer solo se creará en el navegador.
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}