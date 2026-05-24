import { config } from '../lib/config';

const SENSITIVE_KEYS = [
  'authorization',
  'x-manager-api-key',
  'apikey',
  'api_key',
  'token',
  'access_token'
];

function isStringRedactable(str: string): boolean {
  if (typeof str !== 'string') return false;
  if (config.runpodApiKey && config.runpodApiKey.length > 5 && str.includes(config.runpodApiKey)) return true;
  if (config.hfToken && config.hfToken.length > 5 && str.includes(config.hfToken)) return true;
  if (config.managerApiKey && config.managerApiKey.length > 5 && str.includes(config.managerApiKey)) return true;
  if (/mgr_(sec|live|test)_[a-zA-Z0-9_]+/.test(str)) return true;
  if (/bearer\s+[a-zA-Z0-9_\-\.]+/i.test(str)) return true;
  return false;
}

function redactString(str: string): string {
  let sanitized = str;
  sanitized = sanitized.replace(/mgr_(sec|live|test)_[a-zA-Z0-9_]+/g, '[REDACTED]');
  sanitized = sanitized.replace(/bearer\s+[a-zA-Z0-9_\-\.]+/ig, 'Bearer [REDACTED]');
  
  if (config.runpodApiKey && config.runpodApiKey.length > 5) {
    sanitized = sanitized.replace(new RegExp(config.runpodApiKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[REDACTED]');
  }
  if (config.hfToken && config.hfToken.length > 5) {
    sanitized = sanitized.replace(new RegExp(config.hfToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[REDACTED]');
  }
  if (config.managerApiKey && config.managerApiKey.length > 5) {
    sanitized = sanitized.replace(new RegExp(config.managerApiKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[REDACTED]');
  }
  
  return sanitized;
}

export function redactSecrets(input: unknown, seen = new WeakSet()): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input === 'string') return redactString(input);
  if (typeof input !== 'object') return input;

  if (seen.has(input as object)) return '[Circular]';
  seen.add(input as object);

  if (Array.isArray(input)) {
    return input.map(item => redactSecrets(item, seen));
  }

  if (input instanceof Error) {
    const redactedError: any = new Error(redactString(input.message));
    redactedError.name = input.name;
    if (input.stack) redactedError.stack = redactString(input.stack);
    for (const key of Object.getOwnPropertyNames(input)) {
      if (key !== 'message' && key !== 'stack' && key !== 'name') {
        const val = (input as any)[key];
        redactedError[key] = SENSITIVE_KEYS.includes(key.toLowerCase()) ? '[REDACTED]' : redactSecrets(val, seen);
      }
    }
    return redactedError;
  }

  const result: any = {};
  for (const key of Object.keys(input)) {
    const val = (input as Record<string, unknown>)[key];
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redactSecrets(val, seen);
    }
  }
  
  return result;
}
