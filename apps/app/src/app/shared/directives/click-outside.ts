// src/app/shared/directives/click-outside.ts

import { Directive, ElementRef, Output, EventEmitter, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[jslClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  // EventEmitter para notificar al componente padre cuando se hace clic fuera
  @Output() jslClickOutside = new EventEmitter<void>();
  private platformId = inject(PLATFORM_ID);

  constructor(private el: ElementRef) {}

  // Escucha los clics en todo el documento
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Comprueba si el objetivo del evento de clic (donde el usuario hizo clic)
    // está contenido dentro del elemento al que se aplica esta directiva.
    const isClickInside = this.el.nativeElement.contains(event.target);

    // Si el clic fue FUERA del elemento, emite el evento.
    if (!isClickInside) {
      this.jslClickOutside.emit();
    }
  }
}
