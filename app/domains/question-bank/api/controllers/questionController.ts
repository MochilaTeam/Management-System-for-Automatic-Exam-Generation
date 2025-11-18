import { NextFunction, Response } from 'express';

import {
    makeCreateQuestionCommand,
    makeDeleteQuestionCommand,
    makeGetQuestionByIdQuery,
    makeListQuestionsQuery,
    makeUpdateQuestionCommand,
} from '../../../../core/dependencies/question-bank/questionDependencies';
import { AuthenticatedRequest } from '../../../../shared/types/http/AuthenticatedRequest';
import {
    createQuestionBodySchema,
    listQuestionsQuerySchema,
    questionIdParamsSchema,
    updateQuestionBodySchema,
} from '../../schemas/questionSchema';

export async function listQuestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const dto = listQuestionsQuerySchema.parse(req.query);
        const result = await makeListQuestionsQuery().execute(dto);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getQuestionById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const { questionId } = questionIdParamsSchema.parse(req.params);
        const result = await makeGetQuestionByIdQuery().execute({ questionId });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createQuestion(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const body = createQuestionBodySchema.parse(req.body);
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new Error('AUTH_USER_ID_MISSING');
        }
        const result = await makeCreateQuestionCommand().execute({ body, currentUserId });
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function updateQuestion(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const { questionId } = questionIdParamsSchema.parse(req.params);
        const patch = updateQuestionBodySchema.parse(req.body);
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new Error('AUTH_USER_ID_MISSING');
        }
        const result = await makeUpdateQuestionCommand().execute({
            questionId,
            patch,
            currentUserId,
        });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function deleteQuestion(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const { questionId } = questionIdParamsSchema.parse(req.params);
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new Error('AUTH_USER_ID_MISSING');
        }
        await makeDeleteQuestionCommand().execute({ questionId, currentUserId });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

