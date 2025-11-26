/**
 * Flavor Labels Utility Tests
 */

import { getAttributeLabel, getRangeLabel } from '../../lib/flavorLabels';

describe('flavorLabels', () => {
  describe('getAttributeLabel', () => {
    it('should return correct labels for size attribute', () => {
      expect(getAttributeLabel('size', 1)).toBe('Tiny');
      expect(getAttributeLabel('size', 3)).toBe('Small');
      expect(getAttributeLabel('size', 5)).toBe('Medium');
      expect(getAttributeLabel('size', 7)).toBe('Large');
      expect(getAttributeLabel('size', 10)).toBe('Huge');
    });

    it('should return correct labels for body attribute', () => {
      expect(getAttributeLabel('body', 1)).toBe('Very Thin');
      expect(getAttributeLabel('body', 3)).toBe('Thin');
      expect(getAttributeLabel('body', 5)).toBe('Medium');
      expect(getAttributeLabel('body', 7)).toBe('Fat');
      expect(getAttributeLabel('body', 10)).toBe('Extremely Fat');
    });

    it('should return correct labels for sweetBrininess attribute', () => {
      expect(getAttributeLabel('sweetBrininess', 1)).toBe('Very Sweet');
      expect(getAttributeLabel('sweetBrininess', 3)).toBe('Sweet');
      expect(getAttributeLabel('sweetBrininess', 5)).toBe('Balanced');
      expect(getAttributeLabel('sweetBrininess', 7)).toBe('Briny');
      expect(getAttributeLabel('sweetBrininess', 10)).toBe('Very Salty');
    });

    it('should return correct labels for flavorfulness attribute', () => {
      expect(getAttributeLabel('flavorfulness', 1)).toBe('Very Mild');
      expect(getAttributeLabel('flavorfulness', 3)).toBe('Mild');
      expect(getAttributeLabel('flavorfulness', 5)).toBe('Moderate');
      expect(getAttributeLabel('flavorfulness', 7)).toBe('Bold');
      expect(getAttributeLabel('flavorfulness', 10)).toBe('Extremely Bold');
    });

    it('should return correct labels for creaminess attribute', () => {
      expect(getAttributeLabel('creaminess', 1)).toBe('None');
      expect(getAttributeLabel('creaminess', 3)).toBe('Light');
      expect(getAttributeLabel('creaminess', 5)).toBe('Moderate');
      expect(getAttributeLabel('creaminess', 7)).toBe('Creamy');
      expect(getAttributeLabel('creaminess', 10)).toBe('Very Creamy');
    });

    it('should handle boundary values correctly', () => {
      // Test exact boundary values
      expect(getAttributeLabel('size', 2)).toBe('Tiny');
      expect(getAttributeLabel('size', 4)).toBe('Small');
      expect(getAttributeLabel('size', 6)).toBe('Medium');
      expect(getAttributeLabel('size', 8)).toBe('Large');
    });

    it('should handle edge cases', () => {
      // Values beyond 10 should return the highest label
      expect(getAttributeLabel('size', 11)).toBe('Huge');
      expect(getAttributeLabel('size', 0)).toBe('Tiny');
    });
  });

  describe('getRangeLabel', () => {
    it('should return single label when min and max are in same range', () => {
      expect(getRangeLabel('size', 1, 2)).toBe('Tiny');
      expect(getRangeLabel('size', 3, 4)).toBe('Small');
    });

    it('should return range label when min and max are in different ranges', () => {
      expect(getRangeLabel('size', 1, 5)).toBe('Tiny to Medium');
      expect(getRangeLabel('body', 2, 8)).toBe('Very Thin to Fat');
      expect(getRangeLabel('sweetBrininess', 1, 10)).toBe('Very Sweet to Very Salty');
    });

    it('should handle identical min and max values', () => {
      expect(getRangeLabel('size', 5, 5)).toBe('Medium');
      expect(getRangeLabel('creaminess', 7, 7)).toBe('Creamy');
    });

    it('should work for all attributes', () => {
      expect(getRangeLabel('flavorfulness', 2, 6)).toBe('Very Mild to Moderate');
      expect(getRangeLabel('creaminess', 3, 9)).toBe('Light to Very Creamy');
    });
  });
});
