"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
const httpStatusEnum_1 = require("../enums/httpStatusEnum");
class AppError extends Error {
    constructor({ message, entity = null, code = null, statusCode = httpStatusEnum_1.HttpStatus.INTERNAL_SERVER_ERROR, }) {
        super(message);
        // Fix prototype chain for TS when extending Error
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;
        this.code = code ?? this.name;
        this.statusCode = statusCode ?? httpStatusEnum_1.HttpStatus.INTERNAL_SERVER_ERROR;
        this.entity = entity ?? null;
    }
    toJSON() {
        return {
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            entity: this.entity,
        };
    }
}
exports.AppError = AppError;
