import { z } from 'zod';

// ===== Params =====
export const examIdParamsSchema = z
    .object({
        examId: z.string().uuid(),
    })
    .strict();

export type ExamIdParams = z.infer<typeof examIdParamsSchema>;

// ===== Body for assigning exam to course =====
export const assignExamToCourseBodySchema = z
    .object({
        courseId: z.string().uuid(),
        applicationDate: z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
        durationMinutes: z.number().int().min(1).max(480), // Máximo 8 horas
    })
    .strict();

export type AssignExamToCourseBody = z.infer<typeof assignExamToCourseBodySchema>;
