import { describe, it, expect, beforeEach } from 'vitest';
import { redactSecrets } from '../src/security/redactSecrets';
import { config } from '../src/lib/config';

describe('redactSecrets Validation Suite', () => {
  beforeEach(() => {
    config.runpodApiKey = 'test_runpod_key_123';
    config.hfToken = 'test_hf_token_456';
    config.managerApiKey = 'mgr_live_test_789';
  });

  it('should redact exact configured tokens from plain strings', () => {
    const input = 'Bearer test_runpod_key_123 with test_hf_token_456';
    const result = redactSecrets(input);
    expect(result).toBe('Bearer [REDACTED] with [REDACTED]');
  });

  it('should completely redact sensitive keys in nested objects regardless of their values', () => {
    const input = {
      status: 'active',
      authorization: 'Bearer something_else',
      'x-manager-api-key': 'mgr_live_test_789',
      metadata: {
        token: 'secret123',
        safeData: 'hello'
      }
    };
    
    const result: any = redactSecrets(input);
    expect(result.authorization).toBe('[REDACTED]');
    expect(result['x-manager-api-key']).toBe('[REDACTED]');
    expect(result.metadata.token).toBe('[REDACTED]');
    expect(result.metadata.safeData).toBe('hello');
  });

  it('should handle circular object references gracefully without infinite loops', () => {
    const obj: any = { id: 1 };
    obj.self = obj;
    
    const result: any = redactSecrets(obj);
    expect(result.self).toBe('[Circular]');
  });

  it('should meticulously redact Error messages and stack traces', () => {
    const err = new Error('HTTP 401: Invalid token test_runpod_key_123 provided');
    (err as any).authorization = 'test_runpod_key_123';
    
    const result: any = redactSecrets(err);
    expect(result.message).toBe('HTTP 401: Invalid token [REDACTED] provided');
    expect(result.stack).toContain('[REDACTED]');
    expect(result.authorization).toBe('[REDACTED]');
  });
});
