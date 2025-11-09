/**
 * XP Service Unit Tests
 */

import { getXPForLevel, getLevelFromXP } from '../../services/xpService';

describe('XP Service', () => {
  describe('Level Progression', () => {
    it('should calculate correct XP for each level', () => {
      expect(getXPForLevel(1)).toBe(0);
      expect(getXPForLevel(2)).toBe(100);
      expect(getXPForLevel(3)).toBe(282);
      expect(getXPForLevel(10)).toBe(2700);
    });

    it('should calculate correct level from XP', () => {
      expect(getLevelFromXP(0)).toBe(1);
      expect(getLevelFromXP(100)).toBe(2);
      expect(getLevelFromXP(282)).toBe(3);
      expect(getLevelFromXP(2700)).toBe(10);
    });

    it('should cap at level 100', () => {
      expect(getLevelFromXP(999999)).toBe(100);
    });

    it('should handle partial XP progress', () => {
      expect(getLevelFromXP(150)).toBe(2);
      expect(getLevelFromXP(249)).toBe(2);
    });
  });
});
