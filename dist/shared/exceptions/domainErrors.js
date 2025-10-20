"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationError = exports.ForbiddenError = exports.UnauthorizedError = exports.BaseDatabaseError = exports.BusinessRuleError = exports.ConflictError = exports.MultipleResultsFoundError = exports.NotFoundError = exports.ValidationError = void 0;
const appError_1 = require("./appError");
const httpStatusEnum_1 = require("../enums/httpStatusEnum");
class ValidationError extends appError_1.AppError {
    constructor(opts) {
        super({ statusCode: httpStatusEnum_1.HttpStatus.BAD_REQUEST, ...opts });
    }
}
exports.ValidationError = ValidationError;
//When client asks for something that not exists
//ex: Tries to get a question with an id that not appears in the Database
class NotFoundError extends appError_1.AppError {
    constructor(opts) {
        super({ statusCode: httpStatusEnum_1.HttpStatus.NOT_FOUND, ...opts });
    }
}
exports.NotFoundError = NotFoundError;
//When client expected a unique result but receive many
class MultipleResultsFoundError extends appError_1.AppError {
    constructor(opts) {
        super({ statusCode: httpStatusEnum_1.HttpStatus.CONFLICT, ...opts });
    }
}
exports.MultipleResultsFoundError = MultipleResultsFoundError;
//When actual state of the database conflicts with the operation
//Tipical use: Email already in use, User name already in use
class ConflictError extends appError_1.AppError {
    constructor(opts) {
        super({ statusCode: httpStatusEnum_1.HttpStatus.CONFLICT, ...opts });
    }
}
exports.ConflictError = ConflictError;
class BusinessRuleError extends appError_1.AppError {
    constructor(opts) {
        super({ statusCode: httpStatusEnum_1.HttpStatus.BAD_REQUEST, ...opts });
    }
}
exports.BusinessRuleError = BusinessRuleError;
class BaseDatabaseError extends appError_1.AppError {
    constructor(opts) {
        super({ statusCode: httpStatusEnum_1.HttpStatus.INTERNAL_SERVER_ERROR, ...opts });
    }
}
exports.BaseDatabaseError = BaseDatabaseError;
//When client dont have valid authentication (problem with token)
class UnauthorizedError extends appError_1.AppError {
    constructor(opts) {
        super({ statusCode: httpStatusEnum_1.HttpStatus.UNAUTHORIZED, ...opts });
    }
}
exports.UnauthorizedError = UnauthorizedError;
//When client doesn't have permission for that operation
class ForbiddenError extends appError_1.AppError {
    constructor(opts) {
        super({ statusCode: httpStatusEnum_1.HttpStatus.FORBIDDEN, ...opts });
    }
}
exports.ForbiddenError = ForbiddenError;
//Failed communication with external services, not database
class CommunicationError extends appError_1.AppError {
    constructor(opts) {
        super({ statusCode: httpStatusEnum_1.HttpStatus.INTERNAL_SERVER_ERROR, ...opts });
    }
}
exports.CommunicationError = CommunicationError;
