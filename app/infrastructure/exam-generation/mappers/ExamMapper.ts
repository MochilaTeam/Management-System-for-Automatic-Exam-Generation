import { Attributes, Op, OrderItem, WhereOptions } from 'sequelize';

import {
    ExamFilters,
    ListExamsCriteria,
} from '../../../domains/exam-generation/domain/ports/IExamRepository';
import {
    ExamCreate,
    examCreateSchema,
    ExamRead,
    examReadSchema,
    ExamUpdate,
    examUpdateSchema,
} from '../../../domains/exam-generation/schemas/examSchema';
import type Exam from '../models/Exam';

export const ExamMapper = {
    toRead(row: Exam): ExamRead {
        const plain = row.get({ plain: true }) as {
            id: string;
            title: string;
            subjectId: string;
            difficulty: string;
            examStatus: string;
            authorId: string;
            validatorId: string | null;
            observations: string | null;
            questionCount: number;
            topicProportion: Record<string, number> | null;
            topicCoverage: Record<string, unknown> | null;
            validatedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };

        return examReadSchema.parse({
            ...plain,
            topicProportion: plain.topicProportion ?? {},
            topicCoverage: plain.topicCoverage ?? {},
            validatedAt: plain.validatedAt ?? null,
        });
    },

    toCreateAttrs(dto: ExamCreate): Record<string, unknown> {
        const safe = examCreateSchema.parse(dto);
        return {
            title: safe.title,
            subjectId: safe.subjectId,
            difficulty: safe.difficulty,
            examStatus: safe.examStatus,
            authorId: safe.authorId,
            validatorId: safe.validatorId ?? null,
            observations: safe.observations ?? null,
            questionCount: safe.questionCount,
            topicProportion: safe.topicProportion ?? {},
            topicCoverage: safe.topicCoverage ?? {},
        };
    },

    toUpdateAttrs(dto: ExamUpdate): Record<string, unknown> {
        const safe = examUpdateSchema.parse(dto);
        const attrs: Record<string, unknown> = {};
        if (safe.title !== undefined) attrs.title = safe.title;
        if (safe.observations !== undefined) attrs.observations = safe.observations;
        if (safe.examStatus !== undefined) attrs.examStatus = safe.examStatus;
        if (safe.validatorId !== undefined) attrs.validatorId = safe.validatorId;
        if (safe.topicProportion !== undefined) attrs.topicProportion = safe.topicProportion;
        if (safe.topicCoverage !== undefined) attrs.topicCoverage = safe.topicCoverage;
        if (safe.questionCount !== undefined) attrs.questionCount = safe.questionCount;
        if (safe.difficulty !== undefined) attrs.difficulty = safe.difficulty;
        if (safe.validatedAt !== undefined) attrs.validatedAt = safe.validatedAt;
        return attrs;
    },

    toWhereFromFilters(filters?: ExamFilters): WhereOptions<Attributes<Exam>> {
        const where: WhereOptions<Attributes<Exam>> = {};
        if (!filters) return where;

        if (filters.subjectId) where.subjectId = filters.subjectId;
        else if (filters.subjectIds && filters.subjectIds.length > 0) {
            where.subjectId = { [Op.in]: filters.subjectIds };
        }
        if (filters.difficulty) where.difficulty = filters.difficulty;
        if (filters.examStatus) where.examStatus = filters.examStatus;
        if (filters.authorId) where.authorId = filters.authorId;
        if (filters.validatorId) where.validatorId = filters.validatorId;
        if (filters.title) {
            where.title = { [Op.like]: `%${filters.title}%` } as never;
        }
        return where;
    },

    toOptions(criteria: ListExamsCriteria): {
        where: WhereOptions;
        order: OrderItem[];
        limit: number;
        offset: number;
    } {
        const where = this.toWhereFromFilters(criteria.filters);
        const limit = criteria.limit ?? 20;
        const offset = criteria.offset ?? 0;
        const order: OrderItem[] = [];
        if (criteria.sort) {
            const dir = (criteria.sort.dir ?? 'DESC').toUpperCase() as 'ASC' | 'DESC';
            order.push([criteria.sort.field, dir]);
        } else {
            order.push(['createdAt', 'DESC']);
        }
        return { where, order, limit, offset };
    },
};
