/**
 * Utility for triggering haptic feedback on mobile devices.
 * @param duration Optional duration in milliseconds (default: 20)
 */
export function triggerTick(duration: number = 20): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    // A single 20ms vibration is a clear "tick" for mobile devices.
    // Use it for slide changes or scroll milestones.
    navigator.vibrate(duration);
  }
}
