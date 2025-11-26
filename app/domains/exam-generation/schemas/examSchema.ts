import { z } from 'zod';

import { ExamStatusEnum } from '../../exam-application/entities/enums/ExamStatusEnum';
import { DifficultyLevelEnum } from '../../question-bank/entities/enums/DifficultyLevels';

const uuid = () => z.string().uuid();

export const examIdParamsSchema = z
    .object({
        examId: uuid(),
    })
    .strict();

export const examQuestionInputSchema = z
    .object({
        questionId: uuid(),
        questionIndex: z.number().int().min(1),
    })
    .strict();

export const examQuestionReadSchema = examQuestionInputSchema
    .extend({
        id: uuid(),
        examId: uuid(),
    })
    .strict();

export const questionTypeCountSchema = z
    .array(
        z
            .object({
                questionTypeId: uuid(),
                count: z.number().int().min(0),
            })
            .strict(),
    )
    .refine((items) => items.length > 0, {
        message: 'Debe definir al menos un tipo de pregunta.',
    });

const difficultyCountSchema = z
    .object({
        [DifficultyLevelEnum.EASY]: z.number().int().min(0),
        [DifficultyLevelEnum.MEDIUM]: z.number().int().min(0),
        [DifficultyLevelEnum.HARD]: z.number().int().min(0),
    })
    .strict();

export const examAutomaticFiltersSchema = z
    .object({
        topicIds: z.array(uuid()).min(1).optional(),
        subtopicIds: z.array(uuid()).min(1).optional(),
        excludeQuestionIds: z.array(uuid()).optional(),
    })
    .strict()
    .partial();

export const baseExamCommandSchema = z
    .object({
        title: z.string().min(3).max(255),
        subjectId: uuid(),
        difficulty: z.nativeEnum(DifficultyLevelEnum),
        authorId: uuid(),
        validatorId: uuid().optional().nullable(),
        observations: z.string().max(2000).optional().nullable(),
        questionCount: z.number().int().min(1),
        examStatus: z.nativeEnum(ExamStatusEnum).optional(),
    })
    .strict();

const manualExamBaseSchema = baseExamCommandSchema.omit({ questionCount: true, difficulty: true });

export const createManualExamCommandSchema = manualExamBaseSchema
    .extend({
        questions: z
            .array(examQuestionInputSchema)
            .min(1, { message: 'Debe adjuntar al menos una pregunta.' }),
    })
    .strict();

export const createAutomaticExamCommandSchema = baseExamCommandSchema
    .extend({
        questionTypeCounts: questionTypeCountSchema,
        difficultyCounts: difficultyCountSchema,
        filters: examAutomaticFiltersSchema.optional(),
        topicIds: z.array(uuid()).min(1).optional(),
        topicProportion: z.record(z.string(), z.number().min(0)).optional(),
        topicCoverage: z.record(z.string(), z.any()).optional(),
    })
    .strict()
    .refine(
        (obj) =>
            obj.questionTypeCounts.reduce((acc, entry) => acc + entry.count, 0) ===
            obj.questionCount,
        {
            message: 'La suma de las cantidades por tipo debe coincidir con la cantidad total.',
            path: ['questionTypeCounts'],
        },
    )
    .refine(
        (obj) =>
            Object.values(obj.difficultyCounts).reduce((acc, n) => acc + n, 0) ===
            obj.questionCount,
        {
            message:
                'La suma de las cantidades por dificultad debe coincidir con la cantidad total.',
            path: ['difficultyCounts'],
        },
    );

const examPreviewOptionSchema = z
    .object({
        text: z.string(),
        isCorrect: z.boolean(),
    })
    .strict();

export const automaticExamPreviewQuestionSchema = examQuestionInputSchema
    .extend({
        body: z.string(),
        difficulty: z.nativeEnum(DifficultyLevelEnum),
        questionTypeId: uuid(),
        subTopicId: uuid().nullable(),
        topicId: uuid().nullable(),
        options: z.array(examPreviewOptionSchema).nullable(),
        response: z.string().nullable(),
    })
    .strict();

