import { NextFunction, Request, Response } from 'express';

import { HttpStatus } from '../../shared/enums/httpStatusEnum';
import { AppError } from '../../shared/exceptions/appError';
import { get_logger } from '../dependencies/dependencies';
import { SystemLogger } from '../logging/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
    const logger: SystemLogger = get_logger();
    if (err instanceof AppError) {
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
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };

    logger.errorLogger.error({
        ...payload,
        stack: err instanceof Error ? err.stack : undefined,
        path: req.originalUrl,
        method: req.method,
    });

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(payload);
}
