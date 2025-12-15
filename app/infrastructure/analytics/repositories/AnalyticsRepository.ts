import type { Order, WhereLeftOperand } from 'sequelize';
import { Op, QueryTypes } from 'sequelize';

import { sequelize } from '../../../database/database';
import {
    AutomaticExamFilter,
    ExamComparisonFilter,
    ExamDifficultyRecord,
    ExamTopicRecord,
    IAnalyticsRepository,
    PopularQuestionsFilter,
    ReviewerActivityFilter,
    SubjectDifficultyFilter,
    ValidatedExamsFilter,
} from '../../../domains/analytics/domain/ports/IAnalyticsRepository';
import { AutomaticExamSortByEnum } from '../../../domains/analytics/entities/enums/AutomaticExamSortByEnum';
import { ExamComparisonSortByEnum } from '../../../domains/analytics/entities/enums/ExamComparisonSortByEnum';
import { PopularQuestionSortByEnum } from '../../../domains/analytics/entities/enums/PopularQuestionSortByEnum';
import { ReviewerActivitySortByEnum } from '../../../domains/analytics/entities/enums/ReviewerActivitySortByEnum';
import { ValidatedExamSortByEnum } from '../../../domains/analytics/entities/enums/ValidatedExamSortByEnum';
import { ExamStatusEnum } from '../../../domains/exam-application/entities/enums/ExamStatusEnum';
import { DifficultyLevelEnum } from '../../../domains/question-bank/entities/enums/DifficultyLevels';
import Exam from '../../exam-generation/models/Exam';
import Subject from '../../question-bank/models/Subject';
import { Teacher, User } from '../../user/models';

const FINALIZED_EXAM_STATUSES = [ExamStatusEnum.PUBLISHED];

type PopularQuestionRowRecord = {
    questionId: string;
    questionBody: string | null;
    difficulty: DifficultyLevelEnum | string;
    topicId: string | null;
    topicName: string | null;
    usageCount: number | string;
};

type ExamPerformanceRowRecord = {
    examQuestionId: string;
    questionId: string;
    questionIndex: number | string;
    questionScore: number | string;
    difficulty: DifficultyLevelEnum | string;
    topicId: string | null;
    topicName: string | null;
    averageScore: number | string;
    successRate: number | string;
    attempts: number | string;
    questionBody: string | null;
};

type SubjectDifficultyRowRecord = {
    subjectId: string;
    subjectName: string | null;
    difficulty: DifficultyLevelEnum | string;
    averageGrade: number | null;
    examCount: number | string;
};

type TopFailingQuestionRowRecord = {
    questionId: string;
    questionBody: string | null;
    topicId: string | null;
    topicName: string | null;
    subjectId: string | null;
    subjectName: string | null;
    authorId: string | null;
    authorName: string | null;
    failureRate: number | string;
};

type ReviewerActivityRowRecord = {
    reviewerId: string;
    reviewerName: string | null;
    subjectId: string;
    subjectName: string | null;
    reviewedExams: number | string;
};

type RegradeComparisonRowRecord = {
    subjectId: string;
    subjectName: string | null;
    course: string;
    regradeAverage: number | null;
    courseAverage: number | null;
    requests: number | string;
};

type ExamDifficultyRecordRow = {
    examId: string;
    difficulty: DifficultyLevelEnum | string;
    count: number | string;
};

type ExamTopicRecordRow = {
    examId: string;
    topicId: string | null;
    topicName: string | null;
    count: number | string;
};

type ExamTypeCountRow = {
    examId: string;
    questionType: string | null;
    count: number | string;
};

type ExamTopicCoverageRow = {
    examId: string;
    topicName: string | null;
    count: number | string;
};

