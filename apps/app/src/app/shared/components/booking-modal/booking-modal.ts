import { Component, Input, Output, EventEmitter, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { CALENDLY_URL } from '@core/constants/tokens';

@Component({
  selector: 'jsl-booking-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SafeUrlPipe],
  template: `
    <div class="booking-modal-overlay" *ngIf="isOpen" (click)="onClose()">
      <div class="booking-modal-container" (click)="$event.stopPropagation()">
        <div class="booking-modal-header">
           <h3>Book a Meeting</h3>
           <button class="close-btn" (click)="onClose()" aria-label="Close">
             <lucide-icon name="X"></lucide-icon>
           </button>
        </div>
        <div class="booking-content">
          @if (hasValidUrl) {
            <iframe
              [src]="resolvedBookingUrl | safeUrl"
              width="100%"
              height="100%"
              frameborder="0"
              title="Booking Calendar"
              loading="lazy">
            </iframe>
          } @else {
            <div class="booking-placeholder">
              <p>Configure <code>CALENDLY_URL</code> environment variable to enable booking.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .booking-modal-overlay {
      position: fixed;
      top: 0;
      inset-inline-start: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.3s ease;
    }

    .booking-modal-container {
      width: 100%;
      max-width: 800px;
      height: 80vh;
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid var(--border-color);
    }

    .booking-modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-main);
      }
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      color: var(--text-muted);
      border-radius: 50%;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: var(--bg-secondary);
        color: var(--text-main);
      }
    }

    .booking-content {
      flex: 1;
      overflow: hidden;

      iframe {
        width: 100%;
        height: 100%;
        display: block;
      }
    }

    .booking-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 2rem;
      color: var(--text-muted);
      text-align: center;

      code {
        background: var(--bg-secondary);
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-size: 0.875em;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class BookingModal implements OnInit {
  private readonly calendlyUrl = inject(CALENDLY_URL, { optional: true }) ?? '';

  @Input() isOpen = false;
  @Input() bookingUrl = '';
  @Output() close = new EventEmitter<void>();

  get resolvedBookingUrl(): string {
    return this.bookingUrl || this.calendlyUrl;
  }

  get hasValidUrl(): boolean {
    const url = this.resolvedBookingUrl;
    return Boolean(url) && url !== 'https://calendly.com';
  }

  ngOnInit(): void {
    if (!this.bookingUrl) {
      this.bookingUrl = this.calendlyUrl;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(_event: Event) {
    if (this.isOpen) {
      this.onClose();
    }
  }

  onClose() {
    this.close.emit();
  }
}
