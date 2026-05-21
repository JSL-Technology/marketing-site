import { NgZone, isDevMode } from '@angular/core';
import { GestureBusService, GestureHandler } from '@core/services/gesture-bus.service';
import {
  GESTURE_EDGE_THRESHOLD,
  GESTURE_OPEN_THRESHOLD,
  GESTURE_MIN_SWIPE_DISTANCE,
  GESTURE_VELOCITY_THRESHOLD,
  GESTURE_HORIZONTAL_THRESHOLD,
  GESTURE_VERTICAL_LOCK_THRESHOLD,
  GESTURE_ANGULAR_RATIO,
  GESTURE_VELOCITY_WINDOW_MS,
  GESTURE_TAP_TIMEOUT_MS,
  GESTURE_COOLDOWN_MS,
  GESTURE_ELASTIC_RESISTANCE,
  GESTURE_MAX_STRETCH_PERCENT,
} from './mobile-menu.constants';

export interface MobileMenuGestureConfig {
  maxStretchPercent?: number;
  elasticResistance?: number;

  edgeThreshold?: number;
  openThreshold?: number;
  minSwipeDistance?: number;
  velocityThreshold?: number;
  horizontalThreshold?: number;
  verticalLockThreshold?: number;

  menuWidth: number;
  isRtl: () => boolean;
  isOpen: () => boolean;
  isAnimating: () => boolean;
  /** Returns true if the pointer target is inside the drawer element. */
  isTargetInsideMenu?: (target: HTMLElement) => boolean;
  /** Returns true if the pointer target is the toggle button. */
  isTargetToggleButton?: (target: HTMLElement) => boolean;
  /** Returns the current visual translateX of the drawer (needed to resume gestures mid-animation). */
  getCurrentTranslateX: () => number;

  onUpdateTranslate: (
    translateX: number,
    progress: number | null,
    scaleX?: number,
    transformOrigin?: string
  ) => void;
  onOpen: () => void;
  onClose: () => void;
  onStopTransition: () => void;
  onToggleHaptic: () => void;
  onTransitionComplete?: () => void;
  onTrackMetric?: (metric: string, data: Record<string, unknown>) => void;
}

export class MobileMenuGestures implements GestureHandler {
  public name     = 'MobileMenu';
  public priority = 100;

  // ── Adaptive thresholds ──────────────────────────────────────────────────────

  private get viewportWidth(): number {
    return this.sessionViewportWidth || (typeof window !== 'undefined' ? window.innerWidth : 1024);
  }

  private get dpr(): number {
    return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  }

  private get edgeThreshold(): number {
    const base   = this.config.edgeThreshold ?? GESTURE_EDGE_THRESHOLD;
    const factor = this.viewportWidth < 360 ? 1.2 : 1.0;
    return base * factor;
  }

  private get openThreshold(): number {
    return this.config.openThreshold ?? GESTURE_OPEN_THRESHOLD;
  }

  private get minSwipeDistance(): number {
    const base       = this.config.minSwipeDistance ?? GESTURE_MIN_SWIPE_DISTANCE;
    const typeFactor = this.sessionPointerType === 'mouse' ? 1.5 : 1.0;
    return base * (this.dpr > 1.5 ? 0.8 : 1.0) * typeFactor;
  }

  private get velocityThreshold(): number {
    const base       = this.config.velocityThreshold ?? GESTURE_VELOCITY_THRESHOLD;
    const typeFactor = this.sessionPointerType === 'mouse' ? 1.2 : 1.0;
    return base * (this.dpr > 1.5 ? 1.15 : 1.0) * typeFactor;
  }

  private get horizontalThreshold(): number {
    const base = this.config.horizontalThreshold ?? GESTURE_HORIZONTAL_THRESHOLD;
    // Nota: cuando isDragging es true este getter se evalúa para gestos
    // subsecuentes dentro de la misma sesión de puntero, no para la detección
    // inicial. El umbral reducido (base − 4) asegura que micro-movimientos
    // continúen siendo reconocidos sin reiniciar la detección de dirección.
    // Con base = 6 (default), el mínimo resultante es 2px, que es intencional
    // para mantener la fluidez durante un arrastre activo.
    return this.isDragging ? base - 4 : base;
  }

