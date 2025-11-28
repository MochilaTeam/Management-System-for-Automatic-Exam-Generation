import { z } from 'zod';

// ===== Body for creating/updating exam response =====
export const examResponseSchema = z
    .object({
        examQuestionId: z.string().uuid(),
        selectedOptionId: z.string().uuid().nullable().optional(), //TODO: cambiar selected options para que sea un array como el de Question
        textAnswer: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .nullable()
            .optional(),
    })
    .strict();

export type ExamResponseBody = z.infer<typeof examResponseSchema>;

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
        examQuestionId: z.string().uuid(),
        studentId: z.string().uuid(),
        selectedOptionId: z.string().uuid().nullable(),
        textAnswer: z.string().nullable(),
        autoPoints: z.number(),
        manualPoints: z.number().nullable(),
        answeredAt: z.date(),
    })
    .strict();

export type ExamResponseOutput = z.infer<typeof examResponseOutputSchema>;
