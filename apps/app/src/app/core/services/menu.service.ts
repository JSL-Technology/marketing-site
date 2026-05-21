import { Injectable, signal } from '@angular/core';

export type MenuCloseReason =
  | 'overlay'
  | 'escape'
  | 'button'
  | 'gesture'
  | 'navigation'
  | 'system';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  isMobileMenuOpen = signal(false);
  closeReason = signal<MenuCloseReason | null>(null);

  // Global cooldown to prevent race conditions and rapid toggling
  private lastStateChangeAt = 0;
  private readonly STATE_CHANGE_THRESHOLD_MS = 400;

  private canChangeState(): boolean {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return now - this.lastStateChangeAt >= this.STATE_CHANGE_THRESHOLD_MS;
  }

  private updateLastChangeTime(): void {
    this.lastStateChangeAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  open() {
    if (this.isMobileMenuOpen() || !this.canChangeState()) return;

    this.updateLastChangeTime();
    this.isMobileMenuOpen.set(true);
    this.closeReason.set(null);
  }

  close(reason: MenuCloseReason = 'system') {
    // If it's already closed, we might still want to update the reason if it was 'system'
    // but generally we respect the cooldown to prevent animation glitches.
    if (!this.isMobileMenuOpen() || !this.canChangeState()) return;

    this.updateLastChangeTime();
    this.closeReason.set(reason);
    this.isMobileMenuOpen.set(false);
  }

  toggle(reasonOnClose: MenuCloseReason = 'button') {
    if (!this.canChangeState()) return;

    this.updateLastChangeTime();
    this.isMobileMenuOpen.update((isOpen) => {
      const nextState = !isOpen;
      if (!nextState) {
        this.closeReason.set(reasonOnClose);
      } else {
        this.closeReason.set(null);
      }
      return nextState;
    });
  }
}