  private get verticalLockThreshold(): number {
    return this.config.verticalLockThreshold ?? GESTURE_VERTICAL_LOCK_THRESHOLD;
  }

  private get tapThreshold(): number {
    const base = 10 * (this.dpr > 1.5 ? 1.5 : 1.0);
    return this.sessionPointerType === 'mouse' ? base * 0.7 : base;
  }

  // ── Gesture state ────────────────────────────────────────────────────────────
  private isDragging           = false;
  private isEdgeSwipeActive    = false;
  private isOverlaySwipeActive = false;
  private isEdgeSwipeEnabled   = false;

  private sessionViewportWidth = 0;
  private sessionMenuWidth     = 0;
  private sessionIsRtl         = false;
  private sessionPointerType   = 'touch';

  private startX             = 0;
  private startY             = 0;
  private currentX           = 0;
  private currentY           = 0;
  private isHorizontalGesture = false;
  private initialTranslateX  = 0;
  private lastDragPosition   = 0;
  private wasOvershooting    = false;
  private activePointerId: number | null = null;
  private lastTransitionTime = -Infinity;

  private overlayDownX    = 0;
  private overlayDownY    = 0;
  private overlayStartTime = 0;

  // ── Instantaneous velocity buffer ────────────────────────────────────────────
  private velocityBuffer: Array<{ x: number; t: number }> = [];

  // ── Elastic animation constants ──────────────────────────────────────────────
  private readonly ELASTIC_OVERSHOOT_REFERENCE_RATIO = 0.25;
  private readonly MIN_ELASTIC_EXPONENT = 1;
  private readonly MAX_ELASTIC_EXPONENT = 5;

  private gestureBusUnregister: (() => void) | null = null;

  constructor(
    private config: MobileMenuGestureConfig,
    private ngZone: NgZone,
    private gestureBus: GestureBusService
  ) {
    this.gestureBusUnregister = this.gestureBus.registerHandler(this);
  }

  private debugGesture(event: string, details: Record<string, unknown> = {}): void {
    if (!isDevMode()) return;
    console.log('[MobileMenuGestures]', event, {
      ...details,
      state: {
        activePointerId:     this.activePointerId,
        isDragging:          this.isDragging,
        isHorizontalGesture: this.isHorizontalGesture,
        isEdgeSwipeActive:   this.isEdgeSwipeActive,
        isOverlaySwipeActive: this.isOverlaySwipeActive,
      },
    });
  }

  // ── Public state accessors ───────────────────────────────────────────────────
  public getIsDragging(): boolean          { return this.isDragging; }
  public getIsHorizontalGesture(): boolean { return this.isHorizontalGesture; }

  public startCooldown(): void {
    this.lastTransitionTime = performance.now();
  }

  // ── Velocity helpers ─────────────────────────────────────────────────────────

  private pushVelocitySample(x: number): void {
    const now    = performance.now();
    const cutoff = now - GESTURE_VELOCITY_WINDOW_MS;
    this.velocityBuffer.push({ x, t: now });
    // Eliminar entradas obsoletas del frente (las más antiguas) sin crear un
    // nuevo array en cada evento pointermove — crítico a 60-120 fps.
    while (this.velocityBuffer.length > 0 && this.velocityBuffer[0].t < cutoff) {
      this.velocityBuffer.shift();
    }
  }

  /**
   * Returns the signed velocity (px/ms).
   * Positive = rightward movement, Negative = leftward movement.
   */
  private getInstantaneousVelocity(): number {
    if (this.velocityBuffer.length < 2) return 0;
    const first = this.velocityBuffer[0];
    const last  = this.velocityBuffer[this.velocityBuffer.length - 1];
    const dt    = last.t - first.t;
    return dt > 0 ? (last.x - first.x) / dt : 0;
  }

  private resetVelocityBuffer(): void {
    this.velocityBuffer = [];
  }

