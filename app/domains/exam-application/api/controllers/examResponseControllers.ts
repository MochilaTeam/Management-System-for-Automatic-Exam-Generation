import { NextFunction, Response } from 'express';

import { makeCalculateExamGradeCommand } from '../../../../core/dependencies/exam-application/examAssignment';
import {
    makeCreateExamResponseCommand,
    makeGetExamQuestionDetailQuery,
    makeGetExamResponseByIndexQuery,
    makeUpdateExamResponseCommand,
} from '../../../../core/dependencies/exam-application/examResponses';
import { UnauthorizedError } from '../../../../shared/exceptions/domainErrors';
import { AuthenticatedRequest } from '../../../../shared/types/http/AuthenticatedRequest';
import { calculateExamGradeCommandSchema } from '../../schemas/examAssignmentSchema';
import {
    createExamResponseCommandSchema,
    examResponseByIndexParamsSchema,
    getExamQuestionDetailQuerySchema,
    getExamResponseByIndexQuerySchema,
    responseIdParamsSchema,
    updateExamResponseCommandSchema,
} from '../../schemas/examResponseSchema';

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

        const validatedData = createExamResponseCommandSchema.parse({
            ...req.body,
            user_id: currentUserId,
        });

        const result = await makeCreateExamResponseCommand().execute(validatedData);

        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function updateExamResponse(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedError({ message: 'No se encontró el id del usuario' });
        }

        const { responseId } = responseIdParamsSchema.parse(req.params);
        const validatedData = updateExamResponseCommandSchema.parse({
            ...req.body,
            responseId,
            user_id: currentUserId,
        });

        const result = await makeUpdateExamResponseCommand().execute(validatedData);

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getExamResponseByIndex(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedError({ message: 'No se encontró el id del usuario' });
        }

        const params = examResponseByIndexParamsSchema.parse(req.params);
        const validatedQuery = getExamResponseByIndexQuerySchema.parse({
            ...params,
            user_id: currentUserId,
        });

        const result = await makeGetExamResponseByIndexQuery().execute(validatedQuery);

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getExamQuestionDetail(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedError({ message: 'No se encontró el id del usuario' });
        }

        const params = examResponseByIndexParamsSchema.parse(req.params);
        const validatedQuery = getExamQuestionDetailQuerySchema.parse({
            ...params,
            user_id: currentUserId,
        });

        const result = await makeGetExamQuestionDetailQuery().execute(validatedQuery);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function calculateExamGrade(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedError({ message: 'No se encontró el id del usuario' });
        }

        const { responseId } = responseIdParamsSchema.parse(req.params);
        const payload = calculateExamGradeCommandSchema.parse({
            responseId,
            currentUserId,
        });

        const result = await makeCalculateExamGradeCommand().execute(payload);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}