export class AnalyticsRepository implements IAnalyticsRepository {
    async fetchAutomaticExams(filter: AutomaticExamFilter) {
        const modeCondition = sequelize.where(
            sequelize.json('topicCoverage.mode') as unknown as WhereLeftOperand,
            'automatic',
        );
        const where: Record<string, unknown> = { [Op.and]: [modeCondition] };
        if (filter.subjectId) where.subjectId = filter.subjectId;

        const order = this.buildAutomaticExamOrder(filter);
        const paginationOptions =
            filter.exportAll === true ? {} : { limit: filter.limit, offset: filter.offset };

        const { rows, count } = await Exam.findAndCountAll({
            where,
            include: [
                {
                    model: Teacher,
                    as: 'author',
                    attributes: ['id', 'userId'],
                    include: [{ model: User, as: 'user', attributes: ['name'] }],
                },
                { model: Subject, as: 'subject', attributes: ['id', 'name'] },
            ],
            order: order as Order,
            ...paginationOptions,
            attributes: ['id', 'title', 'subjectId', 'authorId', 'topicCoverage', 'createdAt'],
        });

        const examIds = rows.map((exam) => exam.id);
        const [typeCounts, topicCoverages] = await Promise.all([
            this.fetchExamQuestionTypeCounts(examIds),
            this.fetchExamTopicCoverage(examIds),
        ]);

        const typeCountMap = new Map<string, ExamTypeCountRow[]>();
        typeCounts.forEach((row) => {
            if (!typeCountMap.has(row.examId)) typeCountMap.set(row.examId, []);
            typeCountMap.get(row.examId)!.push(row);
        });

        const topicCoverageMap = new Map<string, ExamTopicCoverageRow[]>();
        topicCoverages.forEach((row) => {
            if (!topicCoverageMap.has(row.examId)) topicCoverageMap.set(row.examId, []);
            topicCoverageMap.get(row.examId)!.push(row);
        });

        const items = rows.map((exam) => ({
            examId: exam.id,
            title: exam.title,
            subjectId: exam.subjectId,
            subjectName: exam.subject?.name ?? null,
            creatorId: exam.authorId,
            creatorName: exam.author?.user?.name ?? null,
            createdAt: exam.createdAt,
            parameters: this.buildAutomaticParameters(
                exam.id,
                typeCountMap.get(exam.id) ?? [],
                topicCoverageMap.get(exam.id) ?? [],
            ),
        }));

        return { items, total: count };
    }

    async fetchPopularQuestions(filter: PopularQuestionsFilter) {
        const direction = this.getSortDirection(filter.sortOrder);
        const column = this.mapPopularSort(filter.sortBy);
        const baseQuery = `
            SELECT
                q.id AS questionId,
                q.body AS questionBody,
                q.difficulty,
                t.id AS topicId,
                t.title AS topicName,
                COUNT(eq.id) AS usageCount
            FROM ExamQuestions eq
            JOIN Exams e ON eq.examId = e.id
            JOIN Questions q ON eq.questionId = q.id
            LEFT JOIN Subtopics st ON q.subTopicId = st.id
            LEFT JOIN Topics t ON st.topicId = t.id
            WHERE e.subjectId = :subjectId
              AND e.examStatus IN (:statuses)
            GROUP BY q.id, q.body, q.difficulty, t.id, t.title
            ORDER BY ${column} ${direction}
        `;
        const paginationClause = filter.exportAll ? '' : ' LIMIT :limit OFFSET :offset';

        const rows = await sequelize.query<PopularQuestionRowRecord>(baseQuery + paginationClause, {
            type: QueryTypes.SELECT,
            replacements: {
                subjectId: filter.subjectId,
                statuses: FINALIZED_EXAM_STATUSES,
                limit: filter.limit,
                offset: filter.offset,
            },
        });

        const totalQuery = `
            SELECT COUNT(DISTINCT q.id) AS total
            FROM ExamQuestions eq
            JOIN Exams e ON eq.examId = e.id
            JOIN Questions q ON eq.questionId = q.id
            WHERE e.subjectId = :subjectId
              AND e.examStatus IN (:statuses)
        `;

        const totalResult = await sequelize.query<{ total: number }>(totalQuery, {
            type: QueryTypes.SELECT,
            replacements: { subjectId: filter.subjectId, statuses: FINALIZED_EXAM_STATUSES },
        });

        const items = rows.map((row) => ({
            questionId: String(row.questionId),
            questionBody: row.questionBody ?? null,
            difficulty: row.difficulty as DifficultyLevelEnum,
            topicId: row.topicId,
            topicName: row.topicName,
            usageCount: Number(row.usageCount ?? 0),
        }));

        return { items, total: Number(totalResult[0]?.total ?? 0) };
    }

