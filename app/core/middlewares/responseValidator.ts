import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';

import { ValidationError } from '../../shared/exceptions/domainErrors';

function validate_response<T>(schema: ObjectSchema<T>) {
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
        const { error, value } = schema.validate(payload, { stripUnknown: false });

        if (error) {
          bypass = true;
          throw new ValidationError({
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

export { validate_response };
