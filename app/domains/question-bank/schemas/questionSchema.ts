import { z } from 'zod';

import { DifficultyLevelEnum } from '../entities/enums/DifficultyLevels';
import { QuestionTypeEnum } from '../entities/enums/QuestionType';

// ===== Params =====
export const questionIdParamsSchema = z
    .object({
        questionId: z.string().uuid(),
    })
    .strict();

export type QuestionIdParams = z.infer<typeof questionIdParamsSchema>;

// ===== Read model (detalle de pregunta) =====
export const questionDetailSchema = z
    .object({
        questionId: z.string().uuid(),
        authorId: z.string().uuid(),
        questionTypeId: z.string().uuid(),
        questionTypeName: z.nativeEnum(QuestionTypeEnum).optional(),
        subtopicId: z.string().uuid(),
        difficulty: z.nativeEnum(DifficultyLevelEnum),
        body: z.string(),
        options: z
            .array(
                z
                    .object({
                        text: z.string(),
                        isCorrect: z.boolean(),
                    })
                    .strict(),
            )
            .nullable(),
        response: z.string().nullable(),
        active: z.boolean(),
        createdAt: z.date(),
        updatedAt: z.date(),
    })
    .strict();

export type QuestionDetail = z.infer<typeof questionDetailSchema>;

// ===== Body (entrada HTTP) =====

const optionSchema = z
    .object({
        text: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1)),
        isCorrect: z.boolean(),
    })
    .strict();

export const createQuestionBodySchema = z
    .object({
        questionTypeId: z.string().uuid(),
        subtopicId: z.string().uuid(),
        difficulty: z.nativeEnum(DifficultyLevelEnum),
        body: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(5)),
        options: z.array(optionSchema).nullable(),
        response: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .nullable(),
    })
    .strict();

export type CreateQuestionBody = z.infer<typeof createQuestionBodySchema>;

export const updateQuestionBodySchema = z
    .object({
        questionTypeId: z.string().uuid().optional(),
        subtopicId: z.string().uuid().optional(),
        difficulty: z.nativeEnum(DifficultyLevelEnum).optional(),
        body: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(5))
            .optional(),
        options: z.array(optionSchema).nullable().optional(),
        response: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .nullable()
            .optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

export type UpdateQuestionBody = z.infer<typeof updateQuestionBodySchema>;

// ===== List query =====

export const listQuestionsQuerySchema = z
    .object({
        q: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .optional(),
        subtopicId: z.string().uuid().optional(),
        authorId: z.string().uuid().optional(),
        difficulty: z.nativeEnum(DifficultyLevelEnum).optional(),
        questionTypeId: z.string().uuid().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).default(0),
    })
    .strict();

export type ListQuestions = z.infer<typeof listQuestionsQuerySchema>;

// ===== DTOs hacia repos =====

export const questionCreateSchema = z
    .object({
        authorId: z.string().uuid(),
        questionTypeId: z.string().uuid(),
        subTopicId: z.string().uuid(),
        difficulty: z.nativeEnum(DifficultyLevelEnum),
        body: z.string().min(5),
        options: z.array(optionSchema).nullable(),
        response: z.string().nullable(),
    })
    .strict();

export const questionUpdateSchema = z
    .object({
        questionTypeId: z.string().uuid().optional(),
        subTopicId: z.string().uuid().optional(),
        difficulty: z.nativeEnum(DifficultyLevelEnum).optional(),
        body: z.string().min(5).optional(),
        options: z.array(optionSchema).nullable().optional(),
        response: z.string().nullable().optional(),
        active: z.boolean().optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

export type QuestionCreate = z.infer<typeof questionCreateSchema>;
export type QuestionUpdate = z.infer<typeof questionUpdateSchema>;
