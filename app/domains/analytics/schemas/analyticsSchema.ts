import { z } from 'zod';

import { DifficultyLevelEnum } from '../../question-bank/entities/enums/DifficultyLevels';
import { AutomaticExamSortByEnum } from '../entities/enums/AutomaticExamSortByEnum';
import { ExamComparisonSortByEnum } from '../entities/enums/ExamComparisonSortByEnum';
import { PopularQuestionSortByEnum } from '../entities/enums/PopularQuestionSortByEnum';
import { ReportFormatEnum } from '../entities/enums/ReportFormatEnum';
import { ReviewerActivitySortByEnum } from '../entities/enums/ReviewerActivitySortByEnum';
import { SortDirectionEnum } from '../entities/enums/SortDirectionEnum';
import { SubjectDifficultySortByEnum } from '../entities/enums/SubjectDifficultySortByEnum';
import { ValidatedExamSortByEnum } from '../entities/enums/ValidatedExamSortByEnum';

const limitSchema = z.coerce.number().int().min(1).max(200);
const offsetSchema = z.coerce.number().int().min(0);
const formatSchema = z.nativeEnum(ReportFormatEnum);
const sortOrderSchema = z.nativeEnum(SortDirectionEnum);

const subjectIdsParamSchema = z
    .preprocess((value) => {
        if (!value) return undefined;
        if (Array.isArray(value)) return value;
        return String(value)
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }, z.array(z.string().uuid()).optional())
    .transform((value) => value ?? undefined);

const automaticExamReportSchemaBase = z.object({
    subjectId: z.string().uuid(),
    limit: limitSchema.default(20),
    offset: offsetSchema.default(0),
    sortBy: z.nativeEnum(AutomaticExamSortByEnum).default(AutomaticExamSortByEnum.CREATED_AT),
    sortOrder: sortOrderSchema.default(SortDirectionEnum.DESC),
});

export const automaticExamReportRequestSchema = automaticExamReportSchemaBase.extend({
    format: formatSchema.optional(),
});

export type AutomaticExamReportInput = z.infer<typeof automaticExamReportSchemaBase>;
export type AutomaticExamReportRequest = z.infer<typeof automaticExamReportRequestSchema>;

const popularQuestionsReportSchemaBase = z.object({
    subjectId: z.string().uuid(),
    limit: limitSchema.default(15),
    offset: offsetSchema.default(0),
    sortBy: z.nativeEnum(PopularQuestionSortByEnum).default(PopularQuestionSortByEnum.USAGE_COUNT),
    sortOrder: sortOrderSchema.default(SortDirectionEnum.DESC),
});

export const popularQuestionsReportRequestSchema = popularQuestionsReportSchemaBase.extend({
    format: formatSchema.optional(),
});

export type PopularQuestionsReportInput = z.infer<typeof popularQuestionsReportSchemaBase>;
export type PopularQuestionsReportRequest = z.infer<typeof popularQuestionsReportRequestSchema>;

const validatedExamsReportSchemaBase = z.object({
    reviewerId: z.string().uuid(),
    subjectId: z.string().uuid().optional(),
    limit: limitSchema.default(20),
    offset: offsetSchema.default(0),
    sortBy: z.nativeEnum(ValidatedExamSortByEnum).default(ValidatedExamSortByEnum.VALIDATED_AT),
    sortOrder: sortOrderSchema.default(SortDirectionEnum.DESC),
});

export const validatedExamsReportRequestSchema = validatedExamsReportSchemaBase.extend({
    format: formatSchema.optional(),
});

export type ValidatedExamsReportInput = z.infer<typeof validatedExamsReportSchemaBase>;
export type ValidatedExamsReportRequest = z.infer<typeof validatedExamsReportRequestSchema>;

export const examPerformanceParamsSchema = z.object({
    examId: z.string().uuid(),
});

export const examPerformanceRequestSchema = z.object({
    format: formatSchema.optional(),
});

export type ExamPerformanceParams = z.infer<typeof examPerformanceParamsSchema>;
export type ExamPerformanceRequest = z.infer<typeof examPerformanceRequestSchema>;

const subjectDifficultyReportSchemaBase = z.object({
    subjectIds: subjectIdsParamSchema,
    limit: limitSchema.default(20),
    offset: offsetSchema.default(0),
    sortBy: z
        .nativeEnum(SubjectDifficultySortByEnum)
        .default(SubjectDifficultySortByEnum.SUBJECT_NAME),
    sortOrder: sortOrderSchema.default(SortDirectionEnum.ASC),
});

export const subjectDifficultyReportRequestSchema = subjectDifficultyReportSchemaBase.extend({
    format: formatSchema.optional(),
});