  private detectHorizontalGesture(
    absDiffX: number,
    absDiffY: number,
    signedVelocity: number
  ): boolean {
    if (absDiffY > this.verticalLockThreshold && absDiffY > absDiffX * GESTURE_ANGULAR_RATIO) {
      return false;
    }

    const velocityMagnitude       = Math.abs(signedVelocity);
    const isFastHorizontal        = velocityMagnitude > this.velocityThreshold * 0.8;
    const hasClearDirectionalIntent = absDiffX > absDiffY * (GESTURE_ANGULAR_RATIO * 1.5);

    if (isFastHorizontal && hasClearDirectionalIntent && absDiffX > 3) {
      return true;
    }

    return absDiffX > this.horizontalThreshold && absDiffX > absDiffY * GESTURE_ANGULAR_RATIO;
  }

  // ── Position / progress helpers ──────────────────────────────────────────────

  private getClosedPosition(menuWidth: number): number {
    return this.sessionIsRtl ? menuWidth : -menuWidth;
  }

  private getProgress(translateX: number, menuWidth: number): number {
    const closed = this.getClosedPosition(menuWidth);
    return this.sessionIsRtl
      ? (closed - translateX) / menuWidth
      : (translateX - closed) / menuWidth;
  }

  // ── Elastic scale calculation ────────────────────────────────────────────────

  private calculateElasticScale(overshoot: number): number {
    const safeOvershoot = Math.max(0, overshoot);
    if (safeOvershoot === 0) return 1;

    const maxStretchPercent = Math.max(0, this.config.maxStretchPercent ?? GESTURE_MAX_STRETCH_PERCENT);
    const maxScale          = 1 + maxStretchPercent / 100;

    const referenceOvershootPx   = Math.max(1, this.config.menuWidth * this.ELASTIC_OVERSHOOT_REFERENCE_RATIO);
    const normalizedOvershoot    = Math.min(safeOvershoot / referenceOvershootPx, 1);

    const rawResistance          = this.config.elasticResistance ?? GESTURE_ELASTIC_RESISTANCE;
    const safeResistance         = Number.isFinite(rawResistance) ? Number(rawResistance) : GESTURE_ELASTIC_RESISTANCE;
    const normalizedResistance   = Math.min(100, Math.max(0, safeResistance)) / 100;
    const exponent               =
      this.MIN_ELASTIC_EXPONENT +
      normalizedResistance * (this.MAX_ELASTIC_EXPONENT - this.MIN_ELASTIC_EXPONENT);

    const damped = 1 - Math.pow(1 - normalizedOvershoot, exponent);
    return 1 + damped * (maxScale - 1);
  }

  private getElasticTransform(
    translateX: number,
    min: number,
    max: number,
    isRtl: boolean
  ): { translateX: number; scaleX: number; transformOrigin: string } {
    let finalTranslateX = translateX;
    let scaleX          = 1;
    let transformOrigin = isRtl ? 'right' : 'left';

    if (translateX > max) {
      finalTranslateX = max;
      scaleX          = this.calculateElasticScale(translateX - max);
      transformOrigin = 'left';
    } else if (translateX < min) {
      finalTranslateX = min;
      scaleX          = this.calculateElasticScale(min - translateX);
      transformOrigin = 'right';
    }

    return { translateX: finalTranslateX, scaleX, transformOrigin };
  }

  // ── Pointer down ─────────────────────────────────────────────────────────────

