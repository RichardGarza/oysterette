import { z } from 'zod';
import { createOysterSchema } from '../../src/validators/schemas';

// Test suite for oyster validation (updated: attributes required 1-10)
describe('Oyster Validation Schemas', () => {
  it('should validate createOyster with required name, optional species/origin, and required attributes 1-10', () => {
    const validData = {
      name: 'Test Oyster',
      species: '', // Empty optional
      origin: undefined, // Optional
      standoutNotes: 'Notes',
      size: 5,
      body: 5,
      sweetBrininess: 5,
      flavorfulness: 5,
      creaminess: 5,
    };

    const result = createOysterSchema.safeParse(validData);
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Test Oyster');
    expect(result.data.species).toBe(''); // Empty string stays as empty string
    expect(result.data.origin).toBeUndefined();
    expect(result.data.size).toBe(5); // Required
  });

  it('should allow species/origin as empty strings', () => {
    const dataWithEmpty = {
      name: 'Test',
      species: '',
      origin: '',
      size: 1, // Required min
      body: 1,
      sweetBrininess: 1,
      flavorfulness: 1,
      creaminess: 1,
    };

    const result = createOysterSchema.safeParse(dataWithEmpty);
    expect(result.success).toBe(true);
  });

  it('should reject missing name', () => {
    const invalidData = {
      name: '',
      species: 'Test',
      origin: 'Test',
      size: 5,
      body: 5,
      sweetBrininess: 5,
      flavorfulness: 5,
      creaminess: 5,
    };

    const result = createOysterSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Name is required');
    }
  });

  it('should validate attributes in 1-10 range (required)', () => {
    const validAttrs = {
      name: 'Test',
      size: 1, // Min
      body: 10, // Max
      sweetBrininess: 5,
      flavorfulness: 10,
      creaminess: 1,
    };

    const result = createOysterSchema.safeParse(validAttrs);
    expect(result.success).toBe(true);
  });

  it('should reject missing attribute (e.g., no size)', () => {
    const missingAttr = {
      name: 'Test',
      body: 5,
      sweetBrininess: 5,
      flavorfulness: 5,
      creaminess: 5,
      // No size
    };

    const result = createOysterSchema.safeParse(missingAttr);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.find(e => e.path[0] === 'size')).toBeDefined();
    }
  });

  it('should reject attributes outside 1-10 (e.g., 0 or 11)', () => {
    const invalidAttrs = {
      name: 'Test',
      size: 0, // Below min
      body: 5,
      sweetBrininess: 5,
      flavorfulness: 11, // Above max
      creaminess: 5,
    };

    const result = createOysterSchema.safeParse(invalidAttrs);
    expect(result.success).toBe(false);
    if (!result.success) {
      const sizeError = result.error.issues.find(e => e.path[0] === 'size');
      const flavorError = result.error.issues.find(e => e.path[0] === 'flavorfulness');
      expect(sizeError).toBeDefined();
      expect(flavorError).toBeDefined();
      expect(sizeError?.message).toContain('between 1 and 10');
      expect(flavorError?.message).toContain('between 1 and 10');
    }
  });
});

export default {};
