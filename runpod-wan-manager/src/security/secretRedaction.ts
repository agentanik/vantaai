export class SecretRedaction {
  private static sensitiveKeys = [
    'runpod_api_key',
    'runpodapikey',
    'hf_token',
    'hftoken',
    'manager_api_key',
    'managerapikey',
    'jwt_secret',
    'jwtsecret',
    'r2_secret_access_key',
    'r2secretaccesskey',
    's3_secret_access_key',
    's3secretaccesskey',
    'api_key',
    'apikey',
    'token',
    'secret',
    'password',
    'card'
  ];

  /**
   * Redacts sensitive fields from text logs or JSON objects.
   */
  public static redactString(text: string): string {
    let sanitized = text;
    for (const key of this.sensitiveKeys) {
      // Look for key-value assignments like KEY=value, "key": "value", etc.
      const regex = new RegExp(`(${key}\\s*[=:]\\s*['"]?)([^'"\\s&\\?\\r\\n]+)(['"]?)`, 'gi');
      sanitized = sanitized.replace(regex, '$1[REDACTED]$3');
    }
    return sanitized;
  }

  /**
   * Recursively traverses and redacts an object's keys matching sensitive words.
   */
  public static redactObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactObject(item));
    }

    const copy = { ...obj };
    for (const k of Object.keys(copy)) {
      const lowerKey = k.toLowerCase();
      if (this.sensitiveKeys.some((sKey) => lowerKey.includes(sKey))) {
        copy[k] = '[REDACTED]';
      } else if (typeof copy[k] === 'object') {
        copy[k] = this.redactObject(copy[k]);
      }
    }
    return copy;
  }
}
