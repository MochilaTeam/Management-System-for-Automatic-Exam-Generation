import { NextFunction, Response } from 'express';

import { makeCreateExamResponseCommand } from '../../../../core/dependencies/exam-application/examResponses';
import { UnauthorizedError } from '../../../../shared/exceptions/domainErrors';
import { AuthenticatedRequest } from '../../../../shared/types/http/AuthenticatedRequest';
import { createExamResponseCommandSchema } from '../../schemas/examResponseSchema';

export async function createExamResponse(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedError({ message: 'No se encontró el id del usuario' });
        }

        const validatedData = createExamResponseCommandSchema.parse(currentUserId, ...req.body);

        const result = await makeCreateExamResponseCommand().execute(validatedData);

        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}