export const automaticExamPreviewSchema = z
    .object({
        title: z.string().min(3).max(255),
        subjectId: uuid(),
        difficulty: z.nativeEnum(DifficultyLevelEnum),
        examStatus: z.nativeEnum(ExamStatusEnum),
        authorId: uuid(),
        validatorId: uuid().nullable(),
        observations: z.string().nullable(),
        questionCount: z.number().int().min(1),
        topicProportion: z.record(z.string(), z.number().min(0)),
        topicCoverage: z.record(z.string(), z.any()),
        questions: z.array(automaticExamPreviewQuestionSchema),
    })
    .strict();

export const updateExamCommandSchema = z
    .object({
        title: z.string().min(3).max(255).optional(),
        observations: z.string().max(2000).nullable().optional(),
        examStatus: z.nativeEnum(ExamStatusEnum).optional(),
        validatorId: uuid().nullable().optional(),
        questions: z.array(examQuestionInputSchema).min(1).optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

export const listExamsQuerySchema = z
    .object({
        subjectId: uuid().optional(),
        difficulty: z.nativeEnum(DifficultyLevelEnum).optional(),
        examStatus: z.nativeEnum(ExamStatusEnum).optional(),
        authorId: uuid().optional(),
        title: z.string().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).default(0),
    })
    .strict();

export const examCreateSchema = z
    .object({
        title: z.string().min(3),
        subjectId: uuid(),
        difficulty: z.nativeEnum(DifficultyLevelEnum),
        examStatus: z.nativeEnum(ExamStatusEnum),
        authorId: uuid(),
        validatorId: uuid().nullable().optional(),
        observations: z.string().nullable().optional(),
        questionCount: z.number().int().min(1),
        topicProportion: z.record(z.string(), z.number().min(0)).default({}),
        topicCoverage: z.record(z.string(), z.any()).default({}),
    })
    .strict();

export const examUpdateSchema = z
    .object({
        title: z.string().min(3).optional(),
        observations: z.string().nullable().optional(),
        examStatus: z.nativeEnum(ExamStatusEnum).optional(),
        validatorId: uuid().nullable().optional(),
        topicProportion: z.record(z.string(), z.number().min(0)).optional(),
        topicCoverage: z.record(z.string(), z.any()).optional(),
        questionCount: z.number().int().min(1).optional(),
        difficulty: z.nativeEnum(DifficultyLevelEnum).optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

export const examReadSchema = z
    .object({
        id: uuid(),
        title: z.string(),
        subjectId: uuid(),
        difficulty: z.nativeEnum(DifficultyLevelEnum),
        examStatus: z.nativeEnum(ExamStatusEnum),
        authorId: uuid(),
        validatorId: uuid().nullable(),
        observations: z.string().nullable(),
        questionCount: z.number().int(),
        topicProportion: z.record(z.string(), z.number()),
        topicCoverage: z.record(z.string(), z.any()),
        validatedAt: z.date().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
    })
    .strict();

export const examDetailSchema = examReadSchema.extend({
    questions: z.array(examQuestionReadSchema),
});

export type ExamIdParams = z.infer<typeof examIdParamsSchema>;
export type ExamQuestionInput = z.infer<typeof examQuestionInputSchema>;
export type ExamQuestionRead = z.infer<typeof examQuestionReadSchema>;
export type QuestionTypeDistributionEntry = z.infer<typeof questionTypeCountSchema>[number];
export type ExamAutomaticFilters = z.infer<typeof examAutomaticFiltersSchema>;
export type DifficultyCountMap = z.infer<typeof difficultyCountSchema>;

export type CreateManualExamCommandSchema = z.infer<typeof createManualExamCommandSchema>;
export type CreateAutomaticExamCommandSchema = z.infer<typeof createAutomaticExamCommandSchema>;
export type UpdateExamCommandSchema = z.infer<typeof updateExamCommandSchema>;
export type AutomaticExamPreview = z.infer<typeof automaticExamPreviewSchema>;
export type AutomaticExamPreviewQuestion = z.infer<typeof automaticExamPreviewQuestionSchema>;

export type ListExamsQuerySchema = z.infer<typeof listExamsQuerySchema>;
export type ExamCreate = z.infer<typeof examCreateSchema>;
export type ExamUpdate = z.infer<typeof examUpdateSchema>;
export type ExamRead = z.infer<typeof examReadSchema>;
export type ExamDetailRead = z.infer<typeof examDetailSchema>;
