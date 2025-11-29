import { z } from 'zod';

export const createExamResponseCommandSchema = z
    .object({
        user_id: z.string().uuid(),
        examId: z.string().uuid(),
        examQuestionId: z.string().uuid(),
        selectedOptions: z
            .array(
                z.object({
                    text: z.string(),
                    isCorrect: z.boolean(),
                }),
            )
            .nullable()
            .optional(),
        textAnswer: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .nullable()
            .optional(),
    })
    .strict();

export type CreateExamResponseCommandSchema = z.infer<typeof createExamResponseCommandSchema>;

// ===== Params =====
export const responseIdParamsSchema = z
    .object({
        responseId: z.string().uuid(),
    })
    .strict();

export type ResponseIdParams = z.infer<typeof responseIdParamsSchema>;

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
