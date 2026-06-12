import { provideZonelessChangeDetection } from '@angular/core';
import {
  calculateElasticOffset,
  calculateElasticScale,
  calculateReleaseTarget,
  SnapPoint,
} from './gesture-physics';

describe('GesturePhysics', () => {
  describe('calculateElasticOffset', () => {
    const referenceSize = 400;
    const maxStretchPercent = 10; // 40px limit

    it('should return 0 when overshoot is 0', () => {
      expect(calculateElasticOffset(0, referenceSize, maxStretchPercent)).toBe(0);
    });

    it('should be close to 1:1 for small overshoots when resistance is 1', () => {
      const smallOvershoot = 1;
      const result = calculateElasticOffset(smallOvershoot, referenceSize, maxStretchPercent, 1);
      // For tanh(x/L) * L, if x is small, result is approx x.
      expect(result).toBeGreaterThan(0.9);
      expect(result).toBeLessThan(1);
    });

    it('should never exceed the limit', () => {
      const largeOvershoot = 1000000;
      const limit = (referenceSize * maxStretchPercent) / 100;
      const result = calculateElasticOffset(largeOvershoot, referenceSize, maxStretchPercent, 1);
      // tanh strictly approaches 1 but floating point might hit it.
      expect(result).toBeLessThanOrEqual(limit);
      expect(result).toBeGreaterThan(limit * 0.99);
    });

    it('should increase resistance as overshoot increases', () => {
      const step1 = calculateElasticOffset(10, referenceSize, maxStretchPercent, 1);
      const step2 = calculateElasticOffset(20, referenceSize, maxStretchPercent, 1);
      const step3 = calculateElasticOffset(30, referenceSize, maxStretchPercent, 1);

      const delta1 = step1 - 0;
      const delta2 = step2 - step1;
      const delta3 = step3 - step2;

      expect(delta2).toBeLessThan(delta1);
      expect(delta3).toBeLessThan(delta2);
    });

    it('should require more distance with higher resistance', () => {
      const overshoot = 100;
      const res1 = calculateElasticOffset(overshoot, referenceSize, maxStretchPercent, 1);
      const res2 = calculateElasticOffset(overshoot, referenceSize, maxStretchPercent, 5);

      expect(res2).toBeLessThan(res1);
    });
  });

  describe('calculateElasticScale', () => {
    const referenceSize = 400;
    const maxStretchPercent = 10;

    it('should return 1 when overshoot is 0', () => {
      expect(calculateElasticScale(0, referenceSize, maxStretchPercent)).toBe(1);
    });

    it('should return a scale greater than 1 for positive overshoot', () => {
      expect(calculateElasticScale(10, referenceSize, maxStretchPercent)).toBeGreaterThan(1);
    });
  });

  describe('calculateReleaseTarget', () => {
    const snapPoints: SnapPoint[] = [
      { id: 'closed', value: -400 },
      { id: 'open', value: 0 },
    ];
    const velocityThreshold = 0.5;

    it('should snap to closest point when velocity is low', () => {
      const config = {
        position: -350,
        velocity: 0.1,
        snapPoints,
        velocityThreshold,
      };
      expect(calculateReleaseTarget(config).id).toBe('closed');

      const config2 = { ...config, position: -50 };
      expect(calculateReleaseTarget(config2).id).toBe('open');
    });

    it('should snap to point in direction of high velocity', () => {
      const config = {
        position: -350,
        velocity: 0.6, // Moving towards 'open' (0)
        snapPoints,
        velocityThreshold,
      };
      expect(calculateReleaseTarget(config).id).toBe('open');

      const config2 = {
        position: -50,
        velocity: -0.6, // Moving towards 'closed' (-400)
        snapPoints,
        velocityThreshold,
      };
      expect(calculateReleaseTarget(config2).id).toBe('closed');
    });

    it('should stay at boundaries even with high velocity', () => {
      const config = {
        position: 10,
        velocity: 1.0,
        snapPoints,
        velocityThreshold,
      };
      expect(calculateReleaseTarget(config).id).toBe('open');

      const config2 = {
        position: -410,
        velocity: -1.0,
        snapPoints,
        velocityThreshold,
      };
      expect(calculateReleaseTarget(config2).id).toBe('closed');
    });
  });
});
