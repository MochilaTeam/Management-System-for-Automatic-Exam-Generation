import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { BaseErrorResponse } from '../../shared/domain/base_response';
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
        const response = new BaseErrorResponse(
            err.message,
            err.code,
            err.statusCode,
            err.entity,
            err.details,
        );
        return res.status(err.statusCode).json(response);
    }

    if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
            path: issue.path.join('.') || 'root',
            code: issue.code,
            message: issue.message,
        }));

        logger.errorLogger.error({
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            statusCode: HttpStatus.BAD_REQUEST,
            details,
            path: req.originalUrl,
            method: req.method,
        });

        const response = new BaseErrorResponse(
            'Datos inválidos. Revisa los campos requeridos.',
            'VALIDATION_ERROR',
            HttpStatus.BAD_REQUEST,
            'Validation',
            details,
        );
        return res.status(HttpStatus.BAD_REQUEST).json(response);
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

    const response = new BaseErrorResponse(payload.message, payload.code, payload.statusCode);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response);
}
