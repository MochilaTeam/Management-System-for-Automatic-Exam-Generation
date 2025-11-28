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

// ===== Responses =====

export const assignExamToCourseResponseSchema = z
    .object({
        examId: z.string().uuid(),
        courseId: z.string().uuid(),
        assignmentsCreated: z.number().int().min(0),
        applicationDate: z.date(),
        durationMinutes: z.number().int().min(1),
        examStatus: z.enum(['published']),
    })
    .strict();

export type AssignExamToCourseResponse = z.infer<typeof assignExamToCourseResponseSchema>;

export const studentExamAssignmentItemSchema = z
    .object({
        id: z.string().uuid(),
        examId: z.string().uuid(),
        subjectId: z.string().uuid(),
        subjectName: z.string(),
        teacherId: z.string().uuid(),
        teacherName: z.string(),
        status: z.nativeEnum(AssignedExamStatus),
        applicationDate: z.date(),
        durationMinutes: z.number().int().min(1),
    })
    .strict();

export type StudentExamAssignmentItem = z.infer<typeof studentExamAssignmentItemSchema>;
