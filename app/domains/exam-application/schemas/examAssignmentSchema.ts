import { z } from 'zod';

import { AssignedExamStatus } from '../entities/enum/AssignedExamStatus';

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

// ===== Query for listing student exams =====
export const listStudentExamsQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
        status: z.nativeEnum(AssignedExamStatus).optional(),
        subjectId: z.string().uuid().optional(),
    })
    .strict();

export type ListStudentExamsQuery = z.infer<typeof listStudentExamsQuerySchema>;