export type SubjectDifficultyReportInput = z.infer<typeof subjectDifficultyReportSchemaBase>;
export type SubjectDifficultyReportRequest = z.infer<typeof subjectDifficultyReportRequestSchema>;

const examComparisonReportSchemaBase = z.object({
    subjectIds: subjectIdsParamSchema,
    limit: limitSchema.default(20),
    offset: offsetSchema.default(0),
    sortBy: z.nativeEnum(ExamComparisonSortByEnum).default(ExamComparisonSortByEnum.CREATED_AT),
    sortOrder: sortOrderSchema.default(SortDirectionEnum.DESC),
    balanceThreshold: z.coerce.number().min(0).max(1).default(0.2),
});

export const examComparisonReportRequestSchema = examComparisonReportSchemaBase.extend({
    format: formatSchema.optional(),
});

export type ExamComparisonReportInput = z.infer<typeof examComparisonReportSchemaBase>;
export type ExamComparisonReportRequest = z.infer<typeof examComparisonReportRequestSchema>;

const reviewerActivityReportSchemaBase = z.object({
    limit: limitSchema.default(20),
    offset: offsetSchema.default(0),
    sortBy: z
        .nativeEnum(ReviewerActivitySortByEnum)
        .default(ReviewerActivitySortByEnum.REVIEWED_EXAMS),
    sortOrder: sortOrderSchema.default(SortDirectionEnum.DESC),
});

export const reviewerActivityReportRequestSchema = reviewerActivityReportSchemaBase.extend({
    format: formatSchema.optional(),
});

export type ReviewerActivityReportInput = z.infer<typeof reviewerActivityReportSchemaBase>;
export type ReviewerActivityReportRequest = z.infer<typeof reviewerActivityReportRequestSchema>;

export type AutomaticExamReportRow = {
    examId: string;
    title: string;
    subjectId: string;
    subjectName: string | null;
    creatorId: string;
    creatorName: string | null;
    createdAt: Date;
    parameters: Record<string, unknown> | null;
};

export type PopularQuestionsReportRow = {
    questionId: string;
    questionBody: string | null;
    difficulty: DifficultyLevelEnum;
    topicId: string | null;
    topicName: string | null;
    usageCount: number;
};

export type ValidatedExamReportRow = {
    examId: string;
    title: string;
    subjectId: string;
    subjectName: string | null;
    validatedAt: Date | null;
    observations: string | null;
    validatorId: string;
};

export type ExamPerformanceRow = {
    examQuestionId: string;
    questionId: string;
    questionIndex: number;
    questionScore: number;
    difficulty: DifficultyLevelEnum;
    topicId: string | null;
    topicName: string | null;
    averageScore: number;
    successRate: number;
    attempts: number;
    questionBody: string | null;
};

export type ExamPerformanceReport = {
    examId: string;
    questions: ExamPerformanceRow[];
    overallSuccessRate: number;
    difficultyGroups: {
        difficulty: DifficultyLevelEnum;
        successRate: number;
        questionCount: number;
    }[];
};

export type SubjectDifficultyDetail = {
    difficulty: DifficultyLevelEnum;
    averageGrade: number | null;
    examCount: number;
};

export type SubjectDifficultyCorrelationRow = {
    subjectId: string;
    subjectName: string | null;
    correlationScore: number;
    difficultyDetails: SubjectDifficultyDetail[];
};

export type TopFailingQuestionRow = {
    questionId: string;
    topicId: string | null;
    topicName: string | null;
    subjectId: string | null;
    subjectName: string | null;
    authorId: string | null;
    authorName: string | null;
    failureRate: number;
};

export type RegradeComparisonRow = {
    subjectId: string;
    subjectName: string | null;
    course: string;
    regradeAverage: number | null;
    courseAverage: number | null;
    requests: number;
};

export type SubjectDifficultyReport = {
    subjectCorrelations: SubjectDifficultyCorrelationRow[];
    topFailingQuestions: TopFailingQuestionRow[];
    regradeComparison: RegradeComparisonRow[];
};

export type ExamComparisonTopicDistribution = {
    topicId: string | null;
    topicName: string | null;
    questionCount: number;
};

export type ExamComparisonRow = {
    examId: string;
    title: string;
    subjectId: string;
    subjectName: string | null;
    difficultyDistribution: Record<DifficultyLevelEnum, number>;
    totalQuestions: number;
    topicDistribution: ExamComparisonTopicDistribution[];
    balanceGap: number;
    balanced: boolean;
};

export type ReviewerActivityRow = {
    reviewerId: string;
    reviewerName: string | null;
    subjectId: string;
    subjectName: string | null;
    reviewedExams: number;
};
