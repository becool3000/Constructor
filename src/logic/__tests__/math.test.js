import { describe, expect, it } from 'vitest';
import { softCap, calculateCharters } from '../math.js';

describe('math helpers', () => {
  it('softCap clamps within range and softens overflow', () => {
    expect(softCap(0.2, 0.5, 1)).toBe(0.5);
    expect(softCap(0.8, 0.5, 1)).toBeCloseTo(0.8, 5);
    expect(softCap(1.4, 0.5, 1)).toBeCloseTo(1.2, 5);
  });

  it('calculates charters based on formula', () => {
    const result = calculateCharters({ cash: 120000, reputation: 150, landmarks: 2 });
    expect(result).toBe(Math.floor(120000 / 50000 + 150 / 200 + 2 * 2));
  });
});
