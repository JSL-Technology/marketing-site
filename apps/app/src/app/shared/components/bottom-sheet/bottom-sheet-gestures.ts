import { NgZone } from '@angular/core';
import { GestureBusService, GestureHandler } from '@core/services/gesture-bus.service';

export interface BottomSheetGestureConfig {
  /**
   * Threshold in pixels to trigger a close when dragging down.
   */
  closeThreshold?: number;

  /**
   * Velocity threshold in px/ms to trigger a close on flick.
   */
  velocityThreshold?: number;

  /**
   * Elastic resistance for upward dragging (0 to 1).
   */
  elasticResistance?: number;

  /**
   * Current open state.
   */
  isOpen: () => boolean;

  /**
   * Whether the internal content is at its top scroll position.
   */
  isAtTop: () => boolean;

  /**
   * Callback to update the visual translation.
   * @param translateY The current Y translation in pixels.
   * @param progress A normalized value (1 = open, 0 = closed) for overlay opacity.
   * @param scaleY Optional vertical scale for elastic effects.
   * @param transformOrigin Optional transform origin for scaling.
   */
  onUpdateTranslate: (
    translateY: number,
    progress: number | null,
    scaleY?: number,
    transformOrigin?: string
  ) => void;

  /**
   * Trigger the close action.
   */
  onClose: () => void;

  /**
   * Trigger a throttled haptic feedback.
   */
  onToggleHaptic?: () => void;

  /**
   * Trigger the open action (restore to open state).
   */
  onOpen: () => void;

  /**
   * Stop any active transitions.
   */
  onStopTransition: () => void;

  /**
   * Maximum vertical stretch allowed (in percent).
   */
  maxStretchPercent?: number;

  /**
   * Maximum positive translateY (in px) allowed while dragging.
   * Represents the closed boundary where the sheet's bottom edge aligns with the viewport bottom edge.
   */
  getMaxTranslateY: () => number;
}

export class BottomSheetGestures implements GestureHandler {
  public name = 'BottomSheet';
  public priority = 110;

  private isDragging = false;
  private activePointerId: number | null = null;
  private startY = 0;
  private currentY = 0;
  private initialTranslateY = 0;
  private lastDragPosition = 0;

  private velocityBuffer: Array<{ y: number; t: number }> = [];

  private readonly VELOCITY_WINDOW_MS = 100;
  private readonly DEFAULT_VELOCITY_THRESHOLD = 0.25;
  private readonly DEFAULT_CLOSE_THRESHOLD = 150;
  private readonly DEFAULT_ELASTIC_RESISTANCE = 25; // 0-100 scale to match MobileMenuGestures
  private readonly DEFAULT_MAX_STRETCH_PERCENT = 4;

  private readonly ELASTIC_OVERSHOOT_REFERENCE_RATIO = 0.25;
  private readonly MIN_ELASTIC_EXPONENT = 1;
  private readonly MAX_ELASTIC_EXPONENT = 5;

  private wasOvershooting = false;
  private gestureBusUnregister: (() => void) | null = null;

  constructor(
    private config: BottomSheetGestureConfig,
    private ngZone: NgZone,
    private gestureBus: GestureBusService
  ) {
    this.gestureBusUnregister = this.gestureBus.registerHandler(this);
  }

  public onPointerDown(event: PointerEvent): boolean {
    if (this.activePointerId !== null || !this.config.isOpen()) return false;

    // Check if the target is interactive content that should handle its own pointers
    const target = event.target as HTMLElement;
    if (this.isInteractiveElement(target)) return false;

    // We only start dragging if at top or if dragging the handle
    const isHandle = !!target.closest('.bottom-sheet-handle-wrapper');
    if (!isHandle && !this.config.isAtTop()) return false;

    this.activePointerId = event.pointerId;
    this.startY = event.clientY;
    this.currentY = this.startY;
    this.initialTranslateY = 0;
    this.isDragging = false;
    this.resetVelocityBuffer();
    this.config.onStopTransition();

    return true;
  }

  public onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;

    this.currentY = event.clientY;
    const diffY = this.currentY - this.startY;
    this.pushVelocitySample(this.currentY);

    if (!this.isDragging) {
      if (Math.abs(diffY) > 5) {
        this.isDragging = true;
      } else {
        return;
      }
    }

    const maxTranslate = Math.max(0, this.config.getMaxTranslateY());
    const targetTranslate = this.initialTranslateY + diffY;

    // Bottom boundary is maxTranslate (closed), Top boundary is 0 (open)
    const transform = this.getElasticTransform(targetTranslate, 0, maxTranslate);

    const isOvershooting = transform.scaleY > 1;
    if (isOvershooting && !this.wasOvershooting) {
      this.config.onToggleHaptic?.();
    }
    this.wasOvershooting = isOvershooting;
    this.lastDragPosition = transform.translateY;

