import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { ValidationError } from '../../shared/exceptions/domainErrors';

function validate_response<T extends z.ZodTypeAny>(schema: T) {
    return (_req: Request, res: Response, next: NextFunction) => {
        const originalSend = res.send.bind(res);
        let bypass = false;

        res.send = function (body: unknown) {
            if (bypass) {
                return originalSend(body);
            }

            let payload = body;
            if (typeof body == 'string') {
                try {
                    payload = JSON.parse(body);
                } catch {
                    bypass = true;
                    return originalSend(body);
                }
            }

            if (payload && typeof payload === 'object') {
                const result = schema.safeParse(payload);

                if (!result.success) {
                    bypass = true;
                    throw new ValidationError({
                        message: 'Response validation failed',
                        entity: schema.description ?? 'Response',
                    });
                }
                res.type('application/json');
                return originalSend(JSON.stringify(result.data));
            }
            return originalSend(body);
        };

        next();
    };
}

export { validate_response };