  public onPointerDown(event: PointerEvent): boolean {
    if (this.activePointerId !== null) {
      this.debugGesture('pointer_down_ignored', { reason: 'active_pointer_exists', pointerId: event.pointerId });
      return false;
    }

    if (performance.now() - this.lastTransitionTime < GESTURE_COOLDOWN_MS) {
      this.debugGesture('pointer_down_ignored', { reason: 'cooldown', pointerId: event.pointerId });
      return false;
    }

    if (!event.isPrimary) {
      this.debugGesture('pointer_down_ignored', { reason: 'not_primary', pointerId: event.pointerId });
      return false;
    }

    const target = event.target as HTMLElement;
    if (this.config.isTargetToggleButton?.(target)) {
      this.debugGesture('pointer_down_ignored', { reason: 'toggle_button', pointerId: event.pointerId });
      return false;
    }
    if (event.pointerType === 'mouse' && event.button !== 0) {
      this.debugGesture('pointer_down_ignored', { reason: 'non_left_click', pointerId: event.pointerId, button: event.button });
      return false;
    }

    this.sessionViewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    this.sessionMenuWidth     = this.config.menuWidth;
    this.sessionIsRtl         = this.config.isRtl();
    this.sessionPointerType   = event.pointerType;

    const isRtl = this.sessionIsRtl;

    if (this.config.isOpen()) {
      if (target?.classList.contains('jsl-mm-overlay')) {
        this.startOverlayInteraction(event);
        this.debugGesture('overlay_interaction_detected', { pointerId: event.pointerId, x: event.clientX, y: event.clientY });
        return true;
      }
    }

    const isClosed = !this.config.isOpen() && !this.config.isAnimating();

    if (this.isEdgeSwipeEnabled && isClosed) {
      const isEdge = isRtl
        ? event.clientX > this.sessionViewportWidth - this.edgeThreshold
        : event.clientX < this.edgeThreshold;

      if (isEdge) {
        this.startEdgeSwipe(event);
        this.debugGesture('edge_swipe_detected', { pointerId: event.pointerId, x: event.clientX, y: event.clientY });
        return true;
      }
    }

    const isOpenOrAnimating = this.config.isOpen() || this.config.isAnimating();
    if (isOpenOrAnimating) {
      const isInsideMenu = this.config.isTargetInsideMenu
        ? this.config.isTargetInsideMenu(target)
        : this.isPointerWithinMenuBounds(event.clientX);

      if (isInsideMenu) {
        this.startMenuDrag(event);
        this.debugGesture('drawer_drag_detected', { pointerId: event.pointerId, x: event.clientX, y: event.clientY });
        return true;
      }
    }

    this.debugGesture('pointer_down_ignored', { reason: 'no_gesture_match', pointerId: event.pointerId, x: event.clientX, y: event.clientY });
    return false;
  }

  private startOverlayInteraction(event: PointerEvent): void {
    this.config.onStopTransition();
    this.activePointerId   = event.pointerId;
    this.overlayDownX      = event.clientX;
    this.overlayDownY      = event.clientY;
    this.overlayStartTime  = performance.now();
    this.startX            = event.clientX;
    this.startY            = event.clientY;
    this.currentX          = this.startX;
    this.currentY          = this.startY;
    this.isDragging        = false;
    this.isHorizontalGesture = false;
    this.wasOvershooting   = false;
    this.isEdgeSwipeActive = false;
    this.isOverlaySwipeActive = true;
    this.resetVelocityBuffer();
    this.initialTranslateX = this.config.getCurrentTranslateX();
    this.lastDragPosition  = this.initialTranslateX;
  }

  private isPointerWithinMenuBounds(pointerX: number): boolean {
    if (this.sessionIsRtl) {
      return pointerX >= this.sessionViewportWidth - this.sessionMenuWidth;
    }
    return pointerX <= this.sessionMenuWidth;
  }

  private startMenuDrag(event: PointerEvent): void {
    this.config.onStopTransition();
    this.activePointerId  = event.pointerId;
    this.startX           = event.clientX;
    this.startY           = event.clientY;
    this.currentX         = this.startX;
    this.currentY         = this.startY;
    this.isDragging       = false;
    this.isHorizontalGesture = false;
    this.wasOvershooting  = false;
    this.isEdgeSwipeActive    = false;
    this.isOverlaySwipeActive = false;
    this.resetVelocityBuffer();
    this.initialTranslateX = this.config.getCurrentTranslateX();
    this.lastDragPosition  = this.initialTranslateX;
  }

  private startEdgeSwipe(event: PointerEvent): void {
    this.activePointerId  = event.pointerId;
    this.startX           = event.clientX;
    this.startY           = event.clientY;
    this.currentX         = this.startX;
    this.currentY         = this.startY;
    this.isDragging       = true;
    this.isHorizontalGesture = false;
    this.wasOvershooting  = false;
    this.isEdgeSwipeActive    = true;
    this.isOverlaySwipeActive = false;
    this.resetVelocityBuffer();

    const menuWidth           = this.sessionMenuWidth;
    this.initialTranslateX    = this.sessionIsRtl ? menuWidth : -menuWidth;
    this.lastDragPosition     = this.initialTranslateX;
  }

