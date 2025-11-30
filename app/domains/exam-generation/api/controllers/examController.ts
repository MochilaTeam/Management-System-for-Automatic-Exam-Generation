import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import {
    makeAcceptExamCommand,
    makeCreateAutomaticExamCommand,
    makeCreateManualExamCommand,
    makeDeleteExamCommand,
    makeGetExamByIdQuery,
    makeListExamsQuery,
    makeRejectExamCommand,
    makeRequestExamReviewCommand,
    makeUpdateExamCommand,
} from '../../../../core/dependencies/exam-application/examDependencies';
import { AuthenticatedRequest } from '../../../../shared/types/http/AuthenticatedRequest';
import { DifficultyLevelEnum } from '../../../question-bank/entities/enums/DifficultyLevels';
import {
    acceptExamCommandSchema,
    createAutomaticExamCommandSchema,
    createAutomaticExamSchema,
    createManualExamCommandSchema,
    createManualExamSchema,
    examIdParamsSchema,
    listExamsQuerySchema,
    rejectExamCommandSchema,
    requestExamReviewCommandSchema,
    updateExamCommandSchema,
} from '../../schemas/examSchema';

function ensureCurrentUserId(req: AuthenticatedRequest): string {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
        throw new Error('AUTH_USER_ID_MISSING');
    }
    return currentUserId;
}

type ManualExamRequest = z.infer<typeof createManualExamSchema>;
type AutomaticExamRequest = z.infer<typeof createAutomaticExamSchema>;

function normalizeQuestionTypeCounts(payload: AutomaticExamRequest) {
    return payload.questionTypeDistribution.map((entry) => ({
        questionTypeId: entry.type,
        count: entry.count,
    }));
}

function normalizeDifficultyCounts(
    payload: AutomaticExamRequest,
): Record<DifficultyLevelEnum, number> {
    const base: Record<DifficultyLevelEnum, number> = {
        [DifficultyLevelEnum.EASY]: 0,
        [DifficultyLevelEnum.MEDIUM]: 0,
        [DifficultyLevelEnum.HARD]: 0,
    };
    payload.difficultyDistribution.forEach((entry) => {
        base[entry.difficulty] = entry.count;
    });
    return base;
}

function normalizeSubtopicDistribution(payload: AutomaticExamRequest) {
    if (!payload.subtopicDistribution) return undefined;
    return payload.subtopicDistribution.map((entry) => ({
        subtopicId: entry.subtopic,
        count: entry.count,
    }));
}

export async function listExams(req: Request, res: Response, next: NextFunction) {
    try {
        const dto = listExamsQuerySchema.parse(req.query);
        const result = await makeListExamsQuery().execute(dto);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getExamById(req: Request, res: Response, next: NextFunction) {
    try {
        const { examId } = examIdParamsSchema.parse(req.params);
        const result = await makeGetExamByIdQuery().execute({ examId });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createManualExam(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const body: ManualExamRequest = createManualExamSchema.parse(req.body);
        const currentUserId = ensureCurrentUserId(req);
        const command = createManualExamCommandSchema.parse({
            ...body,
            authorId: currentUserId,
        });
        const result = await makeCreateManualExamCommand().execute(command);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createAutomaticExam(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const body: AutomaticExamRequest = createAutomaticExamSchema.parse(req.body);
        const currentUserId = ensureCurrentUserId(req);
        const command = createAutomaticExamCommandSchema.parse({
            title: body.title,
            subjectId: body.subjectId,
            questionCount: body.questionCount,
            authorId: currentUserId,
            questionTypeCounts: normalizeQuestionTypeCounts(body),
            difficultyCounts: normalizeDifficultyCounts(body),
            topicIds: body.topicCoverage,
            subtopicDistribution: normalizeSubtopicDistribution(body),
        });
        const result = await makeCreateAutomaticExamCommand().execute(command);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function updateExam(req: Request, res: Response, next: NextFunction) {
    try {
        const { examId } = examIdParamsSchema.parse(req.params);
        const patch = updateExamCommandSchema.parse(req.body);
        const result = await makeUpdateExamCommand().execute({ examId, patch });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function requestExamReview(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const { examId } = examIdParamsSchema.parse(req.params);
        const currentUserId = ensureCurrentUserId(req);
        const payload = requestExamReviewCommandSchema.parse({
            examId,
            currentUserId,
        });
        const result = await makeRequestExamReviewCommand().execute(payload);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function acceptExam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { examId } = examIdParamsSchema.parse(req.params);
        const currentUserId = ensureCurrentUserId(req);
        const payload = acceptExamCommandSchema.parse({
            examId,
            currentUserId,
            comment: req.body?.comment,
        });
        const result = await makeAcceptExamCommand().execute(payload);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function rejectExam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { examId } = examIdParamsSchema.parse(req.params);
        const currentUserId = ensureCurrentUserId(req);
        const payload = rejectExamCommandSchema.parse({
            examId,
            currentUserId,
            comment: req.body?.comment,
        });
        const result = await makeRejectExamCommand().execute(payload);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function deleteExam(req: Request, res: Response, next: NextFunction) {
    try {
        const { examId } = examIdParamsSchema.parse(req.params);
        await makeDeleteExamCommand().execute({ examId });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
