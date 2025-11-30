import { z } from 'zod';

const optionSchema = z
    .object({
        text: z.string(),
        isCorrect: z.boolean(),
    })
    .strict();

const responsePayloadSchema = z
    .object({
        selectedOptions: z.array(optionSchema).nullable().optional(),
        textAnswer: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .nullable()
            .optional(),
    })
    .strict();

export const createExamResponseCommandSchema = responsePayloadSchema
    .extend({
        user_id: z.string().uuid(),
        examId: z.string().uuid(),
        examQuestionId: z.string().uuid(),
    })
    .strict();

export type CreateExamResponseCommandSchema = z.infer<typeof createExamResponseCommandSchema>;

export const updateExamResponseCommandSchema = responsePayloadSchema
    .extend({
        user_id: z.string().uuid(),
        responseId: z.string().uuid(),
    })
    .strict();

export type UpdateExamResponseCommandSchema = z.infer<typeof updateExamResponseCommandSchema>;

// ===== Params =====
export const responseIdParamsSchema = z
    .object({
        responseId: z.string().uuid(),
    })
    .strict();

export type ResponseIdParams = z.infer<typeof responseIdParamsSchema>;

export const examResponseByIndexParamsSchema = z
    .object({
        examId: z.string().uuid(),
        questionIndex: z.coerce.number().int().min(1),
    })
    .strict();

export type ExamResponseByIndexParams = z.infer<typeof examResponseByIndexParamsSchema>;

export const getExamResponseByIndexQuerySchema = examResponseByIndexParamsSchema
    .extend({
        user_id: z.string().uuid(),
    })
    .strict();

export type GetExamResponseByIndexQuerySchema = z.infer<
    typeof getExamResponseByIndexQuerySchema
>;

// ===== Response Schemas (Zod) =====
export const examResponseOutputSchema = z
    .object({
        id: z.string().uuid(),
        examId: z.string().uuid(),
        examQuestionId: z.string().uuid(),
        studentId: z.string().uuid(),
        selectedOptions: z
            .array(
                z.object({
                    text: z.string(),
                    isCorrect: z.boolean(),
                }),
            )
            .nullable(),
        textAnswer: z.string().nullable(),
        autoPoints: z.number().nullable(),
        manualPoints: z.number().nullable(),
        answeredAt: z.date(),
    })
    .strict();

export type ExamResponseOutput = z.infer<typeof examResponseOutputSchema>;
