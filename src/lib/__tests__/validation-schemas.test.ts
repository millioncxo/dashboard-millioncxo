import { describe, it, expect } from 'vitest';
import { 
  loginSchema, 
  createClientSchema, 
  paginationSchema,
  validateRequest 
} from '../validation-schemas';

describe('validation schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = validateRequest(loginSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };
      const result = validateRequest(loginSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };
      const result = validateRequest(loginSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('paginationSchema', () => {
    it('should validate correct pagination data', () => {
      const validData = {
        page: 1,
        limit: 10,
      };
      const result = validateRequest(paginationSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string numbers to integers', () => {
      const validData = {
        page: '1',
        limit: '10',
      };
      const result = validateRequest(paginationSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
      }
    });

    it('should enforce minimum page of 1', () => {
      const invalidData = {
        page: 0,
        limit: 10,
      };
      const result = validateRequest(paginationSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it('should enforce maximum limit of 100', () => {
      const invalidData = {
        page: 1,
        limit: 200,
      };
      const result = validateRequest(paginationSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it('should use default values', () => {
      const data = {};
      const result = validateRequest(paginationSchema, data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });
  });

  describe('createClientSchema', () => {
    it('should validate correct client data', () => {
      const validData = {
        businessName: 'Test Business',
        pointOfContactName: 'John Doe',
        pointOfContactEmail: 'john@example.com',
        fullRegisteredAddress: '123 Main St, City, Country',
      };
      const result = validateRequest(createClientSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        businessName: 'Test Business',
        // Missing required fields
      };
      const result = validateRequest(createClientSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate email format', () => {
      const invalidData = {
        businessName: 'Test Business',
        pointOfContactName: 'John Doe',
        pointOfContactEmail: 'invalid-email',
        fullRegisteredAddress: '123 Main St, City, Country',
      };
      const result = validateRequest(createClientSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });
});

