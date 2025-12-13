import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { get_jwt_config } from '../../../../core/config/jwt';
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
import { getAccessToken } from '../../../../core/middlewares/helpers/getAccessToken';
import { TeacherSubjectLinkRepository } from '../../../../infrastructure/question-bank/repositories/teacherSubjectLinkRepository';
import { Teacher } from '../../../../infrastructure/user/models';
import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { Roles } from '../../../../shared/enums/rolesEnum';
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

const JWT_CONFIG = get_jwt_config();

type MaybeAuthUser = { id: string; roles: Roles[] };

function tryGetAuthenticatedUser(req: Request): MaybeAuthUser | null {
    const token = getAccessToken(req);
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_CONFIG.accessSecret, {
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience,
        }) as jwt.JwtPayload & { roles?: Roles[] };

        if (!decoded?.sub) {
            return null;
        }

        return {
            id: String(decoded.sub),
            roles: Array.isArray(decoded.roles) ? decoded.roles : [],
        };
    } catch {
        return null;
    }
}

export async function listExams(req: Request, res: Response, next: NextFunction) {
    try {
        const dto = listExamsQuerySchema.parse(req.query);
        const payload = { ...dto };
        const authUser = tryGetAuthenticatedUser(req);
        if (authUser && authUser.roles.includes(Roles.TEACHER)) {
            const teacher = await Teacher.findOne({ where: { userId: authUser.id } });
            const limit = payload.limit ?? 20;
            const offset = payload.offset ?? 0;
            if (!teacher) {
                const emptyResult = new PaginatedSchema([], { limit, offset, total: 0 });
                return res.status(200).json(emptyResult);
            }

            const teacherSubjectRepo = new TeacherSubjectLinkRepository();
            const assignments = await teacherSubjectRepo.getAssignments(teacher.id);
            const allowedSubjectIds = Array.from(
                new Set([...assignments.teachingSubjectIds, ...assignments.leadSubjectIds]),
            );
            const requestedSubjectIds =
                payload.subjectId !== undefined
                    ? [payload.subjectId]
                    : payload.subjectIds && payload.subjectIds.length > 0
                      ? payload.subjectIds
                      : null;

            const effectiveSubjectIds =
                requestedSubjectIds?.filter((id) => allowedSubjectIds.includes(id)) ??
                allowedSubjectIds;
            const dedupedSubjectIds = Array.from(new Set(effectiveSubjectIds));

            if (dedupedSubjectIds.length === 0) {
                const emptyResult = new PaginatedSchema([], { limit, offset, total: 0 });
                return res.status(200).json(emptyResult);
            }

            payload.subjectIds = dedupedSubjectIds;
            delete (payload as { subjectId?: string }).subjectId;
        }

        const result = await makeListExamsQuery().execute(payload);
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