    // Progress calculation for overlay
    // 0 is open, maxTranslate is closed
    const progress = transform.translateY > 0
      ? Math.max(0, 1 - (transform.translateY / (maxTranslate || 1)))
      : 1;

    this.config.onUpdateTranslate(
      transform.translateY,
      progress,
      transform.scaleY,
      transform.transformOrigin
    );
  }

  public onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;

    if (!this.isDragging) {
      this.resetDragState();
      return;
    }

    const velocity = this.getInstantaneousVelocity();
    const diffY = this.currentY - this.startY;
    const closeThreshold = this.config.closeThreshold ?? this.DEFAULT_CLOSE_THRESHOLD;
    const velocityThreshold = this.config.velocityThreshold ?? this.DEFAULT_VELOCITY_THRESHOLD;

    const shouldClose = diffY > closeThreshold || (velocity > velocityThreshold && diffY > 20);

    if (shouldClose) {
      this.config.onClose();
    } else {
      this.config.onOpen();
    }

    this.config.onUpdateTranslate(this.lastDragPosition, null);
    this.resetDragState();
  }

  public onPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    this.config.onOpen();
    this.config.onUpdateTranslate(this.lastDragPosition, null);
    this.resetDragState();
  }

  private isInteractiveElement(target: HTMLElement): boolean {
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    if (interactiveTags.includes(target.tagName)) return true;
    if (target.closest('button, a, input, select, textarea')) return true;
    return false;
  }

  private resetDragState(): void {
    this.isDragging = false;
    this.wasOvershooting = false;
    this.activePointerId = null;
    this.resetVelocityBuffer();
  }

  private calculateElasticScale(overshoot: number): number {
    const safeOvershoot = Math.max(0, overshoot);
    if (safeOvershoot === 0) return 1;

    const maxStretchPercent = Math.max(0, this.config.maxStretchPercent ?? this.DEFAULT_MAX_STRETCH_PERCENT);
    const maxScale = 1 + maxStretchPercent / 100;

    const sheetHeight = this.config.getMaxTranslateY();
    const referenceOvershootPx = Math.max(1, sheetHeight * this.ELASTIC_OVERSHOOT_REFERENCE_RATIO);
    const normalizedOvershoot = Math.min(safeOvershoot / referenceOvershootPx, 1);

    const rawResistance = this.config.elasticResistance ?? this.DEFAULT_ELASTIC_RESISTANCE;
    const normalizedResistance = Math.min(100, Math.max(0, rawResistance)) / 100;
    const exponent =
      this.MIN_ELASTIC_EXPONENT +
      normalizedResistance * (this.MAX_ELASTIC_EXPONENT - this.MIN_ELASTIC_EXPONENT);

    const damped = 1 - Math.pow(1 - normalizedOvershoot, exponent);
    return 1 + damped * (maxScale - 1);
  }

  private getElasticTransform(
    translateY: number,
    min: number,
    max: number
  ): { translateY: number; scaleY: number; transformOrigin: string } {
    let finalTranslateY = translateY;
    let scaleY = 1;
    let transformOrigin = 'bottom';

    if (translateY < min) {
      // Overshooting UP (beyond open)
      finalTranslateY = min;
      scaleY = this.calculateElasticScale(min - translateY);
      transformOrigin = 'bottom';
    } else if (translateY > max) {
      // Overshooting DOWN (beyond closed) - We align this with mobile menu behavior
      // where it doesn't really overshoot but resists, but here the requirement
      // is specifically that it shouldn't be draggable past its limit (the bottom edge).
      // So we apply the resistance/elastic scale but keep the bottom edge aligned.
      finalTranslateY = max;
      scaleY = this.calculateElasticScale(translateY - max);
      transformOrigin = 'top';
    }

    return { translateY: finalTranslateY, scaleY, transformOrigin };
  }

  private pushVelocitySample(y: number): void {
    const now = performance.now();
    const cutoff = now - this.VELOCITY_WINDOW_MS;
    this.velocityBuffer.push({ y, t: now });
    while (this.velocityBuffer.length > 0 && this.velocityBuffer[0].t < cutoff) {
      this.velocityBuffer.shift();
    }
  }

  private getInstantaneousVelocity(): number {
    if (this.velocityBuffer.length < 2) return 0;
    const first = this.velocityBuffer[0];
    const last = this.velocityBuffer[this.velocityBuffer.length - 1];
    const dt = last.t - first.t;
    return dt > 0 ? (last.y - first.y) / dt : 0;
  }

  private resetVelocityBuffer(): void {
    this.velocityBuffer = [];
  }

  public destroy(): void {
    if (this.gestureBusUnregister) {
      this.gestureBusUnregister();
      this.gestureBusUnregister = null;
    }
  }
}
