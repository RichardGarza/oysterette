/**
 * Seed Data Integrity Tests
 *
 * Ensures oyster seed data maintains consistency and quality:
 * - No duplicate oyster names
 * - No duplicate name+origin combinations
 * - All required fields present
 * - Valid attribute ranges (1-10)
 */

import * as fs from 'fs';
import * as path from 'path';

interface OysterDataJSON {
  name: string;
  species: string;
  origin: string;
  standout_note?: string;
  size: number;
  body: number;
  sweet_brininess: number;
  flavorfulness: number;
  creaminess: number;
}

describe('Oyster Seed Data Integrity', () => {
  let seedData: OysterDataJSON[];

  beforeAll(() => {
    const dataPath = path.join(__dirname, '../../../data/oyster-list-for-seeding.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    seedData = JSON.parse(rawData);
  });

  describe('Duplicate Detection', () => {
    it('should have no duplicate oyster names', () => {
      const names = seedData.map(o => o.name);
      const uniqueNames = new Set(names);

      const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

      expect(duplicates).toEqual([]);
      expect(uniqueNames.size).toBe(seedData.length);
    });

    it('should have no duplicate name+origin combinations', () => {
      const combinations = seedData.map(o => `${o.name}|${o.origin}`);
      const uniqueCombinations = new Set(combinations);

      const duplicates = combinations.filter((combo, index) => combinations.indexOf(combo) !== index);

      expect(duplicates).toEqual([]);
      expect(uniqueCombinations.size).toBe(seedData.length);
    });

    it('should have no duplicate name+species combinations', () => {
      const combinations = seedData.map(o => `${o.name}|${o.species}`);
      const uniqueCombinations = new Set(combinations);

      const duplicates = combinations.filter((combo, index) => combinations.indexOf(combo) !== index);

      expect(duplicates).toEqual([]);
      expect(uniqueCombinations.size).toBe(seedData.length);
    });
  });

  describe('Required Fields', () => {
    it('should have all required fields present', () => {
      seedData.forEach((oyster, index) => {
        expect(oyster.name).toBeDefined();
        expect(oyster.name).not.toBe('');
        expect(oyster.species).toBeDefined();
        expect(oyster.species).not.toBe('');
        expect(oyster.origin).toBeDefined();
        expect(oyster.origin).not.toBe('');

        // Attributes should be numbers
        expect(typeof oyster.size).toBe('number');
        expect(typeof oyster.body).toBe('number');
        expect(typeof oyster.sweet_brininess).toBe('number');
        expect(typeof oyster.flavorfulness).toBe('number');
        expect(typeof oyster.creaminess).toBe('number');
      });
    });
  });

  describe('Attribute Validation', () => {
    it('should have all attributes in valid range (1-10)', () => {
      seedData.forEach((oyster) => {
        expect(oyster.size).toBeGreaterThanOrEqual(1);
        expect(oyster.size).toBeLessThanOrEqual(10);

        expect(oyster.body).toBeGreaterThanOrEqual(1);
        expect(oyster.body).toBeLessThanOrEqual(10);

        expect(oyster.sweet_brininess).toBeGreaterThanOrEqual(1);
        expect(oyster.sweet_brininess).toBeLessThanOrEqual(10);

        expect(oyster.flavorfulness).toBeGreaterThanOrEqual(1);
        expect(oyster.flavorfulness).toBeLessThanOrEqual(10);

        expect(oyster.creaminess).toBeGreaterThanOrEqual(1);
        expect(oyster.creaminess).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Data Quality', () => {
    it('should have a reasonable number of oysters', () => {
      // At least 50 oysters, but not an unreasonable amount like 800+ duplicates
      expect(seedData.length).toBeGreaterThanOrEqual(50);
      expect(seedData.length).toBeLessThanOrEqual(500);
    });

    it('should have unique species values', () => {
      const species = seedData.map(o => o.species);
      const uniqueSpecies = new Set(species);

      // Should have at least 3 different species
      expect(uniqueSpecies.size).toBeGreaterThanOrEqual(3);
    });

    it('should have unique origin values', () => {
      const origins = seedData.map(o => o.origin);
      const uniqueOrigins = new Set(origins);

      // Should have at least 10 different origins
      expect(uniqueOrigins.size).toBeGreaterThanOrEqual(10);
    });
  });
});
