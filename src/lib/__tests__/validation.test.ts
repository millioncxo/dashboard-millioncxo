import { describe, it, expect } from 'vitest';
import { validateObjectId, validateObjectIds } from '../validation';

describe('validation utilities', () => {
  describe('validateObjectId', () => {
    it('should validate a correct ObjectId', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(validateObjectId(validId)).toBe(true);
    });

    it('should reject an invalid ObjectId', () => {
      const invalidId = 'not-an-object-id';
      expect(validateObjectId(invalidId)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateObjectId('')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validateObjectId(null as any)).toBe(false);
      expect(validateObjectId(undefined as any)).toBe(false);
    });

    it('should reject ObjectId with wrong length', () => {
      expect(validateObjectId('507f1f77bcf86cd79943901')).toBe(false); // Too short
      expect(validateObjectId('507f1f77bcf86cd7994390111')).toBe(false); // Too long
    });
  });

  describe('validateObjectIds', () => {
    it('should validate multiple correct ObjectIds', () => {
      const validIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
      ];
      expect(validateObjectIds(validIds)).toBe(true);
    });

    it('should reject if any ObjectId is invalid', () => {
      const mixedIds = [
        '507f1f77bcf86cd799439011',
        'invalid-id',
        '507f1f77bcf86cd799439013',
      ];
      expect(validateObjectIds(mixedIds)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(validateObjectIds([])).toBe(true);
    });
  });
});

