const SENSITIVE_KEYS = ['password', 'token', 'secret', 'ssn', 'creditCard'];

function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item));
  }

  if (typeof obj === 'object') {
    const safeObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.includes(key)) {
        safeObj[key] = '[REDACTED]';
      } else {
        safeObj[key] = sanitize(value);
      }
    }
    return safeObj;
  }

  return obj;
}

export function excludeSensitiveInfoInData<T extends object>(response: T): T {
  return sanitize(response) as T;
}
