import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CanonicalService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly ORIGIN = 'https://www.jsl.technology';

  init(): void {
    // Establece el canonical en cada cambio de ruta (SSR + cliente)
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Usa solo el path, descarta query params para el canonical
        const path = this.router.url.split('?')[0];
        // Garantiza trailing slash en el canonical
        const canonical = `${this.ORIGIN}${path.endsWith('/') ? path : path + '/'}`;
        this.setCanonicalTag(canonical);
      });
  }

  private setCanonicalTag(href: string): void {
    // Reutiliza el tag si ya existe — no crea duplicados en navegación SPA
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
