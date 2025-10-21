"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const httpStatusEnum_1 = require("../../shared/enums/httpStatusEnum");
const appError_1 = require("../../shared/exceptions/appError");
const dependencies_1 = require("../dependencies/dependencies");
function errorHandler(err, req, res, _next) {
    const logger = dependencies_1.get_logger();
    if (err instanceof appError_1.AppError) {
        logger.errorLogger.error({
            message: err.message,
            code: err.code,
            statusCode: err.statusCode,
            entity: err.entity,
            stack: err.stack,
            path: req.originalUrl,
            method: req.method,
        });
        return res.status(err.statusCode).json(err.toJSON());
    }
    const payload = {
        message: err instanceof Error ? err.message : 'Internal Server Error',
        code: err instanceof Error ? err.name : 'InternalServerError',
        statusCode: httpStatusEnum_1.HttpStatus.INTERNAL_SERVER_ERROR,
    };
    logger.errorLogger.error({
        ...payload,
        stack: err instanceof Error ? err.stack : undefined,
        path: req.originalUrl,
        method: req.method,
    });
    return res.status(httpStatusEnum_1.HttpStatus.INTERNAL_SERVER_ERROR).json(payload);
}
exports.errorHandler = errorHandler;