    async fetchValidatedExams(filter: ValidatedExamsFilter) {
        const where: Record<string, unknown> = {
            validatorId: filter.reviewerId,
            validatedAt: { [Op.ne]: null },
        };
        if (filter.subjectId) where.subjectId = filter.subjectId;

        const direction = this.getSortDirection(filter.sortOrder);
        const order =
            filter.sortBy === ValidatedExamSortByEnum.SUBJECT_NAME
                ? [[{ model: Subject, as: 'subject' }, 'name', direction]]
                : [['validatedAt', direction]];

        const paginationOptions =
            filter.exportAll === true ? {} : { limit: filter.limit, offset: filter.offset };

        const { rows, count } = await Exam.findAndCountAll({
            where,
            include: [{ model: Subject, as: 'subject', attributes: ['name'] }],
            order: order as Order,
            ...paginationOptions,
            attributes: ['id', 'title', 'subjectId', 'validatedAt', 'observations', 'validatorId'],
        });

        const items = rows.map((exam) => ({
            examId: exam.id,
            title: exam.title,
            subjectId: exam.subjectId,
            subjectName: exam.subject?.name ?? null,
            validatedAt: exam.validatedAt,
            observations: exam.observations,
            validatorId: exam.validatorId,
        }));

        return { items, total: count };
    }

    async fetchExamPerformance(examId: string) {
        const query = `
            SELECT
                eq.id AS examQuestionId,
                eq.questionId,
                eq.questionIndex,
                eq.questionScore,
                q.difficulty,
                q.body AS questionBody,
                t.id AS topicId,
                t.title AS topicName,
                COUNT(er.id) AS attempts,
                AVG(
                    LEAST(
                        GREATEST(COALESCE(er.manualPoints, er.autoPoints, 0), 0),
                        eq.questionScore
                    )
                ) AS averageScore
            FROM ExamQuestions eq
            LEFT JOIN ExamResponses er ON er.examQuestionId = eq.id
            JOIN Questions q ON eq.questionId = q.id
            LEFT JOIN Subtopics st ON q.subTopicId = st.id
            LEFT JOIN Topics t ON st.topicId = t.id
            WHERE eq.examId = :examId
            GROUP BY eq.id, q.difficulty, q.body, t.id, t.title
            ORDER BY eq.questionIndex ASC
        `;

        const rows = await sequelize.query<ExamPerformanceRowRecord>(query, {
            type: QueryTypes.SELECT,
            replacements: { examId },
        });

        return rows.map((row) => {
            const questionScore = Number(row.questionScore ?? 0);
            const averageScore = Number(row.averageScore ?? 0);
            return {
                examQuestionId: String(row.examQuestionId),
                questionId: String(row.questionId),
                questionIndex: Number(row.questionIndex),
                questionScore,
                difficulty: row.difficulty as DifficultyLevelEnum,
                topicId: row.topicId,
                topicName: row.topicName,
                averageScore,
                successRate: questionScore > 0 ? averageScore / questionScore : 0,
                attempts: Number(row.attempts ?? 0),
                questionBody: row.questionBody ?? null,
            };
        });
    }

    async fetchSubjectDifficultyRecords(filter: SubjectDifficultyFilter) {
        const direction = this.getSortDirection(filter.sortOrder);
        const whereClause =
            filter.subjectIds && filter.subjectIds.length > 0
                ? 'AND e.subjectId IN (:subjectIds)'
                : '';
        const query = `
            SELECT
                e.subjectId,
                s.name AS subjectName,
                e.difficulty,
                COUNT(DISTINCT e.id) AS examCount,
                AVG(ea.grade) AS averageGrade
            FROM ExamAssignments ea
            JOIN Exams e ON ea.examId = e.id
            JOIN Subjects s ON e.subjectId = s.id
            WHERE ea.grade IS NOT NULL
            ${whereClause}
            GROUP BY e.subjectId, s.name, e.difficulty
            ORDER BY s.name ${direction}
        `;

        const replacements: Record<string, unknown> = {};
        if (filter.subjectIds && filter.subjectIds.length > 0)
            replacements.subjectIds = filter.subjectIds;

        const rows = await sequelize.query<SubjectDifficultyRowRecord>(query, {
            type: QueryTypes.SELECT,
            replacements,
        });

        return rows.map((row) => ({
            subjectId: String(row.subjectId),
            subjectName: row.subjectName ?? null,
            difficulty: row.difficulty as DifficultyLevelEnum,
            averageGrade: row.averageGrade !== null ? Number(row.averageGrade) : null,
            examCount: Number(row.examCount ?? 0),
        }));
    }

