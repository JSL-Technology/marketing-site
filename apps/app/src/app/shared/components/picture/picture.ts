import { Component, Input, OnChanges, HostBinding } from '@angular/core';

/**
 * Componente de imagen multi-formato con soporte AVIF → WebP → JPEG y srcset responsivo.
 *
 * Uso básico:
 *   <jsl-picture avifSrc="assets/imgs/Avif/hero.avif" alt="Hero" [fill]="true" [priority]="true">
 *
 * Con srcset responsivo (recomendado para imágenes de contenido):
 *   <jsl-picture
 *     avifSrc="assets/imgs/hero.avif"
 *     [avifSrcset]="'assets/imgs/hero-400.avif 400w, assets/imgs/hero-800.avif 800w'"
 *     sizes="(max-width: 768px) 100vw, 50vw"
 *     alt="Hero">
 */
@Component({
  selector: 'jsl-picture',
  standalone: true,
  templateUrl: './picture.html',
  styleUrl: './picture.scss'
})
export class PictureComponent implements OnChanges {
  /** Ruta al archivo AVIF (fuente principal). Requerido. */
  @Input({ required: true }) avifSrc!: string;

  /** srcset para AVIF con múltiples resoluciones. Ej: "hero-400.avif 400w, hero-800.avif 800w" */
  @Input() avifSrcset?: string;

  /** Ruta al archivo WebP (opcional). */
  @Input() webpSrc?: string;

  /** srcset para WebP con múltiples resoluciones. */
  @Input() webpSrcset?: string;

  /** Ruta al archivo de fallback (JPEG/PNG). Si no se provee, usa avifSrc como fallback. */
  @Input() fallbackSrc?: string;

  /** srcset para el fallback JPEG/PNG. */
  @Input() fallbackSrcset?: string;

  /**
   * Pista de tamaños para que el browser elija la fuente correcta del srcset.
   * Ej: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
   */
  @Input() sizes?: string;

  /** Texto alternativo para accesibilidad. */
  @Input() alt = '';

  /** Modo fill: cubre el contenedor padre (el padre debe tener position: relative). */
  @Input() fill = false;

  /** Imagen de alta prioridad (LCP): desactiva lazy loading y añade fetchpriority="high". */
  @Input() priority = false;

  /** Ancho intrínseco en píxeles (ignorado en modo fill). */
  @Input() width?: number;

  /** Alto intrínseco en píxeles (ignorado en modo fill). */
  @Input() height?: number;

  @HostBinding('class.jsl-picture--fill') get isFill() { return this.fill; }

  resolvedFallbackSrc = '';

  ngOnChanges(): void {
    this.resolvedFallbackSrc = this.fallbackSrc || this.avifSrc;
  }
}
