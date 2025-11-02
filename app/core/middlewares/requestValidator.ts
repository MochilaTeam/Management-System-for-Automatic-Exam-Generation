import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { ValidationError } from '../../shared/exceptions/domainErrors';

function validate_request<T extends z.ZodTypeAny>(schema: T) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const input = req.body;
        const result = schema.safeParse(input);

        if (!result.success) {
            return next(
                new ValidationError({
                    message: 'Request validation failed',
                    entity: 'Body',
                    details: result.error.issues.map((i) => ({
                        path: i.path.join('.'),
                        message: i.message,
                    })),
                }),
            );
        }

        req.body = result.data as z.infer<T>;
        next();
    };
}

export { validate_request };