    async fetchTopFailingQuestions(limit: number) {
        const query = `
            SELECT
                q.id AS questionId,
                q.body AS questionBody,
                q.authorId,
                u.name AS authorName,
                CASE
                    WHEN eq.questionScore > 0 THEN
                        1 - (AVG(COALESCE(er.manualPoints, er.autoPoints, 0)) / eq.questionScore)
                    ELSE 0
                END AS failureRate,
                e.subjectId,
                s.name AS subjectName,
                t.id AS topicId,
                t.title AS topicName
            FROM ExamResponses er
            JOIN ExamQuestions eq ON er.examQuestionId = eq.id
            JOIN Exams e ON er.examId = e.id
            LEFT JOIN Subjects s ON e.subjectId = s.id
            JOIN Questions q ON eq.questionId = q.id
            LEFT JOIN Subtopics st ON q.subTopicId = st.id
            LEFT JOIN Topics t ON st.topicId = t.id
            LEFT JOIN Teachers tch ON q.authorId = tch.id
            LEFT JOIN Users u ON tch.userId = u.id
            GROUP BY q.id, q.authorId, u.name, eq.questionScore, e.subjectId, s.name, t.id, t.title
            ORDER BY failureRate DESC
            LIMIT :limit
        `;

        const rows = await sequelize.query<TopFailingQuestionRowRecord>(query, {
            type: QueryTypes.SELECT,
            replacements: { limit },
        });

        return rows.map((row) => ({
            questionId: String(row.questionId),
            questionBody: row.questionBody ?? null,
            topicId: row.topicId,
            topicName: row.topicName,
            subjectId: row.subjectId,
            subjectName: row.subjectName ?? null,
            authorId: row.authorId,
            authorName: row.authorName ?? null,
            failureRate: Math.min(Math.max(Number(row.failureRate ?? 0), 0), 1),
        }));
    }

    async fetchRegradeComparison() {
        const regradeQuery = `
            SELECT
                e.subjectId,
                s.name AS subjectName,
                st.course,
                COUNT(*) AS requests,
                AVG(COALESCE(er.finalGrade, ea.grade)) AS regradeAverage
            FROM ExamRegrades er
            JOIN Exams e ON er.examId = e.id
            JOIN Students st ON er.studentId = st.id
            LEFT JOIN Subjects s ON e.subjectId = s.id
            LEFT JOIN ExamAssignments ea ON ea.examId = e.id AND ea.studentId = st.id
            GROUP BY e.subjectId, s.name, st.course
        `;

        const courseQuery = `
            SELECT
                e.subjectId,
                s.name AS subjectName,
                st.course,
                AVG(ea.grade) AS courseAverage
            FROM ExamAssignments ea
            JOIN Exams e ON ea.examId = e.id
            JOIN Students st ON ea.studentId = st.id
            LEFT JOIN Subjects s ON e.subjectId = s.id
            WHERE ea.grade IS NOT NULL
            GROUP BY e.subjectId, s.name, st.course
        `;

        const [regradeRows, courseRows] = await Promise.all([
            sequelize.query<RegradeComparisonRowRecord>(regradeQuery, { type: QueryTypes.SELECT }),
            sequelize.query<RegradeComparisonRowRecord>(courseQuery, { type: QueryTypes.SELECT }),
        ]);

        const courseMap = new Map<string, number | null>();
        courseRows.forEach((row) => {
            const key = `${row.subjectId}::${row.course}`;
            courseMap.set(key, row.courseAverage !== null ? Number(row.courseAverage) : null);
        });

        return regradeRows.map((row) => ({
            subjectId: String(row.subjectId),
            subjectName: row.subjectName ?? null,
            course: row.course,
            regradeAverage: row.regradeAverage !== null ? Number(row.regradeAverage) : null,
            courseAverage: courseMap.get(`${row.subjectId}::${row.course}`) ?? null,
            requests: Number(row.requests ?? 0),
        }));
    }

