import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  HostListener,
  Inject,
  PLATFORM_ID,
  Renderer2,
  ElementRef,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';
import { GestureBusService } from '@core/services/gesture-bus.service';
import { OverlayManagerService } from '@core/services/overlay-manager.service';
import { BottomSheetGestures } from './bottom-sheet-gestures';

@Component({
  selector: 'jsl-bottom-sheet',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslateModule],
  templateUrl: './bottom-sheet.html',
  styleUrl: './bottom-sheet.scss',
})
export class BottomSheetComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() showCloseButton = true;
  @Output() close = new EventEmitter<void>();

  @ViewChild('sheetContainer') sheetContainer?: ElementRef<HTMLElement>;
  @ViewChild('sheetContent') sheetContent?: ElementRef<HTMLElement>;
  @ViewChild('backdropElement') backdropElement?: ElementRef<HTMLElement>;

  protected isDragging = false;
  public isRendered = false;
  private originalParent: Node | null = null;
  private originalNextSibling: Node | null = null;
  private isAppendedToBody = false;

  public translateY = 100; // % by default (closed)
  public overlayOpacity = 0;
  public transitionStyle = 'transform 400ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease';

  private lastHapticTime = 0;
  private readonly HAPTIC_COOLDOWN_MS = 200;
  private closingTimer: ReturnType<typeof setTimeout> | null = null;

  private gestures?: BottomSheetGestures;
  private gestureBus = inject(GestureBusService);
  private overlayManager = inject(OverlayManagerService);
  private ngZone = inject(NgZone);
  private cdRef = inject(ChangeDetectorRef);

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private hostElementRef: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    const isBrowser = isPlatformBrowser(this.platformId);

    if (isBrowser) {
      const host = this.hostElementRef.nativeElement;
      this.originalParent = host.parentNode;
      this.originalNextSibling = host.nextSibling;
      this.setupGestures();
    }
  }

  private setupGestures(): void {
    this.gestures = new BottomSheetGestures(
      {
        isOpen: () => this.isOpen,
        isAtTop: () => !this.sheetContent || this.sheetContent.nativeElement.scrollTop <= 0,
        onUpdateTranslate: (y, progress, scaleY, transformOrigin) => {
          const isDragging = progress !== null;

          if (isDragging) {
            // High-frequency updates outside Angular zone for performance
            if (this.sheetContainer) {
              const transform = `translateY(${y}px) scaleY(${scaleY ?? 1})`;
              this.renderer.setStyle(this.sheetContainer.nativeElement, 'transform', transform);
              this.renderer.setStyle(
                this.sheetContainer.nativeElement,
                'transform-origin',
                transformOrigin ?? 'bottom'
              );
              this.renderer.setStyle(this.sheetContainer.nativeElement, 'transition', 'none');
            }
            if (this.backdropElement) {
              this.renderer.setStyle(this.backdropElement.nativeElement, 'opacity', (progress ?? 1).toString());
              this.renderer.setStyle(this.backdropElement.nativeElement, 'transition', 'none');
            }
          } else {
            // Reset to reactive state
            this.ngZone.run(() => {
              this.translateY = y;
              this.isDragging = false;
              this.overlayOpacity = this.isOpen ? 1 : 0;
              this.transitionStyle = this.isOpen
                ? 'transform 400ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease'
                : 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1), opacity 250ms ease';

              // Clear manual styles
              if (this.sheetContainer) {
                this.renderer.removeStyle(this.sheetContainer.nativeElement, 'transform');
                this.renderer.removeStyle(this.sheetContainer.nativeElement, 'transform-origin');
                this.renderer.removeStyle(this.sheetContainer.nativeElement, 'transition');
              }
              if (this.backdropElement) {
                this.renderer.removeStyle(this.backdropElement.nativeElement, 'opacity');
                this.renderer.removeStyle(this.backdropElement.nativeElement, 'transition');
              }

              this.cdRef.markForCheck();
            });
          }
        },
        onOpen: () => {
          this.ngZone.run(() => {
            this.updateState(true);
          });
        },
        onClose: () => {
          this.ngZone.run(() => {
            this.onClose();
          });
        },
        onStopTransition: () => {
          this.ngZone.run(() => {
            this.transitionStyle = 'none';
            this.cdRef.markForCheck();
          });
        },
        onToggleHaptic: () => this.triggerThrottledHaptic(),
        getMaxTranslateY: () => this.getSheetHeightPx()
      },
      this.ngZone,
      this.gestureBus
    );
  }

  private getSheetHeightPx(): number {
    return this.sheetContainer?.nativeElement.getBoundingClientRect().height ?? 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (isPlatformBrowser(this.platformId) && changes['isOpen']) {
      const isOpen = changes['isOpen'].currentValue;
      this.updateState(isOpen);
    }
  }

  private updateState(isOpen: boolean): void {
    if (this.closingTimer) {
      clearTimeout(this.closingTimer);
      this.closingTimer = null;
    }

    if (isOpen) {
      this.overlayManager.register('bottom-sheet', { lockScroll: true });
      this.isRendered = true;
      this.syncHostMountPoint(true);

      // Start from closed state
      this.translateY = 100;
      this.overlayOpacity = 0;
      this.transitionStyle = 'none';
      this.cdRef.detectChanges();

      // Trigger animation in next frame
      requestAnimationFrame(() => {
        this.ngZone.run(() => {
          this.transitionStyle = 'transform 400ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease';
          this.translateY = 0;
          this.overlayOpacity = 1;
          this.cdRef.markForCheck();
        });
      });
    } else {
      this.overlayManager.unregister('bottom-sheet');
      this.transitionStyle = 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1), opacity 250ms ease';
      this.translateY = 100;
      this.overlayOpacity = 0;

      this.closingTimer = setTimeout(() => {
        this.ngZone.run(() => {
          this.isRendered = false;
          this.syncHostMountPoint(false);
          this.closingTimer = null;
          this.cdRef.markForCheck();
        });
      }, 300);
    }

    this.cdRef.markForCheck();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.overlayManager.unregister('bottom-sheet');
      if (this.closingTimer) {
        clearTimeout(this.closingTimer);
      }
      this.syncHostMountPoint(false);
      this.gestures?.destroy();
    }
  }

  private syncHostMountPoint(isOpen: boolean): void {
    const host = this.hostElementRef.nativeElement;

    if (isOpen && !this.isAppendedToBody) {
      this.renderer.appendChild(this.document.body, host);
      this.isAppendedToBody = true;
      return;
    }

    if (!isOpen && this.isAppendedToBody && this.originalParent) {
      if (this.originalNextSibling?.parentNode === this.originalParent) {
        this.renderer.insertBefore(this.originalParent, host, this.originalNextSibling);
      } else {
        this.renderer.appendChild(this.originalParent, host);
      }
      this.isAppendedToBody = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  private triggerThrottledHaptic(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const now = Date.now();
    if (now - this.lastHapticTime < this.HAPTIC_COOLDOWN_MS) return;
    this.lastHapticTime = now;

    if (this.document.defaultView?.navigator.vibrate) {
      const activation = (this.document.defaultView?.navigator as any).userActivation;
      if (!activation || activation.isActive) {
        this.document.defaultView.navigator.vibrate(5);
      }
    }
  }

}
