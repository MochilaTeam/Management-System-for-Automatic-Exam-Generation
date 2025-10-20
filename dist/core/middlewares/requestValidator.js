"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate_request = void 0;
const domainErrors_1 = require("../../shared/exceptions/domainErrors");
function validate_request(schema) {
    return (req, res, next) => {
        const data = req.body;
        if (!data) {
            next();
        }
        const { error } = schema.validate(data);
        if (error) {
            throw new domainErrors_1.ValidationError({
                message: 'Request Validation failed',
                entity: schema.describe().label || schema.describe().type || 'body',
            });
        }
        next();
    };
}
exports.validate_request = validate_request;
