import { NextFunction, Response } from 'express';

import {
    makeCreateExamResponseCommand,
    makeGetExamQuestionDetailQuery,
    makeGetExamResponseByIndexQuery,
    makeUpdateExamResponseCommand,
    makeUpdateManualPointsCommand,
} from '../../../../core/dependencies/exam-application/examResponses';
import { UnauthorizedError } from '../../../../shared/exceptions/domainErrors';
import { AuthenticatedRequest } from '../../../../shared/types/http/AuthenticatedRequest';
import {
    createExamResponseCommandSchema,
    examResponseByIndexParamsSchema,
    getExamQuestionDetailQuerySchema,
    getExamResponseByIndexQuerySchema,
    responseIdParamsSchema,
    studentContextQuerySchema,
    updateExamResponseCommandSchema,
    updateManualPointsCommandSchema,
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
        const { studentId } = studentContextQuerySchema.parse(req.query);
        const validatedQuery = getExamResponseByIndexQuerySchema.parse({
            ...params,
            user_id: currentUserId,
            studentId,
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
        const { studentId } = studentContextQuerySchema.parse(req.query);
        const validatedQuery = getExamQuestionDetailQuerySchema.parse({
            ...params,
            user_id: currentUserId,
            studentId,
        });

        const result = await makeGetExamQuestionDetailQuery().execute(validatedQuery);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function updateManualPoints(
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
        const validatedData = updateManualPointsCommandSchema.parse({
            manualPoints: req.body.manualPoints,
            responseId,
            currentUserId,
        });

        const result = await makeUpdateManualPointsCommand().execute(validatedData);

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

