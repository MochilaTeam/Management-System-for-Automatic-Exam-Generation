import { NextFunction, Response } from 'express';

import { makeRequestExamRegradeCommand } from '../../../../core/dependencies/exam-application/examAssignment';
import { UnauthorizedError } from '../../../../shared/exceptions/domainErrors';
import { AuthenticatedRequest } from '../../../../shared/types/http/AuthenticatedRequest';
import { requestExamRegradeCommandSchema } from '../../schemas/examRegradeSchema';

export async function requestExamRegrade(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedError({ message: 'No se encontró el id del usuario' });
        }

        const payload = requestExamRegradeCommandSchema.parse({
            ...req.body,
            currentUserId,
        });

        const result = await makeRequestExamRegradeCommand().execute(payload);

        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}
