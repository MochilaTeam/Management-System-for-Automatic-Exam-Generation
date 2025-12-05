import { z } from 'zod';

import { StudentExamAssignmentItem } from './examAssignmentSchema';
import { ExamRegradesStatus } from '../entities/enums/ExamRegradeStatus';

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

export const requestExamRegradeCommandSchema = requestExamRegradeBodySchema.extend({
    currentUserId: z.string().uuid(),
});

export type RequestExamRegradeCommandSchema = z.infer<typeof requestExamRegradeCommandSchema>;

export const listPendingExamRegradesQuerySchema = z
    .object({
        currentUserId: z.string().uuid(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
    })
    .strict();

export type ListPendingExamRegradesQuery = z.infer<typeof listPendingExamRegradesQuerySchema>;

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

export type PendingExamRegradeItem = StudentExamAssignmentItem & {
    regradeId: string;
    reason: string | null;
    requestedAt: Date;
    regradeStatus: ExamRegradesStatus;
};