    async fetchExamComparisonBase(filter: ExamComparisonFilter) {
        const where: Record<string, unknown> = {};
        if (filter.subjectIds && filter.subjectIds.length > 0) {
            where.subjectId = filter.subjectIds;
        }

        const direction = this.getSortDirection(filter.sortOrder);
        const order = this.buildExamComparisonOrder(filter.sortBy, direction);

        const exams = await Exam.findAll({
            where,
            include: [{ model: Subject, as: 'subject', attributes: ['name'] }],
            order: order as Order,
            limit: filter.exportAll ? undefined : filter.limit,
            offset: filter.exportAll ? undefined : filter.offset,
            attributes: ['id', 'title', 'subjectId', 'createdAt'],
        });

        const total = await Exam.count({ where });

        const items = exams.map((exam) => ({
            examId: exam.id,
            title: exam.title,
            subjectId: exam.subjectId,
            subjectName: exam.subject?.name ?? null,
        }));

        return { exams: items, total };
    }

    async fetchExamDifficultyRecords(examIds: string[]): Promise<ExamDifficultyRecord[]> {
        if (!examIds.length) return [];
        const query = `
            SELECT
                eq.examId,
                q.difficulty,
                COUNT(*) AS count
            FROM ExamQuestions eq
            JOIN Questions q ON eq.questionId = q.id
            WHERE eq.examId IN (:examIds)
            GROUP BY eq.examId, q.difficulty
        `;
        const rows = await sequelize.query<ExamDifficultyRecordRow>(query, {
            type: QueryTypes.SELECT,
            replacements: { examIds },
        });

        return rows.map((row) => ({
            examId: String(row.examId),
            difficulty: row.difficulty as DifficultyLevelEnum,
            count: Number(row.count ?? 0),
        }));
    }

    async fetchExamTopicRecords(examIds: string[]): Promise<ExamTopicRecord[]> {
        if (!examIds.length) return [];
        const query = `
            SELECT
                eq.examId,
                t.id AS topicId,
                t.title AS topicName,
                COUNT(*) AS count
            FROM ExamQuestions eq
            JOIN Questions q ON eq.questionId = q.id
            LEFT JOIN Subtopics st ON q.subTopicId = st.id
            LEFT JOIN Topics t ON st.topicId = t.id
            WHERE eq.examId IN (:examIds)
            GROUP BY eq.examId, t.id, t.title
        `;
        const rows = await sequelize.query<ExamTopicRecordRow>(query, {
            type: QueryTypes.SELECT,
            replacements: { examIds },
        });

        return rows.map((row) => ({
            examId: row.examId,
            topicId: row.topicId,
            topicName: row.topicName,
            count: Number(row.count ?? 0),
        }));
    }

