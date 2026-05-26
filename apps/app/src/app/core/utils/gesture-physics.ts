/**
 * Gesture Physics Utility
 *
 * Provides shared logic for elastic overscroll and release calculations.
 * Ensures a consistent feel across different components.
 */

export interface ElasticConfig {
  /** The size of the component along the gesture axis (width or height) in pixels */
  referenceSize: number;
  /** Maximum percentage of referenceSize to allow for stretching */
  maxStretchPercent: number;
  /**
   * Resistance factor. Higher values make the stretch feel "stiffer" and require
   * more physical drag distance to reach the visual limit.
   * Default is 1.0.
   */
  resistance?: number;
}

export interface SnapPoint {
  /** The visual offset value for this snap point */
  value: number;
  /** A unique identifier for the snap point */
  id: string;
}

export interface ReleaseConfig {
  /** Current raw position/offset */
  position: number;
  /** Instantaneous velocity (px/ms) */
  velocity: number;
  /** Available snap points */
  snapPoints: SnapPoint[];
  /** Threshold for velocity-based snapping (px/ms) */
  velocityThreshold: number;
  /**
   * Optional threshold for snapping based on displacement from the current closest point.
   */
  snapThreshold?: number;
}

/**
 * Calculates a damped offset for overscroll using an asymptotic curve (tanh).
 * This ensures:
 * 1. 1:1 relationship at the boundary (if resistance is 1).
 * 2. No hard stop (asymptotic to maxStretchPx).
 * 3. Continuous and smooth resistance: as overshoot increases, the incremental stretch decreases.
 */
export function calculateElasticOffset(
  overshoot: number,
  referenceSize: number,
  maxStretchPercent: number,
  resistance: number = 1.0
): number {
  if (overshoot <= 0 || referenceSize <= 0) return 0;

  // L is the limit (maximum possible visual stretch in pixels)
  const L = (referenceSize * maxStretchPercent) / 100;
  if (L <= 0) return 0;

  // f(x) = L * tanh(x / (L * resistance))
  // To make it require a "very long distance", we increase the resistance.
  // This stretches the input domain so it takes more 'x' to reach the same 'tanh' value.
  const r = Math.max(0.1, resistance);
  return L * Math.tanh(overshoot / (L * r));
}

/**
 * Calculates a scale factor that corresponds to a damped overshoot.
 */
export function calculateElasticScale(
  overshoot: number,
  referenceSize: number,
  maxStretchPercent: number,
  resistance: number = 1.0
): number {
  if (referenceSize <= 0) return 1;
  const damped = calculateElasticOffset(overshoot, referenceSize, maxStretchPercent, resistance);
  return 1 + damped / referenceSize;
}

/**
 * Determines the target snap point after a release.
 */
export function calculateReleaseTarget(config: ReleaseConfig): SnapPoint {
  const {
    position,
    velocity,
    snapPoints,
    velocityThreshold,
  } = config;

  if (snapPoints.length === 0) {
    throw new Error('At least one snap point is required');
  }

  if (snapPoints.length === 1) return snapPoints[0];

  const sortedPoints = [...snapPoints].sort((a, b) => a.value - b.value);
  const absVelocity = Math.abs(velocity);

  // High velocity flick
  if (absVelocity > velocityThreshold) {
    if (velocity > 0) {
      // Moving towards higher values
      const nextPoint = sortedPoints.find(p => p.value > position);
      return nextPoint || sortedPoints[sortedPoints.length - 1];
    } else {
      // Moving towards lower values
      const prevPoint = [...sortedPoints].reverse().find(p => p.value < position);
      return prevPoint || sortedPoints[0];
    }
  }

  // Small movement: snap to closest
  return sortedPoints.reduce((prev, curr) => {
    return Math.abs(curr.value - position) < Math.abs(prev.value - position) ? curr : prev;
  });
}
