import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';

import { ValidationError } from '../../shared/exceptions/domainErrors';

function validate_request<T>(schema: ObjectSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
        const data = req.body;

        if (!data) {
            next();
        }

        const { error } = schema.validate(data);

        if (error) {
            throw new ValidationError({
                message: 'Request Validation failed',
                entity: schema.describe().label || schema.describe().type || 'body',
            });
        }

        next();
    };
}

export { validate_request };
