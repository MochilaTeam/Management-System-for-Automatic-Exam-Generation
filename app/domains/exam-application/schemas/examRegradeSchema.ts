import { z } from 'zod';

import { ExamRegradesStatus } from '../../../infrastructure/exam-application/enums/ExamRegradeStatus';

// ===== Body for requesting exam regrade =====
export const requestExamRegradeBodySchema = z
    .object({
        examId: z.string().uuid(),
        professorId: z.string().uuid(),
        reason: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(10))
            .optional()
            .nullable(),
    })
    .strict();

export type RequestExamRegradeBody = z.infer<typeof requestExamRegradeBodySchema>;

// ===== Params =====
export const regradeIdParamsSchema = z
    .object({
        regradeId: z.string().uuid(),
    })
    .strict();

export type RegradeIdParams = z.infer<typeof regradeIdParamsSchema>;

// ===== Response Schemas (Zod) =====
export const examRegradeOutputSchema = z
    .object({
        id: z.string().uuid(),
        studentId: z.string().uuid(),
        examId: z.string().uuid(),
        professorId: z.string().uuid(),
        reason: z.string().nullable(),
        status: z.nativeEnum(ExamRegradesStatus),
        requestedAt: z.date(),
        resolvedAt: z.date().nullable(),
        finalGrade: z.number().nullable(),
    })
    .strict();

export type ExamRegradeOutput = z.infer<typeof examRegradeOutputSchema>;