  // ── Pointer move ─────────────────────────────────────────────────────────────

  public onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    this.debugGesture('pointer_move', { pointerId: event.pointerId, x: event.clientX, y: event.clientY });

    if (this.isEdgeSwipeActive) {
      this.handleEdgeSwipeMove(event);
    } else if (this.isOverlaySwipeActive) {
      this.handleOverlayMove(event);
    } else {
      this.handleMenuDragMove(event);
    }
  }

  private handleOverlayMove(event: PointerEvent): void {
    this.currentX = event.clientX;
    this.currentY = event.clientY;

    const diffX    = this.currentX - this.startX;
    const diffY    = this.currentY - this.startY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    this.pushVelocitySample(event.clientX);

    if (!this.isDragging && !this.isHorizontalGesture) {
      const isHorizontal = this.detectHorizontalGesture(
        absDiffX,
        absDiffY,
        this.getInstantaneousVelocity()
      );

      if (isHorizontal) {
        this.debugGesture('overlay_horizontal_detected', { diffX, diffY });
        this.isHorizontalGesture = true;
        this.isDragging          = true;
        this.config.onToggleHaptic();
      } else if (
        absDiffY > this.verticalLockThreshold &&
        absDiffY > absDiffX * GESTURE_ANGULAR_RATIO
      ) {
        this.debugGesture('overlay_gesture_cancel', { reason: 'vertical_lock', diffX, diffY });
        this.trackMetric('gesture_cancel', { source: 'overlay_lock', reason: 'vertical_lock' });
        return;
      }
    }

    if (this.isDragging && this.isHorizontalGesture) {
      const menuWidth  = this.sessionMenuWidth;
      const isRtl      = this.sessionIsRtl;
      const closedPos  = this.getClosedPosition(menuWidth);
      const openPos    = 0;

      const rawTranslate    = this.initialTranslateX + diffX;
      const targetTranslate = isRtl
        ? Math.min(closedPos, Math.max(openPos, rawTranslate))
        : Math.max(closedPos, Math.min(openPos, rawTranslate));

      const progress        = this.getProgress(targetTranslate, menuWidth);
      this.lastDragPosition = targetTranslate;
      this.config.onUpdateTranslate(targetTranslate, progress, 1, isRtl ? 'right' : 'left');
    }
  }

  private handleMenuDragMove(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    if (!this.config.isOpen() && !this.config.isAnimating()) return;

    this.currentX = event.clientX;
    this.currentY = event.clientY;

    this.pushVelocitySample(event.clientX);

    const diffX    = this.currentX - this.startX;
    const diffY    = this.currentY - this.startY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    if (!this.isDragging && !this.isHorizontalGesture) {
      const isHorizontal = this.detectHorizontalGesture(
        absDiffX,
        absDiffY,
        this.getInstantaneousVelocity()
      );

      if (isHorizontal) {
        this.debugGesture('drawer_horizontal_detected', { diffX, diffY });
        this.isHorizontalGesture = true;
        this.isDragging          = true;
        this.config.onToggleHaptic();
      } else if (
        absDiffY > this.verticalLockThreshold &&
        absDiffY > absDiffX * GESTURE_ANGULAR_RATIO
      ) {
        this.isHorizontalGesture = false;
        this.debugGesture('drawer_gesture_cancel', { reason: 'vertical_lock', diffX, diffY });
        this.trackMetric('gesture_cancel', { source: 'drawer_lock', reason: 'vertical_lock' });
        return;
      } else {
        return;
      }
    }

    if (!this.isHorizontalGesture || !this.isDragging) return;

    const menuWidth      = this.sessionMenuWidth;
    const isRtl          = this.sessionIsRtl;
    const min            = isRtl ? 0 : -menuWidth;
    const max            = isRtl ? menuWidth : 0;

    const targetTranslate = this.initialTranslateX + diffX;
    const transform       = this.getElasticTransform(targetTranslate, min, max, isRtl);

    const isOvershooting = transform.scaleX > 1;
    if (isOvershooting && !this.wasOvershooting) {
      this.config.onToggleHaptic();
    }
    this.wasOvershooting  = isOvershooting;
    this.lastDragPosition = transform.translateX;
    this.config.onUpdateTranslate(
      transform.translateX,
      this.getProgress(transform.translateX, menuWidth),
      transform.scaleX,
      transform.transformOrigin
    );
  }

  // ── Pointer up ───────────────────────────────────────────────────────────────

  public onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    this.debugGesture('pointer_up', { pointerId: event.pointerId, x: event.clientX, y: event.clientY });

    if (this.isEdgeSwipeActive) {
      this.handleEdgeSwipeEnd(event);
    } else if (this.isOverlaySwipeActive) {
      this.handleOverlayEnd(event);
    } else {
      this.handleMenuDragEnd(event);
    }
  }

  private handleOverlayEnd(event: PointerEvent): void {
    const diffX    = event.clientX - this.overlayDownX;
    const diffY    = event.clientY - this.overlayDownY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);
    const duration = performance.now() - this.overlayStartTime;

    const velocity = this.getInstantaneousVelocity();
    const isRtl    = this.sessionIsRtl;

    const isValidDirection = isRtl ? diffX > 0 : diffX < 0;
    const absVelocity      = Math.abs(velocity);
    const isSwipeToClose   =
      this.isDragging &&
      this.isHorizontalGesture &&
      (absVelocity > this.velocityThreshold
        ? (isRtl ? velocity > 0 : velocity < 0)
        : isValidDirection && absDiffX > this.minSwipeDistance);

    this.config.onUpdateTranslate(this.lastDragPosition, null);

    if (isSwipeToClose) {
      this.debugGesture('overlay_gesture_complete', { action: 'close_swipe', velocity, absDiffX, absDiffY, duration });
      this.config.onClose();
      this.startCooldown();
      this.trackMetric('gesture_complete', { action: 'close', source: 'overlay_swipe' });
    } else if (
      !this.isHorizontalGesture &&
      absDiffX < this.tapThreshold &&
      absDiffY < this.tapThreshold &&
      duration < GESTURE_TAP_TIMEOUT_MS
    ) {
      this.debugGesture('overlay_gesture_complete', { action: 'close_tap', velocity, absDiffX, absDiffY, duration });
      this.config.onClose();
      this.startCooldown();
      this.trackMetric('gesture_complete', { action: 'close', source: 'overlay_tap' });
    } else {
      this.debugGesture('overlay_gesture_cancel', {
        reason:  this.isHorizontalGesture ? 'invalid_swipe' : 'failed_tap',
        absDiffX,
        absDiffY,
        duration,
        velocity,
      });
      this.trackMetric('gesture_cancel', {
        source: 'overlay_end',
        reason: this.isHorizontalGesture ? 'invalid_swipe' : 'failed_tap',
        absDiffX,
        absDiffY,
      });
      // Restore state if gesture was cancelled on overlay
      if (this.config.isOpen()) {
        this.config.onOpen();
      } else {
        this.config.onClose();
      }
    }

    this.resetDragState();
    this.isOverlaySwipeActive = false;
  }

  private handleMenuDragEnd(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;

    if (!this.isDragging || !this.isHorizontalGesture) {
      this.debugGesture('drawer_gesture_cancel', { reason: 'not_horizontal_or_not_dragging' });
      const lastPos = this.lastDragPosition;
      const wasOpen = this.config.isOpen();
      this.resetDragState();
      this.config.onUpdateTranslate(lastPos, null);

      // If we interrupted an animation but didn't actually drag, resume the
      // previous state to ensure the transition coordinator completes.
      if (wasOpen) {
        this.config.onOpen();
      } else {
        this.config.onClose();
      }

      this.trackMetric('gesture_cancel', { source: 'drawer' });
      return;
    }

    const diffX     = this.currentX - this.startX;
    const velocity  = this.getInstantaneousVelocity();
    const absVelocity = Math.abs(velocity);
    const menuWidth = this.sessionMenuWidth;
    const progress  = this.getProgress(this.lastDragPosition, menuWidth);
    const isRtl     = this.sessionIsRtl;

    let shouldStayOpen: boolean;

    if (absVelocity > this.velocityThreshold) {
      // Prioritize final flick direction over total displacement.
      // RTL: negative velocity is left (open), positive is right (close).
      // LTR: positive velocity is right (open), negative is left (close).
      shouldStayOpen = isRtl ? velocity < 0 : velocity > 0;
    } else if (progress > this.openThreshold) {
      shouldStayOpen = true;
    } else if (Math.abs(diffX) > this.minSwipeDistance) {
      shouldStayOpen = isRtl ? diffX < 0 : diffX > 0;
    } else {
      shouldStayOpen = progress > 0.5;
    }

    const lastPos = this.lastDragPosition;
    this.resetDragState();
    this.config.onUpdateTranslate(lastPos, null);

    this.debugGesture('drawer_gesture_end_decision', { shouldStayOpen, diffX, velocity, progress });
    if (shouldStayOpen) {
      this.config.onOpen();
      this.startCooldown();
      this.trackMetric('gesture_complete', { action: 'stay_open', source: 'drawer' });
    } else {
      this.config.onClose();
      this.startCooldown();
      this.trackMetric('gesture_complete', { action: 'close', source: 'drawer' });
    }
  }

  // ── Pointer cancel ───────────────────────────────────────────────────────────

  public onPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    this.debugGesture('pointer_cancel', { pointerId: event.pointerId });

    if (this.isEdgeSwipeActive) {
      this.handleEdgeSwipeCancel(event);
    } else if (this.isOverlaySwipeActive) {
      this.resetDragState();
      this.isOverlaySwipeActive = false;
    } else {
      this.handleMenuDragCancel(event);
    }
  }

  private handleMenuDragCancel(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;

    const wasOpen = this.config.isOpen();
    const lastPos = this.lastDragPosition;
    this.resetDragState();
    this.config.onUpdateTranslate(lastPos, null);

    if (wasOpen) {
      this.config.onOpen();
    } else {
      this.config.onClose();
    }
    this.trackMetric('gesture_cancel', { source: 'system_interrupt' });
  }

  // ── Edge swipe ───────────────────────────────────────────────────────────────

  public setEdgeSwipeEnabled(enabled: boolean): void {
    this.isEdgeSwipeEnabled = enabled;
  }

  private handleEdgeSwipeMove(event: PointerEvent): void {
    if (!this.isDragging || this.config.isOpen() || event.pointerId !== this.activePointerId) return;

    this.currentX = event.clientX;
    this.currentY = event.clientY;

    this.pushVelocitySample(event.clientX);

    const diffX    = this.currentX - this.startX;
    const diffY    = this.currentY - this.startY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    if (!this.isHorizontalGesture) {
      const isHorizontal = this.detectHorizontalGesture(
        absDiffX,
        absDiffY,
        this.getInstantaneousVelocity()
      );

      if (isHorizontal) {
        this.debugGesture('edge_horizontal_detected', { diffX, diffY });
        this.isHorizontalGesture = true;
        this.config.onToggleHaptic();
      } else if (
        absDiffY > this.verticalLockThreshold &&
        absDiffY > absDiffX * GESTURE_ANGULAR_RATIO
      ) {
        this.debugGesture('edge_gesture_cancel', { reason: 'vertical_lock', diffX, diffY });
        this.cancelEdgeSwipe('vertical_lock');
        return;
      } else {
        return;
      }
    }

    const isRtl            = this.sessionIsRtl;
    const isValidDirection = isRtl ? diffX < 0 : diffX > 0;
    if (!this.isHorizontalGesture || !isValidDirection) {
      this.debugGesture('edge_move_ignored', {
        reason: !this.isHorizontalGesture ? 'not_horizontal' : 'invalid_direction',
        diffX,
        diffY,
      });
      return;
    }

    const menuWidth      = this.sessionMenuWidth;
    const baseTranslate  = this.initialTranslateX + diffX;
    const min            = isRtl ? 0 : -menuWidth;
    const max            = isRtl ? menuWidth : 0;
    const transform      = this.getElasticTransform(baseTranslate, min, max, isRtl);

    const isOvershooting = transform.scaleX > 1;
    if (isOvershooting && !this.wasOvershooting) {
      this.config.onToggleHaptic();
    }
    this.wasOvershooting  = isOvershooting;
    this.lastDragPosition = transform.translateX;
    this.config.onUpdateTranslate(
      transform.translateX,
      this.getProgress(transform.translateX, menuWidth),
      transform.scaleX,
      transform.transformOrigin
    );
  }

  private handleEdgeSwipeEnd(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;

    if (!this.isDragging || !this.isHorizontalGesture) {
      const menuWidth  = this.sessionMenuWidth;
      const closedPos  = this.sessionIsRtl ? menuWidth : -menuWidth;
      this.resetDragState();
      this.config.onUpdateTranslate(closedPos, null);
      this.trackMetric('gesture_cancel', { source: 'edge' });
      return;
    }

    const diffX     = this.currentX - this.startX;
    const velocity  = this.getInstantaneousVelocity();
    const absVelocity = Math.abs(velocity);
    const menuWidth = this.sessionMenuWidth;
    const progress  = this.getProgress(this.lastDragPosition, menuWidth);

    const isRtl            = this.sessionIsRtl;
    const isValidDirection = isRtl ? diffX < 0 : diffX > 0;

    const shouldOpen =
      (absVelocity > this.velocityThreshold ? (isRtl ? velocity < 0 : velocity > 0) : false) ||
      progress > this.openThreshold ||
      (Math.abs(diffX) > this.minSwipeDistance && isValidDirection);

    const lastPos = this.lastDragPosition;
    this.resetDragState();
    this.config.onUpdateTranslate(lastPos, null);

    this.debugGesture('edge_gesture_end_decision', { shouldOpen, diffX, velocity, progress });
    if (shouldOpen) {
      this.config.onOpen();
      this.startCooldown();
      this.trackMetric('gesture_complete', { action: 'open', source: 'edge' });
    } else {
      this.config.onClose();
      this.startCooldown();
      this.trackMetric('gesture_complete', { action: 'close_abort', source: 'edge' });
    }
  }

  private cancelEdgeSwipe(reason = 'edge_lock'): void {
    const menuWidth = this.sessionMenuWidth;
    const closedPos = this.sessionIsRtl ? menuWidth : -menuWidth;
    this.resetDragState();
    this.config.onUpdateTranslate(closedPos, null);
    this.debugGesture('edge_gesture_cancel', { reason });
    this.trackMetric('gesture_cancel', { source: 'edge_lock', reason });
  }

  private handleEdgeSwipeCancel(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;

    const menuWidth  = this.sessionMenuWidth;
    const closedPos  = this.sessionIsRtl ? menuWidth : -menuWidth;

    // Solo cerrar activamente si el gesto había movido el drawer desde su
    // posición cerrada. Si el pointercancel llega antes de cualquier progreso,
    // closeDrawer() ya verifica el estado y retorna temprano, pero evitamos
    // el dispatch innecesario de cierre.
    const hadProgress = Math.abs(this.lastDragPosition - closedPos) > 0;
    this.resetDragState();
    this.config.onUpdateTranslate(closedPos, null);

    if (hadProgress) {
      this.config.onClose();
    }
    this.debugGesture('edge_gesture_cancel', { reason: 'system_interrupt', hadProgress });
    this.trackMetric('gesture_cancel', { source: 'edge_system_interrupt', hadProgress });
  }

  private resetDragState(): void {
    this.isDragging           = false;
    this.isHorizontalGesture  = false;
    this.isEdgeSwipeActive    = false;
    this.isOverlaySwipeActive = false;
    this.activePointerId      = null;
    this.resetVelocityBuffer();
  }

  // ── Analytics ────────────────────────────────────────────────────────────────

  private trackMetric(metric: string, data: Record<string, unknown>): void {
    if (isDevMode()) {
      this.debugGesture('metric', { metric, ...data });
    }
    this.config.onTrackMetric?.(metric, data);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────

  public destroy(): void {
    if (this.gestureBusUnregister) {
      this.gestureBusUnregister();
      this.gestureBusUnregister = null;
    }
  }
}
