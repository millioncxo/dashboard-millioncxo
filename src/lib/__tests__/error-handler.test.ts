import { describe, it, expect } from 'vitest';
import { createErrorResponse, handleApiError, generateRequestId } from '../error-handler';

describe('error-handler utilities', () => {
  describe('createErrorResponse', () => {
    it('should create error response from string', () => {
      const response = createErrorResponse('Test error');
      expect(response.status).toBe(500);
      const json = response.json() as any;
      expect(json.error).toBe('Test error');
    });

    it('should create error response from Error object', () => {
      const error = new Error('Test error message');
      const response = createErrorResponse(error);
      expect(response.status).toBe(500);
      const json = response.json() as any;
      expect(json.error).toBe('Test error message');
    });

    it('should include requestId when provided', () => {
      const requestId = 'test-request-id';
      const response = createErrorResponse('Test error', requestId);
      const json = response.json() as any;
      expect(json.requestId).toBe(requestId);
    });

    it('should include details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      const response = createErrorResponse(error);
      const json = response.json() as any;
      expect(json.details).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Test error');
      const response = createErrorResponse(error);
      const json = response.json() as any;
      expect(json.details).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('handleApiError', () => {
    it('should handle Unauthorized errors', () => {
      const error = new Error('Unauthorized');
      const response = handleApiError(error);
      expect(response.status).toBe(401);
      const json = response.json() as any;
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('should handle Forbidden errors', () => {
      const error = new Error('Forbidden');
      const response = handleApiError(error);
      expect(response.status).toBe(403);
      const json = response.json() as any;
      expect(json.code).toBe('FORBIDDEN');
    });

    it('should handle validation errors', () => {
      const error = new Error('Invalid input');
      const response = handleApiError(error);
      expect(response.status).toBe(400);
      const json = response.json() as any;
      expect(json.code).toBe('VALIDATION_ERROR');
    });

    it('should handle not found errors', () => {
      const error = new Error('Client not found');
      const response = handleApiError(error);
      expect(response.status).toBe(404);
      const json = response.json() as any;
      expect(json.code).toBe('NOT_FOUND');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const response = handleApiError(error);
      expect(response.status).toBe(500);
    });
  });

  describe('generateRequestId', () => {
    it('should generate a unique request ID', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
    });

    it('should generate a string', () => {
      const id = generateRequestId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });
});