    async fetchReviewerActivity(filter: ReviewerActivityFilter) {
        const since = new Date();
        since.setMonth(since.getMonth() - 12);
        const direction = this.getSortDirection(filter.sortOrder);
        const orderClause = this.buildReviewerOrder(filter.sortBy, direction);

        const paginationClause = filter.exportAll ? '' : ' LIMIT :limit OFFSET :offset';
        const query = `
            SELECT
                e.validatorId AS reviewerId,
                e.subjectId,
                s.name AS subjectName,
                u.name AS reviewerName,
                COUNT(*) AS reviewedExams
            FROM Exams e
            LEFT JOIN Subjects s ON e.subjectId = s.id
            LEFT JOIN Teachers t ON e.validatorId = t.id
            LEFT JOIN Users u ON t.userId = u.id
            WHERE e.validatorId IS NOT NULL
              AND GREATEST(COALESCE(e.validatedAt, '1970-01-01'), e.updatedAt) >= :since
            GROUP BY e.validatorId, e.subjectId, s.name, u.name
            ORDER BY ${orderClause}
            ${paginationClause}
        `;

        const rows = await sequelize.query<ReviewerActivityRowRecord>(query, {
            type: QueryTypes.SELECT,
            replacements: { since, limit: filter.limit, offset: filter.offset },
        });

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM (
                SELECT 1
                FROM Exams e
                WHERE e.validatorId IS NOT NULL
                  AND GREATEST(COALESCE(e.validatedAt, '1970-01-01'), e.updatedAt) >= :since
                GROUP BY e.validatorId, e.subjectId
            ) AS aggregated
        `;

        const totalResult = await sequelize.query<{ total: number }>(countQuery, {
            type: QueryTypes.SELECT,
            replacements: { since },
        });

        const items = rows.map((row) => ({
            reviewerId: String(row.reviewerId),
            reviewerName: row.reviewerName ?? null,
            subjectId: row.subjectId,
            subjectName: row.subjectName ?? null,
            reviewedExams: Number(row.reviewedExams ?? 0),
        }));

        return { items, total: Number(totalResult[0]?.total ?? 0) };
    }

    private buildAutomaticExamOrder(filter: AutomaticExamFilter): Order {
        const direction = this.getSortDirection(filter.sortOrder);
        if (filter.sortBy === AutomaticExamSortByEnum.SUBJECT_NAME) {
            return [[{ model: Subject, as: 'subject' }, 'name', direction]] as Order;
        }
        if (filter.sortBy === AutomaticExamSortByEnum.CREATOR_NAME) {
            return [
                [{ model: Teacher, as: 'author' }, { model: User, as: 'user' }, 'name', direction],
            ] as Order;
        }
        return [['createdAt', direction]] as Order;
    }

    private mapPopularSort(sortBy: PopularQuestionSortByEnum) {
        if (sortBy === PopularQuestionSortByEnum.DIFFICULTY) return 'q.difficulty';
        if (sortBy === PopularQuestionSortByEnum.TOPIC_NAME) return 'topicName';
        return 'usageCount';
    }

    private buildExamComparisonOrder(
        sortBy: ExamComparisonSortByEnum,
        direction: 'ASC' | 'DESC',
    ): Order {
        if (sortBy === ExamComparisonSortByEnum.SUBJECT_NAME) {
            return [[{ model: Subject, as: 'subject' }, 'name', direction]] as Order;
        }
        if (sortBy === ExamComparisonSortByEnum.EXAM_TITLE) {
            return [['title', direction]] as Order;
        }
        return [['createdAt', direction]] as Order;
    }

    private buildReviewerOrder(sortBy: ReviewerActivitySortByEnum, direction: 'ASC' | 'DESC') {
        if (sortBy === ReviewerActivitySortByEnum.TEACHER_NAME) return `reviewerName ${direction}`;
        if (sortBy === ReviewerActivitySortByEnum.SUBJECT_NAME) return `subjectName ${direction}`;
        return `reviewedExams ${direction}`;
    }

    private async fetchExamQuestionTypeCounts(examIds: string[]) {
        if (!examIds.length) return [];
        const query = `
            SELECT
                eq.examId,
                COALESCE(qt.name, 'Desconocido') AS questionType,
                COUNT(*) AS count
            FROM ExamQuestions eq
            JOIN Questions q ON eq.questionId = q.id
            LEFT JOIN QuestionTypes qt ON q.questionTypeId = qt.id
            WHERE eq.examId IN (:examIds)
            GROUP BY eq.examId, questionType
        `;
        return sequelize.query<ExamTypeCountRow>(query, {
            type: QueryTypes.SELECT,
            replacements: { examIds },
        });
    }

    private async fetchExamTopicCoverage(examIds: string[]) {
        if (!examIds.length) return [];
        const query = `
            SELECT
                eq.examId,
                COALESCE(t.title, 'Sin tema') AS topicName,
                COUNT(*) AS count
            FROM ExamQuestions eq
            JOIN Questions q ON eq.questionId = q.id
            LEFT JOIN Subtopics st ON q.subTopicId = st.id
            LEFT JOIN Topics t ON st.topicId = t.id
            WHERE eq.examId IN (:examIds)
            GROUP BY eq.examId, topicName
        `;
        return sequelize.query<ExamTopicCoverageRow>(query, {
            type: QueryTypes.SELECT,
            replacements: { examIds },
        });
    }

    private buildAutomaticParameters(
        examId: string,
        typeCounts: ExamTypeCountRow[],
        topicCoverages: ExamTopicCoverageRow[],
    ): Record<string, unknown> {
        const totalQuestions = typeCounts.reduce((acc, row) => acc + Number(row.count ?? 0), 0);
        const topicProportion: Record<string, number> = {};
        typeCounts.forEach((row) => {
            const count = Number(row.count ?? 0);
            if (!totalQuestions || !row.questionType) return;
            topicProportion[row.questionType] = Number((count / totalQuestions).toFixed(4));
        });

        const topics = topicCoverages.map((row) => ({
            topicName: row.topicName ?? 'Sin tema',
            questionCount: Number(row.count ?? 0),
        }));

        return {
            examId,
            questionCount: totalQuestions,
            topicProportion,
            topicCoverage: { topics },
        };
    }

    private getSortDirection(order: string): 'ASC' | 'DESC' {
        return order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    }
}
