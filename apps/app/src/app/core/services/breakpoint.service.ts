import { Injectable, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BreakpointService {
  private breakpointObserver = inject(BreakpointObserver);

  /**
   * Signal that emits true if the current viewport is desktop (width > 992px).
   */
  isDesktop = toSignal(
    this.breakpointObserver.observe('(min-width: 993px)').pipe(map((result) => result.matches)),
    { initialValue: false }
  );

  /**
   * Signal that emits true if the current viewport is mobile or tablet (width <= 992px).
   */
  isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 992px)').pipe(map((result) => result.matches)),
    { initialValue: false }
  );
}
