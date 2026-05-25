import { Component, Input, Output, EventEmitter, HostListener, OnChanges, OnDestroy, SimpleChanges, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { OverlayManagerService } from '@core/services/overlay-manager.service';

@Component({
  selector: 'jsl-video-modal',
  standalone: true,
  imports: [LucideAngularModule, SafeUrlPipe],
  template: `
    @if (isOpen) {
      <div class="video-modal-overlay" (click)="onClose()">
        <div class="video-modal-container" (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="onClose()" aria-label="Close">
            <lucide-icon name="X"></lucide-icon>
          </button>
          <div class="video-wrapper">
            <iframe
              [src]="videoUrl | safeUrl"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .video-modal-overlay {
      position: fixed;
      top: 0;
      inset-inline-start: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      animation: fadeIn 0.3s ease;
    }

    .video-modal-container {
      position: relative;
      width: 100%;
      max-width: 900px;
      background: #000;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .video-wrapper {
      position: relative;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      height: 0;

      iframe {
        position: absolute;
        top: 0;
        inset-inline-start: 0;
        width: 100%;
        height: 100%;
      }
    }

    .close-btn {
      position: absolute;
      top: -3rem;
      inset-inline-end: 0;
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }

      @media (min-width: 768px) {
        top: 1rem;
        inset-inline-end: 1rem;
        background: rgba(0,0,0,0.5);
        border-radius: 50%;
        z-index: 10;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class VideoModal implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() videoUrl = '';
  @Output() close = new EventEmitter<void>();

  private readonly overlayManager = inject(OverlayManagerService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.overlayManager.register('video-modal', { lockScroll: true });
      } else {
        this.overlayManager.unregister('video-modal');
      }
    }
  }

  ngOnDestroy(): void {
    this.overlayManager.unregister('video-modal');
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    if (isPlatformBrowser(this.platformId) && this.isOpen) {
      this.onClose();
    }
  }

  onClose() {
    this.overlayManager.unregister('video-modal');
    this.close.emit();
  }
}
