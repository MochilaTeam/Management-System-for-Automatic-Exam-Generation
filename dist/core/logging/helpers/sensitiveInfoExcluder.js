"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.excludeSensitiveInfoInData = void 0;
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'ssn', 'creditCard'];
function sanitize(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (Array.isArray(obj)) {
        return obj.map((item) => sanitize(item));
    }
    if (typeof obj === 'object') {
        const safeObj = {};
        for (const [key, value] of Object.entries(obj)) {
            if (SENSITIVE_KEYS.includes(key)) {
                safeObj[key] = '[REDACTED]';
            }
            else {
                safeObj[key] = sanitize(value);
            }
        }
        return safeObj;
    }
    return obj;
}
function excludeSensitiveInfoInData(response) {
    return sanitize(response);
}
exports.excludeSensitiveInfoInData = excludeSensitiveInfoInData;
