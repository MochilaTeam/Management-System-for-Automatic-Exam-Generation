"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate_response = void 0;
const domainErrors_1 = require("../../shared/exceptions/domainErrors");
function validate_response(schema) {
    return (_req, res, next) => {
        const originalSend = res.send.bind(res);
        let bypass = false;
        res.send = function (body) {
            if (bypass) {
                return originalSend(body);
            }
            let payload = body;
            if (typeof body == 'string') {
                try {
                    payload = JSON.parse(body);
                }
                catch {
                    bypass = true;
                    return originalSend(body);
                }
            }
            if (payload && typeof payload === 'object') {
                const { error, value } = schema.validate(payload, { stripUnknown: false });
                if (error) {
                    bypass = true;
                    throw new domainErrors_1.ValidationError({
                        message: 'Response validation failed',
                        entity: schema.describe().label || schema.describe().type || 'Response',
                    });
                }
                res.type('application/json');
                return originalSend(JSON.stringify(value));
            }
            return originalSend(body);
        };
        next();
    };
}
exports.validate_response = validate_response;
